"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Listing } from "@/contexts/ListingsContext";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    MapPin,
    BedDouble,
    Bath,
    Car,
    Ruler,
    Phone,
    Heart,
    Share2,
    Building2,
    X,
    ChevronLeft,
    ChevronRight,
    Maximize2,
} from "lucide-react";

const WA = "https://wa.me/5511955842951";

interface PropertyDetailModalProps {
    listing: Listing | null;
    open: boolean;
    onClose: () => void;
}

export default function PropertyDetailModal({
    listing,
    open,
    onClose,
}: PropertyDetailModalProps) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeImg, setActiveImg] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []); // eslint-disable-line react-hooks/set-state-in-effect

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!showLightbox || !listing) return;

        if (e.key === "Escape") setShowLightbox(false);
        if (e.key === "ArrowLeft") {
            setActiveImg(prev => (prev > 0 ? prev - 1 : listing.images!.length - 1));
        }
        if (e.key === "ArrowRight") {
            setActiveImg(prev => (prev < listing.images!.length - 1 ? prev + 1 : 0));
        }
    }, [showLightbox, listing]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        setIsFavorite(!!localStorage.getItem(`fav-${listing?.id}`));
        const handleUpdate = () => setIsFavorite(!!localStorage.getItem(`fav-${listing?.id}`));
        window.addEventListener("favorites-updated", handleUpdate);
        return () => window.removeEventListener("favorites-updated", handleUpdate);
    }, [listing?.id]); // eslint-disable-line react-hooks/set-state-in-effect

    if (!listing) return null;

    const fmt = (p: number, t: string) =>
        t === "aluguel"
            ? `R$ ${p.toLocaleString("pt-BR")}/mês`
            : `R$ ${p.toLocaleString("pt-BR")}`;

    const whatsappMsg = `Olá! Tenho interesse no imóvel: ${listing.title} - ${fmt(listing.price || 0, listing.type || "")}. Gostaria de mais informações.`;

    const toggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFavorite) {
            localStorage.removeItem(`fav-${listing.id}`);
        } else {
            localStorage.setItem(`fav-${listing.id}`, "true");
        }
        window.dispatchEvent(new Event("favorites-updated"));
    };

    const nextImg = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!listing.images) return;
        setActiveImg(prev => (prev < listing.images.length - 1 ? prev + 1 : 0));
    };

    const prevImg = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!listing.images) return;
        setActiveImg(prev => (prev > 0 ? prev - 1 : listing.images.length - 1));
    };

    const closeLightbox = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setShowLightbox(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent key={listing.id} className="sm:max-w-2xl h-[95vh] sm:h-[90vh] max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-[32px] sm:rounded-[32px] border-[#ebebeb] p-0 overflow-hidden bg-white gap-0">
                    <DialogTitle className="sr-only">{listing.title}</DialogTitle>

                    {/* Scrollable Area */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden">
                        {/* Image Gallery Area */}
                        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-[#f7f7f7] group/gallery">
                            {listing.images && listing.images.length > 0 ? (
                                <>
                                    <img
                                        src={listing.images[activeImg]}
                                        alt={listing.title}
                                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 cursor-zoom-in"
                                        onClick={() => setShowLightbox(true)}
                                    />

                                    {/* Navigation arrows (desktop) */}
                                    {listing.images.length > 1 && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    prevImg(e);
                                                }}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-[#222] opacity-0 group-hover/gallery:opacity-100 transition-all shadow-lg active:scale-90 hidden sm:flex z-20"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    nextImg(e);
                                                }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-[#222] opacity-0 group-hover/gallery:opacity-100 transition-all shadow-lg active:scale-90 hidden sm:flex z-20"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}

                                    {/* Lightbox Trigger */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowLightbox(true); }}
                                        className="absolute bottom-4 right-4 p-2.5 rounded-xl bg-black/60 backdrop-blur-md text-white border border-white/20 hover:bg-black/80 transition-all flex items-center gap-2 text-[12px] font-bold z-20"
                                    >
                                        <Maximize2 className="w-3.5 h-3.5" /> Ampliar
                                    </button>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Building2 className="w-20 h-20 text-gray-300/60" strokeWidth={0.8} />
                                </div>
                            )}

                            {/* Tags */}
                            <div className="absolute top-4 left-4 z-10">
                                <span className={`px-3 py-1.5 rounded-lg text-[12px] font-bold uppercase tracking-wide shadow-sm ${listing.type === "venda"
                                    ? "bg-white text-[#222]"
                                    : "bg-[#222] text-white"
                                    }`}>
                                    {listing.type}
                                </span>
                            </div>

                            {/* Top Actions */}
                            <div className="absolute top-4 right-4 flex gap-2 z-10">
                                <button
                                    onClick={toggleFavorite}
                                    className="p-2.5 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-[#222] transition-all shadow-sm active:scale-90 group/heart"
                                >
                                    <Heart className={`w-4 h-4 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "group-hover/heart:text-red-500"}`} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const shareUrl = `${window.location.origin}${window.location.pathname}?id=${listing.id}`;
                                        const message = `Olha este imóvel na finHouse: ${listing.title} - ${shareUrl}`;
                                        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
                                    }}
                                    className="p-2.5 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-[#222] transition-all shadow-sm active:scale-90"
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Horizontal Thumbnails */}
                        {listing.images && listing.images.length > 1 && (
                            <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide bg-white border-b border-[#f0f0f0]">
                                {listing.images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImg(i)}
                                        className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${activeImg === i ? "border-amber-500 ring-2 ring-amber-500/20" : "border-transparent opacity-60 hover:opacity-100"
                                            }`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Content Area */}
                        <div className="p-6 md:p-8 space-y-8">
                            <div>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-[24px] md:text-[28px] font-extrabold text-[#222] leading-tight tracking-tight">{listing.title}</h2>
                                        <p className="text-[15px] text-[#717171] mt-2 flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4" />
                                            {listing.address}, {listing.neighborhood} — {listing.city}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 flex items-baseline gap-2">
                                    <span className="text-[32px] font-black text-[#222] tracking-tighter">{fmt(listing.price, listing.type)}</span>
                                    {listing.type === "aluguel" && <span className="text-[14px] text-[#717171] font-medium">/ mês</span>}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-2 py-6 border-y border-[#f0f0f0]">
                                {[
                                    { icon: Ruler, label: "Área", value: `${listing.area}m²` },
                                    { icon: BedDouble, label: "Quartos", value: listing.bedrooms.toString() },
                                    { icon: Bath, label: "Banheiros", value: listing.bathrooms.toString() },
                                    { icon: Car, label: "Vagas", value: listing.parking.toString() },
                                ].map((s) => (
                                    <div key={s.label} className="flex flex-col items-center justify-center p-2 rounded-2xl bg-gray-50/50">
                                        <s.icon className="w-5 h-5 text-[#222] mb-1.5" strokeWidth={1.5} />
                                        <p className="text-[15px] font-bold text-[#222]">{s.value}</p>
                                        <p className="text-[10px] font-bold text-[#b0b0b0] uppercase tracking-wider">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Description */}
                            <div>
                                <h3 className="text-[17px] font-extrabold text-[#222] mb-3">Sobre este imóvel</h3>
                                <p className="text-[15px] text-[#717171] leading-[1.6] font-medium">{listing.description}</p>
                            </div>

                            {/* Details Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 rounded-2xl bg-[#f7f7f7] border border-[#eee]">
                                    <p className="text-[11px] font-bold text-[#b0b0b0] uppercase tracking-wider mb-1">Tipo</p>
                                    <p className="text-[15px] font-bold text-[#222]">{listing.propertyType}</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-[#f7f7f7] border border-[#eee]">
                                    <p className="text-[11px] font-bold text-[#b0b0b0] uppercase tracking-wider mb-1">Código</p>
                                    <p className="text-[15px] font-bold text-[#222]">FIN-{listing.id.padStart(4, "0")}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sticky Footer CTA */}
                    <div className="p-5 sm:p-6 border-t border-[#f0f0f0] bg-white/80 backdrop-blur-lg flex flex-col sm:flex-row gap-3 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
                        <a
                            href={`${WA}?text=${encodeURIComponent(whatsappMsg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-[2] py-4 rounded-2xl bg-[#222] text-white text-[15px] font-bold hover:bg-[#333] transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-black/10"
                        >
                            <Phone className="w-4 h-4 fill-white" /> Falar com Corretor
                        </a>
                        <a
                            href={`${WA}?text=${encodeURIComponent(`Olá! Gostaria de agendar uma visita para o imóvel: ${listing.title}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-4 rounded-2xl border-2 border-[#222] text-[#222] text-[15px] font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            Agendar Visita
                        </a>
                    </div>
                </DialogContent>
            </Dialog>

            {/* LIGHTBOX - RENDERING OUTSIDE THE MAIN TREE VIA PORTAL */}
            {mounted && showLightbox && listing.images && createPortal(
                <div
                    className="fixed inset-0 bg-black z-[1000000] flex flex-col items-center justify-center overflow-hidden touch-none"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {/* TOP BAR */}
                    <div className="absolute top-0 left-0 right-0 h-20 flex items-center justify-between px-6 bg-gradient-to-b from-black/90 to-transparent z-[1000002] pointer-events-none">
                        <div className="text-white font-black tracking-widest text-[14px]">
                            {activeImg + 1} / {listing.images.length}
                        </div>
                        <button
                            onClick={(e) => closeLightbox(e)}
                            onTouchEnd={(e) => closeLightbox(e)}
                            className="p-4 text-white bg-white/20 active:bg-white/40 rounded-full transition-all pointer-events-auto"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            <X className="w-8 h-8" />
                        </button>
                    </div>

                    {/* MAIN AREA */}
                    <div
                        className="relative w-full h-full flex items-center justify-center"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setShowLightbox(false);
                        }}
                    >
                        {/* NAV BUTTONS - Extra High Priority and Area */}
                        {listing.images.length > 1 && (
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-[1000003] pointer-events-none">
                                <button
                                    onClick={(e) => prevImg(e)}
                                    onTouchEnd={(e) => prevImg(e)}
                                    className="p-6 text-white bg-black/50 active:bg-amber-500 rounded-full transition-all pointer-events-auto"
                                    style={{ WebkitTapHighlightColor: 'transparent' }}
                                >
                                    <ChevronLeft className="w-10 h-10" />
                                </button>
                                <button
                                    onClick={(e) => nextImg(e)}
                                    onTouchEnd={(e) => nextImg(e)}
                                    className="p-6 text-white bg-black/50 active:bg-amber-500 rounded-full transition-all pointer-events-auto"
                                    style={{ WebkitTapHighlightColor: 'transparent' }}
                                >
                                    <ChevronRight className="w-10 h-10" />
                                </button>
                            </div>
                        )}

                        {/* IMAGE */}
                        <img
                            src={listing.images[activeImg]}
                            alt={listing.title}
                            className="max-w-full max-h-[80vh] object-contain select-none pointer-events-none transition-all duration-300 transform scale-100"
                            style={{ webkitUserDrag: 'none' } as any}
                        />
                    </div>

                    {/* DOTS */}
                    <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-2 px-10">
                        {listing.images.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === activeImg ? "w-10 bg-amber-500" : "w-2 bg-white/20"}`}
                            />
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
