import React from 'react';
import { CalendarHeatmap } from './ui/calendar-heatmap';
import { mapBackendFieldsToFrontendTask } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const difficultyColors = {
  low: 'bg-green-200',
  medium: 'bg-yellow-300',
  high: 'bg-red-500',
};

const HeatMap = () => {
  const [taskData, setTaskData] = React.useState([]);
  const [error, setError] = React.useState('');
  const [date, setDate] = React.useState(undefined);
  const [dayCardVisible, setDayCardVisible] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    async function getUserTasks() {
      try {
        const accessToken = localStorage.getItem('accessToken');

        const response = await fetch(
          `https://studiflow-a4bd949e558f.herokuapp.com/tasks/general/`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
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

    getUserTasks();
  }, []);

  function calculateTaskWeightsByDate(tasks) {
    const dateWeightsMap = {};

    tasks.forEach((task) => {
      if (!task.dueDate) {
        return;
      }
      // Parse the date and set it to the start of the day in UTC
      const dueDate = new Date(task.dueDate);
      dueDate.setUTCDate(dueDate.getUTCDate() + 1);

      const utcDate = new Date(
        Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate())
      );
      const dateKey = utcDate.toISOString().split('T')[0];

      if (dateWeightsMap[dateKey]) {
        dateWeightsMap[dateKey] += 1;
      } else {
        dateWeightsMap[dateKey] = 1;
      }
    });

    return Object.keys(dateWeightsMap).map((date) => ({
      date: new Date(date),
      weight: dateWeightsMap[date],
    }));
  }

  const getTasksOnDate = (date) => {
    console.log('date', date);
    const clickedDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );
    const clickedDateString = clickedDate.toISOString().split('T')[0];

    return taskData.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      const taskDateString = new Date(
        Date.UTC(taskDate.getUTCFullYear(), taskDate.getUTCMonth(), taskDate.getUTCDate())
      )
        .toISOString()
        .split('T')[0];

      return taskDateString === clickedDateString;
    });
  };

  const weightedDates = calculateTaskWeightsByDate(taskData);
  weightedDates.push({ date: new Date(2022, 1, 1), weight: 0 });

  return (
    <div className="flex flex-col">
      <span className="text-xl font-bold p-2 pl-8">Task Heatmap</span>
      <div className="max-w-screen-md h-full shadow-lg rounded-lg">
        <CalendarHeatmap
          variantClassnames={[
            'text-white hover:text-white bg-green-400 hover:bg-green-400',
            'text-white hover:text-white bg-green-500 hover:bg-green-500',
            'text-white hover:text-white bg-green-700 hover:bg-green-700',
          ]}
          weightedDates={weightedDates}
          showWeekNumber
          onDayClick={(date) => {
            setDayCardVisible(true);
            setDate(date);
          }}
        />
        <Dialog open={dayCardVisible} onOpenChange={setDayCardVisible}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tasks due on {date && date.toDateString()}</DialogTitle>
              <DialogDescription>These are the tasks that are due on this date</DialogDescription>
            </DialogHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Due Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {date &&
                  getTasksOnDate(date).map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Label>{task.title}</Label>
                      </TableCell>
                      {/* <TableCell>
                <Separator orientation="vertical" className="bg-gray-900" />
              </TableCell> */}
                      <TableCell>
                        <Label>{new Date(task.dueDate).toLocaleTimeString()}</Label>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex justify-between my-4">
        <div>Legend: </div>
        <div className=" flex gap-2 items-center">
          <Button className="color-box bg-green-400"></Button>
          <span className="">1</span>
        </div>
        <div className=" flex gap-2 items-center">
          <Button className="color-box bg-green-500"></Button>
          <span className="">2-3</span>
        </div>
        <div className=" flex gap-2 items-center">
          <Button className="color-box bg-green-700"></Button>
          <span className="">4+</span>
        </div>
      </div>
    </div>
  );
};

export default HeatMap;
