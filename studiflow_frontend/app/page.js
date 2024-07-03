"use client"
import useAuth from "@/hooks/useAuth";
import Home from "../components/home";
import Banner from "@/components/banner";

export default function App() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div key={isAuthenticated ? 'authenticated' : 'unauthenticated'}>
      {isAuthenticated ? (
        <Home logout={logout}/>
      ) : (
        <div className="text-6xl">
          {/* Studiflow */}
          <Banner />
        </div>
      )}
    </div>
  );
}