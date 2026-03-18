"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useListings } from "@/contexts/ListingsContext";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Plus,
    Trash2,
    Building2,
    BedDouble,
    Bath,
    Car,
    Ruler,
    LogOut,
    MapPin,
    UploadCloud,
    GripVertical,
    Loader2,
    Pencil,
    Save,
    Users,
    Kanban,
    CheckCircle2,
    AlertCircle,
    MessageCircle,
    BadgeDollarSign,
    MoreHorizontal,
    Search as SearchIcon,
} from "lucide-react";
import { useLeads, Lead, LeadStatus } from "@/contexts/LeadsContext";
import { SP_CITIES } from "@/lib/constants";

function DashboardContent() {
    const { user, isLoading, logout } = useAuth();
    const { listings, addListing, updateListing, removeListing } = useListings();
    const { leads, addLead, updateLead, removeLead } = useLeads();
    const router = useRouter();
    const [createOpen, setCreateOpen] = useState(false);
    const [editingListing, setEditingListing] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const isSavingRef = React.useRef(false);
    const [activeTab, setActiveTab] = useState<"listings" | "leads">("listings");
    const [leadSearch, setLeadSearch] = useState("");

    // Form state
    const [title, setTitle] = useState("");
    const [type, setType] = useState<"venda" | "aluguel">("venda");
    const [propertyType, setPropertyType] = useState("Apartamento");
    const [price, setPrice] = useState("");
    const [condominium, setCondominium] = useState("");
    const [iptu, setIptu] = useState("");
    const [area, setArea] = useState("");
    const [bedrooms, setBedrooms] = useState("2");
    const [bathrooms, setBathrooms] = useState("1");
    const [parking, setParking] = useState("1");
    const [cep, setCep] = useState("");
    const [address, setAddress] = useState("");
    const [neighborhood, setNeighborhood] = useState("");
    const [city, setCity] = useState("São Paulo");
    const [description, setDescription] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [ownerPhone, setOwnerPhone] = useState("");
    const [acceptsExchange, setAcceptsExchange] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Photos state
    const [photos, setPhotos] = useState<{ id: string; file: File; url: string }[]>([]);
    const [lastSavedData, setLastSavedData] = useState<string>("");

    // Auto-save logic
    useEffect(() => {
        if (!createOpen) return;

        const currentData = JSON.stringify({
            title, type, propertyType, price, condominium, iptu, area, bedrooms, bathrooms, parking,
            cep, address, neighborhood, city, description, acceptsExchange,
            photoCount: photos.length
        });

        if (currentData === lastSavedData) return;

        const timer = setTimeout(() => {
            handleSave(true); // Silent save
            setLastSavedData(currentData);
        }, 2000);

        return () => clearTimeout(timer);
    }, [title, type, propertyType, price, condominium, iptu, area, bedrooms, bathrooms, parking, cep, address, neighborhood, city, description, acceptsExchange, photos.length, createOpen]);

    // Terreno logic: zero components
    useEffect(() => {
        if (propertyType === "Terreno") {
            setBedrooms("0");
            setBathrooms("0");
            setParking("0");
        }
    }, [propertyType]);

    const processImage = async (file: File): Promise<Blob> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new (window as any).Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return resolve(file);

                    // Set canvas size to match image
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Draw original image
                    ctx.drawImage(img, 0, 0);

                    // Load Logo for Watermark
                    const logo = new (window as any).Image();
                    logo.src = "/logo.png";
                    logo.onload = () => {
                        // 1. DRAW CENTER LOGO (High Transparency)
                        const centerSize = Math.max(100, canvas.width * 0.25);
                        ctx.globalAlpha = 0.1; // Very subtle for the center
                        ctx.drawImage(
                            logo,
                            (canvas.width - centerSize) / 2,
                            (canvas.height - centerSize) / 2,
                            centerSize,
                            centerSize
                        );

                        // 2. DRAW CORNER WATERMARK (Slightly more visible)
                        const padding = canvas.width * 0.02;
                        const logoSize = Math.max(25, canvas.width * 0.035);
                        const fontSize = logoSize * 0.45;

                        ctx.globalAlpha = 0.25;

                        // Draw Bottom Right Logo
                        ctx.drawImage(
                            logo,
                            canvas.width - logoSize - padding,
                            canvas.height - logoSize - padding,
                            logoSize,
                            logoSize
                        );

                        // Draw Discrete Text next to logo
                        ctx.fillStyle = "white";
                        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
                        const text1 = "finHouse Collection";
                        const text2 = "vende melhor.";

                        const textWidth = ctx.measureText(text1).width;

                        ctx.fillText(
                            text1,
                            canvas.width - logoSize - padding - textWidth - 8,
                            canvas.height - padding - logoSize * 0.55
                        );

                        ctx.font = `${fontSize * 0.7}px Inter, sans-serif`;
                        ctx.fillText(
                            text2,
                            canvas.width - logoSize - padding - ctx.measureText(text2).width - 8,
                            canvas.height - padding - logoSize * 0.25
                        );

                        // Reset Alpha
                        ctx.globalAlpha = 1.0;

                        canvas.toBlob((blob) => {
                            resolve(blob || file);
                        }, file.type, 0.9);
                    };
                    logo.onerror = () => {
                        // Fallback if logo fails to load (just upload original)
                        resolve(file);
                    };
                };
            };
        });
    };

    const formatCurrency = (v: string) => {
        const num = v.replace(/\D/g, "");
        if (!num) return "";
        return (Number(num) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    };
    const parseCurrency = (v: string) => Number(v.replace(/\D/g, "")) / 100;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newArr = Array.from(e.target.files).map(f => ({
            id: Math.random().toString(36).substring(7),
            file: f,
            url: URL.createObjectURL(f)
        }));
        setPhotos(prev => [...prev, ...newArr].slice(0, 20)); // Limit 20 photos
    };

    const handleDragStart = (e: React.DragEvent, i: number) => {
        e.dataTransfer.setData("idx", i.toString());
    };
    const handleDrop = (e: React.DragEvent, targetIdx: number) => {
        e.preventDefault();
        const srcIdx = parseInt(e.dataTransfer.getData("idx"));
        if (isNaN(srcIdx) || srcIdx === targetIdx) return;
        const arr = [...photos];
        const [moved] = arr.splice(srcIdx, 1);
        arr.splice(targetIdx, 0, moved);
        setPhotos(arr);
    };
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const removePhoto = (index: number) => setPhotos(prev => prev.filter((_, i) => i !== index));

    useEffect(() => {
        if (!isLoading && !user) router.push("/login");
    }, [user, isLoading, router]);

    const handleEditInitiate = (listing: any) => {
        setEditingListing(listing);
        setTitle(listing.title);
        setType(listing.type);
        setPropertyType(listing.propertyType || "Apartamento");
        setPrice(listing.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
        setCondominium(listing.condominium?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "");
        setIptu(listing.iptu?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "");
        setArea(listing.area.toString());
        setBedrooms(listing.bedrooms.toString());
        setBathrooms(listing.bathrooms.toString());
        setParking(listing.parking.toString());
        setCep(listing.cep || "");
        setAddress(listing.address || "");
        setNeighborhood(listing.neighborhood || "");
        setCity(listing.city || "São Paulo");
        setDescription(listing.description || "");
        setAcceptsExchange(listing.acceptsExchange || false);
        setOwnerName(listing.owner_name || "");
        setOwnerPhone(listing.owner_phone || "");
        setPhotos(listing.images?.map((url: string) => ({ id: Math.random().toString(36), url, file: null })) || []);
        setCreateOpen(true);
    };

    const resetForm = () => {
        setEditingListing(null);
        setTitle(""); setType("venda"); setPropertyType("Apartamento");
        setPrice(""); setCondominium(""); setIptu(""); setArea(""); setBedrooms("2"); setBathrooms("1"); setParking("1");
        setCep(""); setAddress(""); setNeighborhood(""); setCity("São Paulo"); setDescription("");
        setPhotos([]); setAcceptsExchange(false);
        setOwnerName(""); setOwnerPhone("");
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-8 h-8 border-2 border-[#ddd] border-t-[#222] rounded-full animate-spin" />
            </div>
        );
    }


    const handleSave = async (silent = false) => {
        if (isSavingRef.current) return;
        if (!title && !silent) return;
        
        isSavingRef.current = true;
        if (!silent) setIsSaving(true);

        try {
            const uploadedUrls = [];
            // ... (rest of image upload logic)
            for (const photo of photos) {
                if (photo.file) {
                    const processedBlob = await processImage(photo.file);
                    const ext = photo.file.name.split('.').pop() || 'jpg';
                    const fileName = `${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${ext}`;
                    const { data, error } = await supabase.storage
                        .from('listings_images')
                        .upload(fileName, processedBlob, { contentType: photo.file.type });
                    if (data && !error) {
                        const { data: urlData } = supabase.storage.from('listings_images').getPublicUrl(fileName);
                        uploadedUrls.push(urlData.publicUrl);
                    }
                } else if (photo.url) {
                    uploadedUrls.push(photo.url);
                }
            }

            const payload = {
                title: title || "Sem título",
                type,
                propertyType,
                price: parseCurrency(price),
                condominium: parseCurrency(condominium),
                iptu: parseCurrency(iptu),
                area: parseFloat(area) || 0,
                bedrooms: parseInt(bedrooms) || 0,
                bathrooms: parseInt(bathrooms) || 0,
                parking: parseInt(parking) || 0,
                cep,
                address,
                neighborhood,
                city,
                description,
                acceptsExchange,
                owner_name: ownerName,
                owner_phone: ownerPhone,
                images: uploadedUrls,
            };

            if (editingListing) {
                await updateListing(editingListing.id, payload);
            } else {
                const newListing = await addListing(payload);
                if (newListing) {
                    setEditingListing(newListing);
                    // CRM: Auto-generate lead for property owner to manage acquisition
                    await addLead({
                        name: ownerName || `Proprietário: ${title}`,
                        email: "pendente@finhouse.com.br",
                        phone: ownerPhone || "(00) 00000-0000",
                        status: "Novo",
                        source: "Novo Anúncio",
                        property_id: newListing.id,
                        notes: `Oportunidade gerada para o imóvel: ${title}`,
                        financing_interest: false,
                        financing_status: "Não Iniciado"
                    });
                }
            }

            if (!silent) {
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                }, 3000);
            }
        } catch (error) {
            console.error("Erro ao salvar", error);
        } finally {
            isSavingRef.current = false;
            if (!silent) setIsSaving(false);
        }
    };

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleSave(false);
        setCreateOpen(false);
        resetForm();
    };

    const fmt = (p: number, t: string) =>
        t === "aluguel" ? `R$ ${p.toLocaleString("pt-BR")}/mês` : `R$ ${p.toLocaleString("pt-BR")}`;

    const getStatusColor = (status: LeadStatus) => {
        switch (status) {
            case "Novo": return "bg-blue-50 text-blue-600 border-blue-100";
            case "Contatado": return "bg-amber-50 text-amber-600 border-amber-100";
            case "Visita Efetuada": return "bg-indigo-50 text-indigo-600 border-indigo-100";
            case "Em Negociação": return "bg-purple-50 text-purple-600 border-purple-100";
            case "Aguardando Financiamento": return "bg-orange-50 text-orange-600 border-orange-100";
            case "Vendido": return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case "Perdido": return "bg-gray-50 text-gray-400 border-gray-100";
            default: return "bg-gray-50 text-[#717171] border-gray-100";
        }
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-[#ebebeb]">
                <div className="max-w-[1280px] mx-auto flex items-center justify-between px-6 h-[72px]">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2.5">
                            <Image src="/logo.png" alt="finHouse" width={32} height={32} className="rounded-lg" />
                            <span className="text-[17px] font-semibold text-[#222]">finHouse</span>
                        </Link>
                        <span className="text-[13px] text-[#b0b0b0] hidden sm:inline">/ Painel</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[14px] text-[#717171]">
                            <strong className="text-[#222]">{user.username}</strong>
                        </span>
                        <button
                            onClick={() => { logout(); router.push("/"); }}
                            className="flex items-center gap-1.5 text-[13px] text-[#717171] hover:text-[#222] transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> Sair
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-[1280px] mx-auto px-6 py-10">
                {/* Tabs & Search */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
                    <div className="flex items-center gap-1 bg-[#f7f7f7] p-1 rounded-2xl self-start">
                        <button
                            onClick={() => setActiveTab("listings")}
                            className={`px-6 py-2.5 rounded-xl text-[14px] font-bold transition-all ${activeTab === 'listings' ? 'bg-white text-[#222] shadow-sm' : 'text-[#717171] hover:text-[#222]'}`}
                        >
                            Anúncios
                        </button>
                        <button
                            onClick={() => setActiveTab("leads")}
                            className={`px-6 py-2.5 rounded-xl text-[14px] font-bold transition-all ${activeTab === 'leads' ? 'bg-white text-[#222] shadow-sm' : 'text-[#717171] hover:text-[#222]'}`}
                        >
                            Leads & CRM
                        </button>
                    </div>

                    {activeTab === "listings" ? (
                        <button
                            onClick={() => { resetForm(); setCreateOpen(true); }}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#222] text-white text-[14px] font-semibold hover:bg-[#333] transition-colors shrink-0"
                        >
                            <Plus className="w-4 h-4" /> Novo Anúncio
                        </button>
                    ) : (
                        <div className="relative w-full sm:w-80">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0b0b0]" />
                            <input
                                type="text"
                                placeholder="Buscar lead..."
                                value={leadSearch}
                                onChange={(e) => setLeadSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#f7f7f7] border-transparent focus:bg-white focus:border-[#222] transition-all text-[14px] outline-none"
                            />
                        </div>
                    )}
                </div>

                {activeTab === "listings" ? (
                    <>
                        {/* Listings Grid */}
                        <div className="mb-6">
                            <h2 className="text-[20px] font-bold text-[#222] tracking-tight">Imóveis Gerenciados</h2>
                            <p className="text-[14px] text-[#717171]">Gerencie e publique seus imóveis na plataforma.</p>
                        </div>

                        {/* Grid */}
                        {listings.filter(l => l.user_id === user.id).length > 0 ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {listings.filter(l => l.user_id === user.id).map((listing) => (
                                    <div
                                        key={listing.id}
                                        className={`group relative cursor-pointer transition-all duration-300 hover:translate-y-[-4px]`}
                                        onClick={() => handleEditInitiate(listing)}
                                    >
                                        {/* Image */}
                                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#f7f7f7] mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                                            {listing.images && listing.images.length > 0 ? (
                                                <img src={listing.images[0]} alt={listing.title} className="absolute inset-0 w-full h-full object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Building2 className="w-12 h-12 text-[#ddd]" strokeWidth={1} />
                                                </div>
                                            )}
                                            <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wide ${listing.type === "venda"
                                                ? "bg-white/90 text-[#222]"
                                                : "bg-[#222]/80 text-white"
                                                }`}>
                                                {listing.type}
                                            </span>
                                            <div className="absolute top-3 right-3 flex items-center gap-2">
                                                <div
                                                    className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-[#717171] group-hover:text-[#222] group-hover:bg-white transition-all shadow-sm"
                                                    title="Clique para editar"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeListing(listing.id);
                                                    }}
                                                    className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-[#717171] hover:text-red-500 hover:bg-white transition-all shadow-sm"
                                                    title="Remover"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        {/* Info */}
                                        <div className="space-y-1 px-0.5">
                                            <h3 className="text-[15px] font-semibold text-[#222] line-clamp-1 group-hover:text-[#000] transition-colors">{listing.title}</h3>
                                            <p className="text-[14px] text-[#717171] flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {listing.neighborhood}, {listing.city}
                                            </p>
                                            <div className="flex items-center gap-3 text-[12px] text-[#717171]">
                                                <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{listing.area}m²</span>
                                                <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{listing.bedrooms}</span>
                                                <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{listing.bathrooms}</span>
                                                <span className="flex items-center gap-1"><Car className="w-3 h-3" />{listing.parking}</span>
                                            </div>
                                            <p className="text-[15px] font-semibold text-[#222] pt-1">{fmt(listing.price, listing.type)}</p>
                                            <p className="text-[11px] text-[#b0b0b0]">por {listing.author}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24">
                                <Building2 className="w-16 h-16 text-[#ebebeb] mx-auto mb-4" strokeWidth={1} />
                                <p className="text-[16px] text-[#717171]">Nenhum anúncio encontrado.</p>
                                <button
                                    onClick={() => setCreateOpen(true)}
                                    className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#222] text-[#222] text-[14px] font-semibold hover:bg-[#f7f7f7] transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Criar primeiro anúncio
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    /* Leads Panel */
                    <div className="space-y-6">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-[20px] font-bold text-[#222] tracking-tight">Painel de Leads</h2>
                                <p className="text-[14px] text-[#717171]">Acompanhe interessados e os proprietários dos seus anúncios.</p>
                            </div>
                            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 text-[12px] font-bold">
                                <Building2 className="w-4 h-4" />
                                {listings.filter(l => l.user_id === user.id && l.owner_name).length} Imóveis Sincronizados
                            </div>
                        </div>

                        <div className="bg-white rounded-[32px] border border-[#ebebeb] overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#f7f7f7]">
                                            <th className="px-6 py-5 text-[11px] font-bold text-[#b0b0b0] uppercase tracking-widest">Lead / Contato</th>
                                            <th className="px-6 py-5 text-[11px] font-bold text-[#b0b0b0] uppercase tracking-widest">Imóvel de Interesse</th>
                                            <th className="px-6 py-5 text-[11px] font-bold text-[#b0b0b0] uppercase tracking-widest">Pipeline</th>
                                            <th className="px-6 py-5 text-[11px] font-bold text-[#b0b0b0] uppercase tracking-widest">Origem</th>
                                            <th className="px-6 py-5 text-[11px] font-bold text-[#b0b0b0] uppercase tracking-widest text-center">Crédito / Financiamento</th>
                                            <th className="px-6 py-5 text-[11px] font-bold text-[#b0b0b0] uppercase tracking-widest text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f7f7f7]">
                                        {[
                                            ...leads,
                                            // Marge listing owners as leads if they don't have a lead entry yet
                                            ...listings
                                                .filter(l => l.user_id === user.id && l.owner_name && !leads.some(ld => ld.property_id === l.id))
                                                .map(l => ({
                                                    id: `v-${l.id}`,
                                                    name: l.owner_name || "Proprietário",
                                                    phone: l.owner_phone || "Não informado",
                                                    status: "Novo" as LeadStatus,
                                                    source: "Novo Anúncio",
                                                    property_id: l.id,
                                                    financing_interest: false,
                                                }))
                                        ].filter(l =>
                                            (l.name || "").toLowerCase().includes(leadSearch.toLowerCase()) ||
                                            l.phone?.includes(leadSearch) ||
                                            (l as any).source?.toLowerCase().includes(leadSearch.toLowerCase())
                                        ).map((lead: any) => {
                                            const listing = listings.find(l => l.id === lead.property_id);
                                            return (
                                                <tr key={lead.id} className="hover:bg-[#fafafa] transition-colors group">
                                                    <td className="px-6 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-[#f7f7f7] flex items-center justify-center text-[14px] font-black text-[#222]">
                                                                {lead.name?.charAt(0) || "U"}
                                                            </div>
                                                            <div>
                                                                <p className="text-[15px] font-bold text-[#222]">{lead.name}</p>
                                                                <p className="text-[12px] text-[#717171]">{lead.phone}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        {listing ? (
                                                            <div className="flex items-center gap-3 max-w-[200px]">
                                                                <div className="w-12 h-12 rounded-lg bg-[#f7f7f7] flex-shrink-0 overflow-hidden relative">
                                                                    {listing.images?.[0] ? (
                                                                        <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center">
                                                                            <Building2 className="w-5 h-5 text-[#b0b0b0]" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <p className="text-[13px] font-bold text-[#222] truncate">{listing.title}</p>
                                                                    <div className="flex items-center gap-1 text-[11px] text-[#717171]">
                                                                        <MapPin className="w-2.5 h-2.5" />
                                                                        <span className="truncate">{listing.neighborhood}, {listing.city}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[12px] text-[#b0b0b0] italic">Imóvel não identificado</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-6">
                                                    <select
                                                        value={lead.status}
                                                        onChange={(e) => {
                                                            const newStatus = e.target.value as LeadStatus;
                                                            if (lead.id.startsWith('v-')) {
                                                                // If virtual, we need to create it properly when state changes
                                                                addLead({
                                                                    name: lead.name,
                                                                    phone: lead.phone,
                                                                    email: "",
                                                                    status: newStatus,
                                                                    source: lead.source,
                                                                    property_id: lead.property_id,
                                                                    notes: "Lead ativado a partir de anúncio.",
                                                                    financing_interest: false
                                                                });
                                                            } else {
                                                                updateLead(lead.id, { status: newStatus });
                                                            }
                                                        }}
                                                        className={`text-[12px] font-bold px-3 py-1.5 rounded-full border outline-none cursor-pointer transition-colors ${getStatusColor(lead.status)}`}
                                                    >
                                                        {["Novo", "Contatado", "Visita Efetuada", "Em Negociação", "Aguardando Financiamento", "Vendido", "Perdido"].map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <span className="text-[13px] text-[#717171] font-medium">{lead.source}</span>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${lead.financing_interest ? 'text-emerald-600' : 'text-[#b0b0b0]'}`}>
                                                            {lead.financing_interest ? 'Interesse Ativo' : 'Pendente'}
                                                        </span>
                                                        <p className="text-[12px] text-[#717171]">Crédito finHouse</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                const waFinHouse = "5511955842951";
                                                                const message = encodeURIComponent(`Olá finHouse! Gostaria de solicitar o financiamento para o lead: ${lead.name} (${lead.phone}).`);
                                                                
                                                                if (lead.id.startsWith('v-')) {
                                                                    await addLead({
                                                                        name: lead.name,
                                                                        phone: lead.phone,
                                                                        email: "",
                                                                        status: lead.status,
                                                                        source: lead.source,
                                                                        property_id: lead.property_id,
                                                                        financing_interest: true,
                                                                        notes: "Solicitou financiamento via finHouse WhatsApp."
                                                                    });
                                                                } else {
                                                                    await updateLead(lead.id, { financing_interest: true });
                                                                }
                                                                
                                                                window.open(`https://wa.me/${waFinHouse}?text=${message}`, '_blank');
                                                            }}
                                                            className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all border flex items-center gap-1.5 ${lead.financing_interest
                                                                ? 'bg-[#222] text-white border-[#222]'
                                                                : 'bg-white text-[#222] border-[#222] hover:bg-[#f7f7f7]'
                                                                }`}
                                                        >
                                                            <BadgeDollarSign className="w-4 h-4" />
                                                            Financiar
                                                        </button>
                                                        <button
                                                            onClick={() => { if (confirm("Remover lead?")) removeLead(lead.id) }}
                                                            className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {[
                                            ...leads,
                                            ...listings.filter(l => l.user_id === user.id && l.owner_name && !leads.some(ld => ld.property_id === l.id))
                                        ].length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-20 text-center">
                                                    <Users className="w-12 h-12 text-[#ebebeb] mx-auto mb-4" />
                                                    <p className="text-[14px] text-[#717171]">Nenhum lead encontrado ainda.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border-[#ebebeb]">
                    <DialogHeader>
                        <DialogTitle className="text-[20px] font-bold text-[#222] flex items-center justify-between">
                            {editingListing ? "Editar Anúncio" : "Novo Anúncio"}
                            {editingListing && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm("Deseja realmente excluir este anúncio?")) {
                                            removeListing(editingListing.id);
                                            setCreateOpen(false);
                                            resetForm();
                                        }
                                    }}
                                    className="p-2 text-[#717171] hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-[14px] text-[#717171]">
                            Preencha as informações para publicar na plataforma.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePublish} className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-[13px] font-semibold text-[#222]">Título *</Label>
                            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Apartamento 2 quartos em Pinheiros" className="rounded-xl h-11 border-[#ddd]" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[13px] font-semibold text-[#222]">Tipo</Label>
                                <div className="flex gap-2">
                                    {(["venda", "aluguel"] as const).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setType(t)}
                                            className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${type === t ? "bg-[#222] text-white border-[#222]" : "bg-white text-[#717171] border-[#ddd] hover:border-[#222]"
                                                }`}
                                        >
                                            {t === "venda" ? "Venda" : "Aluguel"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[13px] font-semibold text-[#222]">Tipo do Imóvel</Label>
                                <select
                                    value={propertyType}
                                    onChange={(e) => setPropertyType(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-[#ddd] px-3 text-[14px] bg-white"
                                >
                                    {["Apartamento", "Casa", "Terreno"].map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[13px] font-semibold text-[#222]">Preço *</Label>
                                <Input required value={price} onChange={(e) => setPrice(formatCurrency(e.target.value))} placeholder="R$ 500.000,00" className="rounded-xl h-11 border-[#ddd]" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[13px] font-semibold text-[#222]">Área (m²)</Label>
                                <Input type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="72" className="rounded-xl h-11 border-[#ddd]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[13px] font-semibold text-[#222]">Condomínio</Label>
                                <Input value={condominium} onChange={(e) => setCondominium(formatCurrency(e.target.value))} placeholder="R$ 0,00" className="rounded-xl h-11 border-[#ddd]" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[13px] font-semibold text-[#222]">IPTU</Label>
                                <Input value={iptu} onChange={(e) => setIptu(formatCurrency(e.target.value))} placeholder="R$ 0,00" className="rounded-xl h-11 border-[#ddd]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[13px] font-semibold text-[#222]">Quartos</Label>
                                <Input type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="rounded-xl h-11 border-[#ddd]" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[13px] font-semibold text-[#222]">Banheiros</Label>
                                <Input type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="rounded-xl h-11 border-[#ddd]" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[13px] font-semibold text-[#222]">Vagas</Label>
                                <Input type="number" min="0" value={parking} onChange={(e) => setParking(e.target.value)} className="rounded-xl h-11 border-[#ddd]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[13px] font-semibold text-[#222]">CEP</Label>
                                <Input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" className="rounded-xl h-11 border-[#ddd]" />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label className="text-[13px] font-semibold text-[#222]">Endereço</Label>
                                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número" className="rounded-xl h-11 border-[#ddd]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[13px] font-semibold text-[#222]">Bairro</Label>
                                <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Pinheiros" className="rounded-xl h-11 border-[#ddd]" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[13px] font-semibold text-[#222]">Cidade</Label>
                                <select
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-[#ddd] px-3 text-[14px] bg-white cursor-pointer"
                                >
                                    {SP_CITIES.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[13px] font-semibold text-[#222]">Descrição</Label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full min-h-[120px] rounded-xl border border-[#ddd] px-3 py-3 text-[14px] resize-none focus:outline-none focus:border-[#222] transition-colors"
                                placeholder="Ex: Lindo apartamento com varanda gourmet, vista livre, armários planejados. Prédio com lazer completo (piscina, academia, salão de festas)..."
                            />
                        </div>

                        <div className="bg-[#f7f7f7] p-4 rounded-2xl space-y-4">
                            <Label className="text-[11px] font-black text-[#717171] uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4" /> Gestão de Leads (Dados do Proprietário)
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[13px] font-semibold text-[#222]">Nome</Label>
                                    <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Nome do proprietário" className="rounded-xl h-11 border-[#ddd] bg-white text-[13px]" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[13px] font-semibold text-[#222]">Celular</Label>
                                    <Input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="(00) 00000-0000" className="rounded-xl h-11 border-[#ddd] bg-white text-[13px]" />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 pb-1">
                            <input type="checkbox" id="permuta" checked={acceptsExchange} onChange={(e) => setAcceptsExchange(e.target.checked)} className="w-4 h-4 rounded border-[#ddd] text-[#222]" />
                            <Label htmlFor="permuta" className="text-[13px] text-[#222] cursor-pointer">Aceita Permuta?</Label>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[13px] font-semibold text-[#222]">Fotos (até 20) - Arraste para ordenar</Label>
                            <label className="flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-dashed border-[#ddd] rounded-xl cursor-pointer hover:bg-[#f7f7f7] transition-colors px-4 text-center">
                                <UploadCloud className="w-6 h-6 text-[#b0b0b0] mb-2" />
                                <span className="text-[13px] text-[#717171]">Clique para selecionar fotos</span>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                            {photos.length > 0 && (
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-3">
                                    {photos.map((p, i) => (
                                        <div
                                            key={p.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, i)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, i)}
                                            className="relative aspect-[4/3] rounded-xl bg-[#f7f7f7] border border-[#ebebeb] overflow-hidden group cursor-grab active:cursor-grabbing"
                                        >
                                            <img src={p.url} className="object-cover w-full h-full" alt="" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <GripVertical className="w-4 h-4 text-white" />
                                                <button type="button" onClick={() => removePhoto(i)} className="p-1 text-white hover:text-red-400">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => handleSave(false)}
                                disabled={isSaving || showSuccess}
                                className={`h-12 rounded-full flex items-center justify-center gap-2 border border-[#222] text-[#222] text-[15px] font-semibold transition-all hover:bg-[#f7f7f7] disabled:opacity-50`}
                            >
                                <Save className="w-5 h-5" />
                                {isSaving ? "Salvando..." : showSuccess ? "Salvo!" : "Salvar Anúncio"}
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || showSuccess}
                                className={`h-12 rounded-full flex items-center justify-center gap-2 text-white text-[15px] font-semibold transition-all ${showSuccess ? "bg-emerald-500 scale-[0.98]" : "bg-[#222] hover:bg-[#333]"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isSaving ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Publicando...</>
                                ) : showSuccess ? (
                                    "Pronto!"
                                ) : (
                                    "Publicar Anúncio"
                                )}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <DashboardContent />
    );
}
