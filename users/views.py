from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from .forms import UserRegistrationForm, UserLoginForm
from .models import User
from facilities.models import Facility, FacilityPricing, Category

def home_view(request):
    """Public Landing Page"""
    # Redirect authenticated users to their dashboard
    if request.user.is_authenticated:
        return redirect('users:dashboard')
    
    featured_facilities = Facility.objects.all()[:4] # Show top 4
    return render(request, 'home.html', {'featured_facilities': featured_facilities})

def tariff_view(request):
    """Membership Pricing Table"""
    from .models import MembershipTier
    
    categories = Category.objects.all().order_by('-priority')
    
    # Group membership tiers by duration
    tiers_by_duration = {}
    for duration in [1, 6, 12]:
        tiers_by_duration[duration] = MembershipTier.objects.filter(
            duration_months=duration,
            is_active=True
        ).select_related('category').order_by('category__priority')
    
    return render(request, 'tariff.html', {
        'categories': categories,
        'tiers_by_duration': tiers_by_duration,
        'monthly_tiers': tiers_by_duration.get(1, []),
        'half_yearly_tiers': tiers_by_duration.get(6, []),
        'yearly_tiers': tiers_by_duration.get(12, [])
    })

def register_view(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.status = 'approved' # Auto-approve
            user.save()
            login(request, user)
            return redirect('users:dashboard')
    else:
        form = UserRegistrationForm()
    return render(request, 'users/register.html', {'form': form})

def login_view(request):
    """User Login"""
    if request.method == 'POST':
        form = UserLoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(username=username, password=password)
            if user:
                login(request, user)
                if user.is_staff:
                    return redirect('users:admin_dashboard')
                return redirect('users:dashboard')
            else:
                messages.error(request, "Invalid Credentials")
    else:
        form = UserLoginForm()
    return render(request, 'users/login.html', {'form': form, 'is_admin_login': False})

def admin_login_view(request):
    """Admin Login"""
    if request.method == 'POST':
        form = UserLoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(username=username, password=password)
            if user and user.is_staff:
                login(request, user)
                return redirect('users:admin_dashboard')
            elif user:
               messages.error(request, "Access Denied: Not an Admin")
            else:
                messages.error(request, "Invalid Admin Credentials")
    else:
        form = UserLoginForm()
    return render(request, 'users/admin_login.html', {'form': form})

def logout_view(request):
    logout(request)
    return redirect('home')

@login_required
def dashboard_view(request):
    """User Dashboard"""
    from facilities.models import Booking
    from .models import Membership
    
    # Get active membership
    active_membership = Membership.objects.filter(
        user=request.user,
        is_active=True
    ).select_related('membership_tier').first()
    
    # Calculate days remaining if membership exists
    days_remaining = None
    if active_membership and active_membership.is_valid():
        from django.utils import timezone
        days_remaining = (active_membership.end_date - timezone.now().date()).days
    
    recent_bookings = Booking.objects.filter(user=request.user).order_by('-created_at')[:5]
    
    context = {
        'user': request.user,
        'active_membership': active_membership,
        'days_remaining': days_remaining,
        'recent_bookings': recent_bookings
    }
    return render(request, 'users/dashboard.html', context)

@login_required
def purchase_membership_view(request, tier_id):
    """Purchase membership without admin intervention"""
    from .models import MembershipTier, Membership
    from payments.models import Payment
    from django.utils import timezone
    from datetime import timedelta
    
    # Get the membership tier
    try:
        tier = MembershipTier.objects.select_related('category').get(id=tier_id, is_active=True)
    except MembershipTier.DoesNotExist:
        messages.error(request, "Invalid membership tier selected.")
        return redirect('tariff')
    
    # Check if user already has an active membership
    existing_membership = Membership.objects.filter(
        user=request.user,
        is_active=True
    ).first()
    
    if existing_membership and existing_membership.is_valid():
        messages.warning(request, f"You already have an active membership until {existing_membership.end_date}. Please wait until it expires before purchasing a new one.")
        return redirect('users:dashboard')
    
    if request.method == 'POST':
        # Process the purchase
        start_date = timezone.now().date()
        
        # Calculate end date based on duration
        if tier.duration_months == 1:
            end_date = start_date + timedelta(days=30)
        elif tier.duration_months == 6:
            end_date = start_date + timedelta(days=180)
        elif tier.duration_months == 12:
            end_date = start_date + timedelta(days=365)
        else:
            end_date = start_date + timedelta(days=30 * tier.duration_months)
        
        # Deactivate any old memberships
        Membership.objects.filter(user=request.user).update(is_active=False)
        
        # Create new membership (auto-approved)
        membership = Membership.objects.create(
            user=request.user,
            membership_tier=tier,
            start_date=start_date,
            end_date=end_date,
            is_active=True,
            total_amount_paid=tier.base_price
        )
        
        # Create payment record (mock payment - auto-completed)
        Payment.objects.create(
            user=request.user,
            membership=membership,
            payment_type='membership',
            amount=tier.base_price,
            payment_status='success',
            transaction_id=f"MOCK-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        )
        
        messages.success(request, f"🎉 Membership purchased successfully! Your {tier.name} is now active until {end_date.strftime('%B %d, %Y')}.")
        return redirect('users:dashboard')
    
    # GET request - show confirmation page
    context = {
        'tier': tier,
        'user': request.user
    }
    return render(request, 'users/purchase_membership.html', context)

@login_required
def profile_view(request):
    """User Profile Page"""
    from facilities.models import Booking
    from .models import Membership
    
    active_membership = Membership.objects.filter(user=request.user, is_active=True).first()
    total_bookings = Booking.objects.filter(user=request.user).count()
    
    context = {
        'active_membership': active_membership,
        'total_bookings': total_bookings,
        'user': request.user
    }
    return render(request, 'users/profile.html', context)

@login_required
def settings_view(request):
    """User Settings Page (Placeholder)"""
    return render(request, 'users/settings.html', {'user': request.user})

def about_us_view(request):
    """About Us Page"""
    return render(request, 'about_us.html')
