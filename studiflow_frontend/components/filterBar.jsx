import React, { useState } from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { DateTimePicker } from './ui/datetime-picker';

const TaskFilterBar = ({ onFilter, onClear }) => {
  const [status, setStatus] = useState(undefined);
  const [due_date_after, setDueDateAfter] = useState(undefined);
  const [due_date_before, setDueDateBefore] = useState(undefined);
  const [weight, setWeight] = useState(undefined);
  const [points_possible, setPoints] = useState(undefined);
  const [order_by, setOrder] = useState(undefined);
  const [statusKey, setStatusKey] = React.useState(+new Date() + 1);
  const [orderKey, setOrderKey] = React.useState(+new Date());

  const handleFilter = () => {
    onFilter({
      status,
      due_date_after: due_date_after ? due_date_after.toISOString() : undefined,
      due_date_before: due_date_before ? due_date_before.toISOString() : undefined,
      weight,
      points_possible,
      order_by,
    });
  };

  const handleClear = () => {
    setStatus(undefined);
    setDueDateAfter(undefined);
    setDueDateBefore(undefined);
    setWeight(undefined);
    setPoints(undefined);
    setOrder(undefined);
    onClear();
  };

  return (
    <div className="flex space-x-4">
      <Select onValueChange={setStatus} defaultValue={status} key={statusKey}>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TO-DO">TO-DO</SelectItem>
          <SelectItem value="IN PROGRESS">IN PROGRESS</SelectItem>
          <SelectItem value="DONE">DONE</SelectItem>
        </SelectContent>
      </Select>

      <DateTimePicker value={due_date_after} onChange={setDueDateAfter} placeholder="Due From" />
      <DateTimePicker value={due_date_before} onChange={setDueDateBefore} placeholder="Due To" />

      <Input
        type="number"
        placeholder="Weight"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
      />

      <Input
        type="number"
        placeholder="Points"
        value={points_possible}
        onChange={(e) => setPoints(e.target.value)}
      />

      <Select onValueChange={setOrder} value={order_by} key={orderKey}>
        <SelectTrigger>
          <SelectValue placeholder="Order By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="status">Status</SelectItem>
          <SelectItem value="due_date">Due Date</SelectItem>
          <SelectItem value="weight">Weight</SelectItem>
          <SelectItem value="points_possible">Points</SelectItem>
        </SelectContent>
      </Select>

      <Button
        onClick={(e) => {
          e.stopPropagation();
          handleClear();
          setStatusKey(+new Date() + 1);
          setOrderKey(+new Date());
        }}
        variant="outline"
        className="bg-gray-200">
        Clear
      </Button>
      <Button onClick={handleFilter}>Apply Filters</Button>
    </div>
  );
};

export default TaskFilterBar;
