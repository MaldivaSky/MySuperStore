from rest_framework import serializers
from apps.catalog.models import ProductVariant
from apps.catalog.serializers import ProductVariantSerializer
from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    variant = ProductVariantSerializer(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "variant", "quantity", "subtotal"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "total", "item_count"]


class AddToCartSerializer(serializers.Serializer):
    variant_id = serializers.UUIDField()
    quantity = serializers.IntegerField(default=1, min_value=1)

    def validate_variant_id(self, value):
        try:
            variant = ProductVariant.objects.get(id=value, is_active=True)
        except ProductVariant.DoesNotExist:
            raise serializers.ValidationError("Variante do produto não encontrada ou inativa.")
        return value

    def validate(self, data):
        variant = ProductVariant.objects.get(id=data["variant_id"])
        quantity = data["quantity"]
        if variant.stock < quantity:
            raise serializers.ValidationError(
                f"Estoque insuficiente. Apenas {variant.stock} unidades disponíveis."
            )
        return data
