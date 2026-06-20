import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from .managers import UserManager


class UserRole(models.TextChoices):
    CUSTOMER = "customer", "Cliente"
    SELLER = "seller", "Vendedor"
    ADMIN = "admin", "Administrador"


class PersonType(models.TextChoices):
    PF = "PF", "Pessoa Física"
    PJ = "PJ", "Pessoa Jurídica"

class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(max_length=255, unique=True)
    person_type = models.CharField(max_length=2, choices=PersonType.choices, default=PersonType.PF)
    cpf_cnpj = models.CharField(max_length=20, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.CUSTOMER)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    is_active = models.BooleanField(default=False)  # ativo somente após verificação de e-mail
    is_staff = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        verbose_name = "usuário"
        verbose_name_plural = "usuários"
        ordering = ["-date_joined"]

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return self.email


class Address(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    label = models.CharField(max_length=50, default="Casa")
    recipient_name = models.CharField(max_length=150)
    cep = models.CharField(max_length=8)
    logradouro = models.CharField(max_length=200)
    numero = models.CharField(max_length=20)
    complemento = models.CharField(max_length=100, blank=True)
    bairro = models.CharField(max_length=100)
    cidade = models.CharField(max_length=100)
    uf = models.CharField(max_length=2)
    reference_point = models.CharField(max_length=200, blank=True)
    observation = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "endereço"
        verbose_name_plural = "endereços"
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.label} — {self.logradouro}, {self.numero}, {self.cidade}/{self.uf}"


class AffiliateLink(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="affiliate_links")
    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE, related_name="affiliate_links")
    tracking_code = models.CharField(max_length=50, unique=True)
    clicks = models.PositiveIntegerField(default=0)
    conversions = models.PositiveIntegerField(default=0)
    commission_earned = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "link de afiliado"
        verbose_name_plural = "links de afiliados"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Afiliado {self.user.email} - Produto {self.product.name}"


class UserSurvey(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="survey")
    date_of_birth = models.DateField(null=True, blank=True)
    preferred_category = models.CharField(max_length=100, blank=True)
    education_level = models.CharField(max_length=100, blank=True)
    marital_status = models.CharField(max_length=50, blank=True)
    gender = models.CharField(max_length=50, blank=True)
    preferred_brand = models.CharField(max_length=100, blank=True)
    profession = models.CharField(max_length=100, blank=True)
    primary_intent = models.CharField(max_length=50, blank=True)
    other_interests = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "pesquisa de interesse"
        verbose_name_plural = "pesquisas de interesses"

    def __str__(self):
        return f"Interesses de {self.user.email}"

