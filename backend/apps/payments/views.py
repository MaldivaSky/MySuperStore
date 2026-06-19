import stripe
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.orders.models import Order, OrderStatus
from .models import CommissionEntry, Payment, PaymentStatus, Payout, PayoutStatus
from .serializers import PaymentCreateSerializer, PaymentSerializer
from .services import StripeService

# Inicializa o SDK do Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentSerializer
    queryset = Payment.objects.all()
    http_method_names = ["get", "post", "head", "options"]

    def create(self, request, *args, **kwargs):
        """
        Substituído por create-intent para maior clareza com fluxo Stripe.
        Retorna erro se chamado diretamente para forçar uso de /payments/create-intent/.
        """
        return Response(
            {"detail": "Utilize o endpoint POST /api/v1/payments/create-intent/ para iniciar o checkout."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def retrieve(self, request, pk=None):
        """GET /api/v1/payments/{id}/status/ — Retorna o status de um pagamento."""
        try:
            payment = Payment.objects.get(id=pk, order__user=request.user)
        except Payment.DoesNotExist:
            return Response({"detail": "Pagamento não encontrado."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(payment)
        return Response(serializer.data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_payment_intent_view(request):
    """
    POST /api/v1/payments/create-intent/ — Inicia a transação no Stripe e retorna o client_secret.
    """
    serializer = PaymentCreateSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    payment = serializer.save()

    # Retorna os dados do pagamento e a chave pública do Stripe necessária no Frontend
    response_data = PaymentSerializer(payment, context={"request": request}).data
    response_data["stripe_public_key"] = settings.STRIPE_PUBLIC_KEY
    return Response(response_data, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def stripe_webhook(request):
    """
    POST /api/v1/payments/webhook/ — Recebe notificações do Stripe e valida a assinatura.
    """
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError:
        # Payload inválido
        return Response({"detail": "Payload inválido."}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.SignatureVerificationError:
        # Assinatura inválida
        return Response({"detail": "Assinatura inválida."}, status=status.HTTP_400_BAD_REQUEST)

    # Trata os eventos de sucesso de pagamento
    event_type = event["type"]
    if event_type in ("payment_intent.succeeded", "checkout.session.completed"):
        session_or_intent = event["data"]["object"]
        metadata = session_or_intent.get("metadata", {})
        order_id = metadata.get("order_id")

        if order_id:
            try:
                order = Order.objects.get(id=order_id)
            except Order.DoesNotExist:
                return Response({"detail": "Pedido associado ao pagamento não encontrado."}, status=status.HTTP_404_NOT_FOUND)

            with transaction.atomic():
                # Evita processamento duplicado (idempotência)
                if order.status == OrderStatus.CONFIRMED:
                    return Response({"status": "already_processed"}, status=status.HTTP_200_OK)

                # 1. Recupera e atualiza o registro do Pagamento
                payment = Payment.objects.filter(order=order).first()
                if payment:
                    payment.status = PaymentStatus.APPROVED
                    payment.paid_at = timezone.now()
                    payment.raw_response = session_or_intent
                    payment.save(update_fields=["status", "paid_at", "raw_response"])

                # 2. Atualiza o status da Order principal e das SubOrders
                order.status = OrderStatus.CONFIRMED
                order.save(update_fields=["status"])

                for sub_order in order.sub_orders.all():
                    sub_order.status = OrderStatus.CONFIRMED
                    sub_order.save(update_fields=["status"])

                    # Cria registro de comissão da plataforma
                    CommissionEntry.objects.create(
                        sub_order=sub_order,
                        amount=sub_order.commission,
                        rate=sub_order.seller.commission_rate,
                    )

                # 3. Se for carrinho misto (Separate Transfers), divide e executa as transferências para as subcontas
                charge_id = session_or_intent.get("latest_charge")
                if metadata.get("type") == "separate_transfers" and charge_id:
                    transfers = StripeService.execute_separate_transfers(order, charge_id)
                    # Registra os repasses (Payouts)
                    for sub_order in order.sub_orders.all():
                        seller = sub_order.seller
                        # Procura a transferência correspondente para salvar o ID do repasse
                        transfer_id = ""
                        status_payout = PayoutStatus.PENDING
                        if seller and seller.stripe_authorized:
                            matching_transfer = next(
                                (t for t in transfers if t.destination == seller.stripe_account_id),
                                None,
                            )
                            if matching_transfer:
                                transfer_id = matching_transfer.id
                                status_payout = PayoutStatus.COMPLETED

                        Payout.objects.create(
                            sub_order=sub_order,
                            seller=seller,
                            amount=sub_order.seller_amount,
                            status=status_payout,
                            mp_payout_id=transfer_id,  # reusamos mp_payout_id para salvar Stripe Transfer ID
                            processed_at=timezone.now() if status_payout == PayoutStatus.COMPLETED else None,
                        )
                else:
                    # Caso 1 (Destination Charge): O Stripe já fez o split automaticamente!
                    # Registramos o payout como concluído direto com o ID do próprio PaymentIntent
                    for sub_order in order.sub_orders.all():
                        Payout.objects.create(
                            sub_order=sub_order,
                            seller=sub_order.seller,
                            amount=sub_order.seller_amount,
                            status=PayoutStatus.COMPLETED,
                            mp_payout_id=session_or_intent.id,
                            processed_at=timezone.now(),
                        )

            # 4. Dispara as tarefas assíncronas do Celery fora da transação atômica
            from apps.orders.tasks import send_order_confirmation_email_task
            from .tasks import dispatch_webhook_task

            send_order_confirmation_email_task.delay(str(order.id))
            
            # Notifica ERP externo
            webhook_payload = {
                "event": "order.confirmed",
                "order_number": order.order_number,
                "amount": float(order.total),
                "timestamp": timezone.now().isoformat(),
            }
            dispatch_webhook_task.delay(webhook_payload)

    return Response({"status": "success"}, status=status.HTTP_200_OK)
