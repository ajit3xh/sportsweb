from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Category, Membership, MembershipTier

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'priority', 'description')
    list_editable = ('priority',)
    ordering = ('-priority',)
    search_fields = ['name']

@admin.register(MembershipTier)
class MembershipTierAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'duration_months', 'base_price', 'discount_percentage', 'is_active']
    list_filter = ['category', 'duration_months', 'is_active']
    search_fields = ['name']
    list_editable = ['base_price', 'discount_percentage', 'is_active']

@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ['user', 'membership_tier', 'start_date', 'end_date', 'is_active', 'total_amount_paid']
    list_filter = ['is_active', 'membership_tier__category', 'start_date']
    search_fields = ['user__username', 'user__full_name']
    date_hierarchy = 'start_date'
    readonly_fields = ['created_at']

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'full_name', 'category', 'status', 'is_staff')
    list_filter = ('category', 'status', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('full_name', 'address', 'phone_number', 'aadhaar_number', 'category', 'photo', 'status')}),
    )

admin.site.register(User, CustomUserAdmin)
