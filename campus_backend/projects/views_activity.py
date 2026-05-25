from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Membership, Note, Event

class ActivityListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        activities = []
        today = timezone.now().date()

        # User stats - upcoming events should include today and future (to match Events.jsx)
        user_club_joins = Membership.objects.filter(user=user, status__in=['approved', 'active']).count()
        user_notes_saved = Note.objects.filter(uploaded_by=user).count()
        user_upcoming_events = Event.objects.filter(date__gte=today).count()

        # Admin stats (all users) - upcoming events should include today and future
        all_club_joins = Membership.objects.filter(status__in=['approved', 'active']).count()
        all_notes_saved = Note.objects.count()
        all_upcoming_events = Event.objects.filter(date__gte=today).count()

        # Activities (last 10 for user)
        club_joins = Membership.objects.filter(user=user, status__in=['approved', 'active'])
        for m in club_joins:
            activities.append({
                'id': f'club-{m.id}',
                'type': 'club_joined',
                'icon': 'fas fa-user-friends',
                'message': f"Joined club: {getattr(m.club, 'name', 'Club')}",
                'timestamp': m.joined_at.isoformat() if hasattr(m, 'joined_at') and m.joined_at else None,
            })
        notes = Note.objects.filter(uploaded_by=user)
        for n in notes:
            activities.append({
                'id': f'note-{n.id}',
                'type': 'note_saved',
                'icon': 'fas fa-file-alt',
                'message': f"Saved note: {getattr(n, 'title', 'Untitled')}",
                'timestamp': n.uploaded_at.isoformat() if hasattr(n, 'uploaded_at') and n.uploaded_at else None,
            })
        upcoming_events = Event.objects.filter(date__gte=today)
        for e in upcoming_events:
            activities.append({
                'id': f'event-{e.id}',
                'type': 'upcoming_event',
                'icon': 'fas fa-calendar-check',
                'message': f"Upcoming event: {getattr(e, 'title', 'Event')}",
                'timestamp': e.date.isoformat() if e.date else None,
            })
        activities = [a for a in activities if a['timestamp']]
        activities.sort(key=lambda x: x['timestamp'], reverse=True)

        return Response({
            'user_stats': {
                'clubs_joined': user_club_joins,
                'notes_saved': user_notes_saved,
                'upcoming_events': user_upcoming_events,
            },
            'admin_stats': {
                'clubs_joined': all_club_joins,
                'notes_saved': all_notes_saved,
                'upcoming_events': all_upcoming_events,
            },
            'activities': activities[:10],
        })
