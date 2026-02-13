import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_management_system.settings')
django.setup()

from users.models import User
from django.db.models import Count

def run():
    print("Checking for duplicates...")
    duplicates = User.objects.values('email').annotate(count=Count('email')).filter(count__gt=1)
    
    for entry in duplicates:
        email = entry['email']
        if not email:
            continue
            
        print(f"Fixing duplicates for: {email}")
        users = User.objects.filter(email=email).order_by('id')
        for i, user in enumerate(users[1:], start=1):
            user.email = f"dup_{i}_{user.id}_{user.email}"
            user.save()
            print(f"Updated user {user.username} email to {user.email}")
            
    # Fix empty emails
    print("Checking for empty emails...")
    empty_emails = User.objects.filter(email="")
    for user in empty_emails:
        user.email = f"missing_{user.id}@example.com"
        user.save()
        print(f"Updated user {user.username} to {user.email}")
        
    print("Done fixing emails.")

if __name__ == '__main__':
    run()
