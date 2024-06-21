from django.db import models

# Create your models here.
class Section(models.Model):
    main_course = models.ForeignKey('Course', on_delete=models.CASCADE)
    section_courses = models.ManyToManyField('Course', related_name='sections')

    def __str__(self):
        return f'Section {self.pk}'
