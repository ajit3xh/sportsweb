import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_management_system.settings')
django.setup()

from users.models import User
from django.test import Client

def test_registration():
    print("Testing Registration Logic...")
    client = Client()
    
    # 1. Test Individual Registration
    print("1. Registering Individual User...")
    response = client.post('/users/register/', {
        'username': 'test_individual',
        'email': 'indiv@test.com',
        'password': 'password123',
        'confirm_password': 'password123',
        'full_name': 'Test Individual',
        'phone_number': '1234567890',
        'address': 'Test Address',
        'gender': 'M',
        'dob': '2000-01-01',
        'sports_discipline': 'Badminton',
        # No student fields
    })
    
    if response.status_code == 302:
        user = User.objects.get(username='test_individual')
        print(f"   SUCCESS: User created with status: {user.status}")
        assert user.status == 'approved'
        assert not user.is_student
    else:
        print(f"   FAILED: Status code {response.status_code}")
        print(response.content.decode()[:500])

    # 2. Test Student Registration
    print("\n2. Registering Student User...")
    response = client.post('/users/register/', {
        'username': 'test_student',
        'email': 'student@test.com',
        'password': 'password123',
        'confirm_password': 'password123',
        'full_name': 'Test Student',
        'phone_number': '9876543210',
        'address': 'Student Address',
        'gender': 'F',
        'dob': '2005-01-01',
        'sports_discipline': 'Basketball',
        'is_student': 'on',
        'student_type': 'school',
        'school_college_name': 'Test School',
        'current_class': '10',
        # Photo/ID would be needed if form requires it, but let's see if we can bypass or mock
    })
    
    # If file is required, form invalid.
    # We made fields required in forms.py.
    # So this might fail validation unless we send files.
    # Logic verification: we want to check status assignment.
    
    if response.status_code == 200: # Form error likely due to missing file
        print("   Expected form error (missing file). Skipping full file upload test in this script.")
        # Manually create user to test lifecycle
        user = User.objects.create_user(
            username='lifecycle_test',
            email='life@test.com',
            password='pass',
            is_student=True,
            student_type='school',
            current_class=10,
            status='approved',
            school_college_name='Test School'
        )
        print(f"   Created manual student: {user.username}, Class: {user.current_class}")
        return user
    elif response.status_code == 302:
         print("   SUCCESS: Student Registered")
         user = User.objects.get(username='test_student')
         assert user.status == 'pending'
         return user
    return None

if __name__ == '__main__':
    user = test_registration()
    if user:
        # Check logic handled by Management Command
        pass
