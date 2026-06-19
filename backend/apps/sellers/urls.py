from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    SellerApplyView,
    SellerMeView,
    SellerProductViewSet,
    SellerStripeCallbackView,
    SellerStripeOnboardingView,
    SellerPublicViewSet,
)

router = DefaultRouter()
router.register("", SellerPublicViewSet, basename="seller")

# ViewSet instanciado uma vez para as rotas manuais aninhadas
_products = SellerProductViewSet.as_view

urlpatterns = [
    # Candidatura
    path("apply/", SellerApplyView.as_view(), name="seller-apply"),

    # Painel do vendedor
    path("me/", SellerMeView.as_view(), name="seller-me"),

    # Stripe Connect
    path("me/stripe-onboard/", SellerStripeOnboardingView.as_view(), name="seller-stripe-onboard"),
    path("me/stripe-callback/", SellerStripeCallbackView.as_view(), name="seller-stripe-callback"),

    # ---- CRUD de produtos do vendedor (Fase 3) ----
    path(
        "me/products/",
        _products({"get": "list", "post": "create"}),
        name="seller-products",
    ),
    path(
        "me/products/<uuid:pk>/",
        _products({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="seller-product-detail",
    ),
    # Imagens
    path(
        "me/products/<uuid:product_pk>/images/",
        _products({"post": "upload_image"}),
        name="seller-product-images",
    ),
    path(
        "me/products/<uuid:product_pk>/images/<uuid:image_pk>/",
        _products({"delete": "delete_image"}),
        name="seller-product-image-delete",
    ),
    # Variantes
    path(
        "me/products/<uuid:product_pk>/variants/",
        _products({"post": "create_variant"}),
        name="seller-product-variants",
    ),
    path(
        "me/products/<uuid:product_pk>/variants/<uuid:variant_pk>/",
        _products({"patch": "manage_variant", "delete": "manage_variant"}),
        name="seller-product-variant-detail",
    ),

    # Perfis publicos (router padrao)
    path("", include(router.urls)),
]
