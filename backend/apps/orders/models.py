import uuid
from django.conf import settings
from django.db import models


class OrderStatus(models.TextChoices):
    PENDING = "pending", "Aguardando pagamento"
    CONFIRMED = "confirmed", "Pagamento confirmado"
    PROCESSING = "processing", "Em processamento"
    SHIPPED = "shipped", "Enviado"
    DELIVERED = "delivered", "Entregue"
    CANCELLED = "cancelled", "Cancelado"
    REFUNDED = "refunded", "Reembolsado"


class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="orders"
    )
    # Snapshot do endereço no momento da compra
    address_recipient = models.CharField(max_length=150)
    address_cep = models.CharField(max_length=8)
    address_logradouro = models.CharField(max_length=200)
    address_numero = models.CharField(max_length=20)
    address_complemento = models.CharField(max_length=100, blank=True)
    address_bairro = models.CharField(max_length=100)
    address_cidade = models.CharField(max_length=100)
    address_uf = models.CharField(max_length=2)

    order_number = models.CharField(max_length=30, unique=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    notes = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "pedido"
        verbose_name_plural = "pedidos"
        ordering = ["-created_at"]

    def __str__(self):
        return self.order_number


class SubOrder(models.Model):
    """Sub-pedido por vendedor — permite fulfillment independente por loja."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="sub_orders")
    seller = models.ForeignKey("sellers.Seller", on_delete=models.SET_NULL, null=True, related_name="sub_orders")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    # Comissão da plataforma = subtotal × seller.commission_rate
    commission = models.DecimalField(max_digits=10, decimal_places=2)
    # Valor que o vendedor recebe = subtotal - commission
    seller_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    tracking_code = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "sub-pedido"
        verbose_name_plural = "sub-pedidos"

    def __str__(self):
        return f"{self.order.order_number} — {self.seller}"


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_order = models.ForeignKey(SubOrder, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey("catalog.ProductVariant", on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=250)
    variant_sku = models.CharField(max_length=100)
    variant_attributes = models.JSONField(default=dict)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "item do pedido"
        verbose_name_plural = "itens do pedido"

    def __str__(self):
        return f"{self.quantity}x {self.product_name}"
