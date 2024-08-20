'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from './ui/use-toast';
import { FaRegCheckCircle } from 'react-icons/fa';
import { useEffect, useState } from 'react';

const editProfileSchema = z.object({
  email: z.string().email(),
  user: z.string().min(1, 'Username is required').max(255),
  canvas_token: z.string().min(1, 'Canvas token is required').max(255),
});

export default function EditProfileForm({ initialData }) {
  const [isChanged, setIsChanged] = useState(false);

  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      email: initialData?.email || '',
      user: initialData?.user || '',
      canvas_token: initialData?.canvas_token || '',
    },
  });

  const goBack = () => {
    router.back();
  };

  const onSubmit = async (values) => {
    console.log('Form Submitted:', values);
    try {
      const response = await fetch('http://localhost:8000/auth/editUser/', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.user,
          canvas_token: values.canvas_token,
        }),
      });
      if (response.ok) {
        console.log('User updated successfully');
        goBack();
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been updated successfully',
          action: <FaRegCheckCircle className="h-6 w-6" />,
        });
      } else {
        console.error('Failed to update user');
        goBack();
        toast({
          title: 'Failed Profile Update',
          description: 'Failed to update your profile',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('An error occurred while updating user:', error);
      toast({
        title: 'Update Error',
        description: 'Error occurred trying to update your profile',
        variant: 'destructive',
      });
    }
  };

  const watchedValues = form.watch();

  useEffect(() => {
    const hasChanges = Object.keys(watchedValues).some(
      (key) => watchedValues[key] !== initialData[key] || watchedValues[key] === ''
    );

    setIsChanged(hasChanges);
  }, [watchedValues]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Field (Read-Only) */}
        <FormField
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input disabled {...field} readOnly />
              </FormControl>
              <FormDescription>Your email address cannot be changed.</FormDescription>
            </FormItem>
          )}
        />

        {/* Username Field */}
        <FormField
          name="user"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Canvas Token Field */}
        <FormField
          name="canvas_token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Canvas Token</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Note: The canvas token is necessary for all integration features i.e. Course and
                Task Importing
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-between">
          <div className="flex justify-end space-x-4">
            <Button type="submit" disabled={!isChanged}>
              Update Profile
            </Button>
            <Button variant="secondary" type="button" onClick={goBack}>
              Cancel
            </Button>
          </div>
          <Button variant="link" type="button">
            Forgot/Reset Password?
          </Button>
        </div>
      </form>
    </Form>
  );
}
