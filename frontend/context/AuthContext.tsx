// frontend/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

// 1. Define the types for your context
interface AuthContextType {
  isAuthenticated: boolean;
  isAuthLoaded: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

// 2. Initialize with null, but cast to the type
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('jwt_token');
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error("Failed to read SecureStore", error);
      } finally {
        setIsAuthLoaded(true);
      }
    };
    loadToken();
  }, []);

  const login = async (token: string) => {
    await SecureStore.setItemAsync('jwt_token', token);
    setIsAuthenticated(true); 
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('jwt_token');
    setIsAuthenticated(false); 
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthLoaded, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Add a safety check to the hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};