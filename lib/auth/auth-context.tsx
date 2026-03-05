"use client";

import { createContext, useCallback, useContext, useMemo, useState, use } from "react";

// ============================================================
// Types
// ============================================================

interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: string;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  refreshAuth: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================
// Hook
// ============================================================

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

// ============================================================
// Provider
// ============================================================

async function fetchAuthUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

// Singleton promise — created once, shared across renders
let authPromise: Promise<AuthUser | null> | null = null;

function getAuthPromise() {
  if (!authPromise) {
    authPromise = fetchAuthUser();
  }
  return authPromise;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialUser = use(getAuthPromise());

  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [status, setStatus] = useState<AuthStatus>(
    initialUser ? "authenticated" : "unauthenticated"
  );

  const refreshAuth = useCallback(() => {
    authPromise = null;
    fetchAuthUser().then((data) => {
      setUser(data);
      setStatus(data ? "authenticated" : "unauthenticated");
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore errors
    }
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({ user, status, refreshAuth, logout }),
    [user, status, refreshAuth, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
