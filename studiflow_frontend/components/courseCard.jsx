import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React from 'react';
import { FaRegTrashAlt } from 'react-icons/fa';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

const CourseCard = ({ course }) => {
  const path = `/${course.courseId}-${course.courseCode}`;
  const [completedCount, setCompletedCount] = React.useState(0);
  const [totalTasks, setTotalTasks] = React.useState(0);

  const { toast } = useToast();

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

  const handleDeleteCourse = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/courses/delete/${course.courseId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        window.location.reload();
      } else {
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          router.push('/');
          return;
        }

        toast({
          title: 'Failed deleting course',
          description: 'There was a problem deleting the course',
          variant: 'destructive',
        });
      }
    } catch (e) {
      console.error('There was a problem deleting the course:');
      console.error(e);
    }
  };

  console.log(course);

  return (
    <div className="relative flex flex-col">
      <Link href={path} passHref>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold">{course.courseCode}</CardTitle>
            </div>
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
      {course.userCreated && (
        <Dialog>
          <DialogTrigger>
            <Button variant="ghost" size="icon" className="cursor-pointer z-10">
              <FaRegTrashAlt className="cursor-pointer" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Course</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this course? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {}}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCourse}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <Toaster />
    </div>
  );
};

export default CourseCard;
