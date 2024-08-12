from rest_framework import serializers
from .models import Distribution

class DistributionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Distribution
        fields = '__all__'