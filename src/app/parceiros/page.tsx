"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    Users,
    Target,
    TrendingUp,
    Shield,
    Phone,
    Mail,
    MapPin,
    BadgeCheck,
    Loader2,
    ChevronRight,
    Building2,
    Handshake,
    DollarSign,
    Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BAIRROS_SJC, BAIRROS_SP } from "@/lib/constants";
import Footer from "@/components/Footer";

const maskPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 0) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

function PartnerForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        creci: "",
        city: "São José dos Campos",
        neighborhoods: [] as string[],
        specialties: [] as string[],
        bio: "",
    });

    const availableSpecialties = [
        "Venda Residencial",
        "Alto Padrão",
        "Minha Casa Minha Vida",
        "Aluguel",
        "Comercial",
        "Terrenos",
        "Lançamentos",
    ];

    const toggleNeighborhood = (b: string) => {
        setForm((prev) => ({
            ...prev,
            neighborhoods: prev.neighborhoods.includes(b)
                ? prev.neighborhoods.filter((n) => n !== b)
                : [...prev.neighborhoods, b],
        }));
    };

    const toggleAllNeighborhoods = () => {
        setForm((prev) => ({
            ...prev,
            neighborhoods: prev.neighborhoods.length === bairros.length ? [] : [...bairros],
        }));
    };

    const toggleSpecialty = (s: string) => {
        setForm((prev) => ({
            ...prev,
            specialties: prev.specialties.includes(s)
                ? prev.specialties.filter((x) => x !== s)
                : [...prev.specialties, s],
        }));
    };

    const toggleAllSpecialties = () => {
        setForm((prev) => ({
            ...prev,
            specialties: prev.specialties.length === availableSpecialties.length ? [] : [...availableSpecialties],
        }));
    };

    const bairros =
        form.city === "São José dos Campos"
            ? BAIRROS_SJC
            : form.city === "São Paulo"
                ? BAIRROS_SP
                : [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.phone || !form.creci) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from("brokers").insert([
                {
                    name: form.name,
                    email: form.email,
                    phone: form.phone.replace(/\D/g, ""),
                    creci: form.creci,
                    city: form.city,
                    neighborhoods: form.neighborhoods,
                    specialties: form.specialties,
                    bio: form.bio,
                    status: "pending",
                    referral_fee: 15,
                },
            ]);

            if (error) throw error;
            setSuccess(true);
        } catch (err: any) {
            alert("Erro ao enviar cadastro: " + (err.message || "Tente novamente."));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-6">
                <div className="text-center max-w-lg animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-emerald-50">
                        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-black text-[#222] mb-4">
                        Cadastro enviado!
                    </h2>
                    <p className="text-[#717171] text-lg mb-8">
                        Recebemos seu cadastro e nossa equipe vai analisar seu perfil. Você
                        receberá um e-mail com o resultado em até 48 horas.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#222] text-white font-bold hover:bg-[#333] transition-colors"
                    >
                        Voltar ao Site <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-6 py-16">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-[14px] text-[#717171] hover:text-[#222] mb-8 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Voltar ao site
            </Link>

            <div className="bg-white rounded-[32px] border border-[#ebebeb] shadow-xl shadow-black/5 p-8 md:p-12">
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 mb-4">
                        <Handshake className="w-4 h-4 text-amber-600" />
                        <span className="text-[11px] font-black text-amber-600 uppercase tracking-widest">
                            Programa de Parceiros
                        </span>
                    </div>
                    <h1 className="text-[28px] md:text-[36px] font-black text-[#222] leading-tight tracking-[-0.02em] mb-3">
                        Cadastre-se como{" "}
                        <span className="text-amber-500">Corretor Parceiro</span>
                    </h1>
                    <p className="text-[16px] text-[#717171] leading-relaxed">
                        Receba leads qualificados de imóveis captados pela FinHouse. Você
                        faz as visitas, negocia e fecha — ficando com{" "}
                        <strong className="text-[#222]">85% da comissão</strong>.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Dados Pessoais */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-black text-[#b0b0b0] uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-4 h-4" /> Dados do Corretor
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-[#222]">
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({ ...form, name: e.target.value })
                                    }
                                    placeholder="Seu nome completo"
                                    className="w-full h-12 px-4 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#222] transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-[#222]">
                                    CRECI *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.creci}
                                    onChange={(e) =>
                                        setForm({ ...form, creci: e.target.value })
                                    }
                                    placeholder="Ex: 123456-F"
                                    className="w-full h-12 px-4 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#222] transition-colors"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-[#222] flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5" /> E-mail *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({ ...form, email: e.target.value })
                                    }
                                    placeholder="corretor@email.com"
                                    className="w-full h-12 px-4 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#222] transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-[#222] flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5" /> WhatsApp *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={maskPhone(form.phone)}
                                    onChange={(e) =>
                                        setForm({ ...form, phone: e.target.value })
                                    }
                                    placeholder="(12) 99999-9999"
                                    className="w-full h-12 px-4 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#222] transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Região de atuação */}
                    <div className="space-y-4 pt-4 border-t border-[#f0f0f0]">
                        <h3 className="text-[11px] font-black text-[#b0b0b0] uppercase tracking-widest flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Região de Atuação
                        </h3>
                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-[#222]">
                                Cidade Principal *
                            </label>
                            <select
                                value={form.city}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        city: e.target.value,
                                        neighborhoods: [],
                                    })
                                }
                                className="w-full h-12 px-4 rounded-xl border border-[#ddd] text-[14px] bg-white focus:outline-none focus:border-[#222] transition-colors"
                            >
                                <option value="São José dos Campos">São José dos Campos</option>
                                <option value="São Paulo">São Paulo</option>
                            </select>
                        </div>
                        {bairros.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-[#222]">
                                    Bairros de Atuação (selecione os que atende)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={toggleAllNeighborhoods}
                                        className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${form.neighborhoods.length === bairros.length
                                                ? "bg-amber-500 text-white border-amber-500"
                                                : "bg-white text-amber-600 border-amber-300 hover:border-amber-500"
                                            }`}
                                    >
                                        ✦ Todos
                                    </button>
                                    {bairros.map((b) => (
                                        <button
                                            key={b}
                                            type="button"
                                            onClick={() => toggleNeighborhood(b)}
                                            className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${form.neighborhoods.includes(b)
                                                    ? "bg-[#222] text-white border-[#222]"
                                                    : "bg-white text-[#717171] border-[#ddd] hover:border-[#222]"
                                                }`}
                                        >
                                            {b}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Especialidades */}
                    <div className="space-y-4 pt-4 border-t border-[#f0f0f0]">
                        <h3 className="text-[11px] font-black text-[#b0b0b0] uppercase tracking-widest flex items-center gap-2">
                            <Target className="w-4 h-4" /> Especialidades
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={toggleAllSpecialties}
                                className={`px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${form.specialties.length === availableSpecialties.length
                                        ? "bg-[#222] text-white border-[#222]"
                                        : "bg-white text-[#222] border-[#222] hover:bg-[#f7f7f7]"
                                    }`}
                            >
                                ✦ Todos
                            </button>
                            {availableSpecialties.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => toggleSpecialty(s)}
                                    className={`px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${form.specialties.includes(s)
                                            ? "bg-amber-500 text-white border-amber-500"
                                            : "bg-white text-[#717171] border-[#ddd] hover:border-amber-500"
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2 pt-4 border-t border-[#f0f0f0]">
                        <label className="text-[13px] font-semibold text-[#222]">
                            Sobre Você (opcional)
                        </label>
                        <textarea
                            value={form.bio}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })}
                            placeholder="Conte um pouco sobre sua experiência, tempo de mercado, tipo de imóvel que mais trabalha..."
                            className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-[#ddd] text-[14px] resize-none focus:outline-none focus:border-[#222] transition-colors"
                        />
                    </div>

                    {/* Info box */}
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                        <div className="flex items-start gap-3">
                            <BadgeCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[13px] font-bold text-amber-800 mb-1">
                                    Como funciona a parceria?
                                </p>
                                <p className="text-[12px] text-amber-700 leading-relaxed">
                                    Após aprovação, você receberá leads de imóveis captados pela
                                    FinHouse na sua região. Você faz todo o atendimento (visitas,
                                    negociação, jurídico). Na venda, a comissão é dividida:{" "}
                                    <strong>85% para você, 15% para a FinHouse</strong> como
                                    referral fee (padrão de mercado).
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 rounded-full bg-[#222] text-white text-[16px] font-bold hover:bg-[#333] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Enviando...
                            </>
                        ) : (
                            <>
                                Enviar Cadastro <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

function HeroSection() {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#222] py-20 md:py-28">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/[0.06] rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/[0.04] rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />

            <div className="max-w-[1280px] mx-auto px-6 relative z-10">
                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 mb-8">
                        <Handshake className="w-4 h-4 text-amber-400" />
                        <span className="text-[12px] font-bold text-white/60 uppercase tracking-widest">
                            Programa de Parceiros FinHouse
                        </span>
                    </div>
                    <h1 className="text-[36px] md:text-[56px] font-black text-white leading-[1.05] tracking-[-0.03em] mb-6">
                        Receba leads.{" "}
                        <span className="text-amber-400">Feche vendas.</span>
                        <br />
                        Fique com 85%.
                    </h1>
                    <p className="text-[18px] md:text-[20px] text-white/50 leading-relaxed max-w-2xl font-medium mb-10">
                        Nós captamos os imóveis e geramos a demanda. Você cuida do
                        atendimento, das visitas e da negociação. Comissão padrão de
                        mercado, sem custo fixo.
                    </p>
                    <div className="flex flex-wrap gap-8">
                        {[
                            { icon: DollarSign, label: "Comissão 85/15", sub: "Padrão de mercado" },
                            { icon: Zap, label: "Leads Quentes", sub: "Na sua região" },
                            { icon: Shield, label: "Zero Custo", sub: "Só paga se vender" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
                                    <item.icon className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-white text-[14px] font-bold">{item.label}</p>
                                    <p className="text-white/30 text-[12px] font-medium">{item.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function HowItWorks() {
    const steps = [
        {
            num: "01",
            title: "Cadastre-se",
            desc: "Preencha o formulário com seus dados e CRECI. Nossa equipe analisa seu perfil em até 48h.",
            icon: Users,
        },
        {
            num: "02",
            title: "Receba Leads",
            desc: "Após aprovação, você recebe imóveis captados pela FinHouse que estão na sua região de atuação.",
            icon: Target,
        },
        {
            num: "03",
            title: "Trabalhe o Lead",
            desc: "Faça as visitas, negocie com o comprador, cuide do jurídico e do financiamento. O imóvel é seu para vender.",
            icon: Building2,
        },
        {
            num: "04",
            title: "Feche e Receba",
            desc: "Na conclusão da venda, fique com 85% da comissão. Os 15% da FinHouse são pelo referral do lead.",
            icon: TrendingUp,
        },
    ];

    return (
        <div className="py-20 md:py-28 bg-[#f7f7f7]">
            <div className="max-w-[1280px] mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-[28px] md:text-[40px] font-black text-[#222] tracking-[-0.02em] mb-4">
                        Como funciona?
                    </h2>
                    <p className="text-[16px] text-[#717171] max-w-2xl mx-auto">
                        Um processo simples e transparente. Da captação ao fechamento, cada
                        etapa é clara para ambos os lados.
                    </p>
                </div>
                <div className="grid md:grid-cols-4 gap-8">
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className="relative bg-white rounded-[24px] p-8 border border-[#ebebeb] hover:shadow-xl hover:shadow-black/5 transition-all hover:-translate-y-1 group"
                        >
                            <span className="text-[48px] font-black text-[#f0f0f0] group-hover:text-amber-100 transition-colors absolute top-4 right-6">
                                {step.num}
                            </span>
                            <div className="w-12 h-12 rounded-xl bg-[#f7f7f7] group-hover:bg-[#222] flex items-center justify-center mb-6 transition-colors">
                                <step.icon className="w-6 h-6 text-[#222] group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-[18px] font-bold text-[#222] mb-2">
                                {step.title}
                            </h3>
                            <p className="text-[14px] text-[#717171] leading-relaxed">
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function ParceirosPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Nav */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#ebebeb]">
                <div className="max-w-[1280px] mx-auto flex items-center justify-between px-6 h-[72px]">
                    <Link href="/" className="flex items-center gap-2.5">
                        <Image
                            src="/logo.png"
                            alt="finHouse"
                            width={32}
                            height={32}
                            className="rounded-lg"
                        />
                        <span className="text-[17px] font-semibold text-[#222]">
                            finHouse
                        </span>
                    </Link>
                    <Link
                        href="/login"
                        className="text-[14px] font-semibold text-[#717171] hover:text-[#222] transition-colors"
                    >
                        Já sou parceiro? Login →
                    </Link>
                </div>
            </header>

            <HeroSection />
            <HowItWorks />
            <PartnerForm />
            <Footer />
        </div>
    );
}
