from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "order_number"
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        # Otimiza o carregamento de sub-pedidos, itens e vendedores em uma consulta reduzida
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related(
                "sub_orders__items",
                "sub_orders__seller",
            )
        )

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        """POST /api/v1/orders/ — Cria um pedido a partir do carrinho do usuário."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        # Retorna o pedido completo serializado
        response_serializer = OrderSerializer(order, context=self.get_serializer_context())
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
