from . import views
from django.urls import path

urlpatterns = [
    path('upload/', views.ResourceUploadView.as_view(), name='upload_resource'),
    path('delete/<int:pk>/', views.ResourceDelete.as_view(), name='resource-delete'),
    path('<int:course_id>/', views.ResourceList.as_view(), name='resource-list'),
    path('delete/', views.ResourceDelete.as_view(), name='resource-delete-multiple'),
]