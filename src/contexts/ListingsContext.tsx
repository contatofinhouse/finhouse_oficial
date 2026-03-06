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
    author: string;
    user_id?: string;
}

interface ListingsContextType {
    listings: Listing[];
    addListing: (listing: Omit<Listing, "id" | "createdAt" | "created_at">) => Promise<void>;
    removeListing: (id: string) => void;
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

const DEFAULT_LISTINGS: Listing[] = [
    {
        id: "1",
        title: "Apartamento Moderno em Pinheiros",
        type: "venda",
        propertyType: "Apartamento",
        price: 850000,
        condominium: 800,
        iptu: 1500,
        area: 72,
        bedrooms: 2,
        bathrooms: 2,
        parking: 1,
        cep: "05400-000",
        address: "Rua dos Pinheiros, 500",
        neighborhood: "Pinheiros",
        city: "São Paulo",
        description: "Apartamento moderno com acabamento de primeira qualidade. Varanda gourmet, cozinha planejada e piso em porcelanato. Localização privilegiada próximo ao metrô.",
        acceptsExchange: false,
        images: ["/placeholder-apt1.jpg"],
        createdAt: "2026-02-20",
        author: "FinHouse",
    },
    {
        id: "2",
        title: "Cobertura Duplex na Vila Madalena",
        type: "venda",
        propertyType: "Casa",
        price: 2200000,
        condominium: 1500,
        iptu: 3000,
        area: 180,
        bedrooms: 4,
        bathrooms: 3,
        parking: 2,
        cep: "05433-000",
        address: "Rua Harmonia, 120",
        neighborhood: "Vila Madalena",
        city: "São Paulo",
        description: "Cobertura duplex com terraço, piscina privativa e vista panorâmica. Ambientes integrados, acabamento premium e localização nobre.",
        acceptsExchange: true,
        images: ["/placeholder-apt2.jpg"],
        createdAt: "2026-02-18",
        author: "FinHouse",
    },
    {
        id: "3",
        title: "Studio Compacto no Itaim Bibi",
        type: "aluguel",
        propertyType: "Apartamento",
        price: 3500,
        condominium: 500,
        iptu: 100,
        area: 35,
        bedrooms: 1,
        bathrooms: 1,
        parking: 0,
        cep: "04534-002",
        address: "Rua Joaquim Floriano, 700",
        neighborhood: "Itaim Bibi",
        city: "São Paulo",
        description: "Studio moderno, mobiliado e decorado. Perfeito para profissionais liberais. Prédio com lazer completo, academia e coworking.",
        acceptsExchange: false,
        images: ["/placeholder-apt3.jpg"],
        createdAt: "2026-02-15",
        author: "FinHouse",
    },
    {
        id: "4",
        title: "Casa de Condomínio em Alphaville",
        type: "venda",
        propertyType: "Casa",
        price: 3500000,
        condominium: 2000,
        iptu: 4500,
        area: 350,
        bedrooms: 5,
        bathrooms: 4,
        parking: 4,
        cep: "06450-000",
        address: "Alameda das Rosas, 50",
        neighborhood: "Alphaville",
        city: "Barueri",
        description: "Casa sofisticada em condomínio fechado. Piscina aquecida, espaço gourmet, suíte master com closet e banheira. Segurança 24h.",
        acceptsExchange: true,
        images: ["/placeholder-apt4.jpg"],
        createdAt: "2026-02-10",
        author: "FinHouse",
    },
    {
        id: "5",
        title: "Apartamento Garden na Mooca",
        type: "venda",
        propertyType: "Apartamento",
        price: 620000,
        condominium: 400,
        iptu: 800,
        area: 95,
        bedrooms: 3,
        bathrooms: 2,
        parking: 1,
        cep: "03102-000",
        address: "Rua da Mooca, 1200",
        neighborhood: "Mooca",
        city: "São Paulo",
        description: "Apartamento garden com quintal exclusivo de 40m². Ideal para famílias com pets. Lazer completo e próximo ao metrô Bresser.",
        acceptsExchange: false,
        images: ["/placeholder-apt5.jpg"],
        createdAt: "2026-02-08",
        author: "FinHouse",
    },
    {
        id: "6",
        title: "Loft Industrial na Barra Funda",
        type: "aluguel",
        propertyType: "Apartamento",
        price: 4200,
        condominium: 600,
        iptu: 150,
        area: 60,
        bedrooms: 1,
        bathrooms: 1,
        parking: 1,
        cep: "01156-000",
        address: "Rua Tagipuru, 300",
        neighborhood: "Barra Funda",
        city: "São Paulo",
        description: "Loft com pé-direito duplo, estilo industrial. Cozinha gourmet integrada, ar-condicionado e piso em concreto polido.",
        acceptsExchange: false,
        images: ["/placeholder-apt6.jpg"],
        createdAt: "2026-02-05",
        author: "FinHouse",
    },
];

export function ListingsProvider({ children }: { children: ReactNode }) {
    const [listings, setListings] = useState<Listing[]>(DEFAULT_LISTINGS);

    useEffect(() => {
        const fetchListings = async () => {
            await supabase.auth.getSession();

            const { data, error } = await supabase.from('listings').select('*').order('created_at', { ascending: false });
            if (data && !error && data.length > 0) {
                setListings(data as Listing[]);
            } else if (!error) {
                // If it's a new DB but we have local backup
                const stored = localStorage.getItem("finhouse_listings");
                if (stored) {
                    const parsed = JSON.parse(stored) as Listing[];
                    setListings([...DEFAULT_LISTINGS, ...parsed.filter(l => !DEFAULT_LISTINGS.some(d => d.id === l.id))]);
                }
            }
        };
        fetchListings();
    }, []);

    const addListing = async (listing: Omit<Listing, "id" | "createdAt" | "created_at">) => {
        const { data: { session } } = await supabase.auth.getSession();

        const payload = {
            ...listing,
            user_id: session?.user?.id, // Securely link to user
            created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase.from('listings').insert([payload]).select();
        let newListing: Listing;

        if (data && !error) {
            newListing = data[0] as Listing;
        } else {
            newListing = {
                ...listing,
                id: Date.now().toString(),
                createdAt: new Date().toISOString().split("T")[0],
            } as Listing;
        }

        setListings((prev) => [newListing, ...prev]);
    };

    const removeListing = async (id: string) => {
        const { error } = await supabase.from('listings').delete().eq('id', id);
        if (!error) {
            setListings((prev) => prev.filter((l) => l.id !== id));
        } else {
            alert("Erro ao remover anúncio. Verifique se você é o autor.");
        }
    };

    return (
        <ListingsContext.Provider value={{ listings, addListing, removeListing }}>
            {children}
        </ListingsContext.Provider>
    );
}

export function useListings() {
    const context = useContext(ListingsContext);
    if (!context) throw new Error("useListings must be used within ListingsProvider");
    return context;
}
