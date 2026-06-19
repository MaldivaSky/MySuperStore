import uuid
from django.conf import settings
from django.db import models


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=110, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    parent = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="children"
    )
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

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
    is_available = models.BooleanField(default=False)
    # SEO
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "produto"
        verbose_name_plural = "produtos"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/")
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

    class Meta:
        verbose_name = "variante"
        verbose_name_plural = "variantes"

    def __str__(self):
        attrs = ", ".join(str(a) for a in self.attributes.all())
        return f"{self.product.name} ({attrs})" if attrs else self.product.name

    @property
    def effective_price(self):
        return self.price if self.price is not None else self.product.base_price


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
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "avaliação"
        verbose_name_plural = "avaliações"
        unique_together = [("product", "user")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.rating}★ — {self.product.name} por {self.user.email}"
