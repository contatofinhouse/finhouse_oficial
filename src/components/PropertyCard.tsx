"use client";

import React from "react";
import { Listing } from "@/contexts/ListingsContext";
import {
    MapPin,
    BedDouble,
    Bath,
    Car,
    Ruler,
    Building2,
    Heart,
} from "lucide-react";

interface PropertyCardProps {
    listing: Listing;
    onClick: () => void;
}

export default function PropertyCard({ listing, onClick }: PropertyCardProps) {
    const fmt = (p: number, t: string) =>
        t === "aluguel"
            ? `R$ ${p.toLocaleString("pt-BR")}/mês`
            : `R$ ${p.toLocaleString("pt-BR")}`;

    const gradients = [
        "from-rose-100 to-orange-50",
        "from-sky-100 to-blue-50",
        "from-emerald-100 to-teal-50",
        "from-violet-100 to-indigo-50",
        "from-amber-100 to-yellow-50",
        "from-pink-100 to-fuchsia-50",
    ];
    const idx = parseInt(listing.id, 10) % gradients.length;

    const [isFavorite, setIsFavorite] = React.useState(false);

    React.useEffect(() => {
        setIsFavorite(!!localStorage.getItem(`fav-${listing.id}`));
        const handleUpdate = () => setIsFavorite(!!localStorage.getItem(`fav-${listing.id}`));
        window.addEventListener("favorites-updated", handleUpdate);
        return () => window.removeEventListener("favorites-updated", handleUpdate);
    }, [listing.id]);

    const toggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFavorite) {
            localStorage.removeItem(`fav-${listing.id}`);
        } else {
            localStorage.setItem(`fav-${listing.id}`, "true");
        }
        window.dispatchEvent(new Event("favorites-updated"));
    };

    return (
        <div onClick={onClick} className="group block text-left w-full cursor-pointer" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}>
            <div className="space-y-3">
                <div className={`relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br ${gradients[idx]}`}>
                    {listing.images && listing.images.length > 0 ? (
                        <img src={listing.images[0]} alt={listing.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Building2 className="w-14 h-14 text-gray-300/80" strokeWidth={1} />
                        </div>
                    )}
                    <button
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all opacity-0 group-hover:opacity-100 z-10 group/heart"
                        onClick={toggleFavorite}
                    >
                        <Heart className={`w-4 h-4 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-[#333] group-hover/heart:text-red-500"}`} />
                    </button>
                    <div className="absolute bottom-3 left-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase ${listing.type === "venda"
                            ? "bg-white/90 text-[#222] backdrop-blur-sm"
                            : "bg-[#222]/80 text-white backdrop-blur-sm"
                            }`}>
                            {listing.type}
                        </span>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                </div>

                <div className="space-y-1 px-0.5">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-[15px] text-[#222] leading-tight line-clamp-1 group-hover:underline decoration-[1.5px] underline-offset-2">
                            {listing.title}
                        </h3>
                    </div>
                    <p className="text-[14px] text-[#717171] flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {listing.neighborhood}, {listing.city}
                    </p>
                    <div className="flex items-center gap-3 text-[13px] text-[#717171]">
                        <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{listing.area}m²</span>
                        <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{listing.bedrooms}</span>
                        <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{listing.bathrooms}</span>
                        {listing.parking > 0 && (
                            <span className="flex items-center gap-1"><Car className="w-3 h-3" />{listing.parking}</span>
                        )}
                    </div>
                    <p className="text-[15px] font-semibold text-[#222] pt-1">
                        {fmt(listing.price, listing.type)}
                    </p>
                </div>
            </div>
        </div>
    );
}
