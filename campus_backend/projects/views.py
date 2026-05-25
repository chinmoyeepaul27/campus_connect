from .serializers import UserProfileSerializer
from .models import UserProfile, Membership, PaymentTransaction
from .payment_gateways import process_payment
from .email_notifications import email_service
import uuid
import logging
from django.utils import timezone
from django.db import transaction
from decimal import Decimal

logger = logging.getLogger(__name__)
# Profile picture upload endpoint
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework import permissions
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import generics, status, permissions
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Club,Item,Event,Note,Notification, Membership, PaymentTransaction
from .serializers import UserSerializer, RegisterSerializer,ItemSerializer,ClubSerializer,EventSerializer
from .serializers import NoteSerializer, NotificationSerializer, MembershipSerializer, PaymentTransactionSerializer, ClubJoinSerializer
from django.shortcuts import get_object_or_404
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAdminUser


class UserProfilePictureUploadView(APIView):

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def userinfo(request):
    user = request.user
    # Auto-create UserProfile if missing
    from .models import UserProfile
    profile, created = UserProfile.objects.get_or_create(user=user)
    try:
        profile_picture_url = profile.profile_picture.url if profile.profile_picture and profile.profile_picture.name else ''
    except Exception:
        profile_picture_url = ''
    return Response({
        'username': user.username,
        'department': profile.department or '',
        'batch': profile.batch or '',
        'profile_picture': profile_picture_url,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
    })

def frontend(request):
    return render(request, "index.html")

class ClubListAPIView(generics.ListAPIView):
    queryset = Club.objects.all()
    serializer_class = ClubSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class RegisterAPI(generics.GenericAPIView):
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                "user": UserSerializer(user, context=self.get_serializer_context()).data,
                "token": token.key
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class LoginAPI(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)

        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({"token": token.key})
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

class LogoutAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_200_OK)
    
