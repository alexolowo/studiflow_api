import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "./ui/button";
import Task from "./task"
import { PlusCircle, MoreVertical } from 'lucide-react';


export default function Column({ title, description, tasks, onDragStart, onDragOver, onDrop, status }) {
    return (
        <Card className="flex-1 " onDragOver={onDragOver} onDrop={(e) => onDrop(e, status)}>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
                        <CardDescription className="text-sm text-gray-500">{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {tasks.map((task) => (
                    <Task key={task.id} task={task} onDragStart={onDragStart} />
                ))}
            </CardContent>
        </Card>
    );
}