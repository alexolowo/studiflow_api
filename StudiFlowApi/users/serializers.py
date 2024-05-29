from rest_framework import serializers
from rest_framework.validators import ValidationError
from rest_framework.authtoken.models import Token
from .models import User

class SignUpSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()
    username = serializers.CharField(max_length=255)
    canvas_token = serializers.CharField(max_length=255)
    password = serializers.CharField(min_length=8, write_only=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 
                  'canvas_token', 'session_avg', 'courses']

    def validate(self, attrs):

        email_exists = User.objects.filter(email=attrs['email']).exists()

        if email_exists:
            raise ValidationError('Email already exists')
        
        return super().validate(attrs)
    

    def create(self, validated_data):
        password = validated_data.pop('password')

        user =  super().create(validated_data)
        user.set_password(password)
        user.save()

        Token.objects.create(user=user)
        return user
    
'''
This was used to gather posts that belonged to a user in the 
project i used to learn django
'''    
# class CurrentUserCoursesSerializer(serializers.ModelSerializer):
#     courses = serializers.HyperlinkedRelatedField(many=True,
#                                                 view_name='user_courses_list',
#                                                 queryset=User.objects.all())
    
#     class Meta:
#         model = User
#         fields = ['id', 'username', 'email', 'posts']
#         read_only_fields = ['username', 'posts']