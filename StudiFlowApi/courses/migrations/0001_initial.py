# Generated by Django 5.0.6 on 2024-06-25 02:12

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Course',
            fields=[
                ('id', models.IntegerField(primary_key=True, serialize=False)),
                ('course_code', models.CharField(max_length=255)),
                ('is_lecture', models.BooleanField(default=False)),
                ('enorllment_term_id', models.IntegerField()),
            ],
        ),
    ]
