"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Printer,
  Share2,
  ExternalLink,
  FileText,
  Check,
  Columns3,
  Plus,
  Minus,
} from "lucide-react";
import { ScrapedAuctionLot, isLotInSecondPraca } from "@/lib/leiloes-utils";
import type { MarketValuationResult } from "@/app/api/leiloes/dossie/route";
import {
  buildDefaultLegalMatrix,
  LegalMatrixItem,
  ReformaLevel,
  REFORMA_SP_TABLE,
  simulateAuctionDeal,
  TrafficLight,
} from "@/lib/leiloes/financials";

interface DossierFullViewProps {
  lot: ScrapedAuctionLot;
  verdict: {
    status: TrafficLight;
    score: number;
    headline: string;
    executiveSummary: string;
  };
  marketValuation?: MarketValuationResult;
  legalMatrix: LegalMatrixItem[];
  documentsRead: { label: string; url: string }[];
  usedAiModel: string;
  cached?: boolean;
  readOnlyShare?: boolean;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function formatLotLocation(lot: ScrapedAuctionLot): string {
  const addr = (lot.address || "").trim();
  const neigh = (lot.neighborhood || "").trim();
  const cityState = [lot.city, lot.state].filter(Boolean).join("/");

  const parts: string[] = [];
  if (addr) parts.push(addr);

  const addrLower = addr.toLowerCase();
  if (neigh && !addrLower.includes(neigh.toLowerCase())) {
    parts.push(neigh);
  }

  const combinedLower = parts.join(" ").toLowerCase();
  if (lot.city && !combinedLower.includes(lot.city.toLowerCase())) {
    parts.push(cityState);
  } else if (parts.length === 0 && cityState) {
    parts.push(cityState);
  }

  return parts.join(" · ");
}

export default function DossierFullView({
  lot,
  verdict,
  marketValuation,
  legalMatrix,
  documentsRead,
  usedAiModel,
  readOnlyShare = false,
}: DossierFullViewProps) {
  const initialSim = useMemo(() => simulateAuctionDeal(lot), [lot]);

  const hasWebComparables =
    marketValuation?.confidence === "Comparáveis Web" &&
    marketValuation.estimatedMarketPrice > 0;

  const isEditalDistorted = Math.abs(initialSim.editalVsBenchmarkPct) > 25;

  const [customMarketValue, setCustomMarketValue] = useState<number>(
    hasWebComparables
      ? marketValuation.estimatedMarketPrice
      : isEditalDistorted
      ? initialSim.benchmarkTotalValue
      : initialSim.editalMarketValue
  );
  const [marketSourceMode, setMarketSourceMode] = useState<
    "web" | "benchmark" | "edital" | "manual"
  >(
    hasWebComparables
      ? "web"
      : isEditalDistorted
      ? "benchmark"
      : "edital"
  );

  const [simulatedBid, setSimulatedBid] = useState<number>(lot.minBid);
  const [imgError, setImgError] = useState(false);
  const showLotImage = Boolean(lot.imageUrl) && !imgError;
  const [reformaLevel, setReformaLevel] = useState<ReformaLevel>(
    initialSim.propertyCategory === "Terreno"
      ? 0
      : initialSim.effectiveOccupancy === "Desocupado"
      ? 1
      : 2
  );
  const [holdingMonths, setHoldingMonths] = useState<number>(
    initialSim.effectiveOccupancy === "Desocupado" ? 6 : 9
  );
  const [targetMarginPct, setTargetMarginPct] = useState<number>(18);
  const [shareCopied, setShareCopied] = useState(false);
  const [showBenchmarkCriteria, setShowBenchmarkCriteria] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {}
  );

  const sim = useMemo(
    () =>
      simulateAuctionDeal(lot, {
        simulatedBid,
        reformaLevel,
        holdingMonths,
        targetMarginPct,
        customMarketValue,
      }),
    [
      lot,
      simulatedBid,
      reformaLevel,
      holdingMonths,
      targetMarginPct,
      customMarketValue,
    ]
  );

  // Garante que mesmo dossiês em cache antigo tenham o deepDive completo nos 8 itens
  const enrichedLegalMatrix = useMemo(() => {
    const defaults = buildDefaultLegalMatrix(lot);
    const defaultMap = new Map(defaults.map((d) => [d.id, d]));
    return legalMatrix.map((item) => {
      const fallback = defaultMap.get(item.id);
      return {
        ...item,
        deepDive: item.deepDive ||
          fallback?.deepDive || {
            legalBasis:
              "Regras definidas pelo Edital do Leilão, Lei nº 9.514/97 e art. 881 e seguintes do Código de Processo Civil.",
            financialAndTimeImpact:
              "Provisionado na modelagem financeira de aquisição e manutenção da operação.",
            practicalChecklist: [
              "Validar cláusulas específicas no PDF oficial do Edital antes do pregão.",
              "Conferir certidão de matrícula atualizada no Cartório de Registro de Imóveis.",
            ],
          },
      };
    });
  }, [legalMatrix, lot]);

  const allExpanded = useMemo(
    () =>
      enrichedLegalMatrix.length > 0 &&
      enrichedLegalMatrix.every((item) => Boolean(expandedCards[item.id])),
    [enrichedLegalMatrix, expandedCards]
  );

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAllCards = () => {
    if (allExpanded) {
      setExpandedCards({});
    } else {
      const next: Record<string, boolean> = {};
      for (const item of enrichedLegalMatrix) {
        next[item.id] = true;
      }
      setExpandedCards(next);
    }
  };

  const secondPraca = isLotInSecondPraca(lot);

