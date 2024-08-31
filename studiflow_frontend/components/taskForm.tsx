'use client';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { useToast } from './ui/use-toast';
import { FaRegCheckCircle } from 'react-icons/fa';
import React from 'react';
import { DateTimePicker } from './ui/datetime-picker';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select';
import { useRouter } from 'next/navigation';

// Define the schema for the form using Zod
const taskSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
  description: z.string().optional(),
  dueDate: z.union([z.date(), z.string()]).optional(),
  weight: z.number().min(0).max(100).optional(),
  points: z.number().min(0).optional(),
  notes: z.string().optional(),
  status: z.enum(['TO-DO', 'IN PROGRESS', 'DONE']),
});

export function TaskCreationForm({ courseId, isTypeEdit, task, onConfirm, quickEdit }) {
  // Initialize the form with default values
  const { toast } = useToast();
  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      dueDate: task?.dueDate ? new Date(task?.dueDate) : undefined, // Convert string to Date object
      weight: task?.weight || undefined,
      points: task?.points || undefined,
      notes: task?.notes || '',
      status: task?.status || 'TO-DO',
    },
  });

  const [isChanged, setIsChanged] = React.useState(false);
  const router = useRouter();

  const handleCreateTask = async (values) => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(
        `https://studiflow-a4bd949e558f.herokuapp.com/tasks/${courseId || task.courseId}/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            task_name: values.title,
            task_description: values.description,
            due_date: values.dueDate,
            weight: values.weight || 0,
            points_possible: values.points || 0,
            notes: values.notes,
            status: values.status,
          }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        toast({
          title: 'Failed getting active tasks',
          description: `HTTP error getting tasks! status: ${response.status}`,
          status: 'error',
        });
        return;
      }

      if (response.ok) {
        onConfirm(values);

        toast({
          title: 'Task created',
          description: 'Task has been created successfully',
          status: 'success',
        });
        return;
      }
    } catch (e) {
      console.error('There was a problem creating the tasks:');
      console.error(e);

      toast({
        title: 'Failed getting active tasks',
        description: 'There was a problem creating the tasks',
        status: 'error',
      });
    }
  };

  const handleEditTask = async (values) => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(
        `https://studiflow-a4bd949e558f.herokuapp.com/tasks/${courseId || task.courseId}/${
          task.id
        }/`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            task_name: values.title,
            task_description: values.description,
            due_date: values.dueDate,
            weight: values.weight || 0,
            points_possible: values.points || 0,
            notes: values.notes,
            status: values.status,
          }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        toast({
          title: 'Failed getting active tasks',
          description: `HTTP error getting tasks! status: ${response.status}`,
          status: 'error',
        });
        return;
      }

      if (response.ok) {
        onConfirm(values);

        toast({
          title: 'Task updated',
          description: 'Task has been updated successfully',
          status: 'success',
        });
        return;
      }
    } catch (e) {
      console.error('There was a problem updating the tasks:');
      console.error(e);

      toast({
        title: 'Failed getting active tasks',
        description: 'There was a problem updating the tasks',
        status: 'error',
      });
    }
  };

  const buttonDisabled = false;

  const watchedValues = form.watch();

  React.useEffect(() => {
    const hasChanges =
      task &&
      Object.keys(watchedValues).some(
        (key) => watchedValues[key] !== task[key] || watchedValues[key] === ''
      );

    setIsChanged(hasChanges);
  }, [watchedValues, task]);

  // Submit handler
  function onSubmit(values: z.infer<typeof taskSchema>) {
    if (isTypeEdit) {
      toast({
        title: 'Task Updated!',
        description: 'The task has been updated successfully!',
        action: <FaRegCheckCircle className="w-6 h-6" />,
      });
      handleEditTask(values);

      return;
    } else {
      toast({
        title: 'Task Created!',
        description: 'The task has been created and added successfully!',
        action: <FaRegCheckCircle className="w-6 h-6" />,
      });
      handleCreateTask(values);
    }
    // Handle task creation logic here
  }

  return (
    <div className="max-w-screen-xl h-full pb-0 p-10 dark:bg-gray-800">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Task Title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <DateTimePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormDescription>When is this task due?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Task Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TO-DO">TO-DO</SelectItem>
                    <SelectItem value="IN PROGRESS">IN PROGRESS</SelectItem>
                    <SelectItem value="DONE">DONE</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Task Description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Task Weight"
                    {...field}
                    onChange={(event) => field.onChange(+event.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="points"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Max Points"
                    {...field}
                    onChange={(event) => field.onChange(+event.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional Notes" {...field} />
                </FormControl>
                <FormDescription>Add any notes or thoughts about this task.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={buttonDisabled}>
            Save Task
          </Button>
        </form>
      </Form>
    </div>
  );
}
