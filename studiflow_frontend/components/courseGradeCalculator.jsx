import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { useRouter } from 'next/navigation';
import { mapBackendFieldsToFrontendTask } from '@/lib/utils';
import { RadialBarChart, RadialBar, PolarAngleAxis, Text } from 'recharts';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';

export default function CourseGradeCalculator({ courseId }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [confirmedTasks, setConfirmedTasks] = useState([]);
  const [progress, setProgress] = useState({
    current: 0,
    completed: 0,
    assignedWeight: 0,
    completedWeight: 0,
  });
  const [tasksToDelete, setTasksToDelete] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchTasks(courseId);
  }, [courseId]);

  const fetchTasks = async (courseId) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/tasks/${courseId}/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error getting tasks! status: ${response.status}`);
      }

      const data = await response.json();
      const parsedResults = data.map((task) => mapBackendFieldsToFrontendTask(task));
      parsedResults && setTasks(parsedResults);
    } catch (e) {
      console.error('There was a problem fetching the tasks:', e);
    }
  };

  const handleTaskSelect = (task) => {
    if (selectedTasks.find((t) => t.id === task.id)) {
      setSelectedTasks(selectedTasks.filter((t) => t.id !== task.id));
    } else {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  const handleConfirm = () => {
    setConfirmedTasks(selectedTasks);
    setSelectedTasks([]);
  };

  const handleInputChange = (taskId, field, value) => {
    setConfirmedTasks(
      confirmedTasks.map((task) =>
        task.id === taskId ? { ...task, [field]: parseFloat(value) } : task
      )
    );
  };

  const calculateProgress = () => {
    let totalWeight = 0;
    let weightedGrade = 0;
    let completedWeight = 0;
    let assignedWeight = 0;

    confirmedTasks.forEach((task) => {
      if (task.weight) {
        assignedWeight += task.weight;
        if (task.grade && task.maxGrade) {
          totalWeight += task.weight;
          weightedGrade += (task.grade / task.maxGrade) * task.weight;
          completedWeight += task.weight;
        }
      }
    });

    setProgress({
      current: (weightedGrade / totalWeight) * 100,
      completed: (completedWeight / 100) * 100,
      assignedWeight: (assignedWeight / 100) * 100,
      completedWeight: weightedGrade,
    });
  };

  const handleTaskToDeleteSelect = (taskId) => {
    if (tasksToDelete.includes(taskId)) {
      setTasksToDelete(tasksToDelete.filter((id) => id !== taskId));
    } else {
      setTasksToDelete([...tasksToDelete, taskId]);
    }
  };

  const handleSelectAllTasksToDelete = () => {
    if (tasksToDelete.length === confirmedTasks.length) {
      setTasksToDelete([]);
    } else {
      setTasksToDelete(confirmedTasks.map((task) => task.id));
    }
  };

  const handleDeleteSelectedTasks = () => {
    setConfirmedTasks(confirmedTasks.filter((task) => !tasksToDelete.includes(task.id)));
    setTasksToDelete([]);
  };

  return (
    <>
      <div className="w-full p-4 mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Course Grade Calculator</h2>
        <p className="text-gray-600 mt-2">Select tasks, input grades, and analyze your progress.</p>
        <Button onClick={handleConfirm} className="mt-8">
          Confirm Selection's
        </Button>
      </div>
      <div className="flex mt-6">
        <div className="w-1/4 p-4 border-r">
          <ScrollArea className="h-[calc(100vh-100px)]">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center space-x-2 mb-2 bg-gray-100 p-2 rounded-md">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={selectedTasks.some((t) => t.id === task.id)}
                  onCheckedChange={() => handleTaskSelect(task)}
                />
                <Label htmlFor={`task-${task.id}`}>{task.title}</Label>
              </div>
            ))}
          </ScrollArea>
        </div>
        <div className="w-1/2 p-4">
          {confirmedTasks.map((task) => (
            <div key={task.id} className="mb-4 flex flex-col gap-1">
              <h3 className="text-lg font-semibold mt-4">{task.title}</h3>
              <Label htmlFor={`grade-${task.id}`}>Grade</Label>
              <Input
                id={`grade-${task.id}`}
                type="number"
                placeholder="Grade"
                value={task.grade || ''}
                onChange={(e) => handleInputChange(task.id, 'grade', e.target.value)}
              />
              <Label htmlFor={`maxGrade-${task.id}`}>Maximum Grade</Label>
              <Input
                id={`maxGrade-${task.id}`}
                type="number"
                placeholder="Maximum Grade"
                value={task.maxGrade || ''}
                onChange={(e) => handleInputChange(task.id, 'maxGrade', e.target.value)}
              />
              <Label htmlFor={`weight-${task.id}`}>Weight (%)</Label>
              <Input
                id={`weight-${task.id}`}
                type="number"
                placeholder="Weight (%)"
                value={task.weight || ''}
                onChange={(e) => handleInputChange(task.id, 'weight', e.target.value)}
              />
              <div className="flex items-center mt-2">
                <Checkbox
                  id={`delete-${task.id}`}
                  checked={tasksToDelete.includes(task.id)}
                  onCheckedChange={() => handleTaskToDeleteSelect(task.id)}
                />
                <Label htmlFor={`delete-${task.id}`} className="ml-2">
                  Select for deletion
                </Label>
              </div>
            </div>
          ))}
          <div className="mt-4 flex space-x-4">
            <Button onClick={calculateProgress}>Analyze</Button>
            <Button onClick={handleSelectAllTasksToDelete}>
              {tasksToDelete.length === confirmedTasks.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button onClick={handleDeleteSelectedTasks} disabled={tasksToDelete.length === 0}>
              Delete Selected
            </Button>
          </div>
        </div>
        <div className="w-1/4 p-4">
          <div className="relative w-full h-[300px]">
            <RadialBarChart
              width={300}
              height={300}
              cx="50%"
              cy="50%"
              innerRadius="30%"
              outerRadius="80%"
              barSize={20}
              data={[
                {
                  name: 'Course Weight',
                  value: 100,
                  fill: '#8884d8',
                },
                {
                  name: 'Assigned Weight',
                  value: progress.assignedWeight,
                  fill: '#82ca9d',
                },
                {
                  name: 'Completed Weight',
                  value: progress.completedWeight,
                  fill: '#ffc658',
                },
                {
                  name: 'Current Grade',
                  value: progress.current || 0,
                  fill: '#ff8042',
                },
              ]}
              startAngle={180}
              endAngle={-180}>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background
                dataKey="value"
                angleAxisId={0}
                data={[
                  { value: 100, fill: '#8884d8' },
                  { value: progress.assignedWeight, fill: '#82ca9d' },
                  { value: progress.completedWeight, fill: '#ffc658' },
                  { value: progress.current || 0, fill: '#ff8042' },
                ]}
              />
              <Text
                x={150}
                y={150}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xl font-bold">
                {`${Math.round(progress.current || 0)}%`}
              </Text>
            </RadialBarChart>
            <div className="absolute top-0 left-0 w-full h-full">
              <svg width="100%" height="100%">
                <line x1="100%" y1="40%" x2="85%" y2="40%" stroke="#8884d8" strokeWidth="2" />
                <text
                  x="100%"
                  y="35%"
                  dominantBaseline="middle"
                  textAnchor="end"
                  fill="#8884d8"
                  fontSize="14">
                  100%
                </text>
                <line x1="100%" y1="55%" x2="85%" y2="55%" stroke="#82ca9d" strokeWidth="2" />
                <text
                  x="100%"
                  y="50%"
                  dominantBaseline="middle"
                  textAnchor="end"
                  fill="#82ca9d"
                  fontSize="14">
                  {`${Math.round(progress.assignedWeight)}%`}
                </text>
                <line x1="100%" y1="70%" x2="85%" y2="70%" stroke="#ffc658" strokeWidth="2" />
                <text
                  x="100%"
                  y="65%"
                  dominantBaseline="middle"
                  textAnchor="end"
                  fill="#ffc658"
                  fontSize="14">
                  {`${Math.round(progress.completedWeight)}%`}
                </text>
                <line x1="100%" y1="85%" x2="85%" y2="85%" stroke="#ff8042" strokeWidth="2" />
                <text
                  x="100%"
                  y="80%"
                  dominantBaseline="middle"
                  textAnchor="end"
                  fill="#ff8042"
                  fontSize="14">
                  {`${Math.round(progress.current || 0)}%`}
                </text>
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <HoverCard>
              <HoverCardTrigger>
                <div className="flex items-center cursor-help">
                  <div className="w-4 h-4 bg-[#8884d8] mr-2"></div>
                  <span>Course Total Weight</span>
                </div>
              </HoverCardTrigger>
              <HoverCardContent>
                This represents the total weight of all tasks in the course, which is always 100%.
              </HoverCardContent>
            </HoverCard>
            <HoverCard>
              <HoverCardTrigger>
                <div className="flex items-center mt-2 cursor-help">
                  <div className="w-4 h-4 bg-[#82ca9d] mr-2"></div>
                  <span>Assigned Weight</span>
                </div>
              </HoverCardTrigger>
              <HoverCardContent>
                This shows the total weight of all tasks that have been assigned in the course so
                far.
              </HoverCardContent>
            </HoverCard>
            <HoverCard>
              <HoverCardTrigger>
                <div className="flex items-center mt-2 cursor-help">
                  <div className="w-4 h-4 bg-[#ffc658] mr-2"></div>
                  <span>Completed Weight</span>
                </div>
              </HoverCardTrigger>
              <HoverCardContent>
                This represents the weight of tasks you've completed, as a percentage of the
                assigned weight.
              </HoverCardContent>
            </HoverCard>
            <HoverCard>
              <HoverCardTrigger>
                <div className="flex items-center mt-2 cursor-help">
                  <div className="w-4 h-4 bg-[#ff8042] mr-2"></div>
                  <span>Current Grade (Adjusted for Weight)</span>
                </div>
              </HoverCardTrigger>
              <HoverCardContent>
                This is your current grade, adjusted for the weight of each task. It's calculated by
                summing (grade / max grade * weight) for each task, then dividing by the total
                weight of tasks with grades.
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
      </div>
    </>
  );
}
