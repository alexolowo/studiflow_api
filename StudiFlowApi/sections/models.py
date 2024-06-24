from django.db import models

# Create your models here.
class Section(models.Model):

    SECTION_TYPES = [
        ('lecture', 'Lecture'),
        ('tutorial', 'Tutorial'),
        ('lab', 'Lab'),
    ]

    main_course = models.ForeignKey('courses.Course', on_delete=models.CASCADE)
    section_type = models.CharField(max_length=10, choices=SECTION_TYPES)
    name = models.CharField(max_length=255)

    def __str__(self):
        return f'Section {self.pk}'
