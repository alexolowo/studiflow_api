from django.db import models

# Create your models here.

class Course(models.Model):
    """
    _summary_: This class is going to be for canvas courses

    Class: UserCourses
        course_id: int
        course_name: str
        instructor: str
        course_code: str
        syllabus: [id of syllabus items]
        resources: [id of resources]
        tasks: [id of tasks]

    """
    id = models.IntegerField(primary_key=True)
    course_code = models.CharField(max_length=255)
    name = models.CharField(max_length=200, null=False, default='Default Course Name')
    is_lecture = models.BooleanField(default=False)
    enrollment_term_id = models.IntegerField(blank=False, null=False)
    user = models.ManyToManyField('users.User', related_name='lecture_courses')
    distribution = models.JSONField(null=True)
    
    
    # syllabus = models.OneToOneField('Syllabus', on_delete=models.CASCADE, related_name='user_courses_syllabus')
    #TODO: Add resources model one to many relationship
    #TODO: Add Syllabus model one to one relationship

    def __str__(self):
        return str(self.course_code)

