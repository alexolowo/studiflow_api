from django.http import JsonResponse
from django.shortcuts import render
from django.views import View
from .models import Task
from rest_framework.request import Request
from rest_framework import status
from rest_framework.response import Response
from prompts.prompts import AnthropicAPI
from PyPDF2 import PdfReader
import requests
from courses.models import Course
import io
import json

IMPORT_PAGES = ['front_page', 'tabs' , 'modules']
ANTHROPIC_PROMPTS = AnthropicAPI()
NO_FRONT_PAGE = "No front page has been set"
SYLLABUS_ALIASES = ['syllabus', 'course information', 'course overview', 'overview', 'breakdown']


def get_canvas_api_response(course_id, page, headers):
    base_url = f"https://utoronto.instructure.com/api/v1/courses/{course_id}/{page}/"

    response = requests.get(base_url, headers=headers)

    print(f'\n{response}\n')

    if response.status_code == 200:
        return Response(data={response.content}, status=200)
    else:
        return Response({'error': 'Failed to retrieve data'}, status=response.status_code)
    
def set_course_distribution(course_id, distribution):
    try:
        course = Course.objects.get(id=course_id)
        course.distribution = distribution
        course.save()
        return True
    except Exception as e:
        return False

class ImportSyllabusDistributionView(View):
    BEARER_TOKEN =''
    HEADERS = ''

    def import_distribution_from_syllabus(self, course_id):
        
        # Check the front page for syllabus
        response = get_canvas_api_response(course_id, IMPORT_PAGES[0], headers=self.HEADERS)
        
        syllabus_prediction = json.loads(ANTHROPIC_PROMPTS.is_syllabus_in_front_page(response.data))['values']

        print(f'\n syllabus is present: {syllabus_prediction}\n')

        if (response.status_code == 200 
            and NO_FRONT_PAGE not in str(response.data)
            and syllabus_prediction['is_syllabus_present'] == 'True'):
            syllabus_url = syllabus_prediction['url']
            syllabus_response = requests.get(syllabus_url, headers=self.HEADERS)

            # print(f'\nSyllabus response: {syllabus_response.content}\n')
            if syllabus_response.status_code == 200:
                file_format = syllabus_response.headers.get('Content-Type')
                link_in_html = json.loads(ANTHROPIC_PROMPTS.is_syllabus_a_link(syllabus_response.content))
                if link_in_html['is_syllabus_present'] == 'True':
                    link_content = requests.get(link_in_html['url'])
                    link_content_type = link_content.headers.get('Content-Type')
                    distribution = ANTHROPIC_PROMPTS.get_distribution_from_syllabus(link_content_type, link_content)
                else:
                    distribution = ANTHROPIC_PROMPTS.get_distribution_from_syllabus(file_format, syllabus_response)
                print(f'\nDistribution: {distribution}\n')
                is_course_distribution_set = set_course_distribution(course_id, distribution)
                print(f'\nCourse distribution set: {is_course_distribution_set}\n')
                return Response(data=distribution, status=200) if is_course_distribution_set else Response({'message': 'Failed to set course distribution'}, status=500)
        
        # Check the tabs page for syllabus
        elif response.status_code != 200:
            response = get_canvas_api_response(course_id, IMPORT_PAGES[1], headers=self.HEADERS)
            if response.status_code == 200:
                tabs = response.data
                for tab in tabs:
                    if tab['title'].lower() in SYLLABUS_ALIASES or tab['label'].lower() in SYLLABUS_ALIASES:
                        syllabus_url = tab['full_url']
                        syllabus_response = requests.get(syllabus_url, headers=self.HEADERS)
                        if syllabus_response.status_code == 200:
                            file_format = syllabus_response.headers.get('Content-Type')
                            link_in_html = json.loads(ANTHROPIC_PROMPTS.is_syllabus_a_link(syllabus_response.content))
                if link_in_html['is_syllabus_present'] == 'True':
                    link_content = requests.get(link_in_html['url'])
                    link_content_type = link_content.headers.get('Content-Type')
                    distribution = ANTHROPIC_PROMPTS.get_distribution_from_syllabus(link_content_type, link_content)
                else:
                    distribution = ANTHROPIC_PROMPTS.get_distribution_from_syllabus(file_format, syllabus_response)
                course_distribution_set = set_course_distribution(course_id, distribution)
                return Response(data=distribution, status=200) if course_distribution_set else Response({'message': 'Failed to set course distribution'}, status=500)
                
                
        # #check modules
        else:
            response = get_canvas_api_response(course_id, IMPORT_PAGES[2],headers=self.HEADERS)
            if response.status_code == 200:
                
                modules_page = response.data
                for module in modules_page:
                    if module['name'].lower() in SYLLABUS_ALIASES and ANTHROPIC_PROMPTS.is_syllabus_prompt(module) == 'True':
                        # Logic to import tasks from the module
                        module_items_url = module['items_url']
                        module_items_response = requests.get(module_items_url)
                        if module_items_response.status_code == 200:
                            module_items = module_items_response.json()
                            for item in module_items:
                                if item['type'].lower()== 'File' or item['type'].lower() == 'Page' and ANTHROPIC_PROMPTS.is_syllabus_prompt(item) == 'True':
                                    distribution = ANTHROPIC_PROMPTS.get_distribution_from_syllabus(item['url'])
                                    course_distribution_set = set_course_distribution(course_id, distribution)
                                    return Response(data=distribution, status=200) if course_distribution_set else Response({'message': 'Failed to set course distribution'}, status=500)
        
        return Response({'message': 'Syllabus not found via importing'}, status=404)
    
    def setBearerToken(self, token):
        self.BEARER_TOKEN = token
        self.HEADERS = {"Authorization": f"Bearer {self.BEARER_TOKEN}"}
    
    def get(self, request:Request):
        self.setBearerToken(request.user.canvas_token)
        user_courses = request.user.lecture_courses.all()
        data = {}
        for course in user_courses:
            course_id = 202970
            distribution = self.import_distribution_from_syllabus(course_id)
            if distribution.status_code == 200:
                data = distribution.data

        print(f'\ndata: {len(data)}\n')
        if len(data.keys())>0:
            response = {'date': data, 'message': 'Syllabus found', 'status': status.HTTP_200_OK}
            return JsonResponse(response)
        
        response = {'date': data, 'message': 'No syllabus found', 'status': status.HTTP_404_NOT_FOUND}
        return JsonResponse(response)

# Create your views here.

class ImportTasksView(View):

    def save_tasks_to_db(self, tasks):
        # Save the imported tasks to the database
        # TODO: Implement the logic to save tasks to the database
        # ...
        pass

    def get(self, request:Request):
        BEARER_TOKEN = request.user.canvas_token
        
        # Scan syllabus first to get and understand course/grade distribution
        try:
            file_response = requests.get('https://utoronto.instructure.com/files/14343835/download?download_frd=1&verifier=By09qf3VxLIT1fBHWyiRuG5f73S1PCqtBh8rjvV0', headers=self.HEADERS)
            if file_response.status_code == 200:
                file_format = file_response.headers.get('Content-Type')
                distribution = ANTHROPIC_PROMPTS.get_distribution_from_syllabus(file_format, file_response)
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