class ItemListCreateView(generics.ListCreateAPIView):
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Item.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class EventListView(generics.ListCreateAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class RegisterEventView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        event = Event.objects.get(pk=pk)
        event.registered_users.add(request.user)
        return Response({'status': 'registered'})

class UnregisterEventView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        event = Event.objects.get(pk=pk)
        event.registered_users.remove(request.user)
        return Response({'status': 'unregistered'})
    
class NoteUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, format=None):
        serializer = NoteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            note = serializer.save()
            # Create a notification for all users
            from datetime import date
            Notification.objects.create(
                title=f"New note uploaded: {note.title}",
                description=f"{request.user.username} uploaded a new note: {note.title}",
                type="notes",
                icon="fas fa-book",
                date=date.today(),
                time_ago="Just now"
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class NoteListView(generics.ListAPIView):
    serializer_class = NoteSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        my = self.request.query_params.get('my')
        if my and self.request.user.is_authenticated:
            return Note.objects.filter(uploaded_by=self.request.user).order_by('-uploaded_at')
        return Note.objects.all().order_by('-uploaded_at')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
class NotificationListView(generics.ListAPIView):
    queryset = Notification.objects.all().order_by('-date', '-time')
    serializer_class = NotificationSerializer
    permission_classes = [permissions.AllowAny]

class ClubCreateAPIView(generics.CreateAPIView):
    queryset = Club.objects.all()
    serializer_class = ClubSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAdminUser]

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_club(request, club_id):
    """Advanced club joining with payment processing and email notifications"""
    try:
        with transaction.atomic():
            club = get_object_or_404(Club, id=club_id)
            user = request.user
            
            # Check if user already has a membership for this club
            existing_membership = Membership.objects.filter(user=user, club=club).first()
            if existing_membership:
                return Response(
                    {"detail": f"You already have a membership for {club.name} with status: {existing_membership.status}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate request data
            serializer = ClubJoinSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {"detail": "Invalid data provided", "errors": serializer.errors}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            validated_data = serializer.validated_data
            
            # Update user profile with additional information
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.phone = validated_data.get('phone', profile.phone)
            profile.student_id = validated_data.get('student_id', profile.student_id)
            profile.department = validated_data.get('department', profile.department)
            profile.batch = validated_data.get('batch', profile.batch)
            profile.save()
            
            # Create membership record
            membership = Membership.objects.create(
                user=user,
                club=club,
                motivation=validated_data.get('motivation', ''),
                status='pending'
            )
            
            # Process payment
            payment_method = validated_data['payment_method']
            payment_reference = validated_data['payment_reference']
            amount = club.membership_fee
            phone = validated_data['phone']
            
            # Generate unique transaction ID
            transaction_id = f"{payment_method.upper()}_{uuid.uuid4().hex[:12].upper()}"
            
            # Process payment through gateway
            payment_result = process_payment(
                payment_method=payment_method,
                amount=amount,
                phone=phone,
                reference=payment_reference
            )
            
            # Create payment transaction record
            payment_transaction = PaymentTransaction.objects.create(
                membership=membership,
                transaction_id=payment_result.get('transaction_id', transaction_id),
                payment_method=payment_method,
                amount=amount,
                payment_reference=payment_reference,
                status='completed' if payment_result.get('success') else 'failed',
                gateway_response=payment_result.get('gateway_response', {})
            )
            
            if payment_result.get('success'):
                # Payment successful - update club member count
                club.members_count += 1
                club.save()
                
                # Send confirmation emails
                try:
                    # Send confirmation to user
                    email_service.send_membership_application_confirmation(membership)
                    email_service.send_payment_confirmation(payment_transaction)
                    
                    # Send notification to club admin
                    email_service.send_club_admin_notification(membership)
                    
                except Exception as email_error:
                    # Log email error but don't fail the entire transaction
                    logger.error(f"Email notification error: {str(email_error)}")
                
                return Response({
                    "detail": "Successfully joined the club! Payment processed and confirmation emails sent.",
                    "membership_id": membership.id,
                    "transaction_id": payment_transaction.transaction_id,
                    "club_id": club.id,
                    "new_member_count": club.members_count,
                    "payment_status": payment_transaction.status
                }, status=status.HTTP_201_CREATED)
            
            else:
                # Payment failed
                membership.delete()  # Remove the membership since payment failed
                return Response({
                    "detail": "Payment processing failed. Please try again.",
                    "error": payment_result.get('error', 'Unknown payment error'),
                    "transaction_id": payment_transaction.transaction_id
                }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Club join error: {str(e)}")
        return Response(
            {"detail": f"Failed to join club: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Advanced Club Management Views

class MembershipListView(generics.ListAPIView):
    """List memberships for a club (admin only)"""
    serializer_class = MembershipSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        club_id = self.kwargs.get('club_id')
        club = get_object_or_404(Club, id=club_id)
        
        # Check if user is club admin or superuser
        if not (self.request.user.is_superuser or club.admin == self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to view this club's memberships")
        
        return Membership.objects.filter(club=club).order_by('-joined_at')

class MembershipUpdateView(generics.UpdateAPIView):
    """Update membership status (admin only)"""
    serializer_class = MembershipSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Membership.objects.all()
    
    def perform_update(self, serializer):
        membership = self.get_object()
        club = membership.club
        
        # Check if user is club admin or superuser
        if not (self.request.user.is_superuser or club.admin == self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to update this membership")
        
        old_status = membership.status
        new_status = serializer.validated_data.get('status', old_status)
        
        # Update approved fields if status changed to approved
        if new_status == 'approved' and old_status != 'approved':
            serializer.validated_data['approved_at'] = timezone.now()
            serializer.validated_data['approved_by'] = self.request.user
        
        membership = serializer.save()
        
        # Send email notification if status changed
        if old_status != new_status:
            try:
                email_service.send_membership_status_update(membership)
            except Exception as e:
                logger.error(f"Failed to send status update email: {str(e)}")

class PaymentHistoryView(generics.ListAPIView):
    """View payment history"""
    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # If user is admin, they can see all payments for their clubs
        if user.is_superuser:
            return PaymentTransaction.objects.all().order_by('-created_at')
        
        # Club admins can see payments for their clubs
        admin_clubs = Club.objects.filter(admin=user)
        if admin_clubs.exists():
            club_memberships = Membership.objects.filter(club__in=admin_clubs)
            return PaymentTransaction.objects.filter(membership__in=club_memberships).order_by('-created_at')
        
        # Regular users can only see their own payments
        user_memberships = Membership.objects.filter(user=user)
        return PaymentTransaction.objects.filter(membership__in=user_memberships).order_by('-created_at')

class UserMembershipsView(generics.ListAPIView):
    """View user's own memberships"""
    serializer_class = MembershipSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Membership.objects.filter(user=self.request.user).order_by('-joined_at')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def club_admin_dashboard(request, club_id):
    """Get club admin dashboard data"""
    try:
        club = get_object_or_404(Club, id=club_id)
        
        # Check if user is club admin or superuser
        if not (request.user.is_superuser or club.admin == request.user):
            return Response(
                {"detail": "You don't have permission to access this club's admin dashboard"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get membership statistics
        memberships = Membership.objects.filter(club=club)
        pending_count = memberships.filter(status='pending').count()
        approved_count = memberships.filter(status='approved').count()
        active_count = memberships.filter(status='active').count()
        total_count = memberships.count()
        
        # Get recent payments
        recent_payments = PaymentTransaction.objects.filter(
            membership__club=club
        ).order_by('-created_at')[:10]
        
        # Get pending membership requests
        pending_memberships = memberships.filter(status='pending').order_by('-joined_at')[:10]
        
        dashboard_data = {
            'club': ClubSerializer(club).data,
            'statistics': {
                'total_members': total_count,
                'pending_requests': pending_count,
                'approved_members': approved_count,
                'active_members': active_count,
            },
            'recent_payments': PaymentTransactionSerializer(recent_payments, many=True).data,
            'pending_requests': MembershipSerializer(pending_memberships, many=True).data,
        }
        
        return Response(dashboard_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Club admin dashboard error: {str(e)}")
        return Response(
            {"detail": f"Failed to load dashboard: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_membership_action(request, club_id):
    """Bulk approve/reject membership requests"""
    try:
        club = get_object_or_404(Club, id=club_id)
        
        # Check if user is club admin or superuser
        if not (request.user.is_superuser or club.admin == request.user):
            return Response(
                {"detail": "You don't have permission to manage this club's memberships"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        action = request.data.get('action')  # 'approve' or 'reject'
        membership_ids = request.data.get('membership_ids', [])
        
        if action not in ['approve', 'reject']:
            return Response(
                {"detail": "Invalid action. Use 'approve' or 'reject'"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not membership_ids:
            return Response(
                {"detail": "No membership IDs provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            memberships = Membership.objects.filter(
                id__in=membership_ids,
                club=club,
                status='pending'
            )
            
            updated_count = 0
            for membership in memberships:
                old_status = membership.status
                
                if action == 'approve':
                    membership.status = 'approved'
                    membership.approved_at = timezone.now()
                    membership.approved_by = request.user
                elif action == 'reject':
                    membership.status = 'rejected'
                
                membership.save()
                updated_count += 1
                
                # Send email notification
                try:
                    email_service.send_membership_status_update(membership)
                except Exception as e:
                    logger.error(f"Failed to send status update email for membership {membership.id}: {str(e)}")
            
            return Response({
                "detail": f"Successfully {action}d {updated_count} membership requests",
                "updated_count": updated_count
            }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Bulk membership action error: {str(e)}")
        return Response(
            {"detail": f"Failed to process bulk action: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def event_detail(request, pk):
    """
    Retrieve, update, or delete a specific event by ID.
    """
    try:
        event = Event.objects.get(pk=pk)
    except Event.DoesNotExist:
        return Response({'detail': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = EventSerializer(event)
        return Response(serializer.data)

    elif request.method == 'PUT':
        # Only allow admins to update
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = EventSerializer(event, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        # Only allow admins to delete
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        event.delete()
        return Response({'detail': 'Event deleted.'}, status=status.HTTP_204_NO_CONTENT)

