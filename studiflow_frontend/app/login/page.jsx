"use client"

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        // Implement your login logic here
        // If successful, redirect to dashboard or home page
        // router.push('/dashboard');
    };

    return (
        <div className="flex h-screen">
            {/* Green promotional section */}
            <div className="hidden lg:flex lg:w-1/2 bg-emerald-600 text-white p-12 flex-col justify-center items-center">
                <h1 className="text-4xl font-bold mb-6">Discover Your Potential</h1>
                <p className="text-xl text-center">
                    Join our community and unlock a world of opportunities.
                    Learn, grow, and connect with like-minded individuals.
                </p>
            </div>

            {/* White login section */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-white">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold text-center">Welcome Back</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6 text-center">
                            <Link href="/signup" className="text-emerald-600 hover:underline">
                                No account? Sign up
                            </Link>
                        </div>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                                Log In
                            </Button>
                        </form>
                        <div className="mt-4 text-center">
                            <Link href="/forgot-password" className="text-sm text-gray-600 hover:underline">
                                Forgot your password?
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}