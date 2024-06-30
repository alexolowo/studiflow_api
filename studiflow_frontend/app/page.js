"use client"
import useAuth from "@/hooks/useAuth";
import OnBoarding from "@/components/onboarding";
import Home from "../components/home";

export default function App() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div key={isAuthenticated ? 'authenticated' : 'unauthenticated'}>
      {isAuthenticated ? (
        <Home logout={logout}/>
      ) : (
        <div className="text-6xl">
          Studiflow
          <OnBoarding />
        </div>
      )}
    </div>
  );
}