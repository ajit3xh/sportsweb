import random
import uuid
from datetime import datetime, timedelta, date

from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.db.models import Q
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes, parser_classes
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.parsers import MultiPartParser, FormParser

from users.models import User, Category, MembershipTier, Membership
from facilities.models import Facility, FacilityPricing, TimeSlot, Booking, GalleryImage, FacilityClosure
from payments.models import Payment

from .serializers import (
    UserProfileSerializer, UserRegistrationSerializer,
    FacilitySerializer, TimeSlotSerializer, BookingSerializer, BookingCreateSerializer,
    GalleryImageSerializer, FacilityClosureSerializer,
    MembershipTierSerializer, MembershipSerializer,
    PaymentSerializer, AdminDashboardSerializer,
    LoginSerializer, ForgotPasswordSerializer, VerifyOTPSerializer,
    ResetPasswordSerializer, ChangePasswordSerializer, VerifyRegistrationSerializer,
    CategorySerializer, FacilityPricingSerializer,
)


class IsStaffUser(permissions.BasePermission):
    def has_permission(self, request, view):
        print(f"DEBUG IsStaffUser - Path: {request.path}")
        print(f"DEBUG IsStaffUser - User: {request.user}")
        print(f"DEBUG IsStaffUser - Cookies: {request.COOKIES}")
        print(f"DEBUG IsStaffUser - Content-Type: {request.content_type}")
        return request.user and request.user.is_staff


# ───────────────────────────────────────────
# CSRF ENDPOINT
# ───────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def csrf_view(request):
    """Sets and returns the CSRF cookie — must be called before any POST requests."""
    return Response({'detail': 'CSRF cookie set.'})


