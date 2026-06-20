import redis
from django.conf import settings
from django.db import transaction
from rest_framework import serializers
from apps.carts.models import Cart
from apps.catalog.models import ProductVariant
from .models import Order, OrderItem, SubOrder, ReturnRequest

class ReturnRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReturnRequest
        fields = ["id", "reason", "status", "customer_notes", "seller_notes", "created_at", "updated_at"]

class OrderItemSerializer(serializers.ModelSerializer):
    return_request = ReturnRequestSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_name",
            "variant_sku",
            "variant_attributes",
            "quantity",
            "unit_price",
            "total",
            "return_request",
            "created_at",
        ]


class SubOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    seller_name = serializers.CharField(source="seller.store_name", read_only=True)

    class Meta:
        model = SubOrder
        fields = [
            "id",
            "seller",
            "seller_name",
            "subtotal",
            "commission",
            "seller_amount",
            "status",
            "tracking_code",
            "items",
            "created_at",
            "updated_at",
        ]


class OrderSerializer(serializers.ModelSerializer):
    sub_orders = SubOrderSerializer(many=True, read_only=True)
    payment = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "subtotal",
            "shipping",
            "total",
            "status",
            "address_recipient",
            "address_cep",
            "address_logradouro",
            "address_numero",
            "address_complemento",
            "address_bairro",
            "address_cidade",
            "address_uf",
            "notes",
            "payment",
            "sub_orders",
            "created_at",
            "updated_at",
        ]

    def get_payment(self, obj):
        p = getattr(obj, "payment", None)
        if not p:
            return None
        return {
            "id": str(p.id),
            "status": p.status,
            "method": p.method,
            "refunded_amount": str(p.refunded_amount),
        }


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            "address_recipient",
            "address_cep",
            "address_logradouro",
            "address_numero",
            "address_complemento",
            "address_bairro",
            "address_cidade",
            "address_uf",
            "notes",
        ]

    def validate(self, data):
        user = self.context["request"].user
        try:
            cart = Cart.objects.get(user=user)
        except Cart.DoesNotExist:
            raise serializers.ValidationError("Carrinho não encontrado.")

        if not cart.items.exists():
            raise serializers.ValidationError("O carrinho está vazio.")

        # Validação transacional de estoque
        for item in cart.items.all():
            variant = item.variant
            if variant.stock < item.quantity:
                raise serializers.ValidationError(
                    f"Estoque insuficiente para o produto {variant.product.name} ({variant.sku}). Restam apenas {variant.stock} unidades."
                )

        return data

    def create(self, validated_data):
        user = self.context["request"].user
        cart = Cart.objects.get(user=user)
        cart_items = list(cart.items.all())

        # Conectar ao Redis
        try:
            redis_client = redis.from_url(settings.CELERY_BROKER_URL)
        except Exception:
            redis_client = None

        with transaction.atomic():
            # 1. Bloqueia os registros no banco para evitar race conditions
            for item in cart_items:
                ProductVariant.objects.select_for_update().get(id=item.variant.id)

            # 2. Gera o número do pedido legível
            import datetime
            import random
            current_date = datetime.date.today().strftime("%Y%m%d")
            rand_suffix = "".join(random.choices("0123456789", k=4))
            order_number = f"{current_date}-{rand_suffix}"

            # 3. Calcula totais do pedido principal
            subtotal = sum(item.subtotal for item in cart_items)
            shipping = 0  # Frete fixado em zero por enquanto
            total = subtotal + shipping

            # 4. Cria a Order principal
            order = Order.objects.create(
                user=user,
                order_number=order_number,
                subtotal=subtotal,
                shipping=shipping,
                total=total,
                ip_address=self.context["request"].META.get("REMOTE_ADDR"),
                **validated_data,
            )

            # 5. Agrupa itens por vendedor para criar SubOrders
            items_by_seller = {}
            for item in cart_items:
                seller = item.variant.product.seller
                if seller not in items_by_seller:
                    items_by_seller[seller] = []
                items_by_seller[seller].append(item)

            for seller, items in items_by_seller.items():
                sub_subtotal = sum(item.subtotal for item in items)
                # Calcula comissão da plataforma baseado na taxa do vendedor
                commission = round(sub_subtotal * seller.commission_rate, 2)
                seller_amount = sub_subtotal - commission

                sub_order = SubOrder.objects.create(
                    order=order,
                    seller=seller,
                    subtotal=sub_subtotal,
                    commission=commission,
                    seller_amount=seller_amount,
                )

                for item in items:
                    # Coleta os atributos da variante
                    attributes = {}
                    for attr_val in item.variant.attributes.all():
                        attributes[attr_val.attribute.name] = attr_val.value

                    # Cria o item do pedido
                    OrderItem.objects.create(
                        sub_order=sub_order,
                        variant=item.variant,
                        product_name=item.variant.product.name,
                        variant_sku=item.variant.sku,
                        variant_attributes=attributes,
                        quantity=item.quantity,
                        unit_price=item.variant.effective_price,
                        total=item.subtotal,
                    )

                    # Decrementa o estoque real no banco
                    item.variant.stock -= item.quantity
                    item.variant.save(update_fields=["stock"])

                    # Reserva estoque no Redis com TTL de 15 minutos (900s)
                    if redis_client:
                        try:
                            redis_client.setex(
                                f"stock_reserve:{order.id}:{item.variant.id}",
                                900,
                                item.quantity,
                            )
                        except Exception:
                            pass

            # 6. Limpa o carrinho
            cart.items.all().delete()

        return order
