from django.db import models
from courses.models import Course
from resources.models import Resource

# Create your models here.
class Task(models.Model):
    '''
    Represents a task for a canvas course that a user has at the moment.

    Attributes:
        id (int): The unique identifier for the task.
        task_name (str): The name of the task.
        task_type (str): The type of the task.
        task_description (str): The description of the task.
        due_date (datetime): The due date of the task.
        status (str): The status of the task.
        submission_link (str): The link for task submission (optional).
        weight (float): The weight of the task.
        course (Course): The course to which the task belongs.

    Relationships:
        - A task belongs to a course (many-to-one relationship).
        - A task can have multiple associated resources (many-to-many relationship).
    '''

    id = models.BigAutoField(primary_key=True)
    task_name = models.CharField(max_length=255)
    task_type = models.CharField(max_length=255)
    task_description = models.TextField(null=True, blank=True)
    due_date = models.DateTimeField(null=True)
    status = models.CharField(max_length=255, default='TO-DO')
    submission_link = models.CharField(max_length=255, null=True)
    weight = models.FloatField(default=0)
    points_possible = models.FloatField(default=100)
    html_url = models.CharField(max_length=255, null=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='tasks', default=0)
    course_id = models.IntegerField(default=0)
    notes= models.TextField(null=True, blank=True, default='')
    grade = models.FloatField(default=0)

    REQUIRED_FIELDS = ['task_name', 'course_id', 'user']

    def __str__(self):
        return self.task_name
    
    