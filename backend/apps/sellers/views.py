from django.db.models import Avg, Count, Prefetch, Q
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response

from core.permissions import IsApprovedSeller, IsSeller

from .models import Seller
from .serializers import (
    SellerApplySerializer,
    SellerDashboardSerializer,
    SellerPublicSerializer,
    SellerUpdateSerializer,
)


# -- Perfil publico ------------------------------------------------------------

class SellerPublicViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Seller.objects.filter(status="approved").select_related("user")
    serializer_class = SellerPublicSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"


# -- Candidatura --------------------------------------------------------------

class SellerApplyView(generics.CreateAPIView):
    serializer_class = SellerApplySerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if hasattr(request.user, "seller_profile"):
            return Response(
                {"detail": "Voce ja possui uma loja cadastrada."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().create(request, *args, **kwargs)


# -- Painel do vendedor --------------------------------------------------------

class SellerMeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsSeller]

    def get_object(self):
        return self.request.user.seller_profile

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return SellerUpdateSerializer
        return SellerDashboardSerializer


# -- Stripe Connect onboarding ------------------------------------------------

class SellerStripeOnboardingView(generics.GenericAPIView):
    """POST /sellers/me/stripe-onboard/ -- gera link do Stripe Connect."""

    permission_classes = [IsSeller]

    def post(self, request, *args, **kwargs):
        import stripe
        from django.conf import settings

        stripe.api_key = getattr(settings, "STRIPE_SECRET_KEY", "")
        if not stripe.api_key:
            return Response(
                {"detail": "Stripe nao configurado neste ambiente."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        seller = request.user.seller_profile
        return_url = request.data.get(
            "return_url", "http://localhost:8000/api/v1/sellers/me/stripe-callback/"
        )
        refresh_url = request.data.get("refresh_url", "http://localhost:8000/api/v1/sellers/me/")

        try:
            # Cria ou recupera a conta Connect do vendedor
            if not seller.stripe_account_id:
                account = stripe.Account.create(
                    type="express",
                    email=seller.user.email,
                    capabilities={"card_payments": {"requested": True}, "transfers": {"requested": True}},
                )
                seller.stripe_account_id = account["id"]
                seller.save(update_fields=["stripe_account_id"])

            link = stripe.AccountLink.create(
                account=seller.stripe_account_id,
                refresh_url=refresh_url,
                return_url=return_url,
                type="account_onboarding",
            )
            return Response({"onboarding_url": link["url"]})
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class SellerStripeCallbackView(generics.GenericAPIView):
    """GET /sellers/me/stripe-callback/ -- confirma onboarding concluido."""

    permission_classes = [IsSeller]

    def get(self, request, *args, **kwargs):
        seller = request.user.seller_profile
        seller.stripe_onboarding_complete = True
        seller.save(update_fields=["stripe_onboarding_complete"])
        return Response({"detail": "Onboarding do Stripe concluido com sucesso!"})


# -- CRUD de produtos do vendedor (Fase 3) ------------------------------------

class SellerProductViewSet(viewsets.ModelViewSet):
    """
    GET    /sellers/me/products/           -- lista todos os produtos da loja
    POST   /sellers/me/products/           -- cria novo produto
    GET    /sellers/me/products/{id}/      -- detalhe
    PATCH  /sellers/me/products/{id}/      -- atualiza
    DELETE /sellers/me/products/{id}/      -- remove
    POST   /sellers/me/products/{id}/images/            -- faz upload de imagem
    DELETE /sellers/me/products/{id}/images/{image_id}/ -- remove imagem
    POST   /sellers/me/products/{id}/variants/                     -- cria variante
    PATCH  /sellers/me/products/{id}/variants/{variant_id}/        -- atualiza variante
    DELETE /sellers/me/products/{id}/variants/{variant_id}/        -- remove variante
    """

    permission_classes = [IsApprovedSeller]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def _base_queryset(self):
        from apps.catalog.models import Product, ProductImage, ProductVariant
        return (
            Product.objects.filter(seller=self.request.user.seller_profile)
            .select_related("category", "brand")
            .prefetch_related(
                Prefetch(
                    "images",
                    queryset=ProductImage.objects.order_by("order"),
                    to_attr="prefetched_images",
                ),
                Prefetch(
                    "variants",
                    queryset=ProductVariant.objects.filter(is_active=True).prefetch_related(
                        "attributes__attribute"
                    ),
                    to_attr="active_variants",
                ),
            )
            .annotate(
                avg_rating=Avg("reviews__rating", filter=Q(reviews__status="approved")),
                review_count=Count("reviews", filter=Q(reviews__status="approved")),
            )
            .order_by("-created_at")
        )

    def get_queryset(self):
        return self._base_queryset()

    def get_serializer_class(self):
        from apps.catalog.serializers import (
            ProductCreateSerializer,
            ProductDetailSerializer,
            ProductListSerializer,
            ProductUpdateSerializer,
        )
        if self.action == "create":
            return ProductCreateSerializer
        if self.action in ("partial_update", "update"):
            return ProductUpdateSerializer
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user.seller_profile)

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        # Impede exclusao se houver pedidos associados
        from apps.orders.models import OrderItem
        if OrderItem.objects.filter(variant__product=product).exists():
            return Response(
                {"detail": "Nao e possivel excluir um produto com pedidos. Desative-o em vez disso."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # -- Imagens --------------------------------------------------------------

    def _get_product(self, pk):
        from apps.catalog.models import Product
        try:
            return Product.objects.get(pk=pk, seller=self.request.user.seller_profile)
        except Product.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Produto nao encontrado.")

    def upload_image(self, request, product_pk=None):
        from apps.catalog.serializers import ProductImageUploadSerializer
        product = self._get_product(product_pk)
        serializer = ProductImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Primeira imagem vira primaria automaticamente; nova primaria desbanca a anterior
        if serializer.validated_data.get("is_primary") or not product.images.exists():
            product.images.update(is_primary=False)
            serializer.validated_data["is_primary"] = True

        serializer.save(product=product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete_image(self, request, product_pk=None, image_pk=None):
        from apps.catalog.models import ProductImage
        product = self._get_product(product_pk)
        try:
            image = product.images.get(pk=image_pk)
        except ProductImage.DoesNotExist:
            return Response({"detail": "Imagem nao encontrada."}, status=status.HTTP_404_NOT_FOUND)
        was_primary = image.is_primary
        image.delete()
        # Promove a proxima imagem a primaria se a excluida era a principal
        if was_primary:
            next_img = product.images.order_by("order").first()
            if next_img:
                next_img.is_primary = True
                next_img.save(update_fields=["is_primary"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    # -- Variantes ------------------------------------------------------------

    def create_variant(self, request, product_pk=None):
        from apps.catalog.serializers import ProductVariantWriteSerializer
        product = self._get_product(product_pk)
        serializer = ProductVariantWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variant = serializer.save(product=product)
        # Resposta com leitura completa
        from apps.catalog.serializers import ProductVariantSerializer
        return Response(
            ProductVariantSerializer(variant, context={"product": product}).data,
            status=status.HTTP_201_CREATED,
        )

    def manage_variant(self, request, product_pk=None, variant_pk=None):
        from apps.catalog.models import ProductVariant
        from apps.catalog.serializers import ProductVariantUpdateSerializer, ProductVariantSerializer
        product = self._get_product(product_pk)
        try:
            variant = product.variants.get(pk=variant_pk)
        except ProductVariant.DoesNotExist:
            return Response({"detail": "Variante nao encontrada."}, status=status.HTTP_404_NOT_FOUND)

        if request.method == "DELETE":
            if product.variants.filter(is_active=True).count() <= 1:
                return Response(
                    {"detail": "O produto precisa ter ao menos uma variante ativa."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            variant.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        serializer = ProductVariantUpdateSerializer(variant, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            ProductVariantSerializer(variant, context={"product": product}).data
        )
