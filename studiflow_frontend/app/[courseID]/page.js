'use client'

import { useState } from 'react';
import { useParams } from 'next/navigation';
import CourseSideNav from '@/components/CourseSideNav';
import Chat from '@/components/chat';
import TaskList from '@/components/taskList';

export default function CourseView() {
    const params = useParams();
    const courseId = params.courseID;
    const dummyTask = {
        id: 1,
        title: "Dummy Task",
        dueDate: "2022-12-31",
        description: "This is a dummy task description.",
    };
    const [activeTab, setActiveTab] = useState('chat');

    const renderContent = () => {
        switch (activeTab) {
            case 'chat':
                return <Chat courseId={courseId}/>
            case 'tasks':
                return <TaskList tasks={[dummyTask]} />;
            case 'resources':
                return <div>Resources Content</div>;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen">
            <CourseSideNav activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="flex-1">
            {/* <div className='flex items-center py-4 px-8 bg-white shadow-md text-xl font-semibold text-gray-800'>
                    {courseId}
                </div> */}
                {renderContent()}
            </main>
        </div>
    );
}