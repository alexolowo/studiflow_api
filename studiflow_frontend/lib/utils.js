import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function mapBackendFieldsToFrontendTask(backendTask) {
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
      courseId: backendTask.course_id,
      grade: backendTask.grade
  };
}

export function parseCourses(data) {
  return data.map((course) => {
    const totalTasks = Math.floor(Math.random() * 12) + 1;
    const completedTasks = Math.floor(Math.random() * totalTasks);

    return {
      courseId: course.id,
      courseCode: course.course_code,
      courseName: course.name,
      totalTasks: totalTasks,
      completedTasks: completedTasks,
    };
  });
}