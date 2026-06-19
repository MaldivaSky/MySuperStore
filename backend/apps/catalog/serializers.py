from rest_framework import serializers

from .models import AttributeValue, Category, Product, ProductImage, ProductVariant, ReviewRating


class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_name = serializers.CharField(source="attribute.name", read_only=True)

    class Meta:
        model = AttributeValue
        fields = ["id", "attribute_name", "value"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "is_primary", "order"]


class ProductVariantSerializer(serializers.ModelSerializer):
    attributes = AttributeValueSerializer(many=True, read_only=True)
    effective_price = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = ["id", "sku", "attributes", "price", "effective_price", "stock", "is_active"]

    def get_effective_price(self, obj):
        # base_price já está no contexto via product — evita N+1
        product = self.context.get("product")
        if obj.price is not None:
            return obj.price
        return product.base_price if product else None


# ── Categorias ────────────────────────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "image", "parent", "order"]


class CategoryTreeSerializer(serializers.ModelSerializer):
    """Serializer recursivo para árvore de categorias."""

    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "image", "order", "children"]

    def get_children(self, obj):
        qs = obj.children.filter(is_active=True).order_by("order", "name")
        return CategoryTreeSerializer(qs, many=True, context=self.context).data


# ── Reviews ──────────────────────────────────────────────────────────────────

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = ReviewRating
        fields = ["id", "user_name", "rating", "subject", "body", "created_at"]

    def get_user_name(self, obj):
        return obj.user.first_name or obj.user.email.split("@")[0]


class SubmitReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewRating
        fields = ["rating", "subject", "body"]

    def validate_rating(self, value):
        if not (1 <= float(value) <= 5):
            raise serializers.ValidationError("A nota deve estar entre 1 e 5.")
        return value


# ── Produtos ─────────────────────────────────────────────────────────────────

class ProductListSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source="seller.store_name", read_only=True)
    seller_slug = serializers.CharField(source="seller.slug", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    primary_image = serializers.SerializerMethodField()
    avg_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    min_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug",
            "base_price", "min_price",
            "seller_name", "seller_slug",
            "category_name",
            "primary_image",
            "avg_rating", "review_count",
            "is_available", "created_at",
        ]

    def get_primary_image(self, obj):
        request = self.context.get("request")
        images = getattr(obj, "prefetched_images", None)
        if images is None:
            images = list(obj.images.all())
        primary = next((i for i in images if i.is_primary), None) or (images[0] if images else None)
        if primary and request:
            try:
                return request.build_absolute_uri(primary.image.url)
            except ValueError:
                return None
        return None

    def get_min_price(self, obj):
        variants = getattr(obj, "active_variants", None)
        if variants is None:
            variants = list(obj.variants.filter(is_active=True))
        if not variants:
            return obj.base_price
        prices = [v.price if v.price is not None else obj.base_price for v in variants]
        return min(prices)


class ProductDetailSerializer(ProductListSerializer):
    images = ProductImageSerializer(many=True, read_only=True, source="prefetched_images")
    variants = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + [
            "description", "images", "variants", "reviews",
            "meta_title", "meta_description", "updated_at",
        ]

    def get_variants(self, obj):
        variants = getattr(obj, "active_variants", None)
        if variants is None:
            variants = list(obj.variants.filter(is_active=True).prefetch_related("attributes__attribute"))
        return ProductVariantSerializer(variants, many=True, context={**self.context, "product": obj}).data

    def get_reviews(self, obj):
        reviews = obj.reviews.filter(is_approved=True).select_related("user").order_by("-created_at")[:20]
        return ReviewSerializer(reviews, many=True, context=self.context).data
