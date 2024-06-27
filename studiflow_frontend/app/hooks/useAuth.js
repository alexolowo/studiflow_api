"use client"
import { useState, useEffect } from 'react';

function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Add your token validation logic here
      // For example, you can decode the token and check its expiration
      const isValid = validateToken(token);
      setIsAuthenticated(isValid);
    }
  }, []);

  const validateToken = (token) => {
    // Implement your token validation logic here
    // This is a placeholder implementation
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch (e) {
      return false;
    }
  };

  return { isAuthenticated };
}

export default useAuth;