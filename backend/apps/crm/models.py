import uuid
from django.db import models

class FunnelType(models.TextChoices):
    CUSTOMER = "comprador", "Comprador (B2C)"
    SELLER = "lojista", "Lojista (B2B)"
    WHITE_LABEL = "white_label", "Investidor (White-Label)"

class LeadStatus(models.TextChoices):
    NEW = "novo", "Novo Lead"
    CONTACTED = "em_contato", "Em Contato"
    NEGOTIATING = "negociando", "Em Negociação"
    CONVERTED = "convertido", "Convertido"
    LOST = "perdido", "Perdido"

class Lead(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=30)
    company = models.CharField(max_length=150, blank=True)
    funnel_type = models.CharField(max_length=50, choices=FunnelType.choices)
    source = models.CharField(max_length=100, default="Organic")
    status = models.CharField(max_length=50, choices=LeadStatus.choices, default=LeadStatus.NEW)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Lead"
        verbose_name_plural = "Leads"

    def __str__(self):
        return f"{self.name} ({self.get_funnel_type_display()}) - {self.status}"
