from django.contrib import admin
from django.urls import path, include, re_path
from projects.views import frontend
from django.contrib.auth import views as auth_views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('projects.urls')),
    # Social and REST auth endpoints
    path('dj-rest-auth/', include('dj_rest_auth.urls')),
    path('dj-rest-auth/registration/', include('dj_rest_auth.registration.urls')),
    path('accounts/', include('allauth.urls')),  # for social login
    # React frontend catch-all
    path('', frontend, name='frontend'),
    re_path(r'^(?!api/|admin/|static/|media/|dj-rest-auth/|accounts/).*$', frontend, name='frontend'),
    path('password-reset-confirm/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
