from . import views
from django.urls import path

urlpatterns = [
    path('upload/', views.ResourceUploadView.as_view(), name='upload_resource'),
    path('delete/<int:pk>/', views.ResourceDelete.as_view(), name='resource-delete'),
]