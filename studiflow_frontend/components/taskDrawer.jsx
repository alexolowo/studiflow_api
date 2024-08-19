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

export default function TaskDrawer({ taskId, taskTitle }) {
  // Use taskId to get more information for the current task.
  useEffect(() => {}, []);

  return (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <CardTitle className="text-lg font-medium hover:text-blue-600 hover:underline transition-all duration-300 cursor-pointer hover:scale-105">
          {taskTitle}
        </CardTitle>
      </DrawerTrigger>
      <DrawerContent className="w-1/3 h-full">
        <DrawerHeader>
          <DrawerTitle>{taskTitle}</DrawerTitle>
          <DrawerDescription>
            More inforamtion and resources for the selected Task
          </DrawerDescription>
        </DrawerHeader>
        <div>This is the body and stuff</div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
