from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.utils import timezone
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
    
    # Get user's active membership if authenticated
    active_membership = None
    if request.user.is_authenticated:
        from .models import Membership
        active_membership = Membership.objects.filter(
            user=request.user,
            is_active=True,
            end_date__gte=timezone.now().date()
        ).select_related('membership_tier').first()

        if active_membership:
             # Formatted duration for the active plan card
            months = active_membership.membership_tier.duration_months
            if months == 1:
                active_membership.membership_tier.display_duration = "30 Days"
            elif months == 6:
                active_membership.membership_tier.display_duration = "6 Months"
            elif months == 12:
                active_membership.membership_tier.display_duration = "1 Year"
            else:
                active_membership.membership_tier.display_duration = f"{months} Months"
    
    # Group membership tiers by duration and annotate with status
    def annotate_tiers(tiers, active_mem):
        result = []
        for tier in tiers:
            # Set display duration text
            if tier.duration_months == 1:
                tier.display_duration = "30 Days"
            elif tier.duration_months == 6:
                tier.display_duration = "6 Months"
            elif tier.duration_months == 12:
                tier.display_duration = "1 Year"
            else:
                tier.display_duration = f"{tier.duration_months} Months"

            if not request.user.is_authenticated:
                tier.status = 'login'
            elif active_mem and active_mem.membership_tier.id == tier.id:
                tier.status = 'active'
            elif active_mem and (tier.duration_months > active_mem.membership_tier.duration_months or (tier.duration_months == active_mem.membership_tier.duration_months and tier.base_price > active_mem.membership_tier.base_price)):
                tier.status = 'upgrade'
            elif not active_mem:
                tier.status = 'purchase'
            else:
                tier.status = 'none'
            result.append(tier)
        return result
    
    monthly = MembershipTier.objects.filter(duration_months=1, is_active=True).select_related('category').order_by('category__priority')
    half_yearly = MembershipTier.objects.filter(duration_months=6, is_active=True).select_related('category').order_by('category__priority')
    yearly = MembershipTier.objects.filter(duration_months=12, is_active=True).select_related('category').order_by('category__priority')
    
    return render(request, 'tariff.html', {
        'categories': categories,
        'monthly_tiers': annotate_tiers(monthly, active_membership),
        'half_yearly_tiers': annotate_tiers(half_yearly, active_membership),
        'yearly_tiers': annotate_tiers(yearly, active_membership),
        'active_membership': active_membership,
    })

