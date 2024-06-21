import requests
from rest_framework import generics, status
from rest_framework.request import Request
from rest_framework.response import Response

from studiflow_api.StudiFlowApi.sections.models import Section

from .models import Course
from rest_framework.permissions import IsAuthenticated


class UserCoursesView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request):
        
        bearer_token = request.user.canvas_token

        url = "https://utoronto.instructure.com/api/v1/courses"
        headers = {"Authorization": f"Bearer {bearer_token}"}
        params = {"enrollment_state": "active"}
        response = requests.get(url, headers=headers, params=params)

        
        if response.status_code == 200:
            courses_data = response.json()

            
            for course_data in courses_data:
                
                if not Course.objects.filter(course_id=course_data["id"]).exists():
                    
                    course = Course(
                            course_id=course_data["id"],
                            course_name=course_data["name"],
                            course_code=course_data["course_code"],
                            isMainCourse=True,
                            
                        )
                    if "LEC" in course_data["name"].split()[0]:
                        course.isMainCourse = True
                        
                    elif ("TUT" in course_data["name"]
                    or "PRA" in course_data["name"]
                    or "LAB" in course_data["name"]):
                        course_name = course_data["name"]
                        main_course_name = course_name.split()[0]
                        main_course = Course.objects.get(course_name=main_course_name)
                        section, created = Section.objects.get_or_create(main_course=main_course)
                        
                        if created:
                            section.section_courses = [course_data["id"]]
                        else:
                            section.section_courses.append(course_data["id"])
                        section.save()
                    course.save()

            return Response(status=status.HTTP_200_OK, data={"message": "User courses retrieved and saved successfully.", "courses": courses_data})

        return Response(data={"error": "Failed to retrieve user courses."}, status=status.HTTP_400_BAD_REQUEST)
