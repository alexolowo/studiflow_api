'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CourseSideNav from '@/components/CourseSideNav';
import Chat from '@/components/chat';
import TaskList from '@/components/taskList';

export default function CourseView() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseID;
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState(null);
    // const dummyTask = {
    //     id: 1,
    //     title: "Dummy Task",
    //     dueDate: "2022-12-31",
    //     description: "This is a dummy task description.",
    //     link: "https://www.google.com",
    //     notes: "These are some notes for the dummy task.",
    //     status: "TO-DO",
    //     weight: 10,
    //     points: 100,
    // };
    const [activeTab, setActiveTab] = useState('chat');

    function mapBackendFieldsToDummyTask(backendTask) {
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

        async function getCourseTasks() {
            try {
                const accessToken = localStorage.getItem('accessToken');
                
                const response = await fetch('http://localhost:8000/tasks/load_tasks/', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
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
                const key = courseId.split('-')[0];
                console.log(data['data'][key]);
                const parsedResults = data['data'][key].map((task)=>mapBackendFieldsToDummyTask(task));
                parsedResults && setTasks(parsedResults);
            } catch (e) {
                setError(e.message);
                console.error("There was a problem fetching the tasks:");
                console.error(e);
            }
        }

        getCourseTasks();
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'chat':
                return <Chat courseId={courseId}/>
            case 'tasks':
                return <TaskList tasks={[ ...tasks]} />;
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
                    {courseId.split('-')[1]}
                </div>
                {renderContent()}
            </main>
        </div>
    );
}