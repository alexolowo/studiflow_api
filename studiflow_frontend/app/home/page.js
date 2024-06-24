"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation";

export default function Home() {
    const [data, setData] = useState(null);
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

            try {
                const response = await fetch('/api/endpoint', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                } else {
                    router.push('/');
                    setError('Failed to fetch data');
                }
            } catch (error) {
                router.push('/');
                setError('An error occurred. Please try again.');
                console.error('Fetch error:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            Home
        </div>
    )
}