"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_URL } from "@/config/api";
import axios from "axios";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  user: { email: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
      // Verify token by fetching user data
      fetchUserData(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserData = async (authToken: string) => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setUser(response.data);
      setIsLoading(false);
    } catch (error) {
      // Token is invalid, remove it
      localStorage.removeItem("auth_token");
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const login = (authToken: string) => {
    setToken(authToken);
    localStorage.setItem("auth_token", authToken);
    fetchUserData(authToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
  };

  const value: AuthContextType = {
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

