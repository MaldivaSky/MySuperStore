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
