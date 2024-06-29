"use client";

import { useRouter } from 'next/navigation';

import { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:8000/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                console.log('Login successful', data);
                router.push('/home');
            } else {
                const data = await response.json();
                console.log(data.message);
                setError('Login failed. Please check your credentials.');
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
            console.error('Login error:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <div>
                <Label htmlFor="username">Email</Label>
                <Input
                    id="username"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                    required
                />
            </div>
            <div>
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full"
                    required
                />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" className="rounded-full max-w-fit mx-auto">
                Log In
            </Button>
        </form>
    );
}