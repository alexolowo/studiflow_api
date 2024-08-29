import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const courseSchema = z.object({
  course_code: z.string().min(1, 'Course code is required'),
  name: z.string().min(1, 'Course name is required'),
  is_lecture: z.boolean(),
  enrollment_term_id: z.number().int().positive('Enrollment term ID must be a positive integer'),
  was_user_created: z.boolean(),
});

export function CourseCreationForm({ onConfirm }) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      course_code: '',
      name: '',
      is_lecture: true,
      enrollment_term_id: 1,
      was_user_created: true,
    },
  });

  const handleCreateCourse = async (values) => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch('http://localhost:8000/courses/create/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/');
        return;
      }

      if (!response.ok) {
        toast({
          title: 'Failed creating course',
          description: `HTTP error creating course! status: ${response.status}`,
          variant: 'destructive',
        });
        return;
      }

      if (response.ok) {
        onConfirm(values);

        toast({
          title: 'Course created',
          description: 'Course has been created successfully',
        });
        return;
      }
    } catch (e) {
      console.error('There was a problem creating the course:', e);

      toast({
        title: 'Failed creating course',
        description: 'There was a problem creating the course',
        variant: 'destructive',
      });
    }
  };

  function onSubmit(values: z.infer<typeof courseSchema>) {
    values.was_user_created = true;
    values.is_lecture = true;
    handleCreateCourse(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="course_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g., CSC108" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Introduction to Computer Programming" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="enrollment_term_id"
          render={({ field }) => {
            const calculateEnrollmentTermId = () => {
              const now = new Date();
              const year = now.getFullYear();
              const month = now.getMonth() + 1; // JavaScript months are 0-indexed

              if (month >= 9 && month <= 12) {
                return parseInt(`${year}09`);
              } else if (month >= 1 && month <= 4) {
                return parseInt(`${year}01`);
              } else {
                return parseInt(`${year}05`);
              }
            };

            return (
              <FormItem>
                <FormLabel>Enrollment Term ID</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    readOnly
                    disabled
                    value={calculateEnrollmentTermId()}
                  />
                </FormControl>
                <FormDescription>
                  Automatically calculated based on the current date.
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <Button type="submit">Create Course</Button>
      </form>
    </Form>
  );
}
