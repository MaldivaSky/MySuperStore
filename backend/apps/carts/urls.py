from django.urls import path
from .views import (
    CartItemDetailView, CartView, ApplyCouponView, 
    TriggerAbandonedEmailsView, CartShippingQuoteView, CartShippingSelectView
)

app_name = "carts"

urlpatterns = [
    path("", CartView.as_view(), name="cart-detail"),
    path("apply_coupon/", ApplyCouponView.as_view(), name="cart-apply-coupon"),
    path("items/", CartView.as_view(), name="cart-add-item"),
    path("items/<uuid:pk>/", CartItemDetailView.as_view(), name="cart-item-detail"),
    path("shipping/quote/", CartShippingQuoteView.as_view(), name="cart-shipping-quote"),
    path("shipping/select/", CartShippingSelectView.as_view(), name="cart-shipping-select"),
    path("trigger-abandoned-emails/", TriggerAbandonedEmailsView.as_view(), name="trigger-abandoned-emails"),
]

