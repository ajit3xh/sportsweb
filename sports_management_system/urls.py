from django.contrib import admin
from django.urls import path, include
from users import views as users_views
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect

urlpatterns = [
    path('admin/', admin.site.urls),
    path('users/', include('users.urls')),
    path('facilities/', include('facilities.urls')),
    path('payments/', include('payments.urls')),
    path('', users_views.home_view, name='home'),
    path('tariff/', users_views.tariff_view, name='tariff'),
    path('about-us/', users_views.about_us_view, name='about_us'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
