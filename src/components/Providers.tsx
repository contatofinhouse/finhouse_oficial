"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ListingsProvider } from "@/contexts/ListingsContext";
import { LeadsProvider } from "@/contexts/LeadsContext";
import { BrokersProvider } from "@/contexts/BrokersContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <ListingsProvider>
                <LeadsProvider>
                    <BrokersProvider>
                        {children}
                    </BrokersProvider>
                </LeadsProvider>
            </ListingsProvider>
        </AuthProvider>
    );
}
