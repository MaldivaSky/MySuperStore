from django.contrib import admin
from .models import Payment, Payout, CommissionEntry


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("order", "method", "amount", "status", "paid_at", "created_at")
    list_filter = ("method", "status")
    search_fields = ("order__order_number", "mp_payment_id")
    readonly_fields = ("created_at", "updated_at", "raw_response", "mp_payment_id")


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ("seller", "amount", "status", "scheduled_for", "processed_at")
    list_filter = ("status",)
    search_fields = ("seller__store_name",)
    readonly_fields = ("created_at", "processed_at")


@admin.register(CommissionEntry)
class CommissionEntryAdmin(admin.ModelAdmin):
    list_display = ("sub_order", "amount", "rate", "created_at")
    readonly_fields = ("created_at",)
