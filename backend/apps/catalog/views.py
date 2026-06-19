from django.db.models import Avg, Count, Prefetch, Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import ProductFilter
from .models import Category, Product, ProductImage, ProductVariant, ReviewRating
from .serializers import (
    CategorySerializer,
    CategoryTreeSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ReviewSerializer,
    SubmitReviewSerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True).order_by("order", "name")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    pagination_class = None  # retorna todas as categorias sem paginação

    @action(detail=False, methods=["get"], url_path="tree")
    def tree(self, request):
        """GET /catalog/categories/tree/ — árvore hierárquica de categorias."""
        categories = list(self.get_queryset())
        
        from collections import defaultdict
        children_map = defaultdict(list)
        for cat in categories:
            if cat.parent_id is not None:
                children_map[cat.parent_id].append(cat)
                
        roots = [cat for cat in categories if cat.parent_id is None]
        serializer = CategoryTreeSerializer(
            roots,
            many=True,
            context={"request": request, "children_map": children_map},
        )
        return Response(serializer.data)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    filterset_class = ProductFilter
    search_fields = ["name", "description"]
    ordering_fields = ["base_price", "created_at", "avg_rating", "review_count"]
    ordering = ["-created_at"]
    lookup_field = "slug"

    def get_queryset(self):
        return (
            Product.objects.filter(is_available=True)
            .select_related("seller", "category", "brand")
            .prefetch_related(
                Prefetch(
                    "images",
                    queryset=ProductImage.objects.order_by("order"),
                    to_attr="prefetched_images",
                ),
                Prefetch(
                    "variants",
                    queryset=ProductVariant.objects.filter(is_active=True).prefetch_related(
                        "attributes__attribute"
                    ),
                    to_attr="active_variants",
                ),
            )
            .annotate(
                avg_rating=Avg("reviews__rating", filter=Q(reviews__is_approved=True)),
                review_count=Count("reviews", filter=Q(reviews__is_approved=True)),
            )
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer

    @action(
        detail=True,
        methods=["get", "post"],
        url_path="reviews",
    )
    def reviews(self, request, slug=None):
        """
        GET  /catalog/products/{slug}/reviews/ — lista avaliações aprovadas (público)
        POST /catalog/products/{slug}/reviews/ — envia avaliação (autenticado)
        """
        product = self.get_object()

        if request.method == "POST":
            if not request.user.is_authenticated:
                return Response(
                    {"detail": "Autenticação necessária para avaliar."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            if ReviewRating.objects.filter(product=product, user=request.user).exists():
                return Response(
                    {"detail": "Você já avaliou este produto."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            serializer = SubmitReviewSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(product=product, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # GET
        reviews = (
            ReviewRating.objects.filter(product=product, is_approved=True)
            .select_related("user")
            .order_by("-created_at")
        )
        serializer = ReviewSerializer(reviews, many=True, context={"request": request})
        return Response(serializer.data)
