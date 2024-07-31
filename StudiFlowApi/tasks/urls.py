from django.urls import path
from . import views

urlpatterns = [
    path('load_tasks/', views.ImportTasksView.as_view(), name='task-list'),
    path('distributions/', views.ImportSyllabusDistributionView.as_view(), name='distributions'),
]