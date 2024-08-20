"use client";
import useAuth from "@/hooks/useAuth";
import Home from "../components/home";
import Banner from "@/components/banner";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from 'react-query';

export default function App() {
  const queryClient = new QueryClient();
  const { isAuthenticated, logout } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <div key={isAuthenticated ? 'authenticated' : 'unauthenticated'}>
        {isAuthenticated ? (
          <Home logout={logout} />
        ) : (
          <div className="text-6xl">
            <Banner />
          </div>
        )}
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}
