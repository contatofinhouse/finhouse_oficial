"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Check, ArrowLeft } from "lucide-react";
import DossierFullView from "@/components/premium/DossierFullView";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import type { DeepDossierReport } from "@/app/api/leiloes/dossie/route";
import { recordLotAnalysisUsage } from "@/lib/leiloes/trial-storage";
import { useAuth } from "@/contexts/AuthContext";

function PremiumAnaliseLotContent() {
  const params = useParams<{ lotId: string }>();
  const lotId = decodeURIComponent(params?.lotId || "");
  const { accessToken, refreshAccess } = useAuth();

  const [report, setReport] = useState<DeepDossierReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const auditSteps = [
    "Localizando dados e documentos públicos do leilão",
    "Estruturando matriz jurídica (rito, débitos, ocupação e matrícula)",
    "Estimando valor de mercado no bairro e custos de aquisição (ITBI e cartório)",
    "Projetando custos de reforma (CUB/SINAPI-SP) e prazo de giro",
    "Calculando Lance Teto recomendado e cenários de viabilidade líquida",
  ];

  useEffect(() => {
    if (!lotId) return;

    const timer = setInterval(() => {
      setStepIdx((prev) => (prev < auditSteps.length - 1 ? prev + 1 : prev));
    }, 1600);

    async function loadOrGenerateDossier() {
      try {
        setLoading(true);
        setError(null);
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }
        const res = await fetch("/api/leiloes/dossie", {
          method: "POST",
          headers,
          body: JSON.stringify({ lotId }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error ||
              "Não foi possível carregar o dossiê deste imóvel."
          );
        }

        const data: DeepDossierReport = await res.json();
        recordLotAnalysisUsage(
          data.lot.id,
          Boolean(data.usedCredit && !data.cached)
        );
        refreshAccess();
        setReport(data);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Erro ao gerar dossiê completo"
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrGenerateDossier();
    return () => clearInterval(timer);
  }, [lotId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[#0F2744] animate-spin shrink-0" />
            <div>
              <h1 className="text-sm font-semibold text-[#0F172A]">
                Processando Dossiê de Viabilidade
              </h1>
              <p className="text-xs text-[#64748B]">Referência: {lotId}</p>
            </div>
          </div>

          <div className="space-y-2 border-t border-[#E2E8F0] pt-4">
            {auditSteps.map((label, idx) => {
              const done = idx < stepIdx;
              const active = idx === stepIdx;
              return (
                <div
                  key={label}
                  className={`flex items-center gap-2.5 py-1.5 text-xs ${
                    active
                      ? "text-[#0F172A] font-medium"
                      : done
                      ? "text-[#475569]"
                      : "text-[#94A3B8]"
                  }`}
                >
                  {done ? (
                    <Check className="w-3.5 h-3.5 text-[#047857] shrink-0" />
                  ) : active ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#0F2744] animate-spin shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-[#CBD5E1] shrink-0" />
                  )}
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-[#E2E8F0] p-6 text-center space-y-3">
          <h1 className="text-base font-semibold text-[#0F172A]">
            Lote não encontrado
          </h1>
          <p className="text-xs text-[#64748B]">
            {error || "Verifique se o código do lote está ativo no catálogo."}
          </p>
          <div className="pt-2">
            <Link
              href="/leilaocom-ia/premium"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#0F2744] text-white px-3.5 py-2 rounded-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao Screener
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DossierFullView
      lot={report.lot}
      verdict={report.verdict}
      marketValuation={report.marketValuation}
      legalMatrix={report.legalMatrix}
      documentsRead={report.documentsRead}
      usedAiModel={report.usedAiModel}
      cached={report.cached}
    />
  );
}

export default function PremiumAnaliseLotPage() {
  return (
    <PremiumAccessGate>
      <PremiumAnaliseLotContent />
    </PremiumAccessGate>
  );
}
