from django.db import models
from users.models import User
from facilities.models import Booking

class Payment(models.Model):
    PAYMENT_TYPE_CHOICES = [
        ('single_game', 'Single Game'),
        ('membership', 'Membership'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('pending', 'Pending'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True) # Optional - for old records
    membership = models.ForeignKey('users.Membership', on_delete=models.SET_NULL, null=True, blank=True) # For membership purchases
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.amount} ({self.payment_status})"
