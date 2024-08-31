import React, { useState } from 'react';
import Column from './column';
import { mapBackendFieldsToFrontendTask } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import TaskFilterBar from './filterBar';
import { useToast } from '@/components/ui/use-toast';

export default function KanbanView() {
  const [taskData, setTaskData] = React.useState([]);
  const [error, setError] = React.useState(null);
  const router = useRouter();
  const { toast } = useToast();

  async function getUserTasks() {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`https://studiflow-a4bd949e558f.herokuapp.com/tasks/general/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        // Remove tokens and redirect to home page
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        setError('Failed getting active tasks');
        throw new Error(`HTTP error getting tasks");! status: ${response.status}`);
      }

      const data = await response.json();

      const parsedResults = data['tasks'].map((task) => mapBackendFieldsToFrontendTask(task));
      parsedResults && setTaskData(parsedResults);
    } catch (e) {
      setError(e.message);
      console.error('There was a problem fetching the tasks:');
      console.error(e);
    }
  }

  const updateTaskStatusOnDrop = async (task, status) => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(
        `https://studiflow-a4bd949e558f.herokuapp.com/tasks/${task.courseId}/${task.id}/`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: status }),
        }
      );

      if (response.status === 401) {
        // Remove tokens and redirect to home page
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        setError('Failed updating task status');
        throw new Error(`HTTP error updating task status: ${response.status}`);
      }

      await getUserTasks();
    } catch (e) {
      console.error('There was a problem updating the task status:');
      console.error(e);
    }
  };

  React.useEffect(() => {
    getUserTasks();
  }, []);

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Task 1',
      description: 'Submission whatever',
      status: 'todo',
      course: 'CSC207',
    },
    {
      id: 2,
      title: 'Task 2',
      description: 'Some more description here',
      status: 'inProgress',
      course: 'CSC148',
    },
    { id: 3, title: 'Task 3', description: 'Oh my oh my', status: 'done', course: 'MAT135' },
  ]);

  const columns = [
    { title: 'To Do', status: 'TO-DO', description: "Tasks that haven't been started" },
    { title: 'In Progress', status: 'IN PROGRESS', description: 'Tasks currently being worked on' },
    { title: 'Done', status: 'DONE', description: 'Completed tasks' },
  ];

  const onDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (e, status) => {
    const taskId = e.dataTransfer.getData('taskId');
    const task = taskData.find((task) => task.id.toString() === taskId);
    if (task.status === status) {
      return;
    }
    await updateTaskStatusOnDrop(task, status);
    await getUserTasks();
    // setTaskData(
    //   taskData.map((task) => (task.id.toString() === taskId ? { ...task, status } : task))
    // );
  };

  const handleApplyFilter = async (filters) => {
    console.log('filters', filters);
    try {
      const queryParams = Object.entries(filters)
        .filter(([key, value]) => value !== undefined && value !== '')
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      console.log('queryParams', queryParams);
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(
        `https://studiflow-a4bd949e558f.herokuapp.com/tasks/filters/?${queryParams}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
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
        throw new Error(`HTTP error applying filters: status: ${response.status}`);
      }

      const data = await response.json();
      const parsedResults = data.map((task) => mapBackendFieldsToFrontendTask(task));
      console.log('parsedResults', parsedResults);
      console.log('parsedResults', response.url);
      parsedResults && setTaskData(parsedResults);
      toast({
        title: 'Tasks Filtered',
        description: 'Tasks have been successfully filtered',
      });
    } catch (e) {
      console.error('There was a problem applying filters:');
      console.error(e);
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <div className="mb-4 mx-12 flex flex-col gap-2">
        <TaskFilterBar onFilter={handleApplyFilter} onClear={getUserTasks} />
        <span className="text-sm text-gray-500 self-center">
          By default, Tasks are sorted by due date. (Closest Due First)
        </span>
      </div>
      <div className="flex space-x-4">
        {columns.map((column) => (
          <Column
            key={column.status}
            title={column.title}
            description={column.description}
            tasks={taskData.filter((task) => task.status === column.status)}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            status={column.status}
            onTaskChange={() => getUserTasks()}
          />
        ))}
      </div>
    </div>
  );
}
