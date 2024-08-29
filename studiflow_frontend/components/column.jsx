import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from './ui/button';
import Task from './task';
import { PlusCircle, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { parseCourses } from '@/lib/utils';

export default function Column({
  title,
  description,
  tasks,
  onDragStart,
  onDragOver,
  onDrop,
  status,
  onTaskChange,
}) {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [taskChange, setTaskChange] = useState(false);
  useEffect(() => {
    async function getCourses() {
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
          // Remove tokens and redirect to home page
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          router.push('/');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error getting courses! status: ${response.status}`);
        }

        const data = await response.json();
        data && setData(parseCourses(data.courses));
      } catch (e) {
        console.error('There was a problem fetching the courses:');
        console.error(e);
      }
    }

    getCourses();
  }, []);

  useEffect(() => {
    if (taskChange) {
      onTaskChange();
    }
    setTaskChange(false);
  }, [taskChange]);

  return (
    <Card className="flex-1 " onDragOver={onDragOver} onDrop={(e) => onDrop(e, status)}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            <CardDescription className="text-sm text-gray-500">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task) => (
          <Task
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            courses={data}
            onTaskChange={(value) => setTaskChange(true)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
