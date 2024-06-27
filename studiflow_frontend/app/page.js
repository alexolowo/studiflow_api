"use client"
import useAuth from "@/hooks/useAuth";
import OnBoarding from "@/app/components/onboarding";
import Home from "./components/home";

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex items-center justify-center h-screen w-full">
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