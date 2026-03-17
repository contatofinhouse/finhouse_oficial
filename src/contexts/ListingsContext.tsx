"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

import { supabase } from "@/lib/supabase";

export interface Listing {
    id: string;
    title: string;
    type: "venda" | "aluguel";
    propertyType: string;
    price: number;
    condominium: number;
    iptu: number;
    area: number;
    bedrooms: number;
    bathrooms: number;
    parking: number;
    cep: string;
    address: string;
    neighborhood: string;
    city: string;
    description: string;
    acceptsExchange: boolean;
    images: string[];
    createdAt?: string;
    created_at?: string;
    author?: string;
    user_id?: string;
}

interface ListingsContextType {
    listings: Listing[];
    addListing: (listing: Omit<Listing, "id" | "createdAt" | "created_at">) => Promise<Listing | null>;
    updateListing: (id: string, listing: Partial<Listing>) => Promise<void>;
    removeListing: (id: string) => void;
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

// Dados mockups removidos. O sistema agora opera 100% com banco de dados.

export function ListingsProvider({ children }: { children: ReactNode }) {
    const [listings, setListings] = useState<Listing[]>([]);

    useEffect(() => {
        const fetchListings = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            let query = supabase
                .from('listings')
                .select('*')
                .order('created_at', { ascending: false });
            
            // Se estivermos em uma rota autenticada (painel), filtrar
            // Nota: Para a home, talvez você queira ver todos. 
            // Mas no CONTEXTO, vamos carregar os do usuário para o Dashboard.
            if (session?.user) {
                // query = query.eq('user_id', session.user.id);
            }

            const { data, error } = await query;
            
            if (error) {
                console.error("Erro ao buscar anúncios:", error.message);
                return;
            }
            
            if (data) {
                setListings(data as Listing[]);
            }
        };
        fetchListings();
    }, []);

    const addListing = async (listing: Omit<Listing, "id" | "createdAt" | "created_at">): Promise<Listing | null> => {
        const { data: { session } } = await supabase.auth.getSession();

        const payload = {
            ...listing,
            user_id: session?.user?.id,
            author: session?.user?.email?.split('@')[0] || 'Corretor',
            created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase.from('listings').insert([payload]).select();
        
        if (error) {
            console.error("ERRO CRÍTICO SUPABASE (Insert):", error.message, error.details, error.hint);
            alert("Erro ao salvar no banco: " + error.message);
            return null;
        }

        if (data && data.length > 0) {
            const newListing = data[0] as Listing;
            setListings((prev) => [newListing, ...prev]);
            return newListing;
        }

        return null;
    };

    const updateListing = async (id: string, listing: Partial<Listing>) => {
        const { data, error } = await supabase.from('listings').update(listing).eq('id', id).select();
        
        if (error) {
            console.error("ERRO CRÍTICO SUPABASE (Update):", error.message);
            alert("Erro ao atualizar no banco: " + error.message);
            throw error;
        }

        if (data) {
            setListings((prev) => prev.map((l) => (l.id === id ? (data[0] as Listing) : l)));
        }
    };

    const removeListing = async (id: string) => {
        const { error } = await supabase.from('listings').delete().eq('id', id);
        if (!error) {
            setListings((prev) => prev.filter((l) => l.id !== id));
        } else {
            console.error("Erro ao remover:", error.message);
            alert("Erro ao remover anúncio: Verifique se você é o autor.");
        }
    };

    return (
        <ListingsContext.Provider value={{ listings, addListing, updateListing, removeListing }}>
            {children}
        </ListingsContext.Provider>
    );
}

export function useListings() {
    const context = useContext(ListingsContext);
    if (!context) throw new Error("useListings must be used within ListingsProvider");
    return context;
}
