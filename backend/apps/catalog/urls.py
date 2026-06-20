from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BannerViewSet, CategoryViewSet, ProductViewSet, BrandViewSet, WishlistViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("products", ProductViewSet, basename="product")
router.register("banners", BannerViewSet, basename="banner")
router.register("brands", BrandViewSet, basename="brand")
router.register("wishlist", WishlistViewSet, basename="wishlist")


urlpatterns = [
    path("", include(router.urls)),
]
