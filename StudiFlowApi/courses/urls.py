from django.urls import path
from . import views

urlpatterns = [
    path('courses/', views.UserCoursesView.as_view(), name='course_list'),
]