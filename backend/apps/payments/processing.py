"""
Lógica de negócio do ciclo de vida do pagamento, compartilhada entre o webhook do
Stripe, o endpoint de confirmação autoritativa e a simulação de PIX.

Mantida fora de views.py/services.py para ser idempotente, testável e livre de
dependências de request HTTP.
"""
from django.db import transaction
from django.utils import timezone

from apps.orders.models import Order, OrderStatus
from .models import CommissionEntry, Payment, PaymentStatus, Payout, PayoutStatus


@transaction.atomic
def process_successful_payment(order: Order, raw_response: dict | None = None, charge_id: str = "") -> bool:
    """
    Confirma um pedido pago: marca Payment/Order/SubOrders como confirmados, registra
    comissões, executa o split (Connect destination ou separate transfers) e cria os
    Payouts. Idempotente — chamadas repetidas para um pedido já confirmado são no-op.

    Retorna True se processou agora, False se já estava confirmado.
    """
    # Bloqueia a linha do pedido para evitar corrida entre webhook e confirmação manual
    order = Order.objects.select_for_update().get(id=order.id)
    if order.status == OrderStatus.CONFIRMED:
        return False

    raw_response = raw_response or {}

    # 1. Pagamento
    payment = Payment.objects.filter(order=order).first()
    if payment:
        payment.status = PaymentStatus.APPROVED
        payment.paid_at = timezone.now()
        if charge_id:
            payment.stripe_charge_id = charge_id
        if raw_response:
            payment.raw_response = raw_response
        payment.save(update_fields=["status", "paid_at", "stripe_charge_id", "raw_response", "updated_at"])

    # 2. Order + SubOrders → confirmados; registra comissão da plataforma
    order.status = OrderStatus.CONFIRMED
    order.save(update_fields=["status", "updated_at"])

    for sub_order in order.sub_orders.all():
        sub_order.status = OrderStatus.CONFIRMED
        sub_order.save(update_fields=["status", "updated_at"])

        if sub_order.seller and not hasattr(sub_order, "commission_entry"):
            CommissionEntry.objects.create(
                sub_order=sub_order,
                amount=sub_order.commission,
                rate=sub_order.seller.commission_rate,
            )

    # 3. Split de pagamento + Payouts
    charge_type = raw_response.get("metadata", {}).get("type") if raw_response else None
    transfers = []
    if charge_type == "separate_transfers" and charge_id:
        from .services import StripeService
        transfers = StripeService.execute_separate_transfers(order, charge_id)

    for sub_order in order.sub_orders.all():
        if hasattr(sub_order, "payout"):
            continue
        seller = sub_order.seller
        transfer_id = ""
        payout_status = PayoutStatus.PENDING

        if charge_type == "separate_transfers":
            if seller and seller.stripe_authorized:
                match = next((t for t in transfers if t.destination == seller.stripe_account_id), None)
                if match:
                    transfer_id, payout_status = match.id, PayoutStatus.COMPLETED
        else:
            # Destination charge (split automático) ou PIX (liquidação na plataforma)
            transfer_id = raw_response.get("id", "") if raw_response else ""
            payout_status = PayoutStatus.COMPLETED

        Payout.objects.create(
            sub_order=sub_order,
            seller=seller,
            amount=sub_order.seller_amount,
            status=payout_status,
            mp_payout_id=transfer_id,
            processed_at=timezone.now() if payout_status == PayoutStatus.COMPLETED else None,
        )

    return True


def dispatch_post_payment_tasks(order: Order) -> None:
    """Dispara e-mail de confirmação e webhook para ERP externo (fora da transação)."""
    from apps.orders.tasks import send_order_confirmation_email_task
    from .tasks import dispatch_webhook_task

    send_order_confirmation_email_task.delay(str(order.id))
    dispatch_webhook_task.delay({
        "event": "order.confirmed",
        "order_number": order.order_number,
        "amount": float(order.total),
        "timestamp": timezone.now().isoformat(),
    })


@transaction.atomic
def restore_stock(order: Order) -> None:
    """Devolve ao estoque as quantidades de todos os itens do pedido (cancelamento/estorno)."""
    from apps.catalog.models import ProductVariant

    for sub_order in order.sub_orders.all():
        for item in sub_order.items.all():
            if item.variant_id:
                variant = ProductVariant.objects.select_for_update().get(id=item.variant_id)
                variant.stock += item.quantity
                variant.save(update_fields=["stock"])
