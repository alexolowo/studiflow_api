from users.models import User
from rest_framework import generics, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes


from .models import UserCourse
from .serializers import UserCoursesSerializer

# Create your views here.
class UserCoursesListCreateView(generics.ListCreateAPIView):
    queryset = UserCourse.objects.all()
    serializer_class = UserCoursesSerializer

    def get(self, request: Request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    def post(self, request:Request, *args, **kwargs):
        return self.create(request, *args, **kwargs)
    
    
class UserCoursesRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = UserCourse.objects.all()
    serializer_class = UserCoursesSerializer

    def get(self, request: Request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

    def put(self, request: Request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def delete(self, request: Request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)
    
@api_view(http_method_names=['GET'])
@permission_classes([IsAuthenticated])
def get_user_courses(request: Request):
    user_courses = User.objects.get(email=request.user.email).courses
    serializer = UserCoursesSerializer(instance=user_courses, many=True)
    
    return Response(data=serializer.data, status=status.HTTP_200_OK)

@api_view(http_method_names=['GET'])
@permission_classes([AllowAny])
def get_user_tasks(request: Request):
    user_courses = User.objects.get(email=request.user.email).courses
    tasks = []
    for course in user_courses:
        tasks.append(course.tasks)
        
    return Response(data=tasks, status=status.HTTP_200_OK)