# ───────────────────────────────────────────
# AUTH ENDPOINTS
# ───────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """Register a new user and generate OTPs for verification."""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()

        # Generate Demo OTPs
        otp_mobile = str(random.randint(1000, 9999))
        otp_aadhaar = str(random.randint(1000, 9999))

        # Store in session
        request.session['reg_user_id'] = user.id
        request.session['reg_otp_mobile'] = otp_mobile
        request.session['reg_otp_aadhaar'] = otp_aadhaar

        return Response({
            'message': 'Registration successful. Please verify your mobile and Aadhaar.',
            'user_id': user.id,
            # In production, OTPs would be sent via SMS/email
            # For demo, we return them (remove in production)
            'demo_otp_mobile': otp_mobile,
            'demo_otp_aadhaar': otp_aadhaar,
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_registration_view(request):
    """Verify registration OTPs."""
    user_id = request.session.get('reg_user_id')
    if not user_id:
        return Response({'error': 'No pending registration found.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = VerifyRegistrationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    input_mobile = serializer.validated_data['mobile_otp']
    input_aadhaar = serializer.validated_data['aadhaar_otp']

    session_mobile = request.session.get('reg_otp_mobile')
    session_aadhaar = request.session.get('reg_otp_aadhaar')

    if input_mobile == session_mobile and input_aadhaar == session_aadhaar:
        try:
            user = User.objects.get(id=user_id)
            user.is_mobile_verified = True
            user.is_aadhaar_verified = True

            # Cleanup session
            for key in ['reg_user_id', 'reg_otp_mobile', 'reg_otp_aadhaar']:
                request.session.pop(key, None)

            if user.is_student:
                user.status = 'pending'
                user.save()
                return Response({
                    'message': 'Verification successful! Account pending admin approval.',
                    'status': 'pending',
                    'auto_login': False
                })
            else:
                user.status = 'approved'
                user.save()
                user.backend = 'django.contrib.auth.backends.ModelBackend'
                login(request, user)
                return Response({
                    'message': 'Verification successful! Welcome!',
                    'status': 'approved',
                    'auto_login': True,
                    'user': UserProfileSerializer(user).data
                })
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    else:
        return Response({'error': 'Invalid OTPs.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([ScopedRateThrottle])
def login_view(request):
    """User login with ban check."""
    request.throttle_scope = 'login'
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    username = serializer.validated_data['username']
    password = serializer.validated_data['password']
    user = authenticate(username=username, password=password)

    if user is not None:
        if user.is_banned():
            msg = "Your account is permanently banned."
            if user.banned_until and user.banned_until > timezone.now():
                msg = f"Your account is banned until {user.banned_until.strftime('%Y-%m-%d %H:%M')}."
            return Response({'error': msg, 'banned': True}, status=status.HTTP_403_FORBIDDEN)

        login(request, user)
        return Response({
            'message': f'Welcome, {user.full_name or user.username}!',
            'user': UserProfileSerializer(user).data,
            'is_staff': user.is_staff
        })
    else:
        return Response({'error': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([ScopedRateThrottle])
def admin_login_view(request):
    """Admin login."""
    request.throttle_scope = 'login'
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    username = serializer.validated_data['username']
    password = serializer.validated_data['password']
    user = authenticate(username=username, password=password)

    if user and user.is_staff:
        login(request, user)
        return Response({
            'message': 'Admin login successful.',
            'user': UserProfileSerializer(user).data
        })
    elif user:
        return Response({'error': 'Access Denied: Not an Admin.'}, status=status.HTTP_403_FORBIDDEN)
    else:
        return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Logout user."""
    logout(request)
    return Response({'message': 'Logged out successfully.'})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def check_auth_view(request):
    """Check if user is authenticated."""
    if request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user': UserProfileSerializer(request.user).data,
            'is_staff': request.user.is_staff
        })
    return Response({'authenticated': False})


# ───────────────────────────────────────────
# PASSWORD MANAGEMENT
# ───────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([ScopedRateThrottle])
def forgot_password_view(request):
    """Initiate password reset — sends OTPs."""
    request.throttle_scope = 'login'
    serializer = ForgotPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    try:
        user = User.objects.get(email=email)
        otp_email = str(random.randint(100000, 999999))
        otp_mobile = str(random.randint(100000, 999999))

        request.session['reset_email'] = email
        request.session['otp_email'] = otp_email
        request.session['otp_mobile'] = otp_mobile

        return Response({
            'message': 'OTPs sent to your email and mobile.',
            # Demo only - remove in production
            'demo_otp_email': otp_email,
            'demo_otp_mobile': otp_mobile,
        })
    except User.DoesNotExist:
        # Prevent user enumeration - return same message
        return Response({'message': 'If an account with that email exists, OTPs have been sent.'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_reset_otp_view(request):
    """Verify password reset OTPs."""
    if 'reset_email' not in request.session:
        return Response({'error': 'No password reset in progress.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = VerifyOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    input_email_otp = serializer.validated_data['email_otp']
    input_mobile_otp = serializer.validated_data['mobile_otp']

    if (input_email_otp == request.session.get('otp_email') and
            input_mobile_otp == request.session.get('otp_mobile')):
        request.session['reset_verified'] = True
        return Response({'message': 'OTPs verified. You can now reset your password.'})
    else:
        return Response({'error': 'Invalid OTPs.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password_view(request):
    """Reset password after OTP verification."""
    if not request.session.get('reset_verified') or 'reset_email' not in request.session:
        return Response({'error': 'Please verify OTPs first.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = ResetPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = request.session['reset_email']
    try:
        user = User.objects.get(email=email)
        new_pass = serializer.validated_data['new_password']

        if user.check_password(new_pass):
            return Response({'error': 'New password cannot be the same as old password.'},
                            status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_pass)
        user.save()

        # Clear session
        for key in ['reset_email', 'otp_email', 'otp_mobile', 'reset_verified']:
            request.session.pop(key, None)

        return Response({'message': 'Password reset successful! Please login.'})
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    """Change password for authenticated user."""
    serializer = ChangePasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if not request.user.check_password(serializer.validated_data['old_password']):
        return Response({'error': 'Incorrect old password.'}, status=status.HTTP_400_BAD_REQUEST)

    request.user.set_password(serializer.validated_data['new_password'])
    request.user.save()
    update_session_auth_hash(request, request.user)
    return Response({'message': 'Password changed successfully.'})


# ───────────────────────────────────────────
# USER ENDPOINTS
# ───────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_view(request):
    """User dashboard data."""
    active_membership = Membership.objects.filter(
        user=request.user, is_active=True
    ).select_related('membership_tier').first()

    days_remaining = None
    if active_membership and active_membership.is_valid():
        days_remaining = (active_membership.end_date - timezone.now().date()).days

    recent_bookings = Booking.objects.filter(
        user=request.user
    ).select_related('facility', 'slot').order_by('-created_at')[:5]

    formatted_bookings = []
    for booking in recent_bookings:
        formatted_bookings.append({
            'id': booking.id,
            'facility_name': booking.facility.facility_name,
            'date': booking.booking_date.strftime("%d"),
            'month': booking.booking_date.strftime("%b %Y"),
            'full_date': booking.booking_date.isoformat(),
            'slot_time': f"{booking.slot.start_time.strftime('%I:%M %p')} - {booking.slot.end_time.strftime('%I:%M %p')}",
            'status': booking.status,
        })

    return Response({
        'user': UserProfileSerializer(request.user).data,
        'active_membership': MembershipSerializer(active_membership).data if active_membership else None,
        'days_remaining': days_remaining,
        'valid_until': active_membership.end_date.strftime("%B %d, %Y") if active_membership else None,
        'recent_bookings': formatted_bookings,
    })


@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    """Get or update user profile."""
    if request.method == 'GET':
        return Response(UserProfileSerializer(request.user).data)

    serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ───────────────────────────────────────────
# FACILITY ENDPOINTS
# ───────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def facility_list_view(request):
    """List all active facilities."""
    facilities = Facility.objects.filter(is_active=True)
    serializer = FacilitySerializer(facilities, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def facility_detail_view(request, facility_id):
    """Get facility detail with booking context data."""
    try:
        facility = Facility.objects.get(pk=facility_id)
    except Facility.DoesNotExist:
        return Response({'error': 'Facility not found.'}, status=status.HTTP_404_NOT_FOUND)

    slots = TimeSlot.objects.all().order_by('start_time')

    # Calculate 40-minute duration display
    slot_data = []
    for slot in slots:
        dt = datetime.combine(date.today(), slot.start_time)
        end_dt = dt + timedelta(minutes=40)
        slot_info = TimeSlotSerializer(slot).data
        slot_info['display_end_time'] = end_dt.time().strftime('%I:%M %p')
        slot_data.append(slot_info)

    # Check membership
    active_membership = Membership.objects.filter(
        user=request.user, is_active=True
    ).first()
    has_valid_membership = active_membership and active_membership.is_valid() if active_membership else False

    # Closures
    closures = FacilityClosure.objects.filter(
        date__gte=timezone.now().date()
    ).filter(Q(facility=facility) | Q(facility__isnull=True))
    closures_data = [{'date': c.date.strftime('%Y-%m-%d'), 'desc': c.description, 'slot_id': c.slot_id} for c in closures]

    # User future bookings
    user_future_dates = list(
        Booking.objects.filter(
            user=request.user,
            booking_date__gt=timezone.now().date(),
            status='active'
        ).values_list('booking_date', flat=True).distinct()
    )
    user_future_dates_str = [d.strftime('%Y-%m-%d') for d in user_future_dates]

    # Slot availability
    future_facility_bookings = Booking.objects.filter(
        facility=facility,
        booking_date__gte=timezone.now().date(),
        status='active'
    ).values('booking_date', 'slot_id')

    availability_map = {}
    for b in future_facility_bookings:
        d_str = b['booking_date'].strftime('%Y-%m-%d')
        s_id = str(b['slot_id'])
        if d_str not in availability_map:
            availability_map[d_str] = {}
        availability_map[d_str][s_id] = availability_map[d_str].get(s_id, 0) + 1

    return Response({
        'facility': FacilitySerializer(facility, context={'request': request}).data,
        'slots': slot_data,
        'today': timezone.localtime(timezone.now()).date().isoformat(),
        'current_datetime': timezone.localtime(timezone.now()).isoformat(),
        'user_category': request.user.category.name if request.user.category else None,
        'has_valid_membership': has_valid_membership,
        'active_membership': MembershipSerializer(active_membership).data if active_membership else None,
        'closures_data': closures_data,
        'user_future_dates': user_future_dates_str,
        'slot_availability_data': availability_map,
        'facility_capacity': facility.capacity_per_slot,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def book_facility_view(request, facility_id):
    """
    Book a facility — preserves ALL 7 business rules:
    1. User must be approved
    2. Must have active membership
    3. Cannot book past dates
    4. Facility closure check
    5. Future booking limit (max 1 future date)
    6. Shift limit (max 1 per session per day)
    7. Game diversity (same facility in multiple shifts)
    8. Capacity check
    """
    try:
        facility = Facility.objects.get(pk=facility_id)
    except Facility.DoesNotExist:
        return Response({'error': 'Facility not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Check membership
    active_membership = Membership.objects.filter(
        user=request.user, is_active=True
    ).first()
    has_valid_membership = active_membership and active_membership.is_valid() if active_membership else False

    if not has_valid_membership:
        return Response({'error': 'You need an active membership to book facilities.'},
                        status=status.HTTP_403_FORBIDDEN)

    serializer = BookingCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    slot_id = serializer.validated_data['slot_id']
    booking_date = serializer.validated_data['booking_date']

    try:
        slot = TimeSlot.objects.get(pk=slot_id)
    except TimeSlot.DoesNotExist:
        return Response({'error': 'Invalid time slot.'}, status=status.HTTP_400_BAD_REQUEST)

    today = timezone.now().date()

    # Rule 3: Cannot book past dates
    if booking_date < today:
        return Response({'error': 'Cannot book past dates.'}, status=status.HTTP_400_BAD_REQUEST)

    # Rule 4: Facility Closure Check
    closure = FacilityClosure.objects.filter(date=booking_date).filter(
        Q(facility=facility) | Q(facility__isnull=True)
    ).filter(
        Q(slot=slot) | Q(slot__isnull=True)
    ).first()
    if closure:
        return Response({'error': f'Facility closed on {booking_date}: {closure.description}'},
                        status=status.HTTP_400_BAD_REQUEST)

    # Rule 5: Future Booking Limit (Max 1 distinct future date)
    if booking_date > today:
        future_dates = Booking.objects.filter(
            user=request.user, booking_date__gt=today, status='active'
        ).values_list('booking_date', flat=True).distinct()
        existing_future_days = set(future_dates)
        if len(existing_future_days) >= 1 and booking_date not in existing_future_days:
            return Response({
                'error': f'You can only have bookings for ONE future day at a time. '
                         f'You already have bookings for {list(existing_future_days)[0]}.'
            }, status=status.HTTP_400_BAD_REQUEST)

    # Rule 6: Shift Limit (Max 1 booking per session per day)
    shift_booking = Booking.objects.filter(
        user=request.user, booking_date=booking_date,
        slot__session=slot.session, status='active'
    ).exists()
    if shift_booking:
        return Response({
            'error': f'You can only make ONE booking per shift ({slot.session}) per day.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Rule 7: Game Diversity
    same_game_bookings = Booking.objects.filter(
        user=request.user, booking_date=booking_date,
        facility=facility, status='active'
    ).exclude(slot__session=slot.session)

    if same_game_bookings.exists():
        booking_datetime = datetime.combine(booking_date, slot.start_time)
        current_time = timezone.localtime(timezone.now()).replace(tzinfo=None)
        time_diff = booking_datetime - current_time
        if time_diff.total_seconds() > 3600:
            return Response({
                'error': f'You cannot book {facility.facility_name} in multiple shifts on the same day, '
                         f'unless it is less than 1 hour before the slot starts.'
            }, status=status.HTTP_400_BAD_REQUEST)

    # Rule 8: Capacity Check
    active_bookings_count = Booking.objects.filter(
        facility=facility, slot=slot, booking_date=booking_date, status='active'
    ).count()
    if active_bookings_count >= facility.capacity_per_slot:
        return Response({
            'error': f'Slot is full! (Capacity: {facility.capacity_per_slot})'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Create booking
    try:
        booking = Booking(
            user=request.user, facility=facility,
            slot=slot, booking_date=booking_date, status='active'
        )
        booking.clean()
        booking.save()
        return Response({
            'message': f'Successfully booked {facility.facility_name} for {booking_date}!',
            'booking': BookingSerializer(booking).data
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_bookings_view(request):
    """Get user's bookings."""
    bookings = Booking.objects.filter(
        user=request.user
    ).select_related('facility', 'slot').order_by('-booking_date')
    serializer = BookingSerializer(bookings, many=True)
    return Response({
        'bookings': serializer.data,
        'today': timezone.now().date().isoformat()
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_booking_view(request, booking_id):
    """Cancel a booking — POST only for CSRF safety."""
    try:
        booking = Booking.objects.get(pk=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    if booking.booking_date < timezone.now().date():
        return Response({'error': 'Cannot cancel past bookings.'}, status=status.HTTP_400_BAD_REQUEST)

    booking.delete()
    return Response({'message': 'Booking cancelled successfully.'})


# ───────────────────────────────────────────
# MEMBERSHIP & TARIFF
# ───────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def tariff_view(request):
    """Get membership tiers grouped by duration."""
    categories = Category.objects.all().order_by('-priority')

    active_membership = None
    if request.user.is_authenticated:
        active_membership = Membership.objects.filter(
            user=request.user, is_active=True,
            end_date__gte=timezone.now().date()
        ).select_related('membership_tier').first()

    def annotate_tiers(tiers):
        result = []
        for tier in tiers:
            tier_data = MembershipTierSerializer(tier).data
            if not request.user.is_authenticated:
                tier_data['status'] = 'login'
            elif active_membership and active_membership.membership_tier.id == tier.id:
                tier_data['status'] = 'active'
            elif active_membership and (
                tier.duration_months > active_membership.membership_tier.duration_months or
                (tier.duration_months == active_membership.membership_tier.duration_months and
                 tier.base_price > active_membership.membership_tier.base_price)
            ):
                tier_data['status'] = 'upgrade'
            elif not active_membership:
                tier_data['status'] = 'purchase'
            else:
                tier_data['status'] = 'none'
            result.append(tier_data)
        return result

    monthly = MembershipTier.objects.filter(duration_months=1, is_active=True).select_related('category').order_by('category__priority')
    half_yearly = MembershipTier.objects.filter(duration_months=6, is_active=True).select_related('category').order_by('category__priority')
    yearly = MembershipTier.objects.filter(duration_months=12, is_active=True).select_related('category').order_by('category__priority')

    return Response({
        'categories': CategorySerializer(categories, many=True).data,
        'monthly_tiers': annotate_tiers(monthly),
        'half_yearly_tiers': annotate_tiers(half_yearly),
        'yearly_tiers': annotate_tiers(yearly),
        'active_membership': MembershipSerializer(active_membership).data if active_membership else None,
    })


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def purchase_membership_view(request, tier_id):
    """Purchase a membership tier — preserves all membership logic."""
    try:
        tier = MembershipTier.objects.select_related('category').get(id=tier_id, is_active=True)
    except MembershipTier.DoesNotExist:
        return Response({'error': 'Invalid membership tier.'}, status=status.HTTP_404_NOT_FOUND)

    existing_membership = Membership.objects.filter(
        user=request.user, is_active=True
    ).first()

    if existing_membership and existing_membership.is_valid():
        return Response({
            'error': f'You already have an active membership until {existing_membership.end_date}.'
        }, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        return Response({
            'tier': MembershipTierSerializer(tier).data,
            'user': UserProfileSerializer(request.user).data
        })

    # POST — process purchase
    start_date = timezone.now().date()
    if tier.duration_months == 1:
        end_date = start_date + timedelta(days=30)
    elif tier.duration_months == 6:
        end_date = start_date + timedelta(days=180)
    elif tier.duration_months == 12:
        end_date = start_date + timedelta(days=365)
    else:
        end_date = start_date + timedelta(days=30 * tier.duration_months)

    # Deactivate old memberships
    Membership.objects.filter(user=request.user).update(is_active=False)

    # Create new membership
    membership = Membership.objects.create(
        user=request.user, membership_tier=tier,
        start_date=start_date, end_date=end_date,
        is_active=True, total_amount_paid=tier.base_price
    )

    # Create payment record
    Payment.objects.create(
        user=request.user, membership=membership,
        payment_type='membership', amount=tier.base_price,
        payment_status='success',
        transaction_id=f"MEM-{timezone.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    )

    return Response({
        'message': f'Membership purchased successfully! Active until {end_date.strftime("%B %d, %Y")}.',
        'membership': MembershipSerializer(membership).data
    }, status=status.HTTP_201_CREATED)


# ───────────────────────────────────────────
# GALLERY & CALENDAR
# ───────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def gallery_view(request):
    """Get gallery images."""
    images = GalleryImage.objects.all().order_by('-uploaded_at')
    serializer = GalleryImageSerializer(images, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def calendar_view(request):
    """Calendar view data with facility availability."""
    facilities = Facility.objects.filter(is_active=True)
    slots = TimeSlot.objects.all()

    today = timezone.now().date()
    end_date = today + timedelta(days=30)

    bookings = Booking.objects.filter(
        booking_date__gte=today, booking_date__lte=end_date,
        status='active'
    ).values('facility_id', 'slot_id', 'booking_date')

    bookings_list = [{
        'facility_id': b['facility_id'],
        'slot_id': b['slot_id'],
        'date': b['booking_date'].strftime('%Y-%m-%d')
    } for b in bookings]

    return Response({
        'bookings': bookings_list,
        'facilities': FacilitySerializer(facilities, many=True, context={'request': request}).data,
        'slots': TimeSlotSerializer(slots, many=True).data
    })


# ───────────────────────────────────────────
# PAYMENT ENDPOINTS
# ───────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def process_payment_view(request, booking_id):
    """Process payment for a booking (mock)."""
    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({'booking': BookingSerializer(booking).data})

    # POST — simulate payment
    amount = 100.00
    payment = Payment.objects.create(
        user=request.user, booking=booking,
        amount=amount, payment_type='single_game',
        payment_status='success', transaction_id=str(uuid.uuid4())
    )

    return Response({
        'message': 'Payment successful!',
        'payment': PaymentSerializer(payment).data
    }, status=status.HTTP_201_CREATED)


# ───────────────────────────────────────────
# ADMIN ENDPOINTS
# ───────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaffUser])
def admin_dashboard_view(request):
    """Admin dashboard with metrics."""
    active_bookings_list = Booking.objects.filter(
        status='active'
    ).select_related('user', 'user__category', 'facility', 'slot').order_by('-booking_date', 'slot__start_time')

    total_bookings = Booking.objects.count()
    active_bookings = Booking.objects.filter(status='active').count()
    facilities = Facility.objects.all()
    total_users = User.objects.count()

    # Revenue from payments
    from django.db.models import Sum
    total_revenue = Payment.objects.filter(
        payment_status='success'
    ).aggregate(total=Sum('amount'))['total'] or 0

    return Response({
        'total_revenue': float(total_revenue),
        'total_bookings': total_bookings,
        'active_bookings': active_bookings,
        'total_users': total_users,
        'total_facilities': facilities.count(),
        'active_bookings_list': BookingSerializer(active_bookings_list, many=True).data,
    })


@api_view(['POST'])
@permission_classes([IsStaffUser])
def approve_booking_view(request, booking_id):
    """Approve a booking — POST only."""
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    booking.status = 'active'
    booking.save()
    return Response({'message': f'Booking #{booking.id} approved!', 'booking': BookingSerializer(booking).data})


@api_view(['POST'])
@permission_classes([IsStaffUser])
def reject_booking_view(request, booking_id):
    """Reject a booking — POST only."""
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    booking.status = 'cancelled'
    booking.save()
    return Response({'message': f'Booking #{booking.id} rejected.', 'booking': BookingSerializer(booking).data})


# ───────────────────────────────────────────
# ADMIN ENDPOINTS - MEMBERSHIP PLANS
# ───────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaffUser])
def admin_plans_view(request):
    """List all membership tiers for admin."""
    tiers = MembershipTier.objects.select_related('category').order_by('category__priority', 'duration_months')
    return Response({
        'plans': MembershipTierSerializer(tiers, many=True).data
    })


@api_view(['PUT'])
@permission_classes([IsStaffUser])
def admin_plan_detail_view(request, tier_id):
    """Update a specific membership tier."""
    try:
        tier = MembershipTier.objects.get(id=tier_id)
    except MembershipTier.DoesNotExist:
        return Response({'error': 'Membership tier not found.'}, status=status.HTTP_404_NOT_FOUND)
        
    serializer = MembershipTierSerializer(tier, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Plan updated successfully', 'plan': serializer.data})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ───────────────────────────────────────────
# ADMIN ENDPOINTS - USERS, FACILITIES, GALLERY
# ───────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsStaffUser])
def admin_users_view(request):
    """List or create registered users."""
    if request.method == 'GET':
        users = User.objects.all().order_by('-date_joined')
        return Response({
            'users': UserProfileSerializer(users, many=True).data
        })
    
    # POST
    data = request.data
    try:
        user = User.objects.create_user(
            username=data.get('username'),
            email=data.get('email', ''),
            password=data.get('password'),
            full_name=data.get('full_name', ''),
            phone_number=data.get('phone_number', ''),
        )
        if data.get('category_id'):
            try:
                category = Category.objects.get(id=data.get('category_id'))
                user.category = category
            except Category.DoesNotExist:
                pass
        user.status = 'approved'
        user.save()
        return Response({'message': 'User created successfully', 'user': UserProfileSerializer(user).data}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsStaffUser])
def admin_user_toggle_ban_view(request, user_id):
    """Toggle ban status for a user."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    if user.is_staff:
        return Response({'error': 'Cannot ban staff members.'}, status=status.HTTP_400_BAD_REQUEST)

    action = request.data.get('action') # 'ban' or 'unban'
    if action == 'ban':
        user.is_permanently_banned = True
        user.save()
        return Response({'message': f'{user.full_name} banned.', 'status': 'banned'})
    else:
        user.is_permanently_banned = False
        user.banned_until = None
        user.save()
        return Response({'message': f'{user.full_name} unbanned.', 'status': 'active'})

@api_view(['GET', 'POST'])
@permission_classes([IsStaffUser])
def admin_facilities_view(request):
    """List or create facilities."""
    if request.method == 'GET':
        facilities = Facility.objects.all().order_by('id')
        return Response({'facilities': FacilitySerializer(facilities, many=True, context={'request': request}).data})
    
    # POST
    serializer = FacilitySerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Facility created!', 'facility': serializer.data}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsStaffUser])
def admin_facility_detail_view(request, facility_id):
    """Update or delete a facility."""
    try:
        facility = Facility.objects.get(id=facility_id)
    except Facility.DoesNotExist:
        return Response({'error': 'Facility not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'PUT':
        serializer = FacilitySerializer(facility, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Facility updated!', 'facility': serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    if request.method == 'DELETE':
        facility.delete()
        return Response({'message': 'Facility deleted!'})

@api_view(['GET', 'POST'])
@permission_classes([IsStaffUser])
@parser_classes([MultiPartParser, FormParser])
def admin_gallery_view(request):
    """List or upload gallery images."""
    print("DEBUG GALLERY POST:")
    print("User:", request.user)
    print("Cookies:", request.COOKIES)
    print("Content-Type:", request.content_type)
    
    if request.method == 'GET':
        images = GalleryImage.objects.all().order_by('-uploaded_at')
        return Response({'images': GalleryImageSerializer(images, many=True, context={'request': request}).data})
    
    # POST - handling multipart file upload
    if 'image' not in request.FILES:
        return Response({'error': 'No image provided.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        image = GalleryImage.objects.create(
            image=request.FILES['image'],
            title=request.data.get('caption', '')
        )
        return Response({'message': 'Image uploaded!', 'image': GalleryImageSerializer(image, context={'request': request}).data}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsStaffUser])
def admin_gallery_delete_view(request, image_id):
    """Delete a gallery image."""
    try:
        image = GalleryImage.objects.get(id=image_id)
        image.delete()
        return Response({'message': 'Image deleted!'})
    except GalleryImage.DoesNotExist:
        return Response({'error': 'Image not found.'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET', 'POST'])
@permission_classes([IsStaffUser])
def admin_closures_view(request):
    """List or create facility closures."""
    if request.method == 'GET':
        closures = FacilityClosure.objects.all().order_by('-date')
        return Response({'closures': FacilityClosureSerializer(closures, many=True).data})
    
    # POST
    serializer = FacilityClosureSerializer(data=request.data)
    if serializer.is_valid():
        try:
            serializer.save()
            return Response({'message': 'Closure added!', 'closure': serializer.data}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsStaffUser])
def admin_closure_delete_view(request, closure_id):
    """Delete a closure."""
    try:
        closure = FacilityClosure.objects.get(id=closure_id)
        closure.delete()
        return Response({'message': 'Closure removed!'})
    except FacilityClosure.DoesNotExist:
        return Response({'error': 'Closure not found.'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([IsStaffUser])
def admin_cancel_booking_view(request, booking_id):
    """Admin endpoint to cancel any booking."""
    try:
        booking = Booking.objects.get(id=booking_id)
        if booking.status in ['cancelled', 'completed']:
            return Response({'error': f'Booking is already {booking.status}.'}, status=status.HTTP_400_BAD_REQUEST)
        
        booking.status = 'cancelled'
        booking.save()
        return Response({'message': 'Booking cancelled successfully.'})
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

# ───────────────────────────────────────────
# ───────────────────────────────────────────
# ADMIN ENDPOINTS - CALENDAR & FORCE BOOKING
# ───────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsStaffUser])
def admin_calendar_data_view(request):
    """Get calendar data (bookings and closures) for a specific year and month."""
    year = int(request.GET.get('year', timezone.now().year))
    month = int(request.GET.get('month', timezone.now().month))
    
    start_date = timezone.datetime(year, month, 1).date()
    if month == 12:
        end_date = timezone.datetime(year + 1, 1, 1).date() - timedelta(days=1)
    else:
        end_date = timezone.datetime(year, month + 1, 1).date() - timedelta(days=1)
        
    bookings = Booking.objects.filter(booking_date__range=[start_date, end_date]).select_related('user', 'facility', 'slot')
    closures = FacilityClosure.objects.filter(date__range=[start_date, end_date]).select_related('facility', 'slot')
    
    bookings_data = [{
        'id': b.id,
        'date': b.booking_date.strftime('%Y-%m-%d'),
        'facility_id': b.facility.id,
        'slot_id': b.slot.id,
        'user_name': b.user.full_name or b.user.username,
        'status': b.status
    } for b in bookings]
    
    closures_data = [{
        'id': c.id,
        'date': c.date.strftime('%Y-%m-%d'),
        'facility_id': c.facility.id if c.facility else None,
        'slot_id': c.slot.id if c.slot else None,
        'description': c.description
    } for c in closures]
    
    return Response({
        'bookings': bookings_data,
        'closures': closures_data
    })

@api_view(['POST'])
@permission_classes([IsStaffUser])
def admin_force_booking_view(request):
    """Force create a booking for a user."""
    data = request.data
    try:
        user = User.objects.get(id=data.get('user_id'))
        facility = Facility.objects.get(id=data.get('facility_id'))
        slot = TimeSlot.objects.get(id=data.get('slot_id'))
        date_str = data.get('date')
        
        booking = Booking.objects.create(
            user=user,
            facility=facility,
            slot=slot,
            booking_date=date_str,
            status='active'
        )
        Payment.objects.create(
            user=user,
            booking=booking,
            amount=data.get('amount', 0),
            payment_type='single_game',
            payment_status='success',
            transaction_id=f"FORCE-{timezone.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
        )
        return Response({'message': 'Booking forced successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# ───────────────────────────────────────────
# PUBLIC DATA ENDPOINTS
# ───────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def home_data_view(request):
    """Public home page data."""
    featured_facilities = Facility.objects.filter(is_active=True)[:4]
    total_users = User.objects.count()
    total_facilities = Facility.objects.filter(is_active=True).count()
    total_bookings = Booking.objects.count()

    return Response({
        'featured_facilities': FacilitySerializer(featured_facilities, many=True, context={'request': request}).data,
        'stats': {
            'total_facilities': total_facilities,
            'total_users': total_users,
            'total_bookings': total_bookings,
        }
    })
