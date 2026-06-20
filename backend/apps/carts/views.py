from rest_framework import generics, permissions, status
from rest_framework.response import Response
from apps.catalog.models import ProductVariant
from .models import Cart, CartItem
from .serializers import AddToCartSerializer, CartSerializer


class BaseCartView:
    def get_cart(self, request):
        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
            # Mesclar carrinho anônimo se existir
            session_key = request.session.session_key
            if session_key:
                anon_cart = Cart.objects.filter(session_key=session_key).first()
                if anon_cart:
                    for item in anon_cart.items.all():
                        user_item, created = CartItem.objects.get_or_create(
                            cart=cart, variant=item.variant
                        )
                        if not created:
                            user_item.quantity += item.quantity
                        else:
                            user_item.quantity = item.quantity
                        
                        # Garante que não ultrapasse o estoque
                        if user_item.quantity > item.variant.stock:
                            user_item.quantity = item.variant.stock
                        user_item.save()
                    anon_cart.delete()
            return cart
        else:
            if not request.session.session_key:
                request.session.create()
            session_key = request.session.session_key
            cart, _ = Cart.objects.get_or_create(session_key=session_key)
            return cart


class CartView(BaseCartView, generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AddToCartSerializer
        return CartSerializer

    def get(self, request):
        """GET /api/v1/cart/ — Retorna o carrinho atual do usuário."""
        cart = self.get_cart(request)
        serializer = CartSerializer(cart, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        """POST /api/v1/cart/items/ — Adiciona um item ao carrinho."""
        cart = self.get_cart(request)
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        variant_id = serializer.validated_data["variant_id"]
        quantity = serializer.validated_data["quantity"]
        variant = ProductVariant.objects.get(id=variant_id)

        item, created = CartItem.objects.get_or_create(cart=cart, variant=variant)
        if not created:
            new_qty = item.quantity + quantity
            if new_qty > variant.stock:
                return Response(
                    {"detail": f"Estoque insuficiente. Restam {variant.stock} unidades."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            item.quantity = new_qty
        else:
            item.quantity = quantity
        item.save()

        cart_serializer = CartSerializer(cart, context={"request": request})
        return Response(cart_serializer.data, status=status.HTTP_201_CREATED)


class CartItemDetailView(BaseCartView, generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = CartItem.objects.all()

    def get_serializer_class(self):
        return CartSerializer

    def patch(self, request, pk):
        """PATCH /api/v1/cart/items/{id}/ — Altera a quantidade de um item no carrinho."""
        cart = self.get_cart(request)
        try:
            item = cart.items.get(id=pk)
        except CartItem.DoesNotExist:
            return Response(
                {"detail": "Item do carrinho não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        qty = request.data.get("quantity")
        if qty is None:
            return Response(
                {"detail": "O campo quantity é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            qty = int(qty)
            if qty < 1:
                raise ValueError
        except ValueError:
            return Response(
                {"detail": "Quantidade inválida."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if qty > item.variant.stock:
            return Response(
                {"detail": f"Estoque insuficiente. Restam {item.variant.stock} unidades."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.quantity = qty
        item.save()

        serializer = CartSerializer(cart, context={"request": request})
        return Response(serializer.data)

    def delete(self, request, pk):
        """DELETE /api/v1/cart/items/{id}/ — Remove um item do carrinho."""
        cart = self.get_cart(request)
        try:
            item = cart.items.get(id=pk)
        except CartItem.DoesNotExist:
            return Response(
                {"detail": "Item do carrinho não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        item.delete()
        serializer = CartSerializer(cart, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

from apps.orders.models import Coupon
from django.utils import timezone
from .serializers import ApplyCouponSerializer

class ApplyCouponView(BaseCartView, generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ApplyCouponSerializer

    def post(self, request):
        """POST /api/v1/cart/apply_coupon/"""
        cart = self.get_cart(request)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"]

        try:
            coupon = Coupon.objects.get(code=code, active=True)
        except Coupon.DoesNotExist:
            return Response({"detail": "Cupom inválido ou expirado."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        if not (coupon.valid_from <= now <= coupon.valid_to):
            return Response({"detail": "Este cupom não está vigente."}, status=status.HTTP_400_BAD_REQUEST)

        cart.coupon = coupon
        cart.save()

        return Response(CartSerializer(cart, context={"request": request}).data)


from rest_framework.views import APIView
from .tasks import send_abandoned_cart_emails_task

class TriggerAbandonedEmailsView(APIView):
    """
    POST /api/v1/cart/trigger-abandoned-emails/
    Dispara manualmente o envio de e-mails para carrinhos abandonados.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        result = send_abandoned_cart_emails_task()
        return Response({"status": "success", "result": result})


