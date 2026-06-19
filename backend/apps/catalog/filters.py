import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug", lookup_expr="exact")
    seller = django_filters.CharFilter(field_name="seller__slug", lookup_expr="exact")
    brand = django_filters.CharFilter(field_name="brand__slug", lookup_expr="exact")
    min_price = django_filters.NumberFilter(field_name="base_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="base_price", lookup_expr="lte")
    
    # Novos filtros de Promoção
    discount_min = django_filters.NumberFilter(method="filter_discount_min")
    flash_sale_only = django_filters.BooleanFilter(method="filter_flash_sale")

    class Meta:
        model = Product
        fields = ["category", "seller", "brand", "min_price", "max_price"]

    def filter_discount_min(self, queryset, name, value):
        from django.utils import timezone
        now = timezone.now()
        # Filtra os que tem promocoes ativas
        qs = queryset.filter(
            promotional_price__isnull=False,
            promo_starts_at__lte=now,
            promo_ends_at__gte=now
        )
        # Filtra na memória pois o django orm math pode ser complexo, mas dá pra usar F() expressions
        from django.db.models import F, FloatField, ExpressionWrapper
        # (base - promo) / base * 100 >= value
        qs = qs.annotate(
            discount_calc=ExpressionWrapper(
                ((F('base_price') - F('promotional_price')) / F('base_price')) * 100.0,
                output_field=FloatField()
            )
        ).filter(discount_calc__gte=value)
        return qs

    def filter_flash_sale(self, queryset, name, value):
        if value:
            from django.utils import timezone
            now = timezone.now()
            return queryset.filter(
                promotional_price__isnull=False,
                promo_starts_at__lte=now,
                promo_ends_at__gte=now
            )
        return queryset
