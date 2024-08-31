'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CourseSideNav from '@/components/courseSideNav';
import Chat from '@/components/chat';
import TaskList from '@/components/taskList';
import CourseGradeCalculator from '@/components/courseGradeCalculator';
import Resources from '@/components/resources';
import { mapBackendFieldsToFrontendTask, parseCourses } from '@/lib/utils';
import { CourseHeader } from '@/components/courseHeader';
import jsPDF from 'jspdf';

export default function CourseView() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseID.split('-')[0];
  const courseCode = params.courseID.split('-')[1];
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [taskChange, setTaskChange] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [userEmail, setUserEmail] = useState('');
  const [messages, setMessages] = useState([]);

  const courseIdentifier = params.courseID;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get the user data
        const response = await fetch('https://studiflow-a4bd949e558f.herokuapp.com/auth/login/', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        console.log('user data is', userData);
        setUserEmail(userData.email);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    async function getUsersCourseTasks() {
      try {
        const accessToken = localStorage.getItem('accessToken');

        const response = await fetch(
          `https://studiflow-a4bd949e558f.herokuapp.com/tasks/${courseId}/`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.status === 401) {
          // Remove tokens and redirect to home page
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          router.push('/login');
          return;
        }

        if (!response.ok) {
          setError('Failed getting active tasks');
          throw new Error(`HTTP error getting tasks");! status: ${response.status}`);
        }

        const data = await response.json();

        const parsedResults = data.map((task) => mapBackendFieldsToFrontendTask(task));
        parsedResults && setTasks(parsedResults);
      } catch (e) {
        setError(e.message);
        console.error('There was a problem fetching the tasks:');
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

        const response = await fetch('https://studiflow-a4bd949e558f.herokuapp.com/courses/', {
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
          router.push('/login');
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
        return <Chat courseId={courseId} messages={messages} setMessages={setMessages} />;
      case 'tasks':
        return (
          <TaskList
            tasks={tasks}
            onImport={setTasks}
            courseId={courseId}
            onChange={setTaskChange}
          />
        );
      case 'resources':
        return <Resources courseId={courseId} />;
      case 'analytics':
        return <CourseGradeCalculator courseId={courseId} />;
      default:
        return null;
    }
  };

  const printChat = async () => {
    if (!userEmail || !courseIdentifier) return;

    console.log('user email is', userEmail);
    console.log('course identifier is', courseIdentifier);

    try {
      const response = await fetch(
        'https://studiflow-a4bd949e558f.herokuapp.com/chat/chat_history',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({
            user_email: userEmail,
            course_id: courseIdentifier,
          }),
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      const chatHistory = await response.json();

      // Generate PDF
      const pdf = new jsPDF();
      let yOffset = 10;

      pdf.setFontSize(16);
      pdf.text('Chat History', 10, yOffset);
      yOffset += 10;

      pdf.setFontSize(12);
      chatHistory.forEach((message, index) => {
        const messageText = `${message.sender}: ${message.text}`;
        const lines = pdf.splitTextToSize(messageText, 180);

        if (yOffset + lines.length * 7 > 280) {
          pdf.addPage();
          yOffset = 10;
        }

        pdf.text(lines, 10, yOffset);
        yOffset += lines.length * 7 + 5;

        const timestamp = new Date(message.timestamp).toLocaleString();
        pdf.setFontSize(8);
        pdf.text(timestamp, 10, yOffset);
        pdf.setFontSize(12);
        yOffset += 10;
      });

      // Generate Blob and download
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'chat_history.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error printing chat:', error);
    }
  };

  const clearChat = async () => {
    if (!userEmail || !courseIdentifier) return;

    try {
      const response = await fetch(
        'https://studiflow-a4bd949e558f.herokuapp.com/chat/chat_history',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({
            user_email: userEmail,
            course_id: courseIdentifier,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to clear chat history');
      }

      const result = await response.json();
      console.log(result.message); // Log the success message

      // Clear the messages in the state
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat:', error);
      // Handle the error (e.g., show an error message to the user)
    }
  };

  const chosenCourse = courseData.filter((course) => course.courseId == courseId);

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="fixed h-full">
        <CourseSideNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <main className="flex-1 ml-56 p-8">
        <div className="sticky z-50 top-4 mb-8 flex items-center justify-between bg-white shadow-lg rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">{courseCode}</h1>
            <CourseHeader currentCourse={chosenCourse} />
          </div>
          {activeTab === 'chat' && (
            <div className="flex space-x-4">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300 ease-in-out flex items-center"
                onClick={printChat}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Print Chat
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 ease-in-out flex items-center"
                onClick={clearChat}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Clear Chat
              </button>
            </div>
          )}
        </div>
        <div className="bg-white shadow-md rounded-xl p-6">{renderContent()}</div>
      </main>
    </div>
  );
}
