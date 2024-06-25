from django.db import models

# Create your models here.
class Section(models.Model):

    SECTION_TYPES = [
        ('TUT', 'Tutorial'),
        ('PRA', 'Lab'),
        ('LAB', 'Lab'),
    ]

    lecture_course = models.ForeignKey('courses.Course', on_delete=models.CASCADE)
    section_type = models.CharField(max_length=10, choices=SECTION_TYPES)
    id = models.IntegerField(primary_key=True)
    enrollment_term_id = models.IntegerField(blank=False, null=False)

    def __str__(self):
        return f'Section {self.pk}'
