from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SellerApplyView, SellerMeView, SellerPublicViewSet, SellerStripeOnboardingView, SellerStripeCallbackView

router = DefaultRouter()
router.register("", SellerPublicViewSet, basename="seller")

urlpatterns = [
    path("apply/", SellerApplyView.as_view(), name="seller-apply"),
    path("me/", SellerMeView.as_view(), name="seller-me"),
    path("me/stripe-onboard/", SellerStripeOnboardingView.as_view(), name="seller-stripe-onboard"),
    path("me/stripe-callback/", SellerStripeCallbackView.as_view(), name="seller-stripe-callback"),
    path("", include(router.urls)),
]
