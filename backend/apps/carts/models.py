import uuid
from django.conf import settings
from django.db import models
from django.db.models import Sum


class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Usuário logado ou sessão anônima (ambos podem coexistir)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="cart"
    )
    session_key = models.CharField(max_length=40, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "carrinho"
        verbose_name_plural = "carrinhos"

    def __str__(self):
        return f"Carrinho de {self.user or self.session_key}"

    @property
    def total(self):
        return self.items.aggregate(total=Sum("subtotal"))["total"] or 0

    @property
    def item_count(self):
        return self.items.aggregate(count=Sum("quantity"))["count"] or 0


class CartItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey("catalog.ProductVariant", on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name = "item do carrinho"
        verbose_name_plural = "itens do carrinho"
        unique_together = [("cart", "variant")]

    def __str__(self):
        return f"{self.quantity}x {self.variant}"

    @property
    def subtotal(self):
        return self.variant.effective_price * self.quantity
