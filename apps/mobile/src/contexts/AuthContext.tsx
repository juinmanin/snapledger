import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import apiService from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  loginWithApple: (token: string) => Promise<void>;
  loginWithKakao: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const userData = await apiService.getProfile();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiService.login(email, password);
    await AsyncStorage.setItem('authToken', response.token);
    setUser(response.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await apiService.register(name, email, password);
    await AsyncStorage.setItem('authToken', response.token);
    setUser(response.user);
  };

  const loginWithGoogle = async (token: string) => {
    const response = await apiService.loginWithGoogle(token);
    await AsyncStorage.setItem('authToken', response.token);
    setUser(response.user);
  };

  const loginWithApple = async (token: string) => {
    const response = await apiService.loginWithApple(token);
    await AsyncStorage.setItem('authToken', response.token);
    setUser(response.user);
  };

  const loginWithKakao = async (token: string) => {
    const response = await apiService.loginWithKakao(token);
    await AsyncStorage.setItem('authToken', response.token);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      await AsyncStorage.removeItem('authToken');
      setUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        loginWithApple,
        loginWithKakao,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
