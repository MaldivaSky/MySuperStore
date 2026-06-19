from django.contrib import admin
from .models import Order, SubOrder, OrderItem


class SubOrderInline(admin.TabularInline):
    model = SubOrder
    extra = 0
    readonly_fields = ("commission", "seller_amount")
    show_change_link = True


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "user", "total", "status", "created_at")
    list_select_related = ("user",)
    list_filter = ("status",)
    search_fields = ("order_number", "user__email")
    readonly_fields = ("created_at", "updated_at", "order_number")
    inlines = [SubOrderInline]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("total",)


@admin.register(SubOrder)
class SubOrderAdmin(admin.ModelAdmin):
    list_display = ("order", "seller", "seller_amount", "commission", "status")
    list_select_related = ("order", "seller")
    list_filter = ("status", "seller")
    inlines = [OrderItemInline]
