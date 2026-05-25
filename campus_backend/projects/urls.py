from django.urls import path
from .views import ClubListAPIView,RegisterAPI, LoginAPI, LogoutAPI,ItemListCreateView,EventListView,RegisterEventView,UnregisterEventView
from .views_activity import ActivityListView
from .views import NoteUploadView,NoteListView,NotificationListView, userinfo, UserProfilePictureUploadView
from .views import ClubCreateAPIView, join_club, MembershipListView, MembershipUpdateView, PaymentHistoryView
from .views import UserMembershipsView, club_admin_dashboard, bulk_membership_action
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    # Club endpoints
    path('clubs/', ClubListAPIView.as_view(), name='club-list'),
    path('clubs/create/', ClubCreateAPIView.as_view(), name='club-create'),
    path('clubs/<int:club_id>/join/', join_club, name='club-join'),
    
    # Club admin endpoints
    path('clubs/<int:club_id>/memberships/', MembershipListView.as_view(), name='club-memberships'),
    path('clubs/<int:club_id>/admin/dashboard/', club_admin_dashboard, name='club-admin-dashboard'),
    path('clubs/<int:club_id>/admin/bulk-action/', bulk_membership_action, name='bulk-membership-action'),
    
    # Membership management
    path('memberships/<int:pk>/update/', MembershipUpdateView.as_view(), name='membership-update'),
    path('memberships/my/', UserMembershipsView.as_view(), name='user-memberships'),
    
    # Payment endpoints
    path('payments/history/', PaymentHistoryView.as_view(), name='payment-history'),
    
    # Authentication endpoints
    path('signup/', RegisterAPI.as_view(), name='signup'),
    path('login/', LoginAPI.as_view(), name='login'),
    path('logout/', LogoutAPI.as_view(), name='logout'),
    
    # Other endpoints
    path('items/', ItemListCreateView.as_view(), name='item-list-create'),
    path('events/', EventListView.as_view(), name='event-list'),
    path('events/<int:pk>/', views.event_detail, name='event-detail'), 
    path('events/<int:pk>/register/', RegisterEventView.as_view(), name='event-register'),
    path('events/<int:pk>/unregister/', UnregisterEventView.as_view(), name='event-unregister'),
    path('notes/upload/', NoteUploadView.as_view(), name='note-upload'),
    path('notes/', NoteListView.as_view(), name='note-list'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('userinfo/', userinfo, name='userinfo'),
    path('userinfo/upload_profile_picture/', UserProfilePictureUploadView.as_view(), name='upload-profile-picture'),
    # Activity endpoint
    path('activity/', ActivityListView.as_view(), name='activity-list'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)