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
    id = models.AutoField(primary_key=True)
    course_code = models.CharField(max_length=255)
    name = models.CharField(max_length=200, null=False, default='Default Course Name')
    is_lecture = models.BooleanField(default=False)
    enrollment_term_id = models.IntegerField(blank=False, null=False)
    user = models.ManyToManyField('users.User', related_name='lecture_courses')
    was_user_created = models.BooleanField(default=False)
    

    REQUIRED_FIELDS = ['course_code', 'name', 'is_lecture', 'enrollment_term_id', 'user']
    def __str__(self):
        return str(self.course_code)

