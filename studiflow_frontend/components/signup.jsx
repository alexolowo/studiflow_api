"use client"

import { useRouter } from 'next/navigation';

import { useState } from "react"
import { Button } from "./ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function Signup() {
    const router = useRouter();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [retypePassword, setRetypePassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== retypePassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                setSuccess('Signup successful');
                localStorage.setItem('token', data.token);
                console.log('Signup successful', data);
                router.push('/home');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Signup failed');
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
            console.error('Signup error:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <div>
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full"
                    required
                />
            </div>
            <div>
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
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
            <div>
                <Label htmlFor="retypePassword">Retype Password</Label>
                <Input
                    id="retypePassword"
                    type="password"
                    value={retypePassword}
                    onChange={(e) => setRetypePassword(e.target.value)}
                    className="w-full"
                    required
                />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}

            <Button type="submit" className="rounded-full max-w-fit mx-auto">
                Sign Up
            </Button>
        </form>
    );
}