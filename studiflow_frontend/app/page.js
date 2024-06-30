"use client"
import useAuth from "@/hooks/useAuth";
import OnBoarding from "@/components/onboarding";
import Home from "../components/home";

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div key={isAuthenticated ? 'authenticated' : 'unauthenticated'}>
      {isAuthenticated ? (
        <Home />
      ) : (
        <div className="text-6xl">
          Studiflow
          <OnBoarding />
        </div>
      )}
    </div>
  );
}