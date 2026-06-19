from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BannerViewSet, CategoryViewSet, ProductViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("products", ProductViewSet, basename="product")
router.register("banners", BannerViewSet, basename="banner")

urlpatterns = [
    path("", include(router.urls)),
]
