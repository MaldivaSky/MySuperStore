import uuid
from django.conf import settings
from django.db import models


class ProductStatus(models.TextChoices):
    PENDING = "pending", "Em Análise"
    APPROVED = "approved", "Publicado"
    BANNED = "banned", "Banido - Ilícito"

class ReviewStatus(models.TextChoices):
    PENDING = "pending", "Pendente"
    APPROVED = "approved", "Aprovado"
    REJECTED = "rejected", "Rejeitado"

class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=110, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    external_url = models.URLField(max_length=500, blank=True, null=True, help_text="URL externa para imagens (usado caso S3 não esteja ativo)")
    parent = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="children"
    )
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    # Comissão dinâmica de Categoria (Sobrepõe Lojista e Global)
    category_commission_rate = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)

    class Meta:
        verbose_name = "categoria"
        verbose_name_plural = "categorias"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class Brand(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=110, unique=True)
    logo = models.ImageField(upload_to="brands/", blank=True, null=True)
    external_url = models.URLField(max_length=500, blank=True, null=True)

    class Meta:
        verbose_name = "marca"
        verbose_name_plural = "marcas"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(
        "sellers.Seller", on_delete=models.CASCADE, related_name="products"
    )
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="products")
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=250)
    slug = models.SlugField(max_length=260, unique=True)
    description = models.TextField(blank=True)
    # Preço base — variantes podem ter preço próprio
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Sistema de Promoções
    promotional_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    promo_starts_at = models.DateTimeField(null=True, blank=True)
    promo_ends_at = models.DateTimeField(null=True, blank=True)

    is_available = models.BooleanField(default=False)
    is_boosted = models.BooleanField(default=False, help_text="Produto impulsionado no catálogo")

    # Vídeo do produto (máx. 1 por produto). Upload local OU URL externa.
    video = models.FileField(upload_to="products/videos/", blank=True, null=True)
    video_external = models.URLField(max_length=500, blank=True, null=True)

    # SEO
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    
    approval_status = models.CharField(max_length=20, choices=ProductStatus.choices, default=ProductStatus.PENDING)
    
    views_count = models.PositiveIntegerField(default=0)
    clicks_count = models.PositiveIntegerField(default=0)
    
    # Logística e Frete
    is_free_shipping = models.BooleanField(default=False)
    estimated_delivery_days = models.PositiveIntegerField(default=5)
    
    # Medidas Físicas (necessárias para Melhor Envio)
    weight = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True, help_text="Peso em KG. Ex: 1.500 = 1.5kg")
    length = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Comprimento em CM")
    width = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Largura em CM")
    height = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Altura em CM")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_on_sale(self):
        from django.utils import timezone
        if self.promotional_price and self.promo_starts_at and self.promo_ends_at:
            now = timezone.now()
            return self.promo_starts_at <= now <= self.promo_ends_at
        return False

    @property
    def current_price(self):
        return self.promotional_price if self.is_on_sale else self.base_price

    class Meta:
        verbose_name = "produto"
        verbose_name_plural = "produtos"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

class ProductSpecification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="specifications")
    attribute_name = models.CharField(max_length=100)
    attribute_value = models.CharField(max_length=255)

    class Meta:
        verbose_name = "especificação técnica"
        verbose_name_plural = "especificações técnicas"
        unique_together = [("product", "attribute_name")]

    def __str__(self):
        return f"{self.product.name} - {self.attribute_name}: {self.attribute_value}"


class ProductImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    external_url = models.URLField(max_length=500, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order"]


class Attribute(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class AttributeValue(models.Model):
    attribute = models.ForeignKey(Attribute, on_delete=models.CASCADE, related_name="values")
    value = models.CharField(max_length=100)

    class Meta:
        unique_together = [("attribute", "value")]

    def __str__(self):
        return f"{self.attribute.name}: {self.value}"


class ProductVariant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    sku = models.CharField(max_length=100, unique=True)
    attributes = models.ManyToManyField(AttributeValue, blank=True)
    # Se None, herda base_price do Product
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    # Medidas Físicas da Variante (se nulo, herda do Product pai)
    weight = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True, help_text="Peso em KG. Ex: 1.500 = 1.5kg")
    length = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Comprimento em CM")
    width = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Largura em CM")
    height = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Altura em CM")

    class Meta:
        verbose_name = "variante"
        verbose_name_plural = "variantes"

    def __str__(self):
        attrs = ", ".join(str(a) for a in self.attributes.all())
        return f"{self.product.name} ({attrs})" if attrs else self.product.name

    @property
    def effective_price(self):
        if self.product.is_on_sale:
            return self.product.promotional_price
        return self.price if self.price is not None else self.product.base_price

    @property
    def effective_weight(self):
        return self.weight if self.weight is not None else self.product.weight

    @property
    def effective_length(self):
        return self.length if self.length is not None else self.product.length

    @property
    def effective_width(self):
        return self.width if self.width is not None else self.product.width

    @property
    def effective_height(self):
        return self.height if self.height is not None else self.product.height


class Wishlist(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wishlist"
    )
    products = models.ManyToManyField(Product, blank=True, related_name="wishlists")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Lista de desejos de {self.user.email}"


class ReviewRating(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    # Garante que somente quem comprou pode avaliar
    order_item = models.ForeignKey(
        "orders.OrderItem", on_delete=models.SET_NULL, null=True, blank=True
    )
    rating = models.DecimalField(max_digits=3, decimal_places=1)
    subject = models.CharField(max_length=150, blank=True)
    body = models.TextField(max_length=1000, blank=True)
    status = models.CharField(max_length=20, choices=ReviewStatus.choices, default=ReviewStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "avaliação"
        verbose_name_plural = "avaliações"
        unique_together = [("product", "user")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.rating}★ — {self.product.name} por {self.user.email}"

class Banner(models.Model):
    title = models.CharField(max_length=150)
    subtitle = models.CharField(max_length=150, blank=True)
    cta_text = models.CharField(max_length=50, blank=True)
    image = models.ImageField(upload_to="banners/")
    link_url = models.CharField(max_length=200, blank=True)
    active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "banner"
        verbose_name_plural = "banners"
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title
