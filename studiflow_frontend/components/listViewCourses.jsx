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
import { Loader2 } from 'lucide-react';

export default function ListViewCourses() {
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    getCourses();
  }, []);

  const getCourses = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch('https://studiflow-a4bd949e558f.herokuapp.com/courses/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/login');
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
  };

  const handleImportButtonClick = async () => {
    setIsImporting(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(
        'https://studiflow-a4bd949e558f.herokuapp.com/courses/load_courses/',
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
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error importing courses! status: ${response.status}`);
      }

      const data = await response.json();
      toast({
        title: 'Courses imported',
        description: 'Courses have been successfully imported',
      });
      getCourses(); // Refresh the course list
    } catch (e) {
      toast({
        title: 'Failed importing courses',
        description: 'There was a problem importing the courses',
        variant: 'destructive',
      });
      console.error('There was a problem importing the courses:');
      console.error(e);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateCourse = (values) => {
    setIsCreateOpen(false);
    getCourses();
  };

  return (
    <div className="grid grid-cols-2 gap-4 w-full h-fit">
      {data.length === 0 ? (
        <div className="col-span-2 text-center py-10">
          <p className="text-lg text-gray-600 mb-4">
            No courses found. Click the plus button to create a new course or the import button to
            import courses from Canvas.
          </p>
          <p className="text-sm text-gray-500">
            To import courses, make sure you've set your Canvas token. You can do this by clicking
            the profile avatar on the top right of the screen.
          </p>
        </div>
      ) : (
        data.map((course, index) => <CourseCard key={index} course={course} />)
      )}

      <HoverCard>
        <HoverCardTrigger asChild>
          <Button
            onClick={handleImportButtonClick}
            disabled={isImporting}
            variant="ghost"
            className="fixed bottom-40 right-12 border bg-white h-20 w-20 rounded-full border-gray-600 shadow-lg hover:bg-gray-300 hover:scale-110">
            {isImporting ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <IoDownloadOutline size={40} className="color-gray-600" />
            )}
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="mr-6 w-auto rounded-lg">
          <p className="text-sm text-gray-600">
            {isImporting ? 'Importing Courses...' : 'Import Courses'}
          </p>
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
