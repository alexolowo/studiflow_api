import requests
from rest_framework import generics, status
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Course


class UserCoursesView(generics.GenericAPIView):
    def get(self, request: Request):
        # Get the Bearer Token from the user model
        bearer_token = request.user.canvas_token

        # Make a GET request to retrieve all user courses
        url = "https://utoronto.instructure.com/api/v1/courses"
        headers = {"Authorization": f"Bearer {bearer_token}"}
        params = {"enrollment_state": "active"}
        response = requests.get(url, headers=headers, params=params)

        # Check if the request was successful
        if response.status_code == 200:
            courses_data = response.json()

            # Iterate over the courses data
            for course_data in courses_data:
                # Check if the course already exists
                if not Course.objects.filter(course_id=course_data["id"]).exists():
                    # Create a new Course model for the course
                    course = Course(
                        id=course_data["id"],
                        course_name=course_data["name"],
                        # Add other relevant fields from the courses data
                    )
                    course.save()

            return Response(status=status.HTTP_200_OK, data={"message": "User courses retrieved and saved successfully."})

        return Response(data={"error": "Failed to retrieve user courses."}, status=status.HTTP_400_BAD_REQUEST)
