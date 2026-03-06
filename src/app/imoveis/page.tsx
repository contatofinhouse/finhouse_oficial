"use client";

import React, { useState } from "react";
import { useListings, Listing } from "@/contexts/ListingsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import PropertyDetailModal from "@/components/PropertyDetailModal";
import { Search, Building2 } from "lucide-react";
import SimulationModal from "@/components/SimulationModal";

export default function ImoveisPage() {
    const { listings } = useListings();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"todos" | "venda" | "aluguel">("todos");
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [simOpen, setSimOpen] = useState(false);

    const filtered = listings.filter((l) => {
        const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase()) ||
            l.city.toLowerCase().includes(search.toLowerCase()) ||
            l.neighborhood.toLowerCase().includes(search.toLowerCase());
        const matchesType = filter === "todos" || l.type === filter;
        return matchesSearch && matchesType;
    });

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-[100px] pb-20">
                <div className="max-w-[1280px] mx-auto px-6">
                    {/* Page Header */}
                    <div className="mb-10 space-y-6">
                        <h1 className="text-[32px] md:text-[44px] font-extrabold text-[#222] tracking-tight">
                            Explore nossos <span className="text-[#222] underline decoration-amber-400 decoration-4 underline-offset-8">imóveis</span>
                        </h1>

                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search Bar */}
                            <div className="relative flex-1 group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717171] group-focus-within:text-[#222] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cidade, bairro ou tipo de imóvel..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-[#ddd] bg-[#f7f7f7] focus:bg-white focus:ring-4 focus:ring-black/5 focus:border-[#222] transition-all outline-none text-[15px]"
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                                {(["todos", "venda", "aluguel"] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-6 py-4 rounded-2xl text-[14px] font-bold whitespace-nowrap transition-all flex-1 lg:flex-none ${filter === f
                                            ? "bg-[#222] text-white shadow-lg shadow-black/10"
                                            : "bg-[#f7f7f7] text-[#717171] hover:bg-[#ebebeb] hover:text-[#222]"
                                            }`}
                                    >
                                        {f === "todos" ? "Todos" : f === "venda" ? "Venda" : "Aluguel"}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setSimOpen(true)}
                                    className="px-6 py-4 rounded-2xl bg-white border border-[#ddd] text-[#222] text-[14px] font-bold hover:bg-[#f7f7f7] transition-all whitespace-nowrap shadow-sm active:scale-95"
                                >
                                    Simular Financiamento
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Listings Grid */}
                    {filtered.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                            {filtered.map((listing) => (
                                <PropertyCard
                                    key={listing.id}
                                    listing={listing}
                                    onClick={() => setSelectedListing(listing)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-[#f7f7f7] rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Building2 className="w-10 h-10 text-[#717171]" strokeWidth={1} />
                            </div>
                            <h3 className="text-[20px] font-bold text-[#222]">Nenhum imóvel encontrado</h3>
                            <p className="text-[#717171] max-w-sm mx-auto">Tente ajustar sua busca ou filtros para encontrar o que procura.</p>
                            <button
                                onClick={() => { setSearch(""); setFilter("todos"); }}
                                className="text-[#222] font-bold underline underline-offset-4 pt-2"
                            >
                                Limpar todos os filtros
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            <SimulationModal open={simOpen} onOpenChange={setSimOpen} />
            {selectedListing && (
                <PropertyDetailModal
                    listing={selectedListing}
                    open={!!selectedListing}
                    onClose={() => setSelectedListing(null)}
                />
            )}
        </div>
    );
}
