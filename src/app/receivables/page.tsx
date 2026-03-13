"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";
import {
    FileText,
    ShieldCheck,
    ArrowRight,
    UploadCloud,
    Bot,
    Scale,
    Clock,
    BadgeDollarSign,
    CheckCircle2,
    FileCheck,
    CloudIcon,
    AlertCircle,
    Loader2,
    ChevronDown,
    Lock,
    Zap,
    TrendingUp,
    MessageSquare
} from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function ReceivablesPage() {
    const [step, setStep] = useState(1);
    const [accepted, setAccepted] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    // Form state
    const [cnpj, setCnpj] = useState("");
    const [responsavel, setResponsavel] = useState("");
    const [telefone, setTelefone] = useState("");
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Scroll reveal observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
            { threshold: 0.15 }
        );
        document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const faqs = [
        { q: "A finHouse é uma empresa de cobrança tradicional?", a: "Não. Somos uma plataforma digital de recuperação de crédito B2B que usa automação e inteligência artificial. Não temos call center nem práticas agressivas — trabalhamos com régua de negociação digital e respeitamos o relacionamento comercial do nosso cliente com seus devedores." },
        { q: "O que acontece se não recuperarem nada?", a: "Nada. Nosso modelo é 100% No Win, No Fee — você só paga a comissão sobre valores efetivamente recuperados e creditados na sua conta. Se não recuperarmos, custo zero para você." },
        { q: "Quais tipos de dívida vocês aceitam?", a: "Qualquer dívida B2B com documentação comprobatória: notas fiscais, duplicatas, contratos de serviço, boletos vencidos, faturas de frete, etc. Não atuamos com dívidas de pessoas físicas (B2C)." },
        { q: "Preciso enviar documentos físicos?", a: "Não. A operação é 100% digital. Basta subir uma planilha com os dados das faturas e dos devedores. Aceitamos XLS, CSV, PDF e TXT." },
        { q: "Em quanto tempo começo a ver resultados?", a: "A régua de contato é ativada em até 24h após o upload. Os primeiros acordos costumam surgir entre 7 e 14 dias úteis, dependendo do perfil da carteira." },
        { q: "O devedor sabe que é a finHouse cobrando?", a: "A abordagem pode ser feita em nome da sua empresa ou em nome da finHouse como mandatária. Você escolhe. Em ambos os casos, o tom é profissional e conciliatório." },
    ];

    const rates = [
        { range: "Até R$ 50.000 / mês", rate: "4.99%" },
        { range: "R$ 50.001 a R$ 200.000 / mês", rate: "3.99%" },
        { range: "R$ 200.001 a R$ 500.000 / mês", rate: "2.99%" },
        { range: "Acima de R$ 500.000 / mês", rate: "2.25%" },
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length <= 10) {
            value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
            value = value.replace(/(\d{4})(\d)/, "$1-$2");
        } else {
            value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
            value = value.replace(/(\d{5})(\d)/, "$1-$2");
        }

        setTelefone(value);
    };

    const handleSubmit = async () => {
        if (files.length === 0) {
            alert("Por favor, adicione pelo menos um arquivo de faturas.");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Inserir dados do parceiro/cliente
            const { data: partner, error: partnerError } = await supabase
                .from('receivables_partners')
                .insert({
                    cnpj,
                    responsavel,
                    telefone,
                    email,
                    terms_accepted: accepted
                })
                .select()
                .single();

            if (partnerError) throw partnerError;

            // 2. Upload de todos os arquivos associados a esta submissão
            for (const file of files) {
                const ext = file.name.split('.').pop() || 'file';
                const fileName = `${partner.id}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from('receivables_files')
                    .upload(fileName, file);

                if (uploadError) console.error("Upload error:", uploadError);
            }

            setIsSuccess(true);
        } catch (error: any) {
            console.error("Erro ao integrar com a base de dados:", error);
            const errorMessage = error?.message || error?.details || JSON.stringify(error);
            alert(`Ocorreu um erro ao processar sua solicitação.\n\nDetalhes do Erro: ${errorMessage}\n\nDica: Verifique se o script SQL de criação da tabela 'receivables_partners' e do storage foi executado no seu painel do Supabase.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-[72px]">
                {/* ─── HERO ─── */}
                <section className="relative py-20 md:py-32 overflow-hidden bg-[#0a0a0f]">
                    <div className="absolute inset-0">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.15),transparent)]" />
                        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px]" />
                    </div>

                    <div className="max-w-[1280px] mx-auto px-6 relative z-10">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 text-[11px] font-bold text-blue-400 uppercase tracking-[0.2em]">
                                <Bot className="w-3.5 h-3.5" /> finHouse Receivables
                            </div>
                            <h1 className="text-[44px] md:text-[68px] font-black text-white leading-[0.95] tracking-[-0.04em] mb-8">
                                Recupere seu <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">contas a receber</span> com automação inteligente.
                            </h1>
                            <p className="text-[18px] md:text-[21px] text-white/50 leading-relaxed font-medium mb-10 max-w-2xl">
                                Suba suas faturas em atraso. Nossa plataforma negocia digitalmente com seus devedores. <strong className="text-white/80">Só ganhamos se você receber.</strong>
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 mb-16">
                                <a href="#start" className="px-10 py-5 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 hover:shadow-blue-500/30 hover:scale-[1.02]">
                                    Iniciar Recuperação <ArrowRight className="w-5 h-5" />
                                </a>
                                <a href="#pricing" className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all text-center">
                                    Ver Taxas
                                </a>
                            </div>
                        </div>

                        {/* Hero Stats Strip */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 border-t border-white/5 pt-10">
                            {[
                                { value: "2.25%", label: "Comissão mínima", sub: "sobre valor recuperado" },
                                { value: "< 24h", label: "Ativação da cobrança", sub: "após upload das faturas" },
                                { value: "R$ 0", label: "Custo inicial", sub: "sem setup ou mensalidade" },
                                { value: "100%", label: "Digital", sub: "sem papel, sem agência" },
                            ].map((stat, i) => (
                                <div key={i} className="animate-count" style={{ animationDelay: `${i * 150}ms` }}>
                                    <span className="text-[28px] md:text-[36px] font-black text-white block leading-none tracking-tight">{stat.value}</span>
                                    <span className="text-[12px] font-bold text-white/60 uppercase tracking-wider mt-2 block">{stat.label}</span>
                                    <span className="text-[11px] text-white/30 font-medium mt-1 block">{stat.sub}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── HOW IT WORKS ─── */}
                <section className="py-24 md:py-32 bg-white">
                    <div className="max-w-[1280px] mx-auto px-6">
                        <div className="text-center max-w-2xl mx-auto mb-20 reveal">
                            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-600 block mb-4">Como funciona</span>
                            <h2 className="text-[32px] md:text-[46px] font-black text-[#222] tracking-tight mb-5 leading-tight">
                                4 passos. Zero burocracia.
                            </h2>
                            <p className="text-[17px] text-[#717171] leading-relaxed">
                                Do upload da planilha ao dinheiro na conta — tudo automatizado.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-4 gap-0 relative">
                            {/* Connecting line */}
                            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
                            
                            {[
                                { icon: UploadCloud, num: "01", title: "Upload", desc: "Suba planilhas, PDFs ou TXT com os dados dos devedores." },
                                { icon: Bot, num: "02", title: "Análise IA", desc: "Nosso algoritmo classifica cada devedor e define a melhor estratégia." },
                                { icon: MessageSquare, num: "03", title: "Negociação", desc: "Régua de contato automatizada com propostas de acordo digital." },
                                { icon: TrendingUp, num: "04", title: "Recuperação", desc: "Devedor paga direto na sua conta. Você acompanha tudo em tempo real." },
                            ].map((item, i) => (
                                <div key={i} className="reveal text-center p-8 md:p-10 relative" style={{ transitionDelay: `${i * 100}ms` }}>
                                    <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 flex items-center justify-center mx-auto mb-6 group">
                                        <item.icon className="w-8 h-8 text-blue-600" />
                                        <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#222] text-white text-[11px] font-black flex items-center justify-center shadow-lg">{item.num}</span>
                                    </div>
                                    <h3 className="text-[18px] font-bold text-[#222] mb-3">{item.title}</h3>
                                    <p className="text-[14px] text-[#717171] leading-relaxed max-w-[200px] mx-auto">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── SCENARIOS ─── */}
                <section className="py-24 md:py-36 bg-[#111] text-white overflow-hidden">
                    <div className="max-w-[1280px] mx-auto px-6">
                        <div className="max-w-xl mb-20">
                            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-400 block mb-4">Cenários de Recuperação</span>
                            <h2 className="text-[36px] md:text-[52px] font-black tracking-tight leading-[1.05] mb-6">
                                Cada setor tem sua dor.<br /><span className="text-white/40">Nós temos a solução.</span>
                            </h2>
                            <p className="text-[16px] text-white/50 leading-relaxed">
                                Veja projeções reais de como a automação da finHouse Receivables atua em diferentes indústrias.
                            </p>
                        </div>

                        {/* ── Card 1: Logística ── */}
                        <div className="grid md:grid-cols-[1.2fr_1fr] gap-0 rounded-[28px] overflow-hidden mb-6 group">
                            <div className="relative h-[280px] md:h-auto overflow-hidden">
                                <Image src="/niche-logistics.png" alt="Logística" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-900/50 to-transparent" />
                                <div className="absolute inset-0 p-10 flex flex-col justify-end">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-300 mb-2">Logística</span>
                                    <h3 className="text-[24px] md:text-[30px] font-black leading-tight">
                                        Recuperação de até<br />R$ 450 mil em 45 dias
                                    </h3>
                                </div>
                            </div>
                            <div className="bg-[#1a1a1a] p-10 md:p-12 flex flex-col justify-center">
                                <p className="text-[15px] text-white/60 leading-relaxed mb-8">
                                    Carteira B2B antiga com faturas de frete e armazenagem. Upload direto, régua de cobrança automatizada e negociação digital com transportadores inadimplentes.
                                </p>
                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <span className="text-[36px] font-black text-blue-400 block leading-none">82%</span>
                                        <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider mt-2 block">Recuperação</span>
                                    </div>
                                    <div>
                                        <span className="text-[36px] font-black text-green-400 block leading-none">-40%</span>
                                        <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider mt-2 block">Custo</span>
                                    </div>
                                    <div>
                                        <span className="text-[36px] font-black text-white block leading-none">14d</span>
                                        <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider mt-2 block">Acordo</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Card 2: Indústria ── */}
                        <div className="grid md:grid-cols-[1fr_1.2fr] gap-0 rounded-[28px] overflow-hidden mb-6 group">
                            <div className="bg-[#1a1a1a] p-10 md:p-12 flex flex-col justify-center order-2 md:order-1">
                                <p className="text-[15px] text-white/60 leading-relaxed mb-8">
                                    Títulos em atraso de distribuidores e revendedores. Classificação automatizada por risco, abordagem multicanal e propostas de acordo digital com formalização rápida.
                                </p>
                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <span className="text-[36px] font-black text-purple-400 block leading-none">76%</span>
                                        <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider mt-2 block">Recuperação</span>
                                    </div>
                                    <div>
                                        <span className="text-[36px] font-black text-green-400 block leading-none">-35%</span>
                                        <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider mt-2 block">Custo</span>
                                    </div>
                                    <div>
                                        <span className="text-[36px] font-black text-white block leading-none">18d</span>
                                        <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider mt-2 block">Acordo</span>
                                    </div>
                                </div>
                            </div>
                            <div className="relative h-[280px] md:h-auto overflow-hidden order-1 md:order-2">
                                <Image src="/niche-industry.png" alt="Indústria" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-l from-indigo-900/80 via-indigo-900/50 to-transparent" />
                                <div className="absolute inset-0 p-10 flex flex-col justify-end items-end text-right">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-purple-300 mb-2">Indústria</span>
                                    <h3 className="text-[24px] md:text-[30px] font-black leading-tight">
                                        Recuperação de até<br />R$ 780 mil em 60 dias
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* ── Card 3: Tecnologia ── */}
                        <div className="grid md:grid-cols-[1.2fr_1fr] gap-0 rounded-[28px] overflow-hidden mb-16 group">
                            <div className="relative h-[280px] md:h-auto overflow-hidden">
                                <Image src="/niche-tech.png" alt="Tecnologia" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-900/80 via-amber-900/50 to-transparent" />
                                <div className="absolute inset-0 p-10 flex flex-col justify-end">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-300 mb-2">Tecnologia</span>
                                    <h3 className="text-[24px] md:text-[30px] font-black leading-tight">
                                        Recuperação de até<br />R$ 320 mil em 30 dias
                                    </h3>
                                </div>
                            </div>
                            <div className="bg-[#1a1a1a] p-10 md:p-12 flex flex-col justify-center">
                                <p className="text-[15px] text-white/60 leading-relaxed mb-8">
                                    Contratos SaaS recorrentes em atraso com clientes corporativos. Segmentação inteligente da carteira e régua de comunicação automatizada para acordos rápidos.
                                </p>
                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <span className="text-[36px] font-black text-amber-400 block leading-none">71%</span>
                                        <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider mt-2 block">Recuperação</span>
                                    </div>
                                    <div>
                                        <span className="text-[36px] font-black text-green-400 block leading-none">-45%</span>
                                        <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider mt-2 block">Custo</span>
                                    </div>
                                    <div>
                                        <span className="text-[36px] font-black text-white block leading-none">12d</span>
                                        <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider mt-2 block">Acordo</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <p className="text-[12px] text-white/25 text-center max-w-2xl mx-auto mb-20 leading-relaxed">
                            Os números acima são projeções ilustrativas baseadas em operações típicas de recuperação de crédito B2B. Resultados reais variam conforme perfil da carteira, idade da dívida e situação financeira dos devedores.
                        </p>

                        {/* CTA */}
                        <div className="text-center">
                            <a href="#start" className="inline-flex items-center justify-center px-12 py-6 rounded-2xl bg-blue-600 text-white font-black text-[18px] md:text-[20px] hover:bg-blue-500 hover:scale-[1.02] transition-all shadow-2xl shadow-blue-600/30 gap-3">
                                Simular recuperação da sua carteira <ArrowRight className="w-6 h-6" />
                            </a>
                            <p className="mt-6 text-[15px] text-white/40">
                                Envie suas faturas em atraso e receba uma estimativa analítica em minutos.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─── PRICING ─── */}
                <section id="pricing" className="py-24 md:py-32 bg-[#f7f7f7]">
                    <div className="max-w-[1280px] mx-auto px-6">
                        <div className="flex flex-col lg:flex-row gap-16 items-center">
                            <div className="flex-1 reveal">
                                <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-600 block mb-4">Precificação</span>
                                <h2 className="text-[36px] md:text-[48px] font-black text-[#222] tracking-tight mb-6 leading-tight">
                                    Mais volume,<br />menor comissão.
                                </h2>
                                <p className="text-[17px] text-[#717171] mb-10 leading-relaxed">
                                    Usamos automação para reduzir custos operacionais e entregar as taxas mais competitivas do mercado. Quanto mais faturas, menos você paga.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { icon: Zap, text: "Sem setup ou mensalidade" },
                                        { icon: Lock, text: "Pagamento direto na sua conta" },
                                        { icon: CloudIcon, text: "100% digital" },
                                        { icon: ShieldCheck, text: "Preserva relacionamento" },
                                        { icon: TrendingUp, text: "Acompanhamento em tempo real" },
                                        { icon: CheckCircle2, text: "Qualquer valor de fatura" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                                            <item.icon className="w-4 h-4 text-blue-600 shrink-0" />
                                            <span className="text-[14px] font-medium text-[#555]">{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 w-full max-w-lg reveal" style={{ transitionDelay: '150ms' }}>
                                <div className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-black/5 border border-gray-100">
                                    <div className="p-6 border-b border-gray-100 bg-[#222] flex flex-col">
                                        <span className="text-[13px] font-bold uppercase tracking-widest text-white/80">Tabela de Sucesso (No Win, No Fee)</span>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {rates.map((r, i) => (
                                            <div key={i} className="flex justify-between items-center p-6 hover:bg-blue-50/30 transition-colors">
                                                <span className="text-[15px] font-medium text-[#555]">{r.range}</span>
                                                <span className="text-[22px] font-black text-blue-600">{r.rate}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-6 bg-gray-50 border-t border-gray-100">
                                        <a href="#start" className="w-full p-4 rounded-2xl bg-[#222] text-white font-bold hover:bg-[#333] transition-all flex items-center justify-center gap-2">
                                            Começar agora <ArrowRight className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── PROTOTYPE ONBOARDING ─── */}
                <section id="start" className="py-20 md:py-32 bg-[#f0f4ff]">
                    <div className="max-w-[900px] mx-auto px-6">
                        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden">
                            <div className="grid md:grid-cols-[1fr_2fr]">
                                <div className="bg-blue-600 p-10 text-white flex flex-col justify-between">
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-6">
                                            <BadgeDollarSign className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-[24px] font-bold mb-4">Fluxo Instantâneo</h3>
                                        <p className="text-blue-100 text-[14px] leading-relaxed">
                                            Em menos de 2 minutos você autoriza a finHouse a atuar na recuperação de seus ativos.
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((s) => (
                                            <div key={s} className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] font-bold ${step === s ? "bg-white text-blue-600 border-white" : "border-white/30 text-white/30"}`}>
                                                    {s}
                                                </div>
                                                <span className={`text-[12px] font-bold uppercase tracking-wider ${step === s ? "text-white" : "text-white/30"}`}>
                                                    {s === 1 ? "Empresa" : s === 2 ? "Autorização" : "Invoices"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-10 md:p-14">
                                    {step === 1 && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <h4 className="text-[22px] font-extrabold text-[#222]">Dados da Empresa</h4>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[12px] font-bold text-[#b0b0b0] uppercase">CNPJ / Razão Social</label>
                                                        <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="w-full p-4 rounded-xl border border-[#eee] bg-[#f9f9f9] text-[15px] focus:outline-none focus:border-blue-500 transition-colors" placeholder="00.000.000/0001-00" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[12px] font-bold text-[#b0b0b0] uppercase">Responsável</label>
                                                        <input type="text" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className="w-full p-4 rounded-xl border border-[#eee] bg-[#f9f9f9] text-[15px] focus:outline-none focus:border-blue-500 transition-colors" placeholder="Nome Completo" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[12px] font-bold text-[#b0b0b0] uppercase">Telefone / WhatsApp</label>
                                                        <input type="tel" value={telefone} onChange={handlePhoneChange} className="w-full p-4 rounded-xl border border-[#eee] bg-[#f9f9f9] text-[15px] focus:outline-none focus:border-blue-500 transition-colors" placeholder="(11) 90000-0000" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[12px] font-bold text-[#b0b0b0] uppercase">E-mail corporativo</label>
                                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 rounded-xl border border-[#eee] bg-[#f9f9f9] text-[15px] focus:outline-none focus:border-blue-500 transition-colors" placeholder="contato@empresa.com.br" />
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (!cnpj || !responsavel || !telefone || !email) return alert("Preencha todos os campos.");
                                                    setStep(2);
                                                }}
                                                className="w-full p-5 rounded-2xl bg-[#222] text-white font-bold hover:bg-[#333] transition-all flex items-center justify-center gap-2"
                                            >
                                                Próximo Passo <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="flex items-center gap-2 text-blue-600">
                                                <Scale className="w-5 h-5" />
                                                <h4 className="text-[22px] font-extrabold text-[#222]">Termo de Aceite</h4>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-gray-50 border border-[#eee] max-h-[300px] overflow-y-auto text-[13px] text-[#717171] leading-relaxed space-y-4 custom-scrollbar">
                                                <p><strong>Cláusula 1 – Da Nomeação e Poderes de Representação</strong></p>
                                                <p>A CONTRATANTE, por meio do aceite eletrônico deste instrumento, nomeia e constitui a finHouse Receivables como sua mandatária para fins exclusivos de cobrança e recuperação extrajudicial de créditos relativos às faturas, títulos ou obrigações financeiras submetidas à plataforma.</p>
                                                <p>Para o cumprimento do objeto deste mandato, a CONTRATADA fica autorizada a:</p>
                                                <ul className="list-none space-y-1 pl-2">
                                                    <li>I – realizar contatos de cobrança por meios eletrônicos ou telefônicos;</li>
                                                    <li>II – encaminhar notificações de cobrança e lembretes de pagamento;</li>
                                                    <li>III – conduzir negociações extrajudiciais com devedores;</li>
                                                    <li>IV – propor e formalizar acordos de liquidação, parcelamentos ou renegociações;</li>
                                                    <li>V – emitir links, boletos ou meios eletrônicos de pagamento destinados à liquidação das obrigações.</li>
                                                </ul>
                                                <p>A presente autorização não confere poderes para representação judicial, salvo mediante instrumento específico.</p>

                                                <p><strong>Cláusula 2 – Da Origem e Legitimidade dos Créditos</strong></p>
                                                <p>A CONTRATANTE declara, sob as penas da lei, que todos os créditos submetidos à plataforma:</p>
                                                <ul className="list-none space-y-1 pl-2">
                                                    <li>I – são líquidos, certos e exigíveis;</li>
                                                    <li>II – decorrem de efetiva prestação de serviços ou entrega de produtos;</li>
                                                    <li>III – não estão sujeitos a litígios judiciais ou arbitrais em andamento;</li>
                                                    <li>IV – não possuem vícios, nulidades ou contestações comerciais relevantes.</li>
                                                </ul>
                                                <p>A CONTRATANTE reconhece que é a única responsável pela veracidade, legitimidade e existência dos créditos informados, isentando a CONTRATADA de qualquer responsabilidade decorrente de informações incorretas ou fraudulentas.</p>

                                                <p><strong>Cláusula 3 – Da Operação Digital e Dispensa de Documentos Físicos</strong></p>
                                                <p>A operação da plataforma ocorre integralmente em ambiente digital. A CONTRATANTE concorda que a submissão dos créditos poderá ocorrer por meio de integração de sistema, upload de planilhas ou arquivos digitais (PDF, XML ou similares). Não sendo exigido o envio de duplicatas físicas, contratos impressos ou documentos com reconhecimento de firma.</p>

                                                <p><strong>Cláusula 4 – Da Remuneração Baseada em Performance</strong></p>
                                                <p>A adesão à plataforma não implica cobrança de taxa de adesão, taxa de setup ou mensalidade obrigatória.</p>
                                                <p>A remuneração da CONTRATADA ocorrerá exclusivamente mediante Success Fee, incidente sobre valores efetivamente recuperados. O percentual de remuneração observará a Tabela de Comissionamento vigente na plataforma no momento da submissão do crédito.</p>

                                                <p><strong>Cláusula 5 – Do Fluxo de Liquidação Financeira</strong></p>
                                                <p>Os valores recuperados poderão ser processados por meio de estrutura de liquidação digital, podendo incluir contas de pagamento, contas de custódia ou mecanismos de split de pagamento.</p>
                                                <p>Nesse fluxo, será realizada automaticamente: I – a retenção da remuneração da CONTRATADA; e II – a transferência do saldo líquido à CONTRATANTE.</p>

                                                <p><strong>Cláusula 6 – Da Proteção de Dados e Confidencialidade</strong></p>
                                                <p>A CONTRATADA compromete-se a tratar os dados recebidos em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). As informações comerciais, financeiras e cadastrais compartilhadas entre as partes serão tratadas como confidenciais, sendo utilizadas exclusivamente para a execução dos serviços de recuperação de crédito.</p>

                                                <p><strong>Cláusula 7 – Das Boas Práticas de Cobrança</strong></p>
                                                <p>A CONTRATADA compromete-se a conduzir as atividades de cobrança com respeito às boas práticas comerciais, abstendo-se de qualquer prática vexatória, abusiva ou coercitiva. O objetivo da atuação é promover a regularização financeira preservando as relações comerciais entre credor e devedor sempre que possível.</p>

                                                <p><strong>Cláusula 8 – Da Vigência e Revogação</strong></p>
                                                <p>O presente mandato terá vigência por prazo indeterminado, podendo ser revogado pela CONTRATANTE a qualquer momento mediante solicitação formal através da plataforma.</p>
                                                <p>A revogação não afetará negociações já iniciadas, acordos firmados ou valores em processo de liquidação.</p>

                                                <p><strong>Cláusula 9 – Do Aceite Eletrônico</strong></p>
                                                <p>O aceite deste termo realizado por meio eletrônico (login na plataforma, assinatura digital, confirmação via e-mail ou clique em campo de concordância) constitui manifestação válida de vontade e equivale à assinatura física do presente instrumento.</p>
                                            </div>
                                            <label className="flex items-center gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50/50 cursor-pointer">
                                                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="w-5 h-5 rounded border-blue-200 text-blue-600" />
                                                <span className="text-[14px] text-[#222] font-semibold">Autorizo a finHouse a atuar na recuperação de minhas faturas.</span>
                                            </label>
                                            <div className="flex gap-4">
                                                <button onClick={() => setStep(1)} className="flex-1 p-5 rounded-2xl border border-[#eee] text-[#717171] font-bold hover:bg-gray-50">Voltar</button>
                                                <button disabled={!accepted} onClick={() => setStep(3)} className="flex-[2] p-5 rounded-2xl bg-[#222] text-white font-bold hover:bg-[#333] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                                    Continuar <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {step === 3 && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <h4 className="text-[22px] font-extrabold text-[#222]">Subir Invoices</h4>

                                            {isSuccess ? (
                                                <div className="p-10 text-center space-y-4 border-2 border-green-500/20 bg-green-50 rounded-3xl animate-in zoom-in duration-300">
                                                    <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-4 scale-110">
                                                        <CheckCircle2 className="w-8 h-8" />
                                                    </div>
                                                    <h4 className="text-[24px] font-black text-green-700">Parceria Iniciada!</h4>
                                                    <p className="text-[#222] font-medium">Arquivos enviados com sucesso e nossa IA já iniciou o mapeamento inicial.</p>
                                                    <p className="text-[14px] text-green-700/80">Um especialista técnico entrará em contato via e-mail nas próximas 2 horas para formalizar as conexões e conceder acesso ao seu Dashboard em Tempo Real.</p>
                                                    <div className="pt-4">
                                                        <a href="https://wa.me/5511955842951" target="_blank" className="inline-flex py-3 px-6 rounded-xl bg-white text-green-600 border border-green-200 font-bold hover:bg-green-100 transition-colors">Fale com um Consultor</a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 flex gap-4 items-start">
                                                        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                                        <div className="space-y-3 w-full">
                                                            <p className="text-[14px] font-bold text-blue-900">Para iniciar a cobrança, sua planilha deve conter no mínimo:</p>
                                                            <ul className="list-disc pl-4 text-[13px] text-blue-800/80 space-y-1">
                                                                <li>Nome ou Razão Social do Devedor</li>
                                                                <li>CNPJ ou CPF</li>
                                                                <li>E-mail ou Telefone do contato financeiro</li>
                                                                <li>Valor devido (R$)</li>
                                                                <li>Número da Nota Fiscal ou identificação do serviço</li>
                                                                <li>Data original de vencimento</li>
                                                            </ul>

                                                            <p className="text-[14px] font-bold text-blue-900 pt-2">O que também ajuda (opcional):</p>
                                                            <ul className="list-disc pl-4 text-[13px] text-blue-800/80 space-y-1">
                                                                <li>Nome do responsável financeiro</li>
                                                                <li>Cidade / Estado do devedor</li>
                                                                <li>Descrição do produto ou serviço</li>
                                                                <li>Data de emissão da NF</li>
                                                                <li>Link ou PDF da Nota Fiscal</li>
                                                            </ul>

                                                            <div className="pt-2 border-t border-blue-200/50 mt-2">
                                                                <p className="text-[13px] font-medium text-blue-900 mt-2">Com essas informações já conseguimos iniciar a cobrança.</p>
                                                                <p className="text-[12px] text-blue-800/70">Juros, multa de mora e atualização do valor são calculados automaticamente pelo sistema conforme a legislação brasileira.</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 mt-6">
                                                        <label className="flex flex-col items-center justify-center w-full min-h-[200px] border-2 border-dashed border-blue-300 rounded-3xl cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-all px-8 text-center group">
                                                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 transition-all">
                                                                <UploadCloud className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
                                                            </div>
                                                            <span className="text-[16px] font-bold text-[#222]">Arraste seus arquivos aqui</span>
                                                            <span className="text-[13px] text-[#717171] mt-1">Planilhas, PDFs e Retornos de sistema</span>
                                                            <input type="file" multiple className="hidden" onChange={handleFileChange} />
                                                        </label>
                                                    </div>

                                                    {files.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-[12px] font-bold text-blue-600 uppercase tracking-widest">{files.length} arquivo(s) selecionado(s)</p>
                                                            <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                                                                {files.map((f, i) => (
                                                                    <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-[#eee]">
                                                                        <FileText className="w-4 h-4 text-[#717171] shrink-0" />
                                                                        <span className="text-[12px] text-[#222] truncate font-medium">{f.name}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col md:flex-row gap-4 pt-6">
                                                        <button disabled={isSubmitting} onClick={() => setStep(2)} className="w-full md:w-auto p-4 px-6 rounded-2xl border border-[#eee] text-[#717171] font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors">
                                                            Voltar
                                                        </button>
                                                        <div className="flex-1 flex flex-col gap-3">
                                                            <button disabled={isSubmitting} onClick={handleSubmit} className="w-full p-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                                                {isSubmitting ? (
                                                                    <><Loader2 className="w-5 h-5 animate-spin" /> Configurando Parceria...</>
                                                                ) : (
                                                                    <>Iniciar Cobrança - No Win, No Fee</>
                                                                )}
                                                            </button>
                                                            <p className="text-center text-[13px] text-[#717171]">
                                                                Ainda em dúvida? <a href="https://wa.me/5511955842951" target="_blank" className="font-bold text-blue-600 hover:underline">Fale com nossos consultores</a>.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── FAQ + TRUST ─── */}
                <section className="py-24 md:py-32 bg-white">
                    <div className="max-w-[1280px] mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-20">
                            <div className="reveal">
                                <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-600 block mb-4">Perguntas Frequentes</span>
                                <h2 className="text-[32px] md:text-[42px] font-black text-[#222] tracking-tight mb-10 leading-tight">
                                    Tire suas dúvidas antes de começar.
                                </h2>
                                <div className="space-y-3">
                                    {faqs.map((faq, i) => (
                                        <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50 hover:bg-white transition-colors">
                                            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex justify-between items-center p-5 text-left gap-4">
                                                <span className="text-[15px] font-bold text-[#222]">{faq.q}</span>
                                                <ChevronDown className={`w-5 h-5 text-[#999] shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                                            </button>
                                            <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-[300px] pb-5' : 'max-h-0'}`}>
                                                <p className="px-5 text-[14px] text-[#717171] leading-relaxed">{faq.a}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="reveal flex flex-col justify-center" style={{ transitionDelay: '150ms' }}>
                                <div className="bg-[#0a0a0f] rounded-[32px] p-10 md:p-14 text-white mb-8">
                                    <h3 className="text-[24px] font-black mb-6 tracking-tight">Segurança que você pode confiar</h3>
                                    <div className="space-y-6">
                                        {[
                                            { icon: Lock, title: "Ambiente Escrow", desc: "Valores transitam por contas segregadas com rastreio completo." },
                                            { icon: FileCheck, title: "Assinatura Digital", desc: "Acordos com validade jurídica via certificado ICP-Brasil." },
                                            { icon: ShieldCheck, title: "LGPD Compliant", desc: "Tratamento de dados em conformidade total com a Lei 13.709/2018." },
                                        ].map((item, i) => (
                                            <div key={i} className="flex gap-4 items-start">
                                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                                    <item.icon className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-[15px] font-bold mb-1">{item.title}</h4>
                                                    <p className="text-[13px] text-white/50 leading-relaxed">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-[13px] text-[#999] text-center leading-relaxed">
                                    finHouse · CNPJ 60.806.192/0001-50 · Correspondente Bancário autorizado
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
            <WhatsAppFab />
        </div>
    );
}

