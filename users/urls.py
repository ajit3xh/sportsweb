from django.urls import path
from . import views, admin_views

app_name = 'users'

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('verify-registration/', views.verify_registration_view, name='verify_registration'),
    path('login/', views.login_view, name='login'),
    path('admin-login/', views.admin_login_view, name='admin_login'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('profile/', views.profile_view, name='profile'),
    path('settings/', views.settings_view, name='settings'),
    path('purchase-membership/<int:tier_id>/', views.purchase_membership_view, name='purchase_membership'),
    
    # Custom Admin Routes
    path('custom-admin/', admin_views.admin_dashboard, name='admin_dashboard'),
    path('custom-admin/approve/<int:booking_id>/', admin_views.approve_booking, name='approve_booking'),
    path('custom-admin/reject/<int:booking_id>/', admin_views.reject_booking, name='reject_booking'),
    
    # Password & Security
    path('forgot-password/', views.forgot_password_view, name='forgot_password'),
    path('verify-otp/', views.verify_otp_view, name='verify_otp'),
    path('reset-password/', views.reset_password_view, name='reset_password'),
    path('change-password/', views.change_password_view, name='change_password'),
]
