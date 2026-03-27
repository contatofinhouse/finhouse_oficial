"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useListings, Listing } from "@/contexts/ListingsContext";
import Header from "@/components/Header";
import WhatsAppFab from "@/components/WhatsAppFab";
import SimulationModal from "@/components/SimulationModal";
import {
  Search,
  MapPin,
  ArrowRight,
  Gift,
  Target,
  Wallet,
  PiggyBank,
  Calculator,
  Users,
  ShieldCheck,
  LineChart,
  Headset,
  Handshake,
  BadgeDollarSign,
  Building2,
  Check,
  Rocket,
  Zap,
} from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import PropertyDetailModal from "@/components/PropertyDetailModal";
import Footer from "@/components/Footer";

const WA = "https://wa.me/5511955842951";

/* ─── HERO ─── */
function HeroSection({ onSimulate }: { onSimulate: () => void }) {
  return (
    <section id="hero" className="pt-[72px]">
      <div className="relative overflow-hidden">
        {/* Hero Image */}
        <div className="absolute inset-0">
          <Image
            src="/hero.png"
            alt="Interior moderno de apartamento"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/30" />
        </div>

        <div className="relative max-w-[1280px] mx-auto px-6 py-20 md:py-28 lg:py-36">
          <div className="max-w-xl">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <Image
                src="/logo.png"
                alt="finHouse Logo"
                width={48}
                height={48}
                className="rounded-xl"
              />
              <span className="text-[22px] font-bold text-[#222] tracking-[-0.02em]">finHouse. <span className="underline decoration-amber-400 decoration-4 underline-offset-4">vende melhor.</span></span>
            </div>

            <h1 className="text-[40px] md:text-[52px] lg:text-[60px] font-extrabold text-[#222] leading-[1.05] tracking-[-0.03em]">
              Encontre seu<br />
              próximo lar
            </h1>
            <p className="mt-5 text-[17px] md:text-[19px] text-[#444] leading-relaxed max-w-lg font-medium">
              Curadoria de imóveis exclusivos e assessoria completa em financiamento. <span className="underline decoration-amber-400 decoration-2 underline-offset-4">finHouse.    </span>
            </p>

            {/* Search bar */}
            <a href="#imoveis" className="block mt-8">
              <div className="flex items-center bg-white rounded-full border border-[#ddd] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.08)] transition-shadow max-w-xl">
                <div className="flex items-center gap-3 pl-6 pr-4 py-4 flex-1 min-w-0">
                  <Search className="w-5 h-5 text-[#222] shrink-0" />
                  <span className="text-[15px] text-[#717171] truncate">Buscar por bairro, cidade ou tipo...</span>
                </div>
                <div className="m-2 px-6 py-3 rounded-full bg-[#222] text-white text-[14px] font-semibold shrink-0">
                  Buscar
                </div>
              </div>
            </a>

            {/* Quick chips */}
            <div className="mt-6 flex flex-wrap gap-2">
              <a href="#imoveis" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#ddd] bg-white/80 backdrop-blur-sm text-[13px] font-medium text-[#222] hover:bg-white transition-colors">
                <Building2 className="w-3.5 h-3.5" /> Comprar
              </a>
              <a href="#imoveis" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#ddd] bg-white/80 backdrop-blur-sm text-[13px] font-medium text-[#222] hover:bg-white transition-colors">
                <MapPin className="w-3.5 h-3.5" /> Alugar
              </a>
              <button
                onClick={onSimulate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#ddd] bg-white/80 backdrop-blur-sm text-[13px] font-medium text-[#222] hover:bg-white transition-colors"
              >
                <Calculator className="w-3.5 h-3.5" /> Simular
              </button>
              <a href="#indicacao" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#ddd] bg-white/80 backdrop-blur-sm text-[13px] font-medium text-[#222] hover:bg-white transition-colors">
                <Gift className="w-3.5 h-3.5" /> Indicar
              </a>
              <a href="#anunciar" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#ddd] bg-white/80 backdrop-blur-sm text-[13px] font-medium text-[#222] hover:bg-white transition-colors">
                <Rocket className="w-3.5 h-3.5" /> Anunciar
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── ABOUT ─── */
function SobreSection() {
  return (
    <section id="sobre" className="py-20 md:py-28">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[13px] font-semibold text-[#717171] uppercase tracking-widest mb-4">Sobre a finHouse</p>
            <h2 className="text-[32px] md:text-[40px] font-bold text-[#222] leading-tight tracking-[-0.02em]">
              Assessoria de elite para quem busca o melhor
            </h2>
            <p className="mt-6 text-[16px] text-[#717171] leading-[1.7]">
              A <strong className="text-[#222]">finHouse</strong> é uma <strong className="text-[#222] underline decoration-amber-400 decoration-2 underline-offset-4">casa de assessoria estratégica</strong> que conecta clientes exigentes aos melhores imóveis e soluções de crédito do mercado.
            </p>
            <p className="mt-4 text-[16px] text-[#717171] leading-[1.7]">
              Nossa equipe de especialistas e corretores parceiros garante uma jornada segura e eficiente: da escolha do imóvel à assinatura do financiamento como correspondente bancário oficial.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { icon: ShieldCheck, text: "Segurança Total" },
                { icon: LineChart, text: "Dados e IA" },
                { icon: Headset, text: "Suporte VIP" },
                { icon: Handshake, text: "Negociação" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#f0f0f0] group hover:border-[#222] transition-all hover:shadow-lg hover:shadow-black/5">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-[#222] transition-colors">
                    <item.icon className="w-5 h-5 text-[#222] group-hover:text-white transition-colors" strokeWidth={2.5} />
                  </div>
                  <span className="text-[14px] font-bold text-[#222]">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "120+", label: "Imóveis Exclusivos", dark: false },
              { value: "450+", label: "Clientes Atendidos", dark: true },
              { value: "R$ 150M+", label: "em Transações", dark: true },
              { value: "80+", label: "Parceiros Ativos", dark: false },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`${stat.dark ? "bg-[#222] text-white" : "bg-[#f7f7f7]"} rounded-3xl p-8 flex flex-col justify-center aspect-square`}
              >
                <span className={`text-[32px] md:text-[40px] font-bold tracking-tight ${stat.dark ? "" : "text-[#222]"}`}>
                  {stat.value}
                </span>
                <span className={`text-[13px] mt-1 ${stat.dark ? "text-white/60" : "text-[#717171]"}`}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── LISTINGS ─── */
function ImoveisSection({
  onSelectListing,
}: {
  onSelectListing: (listing: Listing) => void;
}) {
  const { listings } = useListings();
  const [filter, setFilter] = useState<"todos" | "venda" | "aluguel">("todos");
  const filtered = filter === "todos" ? listings : listings.filter((l) => l.type === filter);

  return (
    <section id="imoveis" className="py-20 md:py-28 bg-white">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[13px] font-semibold text-[#717171] uppercase tracking-widest mb-2">Nossos Imóveis</p>
            <h2 className="text-[32px] md:text-[40px] font-bold text-[#222] leading-tight tracking-[-0.02em]">
              Imóveis selecionados para você
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {(["todos", "venda", "aluguel"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all ${filter === f
                  ? "bg-[#222] text-white"
                  : "bg-[#f7f7f7] text-[#717171] hover:bg-[#ebebeb] hover:text-[#222]"
                  }`}
              >
                {f === "todos" ? "Todos" : f === "venda" ? "Venda" : "Aluguel"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((listing) => (
            <PropertyCard
              key={listing.id}
              listing={listing}
              onClick={() => onSelectListing(listing)}
            />
          ))}
        </div>

        <div className="text-center mt-14">
          <a
            href="/imoveis"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-[#222] text-white text-[15px] font-bold hover:bg-[#333] transition-all hover:shadow-xl hover:shadow-black/10 active:scale-[0.98]"
          >
            Ver todos os imóveis <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── REFERRAL ─── */
function IndicacaoSection() {
  return (
    <section id="indicacao" className="py-20 md:py-28 bg-[#f7f7f7]">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 px-4">
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="h-px w-10 bg-amber-400"></div>
            <span className="text-[11px] font-black text-[#222] uppercase tracking-[0.6em] translate-x-[0.3em]">
              Programa de Recompensa
            </span>
            <div className="h-px w-10 bg-amber-400"></div>
          </div>
          <h2 className="text-[36px] md:text-[52px] font-black text-[#222] leading-[1] tracking-[-0.04em] mb-8">
            Ganhe <span className="text-[#222] underline decoration-amber-400 decoration-4 underline-offset-8">1% de comissão</span> por cada indicação
          </h2>
          <p className="text-[18px] md:text-[20px] text-[#717171] leading-relaxed max-w-2xl mx-auto font-medium">
            Conhece alguém querendo vender ou comprar? Indique o imóvel e receba <span className="text-[#222] font-bold">1% do valor total da venda</span> direto na sua conta assim que o negócio fechar.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { step: "01", icon: Users, title: "Indique", description: "Envie os dados do proprietário ou do imóvel que está à venda via WhatsApp." },
            { step: "02", icon: Target, title: "Validamos", description: "Nosso time entra em contato para formalizar a parceria e o anúncio." },
            { step: "03", icon: BadgeDollarSign, title: "Receba", description: "Venda concluída? Você ganha 1% do valor total. Sem letras miúdas." },
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-[32px] p-10 border border-[#ebebeb] hover:border-amber-200 hover:shadow-2xl hover:shadow-amber-500/10 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-150 transition-transform duration-700">
                <item.icon className="w-24 h-24 text-[#222]" />
              </div>
              <div className="flex flex-col gap-6 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[#222] flex items-center justify-center shadow-lg shadow-black/20 group-hover:bg-white transition-colors border-2 border-transparent group-hover:border-[#222]">
                  <item.icon className="w-6 h-6 text-white group-hover:text-[#222] transition-colors" />
                </div>
                <div>
                  <h3 className="text-[20px] font-extrabold text-[#222] mb-3">{item.title}</h3>
                  <p className="text-[15px] text-[#717171] leading-relaxed font-medium">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href={`${WA}?text=${encodeURIComponent("Olá! Quero participar do Programa de Indicação da finHouse!")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#222] text-white text-[14px] font-semibold hover:bg-[#333] transition-colors"
          >
            Quero indicar <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── ANNOUNCE ─── */
function AnunciarSection() {
  return (
    <section id="anunciar" className="py-20 md:py-32 bg-white">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[4/3] md:aspect-video rounded-[48px] overflow-hidden shadow-2xl shadow-black/10 order-2 lg:order-1">
            <img
              src="/anunciar-hero.png"
              alt="Apartamento moderno pronto para anunciar"
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-10 left-10 right-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 font-bold text-[11px] text-[#222] uppercase tracking-widest mb-4">
                Rede de Elite
              </div>
              <h3 className="text-[24px] font-black text-white leading-tight">
                Anuncie grátis e venda com assessoria especializada.
              </h3>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#f7f7f7] flex items-center justify-center border border-[#ebebeb]">
                <Rocket className="w-6 h-6 text-[#222]" />
              </div>
              <span className="text-[14px] font-black text-[#222] uppercase tracking-widest">
                Anunciar Imóvel
              </span>
            </div>
            
            <h2 className="text-[36px] md:text-[52px] font-black text-[#222] leading-[1] tracking-[-0.04em] mb-8">
              Sua casa nos <span className="underline decoration-amber-400 decoration-4 underline-offset-8">maiores portais</span> sem custo fixo.
            </h2>
            
            <p className="text-[18px] text-[#717171] leading-relaxed mb-10 font-medium">
              Anunciamos seu imóvel gratuitamente na <span className="text-[#222] font-bold">finHouse</span> e nos principais portais (ZAP, VivaReal, OLX). 
              Assim que aparecerem interessados, um dos nossos <span className="text-[#222] font-bold">corretores de elite</span> entrará em contato para agendar visitas e fechar o negócio.
            </p>

            <ul className="space-y-4 mb-12">
              {[
                "Anúncio grátis nos maiores portais",
                "Financiamento bancário integrado para o comprador",
                "Assessoria jurídica completa no fechamento",
                "Filtro rigoroso de compradores interessados"
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-[16px] text-[#444] font-bold">
                  <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>

            <a
              href="/anunciar"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-[#222] text-white text-[16px] font-black uppercase hover:bg-[#333] transition-all hover:scale-105 active:scale-[0.98] shadow-xl shadow-black/10"
            >
              Quero Anunciar Grátis <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── PARTNERS ─── */
function ParceirosSection() {
  return (
    <section id="parceiros" className="py-24 md:py-32 bg-[#222] relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/[0.05] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-6 font-bold text-[11px] text-white/60 uppercase tracking-widest">
              HUB DE ASSESSORIA
            </div>
            <h2 className="text-[40px] md:text-[54px] font-black text-white leading-[1] tracking-[-0.04em] mb-8">
              Sua estrutura de elite, sem custo fixo
            </h2>
            <p className="text-[18px] text-white/60 leading-relaxed font-medium mb-10 max-w-lg">
              Oferecemos suporte jurídico total, emissão de contratos e as melhores taxas de financiamento. Não somos sua agência, somos seu braço direito de tecnologia e assessoria.
            </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/parceiros"
                  className="inline-flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-white text-[#222] text-[15px] font-extrabold hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/20"
                >
                  Seja um Parceiro <ArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="/login"
                  className="inline-flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-white/10 border border-white/20 text-white text-[15px] font-extrabold hover:bg-white/20 transition-all active:scale-95"
                >
                  Painel do Corretor
                </a>
                <div className="flex -space-x-3 items-center sm:ml-2 mt-4 sm:mt-0">
                {[
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop&crop=faces"
                ].map((url, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#222] overflow-hidden bg-gray-800">
                    <img src={url} alt="Parceiro" className="w-full h-full object-cover" />
                  </div>
                ))}
                <span className="ml-6 text-[13px] font-bold text-white/50">+80 corretores ativos</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Zap, title: "Comissões Prime", desc: "Pagamentos ultra-rápidos e as melhores taxas do mercado." },
              { icon: ShieldCheck, title: "Suporte 360°", desc: "Consultoria jurídica e operacional para blindar seus negócios." },
              { icon: Rocket, title: "Marketing Elite", desc: "Anúncios profissionais e tecnologia de ponta para converter mais." },
              { icon: LineChart, title: "Inteligência", desc: "Dashboard de gestão e dados exclusivos para tomada de decisão." },
            ].map((item) => (
              <div key={item.title} className="p-8 rounded-[32px] bg-white/[0.04] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white transition-colors">
                  <item.icon className="w-6 h-6 text-white/80 group-hover:text-[#222] transition-colors" strokeWidth={2.5} />
                </div>
                <h3 className="text-[18px] font-black text-white mb-2 tracking-tight">{item.title}</h3>
                <p className="text-[15px] text-white/40 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


/* ─── FINANCING ─── */
function FinanciamentoSection({ onSimulate }: { onSimulate: () => void }) {
  return (
    <section id="financiamento" className="py-20 md:py-28 bg-white">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-[13px] font-semibold text-[#717171] uppercase tracking-widest mb-4">Financiamento & Consórcio</p>
          <h2 className="text-[32px] md:text-[40px] font-bold text-[#222] leading-tight tracking-[-0.02em]">
            As melhores condições para realizar seu sonho
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div className="rounded-3xl border border-[#ebebeb] overflow-hidden hover:shadow-lg transition-all">
            <div className="p-8 md:p-10">
              <div className="w-12 h-12 rounded-2xl bg-[#222] flex items-center justify-center mb-6">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-[22px] font-bold text-[#222] mb-2">Financiamento Imobiliário</h3>
              <p className="text-[14px] text-[#717171] mb-6">Realize a compra com as melhores taxas.</p>
              <ul className="space-y-3 mb-8">
                {["Taxas a partir de 8,99% a.a.", "Até 35 anos para pagar", "Financie até 80% do valor", "Análise de crédito facilitada", "Caixa, Itaú, Bradesco, Santander", "Uso de FGTS"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[14px] text-[#222]">
                    <Check className="w-4 h-4 text-[#222] shrink-0 mt-0.5" /> {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={onSimulate}
                className="w-full py-3.5 rounded-full bg-[#222] text-white text-[14px] font-semibold hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" /> Simular Agora
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-[#ebebeb] overflow-hidden hover:shadow-lg transition-all">
            <div className="p-8 md:p-10">
              <div className="w-12 h-12 rounded-2xl bg-[#f7f7f7] flex items-center justify-center mb-6">
                <PiggyBank className="w-6 h-6 text-[#222]" />
              </div>
              <h3 className="text-[22px] font-bold text-[#222] mb-2">Consórcio Imobiliário</h3>
              <p className="text-[14px] text-[#717171] mb-6">Sem juros e sem entrada.</p>
              <ul className="space-y-3 mb-8">
                {["Sem juros — só taxa de administração", "Parcelas até 70% menores", "Cartas de R$ 100 mil a R$ 1 milhão", "Prazos de até 200 meses", "Lance embutido e lance livre", "Planejamento a médio prazo"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[14px] text-[#222]">
                    <Check className="w-4 h-4 text-[#717171] shrink-0 mt-0.5" /> {item}
                  </li>
                ))}
              </ul>
              <a
                href={`${WA}?text=${encodeURIComponent("Olá! Quero saber mais sobre consórcio imobiliário.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-full border border-[#222] text-[#222] text-[14px] font-semibold hover:bg-[#f7f7f7] transition-colors flex items-center justify-center gap-2"
              >
                Saiba Mais <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ─── APP ─── */
export default function HomeContent() {
  const { listings } = useListings();
  const searchParams = useSearchParams();
  const [simOpen, setSimOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Deep linking: open modal if id is in URL
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && listings.length > 0) {
      const l = listings.find(item => item.id === id);
      if (l) setSelectedListing(l);
    }
  }, [searchParams, listings]);

  return (
    <>
      <Header />
      <main>
        <HeroSection onSimulate={() => setSimOpen(true)} />
        <SobreSection />
        <ImoveisSection onSelectListing={(l) => setSelectedListing(l)} />
        <IndicacaoSection />
        <AnunciarSection />
        <ParceirosSection />
        <FinanciamentoSection onSimulate={() => setSimOpen(true)} />
      </main>
      <Footer />
      <WhatsAppFab />
      <SimulationModal open={simOpen} onOpenChange={setSimOpen} />
      {selectedListing && (
        <PropertyDetailModal
          listing={selectedListing}
          open={!!selectedListing}
          onClose={() => setSelectedListing(null)}
        />
      )}
    </>
  );
}
