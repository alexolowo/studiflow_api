'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CourseSideNav from '@/components/CourseSideNav';
import Chat from '@/components/chat';
import TaskList from '@/components/taskList';
import HeatMap from '@/components/heatMap';
import { mapBackendFieldsToFrontendTask, parseCourses } from '@/lib/utils';
import { CourseHeader } from '@/components/courseHeader';


export default function CourseView() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseID.split('-')[0];
    const courseCode = params.courseID.split('-')[1];
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState(null);
    const [taskChange, setTaskChange] = useState(false);    
    const [activeTab, setActiveTab] = useState('chat');

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

    const [courseData, setCourseData] = useState([]);

  useEffect(() => {
    async function getCourses() {
      try {
        const accessToken = localStorage.getItem('accessToken');

        const response = await fetch('http://localhost:8000/courses/', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
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
          setError('Failed getting active courses');
          throw new Error(`HTTP error getting courses! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        data && setCourseData(parseCourses(data.courses));
      } catch (e) {
        setError(e.message);
        console.error('There was a problem fetching the courses:');
        console.error(e);
      }
    }

    getCourses();
  }, []);



    const renderContent = () => {
        switch (activeTab) {
            case 'chat':
                return <Chat courseId={courseId}/>
            case 'tasks':
                return <TaskList tasks={tasks} onImport={setTasks} courseId={courseId} onChange={setTaskChange}/>;
            case 'resources':
                return <div>Resources Content</div>;
            case 'analytics':
                return <HeatMap />;
            default:
                return null;
        }
    };
    
    const chosenCourse = courseData.filter((course) => course.courseId == courseId);

    return (
        <div className="flex h-screen">
            <CourseSideNav activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="flex-1">
            <div className='flex items-center py-8 px-8 bg-gray-100 shadow-md text-2xl font-semibold text-gray-800'>
                    {/* TODO: make a dropdown to switch courses from here */}
                    {courseCode}
                    <CourseHeader courses={courseData} currentCourse={chosenCourse} />
                </div>
                {renderContent()}
            </main>
        </div>
    );
}