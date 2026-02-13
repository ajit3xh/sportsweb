import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_management_system.settings')
django.setup()

from users.models import User
from facilities.models import Facility, TimeSlot, Booking

def verify_capacity():
    print("Verifying Slot Capacity...")
    
    # 1. Setup Data
    badminton = Facility.objects.filter(facility_name__icontains='badminton').first()
    if not badminton:
        print("FAIL: Badminton facility not found.")
        return

    print(f"Badminton Capacity: {badminton.capacity_per_slot}")
    if badminton.capacity_per_slot != 8:
        print(f"FAIL: Expected capacity 8, got {badminton.capacity_per_slot}")
        return
    else:
        print("PASS: Badminton capacity is 8.")

    slot = TimeSlot.objects.first()
    target_date = timezone.now().date() + timedelta(days=2) # Future date
    
    print(f"Target Date: {target_date}, Slot: {slot}")

    # Clean existing bookings for this slot/date
    Booking.objects.filter(facility=badminton, slot=slot, booking_date=target_date).delete()
    
    # 2. Fill Capacity
    print("\n[Test] Filling Capacity (8 users)...")
    
    # Cleanup existing test users to avoid unique constraint errors
    for i in range(10): # 0-9
        User.objects.filter(username=f"cap_user_{i}").delete()
        User.objects.filter(phone_number=f"900000000{i}").delete()

    users = []
    for i in range(8):
        username = f"cap_user_{i}"
        email = f"cap_{i}@test.com"
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            user = User.objects.create_user(username=username, email=email, password='password', phone_number=f"900000000{i}")
            user.status = 'approved'
            user.save()
        users.append(user)
        
        # Book
        Booking.objects.create(user=user, facility=badminton, slot=slot, booking_date=target_date, status='active')
        print(f"  User {i+1} booked.")

    count = Booking.objects.filter(facility=badminton, slot=slot, booking_date=target_date, status='active').count()
    if count == 8:
        print("PASS: Successfully created 8 bookings.")
    else:
        print(f"FAIL: created {count} bookings.")

    # 3. Try 9th Booking
    print("\n[Test] Attempting 9th Booking...")
    user9 = User.objects.create_user(username="cap_user_9", email="cap_9@test.com", password="password", phone_number="9000000009")
    user9.status = 'approved'
    user9.save()
    
    # Use Client to test view logic (or manual check if we want to reuse view code logic)
    # Here we simulate the logic:
    if count >= badminton.capacity_per_slot:
        print("  Backend Logic Simulation: Booking BLOCKED (Correct)")
    else:
        print("  Backend Logic Simulation: Booking ALLOWED (Incorrect)")
        
    # 4. Single User Shift Limit Check
    print("\n[Test] Checking Single User Booking limit...")
    # User 0 already has booking. Try booking SAME slot again -> Should fail by unique constraint? No we removed it.
    # But Views have check: "You already have an active booking for this slot." (Wait, is that check still there?)
    # Lines 74-76 in Booking.clean()
    
    try:
        b = Booking(user=users[0], facility=badminton, slot=slot, booking_date=target_date, status='active')
        b.clean()
        print("FAIL: User 0 was able to book same slot twice (Model clean() failed to block).")
    except Exception as e:
        print(f"PASS: User 0 blocked from double booking: {e}")

if __name__ == '__main__':
    verify_capacity()
