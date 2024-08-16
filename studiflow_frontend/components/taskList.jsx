import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { 
    DropdownMenu,
    DropdownMenuContent, 
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem, 
} from "./ui/dropdown-menu";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";

export default function TaskList({ tasks }) {

    const [taskStatus, setTaskStatus] = useState('TO-DO');
    const [todoStatus, setTodoStatus] = useState(true);
    const [inProgressStatus, setInProgressStatus] = useState(false);
    const [doneStatus, setDoneStatus] = useState(false);
    
    const handleTodoStatusChange = () => {
        setTodoStatus(!todoStatus);
        handleTaskStatusChange('TO-DO');
        setDoneStatus(false);
        setInProgressStatus(false);
    }

    const handleInProgressStatusChange = () => {
        setInProgressStatus(!inProgressStatus);
        handleTaskStatusChange('IN PROGRESS');
        setDoneStatus(false);
        setTodoStatus(false);
    }

    const handleDoneStatusChange = () => {
        setDoneStatus(!doneStatus);
        handleTaskStatusChange('DONE');
        setTodoStatus(false);
        setInProgressStatus(false);
    }
    
    const handleTaskStatusChange = (status) => {
        setTaskStatus(status);
    }

    return (
        <>
            <Accordion type='single' collapsible className='w-full' style={{ justifyContent: 'center'}}>
                {tasks.map((task) => (
                    <AccordionItem value={task.id}>
                        <AccordionTrigger>
                            {`Title: ${task.title}`}
                        </AccordionTrigger>
                        <AccordionContent>
                            {`Due Date: ${task.dueDate}`}
                        </AccordionContent>
                        <AccordionContent>
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <Label htmlFor='task-status' >Status: </Label>
                                    <Badge id='task-status'>
                                        {taskStatus}
                                    </Badge>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuLabel>Set Task Status</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem
                                        checked={todoStatus}
                                        onCheckedChange={handleTodoStatusChange}>
                                            TO-DO
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={inProgressStatus}
                                        onCheckedChange={handleInProgressStatusChange}>
                                            IN PROGRESS
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={doneStatus}
                                        onCheckedChange={handleDoneStatusChange}>
                                            DONE
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </AccordionContent>
                        <AccordionContent>
                            {`Description: ${task.description}`}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </>
    );
}
