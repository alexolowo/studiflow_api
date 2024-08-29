'use client';

import { useEffect, useState } from 'react';
import CourseCard from './courseCard';
import { useRouter } from 'next/navigation';
import { parseCourses } from '@/lib/utils';
import { IoDownloadOutline } from 'react-icons/io5';
import { FaPlus } from 'react-icons/fa';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CourseCreationForm } from '@/components/courseCreationForm';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
// A helper function

export default function ListViewCourses() {
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  // const [data, setData] = useState([
  //     {
  //         courseCode: 'APS360',
  //         courseName: 'Applied Fundamentals of Deep Learning',
  //         totalTasks: 10,
  //         completedTasks: 8
  //     },
  //     {
  //         courseCode: 'CSC148',
  //         courseName: 'Introduction to Computer Science',
  //         totalTasks: 12,
  //         completedTasks: 12
  //     },
  //     {
  //         courseCode: 'MAT235',
  //         courseName: 'Multivariable Calculus',
  //         totalTasks: 8,
  //         completedTasks: 6
  //     },
  //     {
  //         courseCode: 'ECO101',
  //         courseName: 'Principles of Microeconomics',
  //         totalTasks: 15,
  //         completedTasks: 10
  //     },
  //     {
  //         courseCode: 'PHY131',
  //         courseName: 'Introduction to Physics I',
  //         totalTasks: 14,
  //         completedTasks: 11
  //     },
  //     {
  //         courseCode: 'ENG101',
  //         courseName: 'Effective Communication',
  //         totalTasks: 9,
  //         completedTasks: 7
  //     },
  //     {
  //         courseCode: 'CHM135',
  //         courseName: 'Chemistry: Physical Principles',
  //         totalTasks: 11,
  //         completedTasks: 9
  //     }
  // ]);
  const [data, setData] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    async function getCourses() {
      try {
        const accessToken = localStorage.getItem('accessToken');

        const response = await fetch('http://localhost:8000/courses/', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
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
          setError('Failed getting active courses');
          throw new Error(`HTTP error getting courses! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        data && setData(parseCourses(data.courses));
      } catch (e) {
        setError(e.message);
        console.error('There was a problem fetching the courses:');
        console.error(e);
      }
    }

    getCourses();
  }, []);

  const handleImportButtonClick = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/courses/load_courses/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
      }

      if (response.status === 401) {
        // Remove tokens and redirect to home page
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error importing courses! status: ${response.status}`);
      }
    } catch (e) {
      toast({
        title: 'Failed importing courses',
        description: 'There was a problem importing the courses',
        variant: 'destructive',
      });
      console.error('There was a problem importing the courses:');
      console.error(e);
    }
  };

  const handleCreateCourse = (values) => {
    // Implement course creation logic here
    setIsCreateOpen(false);
  };

  return (
    <div className="grid grid-cols-2 gap-4 w-full h-fit">
      {data.map((course, index) => (
        <CourseCard key={index} course={course} />
      ))}
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button
            onClick={handleImportButtonClick}
            variant="ghost"
            className="fixed bottom-40 right-12 border bg-white h-20 w-20 rounded-full border-gray-600 shadow-lg hover:bg-gray-300 hover:scale-110">
            <IoDownloadOutline size={40} className="color-gray-600" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="mr-6 w-auto rounded-lg">
          <p className="text-sm text-gray-600">Import Courses</p>
        </HoverCardContent>
      </HoverCard>

      <HoverCard>
        <HoverCardTrigger asChild>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="fixed bottom-12 right-12 border bg-white h-20 w-20 rounded-full border-gray-600 shadow-lg hover:bg-gray-300 hover:scale-110">
                <FaPlus size={40} className="color-gray-600" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Fill out the form below to create a new course.
                </DialogDescription>
              </DialogHeader>
              <CourseCreationForm onConfirm={handleCreateCourse} />
            </DialogContent>
          </Dialog>
        </HoverCardTrigger>
        <HoverCardContent className="mr-6 w-auto rounded-lg">
          <p className="text-sm text-gray-600">Create New Course</p>
        </HoverCardContent>
      </HoverCard>
      <Toaster />
    </div>
  );
}
