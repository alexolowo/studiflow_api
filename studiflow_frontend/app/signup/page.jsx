'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StepIndicator from '@/components/StepIndicator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const validateForm = () => {
    const newErrors = {};
    if (!username) newErrors.username = 'Username is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8)
      newErrors.password = 'Password must be at least 8 characters long';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateForm()) {
      setStep(2);
    }
  };

  const handlePreviousStep = () => {
    setStep(1);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (validateForm() && apiKey) {
      // The logic and shit to sign up.
      try {
        const response = await fetch('https://studiflow-a4bd949e558f.herokuapp.com/auth/signup/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, username, password, canvas_token: apiKey }),
        });

        // SAMPLE RESPONSE FROM SIGNING UP:
        // {
        //   "message": "User created successfully",
        //     "data": {
        //     "email": "ronald2@app.com",
        //       "username": "ron",
        //         "canvas_token": "tbd",
        //           "session_avg": 0.0,
        //             "courses": []
        //   },
        //   "token": {
        //     "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTcyMDEyMDY5MiwiaWF0IjoxNzIwMDM0MjkyLCJqdGkiOiI5N2IwOTgwNTE1NDk0YjU3ODI4NjhhNzRmMDhjNmYxYiIsInVzZXJfaWQiOjcxfQ.qZGcH9oIfGogDxvkPtbNTNfxp0RzsQ-ROpRqWJ4Demc",
        //       "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzIwMDQ1MDkyLCJpYXQiOjE3MjAwMzQyOTIsImp0aSI6IjhlN2EyNzcxOWI2NTQ3YWE4MmIwYzA4OTAxYzkwZmMwIiwidXNlcl9pZCI6NzF9.FLyhgS7pujoPsQ_SbzVUxMR1IoeHJgf5PEUJrci7vl8"
        //   }
        // }

        console.log('Signing up');

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('accessToken', data.token.access);
          localStorage.setItem('refreshToken', data.token.refresh);
          localStorage.setItem('username', data.user);
          router.push('/');
          console.log('signup data', data);
          // We must also hit the endpoint api/courses/load_courses/

          const secondResponse = await fetch(
            'https://studiflow-a4bd949e558f.herokuapp.com/courses/load_courses/',
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${data.token.access}`,
                'Content-Type': 'application/json',
              },
            }
          );
          console.log(secondResponse);
          if (secondResponse.ok) {
            toast({
              title: 'Courses imported',
              description: 'Courses have been imported successfully',
            });
          } else {
            toast({
              title: 'Error importing courses',
              description:
                'An error occurred while importing courses. Canvas token may be invalid.',
              variant: 'destructive',
            });
          }
        } else {
          const data = await response.json();
          // console.log(data.message);
          setErrorMessage(
            'Sign up failed. Please check your credentials. Email may already be in use.'
          );
        }
      } catch (error) {
        setErrorMessage('An error occurred. Please try again.');
        console.error('Login error:', error);
      }
    } else {
      setErrors((prev) => ({ ...prev, apiKey: 'API Key is required' }));
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setErrorMessage('');
    }, 5000);
  }, [errorMessage]);

  return (
    <div className="flex h-screen">
      {/* Green section */}
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
            <CardTitle className="text-2xl font-semibold text-center">
              Create Your Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 text-center">
              <Link href="/login" className="text-emerald-600 hover:underline">
                Already have an account? Log in
              </Link>
            </div>
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <StepIndicator currentStep={step} totalSteps={2} />
            <form onSubmit={handleSignUp} className="space-y-4">
              {step === 1 ? (
                <>
                  <div>
                    <Input
                      placeholder="Username *"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className={errors.username ? 'border-red-500' : ''}
                    />
                    {errors.username && (
                      <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Email *"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Input
                      type="password"
                      placeholder="Password *"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={errors.password ? 'border-red-500' : ''}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      type="password"
                      placeholder="Confirm Password *"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={errors.confirmPassword ? 'border-red-500' : ''}
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Next
                  </Button>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">How to get your API Key:</h3>
                    <ol className="list-decimal list-inside space-y-4 text-gray-800 text-sm">
                      <li className="pb-2 border-b border-gray-200">
                        Navigate to the{' '}
                        <a
                          href="https://utoronto.instructure.com/profile/settings"
                          className="text-blue-600 hover:text-blue-800 underline"
                          target="_blank">
                          UofT Canvas Settings page
                        </a>{' '}
                        and sign in with your UofT credentials.
                      </li>
                      <li className="pb-2 border-b border-gray-200">
                        Scroll down to the &quot;Approved Integrations&quot; section and click the{' '}
                        <span className="font-semibold text-green-600">+ New Access Token</span>{' '}
                        button.
                      </li>
                      <li className="pb-2 border-b border-gray-200">
                        In the form that appears:
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                          <li>Enter a purpose for the token</li>
                          <li>Select an appropriate expiration date</li>
                        </ul>
                      </li>
                      <li>After generating the token, copy and paste it below.</li>
                    </ol>
                  </div>
                  <div>
                    <Input
                      placeholder="API Key *"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      required
                      className={errors.apiKey ? 'border-red-500' : ''}
                    />
                    {errors.apiKey && <p className="text-red-500 text-xs mt-1">{errors.apiKey}</p>}
                  </div>
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      onClick={handlePreviousStep}
                      className="w-1/2 bg-gray-300 hover:bg-gray-400 text-gray-800">
                      Previous
                    </Button>
                    <Button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-700">
                      Create Account
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}
