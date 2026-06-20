from rest_framework import serializers
from apps.orders.models import Coupon
from apps.sellers.models import Seller
from apps.users.models import User

class AdminCouponSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source="seller.store_name", read_only=True)

    class Meta:
        model = Coupon
        fields = [
            "id", "code", "seller", "seller_name",
            "discount_percentage", "discount_amount",
            "valid_from", "valid_to", "active"
        ]

    def validate(self, data):
        # Must have either discount_percentage or discount_amount, but not both
        percentage = data.get("discount_percentage")
        amount = data.get("discount_amount")

        if percentage and amount:
            raise serializers.ValidationError("Um cupom não pode ter porcentagem e valor fixo ao mesmo tempo.")
        if not percentage and not amount:
            raise serializers.ValidationError("Informe o percentual ou o valor de desconto.")
        if data.get("valid_from") and data.get("valid_to"):
            if data["valid_from"] >= data["valid_to"]:
                raise serializers.ValidationError("A data de início deve ser anterior à data de término.")
        return data

class AdminSellerListSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Seller
        fields = [
            "id", "store_name", "slug", "status", "created_at",
            "user_email", "user_name"
        ]

    def get_user_name(self, obj):
        return obj.user.full_name
