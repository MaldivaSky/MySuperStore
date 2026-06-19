from django.contrib.auth import get_user_model
from django.utils.text import slugify
from rest_framework import serializers

from .models import Seller, SellerStatus

User = get_user_model()


class SellerPublicSerializer(serializers.ModelSerializer):
    """Perfil público da loja — sem dados sensíveis."""

    logo_url = serializers.SerializerMethodField()
    banner_url = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Seller
        fields = [
            "id", "store_name", "slug", "description",
            "logo_url", "banner_url", "product_count", "created_at",
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

    def get_product_count(self, obj):
        return obj.products.filter(is_available=True).count()


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

    total_products = serializers.SerializerMethodField()
    available_products = serializers.SerializerMethodField()
    total_orders = serializers.SerializerMethodField()
    pending_payout = serializers.SerializerMethodField()

    class Meta:
        model = Seller
        fields = [
            "id", "store_name", "slug", "status", "commission_rate",
            "mp_authorized", "pix_key",
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
        fields = ["description", "logo", "banner", "pix_key"]
