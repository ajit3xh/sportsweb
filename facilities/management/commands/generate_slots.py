from django.core.management.base import BaseCommand
from facilities.models import TimeSlot
from datetime import time, timedelta


class Command(BaseCommand):
    help = 'Generate 45-minute time slots for morning and evening sessions'

    def handle(self, *args, **options):
        # Clear existing slots (optional - comment out to keep existing)
        # TimeSlot.objects.all().delete()
        # self.stdout.write(self.style.WARNING('Deleted existing time slots'))

        slots_created = 0
        
        # Morning slots: 6:00 AM to 12:00 PM (45 minutes each, starting on the hour)
        morning_start = 6
        morning_end = 12
        
        for hour in range(morning_start, morning_end):
            start_time = time(hour, 0)
            end_time = time(hour, 45)
            
            # Create the slot
            slot, created = TimeSlot.objects.get_or_create(
                start_time=start_time,
                end_time=end_time,
                session='morning',
                defaults={
                    'start_time': start_time,
                    'end_time': end_time,
                    'session': 'morning'
                }
            )
            
            if created:
                slots_created += 1
                self.stdout.write(self.style.SUCCESS(
                    f'Created morning slot: {start_time.strftime("%H:%M")} - {end_time.strftime("%H:%M")}'
                ))
        
        # Evening slots: 4:00 PM to 10:00 PM (45 minutes each, starting on the hour)
        evening_start = 16 # 4 PM
        evening_end = 22   # 10 PM
        
        for hour in range(evening_start, evening_end):
            start_time = time(hour, 0)
            end_time = time(hour, 45)
            
            # Create the slot
            slot, created = TimeSlot.objects.get_or_create(
                start_time=start_time,
                end_time=end_time,
                session='evening',
                defaults={
                    'start_time': start_time,
                    'end_time': end_time,
                    'session': 'evening'
                }
            )
            
            if created:
                slots_created += 1
                self.stdout.write(self.style.SUCCESS(
                    f'Created evening slot: {start_time.strftime("%H:%M")} - {end_time.strftime("%H:%M")}'
                ))
        
        self.stdout.write(self.style.SUCCESS(
            f'\nSuccessfully created {slots_created} new time slots (Hourly 45-min sessions)'
        ))
        self.stdout.write(self.style.SUCCESS(
            f'Total slots in database: {TimeSlot.objects.count()}'
        ))
