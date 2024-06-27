import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const CourseCard = ({ course }) => {
    return (
        <Link href={`/${course.courseCode}`} passHref>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">{course.courseCode}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500 mb-4">{course.courseName}</p>
                    <Progress
                        value={(course.completedTasks / course.totalTasks) * 100}
                        className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        {course.completedTasks} of {course.totalTasks} tasks completed
                    </p>
                </CardContent>
            </Card>
        </Link>
    );
};

export default CourseCard;