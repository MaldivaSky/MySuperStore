from django.contrib import admin
from .models import Category, Brand, Product, ProductImage, ProductVariant, Attribute, AttributeValue, ReviewRating


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "parent", "order", "is_active")
    list_select_related = ("parent",)
    list_filter = ("is_active", "parent")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name",)
    prepopulated_fields = {"slug": ("name",)}


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "seller", "category", "base_price", "is_available", "created_at")
    list_select_related = ("seller", "category")
    list_filter = ("is_available", "category", "seller")
    search_fields = ("name", "sku")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline, ProductVariantInline]
    readonly_fields = ("created_at", "updated_at")


@admin.register(Attribute)
class AttributeAdmin(admin.ModelAdmin):
    list_display = ("name",)


@admin.register(AttributeValue)
class AttributeValueAdmin(admin.ModelAdmin):
    list_display = ("attribute", "value")
    list_select_related = ("attribute",)
    list_filter = ("attribute",)


@admin.register(ReviewRating)
class ReviewRatingAdmin(admin.ModelAdmin):
    list_display = ("product", "user", "rating", "is_approved", "created_at")
    list_select_related = ("product", "user")
    list_filter = ("is_approved", "rating")
    search_fields = ("product__name", "user__email")
    actions = ["approve_reviews"]

    @admin.action(description="Aprovar avaliações selecionadas")
    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)
