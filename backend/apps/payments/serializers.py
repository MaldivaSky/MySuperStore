from rest_framework import serializers
from apps.orders.models import Order, OrderStatus
from .models import Payment, PaymentMethod, PaymentStatus
from .services import StripeService


class PaymentSerializer(serializers.ModelSerializer):
    client_secret = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "method",
            "mp_payment_id",
            "status",
            "amount",
            "client_secret",
            "created_at",
        ]

    def get_client_secret(self, obj):
        # O client_secret necessário para o Stripe Elements fica dentro da raw_response do PaymentIntent
        if isinstance(obj.raw_response, dict):
            return obj.raw_response.get("client_secret")
        return None


class PaymentCreateSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    payment_method = serializers.ChoiceField(
        choices=[("credit_card", "Cartão de Crédito")], default="credit_card"
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

        # 1. Recupera ou cria um pagamento pendente para o pedido
        payment, created = Payment.objects.get_or_create(
            order=order,
            defaults={
                "method": method,
                "amount": order.total,
                "status": PaymentStatus.PENDING,
            },
        )

        # 2. Se já existia um pagamento, mas o PaymentIntent do Stripe expirou ou mudou, recria
        intent = StripeService.create_payment_intent(order)

        payment.mp_payment_id = intent.id  # Armazena o ID do PaymentIntent na coluna mp_payment_id
        payment.raw_response = intent
        payment.status = PaymentStatus.PENDING
        payment.save()

        return payment
