import stripe
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.orders.models import Order, OrderStatus
from .models import Payment, PaymentMethod, PaymentStatus
from .processing import (
    dispatch_post_payment_tasks,
    process_successful_payment,
    restore_stock,
)
from .serializers import PaymentCreateSerializer, PaymentSerializer, RefundSerializer
from .services import StripeService

stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentSerializer
    queryset = Payment.objects.all()
    http_method_names = ["get", "post", "head", "options"]

    def create(self, request, *args, **kwargs):
        return Response(
            {"detail": "Utilize POST /api/v1/payments/create-intent/ para iniciar o checkout."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def retrieve(self, request, pk=None):
        """GET /api/v1/payments/{id}/ — status de um pagamento do próprio usuário."""
        try:
            payment = Payment.objects.get(id=pk, order__user=request.user)
        except Payment.DoesNotExist:
            return Response({"detail": "Pagamento não encontrado."}, status=status.HTTP_404_NOT_FOUND)
        return Response(self.get_serializer(payment).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_payment_intent_view(request):
    """
    POST /api/v1/payments/create-intent/
    Inicia o pagamento. Cartão → retorna client_secret do Stripe. PIX → retorna QR Code.
    Body: { "order_id": "...", "payment_method": "pix|credit_card|debit_card" }
    """
    serializer = PaymentCreateSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    payment = serializer.save()

    data = PaymentSerializer(payment, context={"request": request}).data
    data["stripe_public_key"] = settings.STRIPE_PUBLIC_KEY
    return Response(data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def confirm_payment_view(request, pk):
    """
    POST /api/v1/payments/{id}/confirm/
    Confirmação autoritativa após o cliente concluir o cartão no Stripe Elements.
    Reconsulta o PaymentIntent no Stripe (fonte da verdade) e, se 'succeeded', confirma
    o pedido. Funciona como rede de segurança caso o webhook ainda não tenha chegado.
    """
    try:
        payment = Payment.objects.get(id=pk, order__user=request.user)
    except Payment.DoesNotExist:
        return Response({"detail": "Pagamento não encontrado."}, status=status.HTTP_404_NOT_FOUND)

    if not payment.mp_payment_id:
        return Response({"detail": "Pagamento sem PaymentIntent (use este endpoint só para cartão)."},
                        status=status.HTTP_400_BAD_REQUEST)

    intent = stripe.PaymentIntent.retrieve(payment.mp_payment_id)
    if intent.status != "succeeded":
        return Response(
            {"detail": "Pagamento ainda não confirmado pelo Stripe.", "stripe_status": intent.status},
            status=status.HTTP_202_ACCEPTED,
        )

    processed = process_successful_payment(
        payment.order, raw_response=dict(intent), charge_id=intent.get("latest_charge", "")
    )
    if processed:
        dispatch_post_payment_tasks(payment.order)

    payment.refresh_from_db()
    return Response(PaymentSerializer(payment, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def simulate_pix_payment_view(request, pk):
    """
    POST /api/v1/payments/{id}/simulate-pix/
    [APENAS DEBUG] Simula a baixa do PIX pelo banco — confirma o pedido sem PSP real.
    Em produção este gatilho viria do webhook do banco/PSP.
    """
    if not settings.DEBUG:
        return Response({"detail": "Indisponível em produção."}, status=status.HTTP_403_FORBIDDEN)

    try:
        payment = Payment.objects.get(id=pk, order__user=request.user, method=PaymentMethod.PIX)
    except Payment.DoesNotExist:
        return Response({"detail": "Pagamento PIX não encontrado."}, status=status.HTTP_404_NOT_FOUND)

    processed = process_successful_payment(
        payment.order, raw_response={"simulated_pix": True, "metadata": {"type": "pix"}}
    )
    if processed:
        dispatch_post_payment_tasks(payment.order)

    payment.refresh_from_db()
    return Response(PaymentSerializer(payment, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def cancel_payment_view(request, pk):
    """
    POST /api/v1/payments/{id}/cancel/
    Cancela um pedido ainda NÃO pago: cancela o PaymentIntent, devolve o estoque
    reservado e marca o pedido como cancelado.
    """
    try:
        payment = Payment.objects.get(id=pk, order__user=request.user)
    except Payment.DoesNotExist:
        return Response({"detail": "Pagamento não encontrado."}, status=status.HTTP_404_NOT_FOUND)

    order = payment.order
    if order.status not in (OrderStatus.PENDING,):
        return Response(
            {"detail": f"Não é possível cancelar um pedido '{order.get_status_display()}'. Use estorno."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        StripeService.cancel_payment_intent(payment)
        restore_stock(order)
        payment.status = PaymentStatus.CANCELLED
        payment.save(update_fields=["status", "updated_at"])
        order.status = OrderStatus.CANCELLED
        order.save(update_fields=["status", "updated_at"])
        for sub in order.sub_orders.all():
            sub.status = OrderStatus.CANCELLED
            sub.save(update_fields=["status", "updated_at"])

    return Response({"detail": "Pedido cancelado e estoque restaurado.",
                     "order_status": order.status})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def refund_payment_view(request, pk):
    """
    POST /api/v1/payments/{id}/refund/
    Estorna um pedido PAGO. Cartão → Stripe Refund (reverte split e comissão).
    PIX → baixa de estorno local. Restaura estoque e marca tudo como reembolsado.
    Body opcional: { "amount": 50.00 } para estorno parcial.
    """
    try:
        payment = Payment.objects.get(id=pk)
    except Payment.DoesNotExist:
        return Response({"detail": "Pagamento não encontrado."}, status=status.HTTP_404_NOT_FOUND)

    order = payment.order
    is_owner = order.user_id == request.user.id
    is_admin = getattr(request.user, "role", None) == "admin" or request.user.is_staff
    if not (is_owner or is_admin):
        return Response({"detail": "Sem permissão para estornar este pedido."},
                        status=status.HTTP_403_FORBIDDEN)

    if payment.status != PaymentStatus.APPROVED:
        return Response(
            {"detail": f"Só é possível estornar pagamentos aprovados (atual: {payment.get_status_display()})."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    ser = RefundSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    amount = ser.validated_data.get("amount")

    with transaction.atomic():
        refund_id = ""
        if payment.method in (PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD):
            refund = StripeService.refund_payment(payment, amount=amount)
            refund_id = refund.id
        # PIX: sem PSP real — baixa local (em produção chamaria a API de devolução PIX)

        refunded_total = amount if amount is not None else payment.amount
        payment.refunded_amount = refunded_total
        payment.stripe_refund_id = refund_id
        payment.refunded_at = timezone.now()
        # Estorno total → REFUNDED; parcial mantém APPROVED com refunded_amount preenchido
        full_refund = refunded_total >= payment.amount
        if full_refund:
            payment.status = PaymentStatus.REFUNDED
        payment.save(update_fields=[
            "refunded_amount", "stripe_refund_id", "refunded_at", "status", "updated_at",
        ])

        if full_refund:
            restore_stock(order)
            order.status = OrderStatus.REFUNDED
            order.save(update_fields=["status", "updated_at"])
            for sub in order.sub_orders.all():
                sub.status = OrderStatus.REFUNDED
                sub.save(update_fields=["status", "updated_at"])

    return Response({
        "detail": "Estorno processado." if full_refund else "Estorno parcial processado.",
        "refunded_amount": str(refunded_total),
        "stripe_refund_id": refund_id,
        "order_status": order.status,
    })


@csrf_exempt
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def stripe_webhook(request):
    """
    POST /api/v1/payments/webhook/ — fonte da verdade do Stripe.
    Valida assinatura e processa sucesso/falha/estorno de pagamentos.
    """
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError:
        return Response({"detail": "Payload inválido."}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.SignatureVerificationError:
        return Response({"detail": "Assinatura inválida."}, status=status.HTTP_400_BAD_REQUEST)

    event_type = event["type"]
    obj = event["data"]["object"]

    if event_type in ("payment_intent.succeeded", "checkout.session.completed"):
        order_id = obj.get("metadata", {}).get("order_id")
        if order_id:
            order = Order.objects.filter(id=order_id).first()
            if order:
                processed = process_successful_payment(
                    order, raw_response=dict(obj), charge_id=obj.get("latest_charge", "")
                )
                if processed:
                    dispatch_post_payment_tasks(order)

    elif event_type == "payment_intent.payment_failed":
        order_id = obj.get("metadata", {}).get("order_id")
        if order_id:
            payment = Payment.objects.filter(order_id=order_id).first()
            if payment and payment.status != PaymentStatus.APPROVED:
                payment.status = PaymentStatus.REJECTED
                payment.save(update_fields=["status", "updated_at"])

    elif event_type == "charge.refunded":
        pi_id = obj.get("payment_intent")
        if pi_id:
            payment = Payment.objects.filter(mp_payment_id=pi_id).first()
            if payment and payment.status != PaymentStatus.REFUNDED:
                payment.status = PaymentStatus.REFUNDED
                payment.refunded_at = timezone.now()
                payment.save(update_fields=["status", "refunded_at", "updated_at"])

    return Response({"status": "success"}, status=status.HTTP_200_OK)
