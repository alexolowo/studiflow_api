import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";

const CourseCard = ({ course }) => {
    return (
        <Card>
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
    );
};

export default CourseCard;