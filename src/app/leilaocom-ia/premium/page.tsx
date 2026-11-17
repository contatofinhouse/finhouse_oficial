"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  Bookmark,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Loader2,
  X,
  Check,
  ChevronRight,
} from "lucide-react";
import { ScrapedAuctionLot } from "@/lib/leiloes-utils";
import {
  DealFinancialSimulation,
  evaluateLotPreliminary,
  PrelimEvaluation,
  PropertyCategory,
  PropertyTier,
  simulateAuctionDeal,
} from "@/lib/leiloes/financials";
import {
  getSavedFavoriteIds,
  getTrialQuotaStatus,
  PLAN_MONTHLY_EQUIVALENT,
  PLAN_PRICE_DISPLAY,
  toggleFavoriteId,
  TrialQuotaStatus,
} from "@/lib/leiloes/trial-storage";

interface EnrichedLotRow {
  lot: ScrapedAuctionLot;
  prelim: PrelimEvaluation;
  sim: DealFinancialSimulation;
  isSecondPraca: boolean;
  isCached: boolean;
  effectiveDiscountPct: number;
}

type SortField =
  | "city"
  | "area"
  | "score"
  | "bid"
  | "sale"
  | "discount"
  | "ceiling"
  | "headroom"
  | "total"
  | "profit"
  | "roi";

