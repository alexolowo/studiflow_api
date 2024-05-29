from django.db import models
from user_courses.models import UserCourse
from resources.models import Resource

# Create your models here.
'''
_summary_: This class is going to be for canvas 
courses tasks that a user has at the moment

id: int
course_id: int
task_name: str
task_type: str
task_description: str
due_date: datetime
status: str
resources: [id of resources]
submission_link: str
submission_status: str
weight: float
'''

class Task(models.Model):
    id = models.IntegerField(primary_key=True)
    task_name = models.CharField(max_length=255)
    task_type = models.CharField(max_length=255)
    task_description = models.TextField()
    due_date = models.DateTimeField()
    status = models.CharField(max_length=255)
    resources = models.ManyToManyField(Resource, related_name='resources')
    submission_link = models.CharField(max_length=255)
    submission_status = models.CharField(max_length=255)
    weight = models.FloatField()
    course = models.ForeignKey(UserCourse, on_delete=models.CASCADE, related_name='tasks')