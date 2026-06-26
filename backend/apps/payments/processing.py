"""
Lógica de negócio do ciclo de vida do pagamento, compartilhada entre o webhook do
Efí e a simulação de PIX.

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
    comissões, executa o split e cria os
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
            payment.efi_charge_id = charge_id
        if raw_response:
            payment.raw_response = raw_response
        payment.save(update_fields=["status", "paid_at", "efi_charge_id", "raw_response", "updated_at"])

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
    for sub_order in order.sub_orders.all():
        if hasattr(sub_order, "payout"):
            continue
        seller = sub_order.seller

        # PIX (liquidação na plataforma). O dinheiro cai na conta Master, então o repasse é PENDENTE.
        transfer_id = raw_response.get("id", "") if raw_response else ""
        is_pix = raw_response.get("metadata", {}).get("type") == "pix"
        payout_status = PayoutStatus.PENDING if is_pix else PayoutStatus.COMPLETED

        Payout.objects.create(
            sub_order=sub_order,
            seller=seller,
            amount=sub_order.seller_amount,
            status=payout_status,
            mp_payout_id=transfer_id,
            processed_at=timezone.now() if payout_status == PayoutStatus.COMPLETED else None,
        )

    # 4. Limpa os itens do carrinho que foram efetivamente pagos neste pedido
    if order.user_id:
        from apps.carts.models import Cart
        cart = Cart.objects.filter(user=order.user).first()
        if cart:
            variant_ids = [item.variant_id for sub in order.sub_orders.all() for item in sub.items.all()]
            cart.items.filter(variant_id__in=variant_ids).delete()

    return True


def dispatch_post_payment_tasks(order: Order) -> None:
    """Dispara e-mail de confirmação e webhook para ERP externo (fora da transação)."""
    from apps.orders.tasks import send_order_confirmation_email_task, send_seller_sale_notification_email_task
    from .tasks import dispatch_webhook_task

    import logging
    logger = logging.getLogger(__name__)
    try:
        # Executa sincronamente (chamando como função normal em vez de .delay)
        # para garantir a entrega caso o Celery não esteja rodando em produção.
        send_order_confirmation_email_task(str(order.id))
        send_seller_sale_notification_email_task(str(order.id))
        dispatch_webhook_task({
            "event": "order.confirmed",
            "order_number": order.order_number,
            "amount": float(order.total),
            "timestamp": timezone.now().isoformat(),
        })
    except Exception as e:
        logger.error(f"Failed to dispatch post-payment tasks for order {order.id}: {e}")


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