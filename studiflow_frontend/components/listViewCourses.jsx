import CourseCard from "./courseCard";

export default function ListViewCourses() {
    const data = [
        {
            courseCode: 'APS360',
            courseName: 'Applied Fundamentals of Deep Learning',
            totalTasks: 10,
            completedTasks: 8
        },
        {
            courseCode: 'CSC148',
            courseName: 'Introduction to Computer Science',
            totalTasks: 12,
            completedTasks: 12
        },
        {
            courseCode: 'MAT235',
            courseName: 'Multivariable Calculus',
            totalTasks: 8,
            completedTasks: 6
        },
        {
            courseCode: 'ECO101',
            courseName: 'Principles of Microeconomics',
            totalTasks: 15,
            completedTasks: 10
        },
        {
            courseCode: 'PHY131',
            courseName: 'Introduction to Physics I',
            totalTasks: 14,
            completedTasks: 11
        },
        {
            courseCode: 'ENG101',
            courseName: 'Effective Communication',
            totalTasks: 9,
            completedTasks: 7
        },
        {
            courseCode: 'CHM135',
            courseName: 'Chemistry: Physical Principles',
            totalTasks: 11,
            completedTasks: 9
        }
    ];

    return (
        <div className="grid grid-cols-2 gap-4 w-full h-fit">
            {data.map((course, index) => (
                <CourseCard key={index} course={course} />
            ))}
        </div>
    )
}