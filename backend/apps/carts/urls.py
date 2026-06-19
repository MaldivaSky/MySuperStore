from django.urls import path
from .views import CartItemDetailView, CartView

app_name = "carts"

urlpatterns = [
    path("", CartView.as_view(), name="cart-detail"),
    path("items/", CartView.as_view(), name="cart-add-item"),
    path("items/<uuid:pk>/", CartItemDetailView.as_view(), name="cart-item-detail"),
]
