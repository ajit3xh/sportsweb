from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'payment_type', 'payment_status', 'created_at')
    list_filter = ('payment_status', 'payment_type')
