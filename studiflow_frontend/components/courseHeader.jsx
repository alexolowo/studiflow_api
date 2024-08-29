import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { ChevronDown } from 'lucide-react';
import { parseCourses } from '@/lib/utils';
import { FaRegCompass } from 'react-icons/fa';

export function CourseHeader({ currentCourse }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const router = useRouter();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('https://studiflow-a4bd949e558f.herokuapp.com/courses/', {
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
        throw new Error(`HTTP error getting tasks");! status: ${response.status}`);
      }

      const data = await response.json();
      data && setCourses(parseCourses(data.courses));
    };

    fetchData();
  }, []);

  const handleCourseSelect = (course) => {
    console.log(course);
    setSelectedCourse(course);
    const path = `/${course.courseId}-${course.courseCode}`;
    router.push(path);
  };

  return (
    courses.length > 0 && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-2">
            {currentCourse && currentCourse[0] && currentCourse[0]?.courseName ? (
              <span className="text-2xl">{currentCourse[0].courseName}</span>
            ) : (
              <div className="flex items-center space-x-2">
                <FaRegCompass className="h-8 w-8" />
                <span className="text-2xl">Navigate To...</span>
              </div>
            )}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {courses.map((course) => (
            <DropdownMenuCheckboxItem key={course.id} onClick={() => handleCourseSelect(course)}>
              {course.courseCode} - {course.courseName}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  );
}
