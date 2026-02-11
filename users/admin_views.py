from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from facilities.models import Booking, Facility

def is_admin(user):
    return user.is_staff

@user_passes_test(is_admin)
def admin_dashboard(request):
    from users.models import User
    
    # Metrics
    active_bookings_list = Booking.objects.filter(status='active').order_by('-booking_date', 'slot__start_time')
    total_bookings = Booking.objects.count()
    active_bookings = Booking.objects.filter(status='active').count()
    facilities = Facility.objects.all()
    total_users = User.objects.count()
    
    # Revenue calculation (count active bookings as placeholder for now)
    # TODO: Add proper revenue tracking based on FacilityPricing
    total_revenue = active_bookings * 500  # Placeholder calculation
    
    return render(request, 'admin/dashboard.html', {
        'active_bookings_list': active_bookings_list,
        'facilities': facilities,
        'total_bookings': total_bookings,
        'active_bookings': active_bookings,
        'total_users': total_users,
        'total_revenue': total_revenue,
    })

@user_passes_test(is_admin)
def approve_booking(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id)
    booking.status = 'active'
    booking.save()
    messages.success(request, f"Booking #{booking.id} Approved!")
    return redirect('users:admin_dashboard')

@user_passes_test(is_admin)
def reject_booking(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id)
    booking.status = 'cancelled'
    booking.save()
    messages.warning(request, f"Booking #{booking.id} Rejected.")
    return redirect('users:admin_dashboard')
