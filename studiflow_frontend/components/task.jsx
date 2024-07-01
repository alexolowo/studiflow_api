import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import TaskDrawer from "./taskDrawer";
import { MoreVertical } from 'lucide-react';

const courseColors = {
    CSC207: "bg-blue-500",
    CSC148: "bg-green-500",
    MAT135: "bg-purple-500",
};


export default function Task({ task, onDragStart }) {
    const courseColorClass = courseColors[task.course] || "bg-gray-500 text-white";

    return (
        <Card
            className="bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-move"
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
        >
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${courseColorClass}`}>
                            {task.course}
                        </span>
                        <TaskDrawer taskId={task.id} taskTitle={task.title} />
                    </div>
                    <span className="text-xs font-medium text-gray-500">{task.dueDate}</span>
                </div>
                <CardDescription className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {task.description}
                </CardDescription>
            </CardHeader>
        </Card>
    );
}