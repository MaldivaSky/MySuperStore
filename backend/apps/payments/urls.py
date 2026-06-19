from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, create_payment_intent_view, stripe_webhook

app_name = "payments"

router = DefaultRouter()
router.register(r"", PaymentViewSet, basename="payment")

urlpatterns = [
    path("create-intent/", create_payment_intent_view, name="create-payment-intent"),
    path("webhook/", stripe_webhook, name="stripe-webhook"),
    path("", include(router.urls)),
]
