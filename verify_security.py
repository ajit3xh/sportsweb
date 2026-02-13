import os
import django
import random
import string
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_management_system.settings')
django.setup()

from users.models import User
from django.test import Client

def verify_security_features():
    print("Verifying Security Features...")
    client = Client()
    
    # Setup User & Email
    email = f"user_{random.randint(1000,9999)}@example.com"
    phone = f"{random.randint(7000000000, 9999999999)}"
    username = f"sec_user_{random.randint(1000,9999)}"
    password = "old_password_123"
    
    print(f"\n[Setup] Creating user {username} with email {email}")
    user = User.objects.create_user(username=username, email=email, password=password, phone_number=phone)
    user.save()
    
    # 1. Test Login with Email
    print("\n[Test 1] Login with Email")
    resp = client.post('/users/login/', {'username': email, 'password': password})
    if resp.status_code == 302 and 'home' in resp.url: # Adjusted since 'dashboard' vs 'home'
         print("  PASS: Email Login Successful")
    else:
         print(f"  FAIL: {resp.url} (Status: {resp.status_code})")
         if resp.context and 'form' in resp.context:
             print(f"  Form Errors: {resp.context['form'].errors}")

    # 2. Test Unique Registration (Phone)
    print("\n[Test 2] Unique Registration (Duplicate Phone)")
    # Try creating another user with same phone
    from users.forms import UserRegistrationForm
    form_data = {
        'username': 'new_user_dup',
        'email': 'new@example.com',
        'password': 'pass',
        'confirm_password': 'pass',
        'phone_number': phone, # SAME PHONE
        'full_name': 'Test Duplicate',
        'address': 'Addr',
        'dob': '2000-01-01',
        # other required fields?
    }
    # Direct model check would raise IntegrityError, testing Form validation
    form = UserRegistrationForm(data=form_data)
    if not form.is_valid():
        if 'phone_number' in form.errors and "already exists" in str(form.errors['phone_number']):
            print("  PASS: Duplicate Phone Blocked by Form")
        else:
             print(f"  FAIL: Validation failed but not for phone uniqueness? {form.errors}")
    else:
        print("  FAIL: Form Validated (Should have failed)")

    # 3. Test Forgot Password
    print("\n[Test 3] Forgot Password Flow")
    session = client.session
    client.logout()
    
    # Request OTP
    resp = client.post('/users/forgot-password/', {'email': email})
    if resp.status_code == 302 and 'verify-otp' in resp.url:
        print("  PASS: OTP Request Redirected")
        # Get OTPs from session
        session = client.session
        otp_email = session.get('otp_email')
        otp_mobile = session.get('otp_mobile')
        # print(f"  Debug: Retrieved OTPs: {otp_email}, {otp_mobile}")
        
        # Verify OTP
        resp = client.post('/users/verify-otp/', {'email_otp': otp_email, 'mobile_otp': otp_mobile})
        if resp.status_code == 302 and 'reset-password' in resp.url:
            print("  PASS: OTP Verified")
            
            # Reset Password
            new_pass = "new_password_456"
            resp = client.post('/users/reset-password/', {'new_password': new_pass, 'confirm_password': new_pass})
            
            if resp.status_code == 302 and 'login' in resp.url:
                 print("  PASS: Password Reset Redirected to Login")
                 
                 # Login with New Pass
                 resp = client.post('/users/login/', {'username': email, 'password': new_pass})
                 if resp.status_code == 302:
                     print("  PASS: Login with NEW Password Successful")
                 else:
                     print("  FAIL: Login with New Password Failed")
            else:
                 print(f"  FAIL: Reset Password Submit Failed {resp.url}")
        else:
            print(f"  FAIL: OTP Verification Failed {resp.url}")
    else:
        print(f"  FAIL: Forgot Password Request Failed {resp.url}")

if __name__ == '__main__':
    verify_security_features()
