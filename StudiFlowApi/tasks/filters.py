from django_filters import rest_framework as filters
from .models import Task

class TaskFilter(filters.FilterSet):
    status = filters.CharFilter(lookup_expr='iexact')
    due_date = filters.DateFilter()
    weight = filters.NumberFilter()
    points_possible = filters.NumberFilter()

    class Meta:
        model = Task
        fields = ['status', 'due_date', 'weight', 'points_possible']