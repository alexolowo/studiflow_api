'use client';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { cn } from '@/lib/utils';
import { useToast } from './ui/use-toast';
import { FaRegCheckCircle } from 'react-icons/fa';
import React from 'react';
import { DateTimePicker } from './ui/datetime-picker';

// Define the schema for the form using Zod
const taskSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  weight: z.number().min(0).max(100).optional(),
  points: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export function TaskCreationForm({ task, onConfirm }) {
  // Initialize the form with default values
  const { toast } = useToast();
  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      dueDate: task?.dueDate || undefined,
      weight: task?.weight || undefined,
      points: task?.points || undefined,
      notes: task?.notes || '',
    },
  });

  // Submit handler
  function onSubmit(values: z.infer<typeof taskSchema>) {
    onConfirm(values);
    toast({
      title: 'Task Created',
      description: 'The task has been created and added successfully!',
      action: <FaRegCheckCircle className="w-6 h-6" />,
    });
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
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (%)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Task Weight" {...field} />
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
                  <Input type="number" placeholder="Max Points" {...field} />
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

          <Button type="submit">Save Task</Button>
        </form>
      </Form>
    </div>
  );
}