type SortDir = "asc" | "desc";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export default function PremiumDashboardPage() {
  const router = useRouter();

  const [rawLots, setRawLots] = useState<ScrapedAuctionLot[]>([]);
  const [cachedIds, setCachedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<TrialQuotaStatus>(() =>
    getTrialQuotaStatus()
  );
  const [favIds, setFavIds] = useState<string[]>([]);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"screener" | "my_analyses">(
    "screener"
  );
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [leadWhatsapp, setLeadWhatsapp] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | PropertyCategory
  >("all");
  const [tierFilter, setTierFilter] = useState<"all" | PropertyTier>("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [maxBidFilter, setMaxBidFilter] = useState<number>(0);
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [onlySecondPraca, setOnlySecondPraca] = useState(false);
  const [onlyDesocupado, setOnlyDesocupado] = useState(false);
  const [onlySaleAboveBid, setOnlySaleAboveBid] = useState(false);
  const [onlyFinancing, setOnlyFinancing] = useState(false);
  const [onlyFavs, setOnlyFavs] = useState(false);

  // Sorting (Field + Direction)
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    setQuota(getTrialQuotaStatus());
    setFavIds(getSavedFavoriteIds());

    async function fetchAll() {
      try {
        setLoading(true);
        const [lotsRes, cacheRes] = await Promise.all([
          fetch("/api/leiloes?uf=sp"),
          fetch("/api/leiloes/dossie"),
        ]);
        const lotsData = await lotsRes.json();
        const cacheData = await cacheRes.json().catch(() => ({}));

        if (Array.isArray(lotsData.lots)) {
          setRawLots(lotsData.lots);
        }
        if (Array.isArray(cacheData.cachedLotIds)) {
          setCachedIds(cacheData.cachedLotIds);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const enrichedRows = useMemo<EnrichedLotRow[]>(() => {
    const analyzedSet = new Set([
      ...cachedIds,
      ...(quota?.analyzedLotIds || []),
    ]);
    return rawLots.map((lot) => {
      const isCached = analyzedSet.has(lot.id);
      const prelim = evaluateLotPreliminary(lot, isCached);
      const sim = simulateAuctionDeal(lot);
      const effectiveDiscountPct =
        lot.discountPct > 0
          ? lot.discountPct
          : sim.marketValueEffective > lot.minBid
          ? Math.round((1 - lot.minBid / sim.marketValueEffective) * 100)
          : 0;

      return {
        lot,
        prelim,
        sim,
        isSecondPraca: prelim.isSecondPracaActive,
        isCached,
        effectiveDiscountPct,
      };
    });
  }, [rawLots, cachedIds, quota]);

  // Contadores dinâmicos para garantir transparência nos filtros
  const filterCounts = useMemo(() => {
    const tiers: Record<PropertyTier, number> = {
      AAA: 0,
      Médio: 0,
      Econômico: 0,
    };
    const categories: Record<PropertyCategory, number> = {
      Apartamento: 0,
      Casa: 0,
      Comercial: 0,
      Terreno: 0,
    };
    let secondPraca = 0;
    let desocupado = 0;
    let saleAboveBid = 0;
    let financing = 0;
    let score75 = 0;

    for (const r of enrichedRows) {
      tiers[r.prelim.propertyTier] = (tiers[r.prelim.propertyTier] || 0) + 1;
      categories[r.prelim.propertyCategory] =
        (categories[r.prelim.propertyCategory] || 0) + 1;
      if (r.isSecondPraca) secondPraca++;
      if (r.prelim.effectiveOccupancy === "Desocupado") desocupado++;
      if (r.sim.benchmarkTotalValue > r.lot.minBid) saleAboveBid++;
      if (r.lot.acceptsFinancing) financing++;
      if (r.prelim.prelimScore >= 75) score75++;
    }

    return {
      tiers,
      categories,
      secondPraca,
      desocupado,
      saleAboveBid,
      financing,
      score75,
    };
  }, [enrichedRows]);

  const availableCities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of enrichedRows) {
      const c = r.lot.city || "São Paulo";
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [enrichedRows]);

  const availableSources = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of enrichedRows) {
      counts.set(r.lot.source, (counts.get(r.lot.source) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [enrichedRows]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const list = enrichedRows.filter((row) => {
      const { lot, prelim } = row;

      if (activeTab === "my_analyses") {
        if (!row.isCached && !quota.analyzedLotIds.includes(lot.id)) {
          return false;
        }
      }

      if (q) {
        const hay = `${lot.code} ${lot.title} ${lot.neighborhood} ${lot.city} ${lot.address} ${lot.source}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (cityFilter !== "all" && lot.city !== cityFilter) return false;
      if (
        categoryFilter !== "all" &&
        prelim.propertyCategory !== categoryFilter
      ) {
        return false;
      }
      if (tierFilter !== "all" && prelim.propertyTier !== tierFilter) {
        return false;
      }
      if (sourceFilter !== "all" && lot.source !== sourceFilter) return false;
      if (maxBidFilter > 0 && lot.minBid > maxBidFilter) return false;
      if (minScoreFilter > 0 && prelim.prelimScore < minScoreFilter) {
        return false;
      }
      if (onlySecondPraca && !row.isSecondPraca) return false;
      if (onlyDesocupado && prelim.effectiveOccupancy !== "Desocupado") {
        return false;
      }
      if (onlySaleAboveBid && row.sim.benchmarkTotalValue <= lot.minBid) {
        return false;
      }
      if (onlyFinancing && !lot.acceptsFinancing) return false;
      if (onlyFavs && !favIds.includes(lot.id)) return false;

      return true;
    });

    const mult = sortDir === "asc" ? 1 : -1;

    list.sort((a, b) => {
      switch (sortField) {
        case "city":
          return (
            a.lot.city.localeCompare(b.lot.city, "pt-BR") * mult ||
            a.lot.neighborhood.localeCompare(b.lot.neighborhood, "pt-BR") * mult
          );
        case "area":
          return (
            (a.prelim.estimatedAreaM2 - b.prelim.estimatedAreaM2) * mult
          );
        case "score":
          return (
            (a.prelim.prelimScore - b.prelim.prelimScore) * mult ||
            (a.sim.roiPct - b.sim.roiPct) * mult
          );
        case "bid":
          return (a.lot.minBid - b.lot.minBid) * mult;
        case "sale":
          return (
            (a.sim.benchmarkTotalValue - b.sim.benchmarkTotalValue) * mult
          );
        case "discount":
          return (a.effectiveDiscountPct - b.effectiveDiscountPct) * mult;
        case "ceiling":
          return (
            (a.sim.maxRecommendedBid - b.sim.maxRecommendedBid) * mult
          );
        case "headroom":
          return (
            (a.sim.headroomToMaxBidPct - b.sim.headroomToMaxBidPct) * mult
          );
        case "total":
          return (
            (a.sim.totalAcquisitionAndHolding -
              b.sim.totalAcquisitionAndHolding) *
            mult
          );
        case "profit":
          return (a.sim.netProfit - b.sim.netProfit) * mult;
        case "roi":
          return (a.sim.roiPct - b.sim.roiPct) * mult;
        default:
          return 0;
      }
    });

    return list;
  }, [
    enrichedRows,
    activeTab,
    quota.analyzedLotIds,
    searchQuery,
    cityFilter,
    categoryFilter,
    tierFilter,
    sourceFilter,
    maxBidFilter,
    minScoreFilter,
    onlySecondPraca,
    onlyDesocupado,
    onlySaleAboveBid,
    onlyFinancing,
    onlyFavs,
    favIds,
    sortField,
    sortDir,
  ]);

  const handleColumnSort = (
    field: SortField,
    defaultDir: SortDir = "desc"
  ) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(defaultDir);
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 text-[#94A3B8] opacity-60 group-hover:opacity-100 shrink-0 transition-opacity" />
      );
    }
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-[#0F2744] shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#0F2744] shrink-0" />
    );
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
      cityFilter !== "all" ||
      categoryFilter !== "all" ||
      tierFilter !== "all" ||
      sourceFilter !== "all" ||
      maxBidFilter > 0 ||
      minScoreFilter > 0 ||
      onlySecondPraca ||
      onlyDesocupado ||
      onlySaleAboveBid ||
      onlyFinancing ||
      onlyFavs
  );

  const resetFilters = () => {
    setSearchQuery("");
    setCityFilter("all");
    setCategoryFilter("all");
    setTierFilter("all");
    setSourceFilter("all");
    setMaxBidFilter(0);
    setMinScoreFilter(0);
    setOnlySecondPraca(false);
    setOnlyDesocupado(false);
    setOnlySaleAboveBid(false);
    setOnlyFinancing(false);
    setOnlyFavs(false);
    setSortField("score");
    setSortDir("desc");
  };

  const handleToggleCompare = (lotId: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(lotId)) return prev.filter((id) => id !== lotId);
      if (prev.length >= 3) return [...prev.slice(1), lotId];
      return [...prev, lotId];
    });
  };

  const handleExportCSV = () => {
    const headers = [
      "Codigo",
      "Leiloeiro",
      "Tipo",
      "Padrao",
      "Cidade",
      "Bairro",
      "Area_m2",
      "Score_finHouse",
      "Lance_Minimo_R$",
      "Avaliacao_Efetiva_R$",
      "Desagio_%",
      "2a_Praca_Ativa",
      "Lance_Teto_Recomendado_R$",
      "Custo_Reforma_SP_R$",
      "Investimento_Total_R$",
      "Lucro_Liquido_Est_R$",
      "ROI_Liquido_%",
      "Ocupacao",
      "Financiamento",
      "Data_Praca",
      "Link_Dossie_finHouse",
      "Link_Leiloeiro",
    ];

    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://www.finhouse.com.br";

    const csvLines = [
      headers.join(";"),
      ...filteredRows.map(
        ({ lot, prelim, sim, isSecondPraca, effectiveDiscountPct }) =>
          [
            lot.code,
            `"${lot.source}"`,
            prelim.propertyCategory,
            prelim.propertyTier,
            `"${lot.city}"`,
            `"${lot.neighborhood}"`,
            prelim.estimatedAreaM2,
            prelim.prelimScore,
            lot.minBid,
            sim.marketValueEffective,
            effectiveDiscountPct,
            isSecondPraca ? "Sim" : "Nao",
            sim.maxRecommendedBid,
            sim.reformaCost,
            sim.totalAcquisitionAndHolding,
            sim.netProfit,
            sim.roiPct,
            prelim.effectiveOccupancy,
            lot.acceptsFinancing ? "Sim" : "Nao",
            `"${lot.auctionDate}"`,
            `${origin}/leilaocom-ia/premium/analise/${encodeURIComponent(
              lot.id
            )}`,
            lot.sourceUrl,
          ].join(";")
      ),
    ];

    const blob = new Blob(["\uFEFF" + csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finhouse-leiloes-sp-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const analyzedCount = useMemo(
    () =>
      enrichedRows.filter(
        (r) => r.isCached || quota.analyzedLotIds.includes(r.lot.id)
      ).length,
    [enrichedRows, quota.analyzedLotIds]
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased pb-24">
      {/* Header Institucional */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-[1400px] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <Image
                  src="/logo.png"
                  alt="finHouse"
                  width={30}
                  height={30}
                  className="rounded-lg"
                />
                <span className="text-[18px] font-semibold tracking-[-0.02em] text-[#222222]">
                  finHouse
                </span>
              </Link>

              <span className="h-5 w-px bg-[#E2E8F0]" aria-hidden="true" />

              <Link
                href="/leilaocom-ia"
                className="flex items-center gap-1.5 shrink-0 select-none"
              >
                <span className="text-[17px] tracking-[-0.02em] flex items-baseline">
                  <span className="font-semibold text-[#222222]">leilão</span>
                  <span className="font-normal text-[#717171] text-[14px] mx-1">
                    com
                  </span>
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#0F2744] text-white text-[11px] font-bold tracking-tight leading-none">
                  IA
                </span>
              </Link>
            </div>

            {/* Navegação de Visões */}
            <nav className="hidden md:flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0]">
              <Link
                href="/leilaocom-ia"
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[#475569] hover:text-[#0F172A] transition-colors"
              >
                Mapa & Imóveis
              </Link>
              <button
                onClick={() => setActiveTab("screener")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === "screener"
                    ? "bg-white text-[#0F172A] shadow-2xs"
                    : "text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                Screener & Base ({enrichedRows.length})
              </button>
              <button
                onClick={() => setActiveTab("my_analyses")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === "my_analyses"
                    ? "bg-white text-[#0F172A] shadow-2xs"
                    : "text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                Dossiês Analisados ({analyzedCount})
              </button>
              <Link
                href={
                  selectedForCompare.length > 0
                    ? `/leilaocom-ia/premium/comparar?lotes=${selectedForCompare
                        .map(encodeURIComponent)
                        .join(",")}`
                    : "/leilaocom-ia/premium/comparar"
                }
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[#475569] hover:text-[#0F172A] transition-colors"
              >
                Comparador ({selectedForCompare.length}/3)
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3 text-xs text-[#475569] border-r border-[#E2E8F0] pr-3">
              <span>
                Período de avaliação:{" "}
                <strong className="text-[#0F172A]">{quota.daysLeft} dias</strong>
              </span>
              <span className="text-[#CBD5E1]">·</span>
              <span>
                Cota diária:{" "}
                <strong className="text-[#0F172A]">
                  {quota.creditsLeftToday}/{quota.dailyLimit}
                </strong>
              </span>
            </div>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F172A] bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#475569]" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            <button
              onClick={() => setUpgradeModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#0F2744] hover:bg-[#0A1B30] text-white px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <span>Plano Semestral</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 space-y-4">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold tracking-[-0.02em] text-[#0F172A]">
              {activeTab === "screener"
                ? "Análise e Triagem de Leilões — Estado de São Paulo"
                : "Carteira de Dossiês Analisados"}
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Modelagem de viabilidade com cálculo de Lance Teto (margem líquida
              alvo de 18%), custos de reforma SP (CUB/SINAPI) e auditoria de
              edital.
            </p>
          </div>
          <div className="text-xs text-[#64748B] tabular-nums">
            Exibindo{" "}
            <strong className="text-[#0F172A]">{filteredRows.length}</strong> de{" "}
            {enrichedRows.length} lotes ativos
          </div>
        </div>

        {/* Barra de Filtros Limpa e Institucional */}
        <section className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
            {/* Busca */}
            <div className="lg:col-span-2 relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por bairro, endereço, cidade ou código..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0F2744] focus:bg-white transition-colors"
              />
            </div>

            {/* Cidade */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:border-[#0F2744]"
            >
              <option value="all">Todas as cidades (SP)</option>
              {availableCities.map(([c, count]) => (
                <option key={c} value={c}>
                  {c} ({count})
                </option>
              ))}
            </select>

            {/* Tipologia */}
            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as "all" | PropertyCategory)
              }
              className="px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:border-[#0F2744]"
            >
              <option value="all">Todas as tipologias</option>
              <option value="Apartamento">
                Apartamento ({filterCounts.categories.Apartamento})
              </option>
              <option value="Casa">
                Casa / Sobrado ({filterCounts.categories.Casa})
              </option>
              <option value="Comercial">
                Comercial ({filterCounts.categories.Comercial})
              </option>
              <option value="Terreno">
                Terreno ({filterCounts.categories.Terreno})
              </option>
            </select>

            {/* Padrão Construtivo */}
            <select
              value={tierFilter}
              onChange={(e) =>
                setTierFilter(e.target.value as "all" | PropertyTier)
              }
              className="px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:border-[#0F2744]"
            >
              <option value="all">Todos os padrões</option>
              <option value="AAA">
                Alto Padrão — AAA ({filterCounts.tiers.AAA})
              </option>
              <option value="Médio">
                Médio Padrão ({filterCounts.tiers.Médio})
              </option>
              <option value="Econômico">
                Padrão Econômico ({filterCounts.tiers.Econômico})
              </option>
            </select>

            {/* Teto de Lance */}
            <select
              value={maxBidFilter}
              onChange={(e) => setMaxBidFilter(Number(e.target.value))}
              className="px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:border-[#0F2744]"
            >
              <option value={0}>Qualquer valor de lance</option>
              <option value={250000}>Até R$ 250 mil</option>
              <option value={450000}>Até R$ 450 mil</option>
              <option value={750000}>Até R$ 750 mil</option>
              <option value={1200000}>Até R$ 1,2 milhão</option>
              <option value={2500000}>Até R$ 2,5 milhões</option>
            </select>
          </div>

          {/* Linha 2: Filtros booleanos com contagem real + Leiloeiro + Ordenação */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-[#F1F5F9]">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                {
                  active: onlySecondPraca,
                  onClick: () => setOnlySecondPraca((v) => !v),
                  label: `2ª Praça ativa (${filterCounts.secondPraca})`,
                },
                {
                  active: onlyDesocupado,
                  onClick: () => setOnlyDesocupado((v) => !v),
                  label: `Desocupados (${filterCounts.desocupado})`,
                },
                {
                  active: onlySaleAboveBid,
                  onClick: () => setOnlySaleAboveBid((v) => !v),
                  label: `Venda est. > Lance mín. (${filterCounts.saleAboveBid})`,
                },
                {
                  active: onlyFinancing,
                  onClick: () => setOnlyFinancing((v) => !v),
                  label: `Aceita financiamento (${filterCounts.financing})`,
                },
                {
                  active: minScoreFilter >= 75,
                  onClick: () =>
                    setMinScoreFilter((prev) => (prev === 75 ? 0 : 75)),
                  label: `Score ≥ 75 (${filterCounts.score75})`,
                },
                {
                  active: onlyFavs,
                  onClick: () => setOnlyFavs((v) => !v),
                  label: `Salvos (${favIds.length})`,
                },
              ].map((pill) => (
                <button
                  key={pill.label}
                  onClick={pill.onClick}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    pill.active
                      ? "bg-[#0F2744] text-white border-[#0F2744]"
                      : "bg-white text-[#475569] border-[#CBD5E1] hover:border-[#94A3B8] hover:text-[#0F172A]"
                  }`}
                >
                  {pill.label}
                </button>
              ))}

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-md border border-[#CBD5E1] bg-white text-[#475569] focus:outline-none focus:border-[#0F2744]"
              >
                <option value="all">Todos os leiloeiros</option>
                {availableSources.map(([src, cnt]) => (
                  <option key={src} value={src}>
                    {src} ({cnt})
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748B]">
                Clique no título de qualquer coluna para alternar crescente /
                decrescente
              </span>
            </div>
          </div>
        </section>

        {/* Tabela Institucional de Dados com Ordenação Rápida por Coluna */}
        {loading ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-14 flex flex-col items-center justify-center gap-2.5">
            <Loader2 className="w-5 h-5 text-[#0F2744] animate-spin" />
            <p className="text-xs font-medium text-[#64748B]">
              Carregando base de leilões e indicadores financeiros...
            </p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center space-y-2.5">
            <p className="text-sm font-semibold text-[#0F172A]">
              Nenhum lote encontrado para os critérios selecionados.
            </p>
            <p className="text-xs text-[#64748B]">
              Ajuste os filtros acima para visualizar outras oportunidades.
            </p>
            <button
              onClick={resetFilters}
              className="mt-1 text-xs font-semibold bg-[#0F2744] text-white px-3.5 py-1.5 rounded-lg cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B] select-none">
                  <th className="py-3 px-3.5 w-10 text-center">Sel.</th>

                  {/* Coluna 1: Imóvel / Cidade */}
                  <th className="py-3 px-3.5">
                    <button
                      type="button"
                      onClick={() => handleColumnSort("city", "asc")}
                      className="group inline-flex items-center gap-1.5 uppercase tracking-wider hover:text-[#0F172A] cursor-pointer"
                    >
                      <span>Imóvel / Localização</span>
                      {renderSortIcon("city")}
                    </button>
                  </th>

                  {/* Coluna 2: Tipologia / Área */}
                  <th className="py-3 px-3.5">
                    <button
                      type="button"
                      onClick={() => handleColumnSort("area", "desc")}
                      className="group inline-flex items-center gap-1.5 uppercase tracking-wider hover:text-[#0F172A] cursor-pointer"
                    >
                      <span>Tipologia / Área</span>
                      {renderSortIcon("area")}
                    </button>
                  </th>

                  {/* Coluna 3: Score */}
                  <th className="py-3 px-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleColumnSort("score", "desc")}
                      className="group inline-flex items-center justify-center gap-1 uppercase tracking-wider hover:text-[#0F172A] cursor-pointer mx-auto"
                    >
                      <span>Score</span>
                      {renderSortIcon("score")}
                    </button>
                  </th>

                  {/* Coluna 4: Lance Mínimo */}
                  <th className="py-3 px-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleColumnSort("bid", "asc")}
                      className="group inline-flex items-center justify-end gap-1.5 uppercase tracking-wider hover:text-[#0F172A] cursor-pointer ml-auto"
                    >
                      <span>Lance Mínimo</span>
                      {renderSortIcon("bid")}
                    </button>
                  </th>

                  {/* Coluna 5: Venda Estimada (Mercado) */}
                  <th className="py-3 px-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleColumnSort("sale", "desc")}
                      className="group inline-flex items-center justify-end gap-1.5 uppercase tracking-wider hover:text-[#0F172A] cursor-pointer ml-auto"
                    >
                      <span>Venda Estimada</span>
                      {renderSortIcon("sale")}
                    </button>
                  </th>

                  {/* Coluna 6: Lance Teto Indicado */}
                  <th className="py-3 px-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleColumnSort("ceiling", "desc")}
                      className="group inline-flex items-center justify-end gap-1.5 uppercase tracking-wider hover:text-[#0F172A] cursor-pointer ml-auto"
                    >
                      <span>Lance Teto Indicado</span>
                      {renderSortIcon("ceiling")}
                    </button>
                  </th>

                  {/* Coluna 7: Investimento Total */}
                  <th className="py-3 px-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleColumnSort("total", "asc")}
                      className="group inline-flex items-center justify-end gap-1.5 uppercase tracking-wider hover:text-[#0F172A] cursor-pointer ml-auto"
                    >
                      <span>Invest. Total</span>
                      {renderSortIcon("total")}
                    </button>
                  </th>

                  {/* Coluna 8: Lucro Líquido / ROI */}
                  <th className="py-3 px-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleColumnSort("roi", "desc")}
                      className="group inline-flex items-center justify-end gap-1.5 uppercase tracking-wider hover:text-[#0F172A] cursor-pointer ml-auto"
                    >
                      <span>Lucro Líq. / ROI</span>
                      {renderSortIcon("roi")}
                    </button>
                  </th>

                  <th className="py-3 px-3.5 text-right">Dossiê</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs tabular-nums">
                {filteredRows.slice(0, 120).map((row) => {
                  const {
                    lot,
                    prelim,
                    sim,
                    isSecondPraca,
                    isCached,
                    effectiveDiscountPct,
                  } = row;
                  const isSelected = selectedForCompare.includes(lot.id);
                  const isFav = favIds.includes(lot.id);

                  return (
                    <tr
                      key={lot.id}
                      className={`transition-colors ${
                        isSelected ? "bg-[#F1F5F9]" : "hover:bg-[#F8FAFC]"
                      }`}
                    >
                      {/* Checkbox discreto */}
                      <td className="py-3 px-3.5 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleCompare(lot.id)}
                          title="Selecionar para comparar (até 3 lotes)"
                          className="w-3.5 h-3.5 rounded border-[#CBD5E1] accent-[#0F2744] cursor-pointer"
                        />
                      </td>

                      {/* Imóvel / Localização */}
                      <td className="py-3 px-3.5 max-w-[290px]">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                          <span className="font-medium text-[#334155]">
                            {lot.source}
                          </span>
                          <span>·</span>
                          <span>Cód. {lot.code}</span>
                          {isSecondPraca && (
                            <>
                              <span>·</span>
                              <span className="text-[#0F2744] font-medium">
                                2ª Praça
                              </span>
                            </>
                          )}
                          {isCached && (
                            <>
                              <span>·</span>
                              <span className="text-[#047857] font-semibold">
                                Analisado
                              </span>
                            </>
                          )}
                        </div>
                        <Link
                          href={`/leilaocom-ia/premium/analise/${encodeURIComponent(
                            lot.id
                          )}`}
                          className="font-semibold text-[13px] text-[#0F172A] hover:text-[#0F2744] hover:underline line-clamp-1 mt-0.5 block"
                        >
                          {lot.title}
                        </Link>
                        <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                          {lot.neighborhood}, {lot.city} · {lot.auctionDate}
                        </div>
                      </td>

                      {/* Tipologia / Área / Ocupação */}
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-[#0F172A]">
                          {prelim.propertyCategory} · {prelim.propertyTier}
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">
                          {prelim.estimatedAreaM2} m² ·{" "}
                          <span
                            className={
                              prelim.effectiveOccupancy === "Desocupado"
                                ? "text-[#047857] font-medium"
                                : ""
                            }
                          >
                            {prelim.effectiveOccupancy}
                          </span>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC]">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              prelim.verdictStatus === "green"
                                ? "bg-emerald-600"
                                : prelim.verdictStatus === "yellow"
                                ? "bg-amber-500"
                                : "bg-red-600"
                            }`}
                          />
                          <span className="font-semibold text-[#0F172A]">
                            {prelim.prelimScore}
                          </span>
                        </div>
                      </td>

                      {/* Lance Mínimo */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="font-semibold text-[#0F172A]">
                          {formatBRL(lot.minBid)}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {formatBRL(prelim.pricePerM2Bid)}/m²
                        </div>
                      </td>

                      {/* Venda Estimada (Mercado) */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="font-semibold text-[#0F172A]">
                          {formatBRL(sim.benchmarkTotalValue)}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {formatBRL(sim.benchmarkM2)}/m² · Ref. bairro
                        </div>
                      </td>

                      {/* Lance Teto Indicado */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="font-semibold text-[#0F172A]">
                          {formatBRL(sim.maxRecommendedBid)}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {sim.maxBidBufferAmount > 0
                            ? `Até +${formatBRL(sim.maxBidBufferAmount)} s/ mín.`
                            : "Limite no lance mín."}
                        </div>
                      </td>

                      {/* Investimento Total */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="font-medium text-[#334155]">
                          {formatBRL(sim.totalAcquisitionAndHolding)}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          Reforma: {formatBRL(sim.reformaCost)}
                        </div>
                      </td>

                      {/* Lucro Líquido / ROI */}
                      <td className="py-3 px-3.5 text-right">
                        <div
                          className={`font-semibold ${
                            sim.netProfit > 0
                              ? "text-[#047857]"
                              : "text-[#B91C1C]"
                          }`}
                        >
                          {formatBRL(sim.netProfit)}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          ROI {sim.roiPct}% · Margem {sim.netMarginPct}%
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              setFavIds(toggleFavoriteId(lot.id))
                            }
                            className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                              isFav
                                ? "bg-[#F1F5F9] border-[#0F2744] text-[#0F2744]"
                                : "bg-white border-[#E2E8F0] text-[#94A3B8] hover:text-[#0F172A]"
                            }`}
                            title="Salvar lote"
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${
                                isFav ? "fill-[#0F2744]" : ""
                              }`}
                            />
                          </button>
                          <Link
                            href={`/leilaocom-ia/premium/analise/${encodeURIComponent(
                              lot.id
                            )}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F172A] hover:text-white bg-white hover:bg-[#0F2744] border border-[#CBD5E1] hover:border-[#0F2744] px-2.5 py-1.5 rounded-md transition-colors"
                          >
                            <span>Dossiê</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Barra Inferior de Comparação */}
      {selectedForCompare.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 max-w-2xl mx-auto bg-[#0F172A] text-white rounded-xl px-4 py-3 shadow-xl border border-[#334155] flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-semibold">
              {selectedForCompare.length} de 3 lotes selecionados
            </span>
            <span className="text-[#94A3B8] hidden sm:inline ml-2">
              Compare indicadores financeiros e jurídicos lado a lado.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedForCompare([])}
              className="text-xs text-[#94A3B8] hover:text-white px-2 py-1 cursor-pointer"
            >
              Limpar
            </button>
            <button
              onClick={() =>
                router.push(
                  `/leilaocom-ia/premium/comparar?lotes=${selectedForCompare
                    .map(encodeURIComponent)
                    .join(",")}`
                )
              }
              className="bg-white hover:bg-[#F1F5F9] text-[#0F172A] font-semibold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
            >
              Comparar selecionados
            </button>
          </div>
        </div>
      )}

      {/* Modal Institucional Plano Semestral */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-5 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Acesso Institucional finHouse
                </p>
                <h3 className="text-lg font-semibold text-[#0F172A] mt-1">
                  Plano Semestral — {PLAN_PRICE_DISPLAY}
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Pagamento único para 6 meses de acesso (
                  {PLAN_MONTHLY_EQUIVALENT}), sem renovação automática.
                </p>
              </div>
              <button
                onClick={() => setUpgradeModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border-t border-b border-[#E2E8F0] py-3.5 space-y-2 text-xs text-[#334155]">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#0F2744] shrink-0" />
                <span>
                  Até 3 dossiês econômico-jurídicos inéditos por dia + consulta
                  ilimitada aos lotes já analisados
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#0F2744] shrink-0" />
                <span>
                  Calculadora Reversa de Lance Teto e estimativa de reforma SP
                  (base CUB/SINAPI)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#0F2744] shrink-0" />
                <span>
                  Comparador lado a lado (até 3 imóveis) e exportação em PDF e
                  CSV
                </span>
              </div>
            </div>

            {leadSubmitted ? (
              <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155]">
                Seu acesso gratuito de 15 dias já está ativo. Registramos seu
                contato para envio prioritário ao término do período de
                avaliação.
              </div>
            ) : (
              <div className="space-y-2.5">
                <input
                  type="tel"
                  placeholder="WhatsApp com DDD para contato"
                  value={leadWhatsapp}
                  onChange={(e) => setLeadWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#0F2744]"
                />
                <button
                  onClick={() => setLeadSubmitted(true)}
                  className="w-full py-2.5 rounded-lg bg-[#0F2744] hover:bg-[#0A1B30] text-white font-semibold text-xs cursor-pointer"
                >
                  Solicitar adesão semestral ({PLAN_PRICE_DISPLAY})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
