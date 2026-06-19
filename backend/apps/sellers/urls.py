from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SellerApplyView, SellerMeView, SellerPublicViewSet

router = DefaultRouter()
router.register("", SellerPublicViewSet, basename="seller")

urlpatterns = [
    path("apply/", SellerApplyView.as_view(), name="seller-apply"),
    path("me/", SellerMeView.as_view(), name="seller-me"),
    path("", include(router.urls)),
]
