from django.shortcuts import render
from django.views import View
from .models import Task
from rest_framework.request import Request
from rest_framework.response import Response
import anthropic
import requests


# Create your views here.

client = anthropic.Anthropic()

def is_syllabus_prompt(json_str):
    prompt = f"""Given this JSON representing a course module, classify it as either:
    1. A syllabus, course overview material, course information, or similar.
    2. Not a syllabus, course overview material, course information, or similar.

    JSON:
    {json_str}

    Please provide your classification as only True or False. Nothing else."""

    # Make the API call
    response = client.completions.create(
        model="claude-3-sonnet-20240229",
        prompt=prompt,
        max_tokens_to_sample=300,
    )
    response_data = response.completion
    print(response_data)
    return response_data

class ImportTasksView(View):
    bearer_token = ''
    headers = {"Authorization": f"Bearer {bearer_token}"}
    pages = ['syllabus', 'modules', 'assignments', 'quizzes', 'pages']
    
    def get_canvas_api_response(self, course_id, page):
        base_url = f"https://utoronto.instructure.com/api/v1/course/{course_id}/{page}"

        response = requests.get(base_url, headers=self.headers)

        if response.status_code == 200:
            return Response({response.json()}, status=response.status_code)
        else:
            return Response({'error': 'Failed to retrieve data'}, status=response.status_code)
    
    def import_tasks_from_syllabus(self, course_id):
        print('Course ID:', course_id)
        # Import tasks from the specified page
        tasks = []
        
        # Logic to import tasks from Syllabus page
        # Check if the syllabus page exists
        response = self.get_canvas_api_response(course_id, self.pages[0])
        
        if response.status_code == 200:

            # If it exists, make the request to the API to get the syllabus page
            syllabus_page = response.data

            if syllabus_page['type'] == 'File' :
                # If it is a file, perform a get to the files url
                syllabus_file_url = syllabus_page['url']
                syllabus_file_response = requests.get(syllabus_file_url, headers=self.headers)
                if syllabus_file_response.status_code == 200:
                    syllabus_file_data = syllabus_file_response.json()
                    # Process the syllabus file data and create task objects
                    # ...
            elif syllabus_page['type'] == 'Page':
                # If it is a page, perform a get to the page text url
                syllabus_page_text_url = syllabus_page['url']
                syllabus_page_text_response = requests.get(syllabus_page_text_url, headers=self.headers)
                if syllabus_page_text_response.status_code == 200:
                    syllabus_page_text_data = syllabus_page_text_response.json()
                    # Process the syllabus page text data and create task objects
                    # ...
        elif response.status_code != 200:
#TODO: complete this logic
            #check modules
            response = self.get_canvas_api_response(course_id, self.pages[1])
            if response.status_code == 200:
                print('Importing tasks from Syllabus...')
                
                modules_page = response.data
                for module in modules_page:
                    if module['name'].lower() in ['syllabus', 'course information', 'course overview'] or is_syllabus_prompt(module) == 'True':
                        # Logic to import tasks from the module
                        module_items_url = module['items_url']
                        module_items_response = requests.get(module_items_url)
                        if module_items_response.status_code == 200:
                            module_items = module_items_response.json()
                            for item in module_items:
                                if item['type'] == 'Assignment' or item['type'] == 'Quiz':
                                    # Process the module item data and create task objects
                                    # ...
                                    pass
                    module_items_url = module['items_url']
                    module_items_response = requests.get(module_items_url)
                    if module_items_response.status_code == 200:
                        module_items = module_items_response.json()
                        for item in module_items:
                            if item['type'] == 'Assignment' or item['type'] == 'Quiz':
                                # Process the module item data and create task objects
                                # ...
                                pass
        # ...
        pass
        
        return tasks
    
    '''

            elif page == 'modules':
                # Logic to import tasks from Modules page
                #TODO: Module Items:
                    # make the request to the API to get the module items
                    # for each module item, check the type and if it is an assignment or quiz:
                        # type (string, optional) = ['File' or 'Page' or 'Discussion' or 'Assignment' or 'Quiz' 
                        # or 'SubHeader' or 'ExternalUrl' or 'ExternalTool']: 
                    # Parse the data and create a task object
                # ...
                pass
            elif page == 'assignments':
                # Logic to import tasks from Assignments page
                # ...
                pass
            elif page == 'quizzes':
                # Logic to import tasks from Quizzes page
                # ...
                pass
            elif page == 'pages':
                # Logic to import tasks from Pages page
                # ...
                pass

    '''

    def save_tasks_to_db(self, tasks):
        # Save the imported tasks to the database
        # TODO: Implement the logic to save tasks to the database
        # ...
        pass

    def get(self, request:Request):
        self.bearer_token = request.user.canvas_token
        
        # Scan syllabus first to get and understand course/grade distribution
        try:
            user_courses = request.user.lecture_courses.all()
            course_id = user_courses[0].id
            syllabus_tasks = self.import_tasks_from_syllabus(course_id)
            # self.save_tasks_to_db(syllabus_tasks)
        except NotFoundError:
            print('Syllabus not found')
        
        # # Import tasks from other pages
        # for page in self.pages[1:]:
        #     try:
        #         tasks = self.import_tasks_from_page(page)
        #         self.save_tasks_to_db(tasks)
        #     except NotFoundError:
        #         print(f'{page} not found, trying next page...')
        
        return Response({'message': 'Tasks imported successfully'}, status=200)