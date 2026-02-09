from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Payment
from facilities.models import Booking
import uuid

@login_required
def process_payment(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id, user=request.user)
    
    if request.method == 'POST':
        # Simulate Success
        amount = 100.00 # Fixed amount for demo
        payment = Payment.objects.create(
            user=request.user,
            booking=booking,
            amount=amount,
            payment_type='single_game',
            payment_status='success',
            transaction_id=str(uuid.uuid4())
        )
        
        messages.success(request, "Booking Confirmed! Payment Successful.")
        return redirect('facilities:my_bookings')

    return render(request, 'payments/process.html', {'booking': booking})
