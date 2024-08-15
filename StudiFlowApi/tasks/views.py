from django.http import JsonResponse
from django.views import View
from .models import Task
from .serializers import TaskSerializer
from rest_framework.request import Request
from rest_framework import status
from rest_framework.response import Response
from prompts.task_prompts import AnthropicAPI
import requests
from courses.models import Course
import json

IMPORT_PAGES = ['assignments', 'quizzes' , 'modules']
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
    BEARER_TOKEN =''
    HEADERS = ''
    USER = None

    def get_tasks_from_assignments(self, course_id):
        response = get_canvas_api_response(course_id, IMPORT_PAGES[0], headers=self.HEADERS)
        tasks = []
        if response.status_code == 200:
            assignments = response.data
            for assignment in assignments:
                task = Task()
                task.id = assignment['id']
                task.task_description = assignment['description']
                task.task_name = assignment['name']
                task.task_type = 'assignment'
                task.html_url = assignment['html_url']
                task.weight = assignment['points_possible']
                task.points_possible = assignment['points_possible']
                task.due_date = assignment['due_at']
                task.course = Course.objects.get(id=course_id)
                task.user = self.USER
                tasks.append(task)
        
        return tasks
   
    def get_tasks_from_quizzes(self, course_id):
        response = get_canvas_api_response(course_id, IMPORT_PAGES[1], headers=self.HEADERS)
        tasks = []
        if response.status_code == 200:
            assignments = response.data
            for assignment in assignments:
                task = Task()
                task.id = assignment['id']
                task.task_description = assignment['description']
                task.task_name = assignment['title']
                task.task_type = 'quiz'
                task.html_url = assignment['html_url']
                task.weight = assignment['points_possible']
                task.points_possible = assignment['points_possible']
                task.due_date = assignment['due_at']
                task.course = Course.objects.get(id=course_id)
                task.user = self.USER
                tasks.append(task)
        
        return tasks
    
    def get_tasks_from_modules(self, course_id):
        tasks = []
        response = get_canvas_api_response(course_id, IMPORT_PAGES[2],headers=self.HEADERS)
        if response.status_code == 200:
            modules_page = response.data
            for module in modules_page:
                is_task_found_in_module = (ANTHROPIC_PROMPTS.analyze_module_for_task_prompt(module))
                if is_task_found_in_module:
                    
                    module_items_url = module['items_url']
                    module_items_response = requests.get(module_items_url, headers=self.HEADERS)

                    if module_items_response.status_code == 200:
                        module_items = module_items_response.json()
                        for item in module_items:
                            is_task_present_in_module_item = ANTHROPIC_PROMPTS.analyze_module_item_for_task_prompt(item)
                            
                            if is_task_present_in_module_item:
                                task = Task()
                                task.task_name = item['title']
                                task.html_url=item['url']
                                task.task_type = 'module'
                                task.id = item['id']
                                task.course_id = course_id
                                task.user = self.USER
                                tasks.append(task)
        return tasks    


    def import_tasks_from_course(self, course_id):
        tasksFound = {
                'assignments': [],
                'quizzes': [],  
                'modules': []                    
            }
        serializer_class = TaskSerializer
            
        assignment_tasks= self.get_tasks_from_assignments(course_id)
        if len(assignment_tasks)>0:
            assignment_tasks = serializer_class(assignment_tasks, many=True)
            tasksFound['assignments']=(assignment_tasks.data)
        
        quiz_tasks = self.get_tasks_from_quizzes(course_id)
        if len(quiz_tasks)>0:
            quiz_tasks = serializer_class(quiz_tasks, many=True)
            tasksFound['quizzes']=(quiz_tasks.data)
        
        module_tasks = self.get_tasks_from_modules(course_id)
        if len(module_tasks)>0:
            module_tasks = serializer_class(module_tasks, many=True)
            tasksFound['modules']=(module_tasks.data)

        return tasksFound


    def save_tasks_to_db(self, tasks):
        for task_list in tasks.values():
            for task in task_list:
                task.save()

    def get(self, request:Request):
        self.BEARER_TOKEN = request.user.canvas_token
        self.HEADERS = {"Authorization": f"Bearer {self.BEARER_TOKEN}"}
        self.USER = request.user
        
        user_courses = request.user.lecture_courses.all()
        data = {}
        for course in user_courses:
            course_id = course.id
            tasks = self.import_tasks_from_course(course_id)
            # self.save_tasks_to_db(tasks)
            data[course_id] = tasks
            
            return JsonResponse(data={'message': 'Task Import Successful',
                                  'data': data}, status=status.HTTP_200_OK)