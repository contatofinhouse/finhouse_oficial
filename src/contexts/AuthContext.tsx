"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

interface User {
    username: string;
    email: string;
    id: string;
    isAdmin: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<{ error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        const setData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const email = session.user.email || "";
                setUser({
                    id: session.user.id,
                    email,
                    username: email.split('@')[0] || "Usuário",
                    isAdmin: ["contato@finhouse.com.br", "admin@finhouse.com.br", "contatofinhouse@gmail.com"].includes(email)
                });
            }
            setIsLoading(false);
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                const email = session.user.email || "";
                setUser({
                    id: session.user.id,
                    email,
                    username: email.split('@')[0] || "Usuário",
                    isAdmin: ["contato@finhouse.com.br", "admin@finhouse.com.br", "contatofinhouse@gmail.com"].includes(email)
                });
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        setData();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, pass: string) => {
        setIsLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });

        if (error) {
            setIsLoading(false);
            return { error: error.message };
        }

        if (data.user) {
            const email = data.user.email || "";
            setUser({
                id: data.user.id,
                email,
                username: email.split('@')[0] || "Usuário",
                isAdmin: ["contato@finhouse.com.br", "admin@finhouse.com.br", "contatofinhouse@gmail.com"].includes(email)
            });
        }
        setIsLoading(false);
        return {};
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}
