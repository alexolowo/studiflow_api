"use client"
import { useState, useEffect } from 'react';

function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const isValid = validateToken(token);
        setIsAuthenticated(isValid);
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Set up an interval to check auth status periodically
    const interval = setInterval(checkAuth, 10000);

    return () => clearInterval(interval);
  }, []);

  const validateToken = (token) => {
    // Implement token validation
    return true;

  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
  };

  return { isAuthenticated, logout };
}

export default useAuth;