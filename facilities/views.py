from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from .models import Facility, TimeSlot, Booking, FacilityPricing
from payments.models import Payment
import uuid

@login_required
def facility_list(request):
    facilities = Facility.objects.filter(is_active=True)
    return render(request, 'facilities/list.html', {'facilities': facilities})

@login_required
def book_facility(request, facility_id):
    facility = get_object_or_404(Facility, pk=facility_id)
    slots = TimeSlot.objects.all()
    user_category = request.user.category
    
    # Check if user has an active membership
    from users.models import Membership
    active_membership = Membership.objects.filter(
        user=request.user,
        is_active=True
    ).first()
    
    has_valid_membership = active_membership and active_membership.is_valid() if active_membership else False
    
    if request.method == 'POST':
        if not has_valid_membership:
            messages.error(request, "You need an active membership to book facilities. Please purchase a membership first.")
            return redirect('tariff')  # Redirect to tariff/membership page
        
        slot_id = request.POST.get('slot')
        booking_date = request.POST.get('booking_date')
        
        try:
            slot = TimeSlot.objects.get(pk=slot_id)
        except TimeSlot.DoesNotExist:
            messages.error(request, "The selected time slot is no longer available. Please refresh and try again.")
            return redirect('facilities:book', facility_id=facility.id)
        
        # Validation - check if slot is already booked
        if Booking.objects.filter(facility=facility, slot=slot, booking_date=booking_date, status='active').exists():
            messages.error(request, "Slot already booked!")
            return redirect('facilities:book', facility_id=facility.id)

        try:
            booking = Booking(
                user=request.user,
                facility=facility,
                slot=slot,
                booking_date=booking_date,
                status='active'  # Auto-approve for members
            )
            booking.clean()
            booking.save()
            
            messages.success(request, f"Successfully booked {facility.facility_name} for {booking_date}!")
            return redirect('facilities:my_bookings')
            
        except Exception as e:
            messages.error(request, str(e))
            return redirect('facilities:book', facility_id=facility.id)

    return render(request, 'facilities/book.html', {
        'facility': facility, 
        'slots': slots,
        'today': timezone.now().date(),
        'user_category': user_category,
        'active_membership': active_membership,
        'has_valid_membership': has_valid_membership
    })


@login_required
def my_bookings(request):
    bookings = Booking.objects.filter(user=request.user).order_by('-booking_date')
    return render(request, 'facilities/my_bookings.html', {'bookings': bookings})

def gallery_view(request):
    from .models import GalleryImage
    images = GalleryImage.objects.all().order_by('-uploaded_at')
    return render(request, 'facilities/gallery.html', {'images': images})

@login_required
def calendar_view(request):
    """Display calendar view with facility availability"""
    import json
    from datetime import datetime, timedelta
    
    facilities = Facility.objects.filter(is_active=True)
    slots = TimeSlot.objects.all()
    
    # Get bookings for the next 30 days
    today = timezone.now().date()
    end_date = today + timedelta(days=30)
    
    bookings = Booking.objects.filter(
        booking_date__gte=today,
        booking_date__lte=end_date,
        status='active'
    ).values('facility_id', 'slot_id', 'booking_date')
    
    # Convert to JSON for JavaScript
    bookings_list = []
    for booking in bookings:
        bookings_list.append({
            'facility_id': booking['facility_id'],
            'slot_id': booking['slot_id'],
            'date': booking['booking_date'].strftime('%Y-%m-%d')
        })
    
    return render(request, 'facilities/calendar.html', {
        'facilities': facilities,
        'slots': slots,
        'bookings_json': json.dumps(bookings_list),
        'today': today,
        'total_slots': slots.count()
    })
