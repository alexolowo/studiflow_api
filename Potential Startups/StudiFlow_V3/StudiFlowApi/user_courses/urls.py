from django.urls import path
from . import views

urlpatterns = [
    path('user_courses/', views.get_user_courses, name='user_courses_list'),
]