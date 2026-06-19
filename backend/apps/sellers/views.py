from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsApprovedSeller, IsSeller

from .models import Seller
from .serializers import (
    SellerApplySerializer,
    SellerDashboardSerializer,
    SellerPublicSerializer,
    SellerUpdateSerializer,
)


class SellerPublicViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /sellers/ e GET /sellers/{slug}/ — perfis públicos de lojas aprovadas."""

    queryset = Seller.objects.filter(status="approved").select_related("user")
    serializer_class = SellerPublicSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"


class SellerApplyView(generics.CreateAPIView):
    """POST /sellers/apply/ — candidatura para ser vendedor."""

    serializer_class = SellerApplySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()

    def create(self, request, *args, **kwargs):
        if hasattr(request.user, "seller_profile"):
            return Response(
                {"detail": "Você já possui uma loja cadastrada."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().create(request, *args, **kwargs)


class SellerMeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /sellers/me/ — painel e edição da própria loja."""

    permission_classes = [IsSeller]

    def get_object(self):
        return self.request.user.seller_profile

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return SellerUpdateSerializer
        return SellerDashboardSerializer


class SellerStripeOnboardingView(generics.CreateAPIView):
    """POST /sellers/me/stripe-onboard/ — Gera link do Stripe Connect Onboarding."""

    permission_classes = [IsSeller]

    def post(self, request, *args, **kwargs):
        seller = request.user.seller_profile
        return_url = request.data.get("return_url", "http://localhost:8000/api/v1/sellers/me/stripe-callback/")
        refresh_url = request.data.get("refresh_url", "http://localhost:8000/api/v1/sellers/me/")

        from apps.payments.services import StripeService
        try:
            onboard_url = StripeService.create_account_link(seller, return_url, refresh_url)
            return Response({"onboarding_url": onboard_url}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SellerStripeCallbackView(generics.GenericAPIView):
    """GET /sellers/me/stripe-callback/ — Callback para confirmar onboarding."""

    permission_classes = [IsSeller]

    def get(self, request, *args, **kwargs):
        seller = request.user.seller_profile
        seller.stripe_onboarding_complete = True
        seller.save(update_fields=["stripe_onboarding_complete"])
        return Response({"detail": "Onboarding do Stripe concluído com sucesso!"}, status=status.HTTP_200_OK)
