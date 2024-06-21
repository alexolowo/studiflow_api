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
    course_name = models.CharField(max_length=255)
    instructor = models.CharField(max_length=255, blank=True, null=True)
    course_code = models.CharField(max_length=255)
    isMainCourse = models.BooleanField(default=False)
    # syllabus = models.OneToOneField('Syllabus', on_delete=models.CASCADE, related_name='user_courses_syllabus')
    #TODO: Add resources model one to many relationship
    #TODO: Add Syllabus model one to one relationship
    #TODO: Add Sections Model one to many relationship

    def __str__(self):
        return str(self.course_name)

