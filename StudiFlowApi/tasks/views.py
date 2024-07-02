from django.shortcuts import render
from django.views import View
from .models import Task
from rest_framework.request import Request
from rest_framework.response import Response

# Create your views here.
class ImportTasksView(View):
    def get(self, request:Request):
        pages = ['Syllabus', 'Modules', 'Assignments', 'Quizzes', 'Pages']
        
        # Scan syllabus first to get and understand course/grade distribution
        try:
            syllabus_tasks = self.import_tasks_from_page('Syllabus')
            self.save_tasks_to_db(syllabus_tasks)
        except NotFoundError:
            print('Syllabus not found')
        
        # Import tasks from other pages
        for page in pages[1:]:
            try:
                tasks = self.import_tasks_from_page(page)
                self.save_tasks_to_db(tasks)
            except NotFoundError:
                print(f'{page} not found, trying next page...')
        
        return Response({'message': 'Tasks imported successfully'}, status=200)
    
    def get_canvas_api_response(course_id, page):
        base_url = f"https://utoronto.instructure.com/api/v1/course/{course_id}/{page}"
        response = Request.get(base_url)

        if response.status_code == 200:
            return Response({response.json()}, status=response.status_code)
        else:
            return Response({'error': 'Failed to retrieve data'}, status=response.status_code)
    
    def import_tasks_from_page(self, page):
        # Import tasks from the specified page
        tasks = []
        
        if page == 'Syllabus':
            # Logic to import tasks from Syllabus page
            # ...
            pass
        elif page == 'Modules':
            # Logic to import tasks from Modules page
            # ...
            pass
        elif page == 'Assignments':
            # Logic to import tasks from Assignments page
            # ...
            pass
        elif page == 'Quizzes':
            # Logic to import tasks from Quizzes page
            # ...
            pass
        elif page == 'Pages':
            # Logic to import tasks from Pages page
            # ...
            pass
        
        return tasks
    
    def save_tasks_to_db(self, tasks):
        # Save the imported tasks to the database
        # TODO: Implement the logic to save tasks to the database
        # ...
        pass