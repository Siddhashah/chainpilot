import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../api/client';
import type { User } from '../types';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  company?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(input: LoginInput) {
    const res = await api.post('/auth/login', input);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('refresh', res.data.refresh);
    setUser(res.data.user);
  }

  async function register(input: RegisterInput) {
    const res = await api.post('/auth/register', input);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('refresh', res.data.refresh);
    setUser(res.data.user);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
