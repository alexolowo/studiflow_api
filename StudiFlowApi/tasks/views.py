import difflib
from django.http import JsonResponse
from .models import Task
from .serializers import TaskSerializer
from rest_framework.request import Request
from rest_framework import status, generics
from rest_framework.response import Response
from prompts.task_prompts import AnthropicAPI
import requests
import json
from typing import List
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .filters import TaskFilter

IMPORT_PAGES: List[str] = ['assignments', 'quizzes' , 'modules']
ANTHROPIC_PROMPTS = AnthropicAPI()
NO_FRONT_PAGE: str = "No front page has been set"


def get_canvas_api_response(course_id, page, headers):
    base_url = f"https://utoronto.instructure.com/api/v1/courses/{course_id}/{page}/"

    response = requests.get(base_url, headers=headers)

    

    if response.status_code == 200:
        return Response(data=json.loads(response.content), status=200)
    else:
        return Response({'error': 'Failed to retrieve data'}, status=response.status_code)

# Create your views here.

class ImportTasksView(generics.GenericAPIView):

    permission_classes = [IsAuthenticated]

    BEARER_TOKEN =''
    HEADERS = ''
    USER = None

    def get_tasks_from_assignments(self, course_id: int) -> List[Task]:
        response = get_canvas_api_response(course_id, IMPORT_PAGES[0], headers=self.HEADERS)
        
        tasks = []
        if response.status_code == 200:
            assignments = response.data
            for assignment in assignments:
                task = Task()
                task.task_description = assignment['description']
                task.task_name = assignment['name']
                task.task_type = 'assignment'
                task.html_url = assignment['html_url']
                task.weight = assignment['points_possible']
                task.points_possible = assignment['points_possible']
                task.due_date = assignment['due_at']
                task.course_id = course_id
                task.user = self.USER
                tasks.append(task)
        
        return tasks
   
    def get_tasks_from_quizzes(self, course_id: int) -> List[Task]:
        response = get_canvas_api_response(course_id, IMPORT_PAGES[1], headers=self.HEADERS)
        tasks = []
        if response.status_code == 200:
            assignments = response.data
            for assignment in assignments:
                task = Task()
                task.task_description = assignment['description']
                task.task_name = assignment['title']
                task.task_type = 'quiz'
                task.html_url = assignment['html_url']
                task.weight = assignment['points_possible']
                task.points_possible = assignment['points_possible']
                task.due_date = assignment['due_at']
                task.course_id = course_id
                task.user = self.USER
                tasks.append(task)
        
        return tasks
    
    def get_tasks_from_modules(self, course_id: int) -> List[Task]:
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
                                task.course_id = course_id
                                task.user = self.USER
                                tasks.append(task)
        return tasks    


    def import_tasks_from_course(self, course_id: int) -> list:
        already_scanned_set = set()
        tasksFound = []
        serializer_class = TaskSerializer
        user_tasks = Task.objects.filter(user=self.USER, course_id=course_id).values_list('task_name', flat=True)
        
        assignment_tasks= self.get_tasks_from_assignments(course_id)
        
        if len(assignment_tasks)>0:
            assignment_tasks = serializer_class(assignment_tasks, many=True)
            for task in assignment_tasks.data:
                if task['task_name'] not in already_scanned_set and not task['task_name'] in user_tasks:
                    already_scanned_set.add(task['task_name'])
                    tasksFound.append(task)
        
        quiz_tasks = self.get_tasks_from_quizzes(course_id)
        if len(quiz_tasks)>0:
            quiz_tasks = serializer_class(quiz_tasks, many=True)
            for task in quiz_tasks.data:
                if task['task_name'] not in already_scanned_set and not task['task_name'] in user_tasks:
                    already_scanned_set.add(task['task_name'])
                    tasksFound.append(task)
            
        
        module_tasks = self.get_tasks_from_modules(course_id)
        if len(module_tasks)>0:
            module_tasks = serializer_class(module_tasks, many=True)
            for task in module_tasks.data:
                if task['task_name'] not in already_scanned_set and not task['task_name'] in user_tasks:
                    already_scanned_set.add(task['task_name'])
                    tasksFound.append(task)

        return tasksFound

    def save_tasks_to_db(self, tasks: list):
            for task in tasks:
                new_task = Task.objects.create(
                    task_name=task['task_name'],
                    task_type=task['task_type'],
                    task_description=ANTHROPIC_PROMPTS.summarize_text_prompt(text=task['task_description']),
                    due_date=task['due_date'],
                    status=task['status'],
                    submission_link=task['submission_link'],
                    weight=task['weight'],
                    points_possible=task['points_possible'],
                    html_url=task['html_url'],
                    user=self.USER,
                    course_id=task['course_id'],
                    notes=task['notes'],
                    grade=task['grade'],
                )
                duplicate = Task.objects.filter(task_name=new_task.task_name, 
                                    user=new_task.user,
                                    course_id=new_task.course_id, 
                                    due_date=new_task.due_date, 
                                    html_url=new_task.html_url,
                                    submission_link=new_task.submission_link
                                    )
                if duplicate.exists():
                    continue
                new_task.save()

    def get(self, request:Request, course_id:int):
        self.BEARER_TOKEN = request.user.canvas_token
        self.HEADERS = {"Authorization": f"Bearer {self.BEARER_TOKEN}"}
        self.USER = request.user
        
        data: dict[int,list[Task]] = {}
        print(f"Importing tasks for course {course_id}")
        tasks = self.import_tasks_from_course(course_id)
        self.save_tasks_to_db(tasks)
        data[course_id] = tasks
            
        if len(tasks) == 0:
            test_request = requests.get(f"https://utoronto.instructure.com/api/v1/courses/{course_id}/", headers=self.HEADERS)
            if test_request.status_code == 200:
                return JsonResponse(data={'message': 'No tasks found for this course'}, status=status.HTTP_204_NO_CONTENT)
            elif test_request.status_code == 401:
                return JsonResponse(data={'message': 'Unauthorized, canvas token likely expired'}, status=status.HTTP_403_FORBIDDEN)
            else:
                return JsonResponse(data={'error': 'Failed to retrieve data'}, status=test_request.status_code)
        return JsonResponse(data={'message': 'Task Import Successful',
                                'data': data}, status=status.HTTP_200_OK)
        

