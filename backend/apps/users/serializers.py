from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


# ── Register ─────────────────────────────────────────────────────────────────

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "person_type", "cpf_cnpj", "first_name", "last_name", "phone", "role", "password", "password_confirm"]

    def validate_cpf_cnpj(self, value):
        if value and User.objects.filter(cpf_cnpj=value).exists():
            raise serializers.ValidationError("Este CPF/CNPJ já está vinculado a outra conta.")
        return value

    def validate_phone(self, value):
        if value and User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("Este telefone já está registrado.")
        return value

    def validate(self, data):
        cpf_cnpj = data.get("cpf_cnpj", "")
        person_type = data.get("person_type", "PF")
        
        if person_type == "PF" and cpf_cnpj and len(cpf_cnpj) != 11:
            raise serializers.ValidationError({"cpf_cnpj": "CPF deve ter exatamente 11 dígitos."})
        if person_type == "PJ" and cpf_cnpj and len(cpf_cnpj) != 14:
            raise serializers.ValidationError({"cpf_cnpj": "CNPJ deve ter exatamente 14 dígitos."})
            
        if data.get("password") != data.pop("password_confirm", None):
            raise serializers.ValidationError({"password_confirm": "As senhas não conferem."})
        return data

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        # Em dev: ativa automaticamente (email backend = console)
        # Em prod: descomente o envio de e-mail de verificação
        user.is_active = True
        user.save(update_fields=["is_active"])
        return user


# ── Custom JWT claim ─────────────────────────────────────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adiciona email, full_name e role ao payload do JWT."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["full_name"] = user.full_name
        token["role"] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserProfileSerializer(self.user).data
        return data


# ── Profile ──────────────────────────────────────────────────────────────────

class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "phone",
            "role", "full_name", "avatar_url", "is_active", "date_joined",
        ]
        read_only_fields = ["id", "email", "role", "is_active", "date_joined"]

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone", "avatar"]


# ── Change password ──────────────────────────────────────────────────────────

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "As senhas não conferem."})
        return data

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Senha atual incorreta.")
        return value


from .models import UserSurvey

class UserSurveySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSurvey
        fields = ["is_parent", "is_elderly", "sports_fan", "music_taste", "other_interests", "updated_at"]
        read_only_fields = ["updated_at"]


# ── Addresses ────────────────────────────────────────────────────────────────

from .models import Address

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id", "label", "recipient_name", "cep", "logradouro", "numero",
            "complemento", "bairro", "cidade", "uf", "reference_point",
            "observation", "is_default", "created_at"
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        # Se for o primeiro, ou for marcado como is_default, desmarcar os outros
        if validated_data.get("is_default") or not Address.objects.filter(user=user).exists():
            Address.objects.filter(user=user).update(is_default=False)
            validated_data["is_default"] = True
            
        validated_data["user"] = user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if validated_data.get("is_default") and not instance.is_default:
            Address.objects.filter(user=instance.user).update(is_default=False)
        return super().update(instance, validated_data)

