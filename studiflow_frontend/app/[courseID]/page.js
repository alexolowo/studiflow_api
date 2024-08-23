'use client'

import { useState, useEffect, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CourseSideNav from '@/components/CourseSideNav';
import Chat from '@/components/chat';
import TaskList from '@/components/taskList';


export default function CourseView() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseID.split('-')[0];
    const courseCode = params.courseID.split('-')[1];
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState(null);
    const [taskChange, setTaskChange] = useState(false);
    
    const [activeTab, setActiveTab] = useState('chat');

    function mapBackendFieldsToFrontendTask(backendTask) {
        return {
            id: backendTask.id,
            title: backendTask.task_name,
            description: backendTask.task_description,
            dueDate: backendTask.due_date,
            status: backendTask.status,
            link: backendTask.submission_link || backendTask.html_url,
            weight: backendTask.weight,
            points: backendTask.points_possible,
            notes: backendTask.notes,
            grade: backendTask.grade
        };
    }

    useEffect(() => {
        async function getUsersCourseTasks() {
            try {
                const accessToken = localStorage.getItem('accessToken');
                
                const response = await fetch(`http://localhost:8000/tasks/${courseId}/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });
    
                if (response.status === 401) {
                    // Remove tokens and redirect to home page
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    router.push('/');
                    return;
                }
    
                if (!response.ok) {
                    setError("Failed getting active tasks");
                    throw new Error(`HTTP error getting tasks");! status: ${response.status}`);
                }
    
                const data = await response.json();
                
                const parsedResults = data.map((task)=>mapBackendFieldsToFrontendTask(task));
                parsedResults && setTasks(parsedResults);
            } catch (e) {
                setError(e.message);
                console.error("There was a problem fetching the tasks:");
                console.error(e);
            } finally {
                setTaskChange(false);
            }
        }

        getUsersCourseTasks();
        
    }, [taskChange]);

    useEffect(() => {
        console.log(tasks);
    }, [setTasks]);

    const renderContent = () => {
        switch (activeTab) {
            case 'chat':
                return <Chat courseId={courseId}/>
            case 'tasks':
                return <TaskList tasks={tasks} onImport={setTasks} courseId={courseId} onChange={setTaskChange}/>;
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
            <div className='flex items-center py-8 px-8 bg-gray-100 shadow-md text-2xl font-semibold text-gray-800'>
                    {/* TODO: make a dropdown to switch courses from here */}
                    {courseCode}
                </div>
                {renderContent()}
            </main>
        </div>
    );
}