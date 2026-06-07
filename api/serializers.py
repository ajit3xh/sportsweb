from rest_framework import serializers
from users.models import User, Category, MembershipTier, Membership
from facilities.models import Facility, FacilityPricing, TimeSlot, Booking, GalleryImage, FacilityClosure
from payments.models import Payment


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'priority', 'description']


class MembershipTierSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    display_duration = serializers.SerializerMethodField()

    class Meta:
        model = MembershipTier
        fields = [
            'id', 'name', 'category', 'category_name',
            'duration_months', 'base_price', 'discount_percentage',
            'is_active', 'display_duration'
        ]

    def get_display_duration(self, obj):
        if obj.duration_months == 1:
            return "30 Days"
        elif obj.duration_months == 6:
            return "6 Months"
        elif obj.duration_months == 12:
            return "1 Year"
        return f"{obj.duration_months} Months"


class MembershipSerializer(serializers.ModelSerializer):
    tier_name = serializers.CharField(source='membership_tier.name', read_only=True)
    display_duration = serializers.SerializerMethodField()
    is_valid_now = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Membership
        fields = [
            'id', 'membership_tier', 'tier_name', 'start_date', 'end_date',
            'is_active', 'total_amount_paid', 'created_at',
            'display_duration', 'is_valid_now', 'days_remaining'
        ]

    def get_display_duration(self, obj):
        months = obj.membership_tier.duration_months
        if months == 1:
            return "Monthly Plan"
        elif months == 6:
            return "Half-Yearly Plan"
        elif months == 12:
            return "Yearly Plan"
        return f"{months} Months Plan"

    def get_is_valid_now(self, obj):
        return obj.is_valid()

    def get_days_remaining(self, obj):
        if obj.is_valid():
            from django.utils import timezone
            return (obj.end_date - timezone.now().date()).days
        return 0


class UserProfileSerializer(serializers.ModelSerializer):
    active_membership = serializers.SerializerMethodField()
    total_bookings = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    is_banned_now = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'father_name',
            'gender', 'dob', 'address', 'phone_number',
            'aadhaar_number', 'is_aadhaar_verified', 'is_mobile_verified',
            'is_student', 'student_type', 'school_college_name',
            'current_class', 'course_start_date', 'course_end_date',
            'sports_discipline', 'status', 'category', 'category_name',
            'photo', 'student_id_proof',
            'banned_until', 'is_permanently_banned', 'is_banned_now',
            'active_membership', 'total_bookings',
            'is_staff', 'date_joined'
        ]
        read_only_fields = [
            'id', 'username', 'status', 'is_aadhaar_verified',
            'is_mobile_verified', 'is_banned_now', 'is_staff', 'date_joined'
        ]

    def get_active_membership(self, obj):
        membership = Membership.objects.filter(
            user=obj, is_active=True
        ).select_related('membership_tier').first()
        if membership and membership.is_valid():
            return MembershipSerializer(membership).data
        return None

    def get_total_bookings(self, obj):
        return Booking.objects.filter(user=obj).count()

    def get_is_banned_now(self, obj):
        return obj.is_banned()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    declaration = serializers.BooleanField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'confirm_password',
            'full_name', 'father_name', 'gender', 'dob', 'address',
            'phone_number', 'sports_discipline', 'aadhaar_number', 'photo',
            'is_student', 'student_type', 'school_college_name',
            'current_class', 'course_start_date', 'course_end_date',
            'student_id_proof', 'declaration'
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        if not data.get('declaration'):
            raise serializers.ValidationError({"declaration": "You must accept the declaration."})

        if data.get('phone_number') and User.objects.filter(phone_number=data['phone_number']).exists():
            raise serializers.ValidationError({"phone_number": "User with this mobile number already exists."})

        if data.get('aadhaar_number') and User.objects.filter(aadhaar_number=data['aadhaar_number']).exists():
            raise serializers.ValidationError({"aadhaar_number": "User with this Aadhaar number already exists."})

        is_student = data.get('is_student', False)
        if is_student:
            if not data.get('student_type'):
                raise serializers.ValidationError({"student_type": "Student type is required."})
            if not data.get('school_college_name'):
                raise serializers.ValidationError({"school_college_name": "School/College name is required."})
            if data.get('student_type') == 'school' and not data.get('current_class'):
                raise serializers.ValidationError({"current_class": "Current class is required for school students."})
            if data.get('student_type') == 'college':
                if not data.get('course_start_date') or not data.get('course_end_date'):
                    raise serializers.ValidationError({"course_start_date": "Course dates are required for college students."})

        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        validated_data.pop('declaration')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.is_mobile_verified = False
        user.is_aadhaar_verified = False
        user.save()
        return user


class FacilitySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Facility
        fields = ['id', 'facility_name', 'max_duration', 'is_active', 'image', 'image_url', 'capacity_per_slot']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class FacilityPricingSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = FacilityPricing
        fields = ['id', 'facility', 'category', 'category_name', 'price']


class TimeSlotSerializer(serializers.ModelSerializer):
    display_time = serializers.SerializerMethodField()

    class Meta:
        model = TimeSlot
        fields = ['id', 'start_time', 'end_time', 'session', 'display_time']

    def get_display_time(self, obj):
        return f"{obj.start_time.strftime('%I:%M %p')} - {obj.end_time.strftime('%I:%M %p')}"


class BookingSerializer(serializers.ModelSerializer):
    facility_name = serializers.CharField(source='facility.facility_name', read_only=True)
    slot_time = serializers.SerializerMethodField()
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_category = serializers.CharField(source='user.category.name', read_only=True, default=None)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'facility', 'facility_name', 'slot', 'slot_time',
            'booking_date', 'status', 'created_at',
            'user_name', 'user_category'
        ]
        read_only_fields = ['id', 'user', 'status', 'created_at']

    def get_slot_time(self, obj):
        return f"{obj.slot.start_time.strftime('%I:%M %p')} - {obj.slot.end_time.strftime('%I:%M %p')}"


class BookingCreateSerializer(serializers.Serializer):
    slot_id = serializers.IntegerField()
    booking_date = serializers.DateField()


class GalleryImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = GalleryImage
        fields = ['id', 'title', 'image', 'image_url', 'uploaded_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if request and obj.image:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None


class FacilityClosureSerializer(serializers.ModelSerializer):
    facility_name = serializers.CharField(source='facility.facility_name', read_only=True, default="ALL Facilities")
    slot_time = serializers.SerializerMethodField()

    class Meta:
        model = FacilityClosure
        fields = ['id', 'date', 'description', 'facility', 'facility_name', 'slot', 'slot_time']

    def get_slot_time(self, obj):
        if obj.slot:
            return f"{obj.slot.start_time.strftime('%I:%M %p')} - {obj.slot.end_time.strftime('%I:%M %p')}"
        return "Whole Day"


class PaymentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'user_name', 'booking', 'membership',
            'amount', 'payment_type', 'payment_status',
            'transaction_id', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'transaction_id', 'created_at']


class AdminDashboardSerializer(serializers.Serializer):
    total_revenue = serializers.IntegerField()
    total_bookings = serializers.IntegerField()
    active_bookings = serializers.IntegerField()
    total_users = serializers.IntegerField()
    total_facilities = serializers.IntegerField()
    active_bookings_list = BookingSerializer(many=True)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyOTPSerializer(serializers.Serializer):
    email_otp = serializers.CharField(max_length=6)
    mobile_otp = serializers.CharField(max_length=6)


class ResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        if data['old_password'] == data['new_password']:
            raise serializers.ValidationError({"new_password": "New password cannot be the same as old password."})
        return data


class VerifyRegistrationSerializer(serializers.Serializer):
    mobile_otp = serializers.CharField(max_length=4)
    aadhaar_otp = serializers.CharField(max_length=4)
