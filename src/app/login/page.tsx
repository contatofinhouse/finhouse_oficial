"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Footer from "@/components/Footer";
import { 
    Eye, 
    EyeOff, 
    ArrowLeft,
    Zap, 
    ShieldCheck, 
    Rocket, 
    LineChart, 
    CheckCircle2, 
    Clock, 
    Users, 
    ChevronRight,
    LayoutDashboard,
    Image as ImageIcon,
    Target
} from "lucide-react";

function LoginForm() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { error: loginError } = await login(email, password);

        if (!loginError) {
            router.push("/dashboard");
        } else {
            setError(loginError === "Invalid login credentials" ? "E-mail ou senha inválidos." : loginError);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7] py-20">
            <div className="w-full max-w-[420px] px-6">
                {/* Back */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[14px] text-[#717171] hover:text-[#222] mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao site
                </Link>

                <div className="bg-white rounded-3xl border border-[#ebebeb] shadow-sm p-8 md:p-10">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <Link href="/">
                            <Image src="/logo.png" alt="finHouse" width={56} height={56} className="rounded-xl mx-auto mb-4" />
                        </Link>
                        <h1 className="text-[24px] font-bold text-[#222] tracking-[-0.02em]">Bem-vindo de volta</h1>
                        <p className="text-[14px] text-[#717171] mt-1">Acesse seu painel finHouse</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[13px] font-semibold text-[#222]">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="rounded-xl h-12 border-[#ddd] text-[15px] focus:border-[#222] focus:ring-[#222]"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-[13px] font-semibold text-[#222]">Senha</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPass ? "text" : "password"}
                                    placeholder="Sua senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="rounded-xl h-12 border-[#ddd] text-[15px] pr-11 focus:border-[#222] focus:ring-[#222]"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b0b0b0] hover:text-[#222] transition-colors"
                                >
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-full bg-[#222] text-white text-[15px] font-semibold hover:bg-[#333] disabled:opacity-50 transition-colors flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Entrar"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

const WA_PARTNER = "https://wa.me/5511955842951?text=Olá! Quero saber mais sobre a parceria para corretores.";

function BrokerBenefits() {
    return (
        <div className="py-20 md:py-28 bg-white border-t border-[#ebebeb]">
            <div className="max-w-[1280px] mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center mb-16 px-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 mb-6 font-bold text-[11px] text-amber-600 uppercase tracking-widest">
                        Ecossistema para Autônomos
                    </div>
                    <h2 className="text-[32px] md:text-[48px] font-black text-[#222] leading-[1.1] tracking-[-0.03em] mb-6">
                        Sua imobiliária digital de elite, com <span className="text-amber-500">risco zero</span>
                    </h2>
                    <p className="text-[17px] md:text-[19px] text-[#717171] leading-relaxed font-medium">
                        Você foca na venda e no relacionamento. Nós cuidamos da infraestrutura, do crédito e da burocracia por apenas <span className="text-[#222] font-bold">2.5% de taxa sobre vendas concluídas</span>.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                    {[
                        { 
                            icon: Zap, 
                            title: "Comissões Prime", 
                            desc: "Pagamentos ultra-rápidos. Sem mensalidade ou custo fixo: pagamos você com agilidade." 
                        },
                        { 
                            icon: ShieldCheck, 
                            title: "Suporte 360°", 
                            desc: "Consultoria jurídica e operacional para blindar seus negócios e emitir contratos de elite." 
                        },
                        { 
                            icon: Rocket, 
                            title: "ZAP, Viva & OLX", 
                            desc: "Seus anúncios impulsionados nos maiores portais do Brasil com fotos profissionais inclusas." 
                        },
                        { 
                            icon: CheckCircle2, 
                            title: "Crédito Integrado", 
                            desc: "Apoio total da finHouse para garantir e agilizar o financiamento bancário do seu cliente." 
                        },
                    ].map((item, idx) => (
                        <div key={idx} className="p-8 rounded-[32px] bg-[#f7f7f7] hover:bg-white border border-transparent hover:border-[#ebebeb] hover:shadow-xl hover:shadow-black/5 transition-all group">
                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm group-hover:bg-[#222] transition-colors">
                                <item.icon className="w-6 h-6 text-[#222] group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-[18px] font-bold text-[#222] mb-3">{item.title}</h3>
                            <p className="text-[14px] text-[#717171] leading-relaxed font-medium">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* finHouse OS - Destaque */}
                <div className="mb-24">
                    <div className="bg-gradient-to-br from-[#222] to-[#111] rounded-[48px] p-8 md:p-16 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/[0.05] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                                <div className="max-w-xl">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center">
                                            <LayoutDashboard className="w-6 h-6 text-[#222]" />
                                        </div>
                                        <span className="text-white font-extrabold text-[20px] tracking-tight">finHouse OS</span>
                                    </div>
                                    <h3 className="text-[32px] md:text-[42px] font-black text-white mb-6 leading-tight">
                                        Seu Painel de Controle, <span className="text-amber-400">Totalmente Grátis</span>
                                    </h3>
                                    <p className="text-white/60 text-[18px] mb-8 font-medium">
                                        Tecnologia de portal imobiliário desenhada para o corretor moderno. Gerencie tudo em um só lugar.
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        {[
                                            { icon: Target, t: "Gestão de Leads", d: "Acompanhe e converta interessados em tempo real." },
                                            { icon: ImageIcon, t: "Marca D'água Auto", d: "Proteja suas fotos com marca d'água automática ao subir." },
                                            { icon: LineChart, t: "Relatórios Pro", d: "Métricas de cliques e desempenho dos seus anúncios." },
                                            { icon: Clock, t: "Update em Lote", d: "Atualize preços e status de múltiplos imóveis com um clique." },
                                        ].map((tool, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="mt-1">
                                                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-white text-[15px] font-bold mb-0.5">{tool.t}</h4>
                                                    <p className="text-white/40 text-[13px] leading-tight">{tool.d}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="lg:w-[400px]">
                                    <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-8 border border-white/10">
                                        <h4 className="text-amber-400 text-[13px] font-black tracking-[0.2em] mb-8 uppercase">Acesso Imediato</h4>
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-white/60 text-[12px] font-bold uppercase">Modalidade</span>
                                                    <span className="text-amber-400 text-[11px] font-black underline">FREE</span>
                                                </div>
                                                <p className="text-white text-[15px] font-bold">Acesso ao ecossistema</p>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-white/60 text-[12px] font-bold uppercase">Seleção</span>
                                                    <span className="text-green-400 text-[11px] font-black uppercase">Perfil</span>
                                                </div>
                                                <p className="text-white text-[15px] font-bold">Sujeito a aprovação de perfil</p>
                                            </div>
                                            <a 
                                                href={WA_PARTNER}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-5 rounded-2xl bg-white text-[#222] text-[15px] font-black hover:bg-amber-400 transition-colors uppercase mt-4"
                                            >
                                                Quero ser Parceiro <ChevronRight className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Por que ser um Parceiro */}
                <div className="bg-[#f7f7f7] rounded-[48px] p-8 md:p-16 border border-[#ebebeb]">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h3 className="text-[28px] md:text-[36px] font-bold text-[#222] mb-8 tracking-tight">
                                Por que ser um Parceiro finHouse?
                            </h3>
                            <div className="space-y-6">
                                {[
                                    { t: "Integração Bancária Total", d: "Sua ponte direta com os principais bancos para agilizar o crédito dos clientes." },
                                    { t: "Escritório de Alto Padrão", d: "A depender da localidade, oferecemos estrutura física para reuniões e fechamento." },
                                    { t: "Segurança Jurídica Total", d: "Não perca vendas por burocracia. Nosso time jurídico valida tudo para você." },
                                    { t: "Custo por Performance", d: "Taxa administrativa de apenas 2.5% sobre o valor da venda concluída." }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="mt-1">
                                            <CheckCircle2 className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-[#222] text-[16px] font-bold mb-1">{step.t}</h4>
                                            <p className="text-[#717171] text-[14px] leading-relaxed">{step.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-black/5 border border-[#eee]">
                            <h4 className="text-[#222] text-[13px] font-black tracking-[0.2em] mb-8 uppercase">Escassez e Rigor</h4>
                            <div className="space-y-8">
                                {[
                                    { label: "Seleção de Perfil", value: "Exclusiva", icon: Users },
                                    { label: "ZAP, Viva & OLX", value: "Inclusos", icon: Rocket },
                                    { label: "Custo por Venda", value: "2.5%", icon: Zap }
                                ].map((stat, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <stat.icon className="w-5 h-5 text-[#717171]" />
                                            <span className="text-[#717171] text-[14px] font-bold">{stat.label}</span>
                                        </div>
                                        <span className="text-[#222] text-[18px] font-black">{stat.value}</span>
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-[#f0f0f0]">
                                    <p className="text-[13px] text-[#717171] leading-relaxed text-center font-medium">
                                        Buscamos corretores que compartilham nosso DNA de excelência. Vagas limitadas por região.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#f7f7f7]">
            <LoginForm />
            <BrokerBenefits />
            <Footer />
        </div>
    );
}
