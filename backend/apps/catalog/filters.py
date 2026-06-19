import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug", lookup_expr="exact")
    seller = django_filters.CharFilter(field_name="seller__slug", lookup_expr="exact")
    min_price = django_filters.NumberFilter(field_name="base_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="base_price", lookup_expr="lte")

    class Meta:
        model = Product
        fields = ["category", "seller", "min_price", "max_price"]
