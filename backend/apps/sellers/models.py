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
    # Comissão da plataforma: Padrão 15% (0.1500)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=4, default="0.1500")
    
    # Moderação e Banimento
    strike_count = models.PositiveIntegerField(default=0, help_text="Quantidade de infrações graves (produtos ilícitos).")
    
    status = models.CharField(max_length=20, choices=SellerStatus.choices, default=SellerStatus.PENDING)
    # Stripe Connect — preenchido após onboarding do vendedor
    stripe_account_id = models.CharField(max_length=100, blank=True)
    stripe_onboarding_complete = models.BooleanField(default=False)
    # Dados bancários para repasse manual (fallback se Stripe não autorizado)
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
    def stripe_authorized(self):
        return bool(self.stripe_account_id and self.stripe_onboarding_complete)


class ChatRoom(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="customer_chat_rooms"
    )
    seller = models.ForeignKey(
        Seller, on_delete=models.CASCADE, related_name="seller_chat_rooms"
    )
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.SET_NULL, null=True, blank=True, related_name="chat_rooms"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "sala de chat"
        verbose_name_plural = "salas de chat"
        unique_together = [("customer", "seller", "product")]
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Chat: {self.customer.email} <-> {self.seller.store_name}"


class ChatMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        ChatRoom, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "mensagem de chat"
        verbose_name_plural = "mensagens de chat"
        ordering = ["created_at"]

    def __str__(self):
        return f"De: {self.sender.email} em {self.created_at}"

