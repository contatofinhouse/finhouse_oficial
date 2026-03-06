"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ListingsProvider } from "@/contexts/ListingsContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <ListingsProvider>
                {children}
            </ListingsProvider>
        </AuthProvider>
    );
}
