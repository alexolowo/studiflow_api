import requests
from rest_framework import generics, status
from rest_framework.request import Request
from rest_framework.response import Response

from sections.models import Section

from .models import Course
from rest_framework.permissions import IsAuthenticated


class UserCoursesView(generics.GenericAPIView):
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

        url = "https://utoronto.instructure.com/api/v1/courses"
        headers = {"Authorization": f"Bearer {bearer_token}"}
        params = {"enrollment_state": "active"}
        response = requests.get(url, headers=headers, params=params)

        if response.status_code == 200:
            courses_data = response.json()

            for course_data in courses_data:

                is_existing_course_or_section = (
                    Course.objects.filter(course_id=course_data["id"]).exists()
                    or Section.objects.filter(id=course_data["id"]).exists()
                )

                if not is_existing_course_or_section:

                    if "LEC" in course_data["name"].split()[2]:
                        course = Course(
                            id=course_data["id"],
                            course_code=course_data["course_code"].split()[0],
                            enrollment_term_id=course_data["enrollment_term_id"],
                            is_lecture=True,
                        )

                    elif (
                        "TUT" in course_data["name"].split()[2]
                        or "PRA" in course_data["name"].split()[2]
                        or "LAB" in course_data["name"].split()[2]
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
                    course.save()

            return Response(
                status=status.HTTP_200_OK,
                data={"message": "User courses retrieved and saved successfully.", "courses": courses_data},
            )

        return Response(data={"error": "Failed to retrieve user courses."}, status=status.HTTP_400_BAD_REQUEST)
