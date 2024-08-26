'use client';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from './ui/button';
import { useEffect } from 'react';
import { TaskCreationForm } from './taskForm';

export default function TaskDrawer({ task, onChange }) {
  // Use taskId to get more information for the current task.
  useEffect(() => {}, []);

  return (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <CardTitle className="text-lg font-medium hover:text-blue-600 hover:underline transition-all duration-300 cursor-pointer hover:scale-105">
          {task.title}
        </CardTitle>
      </DrawerTrigger>
      <DrawerContent className="w-1/3 h-full">
        <DrawerHeader>
          <DrawerTitle>{task.title}</DrawerTitle>
          <DrawerDescription>More information for the selected Task</DrawerDescription>
        </DrawerHeader>
        <TaskCreationForm isTypeEdit task={task} onConfirm={onChange} />
      </DrawerContent>
    </Drawer>
  );
}
