from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    PaymentViewSet,
    cancel_payment_view,
    confirm_payment_view,
    confirm_pix_view,
    create_payment_intent_view,
    efi_webhook,
    refund_payment_view,
    simulate_pix_payment_view,
    stripe_webhook,
)

app_name = "payments"

router = DefaultRouter()
router.register(r"", PaymentViewSet, basename="payment")

urlpatterns = [
    path("create-intent/", create_payment_intent_view, name="create-payment-intent"),
    path("webhook/", stripe_webhook, name="stripe-webhook"),
    path("efi-webhook/", efi_webhook, name="efi-webhook"),
    path("<uuid:pk>/confirm/", confirm_payment_view, name="confirm-payment"),
    path("<uuid:pk>/confirm-pix/", confirm_pix_view, name="confirm-pix"),
    path("<uuid:pk>/simulate-pix/", simulate_pix_payment_view, name="simulate-pix"),
    path("<uuid:pk>/cancel/", cancel_payment_view, name="cancel-payment"),
    path("<uuid:pk>/refund/", refund_payment_view, name="refund-payment"),
    path("", include(router.urls)),
]
