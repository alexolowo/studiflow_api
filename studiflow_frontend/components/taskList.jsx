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
import { FaRegEdit, FaPlus } from 'react-icons/fa';
import { IoDownloadOutline } from 'react-icons/io5';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Loader2 } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { TaskCreationForm } from './taskForm';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from './ui/drawer';
import { Toaster } from './ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { FcCancel } from 'react-icons/fc';
import { GiPartyPopper } from 'react-icons/gi';
import { FaRegTrashAlt } from 'react-icons/fa';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

export default function TaskList({ tasks, onImport, courseId, onChange }) {
  const [taskStatus, setTaskStatus] = useState({});
  const [taskNotes, setTaskNotes] = useState({});
  const [originalTaskStatus, setOriginalTaskStatus] = useState({});
  const [originalTaskNotes, setOriginalTaskNotes] = useState({});
  const [saveEnabled, setSaveEnabled] = useState(false);
  const [importEnabled, setImportEnabled] = useState(false);
  const { toast } = useToast();
  const [error, setError] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [taskToBeEdited, setTaskToBeEdited] = useState(null);
  const [deleteTaskOpen, setDeleteTaskOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const handleCreateTask = (values) => {
    setIsCreateOpen(false);
    onChange(true);
  };

  const handleEditTask = (values) => {
    setIsEditOpen(false);
    onChange(true);
  };

  function mapBackendFieldsToFrontendTask(backendTask) {
    return {
      id: backendTask.id,
      title: backendTask.task_name,
      description: backendTask.task_description,
      dueDate: backendTask.due_date,
      status: backendTask.status,
      link: backendTask.submission_link || backendTask.html_url,
      weight: backendTask.weight,
      points: backendTask.points_possible,
      notes: backendTask.notes,
      grade: backendTask.grade,
    };
  }

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

  const handleImportButtonClick = () => {
    setImportEnabled(true);
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

  async function deleteTask() {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/tasks/${courseId}/${taskToDelete.id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/');
        return;
      }

      if (!response.ok) {
        setError('Failed to delete task');
        throw new Error(`HTTP error deleting task: status: ${response.status}`);
      }

      toast({
        title: 'Task Deleted',
        description: 'Task has been successfully deleted',
      });
      setDeleteTaskOpen(false);
    } catch (e) {
      setError(e.message);
      console.error('There was a problem deleting the task:');
      console.error(e);

      toast({
        title: 'Task Could Not Be Deleted',
        description: 'There was a problem deleting the task',
        variant: 'destructive',
      });
    }
  }

  async function getCourseTasks() {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`http://localhost:8000/tasks/load_tasks/${courseId}/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/');
        return;
      }

      if (response.status === 403) {
        toast({
          title: 'Tasks Could Not Be Imported',
          description: 'You do not have permission, Your Canvas token may have expired',
          action: <FcCancel className="w-12 h-12" />,
        });
        setError('Failed getting active tasks');
        throw new Error(`HTTP error getting tasks");! status: ${response.status}`);
      }

      if (!response.ok) {
        setError('Failed getting active tasks');
        throw new Error(`HTTP error getting tasks");! status: ${response.status}`);
      }

      const data = await response.json();

      const parsedResults = data['data'][courseId].map((task) =>
        mapBackendFieldsToFrontendTask(task)
      );
      parsedResults && onImport((prevState) => [...prevState, ...parsedResults]);
      toast({
        title: 'Tasks Imported',
        description:
          'Tasks have been successfully imported from Canvas!\nNote: Check that tasks are correct.',
        action: <GiPartyPopper className="w-12 h-12" />,
      });
    } catch (e) {
      setError(e.message);
      console.error('There was a problem fetching the tasks:');
      console.error(e);
    } finally {
      setImportEnabled(false);
    }
  }

  useEffect(() => {
    if (importEnabled)
      getCourseTasks().catch((error) => console.error('error importing tasks', error));
  }, [importEnabled]);

  return (
    <div className="max-w-screen-xl mx-auto p-10 dark:bg-gray-800">
      <div className="flex items-center pb-8 px-8 text-4xl font-semibold text-gray-800">
        <span>Tasks</span>
      </div>
      {tasks && (
        <Accordion type="multiple" collapsible="true" className="w-full">
          {tasks.map((task) => (
            <div className="flex justify-between">
              <AccordionItem key={task.id} value={task.id} className="flex-grow">
                <AccordionTrigger>
                  <span className="text-2xl flex gap-8">
                    {`${task.title}`}
                    <Badge id="task-status" className={getBadgeClass(taskStatus[task.id])}>
                      {taskStatus[task.id]}
                    </Badge>
                  </span>
                </AccordionTrigger>

                <AccordionContent>{`Due Date: ${
                  task.dueDate
                    ? new Date(task.dueDate).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : 'None'
                }`}</AccordionContent>

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
                    {typeof task.weight === 'number' && task.weight !== 0 && (
                      <Label>Task Weight: {task.weight}%</Label>
                    )}

                    <Separator orientation="vertical" className="bg-gray-900" />

                    {typeof task.points === 'number' && task.points !== 0 && (
                      <Label>Max. Points: {task.points}</Label>
                    )}
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
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditOpen(true);
                    setTaskToBeEdited(task);
                  }}>
                  <FaRegEdit size={28} />
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setDeleteTaskOpen(true);
                    setTaskToDelete(task);
                  }}>
                  <FaRegTrashAlt size={28} />
                </Button>
              </span>
            </div>
          ))}
        </Accordion>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Edit Task Details.</DialogDescription>
          </DialogHeader>
          <TaskCreationForm
            courseId={courseId}
            isTypeEdit
            task={taskToBeEdited}
            onConfirm={handleEditTask}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTaskOpen} onOpenChange={setDeleteTaskOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>Selected Task: {taskToDelete?.title}.</DialogDescription>
          </DialogHeader>
          <Label>Are you sure you want to delete this task?</Label>
          <div className="flex justify-between">
            <Button
              onClick={() => {
                setDeleteTaskOpen(false);
                setTaskToDelete(null);
              }}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await deleteTask();
                setDeleteTaskOpen(false);
                setTaskToDelete(null);
                onChange(true);
              }}
              variant="destructive">
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {importEnabled && <Loader2 className="mr-2 h-16 w-16 animate-spin" />}

      <HoverCard>
        <HoverCardTrigger asChild>
          <Button
            onClick={handleImportButtonClick}
            disabled={importEnabled}
            variant="ghost"
            className="fixed bottom-40 right-12 border bg-white h-20 w-20 rounded-full border-gray-600 shadow-lg hover:bg-gray-300 hover:scale-110">
            <IoDownloadOutline size={40} className="color-gray-600" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="mr-6 w-auto rounded-lg">
          <p className="text-sm text-gray-600">Import Tasks</p>
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
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Fill out the form below to create a new task and add it to the list.
                </DialogDescription>
              </DialogHeader>
              <TaskCreationForm courseId={courseId} onConfirm={handleCreateTask} />
            </DialogContent>
          </Dialog>
        </HoverCardTrigger>
        <HoverCardContent className="mr-6 w-auto rounded-lg">
          <p className="text-sm text-gray-600">Create New Task</p>
        </HoverCardContent>
      </HoverCard>

      <Toaster />
    </div>
  );
}
