"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation";

import { FaBell } from 'react-icons/fa';
import ListView from "@/components/listView";
import KanbanView from "./kanbanView";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"



export default function Home({ logout }) {
    // const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const router = useRouter();


    useEffect(() => {
        const fetchData = async () => {
            const accessToken = localStorage.getItem('accessToken');

            console.log("token in local storage", accessToken);

            if (!accessToken) {
                setError('No token found');

                return;
            }

            // try {
            //     const response = await fetch('/api/endpoint', {
            //         method: 'GET',
            //         headers: {
            //             'Content-Type': 'application/json',
            //             'Authorization': `Bearer ${token}`,
            //         },
            //     });

            //     if (response.ok) {
            //         const result = await response.json();
            //         setData(result);
            //     } else {
            //         router.push('/');
            //         setError('Failed to fetch data');
            //     }
            // } catch (error) {
            //     router.push('/');
            //     setError('An error occurred. Please try again.');
            //     console.error('Fetch error:', error);
            // }
        };

        fetchData();
    }, []);

    return (
        <>
            <div className="flex justify-between items-center py-4 px-8 bg-white shadow-md">
                <div className="text-xl font-semibold text-gray-800">
                    Hello, Ron!
                </div>
                <div className="flex items-center space-x-4">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <div className="absolute inset-0 bg-gray-200 rounded-full"></div>
                        <FaBell className="w-6 h-6 text-gray-600 relative z-10" />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Avatar>
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <Tabs defaultValue="list" className="w-full flex flex-col items-center">
                <TabsList className="my-4">
                    <TabsTrigger value="list" className="text-xl">List View</TabsTrigger>
                    <TabsTrigger value="kanban" className="text-xl">Kanban View</TabsTrigger>
                </TabsList>
                <div className="w-full">
                    <TabsContent value="list" className="w-full">
                        <ListView />
                    </TabsContent>
                    <TabsContent value="kanban" className="w-full">
                        <KanbanView />
                    </TabsContent>
                </div>
            </Tabs>

        </>

    )
}