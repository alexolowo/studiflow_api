import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { ChevronDown } from 'lucide-react';

export function CourseHeader({ courses, currentCourse }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const router = useRouter();

  const handleCourseSelect = (course) => {
    console.log(course);
    setSelectedCourse(course);
    const path = `/${course.courseId}-${course.courseCode}`;
    router.push(path);
  };

  console.log(currentCourse);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2">
          {currentCourse[0] && <span className="text-2xl">{currentCourse[0]?.courseName}</span>}
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
  );
}
