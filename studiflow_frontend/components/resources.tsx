'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { Toaster } from './ui/toaster';

interface Resource {
  id: number;
  resource_name: string;
  resource_type: string;
  resource_link: string;
}

const MAX_FILES = 5;

const Resources: React.FC = ({ courseId }: { courseId: number }) => {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResources, setSelectedResources] = useState<number[]>([]);
  const [dialogResourceLink, setDialogResourceLink] = useState<string | null>(null);
  const [dialogResource, setDialogResource] = useState<Resource | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchResources = async (shouldRefresh = false) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `https://studiflow-a4bd949e558f.herokuapp.com/resources/${courseId}/`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }

      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/login');
        return;
      }

      const data = await response.json();
      setResources(data);

      if (shouldRefresh) {
        setResources(data);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  useEffect(() => {
    fetchResources(true);
  }, [courseId, selectedResources]);

  const handleResourceClick = (resource: Resource) => {
    setDialogResource(resource);
    setDialogResourceLink(encodeURIComponent(resource.resource_link));
  };

  const handleResourceSelect = (id: number) => {
    setSelectedResources((prev) =>
      prev.includes(id) ? prev.filter((resourceId) => resourceId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (window.confirm('Are you sure you want to delete the selected resources?')) {
      try {
        const token = localStorage.getItem('accessToken');
        await fetch(`https://studiflow-a4bd949e558f.herokuapp.com/resources/delete/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids: selectedResources }),
        });
        fetchResources();
        setSelectedResources([]);
        setDeleteDialogOpen(false);
      } catch (error) {
        console.error('Error deleting resources:', error);
      }
    }
  };

  const handleFileUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('course_id', courseId.toString());

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        'https://studiflow-a4bd949e558f.herokuapp.com/resources/upload/',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.status === 400) {
        toast({
          title: 'Error',
          description: 'A file with this name already exists',
          variant: 'destructive',
        });
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to upload resource');
      }

      await fetchResources();
      setFiles([]);
    } catch (error) {
      console.error('Error uploading resource:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Course Resources</h2>
      {selectedResources.length > 0 && (
        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="mb-4">
          Delete Selected
        </Button>
      )}
      <div className="mb-4 space-y-2">
        <div className="flex items-center space-x-2">
          <div className="relative flex-grow">
            <Input
              type="file"
              onChange={(e) => {
                const newFiles = e.target.files ? Array.from(e.target.files) : [];
                setFiles((prevFiles) => {
                  const updatedFiles = [...prevFiles, ...newFiles].slice(0, MAX_FILES);
                  return updatedFiles;
                });
              }}
              className="flex-grow"
              multiple
              accept=".pdf,.docx,.txt,.md"
              disabled={files.length >= MAX_FILES}
            />
            {files.length > 0 && (
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
                {files.length}
              </span>
            )}
            {files.length >= MAX_FILES && (
              <span className="text-sm text-red-500">Maximum of {MAX_FILES} files reached</span>
            )}
          </div>
          <Button
            onClick={handleFileUpload}
            disabled={files.length === 0 || uploading || files.length > MAX_FILES}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
        <span className="text-sm text-gray-500">Accepted file types: pdf, docx, txt, md</span>
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                {file.name}
                <button
                  type="button"
                  onClick={() => {
                    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
                  }}
                  className="ml-2 text-blue-600 hover:text-blue-800">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {resources.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-600 mb-4">
            Upload resources to Studiflow and improve your Assistant&apos;s knowledge.
          </p>
          <p className="text-sm text-gray-500">
            Use the file upload above to add resources to this course.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-full rounded-md p-4">
          <ul className="space-y-4 mx-8">
            {resources.map((resource) => (
              <li
                key={resource.id}
                className={cn(
                  'flex items-center text-xl space-x-2 p-2 rounded-md transition-all duration-200 ease-in-out',
                  'hover:bg-gray-100 hover:scale-105 cursor-pointer'
                )}>
                <Checkbox
                  checked={selectedResources.includes(resource.id)}
                  onCheckedChange={() => handleResourceSelect(resource.id)}
                />
                <span onClick={() => handleResourceClick(resource)} className="hover:underline">
                  {resource.resource_name}
                </span>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}

      <Dialog open={!!dialogResourceLink} onOpenChange={() => setDialogResourceLink(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{dialogResource?.resource_name}</DialogTitle>
            <DialogDescription>Preview of the resource</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {dialogResourceLink && dialogResource.resource_type === 'application/pdf' ? (
              <iframe
                src={`https://docs.google.com/gview?url=${dialogResourceLink}&embedded=true`}
                style={{ width: '100%', height: '600px' }}
                frameBorder="0"
              />
            ) : (
              <p>Preview not available for this file type.</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => window.open(dialogResource?.resource_link, '_blank')}>
              Open in New Tab
            </Button>
            <Button
              onClick={() => {
                if (dialogResource) {
                  const downloadUrl = dialogResource.resource_link.replace(
                    '/upload/',
                    '/upload/fl_attachment/'
                  );
                  window.location.href = downloadUrl;
                }
              }}>
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the selected resources? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSelected}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </div>
  );
};

export default Resources;
