from django.urls import path
from . import views

urlpatterns = [
    path('import_distributions/', views.ImportSyllabusDistributionView.as_view(), name='import-distributions'),
    # Add more paths here
]