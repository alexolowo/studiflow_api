from django.http import JsonResponse
from django.views import View
from .models import Distribution
from rest_framework.request import Request
from rest_framework import status
from rest_framework.response import Response
from prompts.syllabus_prompts import AnthropicAPI
import requests
from courses.models import Course
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
    
def set_course_distribution(user, course_id, distribution):
    try:
        course = Course.objects.filter(id=course_id).exists()
        if course and distribution:
            distribution = Distribution.objects.create(distribution=distribution)
            distribution.course_id = course_id
            distribution.user = user
            distribution.save()
        return True
    except Exception as e:
        return False

class ImportSyllabusDistributionView(View):
    BEARER_TOKEN =''
    HEADERS = ''
    USER = None

    def import_distribution_from_syllabus(self, course_id):
        
        # Check the front page for syllabus
        response = get_canvas_api_response(course_id, IMPORT_PAGES[0], headers=self.HEADERS)
        distribution = None
        syllabus_prediction = ANTHROPIC_PROMPTS.is_syllabus_in_front_page(response.data)

        
        is_syllabus_found_in_front_page = (response.status_code == 200 
            and NO_FRONT_PAGE not in str(response.data)
            and syllabus_prediction['is_syllabus_present'] == 'True')

        if is_syllabus_found_in_front_page:
            syllabus_url = syllabus_prediction['url']
            syllabus_response = requests.get(syllabus_url, headers=self.HEADERS)

            if syllabus_response.status_code == 200:
                file_format = syllabus_response.headers.get('Content-Type')
                link_in_html = ANTHROPIC_PROMPTS.is_syllabus_a_link(syllabus_response.content)
                if link_in_html['is_syllabus_present'] == 'True':
                    link_content = requests.get(link_in_html['url'])
                    link_content_type = link_content.headers.get('Content-Type')

                    if link_content.status_code == 200:
                        distribution = ANTHROPIC_PROMPTS.get_distribution_from_syllabus(link_content_type, link_content)
                else:
                    if syllabus_response.status_code == 200:
                        distribution = ANTHROPIC_PROMPTS.get_distribution_from_syllabus(file_format, syllabus_response)
                
                is_course_distribution_set = set_course_distribution(course_id=course_id, distribution=distribution, user=self.USER )
                return Response(data=distribution, status=200) if is_course_distribution_set else Response({'message': 'Failed to set course distribution'}, status=500)
        
        # Check the tabs page for syllabus
        else:
            response = get_canvas_api_response(course_id, IMPORT_PAGES[1], headers=self.HEADERS)
            if response.status_code == 200:
                tabs = response.data
                for tab in tabs:
                    is_syllabus_found_in_this_tab = (tab['id'].lower() in SYLLABUS_ALIASES 
                                                     or tab['label'].lower() in SYLLABUS_ALIASES)
                    if is_syllabus_found_in_this_tab:
                        syllabus_url = tab['full_url']
                        syllabus_response = requests.get(syllabus_url, headers=self.HEADERS)
                        if syllabus_response.status_code == 200:
                            file_format = syllabus_response.headers.get('Content-Type')
                            link_in_html = ANTHROPIC_PROMPTS.is_syllabus_a_link(syllabus_response.content)
                            if link_in_html['is_syllabus_present'] == 'True':
                                link_content = requests.get(link_in_html['url'])
                                link_content_type = link_content.headers.get('Content-Type')

                                
                                if link_content.status_code == 200:
                                    distribution = ANTHROPIC_PROMPTS.get_distribution_from_syllabus(link_content_type, link_content)
                            else:
                                if syllabus_response.status_code == 200:
                                    distribution = ANTHROPIC_PROMPTS.get_distribution_from_syllabus(file_format, syllabus_response)
                            
                            
                            course_distribution_set = set_course_distribution(course_id=course_id, distribution=distribution, user=self.USER )
                            return Response(data=distribution, status=200) if course_distribution_set else Response({'message': 'Failed to set course distribution'}, status=500)
                
                
        # #check modules
            response = get_canvas_api_response(course_id, IMPORT_PAGES[2],headers=self.HEADERS)
            if response.status_code == 200:
                modules_page = response.data
                for module in modules_page:
                    is_syllabus_found_in_module = (module['name'].lower() in SYLLABUS_ALIASES 
                                                        or ANTHROPIC_PROMPTS.analyze_module_for_syllabus_prompt(module))
                    if is_syllabus_found_in_module:
                        
                        module_items_url = module['items_url']
                        module_items_response = requests.get(module_items_url, headers=self.HEADERS)

                        if module_items_response.status_code == 200:
                            module_items = module_items_response.json()
                            for item in module_items:
                                
                                is_file_type = item['type'].lower() == 'File'
                                is_page_type = item['type'].lower() == 'Page'
                                is_syllabus_present_in_module_item = ANTHROPIC_PROMPTS.analyze_module_item_for_syllabus_prompt(item)
                                
                                if is_file_type or is_page_type or is_syllabus_present_in_module_item:
                                    
                                    item_content = requests.get(item['url'])
                                    item_content_type = item_content.headers.get('Content-Type')
                                    if item_content.status_code == 200:
                                        distribution = ANTHROPIC_PROMPTS.get_distribution_from_syllabus(item_content_type, item_content)
                                    course_distribution_set = set_course_distribution(course_id=course_id, distribution=distribution, user=self.USER)
                                    return Response(data=distribution, status=200) if course_distribution_set else Response({'message': 'Failed to set course distribution'}, status=500)
        
        return Response({'message': 'Syllabus not found via importing'}, status=404)
    
    def setBearerToken(self, token):
        self.BEARER_TOKEN = token
        self.HEADERS = {"Authorization": f"Bearer {self.BEARER_TOKEN}"}
    
    def get(self, request:Request):
        self.setBearerToken(request.user.canvas_token)
        self.USER = request.user
        user_courses = request.user.lecture_courses.all()
        data = {}
        for course in user_courses:
            course_id = course.id
            distribution = self.import_distribution_from_syllabus(course_id)
            if distribution.status_code == 200:
                data = distribution.data

        
        if len(data.keys())>0:
            response = {'date': data, 'message': 'Syllabus found', 'status': status.HTTP_200_OK}
            return JsonResponse(response)
        
        response = {'date': data, 'message': 'No syllabus found', 'status': status.HTTP_404_NOT_FOUND}
        return JsonResponse(response)