from django.contrib.auth import get_user_model
from django.utils.text import slugify
from rest_framework import serializers

from .models import Seller, SellerStatus

User = get_user_model()


class SellerPublicSerializer(serializers.ModelSerializer):
    """Perfil público da loja — sem dados sensíveis."""

    logo_url = serializers.SerializerMethodField()
    banner_url = serializers.SerializerMethodField()
    banner2_url = serializers.SerializerMethodField()
    banner3_url = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()

    class Meta:
        model = Seller
        fields = [
            "id", "store_name", "slug", "description",
            "logo_url", "banner_url", "banner2_url", "banner3_url", "product_count", "avg_rating", "created_at",
        ]

    def get_logo_url(self, obj):
        request = self.context.get("request")
        if obj.logo and request:
            return request.build_absolute_uri(obj.logo.url)
        return None

    def get_banner_url(self, obj):
        request = self.context.get("request")
        if obj.banner and request:
            return request.build_absolute_uri(obj.banner.url)
        return None

    def get_banner2_url(self, obj):
        request = self.context.get("request")
        if obj.banner2 and request:
            return request.build_absolute_uri(obj.banner2.url)
        return None

    def get_banner3_url(self, obj):
        request = self.context.get("request")
        if obj.banner3 and request:
            return request.build_absolute_uri(obj.banner3.url)
        return None

    def get_product_count(self, obj):
        return obj.products.filter(is_available=True).count()

    def get_avg_rating(self, obj):
        from django.db.models import Avg, Q
        rating = obj.products.filter(is_available=True).aggregate(
            avg=Avg("reviews__rating", filter=Q(reviews__status="approved"))
        )["avg"]
        return round(rating, 1) if rating else 0.0


class SellerApplySerializer(serializers.ModelSerializer):
    """Candidatura para se tornar vendedor."""

    class Meta:
        model = Seller
        fields = ["store_name", "description", "pix_key"]

    def validate_store_name(self, value):
        if Seller.objects.filter(store_name=value).exists():
            raise serializers.ValidationError("Este nome de loja já está em uso.")
        return value

    def create(self, validated_data):
        user = self.context["request"].user
        slug = slugify(validated_data["store_name"])
        # Garante slug único
        base_slug = slug
        n = 1
        while Seller.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{n}"
            n += 1

        seller = Seller.objects.create(
            user=user,
            slug=slug,
            status=SellerStatus.PENDING,
            **validated_data,
        )
        # Atualiza role do usuário
        user.role = "seller"
        user.save(update_fields=["role"])
        return seller


class SellerDashboardSerializer(serializers.ModelSerializer):
    """Dados do painel do próprio vendedor (autenticado)."""

    # stripe_authorized é @property no model — precisa ser declarado explicitamente
    stripe_authorized = serializers.BooleanField(read_only=True)
    total_products = serializers.SerializerMethodField()
    available_products = serializers.SerializerMethodField()
    total_orders = serializers.SerializerMethodField()
    pending_payout = serializers.SerializerMethodField()

    class Meta:
        model = Seller
        fields = [
            "id", "store_name", "slug", "status", "commission_rate",
            "stripe_authorized", "stripe_onboarding_complete", "pix_key",
            "strike_count", "max_installments",
            "total_products", "available_products",
            "total_orders", "pending_payout",
        ]

    def get_total_products(self, obj):
        return obj.products.count()

    def get_available_products(self, obj):
        return obj.products.filter(is_available=True).count()

    def get_total_orders(self, obj):
        return obj.sub_orders.count()

    def get_pending_payout(self, obj):
        from apps.payments.models import Payout
        from django.db.models import Sum
        result = Payout.objects.filter(seller=obj, status="pending").aggregate(
            total=Sum("amount")
        )
        return result["total"] or 0


class SellerUpdateSerializer(serializers.ModelSerializer):
    """Atualização do perfil da loja pelo próprio vendedor."""

    class Meta:
        model = Seller
        fields = ["description", "logo", "banner", "banner2", "banner3", "pix_key", "max_installments"]


from .models import ChatRoom, ChatMessage

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.first_name", read_only=True)
    sender_email = serializers.CharField(source="sender.email", read_only=True)

    class Meta:
        model = ChatMessage
        fields = ["id", "room", "sender", "sender_name", "sender_email", "message", "is_read", "created_at"]
        read_only_fields = ["id", "sender", "created_at"]


class ChatRoomSerializer(serializers.ModelSerializer):
    customer_email = serializers.CharField(source="customer.email", read_only=True)
    customer_name = serializers.CharField(source="customer.first_name", read_only=True)
    store_name = serializers.CharField(source="seller.store_name", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatRoom
        fields = [
            "id", "customer", "customer_name", "customer_email",
            "seller", "store_name", "product", "product_name", "product_slug",
            "messages", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ChatLeadSerializer(serializers.Serializer):
    customer_id = serializers.UUIDField()
    customer_name = serializers.CharField()
    customer_email = serializers.CharField()
    product_id = serializers.UUIDField()
    product_name = serializers.CharField()
    product_slug = serializers.CharField()
    source = serializers.CharField()

