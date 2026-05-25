from django.contrib import admin
from .models import UserProfile, Club, Item, Event, Note, Notification
from django import forms

class EventAdminForm(forms.ModelForm):
    class Meta:
        model = Event
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = kwargs.get('request')
        # If adding a new event, auto-fill club if user manages one
        if not self.instance.pk and hasattr(request, 'user'):
            club = Club.objects.filter(admin=request.user).first()
            if club:
                self.fields['club'].initial = club

class EventAdmin(admin.ModelAdmin):
    form = EventAdminForm

    def get_form(self, request, obj=None, **kwargs):
        kwargs['form'] = self.form
        form = super().get_form(request, obj, **kwargs)
        form.request = request
        return form

admin.site.register(UserProfile)
admin.site.register(Club)
admin.site.register(Item)
admin.site.register(Event, EventAdmin)
admin.site.register(Note)
admin.site.register(Notification)