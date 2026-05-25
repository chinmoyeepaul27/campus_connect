from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    department = models.CharField(max_length=100)
    batch = models.CharField(max_length=20)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    student_id = models.CharField(max_length=20, blank=True, null=True, unique=True)


class Club(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    type = models.CharField(max_length=50)
    members_count = models.PositiveIntegerField(default=0)
    meeting_info = models.CharField(max_length=100, blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    icon = models.CharField(max_length=100, blank=True)
    registered_at = models.BooleanField(default=False)
    image = models.ImageField(upload_to='club_images/', blank=True, null=True)
    membership_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('100.00'))
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='managed_clubs', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Membership(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memberships')
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='memberships')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    motivation = models.TextField(blank=True, null=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_memberships')
    
    class Meta:
        unique_together = ('user', 'club')
    
    def __str__(self):
        return f"{self.user.username} - {self.club.name} ({self.status})"

class PaymentTransaction(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('bkash', 'bKash'),
        ('nagad', 'Nagad'),
        ('rocket', 'Rocket'),
        ('bank', 'Bank Transfer'),
        ('card', 'Credit/Debit Card'),
    ]
    
    membership = models.OneToOneField(Membership, on_delete=models.CASCADE, related_name='payment')
    transaction_id = models.CharField(max_length=100, unique=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_reference = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    gateway_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payment {self.transaction_id} - {self.membership}"

class Item(models.Model):
    value = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="items")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.value
    
class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateField()
    time = models.CharField(max_length=50)
    location = models.CharField(max_length=200)
    tags = models.JSONField(default=list, blank=True)  # or use ManyToMany if you want a Tag model
    type = models.CharField(max_length=50, blank=True)  # e.g., 'tech', 'cultural'
    icon = models.CharField(max_length=100, blank=True)  # e.g., 'fas fa-guitar'
    registered_users = models.ManyToManyField(User, related_name="registered_events", blank=True)
    club = models.ForeignKey('Club', on_delete=models.CASCADE, related_name='events', null=True, blank=True)

    def __str__(self):
        return self.title
    
class Note(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    subject = models.CharField(max_length=100)
    batch = models.CharField(max_length=10)
    semester = models.CharField(max_length=10, blank=True)
    course_code = models.CharField(max_length=20, blank=True)
    tags = models.CharField(max_length=200, blank=True)  # Store as comma-separated
    downloads = models.PositiveIntegerField(default=0)
    file = models.FileField(upload_to='notes/')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('event', 'Event'),
        ('announcement', 'Announcement'),
        ('notes', 'Notes'),
    ]
    title = models.CharField(max_length=200)
    description = models.TextField()
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    icon = models.CharField(max_length=100, blank=True)
    date = models.DateField()
    time = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=200, blank=True)
    rsvp = models.BooleanField(default=False)
    time_ago = models.CharField(max_length=50, blank=True)  # For display, or calculate in serializer

    def __str__(self):
        return self.title


