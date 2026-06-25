from rest_framework import serializers

from apps.orders.models import Order, OrderStatus
from .models import Payment, PaymentMethod, PaymentStatus

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "method",
            "status",
            "amount",
            "refunded_amount",
            "pix_qr_code",
            "pix_qr_code_base64",
            "expires_at",
            "paid_at",
            "refunded_at",
            "created_at",
        ]

class ProcessPaymentSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    payment_method = serializers.ChoiceField(
        choices=[
            (PaymentMethod.PIX, "PIX"),
            (PaymentMethod.CREDIT_CARD, "Cartão de Crédito"),
            (PaymentMethod.DEBIT_CARD, "Cartão de Débito"),
        ],
        default=PaymentMethod.CREDIT_CARD,
    )
    # Campos específicos de cartão (API Cobranças Efí - One-Step)
    payment_token = serializers.CharField(required=False, allow_blank=True)
    installments = serializers.IntegerField(required=False, default=1)
    customer = serializers.JSONField(required=False, help_text="Dados do cliente: name, cpf, email, phone_number, birth")
    billing_address = serializers.JSONField(required=False, help_text="Endereço de cobrança: street, number, neighborhood, zipcode, city, state")

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

    def validate(self, data):
        method = data.get("payment_method")
        if method in (PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD):
            if not data.get("payment_token"):
                raise serializers.ValidationError({"payment_token": "Token do cartão é obrigatório para pagamento via cartão."})
            if not data.get("customer"):
                raise serializers.ValidationError({"customer": "Dados do titular do cartão são obrigatórios."})
            if not data.get("billing_address"):
                raise serializers.ValidationError({"billing_address": "Endereço de cobrança é obrigatório."})
        return data

class RefundSerializer(serializers.Serializer):
    """Estorno (total ou parcial) de um pagamento aprovado."""
    amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True,
        help_text="Valor a estornar em reais. Omitir = estorno total.",
    )
