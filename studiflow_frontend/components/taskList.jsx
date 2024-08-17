import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { FaRegEdit } from 'react-icons/fa';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Loader2 } from 'lucide-react';

export default function TaskList({ tasks }) {
  const [taskStatus, setTaskStatus] = useState({});
  const [taskNotes, setTaskNotes] = useState({});
  const [originalTaskStatus, setOriginalTaskStatus] = useState({});
  const [originalTaskNotes, setOriginalTaskNotes] = useState({});
  const [saveEnabled, setSaveEnabled] = useState(false);

  useEffect(() => {
    const initialStatuses = {};
    const initialNotes = {};
    tasks.forEach((task) => {
      initialStatuses[task.id] = task.status || 'TO-DO';
      initialNotes[task.id] = task.notes || '';
    });
    setTaskStatus(initialStatuses);
    setTaskNotes(initialNotes);
    setOriginalTaskStatus(initialStatuses);
    setOriginalTaskNotes(initialNotes);
  }, [tasks]);

  const handleTaskStatusChange = (taskId, status) => {
    setTaskStatus((prevState) => ({
      ...prevState,
      [taskId]: status,
    }));
    checkForChanges(taskId, status, taskNotes[taskId]);
  };

  const handleNotesChange = (taskId, notes) => {
    setTaskNotes((prevState) => ({
      ...prevState,
      [taskId]: notes,
    }));
    checkForChanges(taskId, taskStatus[taskId], notes);
  };

  const checkForChanges = (taskId, status, notes) => {
    if (status !== originalTaskStatus[taskId] || notes !== originalTaskNotes[taskId]) {
      setSaveEnabled(true);
    } else {
      setSaveEnabled(false);
    }
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'DONE':
        return 'bg-green-500 text-white';
      case 'IN PROGRESS':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-200 text-black';
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto pb-0 p-10 dark:bg-gray-800">
      {tasks && (
        <Accordion type="multiple" collapsible className="w-full">
          {tasks.map((task) => (
            <div className="flex justify-between">
              <AccordionItem key={task.id} value={task.id} className="flex-grow">
                <AccordionTrigger>
                  <span className="text-2xl">{`${task.title}`}</span>
                </AccordionTrigger>
                <AccordionContent>{`Due Date: ${new Date(task.dueDate)}`}</AccordionContent>
                <AccordionContent>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Label htmlFor="task-status">Status: </Label>
                      <Badge id="task-status" className={getBadgeClass(taskStatus[task.id])}>
                        {taskStatus[task.id]}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Set Task Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={taskStatus[task.id] === 'TO-DO'}
                        onCheckedChange={() => handleTaskStatusChange(task.id, 'TO-DO')}>
                        TO-DO
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={taskStatus[task.id] === 'IN PROGRESS'}
                        onCheckedChange={() => handleTaskStatusChange(task.id, 'IN PROGRESS')}>
                        IN PROGRESS
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={taskStatus[task.id] === 'DONE'}
                        onCheckedChange={() => handleTaskStatusChange(task.id, 'DONE')}>
                        DONE
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </AccordionContent>
                {task.description && (
                  <AccordionContent>{`Description: ${task.description}`}</AccordionContent>
                )}
                <AccordionContent>
                  <div className="flex h-5 items-center space-x-4 text-sm text-gray-600">
                    {task.weight && <Label>Task Weight: {task.weight}%</Label>}
                    {task.weight && task.points && (
                      <Separator orientation="vertical" className="bg-gray-900" />
                    )}
                    {task.points && <Label>Max. Points: {task.points}</Label>}
                  </div>
                </AccordionContent>
                <AccordionContent>
                  <Label htmlFor={`task-notes-${task.id}`}>Notes: </Label>
                  <div className="mx-4 my-2">
                    <Textarea
                      placeholder="Add notes here..."
                      defaultValue={task.notes}
                      id={`task-notes-${task.id}`}
                      onChange={(e) => handleNotesChange(task.id, e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground py-2">
                      Stuck? Start by writing your thoughts down!
                    </p>
                  </div>
                </AccordionContent>
                <AccordionContent className="flex justify-between">
                  <div className="flex gap-6">
                    <Button className="bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:from-purple-600 hover:via-pink-600 hover:to-indigo-600">
                      Ask StudiFlow AI about this task?
                    </Button>
                    <Button variant="link">
                      <span className="text-gray-600 text-lg">Task Link</span>
                    </Button>
                  </div>
                  <Button
                    disabled={!saveEnabled}
                    className={`bg-green-500 ${!saveEnabled && 'opacity-50 cursor-not-allowed'}`}>
                    Save Changes
                  </Button>
                </AccordionContent>
              </AccordionItem>
              <span className="mt-4" key={task.id + 12121}>
                <Button variant="ghost">
                  <FaRegEdit size={28} />
                </Button>
              </span>
            </div>
          ))}
        </Accordion>
      )}
      {tasks.length == 0 && <Loader2 className="mr-2 h-16 w-16 animate-spin" />}
    </div>
  );
}
