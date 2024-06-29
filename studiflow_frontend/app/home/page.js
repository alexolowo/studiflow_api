"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation";

import { FaBell } from 'react-icons/fa';
import ListView from "@/components/listView";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


export default function Home() {
    // const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const router = useRouter();


    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');

            console.log("token is", token);

            if (!token) {
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
            <div className="flex justify-between items-center p-4 bg-white shadow-md">
                <div className="text-xl font-semibold text-gray-800">
                    Hello, Ron!
                </div>
                <div className="flex items-center space-x-4">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <div className="absolute inset-0 bg-gray-200 rounded-full"></div>
                        <FaBell className="w-6 h-6 text-gray-600 relative z-10" />
                    </div>
                    <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
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
                        Kanban!
                    </TabsContent>
                </div>
            </Tabs>

        </>

    )
}