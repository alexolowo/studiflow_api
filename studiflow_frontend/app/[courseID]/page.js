"use client"
import { useParams } from 'next/navigation';


export default function CourseView() {
    const params = useParams();
    const courseId = params.courseID;

    return (
        <>
            {courseId}
        </>
    )
}