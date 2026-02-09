import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { User } from '../types/api';
import { auth as authApi } from '../api/endpoints';
import { setToken, clearToken } from '../api/client';

const STORAGE_USER = 'crm_user';

function loadUser(): User | null {
  try {
    const s = localStorage.getItem(STORAGE_USER);
    if (!s) return null;
    return JSON.parse(s) as User;
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
  token: string | null;
  isReady: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUserAndToken: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    user: loadUser(),
    token: localStorage.getItem('access_token'),
    isReady: true,
  }));

  const setUserAndToken = useCallback((user: User, token: string) => {
    setToken(token);
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    setState({ user, token, isReady: true });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setUserAndToken(res.user, res.access_token);
  }, [setUserAndToken]);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(STORAGE_USER);
    setState({ user: null, token: null, isReady: true });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      setUserAndToken,
    }),
    [state, login, logout, setUserAndToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- useAuth is the main export for consumers
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