def register_view(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            
            # Initial state: Not verified
            user.is_mobile_verified = False
            user.is_aadhaar_verified = False
            # We save the user now so we have an ID
            user.save()
            
            # Generate Demo OTPs
            import random
            otp_mobile = str(random.randint(1000, 9999))
            otp_aadhaar = str(random.randint(1000, 9999))
            
            print(f"\n[DEMO] Registration OTPs for {user.username}:")
            print(f"   Mobile OTP: {otp_mobile}")
            print(f"   Aadhaar OTP: {otp_aadhaar}\n")
            
            # Store in session
            request.session['reg_user_id'] = user.id
            request.session['reg_otp_mobile'] = otp_mobile
            request.session['reg_otp_aadhaar'] = otp_aadhaar
            
            messages.info(request, "Please verify your mobile and Aadhaar to complete registration.")
            return redirect('users:verify_registration')
    else:
        form = UserRegistrationForm()
    return render(request, 'users/register.html', {'form': form})

def verify_registration_view(request):
    user_id = request.session.get('reg_user_id')
    if not user_id:
        return redirect('users:register')
        
    if request.method == 'POST':
        input_mobile = request.POST.get('mobile_otp')
        input_aadhaar = request.POST.get('aadhaar_otp')
        
        session_mobile = request.session.get('reg_otp_mobile')
        session_aadhaar = request.session.get('reg_otp_aadhaar')
        
        if input_mobile == session_mobile and input_aadhaar == session_aadhaar:
            try:
                user = User.objects.get(id=user_id)
                user.is_mobile_verified = True
                user.is_aadhaar_verified = True
                
                # Cleanup session keys first (good practice, though we might need user object)
                keys_to_delete = ['reg_user_id', 'reg_otp_mobile', 'reg_otp_aadhaar']
                for key in keys_to_delete:
                    if key in request.session: del request.session[key]

                # Check student status
                if user.is_student:
                    user.status = 'pending'
                    user.save()
                    messages.info(request, "Verification successful! Account pending admin approval.")
                    return redirect('users:login')
                else:
                    user.status = 'approved'
                    user.save()
                    user.backend = 'django.contrib.auth.backends.ModelBackend'
                    login(request, user)
                    messages.success(request, "Verification successful! Welcome to dashboard.")
                    return redirect('users:dashboard')
                
            except User.DoesNotExist:
                messages.error(request, "User not found.")
                return redirect('users:register')
        else:
            messages.error(request, "Invalid OTPs. Please check terminal and try again.")
            
    return render(request, 'users/verify_registration.html')

def login_view(request):
    """User Login"""
    if request.method == 'POST':
        from django.contrib.auth.forms import AuthenticationForm
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                # Check Ban Status
                if user.is_banned():
                    from django.utils import timezone
                    msg = "Your account is permanently banned."
                    if user.banned_until and user.banned_until > timezone.now():
                        msg = f"Your account is banned until {user.banned_until.strftime('%Y-%m-%d %H:%M')}."
                    messages.error(request, msg)
                    return redirect('users:login')
                
                login(request, user)
                messages.info(request, f"You are now logged in as {username}.")
                return redirect('home')
            else:
                messages.error(request, "Invalid username or password.")
        else:
            messages.error(request, "Invalid username or password.")
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
    
    if active_membership:
        months = active_membership.membership_tier.duration_months
        if months == 1:
            active_membership.membership_tier.display_duration = "Monthly Plan"
        elif months == 6:
            active_membership.membership_tier.display_duration = "Half-Yearly Plan"
        elif months == 12:
            active_membership.membership_tier.display_duration = "Yearly Plan"
        else:
            active_membership.membership_tier.display_duration = f"{months} Months Plan"

    # Calculate days remaining if membership exists
    days_remaining = None
    if active_membership and active_membership.is_valid():
        from django.utils import timezone
        days_remaining = (active_membership.end_date - timezone.now().date()).days
    
    recent_bookings = Booking.objects.filter(user=request.user).select_related('facility', 'slot').order_by('-created_at')[:5]
    
    # Format dates for template to avoid potential rendering issues
    valid_until = ""
    if active_membership and active_membership.end_date:
        valid_until = active_membership.end_date.strftime("%B %d, %Y")

    formatted_bookings = []
    for booking in recent_bookings:
        formatted_bookings.append({
            'f_name': booking.facility.facility_name,
            'f_date': booking.booking_date.strftime("%d"),
            'f_month': booking.booking_date.strftime("%b %Y"),
            'slot_time': f"{booking.slot.start_time.strftime('%I:%M %p')} - {booking.slot.end_time.strftime('%I:%M %p')}",
            'f_status': booking.status,
        })

    context = {
        'user': request.user,
        'active_membership': active_membership,
        'days_remaining': days_remaining,
        'recent_bookings': recent_bookings,
        'valid_until': valid_until,
        'formatted_bookings': formatted_bookings
    }
    return render(request, 'users/dashboard_v2.html', context)

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
    
    active_membership = Membership.objects.filter(user=request.user, is_active=True).select_related('membership_tier').first()
    
    if active_membership:
        months = active_membership.membership_tier.duration_months
        if months == 1:
            active_membership.membership_tier.display_duration = "Monthly Plan"
        elif months == 6:
            active_membership.membership_tier.display_duration = "Half-Yearly Plan"
        elif months == 12:
            active_membership.membership_tier.display_duration = "Yearly Plan"
        else:
            active_membership.membership_tier.display_duration = f"{months} Months Plan"

    # Calculate days remaining
    days_remaining = None
    if active_membership and active_membership.is_valid():
        from django.utils import timezone
        days_remaining = (active_membership.end_date - timezone.now().date()).days

    total_bookings = Booking.objects.filter(user=request.user).count()
    
    context = {
        'active_membership': active_membership,
        'days_remaining': days_remaining,
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

def forgot_password_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        try:
            user = User.objects.get(email=email)
            # Generate OTPs
            import random
            otp_email = str(random.randint(100000, 999999))
            otp_mobile = str(random.randint(100000, 999999))
            
            # Simulate Sending
            print(f"SIMULATED OTPs for {user.username}: Email={otp_email}, Mobile={otp_mobile}")
            messages.success(request, f"OTPs sent! (Simulated: Email={otp_email}, Mobile={otp_mobile})")
            
            # Store in session
            request.session['reset_email'] = email
            request.session['otp_email'] = otp_email
            request.session['otp_mobile'] = otp_mobile
            return redirect('users:verify_otp')
            
        except User.DoesNotExist:
            messages.error(request, "Email not found.")
            
    return render(request, 'users/forgot_password.html')

def verify_otp_view(request):
    if 'reset_email' not in request.session:
        return redirect('users:forgot_password')
        
    if request.method == 'POST':
        input_email_otp = request.POST.get('email_otp')
        input_mobile_otp = request.POST.get('mobile_otp')
        
        session_email_otp = request.session.get('otp_email')
        session_mobile_otp = request.session.get('otp_mobile')
        
        if input_email_otp == session_email_otp and input_mobile_otp == session_mobile_otp:
            request.session['reset_verified'] = True
            return redirect('users:reset_password')
        else:
            messages.error(request, "Invalid OTPs. Please try again.")
            
    return render(request, 'users/verify_otp.html')

def reset_password_view(request):
    if not request.session.get('reset_verified') or 'reset_email' not in request.session:
        return redirect('users:forgot_password')
        
    if request.method == 'POST':
        new_pass = request.POST.get('new_password')
        confirm_pass = request.POST.get('confirm_password')
        
        if new_pass != confirm_pass:
            messages.error(request, "Passwords do not match.")
        else:
            email = request.session['reset_email']
            try:
                user = User.objects.get(email=email)
                if user.check_password(new_pass):
                     messages.error(request, "New password cannot be the same as old password.")
                else:
                    user.set_password(new_pass)
                    user.save()
                    # Clear session
                    if 'reset_email' in request.session: del request.session['reset_email']
                    if 'otp_email' in request.session: del request.session['otp_email']
                    if 'otp_mobile' in request.session: del request.session['otp_mobile']
                    if 'reset_verified' in request.session: del request.session['reset_verified']
                    
                    messages.success(request, "Password reset successful! Please login.")
                    return redirect('users:login')
            except User.DoesNotExist:
                messages.error(request, "User not found.")
                
    return render(request, 'users/reset_password.html')

@login_required
def change_password_view(request):
    if request.method == 'POST':
        old_pass = request.POST.get('old_password')
        new_pass = request.POST.get('new_password')
        confirm_pass = request.POST.get('confirm_password')
        
        if not request.user.check_password(old_pass):
            messages.error(request, "Incorrect old password.")
        elif new_pass != confirm_pass:
            messages.error(request, "New passwords do not match.")
        elif old_pass == new_pass:
            messages.error(request, "New password cannot be the same as old password.")
        else:
            request.user.set_password(new_pass)
            request.user.save()
            from django.contrib.auth import update_session_auth_hash
            update_session_auth_hash(request, request.user) # Keep user logged in
            messages.success(request, "Password changed successfully.")
            return redirect('users:settings')
            
    return redirect('users:settings')
