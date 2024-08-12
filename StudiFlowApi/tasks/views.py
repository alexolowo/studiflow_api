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

    

    if response.status_code == 200:
        return Response(data=json.loads(response.content), status=200)
    else:
        return Response({'error': 'Failed to retrieve data'}, status=response.status_code)

# Create your views here.

class ImportTasksView(View):

    def save_tasks_to_db(self, tasks):
        # Save the imported tasks to the database
        # TODO: Implement the logic to save tasks to the database
        # ...
        pass

    def get(self, request:Request):
        # BEARER_TOKEN = request.user.canvas_token
        
        # # Scan syllabus first to get and understand course/grade distribution
        # try:
        #     file_response = requests.get('https://utoronto.instructure.com/files/14343835/download?download_frd=1&verifier=By09qf3VxLIT1fBHWyiRuG5f73S1PCqtBh8rjvV0', headers=self.HEADERS)
        #     if file_response.status_code == 200:
        #         file_format = file_response.headers.get('Content-Type')
        #         distribution = ANTHROPIC_PROMPTS.get_distribution_from_syllabus(file_format, file_response)
                
                
        #     else:
                
            
        #     return
        #     user_courses = request.user.lecture_courses.all()
        #     course_id = user_courses[0].id
        #     syllabus_tasks = self.import_distribution_from_syllabus(course_id)
        #     # self.save_tasks_to_db(syllabus_tasks)
        # except NotFoundError:
            
        
        # # # Import tasks from other pages
        # # for page in self.pages[1:]:
        # #     try:
        # #         tasks = self.import_tasks_from_page(page)
        # #         self.save_tasks_to_db(tasks)
        # #     except NotFoundError:
        
        
            # return Response({'message': 'Tasks imported successfully'}, status=200)
            pass