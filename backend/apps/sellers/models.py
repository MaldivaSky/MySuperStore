import uuid
from django.conf import settings
from django.db import models


class SellerStatus(models.TextChoices):
    PENDING = "pending", "Aguardando aprovação"
    APPROVED = "approved", "Aprovado"
    SUSPENDED = "suspended", "Suspenso"
    REJECTED = "rejected", "Rejeitado"


class Seller(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="seller_profile"
    )
    store_name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=160, unique=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="sellers/logos/", blank=True, null=True)
    banner = models.ImageField(upload_to="sellers/banners/", blank=True, null=True)
    # Comissão da plataforma: 0.0300 = 3%
    commission_rate = models.DecimalField(max_digits=5, decimal_places=4, default="0.0300")
    status = models.CharField(max_length=20, choices=SellerStatus.choices, default=SellerStatus.PENDING)
    # Mercado Pago split — preenchido após autorização OAuth do vendedor
    mp_access_token = models.CharField(max_length=512, blank=True)
    mp_refresh_token = models.CharField(max_length=512, blank=True)
    mp_user_id = models.CharField(max_length=50, blank=True)
    mp_token_expires_at = models.DateTimeField(null=True, blank=True)
    # Dados bancários para repasse manual (fallback se MP não autorizado)
    pix_key = models.CharField(max_length=150, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "vendedor"
        verbose_name_plural = "vendedores"
        ordering = ["-created_at"]

    def __str__(self):
        return self.store_name

    @property
    def is_approved(self):
        return self.status == SellerStatus.APPROVED

    @property
    def mp_authorized(self):
        return bool(self.mp_access_token and self.mp_user_id)
