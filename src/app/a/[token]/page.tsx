"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldAlert } from "lucide-react";
import DossierFullView from "@/components/premium/DossierFullView";
import type { DeepDossierReport } from "@/app/api/leiloes/dossie/route";

export default function SharedDossierPage() {
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(params?.token || "");

  const [report, setReport] = useState<DeepDossierReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    async function loadShared() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/leiloes/dossie?lotId=${encodeURIComponent(token)}`
        );
        if (!res.ok) {
          throw new Error("Este link compartilhado não foi encontrado.");
        }
        const data: DeepDossierReport = await res.json();
        setReport(data);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao abrir dossiê compartilhado"
        );
      } finally {
        setLoading(false);
      }
    }
    loadShared();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          <span className="text-sm font-medium">
            Abrindo Dossiê Compartilhado finHouse...
          </span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
          <h1 className="text-lg font-bold text-slate-900">
            Dossiê indisponível
          </h1>
          <p className="text-sm text-slate-600">{error}</p>
          <Link
            href="/leilaocom-ia/premium"
            className="inline-block text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-xl"
          >
            Ir para o Painel finHouse Premium
          </Link>
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
      readOnlyShare
    />
  );
}

