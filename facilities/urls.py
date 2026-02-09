from django.urls import path
from . import views

app_name = 'facilities'

urlpatterns = [
    path('', views.facility_list, name='list'),
    path('book/<int:facility_id>/', views.book_facility, name='book'),
    path('my-bookings/', views.my_bookings, name='my_bookings'),
    path('gallery/', views.gallery_view, name='gallery'),
    path('calendar/', views.calendar_view, name='calendar'),
]
