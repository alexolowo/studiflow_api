import { useState } from "react";
import Column from "./column";

export default function KanbanView() {
    const [tasks, setTasks] = useState([
        { id: 1, title: 'Task 1', description: 'Submission whatever', status: 'todo', course: 'CSC207' },
        { id: 2, title: 'Task 2', description: 'Some more description here', status: 'inProgress', course: 'CSC148' },
        { id: 3, title: 'Task 3', description: 'Oh my oh my', status: 'done', course: 'MAT135' },
    ]);

    const columns = [
        { title: 'To Do', status: 'todo', description: "Tasks that haven't been started" },
        { title: 'In Progress', status: 'inProgress', description: 'Tasks currently being worked on' },
        { title: 'Done', status: 'done', description: 'Completed tasks' },
    ];

    const onDragStart = (e, taskId) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const onDrop = (e, status) => {
        const taskId = e.dataTransfer.getData('taskId');
        setTasks(tasks.map(task =>
            task.id.toString() === taskId ? { ...task, status } : task
        ));
    };

    return (
        <div className="p-6 min-h-screen">
            <div className="flex space-x-4">
                {columns.map((column) => (
                    <Column
                        key={column.status}
                        title={column.title}
                        description={column.description}
                        tasks={tasks.filter((task) => task.status === column.status)}
                        onDragStart={onDragStart}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        status={column.status}
                    />
                ))}
            </div>
        </div>
    );
}