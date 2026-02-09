from django.contrib import admin
from .models import Facility, TimeSlot, Booking, FacilityPricing, GalleryImage

class FacilityPricingInline(admin.TabularInline):
    model = FacilityPricing
    extra = 1

@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ('facility_name', 'max_duration', 'is_active')
    inlines = [FacilityPricingInline]

@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ('start_time', 'end_time', 'session')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'facility', 'slot', 'booking_date', 'status')
    list_filter = ('status', 'booking_date', 'facility')

@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ('title', 'uploaded_at')
