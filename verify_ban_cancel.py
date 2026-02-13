import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_management_system.settings')
django.setup()

from users.models import User
from facilities.models import Booking, Facility, TimeSlot
from django.test import Client

def verify_features():
    print("Verifying Ban System & Cancellation...")
    client = Client()
    
    # Setup User
    try:
        user = User.objects.get(username='ban_tester')
    except User.DoesNotExist:
        user = User.objects.create(username='ban_tester', email='bantest@example.com')
        
    user.set_password('pass')
    user.status = 'approved'
    user.banned_until = None
    user.is_permanently_banned = False
    user.email = 'bantest@example.com' # Ensure email is set
    user.save()
    
    # 1. Test Login (Success)
    print("\n[Test 1] Login Normal User")
    resp = client.post('/users/login/', {'username': 'ban_tester', 'password': 'pass'})
    if resp.status_code == 302 and 'home' in resp.url: # redirection to home usually
         print("  PASS: Login Successful")
    else:
         print(f"  FAIL: {resp.url} (Status: {resp.status_code})")

    # 2. Test Ban (1 Day)
    print("\n[Test 2] Ban User for 1 Day & Login")
    user.banned_until = timezone.now() + timedelta(days=1)
    user.save()
    
    client.logout()
    resp = client.post('/users/login/', {'username': 'ban_tester', 'password': 'pass'})
    # Expect redirect back to login, or error message.
    # Logic: redirects to 'users:login'
    if resp.status_code == 302 and 'login' in resp.url:
        print("  PASS: Blocked (Redirected to login)")
        # Ideally check message, but URL check suffice for blocking
    else:
        print(f"  FAIL: {resp.url}")

    # 3. Test Booking Cancellation
    print("\n[Test 3] Booking Cancellation")
    # Unban user
    user.banned_until = None
    user.save()
    client.login(username='ban_tester', password='pass')
    
    f, _ = Facility.objects.get_or_create(facility_name='TestFacility', max_duration=60)
    import datetime
    slot, _ = TimeSlot.objects.get_or_create(start_time=datetime.time(10,0), end_time=datetime.time(11,0), session='morning')
    booking_date = timezone.now().date() + timedelta(days=2)
    
    # Create Booking
    booking = Booking.objects.create(user=user, facility=f, slot=slot, booking_date=booking_date, status='active')
    
    # Cancel it
    resp = client.get(f'/facilities/cancel-booking/{booking.id}/') # It's a GET request link usually, logic didn't specify POST
    # My view `cancel_booking` accepts GET? I didn't decorate with require_POST. 
    # Template uses <a href="..."> so it is GET.
    
    booking.refresh_from_db()
    
    if resp.status_code == 302 and 'my_bookings' in resp.url:
         if not Booking.objects.filter(pk=booking.id).exists(): # I used booking.delete() in view
             print("  PASS: Booking Cancelled (Deleted)")
         else:
             print(f"  FAIL: Booking still exists. Status: {booking.status}")
    else:
         print(f"  FAIL: URL {resp.url}")

if __name__ == '__main__':
    verify_features()
