from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.users.serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    UserRegisterSerializer,
    UserProfileSerializer,
)


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ — cria conta e retorna tokens."""
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Gera tokens direto no registro
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserProfileSerializer(user, context={"request": request}).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """POST /api/v1/auth/login/ — retorna access + refresh + dados do usuário."""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class LogoutView(APIView):
    """POST /api/v1/auth/logout/ — invalida o refresh token (blacklist)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"detail": "O campo 'refresh' é obrigatório."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Logout realizado com sucesso."}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"detail": "Token inválido ou já expirado."}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """POST /api/v1/auth/change-password/ — altera a senha do usuário autenticado."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response({"detail": "Senha alterada com sucesso."}, status=status.HTTP_200_OK)


from django.conf import settings
from django.contrib.auth import get_user_model
from google.oauth2 import id_token
from google.auth.transport import requests

User = get_user_model()

class GoogleLoginView(APIView):
    """POST /api/v1/auth/google/ — valida token do google e loga/cria usuário."""
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        role = request.data.get("role", "customer") # se vier do registro seller, vem "seller"
        
        if not token:
            return Response({"detail": "Token não fornecido."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Valida a assinatura do token com o Google
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), settings.GOOGLE_CLIENT_ID)
            
            email = idinfo["email"]
            first_name = idinfo.get("given_name", "")
            last_name = idinfo.get("family_name", "")
            
            from django.utils import timezone
            
            # Busca ou cria o usuário pelo email
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "person_type": "PF",
                    "role": role,
                    "is_active": True,
                    "email_verified_at": timezone.now(),
                }
            )

            # Se o usuário já existia mas não estava ativo, ativa agora (pois o Google já validou o email)
            if not created and not user.is_active:
                user.is_active = True
                user.email_verified_at = timezone.now()
                user.save(update_fields=["is_active", "email_verified_at"])

            # Se o usuário não tinha nome, atualiza
            if not created and not user.first_name:
                user.first_name = first_name
                user.last_name = last_name
                user.save(update_fields=["first_name", "last_name"])

            # Gera JWT do MySuperStore
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "user": UserProfileSerializer(user, context={"request": request}).data,
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "is_new": created
                },
                status=status.HTTP_200_OK,
            )

        except ValueError:
            return Response({"detail": "Token do Google inválido."}, status=status.HTTP_400_BAD_REQUEST)
