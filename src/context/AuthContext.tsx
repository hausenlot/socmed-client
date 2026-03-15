import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser } from '../services/authService';
import * as authService from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(authService.getCurrentUser());
  const [token, setToken] = useState<string | null>(authService.getToken());

  // Sync state if localStorage changes (e.g. another tab)
  useEffect(() => {
    setUser(authService.getCurrentUser());
    setToken(authService.getToken());
  }, []);

  const login = async (username: string, password: string) => {
    const res = await authService.login(username, password);
    setUser(res.user ?? null);
    setToken(res.token);
  };

  const register = async (username: string, password: string, displayName: string) => {
    const res = await authService.register(username, password, displayName);
    setUser(res.user ?? null);
    setToken(res.token);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
