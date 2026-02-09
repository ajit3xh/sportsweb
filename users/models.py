from django.db import models
from django.contrib.auth.models import AbstractUser

class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    priority = models.IntegerField(default=0, help_text="Higher value means higher priority")
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['-priority']

    def __str__(self):
        return self.name  # Hide priority from end users

class MembershipTier(models.Model):
    """Defines membership pricing tiers (Monthly, Half-Yearly, Yearly)"""
    DURATION_CHOICES = [
        (1, '1 Month'),
        (6, '6 Months'),
        (12, '12 Months'),
    ]
    
    name = models.CharField(max_length=100, help_text="e.g., 'Monthly - Student'")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='membership_tiers')
    duration_months = models.IntegerField(choices=DURATION_CHOICES)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="Discount on facility bookings")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('category', 'duration_months')
        ordering = ['category', 'duration_months']
    
    def __str__(self):
        return f"{self.name} ({self.duration_months} months) - ₹{self.base_price}"

class Membership(models.Model):
    """User's active membership"""
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='memberships')
    membership_tier = models.ForeignKey(MembershipTier, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    total_amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.membership_tier.name} (Active: {self.is_active})"
    
    def is_valid(self):
        """Check if membership is currently valid"""
        from django.utils import timezone
        today = timezone.now().date()
        return self.is_active and self.start_date <= today <= self.end_date

class User(AbstractUser):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('revoked', 'Revoked'),
    ]

    full_name = models.CharField(max_length=100)
    address = models.TextField()
    phone_number = models.CharField(max_length=15)
    aadhaar_number = models.CharField(max_length=12, unique=True, null=True, blank=True)
    
    # Changed from CharField choices to ForeignKey
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    
    photo = models.ImageField(upload_to='user_photos/', null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')

    def __str__(self):
        return f"{self.username} ({self.status})"
