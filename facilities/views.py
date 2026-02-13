from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from django.db.models import Q
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
    print(f"DEBUG: Facility {facility_id} loaded - View Executed")
    slots = list(TimeSlot.objects.all().order_by('start_time'))
    
    # Calculate 40-minute duration for display
    from datetime import datetime, timedelta, date
    for slot in slots:
        # Create a dummy datetime to perform arithmetic
        dt = datetime.combine(date.today(), slot.start_time)
        end_dt = dt + timedelta(minutes=40)
        slot.display_end_time = end_dt.time()

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
            messages.error(request, "You need an active membership to book facilities.")
            return redirect('tariff')
        
        slot_id = request.POST.get('slot')
        booking_date_str = request.POST.get('booking_date')
        
        try:
            from datetime import datetime
            booking_date = datetime.strptime(booking_date_str, '%Y-%m-%d').date()
            slot = TimeSlot.objects.get(pk=slot_id)
        except (ValueError, TimeSlot.DoesNotExist):
            messages.error(request, "Invalid date or time slot.")
            return redirect('facilities:book', facility_id=facility.id)
            
        today = timezone.now().date()
        if booking_date < today:
            messages.error(request, "Cannot book past dates.")
            return redirect('facilities:book', facility_id=facility.id)
            
        # 1. Facility Closure Check
        from .models import FacilityClosure
        closure = FacilityClosure.objects.filter(date=booking_date).filter(Q(facility=facility) | Q(facility__isnull=True)).first()
        if closure:
            messages.error(request, f"Facility closed on {booking_date}: {closure.description}")
            return redirect('facilities:book', facility_id=facility.id)

        # 2. Future Booking Limit (Max 1 distinct future date allowed)
        if booking_date > today:
            # Get all future booking dates for this user
            future_dates = Booking.objects.filter(
                user=request.user, 
                booking_date__gt=today, 
                status='active'
            ).values_list('booking_date', flat=True).distinct()
            
            # If user has future bookings on dates OTHER than the requested date
            existing_future_days = set(future_dates)
            if len(existing_future_days) >= 1 and booking_date not in existing_future_days:
                 messages.error(request, f"You can only have bookings for ONE future day at a time. You already have bookings for {list(existing_future_days)[0]}.")
                 return redirect('facilities:book', facility_id=facility.id)

        # 3. Shift Limit Check (Max 1 booking per shift/session per day)
        # Check if user has ANY booking in this session on this date
        shift_booking = Booking.objects.filter(
            user=request.user,
            booking_date=booking_date,
            slot__session=slot.session,
            status='active'
        ).exists()
        
        if shift_booking:
            messages.error(request, f"You can only make ONE booking per shift ({slot.session}) per day.")
            return redirect('facilities:book', facility_id=facility.id)

        # 4. Game Diversity Rule (Cannot play same game in two shifts, unless urgent)
        # Check if user played SAME facility in OTHER shifts today
        same_game_bookings = Booking.objects.filter(
            user=request.user,
            booking_date=booking_date,
            facility=facility, # Same game
            status='active'
        ).exclude(slot__session=slot.session) # In other sessions
        
        if same_game_bookings.exists():
            # Exception Logic: Allow if booking is < 1 hour from start
            # Combine date and time
            booking_datetime = datetime.combine(booking_date, slot.start_time)
            # Make timezone aware if needed (assuming server is naive or consistent)
            # If start_time is naive and timezone.now() is aware, we need consistency.
            # Lets try mostly safe comparison:
            current_time = datetime.now() # Naive
            time_diff = booking_datetime - current_time
            
            # If booking is in future and diff > 1 hour -> BLOCK
            if time_diff.total_seconds() > 3600:
                 messages.error(request, f"You cannot book {facility.facility_name} in multiple shifts on the same day, unless it is less than 1 hour before the slot starts.")
                 return redirect('facilities:book', facility_id=facility.id)

        # Check Capacity (Replaces global slot check)
        active_bookings_count = Booking.objects.filter(
            facility=facility, 
            slot=slot, 
            booking_date=booking_date, 
            status='active'
        ).count()
        
        if active_bookings_count >= facility.capacity_per_slot:
            messages.error(request, f"Slot is full! (Capacity: {facility.capacity_per_slot})")
            return redirect('facilities:book', facility_id=facility.id)

        try:
            booking = Booking(
                user=request.user,
                facility=facility,
                slot=slot,
                booking_date=booking_date,
                status='active'
            )
            # clean() handles basic validation too
            booking.clean()
            booking.save()
            
            messages.success(request, f"Successfully booked {facility.facility_name} for {booking_date}!")
            return redirect('facilities:my_bookings')
            
        except ValidationError as e:
             messages.error(request, e.message)
             return redirect('facilities:book', facility_id=facility.id)
        except Exception as e:
            messages.error(request, str(e))
            return redirect('facilities:book', facility_id=facility.id)

    # Prepare Calendar Data
    import json
    from .models import FacilityClosure
    
    # 1. Closures
    closures = FacilityClosure.objects.filter(
        date__gte=timezone.now().date()
    ).filter(Q(facility=facility) | Q(facility__isnull=True)).values_list('date', 'description')
    
    closures_data = [{'date': c[0].strftime('%Y-%m-%d'), 'desc': c[1]} for c in closures]
    
    # 2. User Future Bookings
    user_future_bookings = Booking.objects.filter(
        user=request.user,
        booking_date__gt=timezone.now().date(),
        status='active'
    ).values_list('booking_date', flat=True).distinct()
    
    user_future_dates = [d.strftime('%Y-%m-%d') for d in user_future_bookings]

    # 3. Slot Availability (Count per slot per day)
    future_facility_bookings = Booking.objects.filter(
        facility=facility,
        booking_date__gte=timezone.now().date(),
        status='active'
    ).values('booking_date', 'slot_id')
    
    availability_map = {}
    for b in future_facility_bookings:
        d_str = b['booking_date'].strftime('%Y-%m-%d')
        s_id = b['slot_id']
        if d_str not in availability_map: availability_map[d_str] = {}
        availability_map[d_str][s_id] = availability_map[d_str].get(s_id, 0) + 1
        
    return render(request, 'facilities/book.html', {
        'facility': facility, 
        'slots': slots,
        'today': timezone.localtime(timezone.now()).date(),
        'current_datetime': timezone.localtime(timezone.now()), # Local Time passed 
        'user_category': user_category,
        'active_membership': active_membership,
        'has_valid_membership': has_valid_membership,
        # current_datetime removed (duplicate)
        'closures_data': closures_data,
        'user_future_dates': user_future_dates,
        'slot_availability_data': availability_map,
        'facility_capacity': facility.capacity_per_slot
    })


@login_required
def my_bookings(request):
    bookings = Booking.objects.filter(user=request.user).order_by('-booking_date')
    return render(request, 'facilities/my_bookings.html', {
        'bookings': bookings,
        'today': timezone.now().date()
    })

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
        'bookings_json': json.dumps(bookings_list),
        'facilities': facilities,
        'slots': slots
    })
    
@login_required
def cancel_booking(request, booking_id):
    booking = get_object_or_404(Booking, pk=booking_id, user=request.user)
    
    if booking.booking_date < timezone.now().date():
         messages.error(request, "Cannot cancel past bookings.")
    else:
        booking.delete() # Or set status='cancelled' if field exists. I'll check model.
        messages.success(request, "Booking cancelled successfully.")
        
    return redirect('facilities:my_bookings')
