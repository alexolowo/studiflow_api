import os
import requests
import re
from rest_framework import generics, status
from rest_framework.request import Request
from rest_framework.response import Response

from resources.models import Resource
from tasks.models import Task
from sections.models import Section
import cloudinary
import cloudinary.uploader
from .models import Course
from .serializers import CourseSerializer
from rest_framework.permissions import IsAuthenticated

cloudinary.config( 
    cloud_name = os.environ['CLOUDINARY_CLOUD_NAME'], 
    api_key = os.environ['CLOUDINARY_API_KEY'], 
    api_secret = os.environ['CLOUDINARY_API_SECRET'],
    secure=True
)
COURSE_CODE_PATTERN = r"[A-Z]{3,4}\d{3}[HY]\d"
SECTION_PATTERN = r"(TUT|PRA|LAB|Tutorial|Practical|Laboratory)"

class LoadUserCoursesView(generics.GenericAPIView):
    """
    API view for retrieving and saving user courses.

    This view allows authenticated users to retrieve and save their courses from a Canvas LMS API.
    The courses are retrieved based on the user's Canvas token.

    Attributes:
        permission_classes (list): A list of permission classes that control access to this view.

    Methods:
        get(request: Request) -> Response: Retrieves and saves the user's courses.

    """

    permission_classes = [IsAuthenticated]
    
    def get_course_data(self, bearer_token):
        url = "https://utoronto.instructure.com/api/v1/courses"
        headers = {"Authorization": f"Bearer {bearer_token}"}
        params = {"enrollment_state": "active"}
        response = requests.get(url, headers=headers, params=params)
        return response

    def get(self, request: Request):
        """
        Retrieves and saves the user's courses.

        This method sends a GET request to the Canvas LMS API to retrieve the user's active courses.
        The courses are filtered based on the enrollment state.

        Args:
            request (Request): The HTTP request object.

        Returns:
            Response: The HTTP response object containing the retrieved courses.

        Raises:
            None

        """

        bearer_token = request.user.canvas_token
        
        response = self.get_course_data(bearer_token)

        if response.status_code == 200:
            courses_data = response.json()

            for course_data in courses_data:
                course_code = course_data["course_code"]
                received_course_code = course_data["course_code"].split()
                match = re.match(COURSE_CODE_PATTERN, received_course_code[0])

                is_existing_course_or_section = (
                    Course.objects.filter(id=course_data["id"]).exists()
                    or Section.objects.filter(id=course_data["id"]).exists()
                    )
                
                if not is_existing_course_or_section:
                    
                    if not match:
                        continue

                    if "LEC" in received_course_code[2] or not re.search(SECTION_PATTERN, course_code):
                        course_name = course_data["name"]
                        colon_index = course_name.find(":")
                        course = Course(
                            id=course_data["id"],
                            course_code=course_data["course_code"].split()[0],
                            name=course_name[colon_index+1:].strip() if colon_index != -1 else course_name.strip(),
                            enrollment_term_id=course_data["enrollment_term_id"],
                            is_lecture=True,
                            was_user_created=True,
                        )
                        course.save()
                        course.user.add(request.user)
                    #TODO: use AI to determine if the course is a lecture or not

                    elif (
                        "TUT" in received_course_code[2]
                        or "PRA" in received_course_code[2]
                        or "LAB" in received_course_code[2]
                    ):

                        lecture_course_code = course_data["course_code"].split()[0]
                        lecture_course_object = Course.objects.get(course_code=lecture_course_code)
                        has_lecture_in_this_term = (
                            lecture_course_object.exists()
                            and lecture_course_object.enrollment_term_id == course_data["enrollment_term_id"]
                        )

                        if not has_lecture_in_this_term:
                            continue

                        section, created = Section.objects.get_or_create(
                            id=course_data["id"],
                            section_type=course_data["course_code"].split()[2][:3],
                            lecture_course=lecture_course_object,
                            enrollment_term_id=course_data["enrollment_term_id"],
                        )

                        if created:
                            section.section_courses = [course_data["id"]]
                        else:
                            section.section_courses.append(course_data["id"])
                        section.save()

                elif is_existing_course_or_section:
                    received_courses = Course.objects.get(id=course_data["id"])
                    
                    if received_courses:
                        received_courses.user.add(request.user)


            return Response(
                status=status.HTTP_200_OK,
                data={"message": "User courses retrieved and saved successfully.", "courses": courses_data},
            )
        
        elif response.status_code == 401:
                return Response(data={'message': 'Unauthorized, canvas token likely expired'}, status=status.HTTP_403_FORBIDDEN)

        return Response(data={"error": "Failed to retrieve user courses."}, status=status.HTTP_400_BAD_REQUEST)
    

class RetrieveUserCoursesView(generics.ListAPIView):
    """
    API view for retrieving all course models for a user.

    This view allows authenticated users to retrieve all course models associated with their account.

    Attributes:
        permission_classes (list): A list of permission classes that control access to this view.
        serializer_class (Serializer): The serializer class used to serialize the course models.

    Methods:
        get_queryset() -> QuerySet: Returns the queryset of course models for the user.

    """
    permission_classes = [IsAuthenticated]
    serializer_class = CourseSerializer

    def get_queryset(self):
        """
        Returns the queryset of course models for the user.

        This method retrieves all course models associated with the user's account.

        Returns:
            QuerySet: The queryset of course models.

        """
        user = self.request.user
        return user.lecture_courses.all()
    
    def get(self, request: Request, *args, **kwargs):
        queryset = self.get_queryset()
        serialized_courses = CourseSerializer(queryset, many=True)
        return Response(
            status=status.HTTP_200_OK,
            data={"message": "User courses retrieved and saved successfully.", "courses": serialized_courses.data},
        )
    

class CreateCourseView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CourseSerializer

    def post(self, request: Request, *args, **kwargs):
        course = Course(
            course_code=request.data["course_code"],
            name=request.data["name"],
            enrollment_term_id=request.data["enrollment_term_id"],
            is_lecture=request.data["is_lecture"],
            was_user_created=True,
        )

        try:
            course.save()
            course.user.add(request.user)
            serializer = CourseSerializer(course)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(e)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class DeleteCourseView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CourseSerializer

    def deleteCloudinaryResource(self, course_id, user_id):

        resources = Resource.objects.filter(course_id=course_id, user_id=user_id)
        for resource in resources:
            public_id = resource.resource_link.split('/')[-1].split('.')[0]
            cloudinary.uploader.destroy(public_id)
            resource.delete()

    def delete(self, request: Request, *args, **kwargs):
        course_id = kwargs.get('pk')
        try:
            course = Course.objects.get(id=course_id, was_user_created=True, user=request.user)
            if course.was_user_created:
                # Delete associated tasks
                Task.objects.filter(course_id=course_id, user=request.user).delete()
                # Delete associated resources
                self.deleteCloudinaryResource(course_id, request.user.id)
                Resource.objects.filter(course_id=course_id, user=request.user).delete()
                course.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            else:
                return Response(status=status.HTTP_404_NOT_FOUND)
        except Course.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)