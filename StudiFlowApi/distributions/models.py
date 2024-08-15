from django.db import models

# Create your models here.
class Distribution(models.Model):
    homework_assignments = models.IntegerField(default=0)
    quizzes = models.IntegerField(default=0)
    tests = models.IntegerField(default=0)
    projects = models.IntegerField(default=0)
    exams = models.IntegerField(default=0)
    labs = models.IntegerField(default=0)
    other_weight = models.IntegerField(default=0)
    other_description = models.CharField(max_length=255, null=True)
    total_points = models.IntegerField(default=100)
    course_id = models.IntegerField(default=0)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='distributions')
    id = models.IntegerField(primary_key=True)


    def __str__(self):
        return f"{self.id}"