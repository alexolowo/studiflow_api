from django.urls import path
from . import views

urlpatterns = [
    path('load_courses', views.LoadUserCoursesView.as_view(), name='course_list'),
    path('', views.RetrieveUserCoursesView.as_view(), name='user_courses_list'),
]