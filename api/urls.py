from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    # CSRF
    path('auth/csrf/', views.csrf_view, name='csrf'),

    # Auth
    path('auth/register/', views.register_view, name='register'),
    path('auth/verify-registration/', views.verify_registration_view, name='verify_registration'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/admin-login/', views.admin_login_view, name='admin_login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/check/', views.check_auth_view, name='check_auth'),

    # Password Management
    path('auth/forgot-password/', views.forgot_password_view, name='forgot_password'),
    path('auth/verify-reset-otp/', views.verify_reset_otp_view, name='verify_reset_otp'),
    path('auth/reset-password/', views.reset_password_view, name='reset_password'),
    path('auth/change-password/', views.change_password_view, name='change_password'),

    # User
    path('user/dashboard/', views.dashboard_view, name='dashboard'),
    path('user/profile/', views.profile_view, name='profile'),

    # Facilities
    path('facilities/', views.facility_list_view, name='facility_list'),
    path('facilities/<int:facility_id>/', views.facility_detail_view, name='facility_detail'),
    path('facilities/<int:facility_id>/book/', views.book_facility_view, name='book_facility'),

    # Bookings
    path('bookings/', views.my_bookings_view, name='my_bookings'),
    path('bookings/<int:booking_id>/cancel/', views.cancel_booking_view, name='cancel_booking'),

    # Memberships & Tariff
    path('tariff/', views.tariff_view, name='tariff'),
    path('memberships/purchase/<int:tier_id>/', views.purchase_membership_view, name='purchase_membership'),

    # Gallery & Calendar
    path('gallery/', views.gallery_view, name='gallery'),
    path('calendar/', views.calendar_view, name='calendar'),

    # Payments
    path('payments/process/<int:booking_id>/', views.process_payment_view, name='process_payment'),

    # Admin
    path('admin/dashboard/', views.admin_dashboard_view, name='admin_dashboard'),
    path('admin/bookings/<int:booking_id>/approve/', views.approve_booking_view, name='approve_booking'),
    path('admin/bookings/<int:booking_id>/reject/', views.reject_booking_view, name='reject_booking'),
    path('admin/plans/', views.admin_plans_view, name='admin_plans'),
    # Admin - Users
    path('admin/users/', views.admin_users_view, name='admin_users'),
    path('admin/users/<int:user_id>/toggle-ban/', views.admin_user_toggle_ban_view, name='admin_user_toggle_ban'),

    # Admin - Facilities & Closures
    path('admin/facilities/', views.admin_facilities_view, name='admin_facilities'),
    path('admin/facilities/<int:facility_id>/', views.admin_facility_detail_view, name='admin_facility_detail'),
    path('admin/closures/', views.admin_closures_view, name='admin_closures'),
    path('admin/closures/<int:closure_id>/', views.admin_closure_delete_view, name='admin_closure_delete'),
    path('admin/bookings/<int:booking_id>/cancel/', views.admin_cancel_booking_view, name='admin_cancel_booking'),
    path('admin/calendar/', views.admin_calendar_data_view, name='admin_calendar_data'),
    path('admin/bookings/force/', views.admin_force_booking_view, name='admin_force_booking'),

    # Admin - Gallery
    path('admin/gallery/', views.admin_gallery_view, name='admin_gallery_manage'),
    path('admin/gallery/<int:image_id>/', views.admin_gallery_delete_view, name='admin_gallery_delete'),

    # Public
    path('home/', views.home_data_view, name='home_data'),
]
