"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

export type LeadStatus = "Novo" | "Contatado" | "Visita Efetuada" | "Em Negociação" | "Aguardando Financiamento" | "Vendido" | "Perdido";

export interface Lead {
    id: string;
    created_at: string;
    name: string;
    email: string;
    phone: string;
    status: LeadStatus;
    source: string;
    property_id?: string;
    notes?: string;
    financing_interest?: boolean;
    financing_status?: "Não Iniciado" | "Em Análise" | "Aprovado" | "Reprovado";
    user_id: string; // Correctly track which realtor owns the lead
}

interface LeadsContextType {
    leads: Lead[];
    isLoading: boolean;
    addLead: (lead: Omit<Lead, "id" | "created_at" | "user_id">) => Promise<Lead | null>;
    updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
    removeLead: (id: string) => Promise<void>;
    refreshLeads: () => Promise<void>;
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

export function LeadsProvider({ children }: { children: React.ReactNode }) {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    const refreshLeads = async () => {
        if (!user) {
            setLeads([]);
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from("leads")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                // Table might not exist yet, which is expected for now
                if (error.code === "PGRST116" || error.message?.includes("relation \"leads\" does not exist")) {
                    console.info("Leads Context: Tabela 'leads' não encontrada. Usando dados locais (Mocks).");
                } else {
                    console.warn("Leads Context: Erro na busca, usando mocks.", error.message);
                }
                throw error;
            }
            setLeads(data || []);
        } catch (error) {
            // No more mocks, start clean
            setLeads([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshLeads();
    }, [user]);

    const addLead = async (leadData: Omit<Lead, "id" | "created_at" | "user_id">) => {
        if (!user) return null;

        const newLead = {
            ...leadData,
            user_id: user.id,
            created_at: new Date().toISOString()
        };

        try {
            const { data, error } = await supabase
                .from("leads")
                .insert([newLead])
                .select()
                .single();

            if (error) throw error;
            
            const lead = data as Lead;
            setLeads(prev => [lead, ...prev]);
            return lead;
        } catch (error) {
            console.error("Error adding lead:", error);
            // Local fallback
            const localLead = { ...newLead, id: Math.random().toString(36).substring(7) } as Lead;
            setLeads(prev => [localLead, ...prev]);
            return localLead;
        }
    };

    const updateLead = async (id: string, updates: Partial<Lead>) => {
        try {
            const { error } = await supabase
                .from("leads")
                .update(updates)
                .eq("id", id);

            if (error) throw error;
            setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
        } catch (error: any) {
            // Silence "missing table" error for mock mode
            if (!error.message?.includes("relation \"leads\" does not exist")) {
                console.warn("Leads Context: Erro ao atualizar lead, usando local.", error.message);
            }
            setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
        }
    };

    const removeLead = async (id: string) => {
        try {
            const { error } = await supabase
                .from("leads")
                .delete()
                .eq("id", id);
            
            if (error) throw error;
            setLeads(prev => prev.filter(l => l.id !== id));
        } catch (error: any) {
            // Silence "missing table" error for mock mode
            if (!error.message?.includes("relation \"leads\" does not exist")) {
                console.warn("Leads Context: Erro ao remover lead, usando local.", error.message);
            }
            setLeads(prev => prev.filter(l => l.id !== id));
        }
    };

    return (
        <LeadsContext.Provider value={{ leads, isLoading, addLead, updateLead, removeLead, refreshLeads }}>
            {children}
        </LeadsContext.Provider>
    );
}

export const useLeads = () => {
    const context = useContext(LeadsContext);
    if (!context) throw new Error("useLeads must be used within a LeadsProvider");
    return context;
};
