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
    id = models.IntegerField(primary_key=True)
    resource_name = models.CharField(max_length=255)
    resource_type = models.CharField(max_length=255)
    resource_link = models.CharField(max_length=255)
    resource_content = models.TextField()

    def __str__(self):
        return self.resource_name