'use client';

import { FaComment, FaTasks, FaBook, FaChartBar } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import PageBanner from '@/components/pageBanner';

export default function CourseSideNav({ activeTab, setActiveTab }) {
  return (
    <nav className="flex flex-col space-y-2 p-4 bg-gray-100 h-full">
      <PageBanner />
      <Button
        variant={activeTab === 'chat' ? 'default' : 'ghost'}
        onClick={() => setActiveTab('chat')}>
        <FaComment className="mr-2" /> Chat
      </Button>
      <Button
        variant={activeTab === 'tasks' ? 'default' : 'ghost'}
        onClick={() => setActiveTab('tasks')}>
        <FaTasks className="mr-2" /> Tasks
      </Button>
      <Button
        variant={activeTab === 'resources' ? 'default' : 'ghost'}
        onClick={() => setActiveTab('resources')}>
        <FaBook className="mr-2" /> Resources
      </Button>
      <Button
        variant={activeTab === 'analytics' ? 'default' : 'ghost'}
        onClick={() => setActiveTab('analytics')}>
        <FaChartBar className="mr-2" /> Analytics
      </Button>
    </nav>
  );
}
