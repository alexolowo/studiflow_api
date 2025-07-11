from django.urls import path
from . import views

urlpatterns = [
    path('load_tasks/<int:course_id>/', views.ImportTasksView.as_view(), name='task-import'),
    path('<int:course_id>/', views.UserTasksView.as_view(), name='task-list-with-course'),
    path('<int:course_id>/<int:task_id>/', views.UserTasksView.as_view(), name='task-list-with-course'),
    path('<int:course_id>/filters/', views.TaskFilterView.as_view(), name='task-filter-list'),
    path('filters/', views.UserFilterView.as_view(), name='task-filter-list'),
    path('general/', views.GeneralTasksInfoView.as_view(), name='general-tasks-info'),
]