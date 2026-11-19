"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { AuthResponse } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { UserAccessState } from "@/lib/auth-server";

export type { UserAccessState };

interface User {
  username: string;
  email: string;
  id: string;
  isAdmin: boolean;
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  access: UserAccessState | null;
  isLoading: boolean;
  accessLoading: boolean;
  login: (email: string, pass: string) => Promise<AuthResponse>;
  loginWithGoogle: (returnTo?: string) => Promise<void>;
  refreshAccess: () => Promise<void>;
  logout: () => Promise<void>;
}

const ADMIN_EMAILS = [
  "contato@finhouse.com.br",
  "admin@finhouse.com.br",
  "contatofinhouse@gmail.com",
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSessionUser(sessionUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): User {
  const email = (sessionUser.email || "").toLowerCase();
  const fullName =
    (sessionUser.user_metadata?.full_name as string) ||
    (sessionUser.user_metadata?.name as string) ||
    email.split("@")[0] ||
    "Usuário";
  return {
    id: sessionUser.id,
    email,
    username: email.split("@")[0] || "Usuário",
    fullName,
    isAdmin: ADMIN_EMAILS.includes(email),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [access, setAccess] = useState<UserAccessState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);

  const fetchAccessWithToken = useCallback(async (token: string | null) => {
    if (!token) {
      setAccess(null);
      return;
    }
    setAccessLoading(true);
    try {
      const res = await fetch("/api/me/access", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.access) {
          setAccess(data.access);
        }
      }
    } catch (err) {
      console.warn("[AuthContext] Falha ao carregar /api/me/access:", err);
    } finally {
      setAccessLoading(false);
    }
  }, []);

  const refreshAccess = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token || accessToken;
    await fetchAccessWithToken(token);
  }, [accessToken, fetchAccessWithToken]);

  useEffect(() => {
    const setData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(mapSessionUser(session.user));
        setAccessToken(session.access_token);
        fetchAccessWithToken(session.access_token);
      }
      setIsLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSessionUser(session.user));
        setAccessToken(session.access_token);
        fetchAccessWithToken(session.access_token);
      } else {
        setUser(null);
        setAccessToken(null);
        setAccess(null);
      }
      setIsLoading(false);
    });

    setData();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAccessWithToken]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    const result = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (result.error) {
      setIsLoading(false);
      return result;
    }

    if (result.data.user) {
      setUser(mapSessionUser(result.data.user));
      const token = result.data.session?.access_token || null;
      setAccessToken(token);
      fetchAccessWithToken(token);
    }
    setIsLoading(false);
    return result;
  };

  const loginWithGoogle = async (returnTo?: string) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const targetPath =
      returnTo ||
      (typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/leilaocom-ia/premium");
    const redirectTo = `${origin}${
      targetPath.startsWith("/") ? targetPath : `/${targetPath}`
    }`;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
    setAccess(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        access,
        isLoading,
        accessLoading,
        login,
        loginWithGoogle,
        refreshAccess,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
