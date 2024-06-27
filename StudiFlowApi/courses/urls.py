from django.urls import path
from . import views

urlpatterns = [
    path('', views.UserCoursesView.as_view(), name='course_list'),
]