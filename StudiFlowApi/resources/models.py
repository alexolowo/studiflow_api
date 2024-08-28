from django.db import models

# Create your models here.
'''
_summary_: This class is going to be for 
canvas resources that can be useful for a task the user needs to 
complete

id: int
resource_name: str
resource_type: str
resource_link: str
resource_content: str
'''

class Resource(models.Model):
    id = models.BigAutoField(primary_key=True)
    resource_name = models.CharField(max_length=255)
    resource_type = models.CharField(max_length=255)
    resource_link = models.CharField(max_length=255)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='resources', default=0)
    course_id = models.IntegerField(default=0)

    REQUIRED_FIELDS = ['resource_name', 'course_id', 'user']    

    def __str__(self):
        return self.resource_name