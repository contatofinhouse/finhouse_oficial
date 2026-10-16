"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BnbHeader from "@/components/BnbHeader";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";
import {
  ArrowRight,
  MessageCircle,
  Building,
  Palmtree,
  Star,
  ChevronDown,
  Check,
  Building2,
  Waves,
  ShieldCheck,
  Camera,
  LineChart,
  Headphones,
  KeyRound,
  Sparkles,
  Wrench,
  Receipt,
  BarChart3,
  FileCheck2
} from "lucide-react";

const WA_NUMBER = "5511955842951";

export default function BnbPage() {
  // Estado para o Showcase do Hero (Copan vs Flats na Riviera)
  const [heroTab, setHeroTab] = useState<"copan" | "riviera">("copan");

  // Calculadora
  const [region, setRegion] = useState<"sp" | "litoral" | "outros">("sp");
  const [propertyType, setPropertyType] = useState<"studio" | "2d" | "3d">("studio");
  const [tradRent, setTradRent] = useState<number>(2600);

  // Formulário
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [linkOrDetails, setLinkOrDetails] = useState("");

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Parâmetros de projeção Short Stay
  const multMap = {
    sp: { studio: { adr: 275, occ: 0.78, mult: 1.48 }, "2d": { adr: 390, occ: 0.74, mult: 1.42 }, "3d": { adr: 580, occ: 0.70, mult: 1.38 } },
    litoral: { studio: { adr: 380, occ: 0.68, mult: 1.55 }, "2d": { adr: 540, occ: 0.72, mult: 1.58 }, "3d": { adr: 890, occ: 0.65, mult: 1.50 } },
    outros: { studio: { adr: 220, occ: 0.70, mult: 1.35 }, "2d": { adr: 330, occ: 0.68, mult: 1.32 }, "3d": { adr: 480, occ: 0.65, mult: 1.28 } },
  };

  const currentParams = multMap[region][propertyType];
  const shortStayBruto = Math.round(tradRent * currentParams.mult);
  const otaComissao = Math.round(shortStayBruto * 0.15); // ~15% Airbnb/Booking
  const repassePlataformas = shortStayBruto - otaComissao;
  const taxaFinhouse = Math.round(repassePlataformas * 0.12); // 12% da gestora finHouse
  const shortStayLiquidoProprietario = repassePlataformas - taxaFinhouse;

  // Aluguel tradicional líquido (considerando taxa imobiliária padrão de 10% e 1 mês de vacância anual)
  const tradLiquido = Math.round(tradRent * 0.90 * (11 / 12));
  const ganhoExtraMensal = shortStayLiquidoProprietario - tradLiquido;
  const ganhoExtraAnual = ganhoExtraMensal * 12;

  const handleSendWa = (e: React.FormEvent) => {
    e.preventDefault();
    const text = encodeURIComponent(
      `Olá, equipe finHouse! Gostaria de uma avaliação para o meu imóvel no modelo Short Stay (Airbnb/Booking).\n\nNome: ${name}\nTelefone: ${phone}\nCidade/Bairro: ${city}\nDetalhes/Link: ${linkOrDetails || "Não informado"}`
    );
    window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, "_blank");
  };

  const handleDirectSimulationWa = () => {
    const text = encodeURIComponent(
      `Olá! Simulei meu imóvel no site da finHouse:\nRegião: ${region.toUpperCase()}\nTipo: ${propertyType}\nAluguel Tradicional: R$ ${tradRent}\nProjeção Short Stay Líquido: R$ ${shortStayLiquidoProprietario}/mês líquido.\nQuero saber como começar a gestão com a taxa de 12%!`
    );
    window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1E293B] antialiased flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <BnbHeader />

      <main className="flex-1">
        {/* ─── 1. HERO SECTION (EDITORIAL, LIMPO, SOFISTICADO) ─── */}
        <section className="relative overflow-hidden bg-white border-b border-[#E2E8F0] pt-28 pb-16 md:pt-32 md:pb-24">
          <div className="max-w-[1240px] mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">
              {/* Coluna de Proposta de Valor */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Overline com o Mote Oficial finHouse */}
                <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0F3B78]">
                  finHouse · VENDE E ALUGA MELHOR · GESTÃO SHORT STAY
                </p>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.2rem] font-bold text-[#0F172A] leading-[1.14] tracking-tight">
                  Seu imóvel com renda de hotel e gestão completa por{" "}
                  <span className="text-[#0F3B78]">12% de taxa</span>.
                </h1>

                <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                  Cuidamos da fotografia profissional, precificação dinâmica, governança com padrão hoteleiro e suporte 24h aos hóspedes no Airbnb e Booking. Os repasses entram <strong>direto na sua conta bancária</strong>. Sem contratos travados de 30 meses.
                </p>

                {/* CTAs de ação com estilo nativo refinado */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                  <a
                    href="#calculadora"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#0F3B78] hover:bg-[#0A2752] text-white font-semibold text-[15px] shadow-sm hover:shadow transition-colors text-center"
                  >
                    Simular meu faturamento
                  </a>
                  <a
                    href="#contato"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] font-semibold text-[15px] transition-colors flex items-center justify-center gap-2"
                  >
                    Avaliação gratuita do imóvel
                    <ArrowRight className="w-4 h-4 text-[#64748B]" />
                  </a>
                </div>

                {/* Indicadores-chave com tipografia pura e dados reais */}
                <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-[#F1F5F9] max-w-xl mx-auto lg:mx-0">
                  <div>
                    <div className="text-2xl font-bold text-[#0F172A] tracking-tight">79,5%</div>
                    <div className="text-xs text-[#64748B] mt-0.5">Ocupação Copan SP</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#0F3B78] tracking-tight">12%</div>
                    <div className="text-xs text-[#64748B] mt-0.5">Taxa de gestão</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight flex items-center justify-center lg:justify-start gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                      4,92 / 5.0
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">Nota Superhost</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-700 tracking-tight">R$ 0</div>
                    <div className="text-xs text-[#64748B] mt-0.5">Adesão ou mensalidade</div>
                  </div>
                </div>
              </div>

              {/* Coluna Visual: Showcase Copan & Flats na Riviera */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-2xl overflow-hidden shadow-lg border border-[#E2E8F0] bg-white">
                  {/* Segmented Control refinado e minimalista integrado sobre a imagem */}
                  <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
                    <div className="inline-flex p-1 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/15 text-white">
                      <button
                        type="button"
                        onClick={() => setHeroTab("copan")}
                        className={`py-1.5 px-3.5 rounded-full text-xs font-semibold transition-all ${
                          heroTab === "copan"
                            ? "bg-white text-[#0F172A] shadow-sm"
                            : "text-white/80 hover:text-white"
                        }`}
                      >
                        Copan · SP
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeroTab("riviera")}
                        className={`py-1.5 px-3.5 rounded-full text-xs font-semibold transition-all ${
                          heroTab === "riviera"
                            ? "bg-white text-[#0F172A] shadow-sm"
                            : "text-white/80 hover:text-white"
                        }`}
                      >
                        Flats · Riviera
                      </button>
                    </div>

                    <span className="text-[11px] font-medium text-white/90 bg-slate-900/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 hidden sm:inline-block">
                      {heroTab === "copan" ? "Urbano" : "Litoral"}
                    </span>
                  </div>

                  {/* Imagem do Imóvel Selecionado */}
                  {heroTab === "copan" ? (
                    <div className="relative h-[380px] sm:h-[440px] w-full">
                      <Image
                        src="/bnb/copan.jpg"
                        alt="Apartamento no Edifício Copan em São Paulo gerenciado pela finHouse"
                        fill
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/30 to-transparent" />

                      <div className="absolute bottom-5 left-5 right-5 text-white space-y-2">
                        <div className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                          Classificação 4,92 / 5.0 · Superhost nas plataformas
                        </div>
                        <h2 className="text-xl font-bold leading-snug">
                          Edifício Copan · República
                        </h2>
                        <div className="flex items-center justify-between pt-2 border-t border-white/15 text-xs text-white/85">
                          <span>Ocupação: <strong className="text-white">79,5%</strong></span>
                          <span>Diária média: <strong className="text-white">R$ 265</strong></span>
                          <span>Giro: <strong className="text-white">~8 check-ins/mês</strong></span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-[380px] sm:h-[440px] w-full">
                      <Image
                        src="/bnb/riviera.jpg"
                        alt="Flats na Riviera de São Lourenço gerenciados pela finHouse"
                        fill
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/30 to-transparent" />

                      <div className="absolute bottom-5 left-5 right-5 text-white space-y-2">
                        <div className="text-xs font-medium text-blue-200 flex items-center gap-1.5">
                          <Waves className="w-3.5 h-3.5 text-blue-300" />
                          Condomínio resort a passos da praia com piscina climatizada
                        </div>
                        <h2 className="text-xl font-bold leading-snug">
                          Flats de Alto Padrão · Riviera
                        </h2>
                        <div className="flex items-center justify-between pt-2 border-t border-white/15 text-xs text-white/85">
                          <span>Ocupação anual: <strong className="text-white">74–78%</strong></span>
                          <span>Alta temporada: <strong className="text-white">R$ 890 a R$ 1.200</strong></span>
                          <span>Faturamento: <strong className="text-white">R$ 156k+/ano</strong></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card de Economia de Taxa limpo e sóbrio */}
                <div className="mt-3.5 p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#0F172A]">Taxa de gestão finHouse: 12%</span>
                    <span className="text-[#64748B] block text-[11px]">Mercado tradicional cobra 15% a 20%</span>
                  </div>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                    20% a 40% menor
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2. CALCULADORA INTERATIVA DE RENTABILIDADE ─── */}
        <section id="calculadora" className="py-20 bg-[#F8FAFC] border-b border-[#E2E8F0] scroll-mt-20">
          <div className="max-w-[1100px] mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-12 space-y-2">
              <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0F3B78]">
                Simulador Dinâmico
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
                Quanto o seu imóvel pode render a mais?
              </h2>
              <p className="text-sm sm:text-base text-[#64748B]">
                Compare o modelo de locação tradicional com o Short Stay administrado pela finHouse com a taxa de 12%.
              </p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-10 shadow-sm grid lg:grid-cols-12 gap-8 items-start">
              {/* Controles da calculadora */}
              <div className="lg:col-span-7 space-y-7">
                {/* 1. Região */}
                <div>
                  <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2.5">
                    1. Localização do Imóvel
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: "sp", label: "São Paulo", sub: "Capital / Urbano" },
                      { id: "litoral", label: "Litoral", sub: "Riviera / Praia" },
                      { id: "outros", label: "Outras", sub: "Interior / Cidades" },
                    ].map((item) => {
                      const active = region === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRegion(item.id as any)}
                          className={`p-3.5 rounded-xl border text-left transition-colors flex flex-col justify-between h-20 ${
                            active
                              ? "border-[#0F3B78] bg-blue-50/40 text-[#0F172A]"
                              : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1] text-[#475569]"
                          }`}
                        >
                          <div className="text-sm font-semibold text-[#0F172A]">{item.label}</div>
                          <div className="text-[11px] text-[#64748B]">{item.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Tipologia */}
                <div>
                  <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2.5">
                    2. Perfil do Imóvel
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: "studio", label: "Studio / 1 Dorm", desc: "Até 40 m²" },
                      { id: "2d", label: "2 Dormitórios", desc: "40 a 70 m²" },
                      { id: "3d", label: "3+ Dormitórios", desc: "70+ m² ou Lazer" },
                    ].map((item) => {
                      const active = propertyType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPropertyType(item.id as any)}
                          className={`p-3.5 rounded-xl border text-center transition-colors ${
                            active
                              ? "border-[#0F3B78] bg-blue-50/40 text-[#0F172A]"
                              : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1] text-[#475569]"
                          }`}
                        >
                          <div className="text-sm font-semibold text-[#0F172A]">{item.label}</div>
                          <div className="text-[11px] text-[#64748B]">{item.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Slider de Aluguel Tradicional */}
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <label htmlFor="slider-aluguel-tradicional" className="text-xs font-semibold text-[#475569] uppercase tracking-wider">
                      3. Aluguel Tradicional de Mercado
                    </label>
                    <span className="text-lg font-bold text-[#0F172A]">
                      R$ {tradRent.toLocaleString("pt-BR")}/mês
                    </span>
                  </div>
                  <input
                    id="slider-aluguel-tradicional"
                    type="range"
                    min={1200}
                    max={15000}
                    step={100}
                    value={tradRent}
                    onChange={(e) => setTradRent(Number(e.target.value))}
                    className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F3B78]"
                  />
                  <div className="flex justify-between text-[11px] text-[#94A3B8] font-medium mt-1">
                    <span>R$ 1.200</span>
                    <span>R$ 5.000</span>
                    <span>R$ 10.000</span>
                    <span>R$ 15.000+</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-2">
                    *Valor típico cobrado no contrato comum de 30 meses para imóveis similares na mesma região.
                  </p>
                </div>
              </div>

              {/* Resultado comparativo */}
              <div className="lg:col-span-5 bg-[#FAFAFA] border border-[#E2E8F0] rounded-xl p-6 space-y-6">
                <div className="border-b border-[#E2E8F0] pb-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Resultado Mensal Estimado
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-emerald-700 tracking-tight">
                      R$ {shortStayLiquidoProprietario.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-xs text-[#64748B] font-medium">/mês líquido</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    Já deduzida a comissão das plataformas e a taxa finHouse de 12%.
                  </p>
                </div>

                {/* Comparativo lado a lado */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs py-2.5 px-3 rounded-lg bg-white border border-[#E2E8F0]">
                    <span className="text-[#64748B]">Aluguel Tradicional (Líquido est.)</span>
                    <span className="font-semibold text-[#0F172A]">R$ {tradLiquido.toLocaleString("pt-BR")}/mês</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2.5 px-3 rounded-lg bg-blue-50/60 border border-blue-100 text-[#0F172A]">
                    <span className="font-medium">Short Stay finHouse (Líquido)</span>
                    <span className="font-bold text-[#0F3B78]">R$ {shortStayLiquidoProprietario.toLocaleString("pt-BR")}/mês</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2.5 px-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900">
                    <span className="font-semibold text-emerald-800">Ganho Adicional</span>
                    <span className="font-bold text-emerald-700">+ R$ {ganhoExtraMensal.toLocaleString("pt-BR")}/mês</span>
                  </div>
                </div>

                {/* Destaque anual */}
                <div className="p-4 rounded-xl bg-white border border-emerald-200 text-center space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                    Rendimento Extra no Ano
                  </div>
                  <div className="text-2xl font-bold text-emerald-700">
                    + R$ {ganhoExtraAnual.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Receita adicional estimada em relação à locação comum.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDirectSimulationWa}
                  className="w-full py-3.5 px-4 rounded-full bg-[#0F3B78] hover:bg-[#0A2752] text-white font-semibold text-sm transition-colors text-center shadow-sm"
                >
                  Quero este faturamento no meu imóvel
                </button>
                <div className="pt-2 text-[11px] text-[#0F3B78] font-medium bg-blue-50/70 p-3 rounded-xl border border-blue-100 flex items-start gap-2 leading-relaxed">
                  <span className="shrink-0 text-sm">📊</span>
                  <span><strong>Base Histórica bnbmanager:</strong> Projeções calibradas com o histórico auditado de 3 anos de operação real da finHouse no Edifício Copan (SP) e na Riviera de São Lourenço.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. QUADRO COMPARATIVO CONCISO (FINHOUSE VS. OUTROS VS. ADMINISTRAÇÃO PRÓPRIA) ─── */}
        <section id="comparativo" className="py-20 bg-white border-b border-[#E2E8F0] scroll-mt-20">
          <div className="max-w-[1050px] mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-10 space-y-2">
              <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0F3B78]">
                Comparativo Direto
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
                finHouse vs. Outros Administradores vs. Administrar Sozinho
              </h2>
              <p className="text-sm sm:text-base text-[#64748B]">
                Mais receita líquida no bolso com zero dor de cabeça operacional.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#FAFAFA]">
                    <th className="py-3 px-5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Pilar</th>
                    <th className="py-3 px-5 text-xs font-bold text-[#0F3B78] uppercase tracking-wider bg-blue-50/50 border-x border-blue-100">
                      finHouse (Gestão 12%)
                    </th>
                    <th className="py-3 px-5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Outros Administradores
                    </th>
                    <th className="py-3 px-5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Administrar Sozinho
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-xs sm:text-sm">
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#0F172A]">Taxa de Gestão</td>
                    <td className="py-3 px-5 font-bold text-[#0F3B78] bg-blue-50/20 border-x border-blue-100">
                      12% fixo das diárias
                    </td>
                    <td className="py-3 px-5 text-[#475569]">15% a 25% + taxas extras</td>
                    <td className="py-3 px-5 text-[#475569]">0% (perde em vacância)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#0F172A]">Recebimento</td>
                    <td className="py-3 px-5 font-semibold text-emerald-800 bg-blue-50/20 border-x border-blue-100">
                      Split (Airbnb) ou Repasse Mensal (Booking)
                    </td>
                    <td className="py-3 px-5 text-[#475569]">Repasse retido por 30 a 45 dias</td>
                    <td className="py-3 px-5 text-[#475569]">Recebe e concilia na mão</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#0F172A]">Trabalho do Dono</td>
                    <td className="py-3 px-5 font-semibold text-emerald-800 bg-blue-50/20 border-x border-blue-100">
                      Zero (100% passivo)
                    </td>
                    <td className="py-3 px-5 text-[#475569]">2h a 5h/mês (aprovações)</td>
                    <td className="py-3 px-5 text-[#475569]">15h a 25h/semana (estresse 24/7)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#0F172A]">Relatório & DRE</td>
                    <td className="py-3 px-5 font-semibold text-[#0F3B78] bg-blue-50/20 border-x border-blue-100">
                      Portal web em tempo real + DRE completa
                    </td>
                    <td className="py-3 px-5 text-[#475569]">PDF estático mensal</td>
                    <td className="py-3 px-5 text-[#475569]">Planilhas manuais na mão</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#0F172A]">Precificação & Canais</td>
                    <td className="py-3 px-5 font-semibold text-[#0F3B78] bg-blue-50/20 border-x border-blue-100">
                      Multicanal (Superhost/Genius) + Algoritmo diário
                    </td>
                    <td className="py-3 px-5 text-[#475569]">1 canal + tabela estática</td>
                    <td className="py-3 px-5 text-[#475569]">Preço intuitivo + risco overbooking</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#0F172A]">Ocupação Comprovada</td>
                    <td className="py-3 px-5 font-bold text-emerald-700 bg-blue-50/20 border-x border-blue-100">
                      74% a 80% (Copan e Riviera)
                    </td>
                    <td className="py-3 px-5 text-[#475569]">60% a 68% média mercado</td>
                    <td className="py-3 px-5 text-[#475569]">45% a 55% (dias úteis ociosos)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E2E8F0] flex items-center justify-between flex-wrap gap-4 text-xs">
              <div>
                <span className="font-semibold text-[#0F172A]">Mais lucro líquido no bolso:</span>
                <span className="text-[#64748B] ml-1">
                  Com taxa de 12% e ocupação até 30% maior que a média, seu rendimento líquido supera tanto administrar sozinho quanto gestoras tradicionais.*
                </span>
              </div>
              <a
                href="#contato"
                className="px-4 py-2 rounded-full bg-[#0F3B78] hover:bg-[#0A2752] text-white font-semibold transition-colors"
              >
                Avaliar meu imóvel
              </a>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-[#64748B] text-center">
              *Projeção estimada com base no histórico real dos imóveis geridos e benchmarks do mercado local. A rentabilidade real pode variar conforme localização, decoração, sazonalidade e condições de mercado.
            </div>
          </div>
        </section>

        {/* ─── NOVA SEÇÃO: PORTAL DO PROPRIETÁRIO & RELATÓRIOS EM TEMPO REAL COM LINK WEB ─── */}
        <section id="relatorio" className="py-20 bg-[#F8FAFC] border-b border-[#E2E8F0] scroll-mt-20">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-12 space-y-2">
              <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0F3B78]">
                Diferencial Exclusivo · Transparência em Tempo Real
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
                Seu imóvel acompanhado como um fundo imobiliário
              </h2>
              <p className="text-sm sm:text-base text-[#64748B]">
                Chega de relatórios atrasados em PDF ou mensagens perdidas. Você tem acesso a um link web exclusivo para acompanhar reservas, diárias, custos e DRE mês a mês.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-center">
              {/* Imagem do Report / Dashboard */}
              <div className="lg:col-span-7">
                <div className="relative rounded-2xl overflow-hidden shadow-xl border border-[#CBD5E1] bg-white group">
                  <Image
                    src="/bnb/dashboard-report.png"
                    alt="Portal do Proprietário finHouse com DRE e extrato em tempo real"
                    width={1260}
                    height={860}
                    className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-500"
                  />
                  <div className="p-3 bg-white border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Portal Web Seguro · link exclusivo para cada proprietário
                    </span>
                    <span className="font-semibold text-[#0F3B78]">DRE & Extrato em Tempo Real</span>
                  </div>
                </div>
              </div>

              {/* Pilares do Relatório */}
              <div className="lg:col-span-5 space-y-3.5">
                <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-1">
                  <div className="text-[11px] font-mono font-bold text-[#0F3B78]">01 · LINK WEB EXCLUSIVO</div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">Acesso no Celular e Computador</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Você não precisa pedir relatórios nem esperar o fim do mês. Basta abrir seu link protegido para ver as reservas que acabaram de entrar e o extrato diário.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-1">
                  <div className="text-[11px] font-mono font-bold text-[#0F3B78]">02 · DRE CONTÁBIL COMPLETA</div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">Abertura de Receitas por Canal</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Visualização analítica de cada diária vendida no Airbnb, Booking e Direto, com comissões de canais e a taxa de 12% da finHouse demonstradas sem pegadinhas.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-1">
                  <div className="text-[11px] font-mono font-bold text-[#0F3B78]">03 · COMPROVANTES & NOTAS</div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">Transparência Total de Despesas</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Cada pequeno reparo ou despesa autorizada conta com recibo e histórico auditado. Zero surpresas no repasse financeiro.
                  </p>
                </div>

                <div className="pt-1">
                  <a
                    href="#contato"
                    className="w-full py-3.5 px-5 rounded-full bg-[#0F3B78] hover:bg-[#0A2752] text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    Quero gerir meu imóvel com essa transparência
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="/bnb/FINHOUSE_Resumo_Proprietarios.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-5 rounded-full bg-white hover:bg-[#F1F5F9] text-[#0F3B78] border border-[#CBD5E1] text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    Baixar Resumo para Proprietários (PDF)
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. ESCOPO DA ADMINISTRAÇÃO (SERVIÇO COMPLETO) ─── */}
        <section id="escopo" className="py-20 bg-[#FAFAFA] border-b border-[#E2E8F0] scroll-mt-20">
          <div className="max-w-[1100px] mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-14 space-y-2">
              <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0F3B78]">
                Escopo dos 12%
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
                Tudo o que está incluído na gestão
              </h2>
              <p className="text-sm sm:text-base text-[#64748B]">
                Você permanece com a propriedade e o lucro líquido. A finHouse assume o trabalho operacional e a reputação do anúncio.
              </p>
            </div>

            {/* Grid editorial limpo: sem quadradinhos de ícones artificiais */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  number: "01",
                  title: "Fotografia & Anúncios",
                  desc: "Ensaio fotográfico profissional com enquadramento estratégico para conversão, copy multilíngue e indexação no topo das buscas do Airbnb e Booking.",
                },
                {
                  number: "02",
                  title: "Precificação Dinâmica",
                  desc: "Ajuste diário do valor das diárias com algoritmos que monitoram procura, clima, feriados e ocupação regional para maximizar sua receita por noite.",
                },
                {
                  number: "03",
                  title: "Atendimento aos Hóspedes 24/7",
                  desc: "Tempo de resposta inferior a 15 minutos. Resolução de dúvidas, envio de instruções de check-in, suporte durante a estadia e pós-venda.",
                },
                {
                  number: "04",
                  title: "Check-in & Segurança Condominial",
                  desc: "Fechaduras eletrônicas com senhas temporárias. Envio antecipado de RG e foto dos hóspedes para condomínios rígidos com controle de portaria.",
                },
                {
                  number: "05",
                  title: "Governança Hoteleira",
                  desc: "Coordenação da equipe de limpeza especializada, conferência minuciosa de enxoval de cama/banho e reposição de amenities para nota 5 estrelas.",
                },
                {
                  number: "06",
                  title: "Vistoria de Zelo & Padrão 5 Estrelas",
                  desc: "Inspeção minuciosa a cada check-out para assegurar que cada item permaneça impecável, preservando o valor e o padrão do seu patrimônio.",
                },
                {
                  number: "07",
                  title: "Split Direto na Sua Conta",
                  desc: "O Airbnb transfere 88% das diárias direto para sua conta bancária em até 48h pós-check-in. Você é co-anfitrião com visibilidade de cada reserva.",
                },
                {
                  number: "08",
                  title: "Relatório Financeiro & DRE",
                  desc: "Extrato consolidado mensal com ocupação, receita bruta, taxas e rentabilidade anual calculada sobre o valor do patrimônio.",
                },
                {
                  number: "09",
                  title: "Segurança & Preservação Patrimonial",
                  desc: "Triagem rigorosa de hóspedes por documento oficial com foto, envio prévio para a portaria e respeito integral ao regulamento do condomínio.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-xl bg-white border border-[#E2E8F0] space-y-3 hover:border-[#CBD5E1] transition-colors"
                >
                  <div className="text-xs font-mono font-semibold text-[#0F3B78]">
                    {item.number}
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A]">{item.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 5. CASOS REAIS: COPAN & FLATS NA RIVIERA ─── */}
        <section id="cases" className="py-20 bg-white border-b border-[#E2E8F0] scroll-mt-20">
          <div className="max-w-[1100px] mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-14 space-y-2">
              <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0F3B78]">
                Histórico Comprovado
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
                Resultados consolidados em carteira
              </h2>
              <p className="text-sm sm:text-base text-[#64748B]">
                Métricas auditadas de unidades geridas pela finHouse em São Paulo e no litoral paulista.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Case 1: Copan */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                <div className="relative h-60 w-full">
                  <Image src="/bnb/copan.jpg" alt="Edifício Copan São Paulo" fill className="object-cover" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-[#0F172A]">
                    República · São Paulo Capital
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A]">Edifício Copan · Estúdios & 1 Dorm</h3>
                    <p className="text-xs text-[#64748B]">Arquitetura icônica com alta demanda corporativa e turística</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[#F1F5F9] text-center">
                    <div className="p-2.5 rounded-lg bg-[#FAFAFA]">
                      <div className="text-lg font-bold text-[#0F172A]">79,5%</div>
                      <div className="text-[10px] uppercase font-semibold text-[#94A3B8]">Ocupação 2026</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FAFAFA]">
                      <div className="text-lg font-bold text-[#0F172A]">R$ 265</div>
                      <div className="text-[10px] uppercase font-semibold text-[#94A3B8]">Diária Média</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FAFAFA]">
                      <div className="text-base sm:text-lg font-bold text-emerald-700">4,92 / 5.0</div>
                      <div className="text-[10px] uppercase font-semibold text-[#94A3B8]">Superhost</div>
                    </div>
                  </div>

                  <p className="text-xs text-[#475569] leading-relaxed pt-1">
                    Enquanto a média da região da República opera com 61% de ocupação (AirDNA), nossa precificação dinâmica mantém o calendário com quase 80% de ocupação contínua o ano todo.
                  </p>
                </div>
              </div>

              {/* Case 2: Riviera de São Lourenço */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                <div className="relative h-60 w-full">
                  <Image src="/bnb/riviera.jpg" alt="Flats na Riviera de São Lourenço" fill className="object-cover" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-[#0F172A]">
                    Riviera de São Lourenço · Bertioga
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A]">Flats de Alto Padrão · Riviera</h3>
                    <p className="text-xs text-[#64748B]">Apartamentos resort com piscina climatizada a passos da praia</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[#F1F5F9] text-center">
                    <div className="p-2.5 rounded-lg bg-[#FAFAFA]">
                      <div className="text-lg font-bold text-[#0F172A]">74–78%</div>
                      <div className="text-[10px] uppercase font-semibold text-[#94A3B8]">Ocupação Anual</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FAFAFA]">
                      <div className="text-lg font-bold text-[#0F172A]">R$ 550</div>
                      <div className="text-[10px] uppercase font-semibold text-[#94A3B8]">Diária Média</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FAFAFA]">
                      <div className="text-lg font-bold text-emerald-700">R$ 156k</div>
                      <div className="text-[10px] uppercase font-semibold text-[#94A3B8]">Faturamento/ano</div>
                    </div>
                  </div>

                  <p className="text-xs text-[#475569] leading-relaxed pt-1">
                    Precificação sazonal inteligente: diárias de R$ 890 a R$ 1.200 em janeiro e feriados prolongados combinadas com forte giro nos finais de semana do inverno paulista, superando de longe a média regional de 46%.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 6. COMO FUNCIONA (PASSO A PASSO OBJETIVO) ─── */}
        <section id="como-funciona" className="py-20 bg-[#FAFAFA] border-b border-[#E2E8F0] scroll-mt-20">
          <div className="max-w-[1100px] mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-14 space-y-2">
              <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0F3B78]">
                Como Funciona
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
                Seu imóvel operando em 4 etapas
              </h2>
              <p className="text-sm sm:text-base text-[#64748B]">
                Cuidamos de toda a configuração técnica. Você apenas acompanha os repasses entrarem no seu extrato.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "Avaliação do Imóvel",
                  desc: "Analisamos vocação, estimativa de diária média e projeção de receita com base no histórico regional de demanda.",
                },
                {
                  step: "02",
                  title: "Fotos & Fechadura",
                  desc: "Orientamos os ajustes necessários de enxoval, instalamos a fechadura digital e realizamos o ensaio fotográfico.",
                },
                {
                  step: "03",
                  title: "Publicação & Split",
                  desc: "Cadastramos o anúncio na conta Superhost e configuramos sua conta bancária como co-anfitrião para repasses diretos.",
                },
                {
                  step: "04",
                  title: "Operação & Renda",
                  desc: "Nossa equipe assume atendimento, limpeza e manutenção. Você recebe os repasses em até 48h de cada check-in.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-xl bg-white border border-[#E2E8F0] space-y-2.5"
                >
                  <div className="text-2xl font-bold text-[#0F3B78] tracking-tight">
                    {item.step}
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A]">{item.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 7. FAQ DE DÚVIDAS COMUNS ─── */}
        <section id="faq" className="py-20 bg-white border-b border-[#E2E8F0] scroll-mt-20">
          <div className="max-w-[850px] mx-auto px-6">
            <div className="max-w-xl mx-auto text-center mb-12 space-y-2">
              <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0F3B78]">
                Dúvidas Frequentes
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
                Perguntas Frequentes de Proprietários
              </h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: "Como e quando eu recebo o valor dos aluguéis?",
                  a: "No Airbnb, o recebimento é feito via split automático: 88% do valor líquido das diárias é depositado pela própria plataforma diretamente na sua conta bancária em até 48h após o check-in de cada hóspede. No Booking.com e em reservas diretas, os valores são consolidados e enviados via repasse mensal acompanhado da DRE detalhada no início do mês seguinte. Total transparência e controle contábil.",
                },
                {
                  q: "Quem paga a taxa de limpeza e lavanderia?",
                  a: "A taxa de limpeza é paga 100% pelo hóspede no momento da reserva. O proprietário não paga nada pela faxina. Esse valor é repassado integralmente à nossa equipe de governança e lavanderia parceira para garantir que o apartamento seja entregue impecável e higienizado a cada nova entrada.",
                },
                {
                  q: "Quem paga o condomínio, energia e IPTU?",
                  a: "As contas fixas do imóvel (condomínio, IPTU, conta de luz e internet) continuam sendo de titularidade e responsabilidade do proprietário. Nosso serviço é focado em maximizar o faturamento das diárias para que, mesmo após todas as contas fixas, seu lucro líquido supere o de um aluguel tradicional.",
                },
                {
                  q: "Como fica a segurança do condomínio e barulho de hóspedes?",
                  a: "Exigimos cadastro com documento oficial com foto de todos os hóspedes antes do check-in e enviamos a lista para a portaria/administração do condomínio com antecedência. Configuramos regras rígidas na plataforma (proibido festas, proibido fumar, limite estrito de ocupantes) e filtramos apenas perfis com boas avaliações anteriores. Em caso de qualquer desvio de conduta, nossa equipe atua de imediato.",
                },
                {
                  q: "Qual o prazo do contrato? Existe fidelidade de 30 meses?",
                  a: "Não! Essa é uma das maiores vantagens do Short Stay em relação à locação tradicional de 30 meses da Lei do Inquilinato. Você pode rescindir o contrato quando quiser, sem multas rescisórias, sendo necessário apenas honrar as reservas já confirmadas e pagas por hóspedes futuros (trabalhamos por padrão com uma janela de reservas de até 90 dias).",
                },
                {
                  q: "Posso usar o meu imóvel para as minhas próprias férias?",
                  a: "Sim! Como o imóvel é seu, basta nos avisar com antecedência para bloquearmos as datas desejadas no calendário antes que outros hóspedes reservem. Você aproveita seu patrimônio quando quiser.",
                },
                {
                  q: "O que acontece se um hóspede quebrar alguma coisa?",
                  a: "Todos os anúncios contam com a proteção AirCover do Airbnb (cobertura contra danos de até US$ 3 milhões) e caução de segurança. Nossa equipe realiza vistoria com fotos no check-out; se for identificado qualquer dano, abrimos a ocorrência imediatamente para obter o reembolso integral sem prejuízo ao proprietário.",
                },
                {
                  q: "Meu apartamento não está decorado. Vocês ajudam?",
                  a: "Sim! A finHouse oferece consultoria de ambientação e enxoval básico focada em custo-benefício e alto impacto visual fotográfico. Indicamos itens acessíveis que aumentam o valor da sua diária média imediatamente.",
                },
              ].map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#E2E8F0] overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 text-left font-semibold text-[#0F172A] flex items-center justify-between gap-4 hover:bg-[#FAFAFA] transition-colors"
                    >
                      <span className="text-sm sm:text-base">{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#0F3B78]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-[#475569] leading-relaxed border-t border-[#F1F5F9] pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── 8. FORMULÁRIO DE CONTATO (LIMPO E SÓBRIO) ─── */}
        <section id="contato" className="py-20 bg-[#F8FAFC] scroll-mt-20">
          <div className="max-w-[900px] mx-auto px-6">
            <div className="bg-white rounded-2xl p-8 sm:p-10 border border-[#E2E8F0] shadow-sm">
              <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 space-y-4">
                  <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0F3B78]">
                    Atendimento Direto
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight leading-tight">
                    Avalie o potencial de receita do seu imóvel
                  </h2>
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                    Envie os dados básicos do seu imóvel. Calculamos a estimativa de faturamento com base no histórico de reservas da região e retornamos sem compromisso.
                  </p>

                  <div className="pt-2 space-y-2 text-xs text-[#475569]">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Sem taxa de adesão ou custo de setup</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Taxa de administração fixa de 12%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Fotografia profissional inclusa</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-[#FAFAFA] border border-[#E2E8F0] rounded-xl p-6 space-y-4">
                  <form onSubmit={handleSendWa} className="space-y-3.5">
                    <div>
                      <label htmlFor="input-nome" className="block text-[11px] font-semibold uppercase tracking-wider text-[#475569] mb-1">
                        Seu Nome Completo
                      </label>
                      <input
                        id="input-nome"
                        type="text"
                        required
                        placeholder="Ex: Rafael Souza"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs focus:outline-none focus:border-[#0F3B78] focus:ring-1 focus:ring-[#0F3B78]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label htmlFor="input-whatsapp" className="block text-[11px] font-semibold uppercase tracking-wider text-[#475569] mb-1">
                          WhatsApp
                        </label>
                        <input
                          id="input-whatsapp"
                          type="tel"
                          required
                          placeholder="(11) 99999-9999"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs focus:outline-none focus:border-[#0F3B78] focus:ring-1 focus:ring-[#0F3B78]"
                        />
                      </div>
                      <div>
                        <label htmlFor="input-cidade" className="block text-[11px] font-semibold uppercase tracking-wider text-[#475569] mb-1">
                          Bairro / Cidade
                        </label>
                        <input
                          id="input-cidade"
                          type="text"
                          required
                          placeholder="Ex: República SP / Riviera"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs focus:outline-none focus:border-[#0F3B78] focus:ring-1 focus:ring-[#0F3B78]"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="input-link" className="block text-[11px] font-semibold uppercase tracking-wider text-[#475569] mb-1">
                        Link ou Características do Imóvel (Opcional)
                      </label>
                      <input
                        id="input-link"
                        type="text"
                        placeholder="Ex: Studio 35m² no Copan mobiliado"
                        value={linkOrDetails}
                        onChange={(e) => setLinkOrDetails(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-white text-xs focus:outline-none focus:border-[#0F3B78] focus:ring-1 focus:ring-[#0F3B78]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 rounded-full bg-[#0F3B78] hover:bg-[#0A2752] text-white font-semibold text-sm transition-colors text-center shadow-sm"
                    >
                      Enviar dados via WhatsApp
                    </button>
                    <p className="text-[10px] text-center text-[#94A3B8]">
                      🔒 Contato direto com a equipe finHouse. Seus dados estão seguros.
                    </p>
                  </form>
                </div>
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
