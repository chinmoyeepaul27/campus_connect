
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Club',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField()),
                ('type', models.CharField(max_length=50)),
                ('members_count', models.PositiveIntegerField(default=0)),
                ('meeting_info', models.CharField(blank=True, max_length=100, null=True)),
                ('tags', models.JSONField(blank=True, default=list)),
                ('icon', models.CharField(blank=True, max_length=100)),
                ('registered_at', models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('type', models.CharField(choices=[('event', 'Event'), ('announcement', 'Announcement'), ('notes', 'Notes')], max_length=20)),
                ('icon', models.CharField(blank=True, max_length=100)),
                ('date', models.DateField()),
                ('time', models.CharField(blank=True, max_length=20)),
                ('location', models.CharField(blank=True, max_length=200)),
                ('rsvp', models.BooleanField(default=False)),
                ('time_ago', models.CharField(blank=True, max_length=50)),
            ],
        ),
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('date', models.DateField()),
                ('time', models.CharField(max_length=50)),
                ('location', models.CharField(max_length=200)),
                ('tags', models.JSONField(blank=True, default=list)),
                ('type', models.CharField(blank=True, max_length=50)),
                ('icon', models.CharField(blank=True, max_length=100)),
                ('registered_users', models.ManyToManyField(blank=True, related_name='registered_events', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Item',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('value', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Note',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('subject', models.CharField(max_length=100)),
                ('batch', models.CharField(max_length=10)),
                ('semester', models.CharField(blank=True, max_length=10)),
                ('course_code', models.CharField(blank=True, max_length=20)),
                ('tags', models.CharField(blank=True, max_length=200)),
                ('downloads', models.PositiveIntegerField(default=0)),
                ('file', models.FileField(upload_to='notes/')),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('uploaded_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
