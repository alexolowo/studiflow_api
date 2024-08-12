'use client'

import { useState } from 'react';
import { useParams } from 'next/navigation';
import CourseSideNav from '@/components/CourseSideNav';
import Chat from '@/components/chat';

export default function CourseView() {
    const params = useParams();
    const courseId = params.courseID;
    const [activeTab, setActiveTab] = useState('chat');

    const renderContent = () => {
        switch (activeTab) {
            case 'chat':
                return <Chat courseId={courseId}/>
            case 'tasks':
                return <div>Tasks Content</div>;
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