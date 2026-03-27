"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

export type BrokerStatus = "pending" | "active" | "suspended";

export interface Broker {
    id: string;
    created_at: string;
    user_id?: string;
    name: string;
    email: string;
    phone: string;
    creci: string;
    city: string;
    neighborhoods: string[];
    specialties: string[];
    photo_url?: string;
    bio?: string;
    referral_fee: number;
    status: BrokerStatus;
}

export interface LeadAssignment {
    id: string;
    created_at: string;
    lead_id?: string;
    listing_id?: string;
    broker_id: string;
    status: "assigned" | "accepted" | "rejected" | "in_progress" | "sold" | "lost";
    commission_value: number;
    referral_value: number;
    notes?: string;
    responded_at?: string;
    closed_at?: string;
}

interface BrokersContextType {
    brokers: Broker[];
    assignments: LeadAssignment[];
    isLoading: boolean;
    addBroker: (broker: Omit<Broker, "id" | "created_at" | "status" | "referral_fee">) => Promise<Broker | null>;
    updateBroker: (id: string, updates: Partial<Broker>) => Promise<void>;
    removeBroker: (id: string) => Promise<void>;
    addAssignment: (assignment: Omit<LeadAssignment, "id" | "created_at">) => Promise<LeadAssignment | null>;
    updateAssignment: (id: string, updates: Partial<LeadAssignment>) => Promise<void>;
    removeAssignment: (id: string) => Promise<void>;
    refreshBrokers: () => Promise<void>;
    myBrokerProfile: Broker | null;
}

const BrokersContext = createContext<BrokersContextType | undefined>(undefined);

export function BrokersProvider({ children }: { children: React.ReactNode }) {
    const [brokers, setBrokers] = useState<Broker[]>([]);
    const [assignments, setAssignments] = useState<LeadAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [myBrokerProfile, setMyBrokerProfile] = useState<Broker | null>(null);
    const { user } = useAuth();

    const refreshBrokers = async () => {
        try {
            const { data: brokersData, error: brokersError } = await supabase
                .from("brokers")
                .select("*")
                .order("created_at", { ascending: false });

            if (brokersError) throw brokersError;
            setBrokers(brokersData || []);

            // Check if current user is a broker
            if (user) {
                const myProfile = (brokersData || []).find(
                    (b: Broker) => b.user_id === user.id || b.email === user.email
                );
                setMyBrokerProfile(myProfile || null);
            }

            const { data: assignmentsData, error: assignmentsError } = await supabase
                .from("lead_assignments")
                .select("*")
                .order("created_at", { ascending: false });

            if (assignmentsError) throw assignmentsError;
            setAssignments(assignmentsData || []);
        } catch (error: any) {
            if (!error.message?.includes("does not exist")) {
                console.warn("BrokersContext: Erro ao carregar dados.", error.message);
            }
            setBrokers([]);
            setAssignments([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshBrokers();
    }, [user]);

    const addBroker = async (brokerData: Omit<Broker, "id" | "created_at" | "status" | "referral_fee">) => {
        const newBroker = {
            ...brokerData,
            status: "pending" as BrokerStatus,
            referral_fee: 15,
            created_at: new Date().toISOString(),
        };

        try {
            const { data, error } = await supabase
                .from("brokers")
                .insert([newBroker])
                .select()
                .single();

            if (error) throw error;
            const broker = data as Broker;
            setBrokers((prev) => [broker, ...prev]);
            return broker;
        } catch (error: any) {
            console.error("Erro ao cadastrar corretor:", error.message);
            return null;
        }
    };

    const updateBroker = async (id: string, updates: Partial<Broker>) => {
        try {
            const { error } = await supabase
                .from("brokers")
                .update(updates)
                .eq("id", id);

            if (error) throw error;
            setBrokers((prev) =>
                prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
            );
            
            // Update myBrokerProfile if it's the current user
            if (myBrokerProfile?.id === id) {
                setMyBrokerProfile(prev => prev ? { ...prev, ...updates } : null);
            }
        } catch (error: any) {
            console.error("Erro ao atualizar corretor:", error.message);
        }
    };

    const removeBroker = async (id: string) => {
        try {
            const { error } = await supabase
                .from("brokers")
                .delete()
                .eq("id", id);

            if (error) throw error;
            setBrokers((prev) => prev.filter((b) => b.id !== id));
        } catch (error: any) {
            console.error("Erro ao remover corretor:", error.message);
        }
    };

    const addAssignment = async (assignmentData: Omit<LeadAssignment, "id" | "created_at">) => {
        const newAssignment = {
            ...assignmentData,
            created_at: new Date().toISOString(),
        };

        try {
            const { data, error } = await supabase
                .from("lead_assignments")
                .insert([newAssignment])
                .select()
                .single();

            if (error) throw error;
            const assignment = data as LeadAssignment;
            setAssignments((prev) => [assignment, ...prev]);
            return assignment;
        } catch (error: any) {
            console.error("Erro ao atribuir lead:", error.message);
            return null;
        }
    };

    const updateAssignment = async (id: string, updates: Partial<LeadAssignment>) => {
        try {
            const { error } = await supabase
                .from("lead_assignments")
                .update(updates)
                .eq("id", id);

            if (error) throw error;
            setAssignments((prev) =>
                prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
            );
        } catch (error: any) {
            console.error("Erro ao atualizar atribuição:", error.message);
        }
    };

    const removeAssignment = async (id: string) => {
        try {
            const { error } = await supabase
                .from("lead_assignments")
                .delete()
                .eq("id", id);

            if (error) throw error;
            setAssignments((prev) => prev.filter((a) => a.id !== id));
        } catch (error: any) {
            console.error("Erro ao remover atribuição:", error.message);
        }
    };

    return (
        <BrokersContext.Provider
            value={{
                brokers,
                assignments,
                isLoading,
                addBroker,
                updateBroker,
                removeBroker,
                addAssignment,
                updateAssignment,
                removeAssignment,
                refreshBrokers,
                myBrokerProfile,
            }}
        >
            {children}
        </BrokersContext.Provider>
    );
}

export const useBrokers = () => {
    const context = useContext(BrokersContext);
    if (!context) throw new Error("useBrokers must be used within a BrokersProvider");
    return context;
};