  const counts = useMemo(() => {
    let green = 0;
    let yellow = 0;
    let red = 0;
    for (const item of enrichedLegalMatrix) {
      if (item.level === "green") green++;
      else if (item.level === "yellow") yellow++;
      else red++;
    }
    return { green, yellow, red };
  }, [enrichedLegalMatrix]);

  const handleCopyShareLink = () => {
    if (typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}/a/${encodeURIComponent(lot.id)}`;
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 3000);
  };

  const dotColor = (level: TrafficLight) => {
    if (level === "green") return "bg-emerald-600";
    if (level === "yellow") return "bg-amber-500";
    return "bg-red-600";
  };

  const maxSliderBid = Math.max(
    Math.round(sim.marketValueEffective * 0.95),
    Math.round(lot.minBid * 1.4)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased pb-20 print:bg-white print:pb-0">
      {/* Header Institucional */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image
                src="/logo.png"
                alt="finHouse"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="text-[17px] font-semibold tracking-[-0.02em] text-[#222222] hidden sm:inline">
                finHouse
              </span>
            </Link>
            <span className="h-4 w-px bg-[#E2E8F0]" />
            <Link
              href="/leilaocom-ia/premium"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#475569] hover:text-[#0F172A] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Screener</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/leilaocom-ia/premium/comparar?lotes=${encodeURIComponent(
                lot.id
              )}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F172A] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] px-3 py-1.5 rounded-lg transition-colors"
            >
              <Columns3 className="w-3.5 h-3.5 text-[#475569]" />
              <span className="hidden sm:inline">Comparar Lote</span>
            </Link>
            <button
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F172A] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#047857]" />
                  <span>Link copiado</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#475569]" />
                  <span>Compartilhar</span>
                </>
              )}
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#0F2744] hover:bg-[#0A1B30] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Aviso em modo Link Compartilhado */}
      {readOnlyShare && (
        <div className="bg-[#0F2744] text-white py-2.5 px-4 print:hidden">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span>
              Dossiê Institucional de Viabilidade — finHouse Leilões SP
            </span>
            <Link
              href="/leilaocom-ia/premium"
              className="bg-white text-[#0F172A] font-semibold px-3 py-1 rounded-md text-xs shrink-0"
            >
              Acessar Screener Completo
            </Link>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-5 print:pt-2 print:space-y-4">
        {/* MÓDULO 1: IDENTIFICAÇÃO EXECUTIVA & QUADRO DE VALORES */}
        <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden print:border-[#CBD5E1]">
          <div className="p-5 sm:p-6 border-b border-[#E2E8F0]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                <span className="font-semibold text-[#0F172A]">
                  {lot.source}
                </span>
                <span>·</span>
                <span>Cód. {lot.code}</span>
                <span>·</span>
                <span>{lot.modality}</span>
                <span>·</span>
                <span>{secondPraca ? "2ª Praça" : "1ª Praça"}</span>
                <span>·</span>
                <span>Encerramento: {lot.auctionDate}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A]">
                  <span
                    className={`w-2 h-2 rounded-full ${dotColor(
                      verdict.status
                    )}`}
                  />
                  <span>Score de Viabilidade: {verdict.score}/100</span>
                </div>
                <a
                  href={lot.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#475569] hover:text-[#0F172A] border border-[#CBD5E1] px-2.5 py-1 rounded-md transition-colors print:hidden"
                >
                  <span>Página do Leiloeiro</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {showLotImage && (
                <div className="lg:col-span-3">
                  <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] w-full rounded-lg overflow-hidden border border-[#E2E8F0] bg-[#F1F5F9]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={lot.imageUrl}
                      alt={lot.title}
                      onError={() => setImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className={`${showLotImage ? "lg:col-span-5" : "lg:col-span-8"} space-y-2`}>
                <h1 className="text-lg sm:text-xl font-semibold tracking-[-0.02em] text-[#0F172A] leading-snug">
                  {lot.title}
                </h1>
                <p className="text-xs text-[#64748B]">
                  {formatLotLocation(lot)} · {sim.propertyCategory} · Padrão{" "}
                  {sim.propertyTier} · Área estimada: {sim.estimatedAreaM2} m²
                </p>

                <div className="pt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Resumo da Análise
                  </p>
                  <p className="text-xs sm:text-sm text-[#334155] mt-1 leading-relaxed">
                    {verdict.executiveSummary || lot.aiSummary}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-4 bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0] space-y-2.5 tabular-nums">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Lance Mínimo do Edital</span>
                  <span className="font-semibold text-[#047857]">
                    -{lot.discountPct}% sobre avaliação
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#0F172A] tracking-tight">
                  {formatBRL(lot.minBid)}
                </div>
                <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">
                      Lance Teto Máximo Indicado:
                    </span>
                    <span className="font-semibold text-[#0F172A]">
                      {formatBRL(sim.maxRecommendedBid)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">
                      Avaliação de Mercado:
                    </span>
                    <span className="font-medium text-[#334155]">
                      {formatBRL(sim.marketValueEffective)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Indicadores Institucionais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E8F0] bg-[#F8FAFC] tabular-nums">
            <div className="p-4">
              <p className="text-[11px] text-[#64748B] font-medium uppercase tracking-wider">
                Valor por m² (Lance Mín.)
              </p>
              <p className="text-base font-semibold text-[#0F172A] mt-0.5">
                {formatBRL(Math.round(lot.minBid / sim.estimatedAreaM2))}/m²
              </p>
              <p className="text-[11px] text-[#64748B]">
                Avaliação:{" "}
                {formatBRL(
                  Math.round(sim.marketValueEffective / sim.estimatedAreaM2)
                )}
                /m²
              </p>
            </div>
            <div className="p-4">
              <p className="text-[11px] text-[#64748B] font-medium uppercase tracking-wider">
                Resultado Líquido (Lance Mín.)
              </p>
              <p
                className={`text-base font-semibold mt-0.5 ${
                  sim.scenarios.minBid.netProfit > 0
                    ? "text-[#047857]"
                    : "text-[#B91C1C]"
                }`}
              >
                {formatBRL(sim.scenarios.minBid.netProfit)}
              </p>
              <p className="text-[11px] text-[#64748B]">
                ROI: {sim.scenarios.minBid.roiPct}% (após custos e IR)
              </p>
            </div>
            <div className="p-4">
              <p className="text-[11px] text-[#64748B] font-medium uppercase tracking-wider">
                Lance Teto Máximo Indicado
              </p>
              <p className="text-base font-semibold text-[#0F172A] mt-0.5">
                {formatBRL(sim.maxRecommendedBid)}
              </p>
              <p className="text-[11px] text-[#64748B]">
                {sim.maxBidBufferAmount > 0
                  ? `Até +${formatBRL(
                      sim.maxBidBufferAmount
                    )} acima do mín. (p/ ${targetMarginPct}% de margem)`
                  : `Limite no lance mínimo (p/ ${targetMarginPct}% de margem)`}
              </p>
            </div>
            <div className="p-4">
              <p className="text-[11px] text-[#64748B] font-medium uppercase tracking-wider">
                Auditoria Documental
              </p>
              <p className="text-base font-semibold text-[#0F172A] mt-0.5">
                {counts.green} regulares · {counts.yellow} atenção
                {counts.red > 0 ? ` · ${counts.red} crítico` : ""}
              </p>
              <p className="text-[11px] text-[#64748B]">
                Ocupação constatada: {sim.effectiveOccupancy}
              </p>
            </div>
          </div>
        </section>

        {/* MÓDULO 2: SIMULADOR FINANCEIRO & CALCULADORA DE LANCE TETO */}
        <section className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 print:border-[#CBD5E1]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-[#0F172A]">
                Modelagem Financeira Completa e Calculadora de Lance Teto
              </h2>
              <p className="text-xs text-[#64748B]">
                Parametrização de lance, reforma em São Paulo (base CUB/SINAPI),
                desocupação, contingência jurídica e prazo de giro
              </p>
            </div>
            <span className="text-xs font-medium text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-md">
              {!sim.isAboveMaxBid
                ? `Lance dentro do teto indicado (${formatBRL(
                    sim.maxRecommendedBid
                  )})`
                : `Atenção: lance acima do teto indicado (${formatBRL(
                    sim.maxRecommendedBid
                  )})`}
            </span>
          </div>

          {/* Balizador de Valor de Mercado: Edital vs. Bairro (FipeZAP) vs. Comparáveis Web */}
          <div className="py-4 border-b border-[#E2E8F0] space-y-3 tabular-nums">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold text-[#0F172A]">
                  Base de Avaliação para Revenda (Edital vs. Mercado Real)
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Compare a avaliação do leilão com a média do bairro e
                  comparáveis de mercado (ZAP/VivaReal/OLX) ou informe o valor
                  pesquisado por você.
                </p>
              </div>
              {Math.abs(sim.editalVsBenchmarkPct) >= 12 && (
                <span
                  className={`text-[11px] font-medium px-2.5 py-1 rounded border shrink-0 ${
                    sim.editalVsBenchmarkPct > 0
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                  }`}
                >
                  {sim.editalVsBenchmarkPct > 0
                    ? `Atenção: Edital +${sim.editalVsBenchmarkPct}% acima da média do bairro`
                    : `Edital ${sim.editalVsBenchmarkPct}% abaixo da média do bairro`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Fonte 1: Avaliação do Edital */}
              <button
                type="button"
                disabled={readOnlyShare}
                onClick={() => {
                  setCustomMarketValue(sim.editalMarketValue);
                  setMarketSourceMode("edital");
                }}
                className={`text-left rounded-lg p-3 border transition-colors ${
                  marketSourceMode === "edital"
                    ? "bg-[#F8FAFC] border-[#0F2744] ring-1 ring-[#0F2744]/15"
                    : "bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]"
                } ${readOnlyShare ? "cursor-default" : "cursor-pointer"}`}
              >
                <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                  <span>Avaliação do Edital</span>
                  {marketSourceMode === "edital" && (
                    <span className="font-semibold text-[#0F2744]">Em uso</span>
                  )}
                </div>
                <div className="text-sm font-bold text-[#0F172A] mt-0.5">
                  {formatBRL(sim.editalMarketValue)}
                </div>
                <div className="text-[11px] text-[#64748B]">
                  {formatBRL(
                    Math.round(sim.editalMarketValue / sim.estimatedAreaM2)
                  )}
                  /m² · Laudo oficial do leilão
                </div>
              </button>

              {/* Fonte 2: Referência FipeZAP / Bairro */}
              <div
                className={`rounded-lg p-3 border transition-colors ${
                  marketSourceMode === "benchmark"
                    ? "bg-[#F8FAFC] border-[#0F2744] ring-1 ring-[#0F2744]/15"
                    : "bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-[#64748B]">
                  <button
                    type="button"
                    disabled={readOnlyShare}
                    onClick={() => {
                      setCustomMarketValue(sim.benchmarkTotalValue);
                      setMarketSourceMode("benchmark");
                    }}
                    className={`text-left flex-1 ${
                      readOnlyShare ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <span>Média do Bairro (FipeZAP/SP)</span>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {marketSourceMode === "benchmark" && (
                      <span className="font-semibold text-[#0F2744]">
                        Em uso
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowBenchmarkCriteria((v) => !v)}
                      title={
                        showBenchmarkCriteria
                          ? "Ocultar critério de cálculo"
                          : "Ver critério usado na média do bairro"
                      }
                      aria-expanded={showBenchmarkCriteria}
                      className={`inline-flex items-center justify-center w-5 h-5 rounded border text-[11px] font-semibold transition-colors cursor-pointer print:hidden ${
                        showBenchmarkCriteria
                          ? "bg-[#0F2744] text-white border-[#0F2744]"
                          : "bg-[#F8FAFC] text-[#0F172A] border-[#CBD5E1] hover:bg-[#E2E8F0]/60"
                      }`}
                    >
                      {showBenchmarkCriteria ? (
                        <Minus className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={readOnlyShare}
                  onClick={() => {
                    setCustomMarketValue(sim.benchmarkTotalValue);
                    setMarketSourceMode("benchmark");
                  }}
                  className={`text-left w-full ${
                    readOnlyShare ? "cursor-default" : "cursor-pointer"
                  }`}
                >
                  <div className="text-sm font-bold text-[#0F172A] mt-0.5">
                    {formatBRL(sim.benchmarkTotalValue)}
                  </div>
                  <div className="text-[11px] text-[#64748B] truncate">
                    {formatBRL(sim.benchmarkM2)}/m² · {sim.benchmarkLabel}
                  </div>
                </button>

                {/* Selo de Confiança + Faixa P25 / Mediana / P75 */}
                <div className="mt-2 pt-2 border-t border-[#E2E8F0] space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded ${
                        sim.benchmarkConfidence === "alta"
                          ? "bg-emerald-50 text-emerald-700"
                          : sim.benchmarkConfidence === "media"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          sim.benchmarkConfidence === "alta"
                            ? "bg-emerald-600"
                            : sim.benchmarkConfidence === "media"
                            ? "bg-amber-500"
                            : "bg-slate-400"
                        }`}
                      />
                      {sim.benchmarkConfidence === "alta"
                        ? "Alta precisão (Bairro)"
                        : sim.benchmarkConfidence === "media"
                        ? "Ref. Municipal"
                        : "Estimativa Regional"}
                    </span>
                    <span className="text-[#64748B]">Ref. {sim.benchmarkRefDate}</span>
                  </div>

                  {/* Régua Visual P25 — Mediana — P75 */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-slate-200 via-[#0F2744]/40 to-emerald-500/60 relative overflow-hidden" />
                    <div className="grid grid-cols-3 text-[10px] tabular-nums">
                      <div>
                        <span className="text-[#64748B] block">P25 (Conserv.)</span>
                        <span className="font-semibold text-[#334155]">
                          {formatBRL(sim.benchmarkP25M2)}/m²
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[#64748B] block">Mediana</span>
                        <span className="font-semibold text-[#0F2744]">
                          {formatBRL(sim.benchmarkM2)}/m²
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#64748B] block">P75 (Reform.)</span>
                        <span className="font-semibold text-emerald-700">
                          {formatBRL(sim.benchmarkP75M2)}/m²
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {showBenchmarkCriteria && (
                  <div className="mt-2.5 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#475569] space-y-1 leading-relaxed">
                    <div className="font-semibold text-[#0F172A]">
                      Memória de cálculo aplicada:
                    </div>
                    {sim.benchmarkBreakdown.map((line, i) => (
                      <div key={i}>• {line}</div>
                    ))}
                    <div>
                      • Conta final:{" "}
                      <span className="font-medium text-[#0F172A]">
                        {formatBRL(sim.benchmarkM2)}/m² × {sim.estimatedAreaM2}{" "}
                        m² = {formatBRL(sim.benchmarkTotalValue)}
                      </span>
                    </div>
                    <p className="pt-1.5 mt-1 border-t border-[#E2E8F0] text-[10px] text-[#64748B] italic">
                      Aviso: valor meramente estimativo baseado em médias
                      regionais; valide com imóveis similares antes do lance.
                    </p>
                  </div>
                )}
              </div>

              {/* Fonte 3: Comparáveis Web OU Ajuste Manual Valor Venda */}
              <div
                className={`rounded-lg p-3 border ${
                  marketSourceMode === "web" || marketSourceMode === "manual"
                    ? "bg-[#F8FAFC] border-[#0F2744] ring-1 ring-[#0F2744]/15"
                    : "bg-white border-[#E2E8F0]"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                  <span>
                    {hasWebComparables
                      ? "Comparáveis Web / Ajuste Manual Valor Venda"
                      : "Ajuste Manual Valor Venda"}
                  </span>
                  {(marketSourceMode === "web" ||
                    marketSourceMode === "manual") && (
                    <span className="font-semibold text-[#0F2744]">Em uso</span>
                  )}
                </div>

                {hasWebComparables && (
                  <button
                    type="button"
                    disabled={readOnlyShare}
                    onClick={() => {
                      setCustomMarketValue(marketValuation.estimatedMarketPrice);
                      setMarketSourceMode("web");
                    }}
                    className="text-left w-full mt-0.5 cursor-pointer"
                  >
                    <div className="text-sm font-bold text-[#0F172A]">
                      {formatBRL(marketValuation.estimatedMarketPrice)}{" "}
                      <span className="text-[11px] font-normal text-[#64748B]">
                        ({formatBRL(marketValuation.estimatedPricePerM2)}/m²)
                      </span>
                    </div>
                  </button>
                )}

                {!readOnlyShare && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[11px] text-[#64748B]">R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={
                        customMarketValue > 0
                          ? Math.round(customMarketValue).toLocaleString("pt-BR")
                          : ""
                      }
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        if (!digits) {
                          setCustomMarketValue(0);
                          setMarketSourceMode("manual");
                          return;
                        }
                        const val = parseInt(digits, 10);
                        if (!Number.isNaN(val)) {
                          setCustomMarketValue(val);
                          setMarketSourceMode("manual");
                        }
                      }}
                      placeholder="Ex: 650.000"
                      className="w-full px-2 py-1 text-xs font-semibold tabular-nums bg-white border border-[#CBD5E1] rounded text-[#0F172A] focus:outline-none focus:border-[#0F2744]"
                      aria-label="Ajuste Manual Valor Venda"
                    />
                  </div>
                )}

                {!readOnlyShare && (
                  <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2 text-[10px] text-[#64748B]">
                    <span>Validar similares:</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://www.zapimoveis.com.br/venda/imoveis/sp+${encodeURIComponent(
                          (lot.city || "sao-paulo").toLowerCase().replace(/\s+/g, "-")
                        )}/?onde=,S%C3%A3o%20Paulo,${encodeURIComponent(
                          lot.city || "São Paulo"
                        )},${encodeURIComponent(lot.neighborhood || "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 font-semibold text-[#0F2744] hover:underline"
                      >
                        ZAP <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <span className="text-[#CBD5E1]">·</span>
                      <a
                        href={`https://www.vivareal.com.br/venda/sp/${encodeURIComponent(
                          (lot.city || "sao-paulo").toLowerCase().replace(/\s+/g, "-")
                        )}/?onde=,S%C3%A3o%20Paulo,${encodeURIComponent(
                          lot.city || "São Paulo"
                        )},${encodeURIComponent(lot.neighborhood || "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 font-semibold text-[#0F2744] hover:underline"
                      >
                        VivaReal <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de comparáveis reais encontrados na web (se houver) */}
            {hasWebComparables && marketValuation.comparables.length > 0 && (
              <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3 space-y-1.5">
                <div className="text-[11px] font-semibold text-[#334155]">
                  Comparáveis identificados na região:{" "}
                  <span className="font-normal text-[#64748B]">
                    {marketValuation.methodologyNote}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {marketValuation.comparables.map((comp, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-[11px] bg-white border border-[#E2E8F0] rounded px-2 py-1 text-[#334155]"
                    >
                      <span className="font-medium">{comp.title}</span>
                      {comp.priceLabel && (
                        <span className="font-semibold text-[#0F172A]">
                          · {comp.priceLabel}
                        </span>
                      )}
                      <span className="text-[#64748B]">
                        ({comp.sourcePortal})
                      </span>
                      {comp.url && (
                        <a
                          href={comp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0F2744] hover:underline"
                          title="Abrir referência"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!readOnlyShare && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-b border-[#E2E8F0] print:hidden tabular-nums">
              {/* Controle 1: Lance */}
              <div className="bg-[#F8FAFC] rounded-lg p-3.5 border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#334155]">
                    1. Valor do Lance Simulado
                  </label>
                  <button
                    onClick={() => setSimulatedBid(lot.minBid)}
                    className="text-[11px] text-[#475569] hover:text-[#0F172A] underline cursor-pointer"
                  >
                    Voltar ao mínimo
                  </button>
                </div>
                <div className="text-lg font-bold text-[#0F172A]">
                  {formatBRL(simulatedBid)}
                </div>
                <input
                  type="range"
                  min={Math.round(lot.minBid * 0.9)}
                  max={maxSliderBid}
                  step={5000}
                  value={simulatedBid}
                  onChange={(e) => setSimulatedBid(Number(e.target.value))}
                  className="w-full accent-[#0F2744] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[#64748B]">
                  <span>Mín: {formatBRL(lot.minBid)}</span>
                  <button
                    onClick={() => setSimulatedBid(sim.maxRecommendedBid)}
                    className="font-medium text-[#0F2744] hover:underline cursor-pointer"
                  >
                    Aplicar Teto: {formatBRL(sim.maxRecommendedBid)}
                  </button>
                </div>
              </div>

              {/* Controle 2: Reforma SP */}
              <div className="bg-[#F8FAFC] rounded-lg p-3.5 border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#334155]">
                    2. Padrão de Reforma
                  </label>
                  <span className="text-xs font-semibold text-[#0F172A]">
                    {formatBRL(sim.reformaCost)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  {([0, 1, 2, 3] as ReformaLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setReformaLevel(lvl)}
                      className={`text-left px-2.5 py-1.5 rounded-md text-xs border transition-colors cursor-pointer ${
                        reformaLevel === lvl
                          ? "bg-[#0F2744] text-white border-[#0F2744]"
                          : "bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      <div className="font-medium">
                        {REFORMA_SP_TABLE[lvl].shortLabel}
                      </div>
                      <div className="text-[10px] opacity-80">
                        R${" "}
                        {REFORMA_SP_TABLE[lvl].costPerM2[sim.propertyTier]}/m²
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Controle 3: Prazo & Margem */}
              <div className="bg-[#F8FAFC] rounded-lg p-3.5 border border-[#E2E8F0] space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[#334155]">
                      3. Prazo de Giro / Vacância
                    </label>
                    <span className="text-xs font-semibold text-[#0F172A]">
                      {holdingMonths} meses
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[6, 9, 12].map((m) => (
                      <button
                        key={m}
                        onClick={() => setHoldingMonths(m)}
                        className={`py-1 rounded-md text-xs font-medium border cursor-pointer ${
                          holdingMonths === m
                            ? "bg-[#0F2744] text-white border-[#0F2744]"
                            : "bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F1F5F9]"
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[#334155]">
                      Margem Líquida Alvo (Define Lance Teto)
                    </label>
                    <span className="text-xs font-semibold text-[#0F172A]">
                      {targetMarginPct}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[15, 18, 22].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setTargetMarginPct(pct)}
                        className={`py-1 rounded-md text-xs font-medium border cursor-pointer ${
                          targetMarginPct === pct
                            ? "bg-[#0F2744] text-white border-[#0F2744]"
                            : "bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F1F5F9]"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DRE Completo (Cenário Base) + Resumo de Limite de Disputa */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 tabular-nums">
            <div className="lg:col-span-8 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Demonstrativo Completo de Custos e Resultado (Lance de{" "}
                  {formatBRL(sim.simulatedBid)})
                </h3>
                <span className="text-[11px] text-[#64748B]">
                  Todos os custos inclusos
                </span>
              </div>

              <div className="rounded-lg border border-[#E2E8F0] divide-y divide-[#E2E8F0] text-xs">
                <div className="p-2.5 flex justify-between items-baseline gap-2">
                  <div>
                    <span className="text-[#0F172A] font-medium">
                      1. Valor de Arrematação (Lance Simulado)
                    </span>
                  </div>
                  <span className="font-semibold text-[#0F172A] shrink-0">
                    {formatBRL(sim.simulatedBid)}
                  </span>
                </div>

                <div className="p-2.5 flex justify-between items-baseline gap-2">
                  <div>
                    <span className="text-[#475569]">
                      2. Comissão do Leiloeiro Oficial (5% s/ lance)
                    </span>
                    <span className="block text-[11px] text-[#64748B]">
                      Paga à vista no ato da arrematação (não compõe o preço)
                    </span>
                  </div>
                  <span className="text-[#0F172A] shrink-0">
                    {formatBRL(sim.auctioneerFee)}
                  </span>
                </div>

                <div className="p-2.5 flex justify-between items-baseline gap-2">
                  <div>
                    <span className="text-[#475569]">
                      3. ITBI Municipal SP (3% s/ base de arrematação)
                    </span>
                    <span className="block text-[11px] text-[#64748B]">
                      Imposto de transmissão para registro da propriedade
                    </span>
                  </div>
                  <span className="text-[#0F172A] shrink-0">
                    {formatBRL(sim.itbiCost)}
                  </span>
                </div>

                <div className="p-2.5 flex justify-between items-baseline gap-2">
                  <div>
                    <span className="text-[#475569]">
                      4. Escritura / Carta + Registro CRI + Baixa de Gravames
                    </span>
                    <span className="block text-[11px] text-[#64748B]">
                      Emolumentos da tabela cartorária SP e averbações de
                      cancelamento
                    </span>
                  </div>
                  <span className="text-[#0F172A] shrink-0">
                    {formatBRL(sim.registryAndDeedCost)}
                  </span>
                </div>

                <div className="p-2.5 flex justify-between items-baseline gap-2">
                  <div>
                    <span className="text-[#475569]">
                      5. Desocupação e Imissão na Posse (
                      {sim.effectiveOccupancy === "Ver no Edital"
                        ? "Não informada no edital"
                        : sim.effectiveOccupancy}
                      )
                    </span>
                    <span className="block text-[11px] text-[#64748B]">
                      {sim.effectiveOccupancy === "Desocupado"
                        ? "Imóvel desocupado — reserva para vistoria, chaves e diligência local"
                        : sim.effectiveOccupancy === "Ocupado"
                        ? "Imóvel ocupado — honorários advocatícios de imissão na posse, oficial de justiça ou acordo de saída"
                        : "Ocupação não informada no edital — provisão conservadora de imóvel ocupado (imissão na posse)"}
                    </span>
                  </div>
                  <span className="text-[#0F172A] shrink-0">
                    {formatBRL(sim.evictionAndLegalCost)}
                  </span>
                </div>

                <div className="p-2.5 flex justify-between items-baseline gap-2">
                  <div>
                    <span className="text-[#475569]">
                      6. Reserva p/ Defesa Judicial, Eventual Contencioso ou
                      Passivos
                    </span>
                    <span className="block text-[11px] text-[#64748B]">
                      {lot.modality.toLowerCase().includes("judicial") &&
                      !lot.modality.toLowerCase().includes("extrajudicial")
                        ? "Provisão (1,2% s/ avaliação, mín. R$ 4.500) p/ baixa de penhoras, sub-rogação fiscal e embargos"
                        : "Provisão (0,7% s/ avaliação, mín. R$ 2.800) p/ defesa preventiva e regularização de certidões"}
                    </span>
                  </div>
                  <span className="text-[#0F172A] shrink-0">
                    {formatBRL(sim.legalContingencyReserve)}
                  </span>
                </div>

                <div className="p-2.5 flex justify-between items-baseline gap-2">
                  <div>
                    <span className="text-[#475569]">
                      7. Reforma e Adequação SP (
                      {REFORMA_SP_TABLE[reformaLevel].shortLabel} ·{" "}
                      {sim.estimatedAreaM2} m²)
                    </span>
                    <span className="block text-[11px] text-[#64748B]">
                      Estimativa CUB/SINAPI SP para padrão {sim.propertyTier}
                    </span>
                  </div>
                  <span className="text-[#0F172A] shrink-0">
                    {formatBRL(sim.reformaCost)}
                  </span>
                </div>

                <div className="p-2.5 flex justify-between items-baseline gap-2">
                  <div>
                    <span className="text-[#475569]">
                      8. Manutenção na Vacância ({holdingMonths} meses de giro)
                    </span>
                    <span className="block text-[11px] text-[#64748B]">
                      Condomínio + IPTU estimado em{" "}
                      {formatBRL(sim.holdingMonthlyEstimate)}/mês até a revenda
                    </span>
                  </div>
                  <span className="text-[#0F172A] shrink-0">
                    {formatBRL(sim.holdingCostTotal)}
                  </span>
                </div>

                <div className="p-2.5 flex justify-between items-center bg-[#F8FAFC] font-semibold text-[#0F172A]">
                  <span>(=) Desembolso Total da Operação (Capital Alocado)</span>
                  <span>{formatBRL(sim.totalAcquisitionAndHolding)}</span>
                </div>

                <div className="p-2.5 flex justify-between items-baseline gap-2">
                  <div>
                    <span className="text-[#475569]">
                      9. (+) Valor de Revenda Projetado (-
                      {sim.liquidityHaircutPct}% deságio de liquidez)
                    </span>
                    <span className="block text-[11px] text-[#64748B]">
                      Base:{" "}
                      {marketSourceMode === "web"
                        ? "Comparáveis Web"
                        : marketSourceMode === "benchmark"
                        ? "Média do Bairro (FipeZAP)"
                        : marketSourceMode === "manual"
                        ? "Valor informado manualmente"
                        : "Avaliação do Edital"}{" "}
                      ({formatBRL(sim.marketValueEffective)}) ajustada para
                      giro rápido
                    </span>
                  </div>
                  <span className="font-semibold text-[#0F172A] shrink-0">
                    {formatBRL(sim.realisticSalePrice)}
                  </span>
                </div>

                <div className="p-2.5 flex justify-between items-baseline gap-2">
                  <div>
                    <span className="text-[#475569]">
                      10. (−) Comissão de Corretagem na Revenda (6%)
                    </span>
                  </div>
                  <span className="text-[#B91C1C] shrink-0">
                    -{formatBRL(sim.brokerFee)}
                  </span>
                </div>

                <div className="p-2.5 flex justify-between items-baseline gap-2">
                  <div>
                    <span className="text-[#475569]">
                      11. (−) Imposto de Renda s/ Ganho de Capital (15%)
                    </span>
                    <span className="block text-[11px] text-[#64748B]">
                      Apurado sobre o ganho líquido deduzindo custos elegíveis
                    </span>
                  </div>
                  <span className="text-[#B91C1C] shrink-0">
                    -{formatBRL(sim.capitalGainsTax)}
                  </span>
                </div>

                <div className="p-3 flex justify-between items-center bg-[#F8FAFC] font-semibold text-[#0F172A]">
                  <div>
                    <div>(=) Lucro Líquido Projetado (Líquido de Tudo)</div>
                    <div className="text-[11px] font-normal text-[#64748B]">
                      Renda locatícia estimada:{" "}
                      {formatBRL(sim.estimatedMonthlyRent)}/mês (
                      {sim.annualRentalYieldPct}% a.a.)
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-base font-bold ${
                        sim.netProfit > 0 ? "text-[#047857]" : "text-[#B91C1C]"
                      }`}
                    >
                      {formatBRL(sim.netProfit)}
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      ROI {sim.roiPct}% · Margem {sim.netMarginPct}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-[11px] text-[#475569] leading-relaxed">
                <span className="font-semibold text-[#0F172A]">
                  Nota sobre Eventual Reversão Judicial:
                </span>{" "}
                Caso uma arrematação venha a ser desfeita ou anulada por decisão
                judicial transitada em julgado sem culpa do arrematante, a
                jurisprudência pacífica (STJ e TJSP) determina a restituição
                integral do valor pago (lance + comissão do leiloeiro) corrigido
                monetariamente. O item 6 do DRE provisiona verba jurídica para
                defesa tempestiva da arrematação e baixa de constrições.
              </div>
            </div>

            {/* Resumo do Cenário Base e Limite de Disputa */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Resumo do Cenário Base e Limite de Disputa
              </h3>

              {/* Destaque Explicativo do Lance Teto */}
              <div className="rounded-lg p-4 bg-[#F8FAFC] border border-[#CBD5E1] space-y-2">
                <div className="text-xs font-semibold text-[#0F172A]">
                  Lance Teto Máximo Indicado (p/ {targetMarginPct}% de margem)
                </div>
                <div className="text-xl font-bold text-[#0F2744]">
                  {formatBRL(sim.maxRecommendedBid)}
                </div>
                <p className="text-[11px] text-[#475569] leading-relaxed">
                  {sim.maxBidBufferAmount > 0
                    ? `Você pode disputar o lote subindo até +${formatBRL(
                        sim.maxBidBufferAmount
                      )} acima do lance mínimo (${formatBRL(
                        lot.minBid
                      )}) e ainda preservar ${targetMarginPct}% de margem líquida após todos os 11 itens de custo.`
                    : `O lance mínimo atual (${formatBRL(
                        lot.minBid
                      )}) já está no limite exato para buscar ${targetMarginPct}% de margem líquida. Não recomendamos subir lances na disputa.`}
                </p>
              </div>

              <div className="rounded-lg p-4 bg-white border border-[#E2E8F0] space-y-2.5 text-xs">
                <div className="font-semibold text-[#0F172A]">
                  Síntese do Cenário Base ({formatBRL(sim.simulatedBid)})
                </div>
                <div className="flex justify-between text-[#475569]">
                  <span>Capital Total Alocado:</span>
                  <span className="font-semibold text-[#0F172A]">
                    {formatBRL(sim.totalAcquisitionAndHolding)}
                  </span>
                </div>
                <div className="flex justify-between text-[#475569]">
                  <span>Revenda Líquida (após 6% + IR):</span>
                  <span className="font-semibold text-[#0F172A]">
                    {formatBRL(
                      sim.realisticSalePrice -
                        sim.brokerFee -
                        sim.capitalGainsTax
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E2E8F0]">
                  <span className="font-medium text-[#0F172A]">
                    Lucro Líquido / ROI:
                  </span>
                  <span
                    className={`font-bold ${
                      sim.netProfit > 0 ? "text-[#047857]" : "text-[#B91C1C]"
                    }`}
                  >
                    {formatBRL(sim.netProfit)} ({sim.roiPct}%)
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#64748B]">
                  <span>TIR mensal estimada ({holdingMonths}m):</span>
                  <span className="font-medium text-[#0F172A]">
                    {sim.monthlyIrrPct}% a.m.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MÓDULO 3: MATRIZ DE AUDITORIA DOCUMENTAL (8 ITENS) COM EXPANSÃO (+) */}
        <section className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 print:border-[#CBD5E1]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-[#0F172A]">
                Matriz de Auditoria Jurídica e Documental (8 Itens)
              </h2>
              <p className="text-xs text-[#64748B]">
                Clique no botão{" "}
                <span className="font-semibold text-[#0F172A]">+</span> em cada
                card para abrir o aprofundamento jurídico, impacto financeiro e
                checklist prático na própria página
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleAllCards}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F172A] bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] px-2.5 py-1.5 rounded-md transition-colors cursor-pointer print:hidden"
              >
                {allExpanded ? (
                  <>
                    <Minus className="w-3.5 h-3.5 text-[#475569]" />
                    <span>Recolher todos</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-[#475569]" />
                    <span>Expandir todos os 8 itens</span>
                  </>
                )}
              </button>

              {documentsRead.map((doc) => (
                <a
                  key={doc.url}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F172A] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] px-2.5 py-1.5 rounded-md transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-[#475569]" />
                  <span>{doc.label}</span>
                  <ExternalLink className="w-3 h-3 text-[#64748B]" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-4">
            {enrichedLegalMatrix.map((item) => {
              const isExpanded = Boolean(expandedCards[item.id]);
              return (
                <div
                  key={item.id}
                  className={`rounded-lg border transition-colors p-4 flex flex-col justify-between gap-3 bg-white ${
                    isExpanded
                      ? "border-[#0F2744] ring-1 ring-[#0F2744]/10"
                      : "border-[#E2E8F0]"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${dotColor(
                            item.level
                          )}`}
                        />
                        <h3 className="text-xs sm:text-sm font-semibold text-[#0F172A]">
                          {item.number}. {item.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-medium text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded">
                          {item.statusLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleCard(item.id)}
                          aria-expanded={isExpanded}
                          title={
                            isExpanded
                              ? "Recolher aprofundamento"
                              : "Ver aprofundamento deste item"
                          }
                          className={`inline-flex items-center justify-center w-6 h-6 rounded border text-xs font-semibold transition-colors cursor-pointer print:hidden ${
                            isExpanded
                              ? "bg-[#0F2744] text-white border-[#0F2744]"
                              : "bg-[#F8FAFC] text-[#0F172A] border-[#CBD5E1] hover:bg-[#E2E8F0]/60"
                          }`}
                        >
                          {isExpanded ? (
                            <Minus className="w-3.5 h-3.5" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#334155] leading-relaxed">
                      {item.finding}
                    </p>
                  </div>

                  {/* Aprofundamento inline aberto ao clicar no (+) */}
                  {isExpanded && item.deepDive && (
                    <div className="pt-3 border-t border-[#E2E8F0] space-y-2.5 text-xs bg-[#F8FAFC] -mx-4 px-4 py-3 border-b">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0F2744] block">
                          Fundamentação Jurídica e Regra Aplicável
                        </span>
                        <p className="text-[#334155] mt-0.5 leading-relaxed">
                          {item.deepDive.legalBasis}
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0F2744] block">
                          Impacto no Caixa e no Prazo da Operação
                        </span>
                        <p className="text-[#334155] mt-0.5 leading-relaxed">
                          {item.deepDive.financialAndTimeImpact}
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0F2744] block">
                          Checklist Prático de Verificação
                        </span>
                        <ul className="mt-1 space-y-1 text-[#334155] list-disc list-inside">
                          {item.deepDive.practicalChecklist.map((step, i) => (
                            <li key={i} className="leading-relaxed">
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 bg-[#F8FAFC] rounded p-2 border border-[#E2E8F0] text-[11px] text-[#64748B]">
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-medium text-[#475569]">
                        Referência: {item.documentName} ({item.pageRef})
                      </div>
                      <div className="line-clamp-2">“{item.citation}”</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCard(item.id)}
                      className="text-[11px] font-medium text-[#0F2744] hover:underline shrink-0 cursor-pointer print:hidden"
                    >
                      {isExpanded ? "Fechar (−)" : "Aprofundar (+)"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p>
              Nota Técnica: Levantamento informativo estruturado a partir dos
              documentos públicos disponibilizados pelo leiloeiro. Não substitui
              diligência processual nem parecer jurídico formal antes do lance.
            </p>
            <a
              href={`https://wa.me/5511955842951?text=${encodeURIComponent(
                `Olá! Analisei o lote ${lot.code} (${lot.title}) no Dossiê finHouse e gostaria de falar com a Mesa de Crédito / Assessoria.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 bg-[#0F2744] hover:bg-[#0A1B30] text-white font-semibold px-3.5 py-2 rounded-lg text-xs transition-colors print:hidden"
            >
              Consultar Especialista finHouse
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
