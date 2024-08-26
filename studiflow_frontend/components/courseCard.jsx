import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React from 'react';

const CourseCard = ({ course }) => {
  const path = `/${course.courseId}-${course.courseCode}`;
  const [completedCount, setCompletedCount] = React.useState(0);
  const [totalTasks, setTotalTasks] = React.useState(0);

  React.useEffect(() => {
    async function getCompletedTasks() {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const response = await fetch(
          `http://localhost:8000/tasks/${course.courseId}/filters/?status=DONE`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          router.push('/');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error getting tasks");! status: ${response.status}`);
        }

        const data = await response.json();
        const parsedResults = data.length;
        setCompletedCount(parsedResults);
      } catch (e) {
        console.error('There was a problem fetching the tasks:');
        console.error(e);
      }
    }

    getCompletedTasks();
  }, [course]);

  React.useEffect(() => {
    async function getUsersCourseTasks() {
      try {
        const accessToken = localStorage.getItem('accessToken');

        const response = await fetch(`http://localhost:8000/tasks/${course.courseId}/`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 401) {
          // Remove tokens and redirect to home page
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          router.push('/');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error getting tasks");! status: ${response.status}`);
        }

        const data = await response.json();

        const parsedResults = data.length;
        console.log(parsedResults);
        setTotalTasks(parsedResults);
      } catch (e) {
        console.error('There was a problem fetching the tasks:');
        console.error(e);
      }
    }

    getUsersCourseTasks();
  }, [course]);

  return (
    <Link href={path} passHref>
      <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{course.courseCode}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">{course.courseName}</p>
          <Progress value={(completedCount / totalTasks) * 100} className="w-full" />
          <p className="text-xs text-gray-500 mt-2">
            {completedCount} of {totalTasks} tasks completed
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CourseCard;
