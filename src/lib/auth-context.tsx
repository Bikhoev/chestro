"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

const AUTH_STORAGE_KEY = "chestro_auth_user";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  register: (email: string, password: string, name: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function saveUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(loadUser());
    setHydrated(true);
  }, []);

  const login = useCallback((email: string, password: string): boolean => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) return false;
    const u: AuthUser = {
      id: crypto.randomUUID(),
      email: trimmedEmail,
      name: trimmedEmail.split("@")[0],
    };
    setUser(u);
    saveUser(u);
    return true;
  }, []);

  const register = useCallback((email: string, password: string, name: string): boolean => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim() || trimmedEmail.split("@")[0];
    if (!trimmedEmail || !password) return false;
    const u: AuthUser = {
      id: crypto.randomUUID(),
      email: trimmedEmail,
      name: trimmedName,
    };
    setUser(u);
    saveUser(u);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveUser(null);
  }, []);

  const value: AuthContextValue = { user: hydrated ? user : null, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
