import React from 'react';
import { Toast, ToastClose, ToastDescription, ToastTitle } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

export function CustomToast({ title, description, onDismiss }) {
  return (
    <Toast>
      <div className="grid gap-1">
        <ToastTitle>{title}</ToastTitle>
        <ToastDescription>{description}</ToastDescription>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={onDismiss} variant="outline">
          Dismiss
        </Button>
      </div>
    </Toast>
  );
}