class UserTasksView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def task_similarity(self, task1, task2, threshold=0.95):
        fields_to_compare = ['task_name', 'task_description', 'weight', 'points_possible']
        total_similarity = 0
        fields_compared = 0

        for field in fields_to_compare:
            value1 = task1[field] or None
            value2 = task2[field] or None

            if value1 is not None and value2 is not None:
                if isinstance(value1, str) and isinstance(value2, str):
                    field_similarity = difflib.SequenceMatcher(None, value1, value2).ratio()
                elif isinstance(value1, (int, float)) and isinstance(value2, (int, float)):
                    max_value = max(abs(value1), abs(value2))
                    field_similarity = 1 - (abs(value1 - value2) / max_value) if max_value else 1
                else:
                    field_similarity = 1 if value1 == value2 else 0

                total_similarity += field_similarity
                fields_compared += 1

        average_similarity = total_similarity / fields_compared if fields_compared > 0 else 0

        return average_similarity >= threshold

    def get(self, request: Request, course_id: int = None):
        user = request.user
        tasks = Task.objects.filter(user=user, course_id=course_id)
        serializer = TaskSerializer(tasks, many=True)
        return Response(data=serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request: Request, course_id: int = None, task_id: int = None):
        user = request.user
        task = Task.objects.get(user=user, course_id=course_id, id=task_id)
        serializer = TaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(data=serializer.data, status=status.HTTP_200_OK)
        return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def post(self, request: Request, course_id: int = None):
        user = request.user
        tasks = Task.objects.filter(user=user, course_id=course_id)
        
        serializer = TaskSerializer(tasks, many=True)

        for task in serializer.data:
            if self.task_similarity(task, request.data):
                return Response(data={'error': 'Similar task already exists',
                                      'task': task}, status=status.HTTP_208_ALREADY_REPORTED)
            
        new_task = TaskSerializer(data=request.data, partial=True)
        new_task.initial_data['user'] = user.id
        new_task.initial_data['course_id'] = course_id
        if new_task.is_valid():
            new_task.save()
            return Response(data=new_task.data, status=status.HTTP_201_CREATED)
        print(new_task.errors)
        return Response(data=new_task.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request: Request, course_id: int = None, task_id: int = None):
        user = request.user
        task = Task.objects.filter(user=user, course_id=course_id, id=task_id)
        task.delete()
        return Response(data={'message': 'Task deleted successfully'}, status=status.HTTP_200_OK)
    

class TaskFilterView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TaskFilter
    ordering_fields = ['status', 'due_date', 'weight', 'points_possible']

    def get_queryset(self, user, course_id):
        return Task.objects.filter(course_id=course_id, user=user)
    
    def get(self, request: Request, course_id: int):
        
        # Get the queryset
        queryset = self.filter_queryset(self.get_queryset(request.user, course_id))
        # Paginate the results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        # If pagination is not required
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    

class UserFilterView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TaskFilter
    ordering_fields = ['status', 'due_date', 'weight', 'points_possible']
    
    def get(self, request: Request):
        
        # Get the queryset
        queryset = self.filter_queryset(Task.objects.filter(user=request.user))
        # Paginate the results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        # If pagination is not required
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    
    
class GeneralTasksInfoView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request):
        tasks = Task.objects.filter(user=request.user)
        tasks = TaskSerializer(tasks, many=True)
        total_tasks = len(tasks.data)
        return Response(data={'total_tasks': total_tasks, 
                              'tasks': tasks.data}, status=status.HTTP_200_OK)