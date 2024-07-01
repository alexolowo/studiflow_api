import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import TaskDrawer from "./taskDrawer";

export default function Task({ task, onDragStart }) {
    return (
        <Card
            className="bg-gray-50 shadow-sm hover:shadow-md transition-shadow cursor-move"
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
        >
            <CardHeader className="p-3">
                <div className="flex justify-between items-start">
                    
                    <TaskDrawer taskId={task.id} taskTitle={task.title}/>

                </div>
                <CardDescription className="text-sm text-gray-600 mt-1">{task.description}</CardDescription>
            </CardHeader>
        </Card>
    );
}