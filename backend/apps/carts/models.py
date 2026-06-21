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
    coupon = models.ForeignKey("orders.Coupon", on_delete=models.SET_NULL, null=True, blank=True)
    
    # Logística
    destination_cep = models.CharField(max_length=9, blank=True)
    # Formato: {"seller_id": {"id": 1, "company": "Correios", "name": "PAC", "price": "18.50", "delivery_time": 5}}
    selected_shipping = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "carrinho"
        verbose_name_plural = "carrinhos"

    def __str__(self):
        return f"Carrinho de {self.user or self.session_key}"

    @property
    def subtotal(self):
        return sum(item.subtotal for item in self.items.all())

    @property
    def total(self):
        base_total = self.subtotal
        if not self.coupon or not self.coupon.active:
            return base_total
            
        discount = 0
        if self.coupon.seller:
            # Coupon only applies to items from this seller
            seller_items_total = sum(item.subtotal for item in self.items.all() if item.variant.product.seller == self.coupon.seller)
            if self.coupon.discount_percentage:
                discount = seller_items_total * (self.coupon.discount_percentage / 100)
            elif self.coupon.discount_amount:
                discount = min(self.coupon.discount_amount, seller_items_total)
        else:
            # Global coupon
            if self.coupon.discount_percentage:
                discount = base_total * (self.coupon.discount_percentage / 100)
            elif self.coupon.discount_amount:
                discount = min(self.coupon.discount_amount, base_total)
                
        total_after_discount = max(base_total - discount, 0)
        return total_after_discount + self.shipping_total

    @property
    def shipping_total(self):
        from decimal import Decimal
        total = Decimal("0.00")
        for seller_data in self.selected_shipping.values():
            if "price" in seller_data:
                total += Decimal(str(seller_data["price"]))
        return total

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
