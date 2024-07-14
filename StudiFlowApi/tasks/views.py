from django.shortcuts import render
from django.views import View
from .models import Task
from rest_framework.request import Request
from rest_framework.response import Response
from prompts.prompts import AnthropicAPI
from PyPDF2 import PdfReader
import requests
import io


bearer_token = ''
headers = {"Authorization": f"Bearer {bearer_token}"}
pages = ['syllabus', 'pages', 'modules', 'assignments', 'quizzes']
anthropic_API = AnthropicAPI()

def get_canvas_api_response(course_id, page):
    base_url = f"https://utoronto.instructure.com/api/v1/course/{course_id}/{page}"

    response = requests.get(base_url, headers=headers)

    if response.status_code == 200:
        return Response({response.json()}, status=response.status_code)
    else:
        return Response({'error': 'Failed to retrieve data'}, status=response.status_code)

class ImportSyllabusDistributionView(View):

    def import_distribution_from_syllabus(self, course_id):
        print('Course ID:', course_id)
        # Import tasks from the specified page
        
        # Logic to import tasks from Syllabus page
        # Check if the syllabus page exists
        response = get_canvas_api_response(course_id, self.pages[0])
        
        if response.status_code == 200:
#TODO: complete this logic for looking for a syllabus in pages, modules, files, syllabus
            # If it exists, make the request to the API to get the syllabus page
            syllabus_page = response.data

            if syllabus_page['type'] == 'File' :
                # If it is a file, perform a get to the files url
                syllabus_file_url = syllabus_page['url']
                syllabus_file_response = requests.get(syllabus_file_url, headers=headers)
                if syllabus_file_response.status_code == 200:
                    file_format = syllabus_file_response.headers.get('Content-Type')
                    distribution = AnthropicAPI.get_distribution_from_syllabus(file_format, syllabus_file_response.json())
                    return distribution
                else:
                    raise Exception('Failed to retrieve file')

                    # Process the syllabus file data and create task objects
                    # ...
            elif syllabus_page['type'] == 'Page':
                # If it is a page, perform a get to the page text url
                syllabus_page_text_url = syllabus_page['url']
                syllabus_page_text_response = requests.get(syllabus_page_text_url, headers=headers)
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
                                if item['type'].lower() in ['assignment', 'quiz']:
                                    # Process the module item data and create task objects
                                    # ...
                                    pass
            elif item['type'].lower() in ['file', 'page', 'discussion', 'subheader', 'externalurl', 'externaltool'] and is_module_task_prompt(item) == 'True':
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
        
        return

# Create your views here.
class ImportTasksView(View):
    
    
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
            file_response = requests.get('https://utoronto.instructure.com/files/14343835/download?download_frd=1&verifier=By09qf3VxLIT1fBHWyiRuG5f73S1PCqtBh8rjvV0', headers=headers)
            if file_response.status_code == 200:
                file_format = file_response.headers.get('Content-Type')
                distribution = anthropic_API.get_distribution_from_syllabus(file_format, file_response)
                print(distribution)
                
            else:
                print('Failed to retrieve file')
            
            return
            user_courses = request.user.lecture_courses.all()
            course_id = user_courses[0].id
            syllabus_tasks = self.import_distribution_from_syllabus(course_id)
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