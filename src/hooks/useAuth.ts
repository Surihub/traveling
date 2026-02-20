import { useState, useEffect } from 'react';

const AUTH_KEY = 'travel_planner_auth';
const AUTH_CODE = '8020';
const AUTH_DURATION = 60 * 60 * 1000; // 1시간 (밀리초)

interface AuthData {
  authenticated: boolean;
  expiresAt: number;
}

export function useAuth() {
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      const data: AuthData = JSON.parse(stored);
      if (data.authenticated && data.expiresAt > Date.now()) {
        setCanEdit(true);
      } else {
        localStorage.removeItem(AUTH_KEY);
        setCanEdit(false);
      }
    }
    setLoading(false);
  };

  const authenticate = (code: string): boolean => {
    if (code === AUTH_CODE) {
      const authData: AuthData = {
        authenticated: true,
        expiresAt: Date.now() + AUTH_DURATION,
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      setCanEdit(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setCanEdit(false);
  };

  const getRemainingTime = (): number => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      const data: AuthData = JSON.parse(stored);
      const remaining = data.expiresAt - Date.now();
      return remaining > 0 ? remaining : 0;
    }
    return 0;
  };

  return { canEdit, loading, authenticate, logout, getRemainingTime };
}
