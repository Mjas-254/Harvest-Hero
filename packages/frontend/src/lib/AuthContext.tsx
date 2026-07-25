"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  cooperativeId: string;
  walletAddress: string;
  avatarUrl: string;
  language: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, pin: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

interface RegisterData {
  name: string;
  phone: string;
  pin: string;
  role?: string;
  cooperativeId?: string;
  language?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("harvest_hero_token");
    const savedUser = localStorage.getItem("harvest_hero_user");
    if (saved && savedUser) {
      setToken(saved);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (phone: string, pin: string) => {
    const res = await api<{ success: boolean; data: { token: string; user: User } }>("/auth/login", {
      method: "POST",
      body: { phone, pin },
    });
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    localStorage.setItem("harvest_hero_token", t);
    localStorage.setItem("harvest_hero_user", JSON.stringify(u));
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await api<{ success: boolean; data: { token: string; user: User } }>("/auth/register", {
      method: "POST",
      body: data,
    });
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    localStorage.setItem("harvest_hero_token", t);
    localStorage.setItem("harvest_hero_user", JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("harvest_hero_token");
    localStorage.removeItem("harvest_hero_user");
  }, []);

  const updateUser = useCallback(
    async (data: Partial<User>) => {
      const res = await api<{ success: boolean; data: User }>("/auth/profile", {
        method: "PUT",
        body: data,
        token: token!,
      });
      setUser(res.data);
      localStorage.setItem("harvest_hero_user", JSON.stringify(res.data));
    },
    [token]
  );

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
