"use client";

import { useEffect, useState } from "react";
import CourseCard from "./courseCard";

// A helper function
function parseCourses(data) {
    return data.map(course => {
        const totalTasks = Math.floor(Math.random() * 12) + 1;
        const completedTasks = Math.floor(Math.random() * totalTasks);

        return {
            courseCode: course.course_code,
            courseName: course.name,
            totalTasks: totalTasks,
            completedTasks: completedTasks
        };
    });
}


export default function ListViewCourses() {
    const [error, setError] = useState('');
    // const [data, setData] = useState([
    //     {
    //         courseCode: 'APS360',
    //         courseName: 'Applied Fundamentals of Deep Learning',
    //         totalTasks: 10,
    //         completedTasks: 8
    //     },
    //     {
    //         courseCode: 'CSC148',
    //         courseName: 'Introduction to Computer Science',
    //         totalTasks: 12,
    //         completedTasks: 12
    //     },
    //     {
    //         courseCode: 'MAT235',
    //         courseName: 'Multivariable Calculus',
    //         totalTasks: 8,
    //         completedTasks: 6
    //     },
    //     {
    //         courseCode: 'ECO101',
    //         courseName: 'Principles of Microeconomics',
    //         totalTasks: 15,
    //         completedTasks: 10
    //     },
    //     {
    //         courseCode: 'PHY131',
    //         courseName: 'Introduction to Physics I',
    //         totalTasks: 14,
    //         completedTasks: 11
    //     },
    //     {
    //         courseCode: 'ENG101',
    //         courseName: 'Effective Communication',
    //         totalTasks: 9,
    //         completedTasks: 7
    //     },
    //     {
    //         courseCode: 'CHM135',
    //         courseName: 'Chemistry: Physical Principles',
    //         totalTasks: 11,
    //         completedTasks: 9
    //     }
    // ]);
    const [data, setData] = useState([]);
    
    useEffect(() => {
        async function getCourses() {
            try {
                const accessToken = localStorage.getItem('accessToken');

                console.log("accessToken", accessToken);

                const response = await fetch('http://localhost:8000/courses/', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    setError("Failed getting active courses");
                    throw new Error(`HTTP error getting courses! status: ${response.status}`);
                }

                const data = await response.json();
                data && setData(parseCourses(data.courses));
            } catch (e) {
                setError(e.message);
                console.error("There was a problem fetching the courses:");
                console.log(e);
            }

        };

        getCourses();
    }, [])

    return (
        <div className="grid grid-cols-2 gap-4 w-full h-fit">
            {data.map((course, index) => (
                <CourseCard key={index} course={course} />
            ))}
        </div>
    )
}