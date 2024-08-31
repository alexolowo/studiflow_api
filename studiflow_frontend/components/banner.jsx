import { BannerNav } from './bannerNav';
import OnBoarding from '@/components/onboarding';

export default function Banner() {
  return (
    <>
      <BannerNav />
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-start">
          <div className="md:w-1/2 mb-6 md:mb-0">
            <div className="bg-gray-200 w-full aspect-video flex items-center justify-center text-gray-500">
              Video Placeholder
            </div>
          </div>
          <div className="md:w-1/2 md:pl-8">
            <h1 className="text-2xl font-bold mb-3">Welcome to StudiFlow</h1>
            <p className="text-sm mb-3">
              StudiFlow is an innovative task management and study optimization platform designed
              specifically for students. Our app helps you organize your coursework, manage
              deadlines, and improve your productivity.
            </p>
            <p className="text-sm mb-3">
              With StudiFlow, you can easily import tasks from your school's learning management
              system, create custom tasks, and track your progress across all your courses. Our
              intuitive interface allows you to prioritize tasks, set reminders, and visualize your
              workload using Kanban boards.
            </p>
            <p className="text-sm">
              StudiFlow also features a powerful AI assistant that can help you break down complex
              tasks, provide study tips, and answer questions related to your coursework. Stay on
              top of your academic goals and achieve better results with StudiFlow.
            </p>
          </div>
        </div>
      </div>
      <footer className="bg-gray-100 py-3 mt-6">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <p>&copy; 2023 StudiFlow. All rights reserved.</p>
          <a href="/feedback" className="text-blue-500 hover:underline">
            Provide Feedback
          </a>
        </div>
      </footer>
    </>
  );
}
