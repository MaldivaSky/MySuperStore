from rest_framework import serializers

from apps.orders.models import Order, OrderStatus
from .models import Payment, PaymentMethod, PaymentStatus
from .services import PixService, StripeService


class PaymentSerializer(serializers.ModelSerializer):
    client_secret = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "method",
            "status",
            "amount",
            "refunded_amount",
            "client_secret",
            "pix_qr_code",
            "pix_qr_code_base64",
            "expires_at",
            "paid_at",
            "refunded_at",
            "created_at",
        ]

    def get_client_secret(self, obj):
        # client_secret do Stripe Elements vive dentro da raw_response do PaymentIntent (cartão)
        if isinstance(obj.raw_response, dict):
            return obj.raw_response.get("client_secret")
        return None


class PaymentCreateSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    payment_method = serializers.ChoiceField(
        choices=[
            (PaymentMethod.PIX, "PIX"),
            (PaymentMethod.CREDIT_CARD, "Cartão de Crédito"),
            (PaymentMethod.DEBIT_CARD, "Cartão de Débito"),
        ],
        default=PaymentMethod.CREDIT_CARD,
    )

    def validate_order_id(self, value):
        user = self.context["request"].user
        try:
            order = Order.objects.get(id=value, user=user)
        except Order.DoesNotExist:
            raise serializers.ValidationError("Pedido não encontrado ou não pertence a este usuário.")

        if order.status != OrderStatus.PENDING:
            raise serializers.ValidationError(
                f"Não é possível pagar um pedido com status '{order.get_status_display()}'."
            )
        return value

    def create(self, validated_data):
        order = Order.objects.get(id=validated_data["order_id"])
        method = validated_data["payment_method"]

        payment, _ = Payment.objects.get_or_create(
            order=order,
            defaults={"method": method, "amount": order.total, "status": PaymentStatus.PENDING},
        )
        payment.method = method
        payment.amount = order.total
        payment.status = PaymentStatus.PENDING

        if method == PaymentMethod.PIX:
            # Gera o BR Code PIX (Copia e Cola + QR). Liquidação simulada via endpoint de confirmação.
            copia_cola, qr_base64 = PixService.generate_brcode(order)
            payment.pix_qr_code = copia_cola
            payment.pix_qr_code_base64 = qr_base64
            payment.raw_response = {}
            payment.save()
        else:
            # Cartão de crédito/débito → PaymentIntent no Stripe
            intent = StripeService.create_payment_intent(order)
            payment.mp_payment_id = intent.id
            payment.raw_response = intent
            payment.save()

        return payment


class RefundSerializer(serializers.Serializer):
    """Estorno (total ou parcial) de um pagamento aprovado."""
    amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True,
        help_text="Valor a estornar em reais. Omitir = estorno total.",
    )
