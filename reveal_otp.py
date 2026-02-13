
import os
import django
import sys

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_management_system.settings')
django.setup()

from django.contrib.sessions.models import Session
from django.utils import timezone

def get_latest_otp():
    # Get valid sessions
    sessions = Session.objects.filter(expire_date__gt=timezone.now()).order_by('-expire_date')
    
    for session in sessions:
        try:
            data = session.get_decoded()
            if 'reg_otp_mobile' in data:
                print(f"Found OTPs in recent session (Key: {session.session_key}):")
                print(f"Mobile OTP: {data['reg_otp_mobile']}")
                print(f"Aadhaar OTP: {data['reg_otp_aadhaar']}")
                return
        except Exception as e:
            continue
            
    print("No registration OTPs found in active sessions.")

if __name__ == '__main__':
    get_latest_otp()
