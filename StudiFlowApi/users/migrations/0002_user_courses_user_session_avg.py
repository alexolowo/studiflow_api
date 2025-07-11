# Generated by Django 4.1.13 on 2024-04-27 00:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user_courses', '0001_initial'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='courses',
            field=models.ManyToManyField(related_name='courses', to='user_courses.usercourse'),
        ),
        migrations.AddField(
            model_name='user',
            name='session_avg',
            field=models.FloatField(default=0.0),
        ),
    ]
