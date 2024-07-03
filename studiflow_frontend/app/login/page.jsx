"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EyeIcon, EyeOffIcon } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }
            router.push('/');
        } catch (err) {
            setError('Invalid email or password. Please try again.');
        }
    };

    useEffect(() => {
        setTimeout(() => {
            setError('');
        }, 5000)
    }, [error])

    return (
        <div className="flex h-screen">
            {/* Green section */}
            <div className="hidden lg:flex lg:w-1/2 bg-emerald-600 text-white p-12 flex-col justify-center items-center">
                <h1 className="text-4xl font-bold mb-6">Welcome Back!</h1>
                <p className="text-xl text-center">
                    Log in to access your account and continue your journey with us.
                </p>
            </div>

            {/* White login section */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-white">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold text-center">Log In</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6 text-center">
                            <Link href="/signup" className="text-emerald-600 hover:underline">
                                No account? Sign up
                            </Link>
                        </div>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full"
                                />
                            </div>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <EyeOffIcon className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
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
