"use client"

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import StepIndicator from '@/components/StepIndicator';

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleNextStep = () => {
    if (step === 1 && password === confirmPassword) {
      setStep(2);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    // Implement your sign-up logic here
    // If successful, redirect to dashboard or home page
    // router.push('/dashboard');
  };

  return (
    <div className="flex h-screen">
      {/* Green promotional section */}
      <div className="hidden lg:flex lg:w-1/2 bg-emerald-600 text-white p-12 flex-col justify-center items-center">
        <h1 className="text-4xl font-bold mb-6">Join Our Community</h1>
        <p className="text-xl text-center">
          Create an account to access exclusive features and start your journey with us.
        </p>
      </div>

      {/* White sign-up section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-white">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">Create Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 text-center">
              <Link href="/login" className="text-emerald-600 hover:underline">
                Already have an account? Log in
              </Link>
            </div>
            <StepIndicator currentStep={step} totalSteps={2} />
            <form onSubmit={handleSignUp} className="space-y-4">
              {step === 1 ? (
                <>
                  <Input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Button type="button" onClick={handleNextStep} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Next
                  </Button>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">How to get your API Key:</h3>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Log in to your account on our API provider's website</li>
                      <li>Navigate to the "API Keys" section in your dashboard</li>
                      <li>Click on "Generate New API Key"</li>
                      <li>Copy the generated key and paste it below</li>
                    </ol>
                  </div>
                  <Input
                    placeholder="API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Create Account
                  </Button>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}