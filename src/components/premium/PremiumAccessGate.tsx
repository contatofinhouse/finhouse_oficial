"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Check,
  Loader2,
  Mail,
  MessageCircle,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function formatPhoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function PremiumAccessGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    user,
    accessToken,
    access,
    isLoading,
    accessLoading,
    loginWithGoogle,
    refreshAccess,
    logout,
  } = useAuth();

  const [googleLoading, setGoogleLoading] = useState(false);

  // Onboarding WhatsApp opcional (1º acesso)
  const [whatsappInput, setWhatsappInput] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  // Solicitação de link de pagamento (quando trial de 15 dias vence)
  const [requestingLink, setRequestingLink] = useState(false);
  const [linkRequested, setLinkRequested] = useState(false);

  const handleGoogleClick = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      setGoogleLoading(false);
    }
  };

  const handleSaveOnboarding = async (skip: boolean) => {
    if (!accessToken) {
      setOnboardingDismissed(true);
      return;
    }
    setSavingOnboarding(true);
    try {
      await fetch("/api/me/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          whatsapp: skip ? "" : whatsappInput,
          whatsappAlertsOptIn: skip ? false : whatsappOptIn,
        }),
      });
      await refreshAccess();
      setOnboardingDismissed(true);
    } finally {
      setSavingOnboarding(false);
    }
  };

  const handleRequestPaymentLink = async () => {
    if (!accessToken) return;
    setRequestingLink(true);
    try {
      const res = await fetch("/api/me/upgrade-interest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reason: "trial_15d_expired" }),
      });
      if (res.ok) {
        setLinkRequested(true);
      }
    } finally {
      setRequestingLink(false);
    }
  };

  if (isLoading || (user && accessLoading && !access)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="flex items-center gap-2.5 text-sm text-[#475569]">
          <Loader2 className="w-4 h-4 animate-spin text-[#0F2744]" />
          <span>Verificando acesso ao Módulo Premium...</span>
        </div>
      </div>
    );
  }

  // 1. Visitante não autenticado → Login Google para 15 dias grátis
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
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
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              15 dias grátis
            </span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold tracking-[-0.02em] text-[#0F172A]">
              Acesse o Módulo Premium de Leilões
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Entre com sua conta Google para liberar{" "}
              <strong className="text-[#0F172A]">15 dias de teste grátis</strong>{" "}
              sem cartão de crédito.
            </p>
          </div>

          <ul className="space-y-2 text-xs text-[#334155] bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
            {[
              "3 dossiês profundos inéditos por dia (lotes em cache = 0 crédito)",
              "Semáforo jurídico em 8 pontos + Calculadora Reversa de Lance Teto",
              "Comparador lado a lado de até 3 lotes + Exportação CSV e PDF",
              "Após 15 dias: R$ 59,90 por 6 meses (sem renovação automática)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-[#0F2744] hover:bg-[#0A1B30] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-70"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.86-3c-.98.66-2.23 1.06-3.42 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
              </svg>
            )}
            <span>Continuar com Google</span>
          </button>

          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
            <Link
              href="/leilaocom-ia"
              className="inline-flex items-center gap-1 hover:text-[#0F172A]"
            >
              <ArrowLeft className="w-3 h-3" />
              Voltar ao Mapa
            </Link>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Login seguro Google
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Trial de 15 dias encerrado → Solicitar link de pagamento por e-mail
  if (access && !access.isActive) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8 space-y-5">
          <div className="space-y-1.5">
            <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Período de teste concluído
            </span>
            <h1 className="text-xl font-bold text-[#0F172A]">
              Seus 15 dias grátis encerraram
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Continue usando o Screener SP, Dossiês Jurídicos com IA, Lance
              Teto e Comparador por{" "}
              <strong className="text-[#0F172A]">
                R$ 59,90 por 6 meses (R$ 9,98/mês)
              </strong>
              .
            </p>
          </div>

          {linkRequested ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Solicitação registrada!
              </div>
              <p>
                Enviaremos o link de pagamento para{" "}
                <strong>{user.email}</strong> em instantes.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRequestPaymentLink}
              disabled={requestingLink}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0F2744] hover:bg-[#0A1B30] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-70"
            >
              {requestingLink ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              <span>Receber link de pagamento no meu e-mail</span>
            </button>
          )}

          <div className="flex items-center justify-between text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]">
            <Link href="/leilaocom-ia" className="hover:text-[#0F172A]">
              ← Voltar ao Mapa gratuito
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="hover:text-[#0F172A] cursor-pointer"
            >
              Sair ({user.email})
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Logado e ativo → renderiza o conteúdo + modal opcional de WhatsApp no 1º acesso
  const showWhatsappModal =
    Boolean(access) && !access?.onboardingCompleted && !onboardingDismissed;

  return (
    <>
      {children}

      {showWhatsappModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">
                  Seus 15 dias grátis estão ativos!
                </h2>
                <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">
                  Quer receber alertas gratuitos no WhatsApp quando surgirem
                  novos leilões com alto desconto em SP?{" "}
                  <span className="text-[#64748B]">(Opcional)</span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#475569] mb-1">
                  WhatsApp para alertas (opcional)
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={whatsappInput}
                  onChange={(e) =>
                    setWhatsappInput(formatPhoneMask(e.target.value))
                  }
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2.5 text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#0F2744]"
                />
              </div>

              <label className="flex items-start gap-2 text-xs text-[#475569] cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappOptIn}
                  onChange={(e) => setWhatsappOptIn(e.target.checked)}
                  className="mt-0.5 rounded border-[#CBD5E1] text-[#0F2744] focus:ring-[#0F2744]"
                />
                <span>
                  Aceito receber alertas de novos leilões de imóveis da finHouse
                  no WhatsApp (posso cancelar a qualquer momento).
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={savingOnboarding}
                onClick={() => handleSaveOnboarding(true)}
                className="px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
              >
                Pular por enquanto
              </button>
              <button
                type="button"
                disabled={savingOnboarding}
                onClick={() => handleSaveOnboarding(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0F2744] hover:bg-[#0A1B30] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-70"
              >
                {savingOnboarding ? "Salvando..." : "Salvar e Começar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

