import uuid
from django.db import models


class PaymentMethod(models.TextChoices):
    PIX = "pix", "PIX"
    CREDIT_CARD = "credit_card", "Cartão de Crédito"
    DEBIT_CARD = "debit_card", "Cartão de Débito"
    BOLETO = "boleto", "Boleto Bancário"


class PaymentStatus(models.TextChoices):
    PENDING = "pending", "Aguardando"
    APPROVED = "approved", "Aprovado"
    REJECTED = "rejected", "Rejeitado"
    CANCELLED = "cancelled", "Cancelado"
    REFUNDED = "refunded", "Reembolsado"
    IN_PROCESS = "in_process", "Em processo"


class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField("orders.Order", on_delete=models.PROTECT, related_name="payment")
    method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    # ID da transação no Efí (txid para PIX, charge_id para cartão)
    efi_txid = models.CharField(max_length=100, blank=True, db_index=True)
    # ID adicional (ex: número da transação de split, charge_id)
    efi_charge_id = models.CharField(max_length=100, blank=True, db_index=True)
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    # Valor já estornado (parcial ou total)
    refunded_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    efi_refund_id = models.CharField(max_length=100, blank=True)
    # PIX — payload "copia e cola" (EMV/BR Code) e QR em base64
    pix_qr_code = models.TextField(blank=True)
    pix_qr_code_base64 = models.TextField(blank=True)
    # Boleto
    boleto_url = models.URLField(blank=True)
    boleto_barcode = models.CharField(max_length=100, blank=True)
    # Controle
    expires_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    raw_response = models.JSONField(default=dict)  # resposta completa do provedor
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "pagamento"
        verbose_name_plural = "pagamentos"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.order.order_number} — {self.method} ({self.status})"


class PayoutStatus(models.TextChoices):
    PENDING = "pending", "Aguardando"
    PROCESSING = "processing", "Processando"
    COMPLETED = "completed", "Concluído"
    FAILED = "failed", "Falhou"


class Payout(models.Model):
    """Repasse do valor ao vendedor após confirmação de entrega."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_order = models.OneToOneField("orders.SubOrder", on_delete=models.PROTECT, related_name="payout")
    seller = models.ForeignKey("sellers.Seller", on_delete=models.PROTECT, related_name="payouts")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=PayoutStatus.choices, default=PayoutStatus.PENDING)
    mp_payout_id = models.CharField(max_length=100, blank=True)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "repasse"
        verbose_name_plural = "repasses"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Repasse R${self.amount} → {self.seller.store_name} ({self.status})"


class CommissionEntry(models.Model):
    """Registro de comissão da plataforma por sub-pedido."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_order = models.OneToOneField("orders.SubOrder", on_delete=models.PROTECT, related_name="commission_entry")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    rate = models.DecimalField(max_digits=5, decimal_places=4)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "comissão"
        verbose_name_plural = "comissões"

    def __str__(self):
        return f"Comissão R${self.amount} ({self.rate * 100:.2f}%) — {self.sub_order}"
