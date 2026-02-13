import os
import django
from datetime import date, timedelta
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_management_system.settings')
django.setup()

from users.models import User, Membership, MembershipTier, Category
from facilities.models import Facility, TimeSlot, Booking, FacilityClosure
from django.test import Client

from django.test import Client, override_settings

@override_settings(ALLOWED_HOSTS=['*', 'testserver'])
def verify_rules():
    print("Verifying Booking Rules...")
    client = Client()
    
    # Setup Data
    user, _ = User.objects.get_or_create(username='rule_tester')
    user.set_password('pass')
    user.status = 'approved'
    # Clean up old category if exists
    Category.objects.filter(name='Individual_Test').delete()
    user.category = Category.objects.create(name='Individual_Test')
    user.save()
    
    # Ensure active membership
    tier, _ = MembershipTier.objects.get_or_create(
        name='Test Tier', 
        category=user.category,
        defaults={'duration_months': 1, 'base_price': 100}
    )
    Membership.objects.update_or_create(
        user=user,
        defaults={'membership_tier': tier, 'start_date': date.today(), 'end_date': date.today() + timedelta(days=30), 'is_active': True, 'total_amount_paid': 100}
    )
    print(f"User {user.username} setup with active membership.")
    
    client.force_login(user)
    
    # Facilities & Slots
    f1, _ = Facility.objects.get_or_create(facility_name='Badminton', max_duration=60)
    f2, _ = Facility.objects.get_or_create(facility_name='Tennis', max_duration=60)
    
    # Ensure slots exist for testing
    import datetime
    slot_m, _ = TimeSlot.objects.get_or_create(start_time=datetime.time(8,0), end_time=datetime.time(9,0), session='morning')
    slot_e, _ = TimeSlot.objects.get_or_create(start_time=datetime.time(18,0), end_time=datetime.time(19,0), session='evening')

    # Dates
    today = date.today()
    tomorrow = today + timedelta(days=1)
    day_after = today + timedelta(days=2)
    
    # Clear previous bookings
    Booking.objects.filter(user=user).delete()
    FacilityClosure.objects.all().delete()
    
    def check_resp(resp, expected_url_part, test_name):
        print(f"\n[{test_name}]")
        if resp.status_code == 302:
            if expected_url_part in resp.url:
                print("  PASS")
            else:
                print(f"  FAIL: Redirected to {resp.url} instead of *{expected_url_part}*")
        else:
            print(f"  FAIL: Status {resp.status_code}")
            # print(resp.content.decode()[:500]) # Debug

    # TEST 1: Booking Success
    resp = client.post(f'/facilities/book/{f1.id}/', {'slot': slot_m.id, 'booking_date': tomorrow})
    check_resp(resp, 'my_bookings', 'Test 1: Booking Success')
        
    # TEST 2: Future Booking Limit
    # Booking day_after should fail because we already have a booking for 'tomorrow' (Count=1 distinct future day)
    resp = client.post(f'/facilities/book/{f1.id}/', {'slot': slot_m.id, 'booking_date': day_after})
    # Expect redirect back to facility book page
    check_resp(resp, f'/facilities/book/{f1.id}/', 'Test 2: Future Booking Limit')

    # TEST 3: Shift Limit (Same Day, Same Shift)
    # Booking Tomorrow Morning again (same shift, different facility)
    resp = client.post(f'/facilities/book/{f2.id}/', {'slot': slot_m.id, 'booking_date': tomorrow})
    check_resp(resp, f'/facilities/book/{f2.id}/', 'Test 3: Shift Limit')

    # TEST 4: Diversity Rule (Same Day, Different Shift, Same Game)
    # Booking Tomorrow Evening (Badminton) - Same game, diff shift. Should FAIL (unless <1h).
    # Since it's tomorrow, it's definitely > 1h.
    resp = client.post(f'/facilities/book/{f1.id}/', {'slot': slot_e.id, 'booking_date': tomorrow})
    check_resp(resp, f'/facilities/book/{f1.id}/', 'Test 4: Game Diversity Rule')

    # TEST 6: Closure
    FacilityClosure.objects.create(date=day_after, description="Maintenance")
    # Clear bookings to allow future booking attempt on day_after
    Booking.objects.filter(user=user).delete()
    
    resp = client.post(f'/facilities/book/{f1.id}/', {'slot': slot_m.id, 'booking_date': day_after})
    check_resp(resp, f'/facilities/book/{f1.id}/', 'Test 6: Facility Closure')
        
if __name__ == '__main__':
    verify_rules()
