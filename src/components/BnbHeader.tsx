"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, MessageCircle, ArrowRight } from "lucide-react";

const WA_NUMBER = "5511955842951";

const BNB_NAV_ITEMS = [
  { label: "Simulador", href: "#calculadora" },
  { label: "Comparativo", href: "#comparativo" },
  { label: "Portal & DRE", href: "#relatorio" },
  { label: "O que inclui", href: "#escopo" },
  { label: "Resultados", href: "#cases" },
  { label: "Dúvidas", href: "#faq" },
];

export default function BnbHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.06)]"
          : "bg-white border-b border-[#F1F5F9]"
      }`}
    >
      <div className="max-w-[1280px] mx-auto flex items-center justify-between px-6 h-[72px]">
        {/* Logo finHouse com novo Mote Oficial */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <Image
            src="/logo.png"
            alt="finHouse"
            width={34}
            height={34}
            className="rounded-lg shadow-sm"
          />
          <div className="flex flex-col">
            <span className="text-[19px] font-bold tracking-tight text-[#0F172A] leading-tight flex items-baseline gap-2">
              finHouse
              <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0F3B78]">
                · VENDE E ALUGA MELHOR
              </span>
            </span>
            <span className="sm:hidden text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#0F3B78]">
              VENDE E ALUGA MELHOR
            </span>
          </div>
        </Link>

        {/* Menu Exclusivo da Landing Page Short Stay */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {BNB_NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-3.5 py-1.5 rounded-full text-[13.5px] font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* CTA Lateral de Conversão Direta */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href={`https://wa.me/${WA_NUMBER}?text=Ol%C3%A1!%20Gostaria%20de%20avaliar%20meu%20im%C3%B3vel%20para%20administra%C3%A7%C3%A3o%20Short%20Stay%20pela%20finHouse.`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-full text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            title="Falar no WhatsApp"
          >
            <MessageCircle className="w-5 h-5 text-emerald-600" />
          </a>
          <a
            href="#contato"
            className="px-5 py-2.5 rounded-full bg-[#0F3B78] hover:bg-[#0A2752] text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            Avaliar meu imóvel
            <ArrowRight className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>

        {/* Botão Hambúrguer Mobile */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-xl text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
          aria-label="Abrir Menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Menu Gaveta Mobile */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-[#E2E8F0] px-6 py-5 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#64748B] pb-1 border-b border-[#F1F5F9]">
            Navegação da Página
          </div>
          <div className="flex flex-col space-y-1">
            {BNB_NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 px-3 rounded-lg text-sm font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="pt-2 border-t border-[#F1F5F9] space-y-2">
            <a
              href="#contato"
              onClick={() => setMobileOpen(false)}
              className="w-full py-3 rounded-full bg-[#0F3B78] text-white text-xs font-semibold text-center block shadow-sm"
            >
              Avaliar meu imóvel gratuitamente
            </a>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=Ol%C3%A1!%20Gostaria%20de%20avaliar%20meu%20im%C3%B3vel%20para%20administra%C3%A7%C3%A3o%20Short%20Stay%20pela%20finHouse.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-full border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold text-center flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              Falar com especialista no WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
