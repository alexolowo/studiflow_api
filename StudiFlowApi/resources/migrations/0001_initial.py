# Generated by Django 4.1.13 on 2024-04-27 00:25

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Resource',
            fields=[
                ('id', models.IntegerField(primary_key=True, serialize=False)),
                ('resource_name', models.CharField(max_length=255)),
                ('resource_type', models.CharField(max_length=255)),
                ('resource_link', models.CharField(max_length=255)),
                ('resource_content', models.TextField()),
            ],
        ),
    ]
