import React from 'react';
import { cn } from '@/lib/utils';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { CalendarHeatmap } from './ui/calendar-heatmap';

const difficultyColors = {
  low: 'bg-green-200',
  medium: 'bg-yellow-300',
  high: 'bg-red-500',
};

const HeatMap = ({ taskData }) => {
  function calculateTaskWeightsByDate(tasks) {
    const dateWeightsMap = {};

    tasks.forEach((task) => {
      const dueDate = new Date(task.dueDate).toISOString().split('T')[0];

      if (dateWeightsMap[dueDate]) {
        dateWeightsMap[dueDate] += 1;
      } else {
        dateWeightsMap[dueDate] = 1;
      }
    });

    return Object.keys(dateWeightsMap).map((date) => ({
      date: new Date(date),
      weight: dateWeightsMap[date],
    }));
  }

  const weightedDates = calculateTaskWeightsByDate(taskData);

  console.log(weightedDates);

  return (
    <div className="max-w-screen-md h-full pb-0 p-10">
      <CalendarHeatmap
        variantClassnames={[
          'text-white hover:text-white bg-green-400 hover:bg-green-400',
          'text-white hover:text-white bg-green-500 hover:bg-green-500',
          'text-white hover:text-white bg-green-700 hover:bg-green-700',
        ]}
        weightedDates={weightedDates}
      />
    </div>
  );
};

export default HeatMap;
