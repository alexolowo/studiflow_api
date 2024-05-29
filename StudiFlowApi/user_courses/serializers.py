from rest_framework import serializers
from .models import UserCourse

class UserCoursesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserCourse
        fields = '__all__'