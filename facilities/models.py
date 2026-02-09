from django.db import models
from users.models import User, Category
from django.core.exceptions import ValidationError

class Facility(models.Model):
    facility_name = models.CharField(max_length=50)
    max_duration = models.IntegerField(help_text="Max duration in minutes")
    is_active = models.BooleanField(default=True)
    image = models.ImageField(upload_to='facility_images/', null=True, blank=True)

    def __str__(self):
        return self.facility_name

class FacilityPricing(models.Model):
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='pricing')
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        unique_together = ('facility', 'category')

    def __str__(self):
        return f"{self.facility} - {self.category}: ${self.price}"

class GalleryImage(models.Model):
    title = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to='gallery/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or "Image"

class TimeSlot(models.Model):
    SESSION_CHOICES = [
        ('morning', 'Morning'),
        ('evening', 'Evening'),
    ]
    start_time = models.TimeField()
    end_time = models.TimeField()
    session = models.CharField(max_length=10, choices=SESSION_CHOICES)

    def __str__(self):
        return f"{self.start_time} - {self.end_time} ({self.session})"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('active', 'Active'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE)
    slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE)
    booking_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('facility', 'slot', 'booking_date')

    def clean(self):
        if self.user.status != 'approved':
            raise ValidationError("User is not approved to make bookings.")
        
        overlapping_bookings = Booking.objects.filter(
            user=self.user,
            booking_date=self.booking_date,
            slot=self.slot,
            status='active'
        ).exclude(id=self.id)
        
        if overlapping_bookings.exists():
             raise ValidationError("You already have an active booking for this slot.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user} - {self.facility} on {self.booking_date}"
