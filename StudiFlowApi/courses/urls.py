from django.urls import path
from . import views

urlpatterns = [
    path('load_courses/', views.LoadUserCoursesView.as_view(), name='course_list'),
    path('', views.RetrieveUserCoursesView.as_view(), name='user_courses_list'),
    path('create/', views.CreateCourseView.as_view(), name='create_course'),
    path('delete/<int:pk>/', views.DeleteCourseView.as_view(), name='delete_course'),
]