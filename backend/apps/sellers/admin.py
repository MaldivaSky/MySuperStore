from django.contrib import admin
from .models import Seller


@admin.register(Seller)
class SellerAdmin(admin.ModelAdmin):
    list_display = ("store_name", "user", "status", "commission_rate", "mp_authorized", "created_at")
    list_filter = ("status",)
    search_fields = ("store_name", "user__email")
    readonly_fields = ("created_at", "updated_at", "mp_user_id", "mp_token_expires_at")
    actions = ["approve_sellers", "suspend_sellers"]

    @admin.action(description="Aprovar vendedores selecionados")
    def approve_sellers(self, request, queryset):
        queryset.update(status="approved")

    @admin.action(description="Suspender vendedores selecionados")
    def suspend_sellers(self, request, queryset):
        queryset.update(status="suspended")
