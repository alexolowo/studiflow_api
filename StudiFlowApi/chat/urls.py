from django.urls import path
from . import views

urlpatterns = [
    path('', views.Chat.as_view(), name='chat'),
    path('upload', views.ResourceUpload.as_view(), name='resource_upload'),
    path('chat_history', views.ChatHistory.as_view(), name='chat_history'),
]