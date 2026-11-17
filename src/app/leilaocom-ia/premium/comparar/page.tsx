"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Printer,
  Share2,
  Check,
  ExternalLink,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { ScrapedAuctionLot } from "@/lib/leiloes-utils";
import {
  buildDefaultLegalMatrix,
  evaluateLotPreliminary,
  simulateAuctionDeal,
} from "@/lib/leiloes/financials";
import { getTrialQuotaStatus } from "@/lib/leiloes/trial-storage";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function CompararContent() {
  const searchParams = useSearchParams();
  const [allLots, setAllLots] = useState<ScrapedAuctionLot[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");

  useEffect(() => {
    async function loadLots() {
      try {
        setLoading(true);
        const res = await fetch("/api/leiloes?uf=sp");
        const data = await res.json();
        const lots: ScrapedAuctionLot[] = Array.isArray(data.lots)
          ? data.lots
          : [];
        setAllLots(lots);

        const paramRaw = searchParams.get("lotes") || "";
        const fromUrl = paramRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (fromUrl.length > 0) {
          const matched = fromUrl
            .map(
              (id) =>
                lots.find((l) => l.id === id || l.code === id)?.id || null
            )
            .filter((x): x is string => Boolean(x));
          if (matched.length > 0) {
            setSelectedIds(matched.slice(0, 3));
            return;
          }
        }

        const quota = getTrialQuotaStatus();
        const fromHistory = quota.analyzedLotIds
          .filter((id) => lots.some((l) => l.id === id))
          .slice(0, 3);

        if (fromHistory.length >= 2) {
          setSelectedIds(fromHistory);
        } else {
          const top3 = [...lots]
            .sort(
              (a, b) =>
                evaluateLotPreliminary(b).prelimScore -
                evaluateLotPreliminary(a).prelimScore
            )
            .slice(0, 3)
            .map((l) => l.id);
          setSelectedIds(top3);
        }
      } finally {
        setLoading(false);
      }
    }
    loadLots();
  }, [searchParams]);

  const comparedItems = useMemo(() => {
    return selectedIds
      .map((id) => allLots.find((l) => l.id === id))
      .filter((l): l is ScrapedAuctionLot => Boolean(l))
      .map((lot) => {
        const prelim = evaluateLotPreliminary(lot);
        const sim = simulateAuctionDeal(lot);
        const matrix = buildDefaultLegalMatrix(lot);
        const greenCount = matrix.filter((m) => m.level === "green").length;
        const redCount = matrix.filter((m) => m.level === "red").length;
        return { lot, prelim, sim, greenCount, redCount };
      });
  }, [allLots, selectedIds]);

  const bestMetrics = useMemo(() => {
    if (comparedItems.length === 0) return null;
    return {
      maxScore: Math.max(...comparedItems.map((i) => i.prelim.prelimScore)),
      maxDiscount: Math.max(...comparedItems.map((i) => i.lot.discountPct)),
      maxRoi: Math.max(...comparedItems.map((i) => i.sim.roiPct)),
      maxProfit: Math.max(...comparedItems.map((i) => i.sim.netProfit)),
      maxHeadroom: Math.max(
        ...comparedItems.map((i) => i.sim.headroomToMaxBidPct)
      ),
      minTotalInv: Math.min(
        ...comparedItems.map((i) => i.sim.totalAcquisitionAndHolding)
      ),
    };
  }, [comparedItems]);

  const handleShareCompare = () => {
    if (typeof window === "undefined") return;
    const url = `${
      window.location.origin
    }/leilaocom-ia/premium/comparar?lotes=${selectedIds
      .map(encodeURIComponent)
      .join(",")}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const removeLot = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const addLot = (id: string) => {
    if (selectedIds.includes(id) || selectedIds.length >= 3) return;
    setSelectedIds((prev) => [...prev, id]);
    setPickerOpen(false);
  };

  const filteredPickerLots = useMemo(() => {
    const q = pickerQuery.toLowerCase().trim();
    return allLots
      .filter((l) => !selectedIds.includes(l.id))
      .filter((l) =>
        !q
          ? true
          : `${l.code} ${l.title} ${l.neighborhood} ${l.city} ${l.source}`
              .toLowerCase()
              .includes(q)
      )
      .slice(0, 30);
  }, [allLots, selectedIds, pickerQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
        <div className="flex items-center gap-2.5 text-[#475569]">
          <Loader2 className="w-5 h-5 animate-spin text-[#0F2744]" />
          <span className="text-xs font-medium">
            Carregando comparativo de imóveis...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased pb-20 print:bg-white print:pb-0">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
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
            {selectedIds.length < 3 && (
              <button
                onClick={() => setPickerOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F172A] bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] px-3 py-1.5 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Lote ({selectedIds.length}/3)</span>
              </button>
            )}
            <button
              onClick={handleShareCompare}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F172A] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] px-3 py-1.5 rounded-lg cursor-pointer"
            >
              {copied ? (
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
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#0F2744] hover:bg-[#0A1B30] px-3.5 py-1.5 rounded-lg cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-4">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold tracking-[-0.02em] text-[#0F172A]">
            Quadro Comparativo de Viabilidade ({comparedItems.length} de 3
            Lotes)
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Análise comparativa de preço, lance teto, desembolso projetado e
            auditoria documental.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-x-auto print:border-[#CBD5E1]">
          <table className="w-full min-w-[760px] border-collapse text-left tabular-nums">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="p-4 w-56 align-top">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                    Indicador
                  </span>
                  <p className="text-xs font-normal text-[#64748B] mt-1">
                    O indicador mais favorável de cada linha é destacado.
                  </p>
                </th>
                {comparedItems.map(({ lot, prelim }) => (
                  <th
                    key={lot.id}
                    className="p-4 align-top border-l border-[#E2E8F0] relative"
                  >
                    <button
                      onClick={() => removeLot(lot.id)}
                      title="Remover lote"
                      className="absolute top-3 right-3 text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-md hover:bg-[#E2E8F0]/50 print:hidden cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-[11px] text-[#64748B] font-medium">
                      {lot.source} · Cód. {lot.code}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-[#0F172A] line-clamp-2 mt-0.5 pr-5">
                      {lot.title}
                    </div>
                    <div className="text-[11px] text-[#64748B] font-normal mt-0.5">
                      {lot.neighborhood}, {lot.city} · {prelim.propertyCategory}{" "}
                      ({prelim.propertyTier} · {prelim.estimatedAreaM2} m²)
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2.5 print:hidden">
                      <Link
                        href={`/leilaocom-ia/premium/analise/${encodeURIComponent(
                          lot.id
                        )}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold bg-[#0F2744] hover:bg-[#0A1B30] text-white px-2.5 py-1 rounded-md"
                      >
                        <span>Ver Dossiê</span>
                      </Link>
                      <a
                        href={lot.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#475569] hover:text-[#0F172A] px-2 py-1 rounded-md border border-[#CBD5E1] bg-white"
                      >
                        <span>Leiloeiro</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {/* Linha 1: Score */}
              <tr>
                <td className="p-3.5 font-medium text-[#334155] bg-[#F8FAFC]">
                  Score de Viabilidade (0–100)
                </td>
                {comparedItems.map(({ lot, prelim }) => {
                  const isBest =
                    bestMetrics &&
                    prelim.prelimScore === bestMetrics.maxScore &&
                    comparedItems.length > 1;
                  return (
                    <td
                      key={lot.id}
                      className={`p-3.5 border-l border-[#E2E8F0] ${
                        isBest ? "bg-[#F8FAFC]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#0F172A]">
                          {prelim.prelimScore}/100
                        </span>
                        {isBest && (
                          <span className="text-[10px] font-semibold bg-[#0F2744] text-white px-1.5 py-0.5 rounded">
                            Destaque
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {prelim.verdictLabel}
                      </p>
                    </td>
                  );
                })}
              </tr>

              {/* Linha 2: Lance Mínimo */}
              <tr>
                <td className="p-3.5 font-medium text-[#334155] bg-[#F8FAFC]">
                  Lance Mínimo vs. Avaliação
                </td>
                {comparedItems.map(({ lot, sim }) => (
                  <td key={lot.id} className="p-3.5 border-l border-[#E2E8F0]">
                    <div className="text-sm font-semibold text-[#0F172A]">
                      {formatBRL(lot.minBid)}{" "}
                      <span className="text-[11px] font-medium text-[#047857]">
                        (-{lot.discountPct}%)
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      Avaliação: {formatBRL(sim.marketValueEffective)}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Linha 3: Lance Teto Máximo Indicado */}
              <tr>
                <td className="p-3.5 font-medium text-[#334155] bg-[#F8FAFC]">
                  Lance Teto Máximo Indicado
                  <span className="block text-[11px] font-normal text-[#64748B]">
                    Limite p/ manter ≥ 18% de margem líquida
                  </span>
                </td>
                {comparedItems.map(({ lot, sim }) => (
                  <td key={lot.id} className="p-3.5 border-l border-[#E2E8F0]">
                    <div className="text-sm font-semibold text-[#0F172A]">
                      {formatBRL(sim.maxRecommendedBid)}
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      {sim.maxBidBufferAmount > 0
                        ? `Até +${formatBRL(sim.maxBidBufferAmount)} acima do mín.`
                        : "Limite no lance mínimo"}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Linha 4: Desembolso Total */}
              <tr>
                <td className="p-3.5 font-medium text-[#334155] bg-[#F8FAFC]">
                  Desembolso Total Projetado
                  <span className="block text-[11px] font-normal text-[#64748B]">
                    Lance + 5% + ITBI/CRI + desocupação + contingência + reforma
                  </span>
                </td>
                {comparedItems.map(({ lot, sim }) => (
                  <td key={lot.id} className="p-3.5 border-l border-[#E2E8F0]">
                    <div className="font-semibold text-[#0F172A]">
                      {formatBRL(sim.totalAcquisitionAndHolding)}
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      Reforma: {formatBRL(sim.reformaCost)} · Posse/Jurídico:{" "}
                      {formatBRL(
                        sim.evictionAndLegalCost + sim.legalContingencyReserve
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Linha 5: Resultado Líquido */}
              <tr>
                <td className="p-3.5 font-medium text-[#334155] bg-[#F8FAFC]">
                  Lucro Líquido e ROI Projetado
                  <span className="block text-[11px] font-normal text-[#64748B]">
                    Líquido de 6% corretagem e 15% IR
                  </span>
                </td>
                {comparedItems.map(({ lot, sim }) => {
                  const isBest =
                    bestMetrics &&
                    sim.roiPct === bestMetrics.maxRoi &&
                    comparedItems.length > 1;
                  return (
                    <td
                      key={lot.id}
                      className={`p-3.5 border-l border-[#E2E8F0] ${
                        isBest ? "bg-[#F8FAFC]" : ""
                      }`}
                    >
                      <div
                        className={`text-sm font-bold ${
                          sim.netProfit > 0
                            ? "text-[#047857]"
                            : "text-[#B91C1C]"
                        }`}
                      >
                        {formatBRL(sim.netProfit)}
                      </div>
                      <div className="text-[11px] text-[#475569]">
                        ROI {sim.roiPct}% · Margem {sim.netMarginPct}% (
                        {sim.monthlyIrrPct}% a.m.)
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Linha 6: Rito & Auditoria */}
              <tr>
                <td className="p-3.5 font-medium text-[#334155] bg-[#F8FAFC]">
                  Rito, Ocupação e Auditoria
                </td>
                {comparedItems.map(({ lot, greenCount, redCount }) => (
                  <td key={lot.id} className="p-3.5 border-l border-[#E2E8F0]">
                    <div className="font-medium text-[#0F172A]">
                      {lot.modality} · {lot.occupancy}
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      {greenCount} de 8 itens regulares
                      {redCount > 0 ? ` · ${redCount} ponto crítico` : ""}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Linha 7: Pagamento e Praça */}
              <tr>
                <td className="p-3.5 font-medium text-[#334155] bg-[#F8FAFC]">
                  Condição de Pagamento e Data
                </td>
                {comparedItems.map(({ lot }) => (
                  <td key={lot.id} className="p-3.5 border-l border-[#E2E8F0]">
                    <div className="font-medium text-[#0F172A]">
                      {lot.acceptsFinancing
                        ? "Aceita financiamento / parcelamento"
                        : "Pagamento à vista / regras do edital"}
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      Encerramento: {lot.auctionDate}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal para adicionar lote */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-xl max-w-xl w-full p-5 space-y-3.5 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Selecionar Lote para Comparação
              </h3>
              <button
                onClick={() => setPickerOpen(false)}
                className="p-1 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Buscar por bairro, cidade, código ou leiloeiro..."
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#0F2744]"
            />
            <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8F0]">
              {filteredPickerLots.map((l) => (
                <button
                  key={l.id}
                  onClick={() => addLot(l.id)}
                  className="w-full text-left p-3 hover:bg-[#F8FAFC] flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div>
                    <div className="text-[11px] text-[#64748B]">
                      {l.source} · Cód. {l.code}
                    </div>
                    <div className="text-xs font-semibold text-[#0F172A] line-clamp-1">
                      {l.title}
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      {l.neighborhood}, {l.city} · {formatBRL(l.minBid)} (-
                      {l.discountPct}%)
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-[#0F2744] text-white px-2.5 py-1 rounded-md shrink-0">
                    Selecionar
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompararPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
          <Loader2 className="w-5 h-5 animate-spin text-[#0F2744]" />
        </div>
      }
    >
      <CompararContent />
    </Suspense>
  );
}
