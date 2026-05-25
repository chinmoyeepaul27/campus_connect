from rest_framework import serializers
from .models import UserProfile, Club, User, Item, Event, Note, Notification, Membership, PaymentTransaction
import re

class UserProfileSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = UserProfile
        fields = ['department', 'batch', 'profile_picture']

class ClubSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)
    is_member = serializers.SerializerMethodField()
    membership_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Club
        fields = '__all__'
        
    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Membership.objects.filter(
                user=request.user, 
                club=obj, 
                status__in=['approved', 'active']
            ).exists()
        return False
        
    def get_membership_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                membership = Membership.objects.get(user=request.user, club=obj)
                return membership.status
            except Membership.DoesNotExist:
                return None
        return None
        
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image:
            request = self.context.get('request')
            if request:
                data['image'] = request.build_absolute_uri(instance.image.url)
            else:
                data['image'] = instance.image.url
        return data


class UserSerializer(serializers.ModelSerializer):
    department = serializers.CharField(source='profile.department', read_only=True)
    batch = serializers.CharField(source='profile.batch', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'department', 'batch')

class RegisterSerializer(serializers.ModelSerializer):

    def validate_email(self, value):
        # Only allow emails like u2104004@student.cuet.ac.bd
        pattern = r'^u\d{7}@student\.cuet\.ac\.bd$'
        if not re.match(pattern, value):
            raise serializers.ValidationError(
                "Please use your institutional email (e.g., u2104004@student.cuet.ac.bd)."
            )
        # Enforce unique email at serializer level (case-insensitive)
        from django.contrib.auth.models import User
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This Email has already registered!")
        return value
    department = serializers.CharField(write_only=True)
    batch = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'department', 'batch')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        department = validated_data.pop('department')
        batch = validated_data.pop('batch')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        UserProfile.objects.create(user=user, department=department, batch=batch)
        return user
    
class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['id', 'value', 'user', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class EventSerializer(serializers.ModelSerializer):
    registered = serializers.SerializerMethodField()
    club = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'date', 'time', 'location',
            'tags', 'type', 'registered', 'club'
        ]

    def get_registered(self, obj):
        user = self.context.get('request').user
        return user.is_authenticated and obj.registered_users.filter(id=user.id).exists()

    def get_club(self, obj):
        club = getattr(obj, 'club', None)
        if not club:
            return None
        image_url = None
        try:
            if club.image and hasattr(club.image, 'url'):
                request = self.context.get('request')
                if request:
                    image_url = request.build_absolute_uri(club.image.url)
                else:
                    image_url = club.image.url
        except Exception:
            image_url = None
        return {
            'id': club.id,
            'name': club.name,
            'icon': club.icon,
            'image': image_url,
        }
    
class NoteSerializer(serializers.ModelSerializer):
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = '__all__'
        read_only_fields = ['uploaded_by', 'uploaded_at']

    def get_is_owner(self, obj):
        user = self.context['request'].user
        return user.is_authenticated and obj.uploaded_by == user

    def create(self, validated_data):
        request = self.context['request']
        validated_data['uploaded_by'] = request.user
        # Convert tags list to comma-separated string if needed
        tags = self.initial_data.getlist('tags[]') or self.initial_data.get('tags')
        if tags:
            validated_data['tags'] = ','.join(tags) if isinstance(tags, list) else tags
        return super().create(validated_data)

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class MembershipSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    club_details = ClubSerializer(source='club', read_only=True)
    
    class Meta:
        model = Membership
        fields = '__all__'
        read_only_fields = ['user', 'joined_at', 'approved_at', 'approved_by']

class PaymentTransactionSerializer(serializers.ModelSerializer):
    membership_details = MembershipSerializer(source='membership', read_only=True)
    
    class Meta:
        model = PaymentTransaction
        fields = '__all__'
        read_only_fields = ['transaction_id', 'created_at', 'updated_at']

class ClubJoinSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100)
    student_id = serializers.CharField(max_length=20)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    department = serializers.CharField(max_length=100)
    batch = serializers.CharField(max_length=20)
    motivation = serializers.CharField()
    payment_method = serializers.ChoiceField(choices=['bkash', 'nagad', 'rocket'])
    payment_reference = serializers.CharField(max_length=100)

class PaymentGatewaySerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=['bkash', 'nagad', 'rocket'])
    phone_number = serializers.CharField(max_length=20)
    reference = serializers.CharField(max_length=100)