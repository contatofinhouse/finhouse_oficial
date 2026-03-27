"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, User, Instagram, MessageCircle } from "lucide-react";

const WHATSAPP_LINK = "https://wa.me/5511955842951";
const INSTAGRAM_LINK = "https://instagram.com/finhouse_oficial";

const NAV_ITEMS = [
    { label: "Início", href: "/" },
    { label: "Imóveis", href: "/imoveis" },
    { label: "Indicação", href: "/#indicacao" },
    { label: "Parceiros", href: "/parceiros" },
    { label: "Financiamento", href: "/#financiamento" },
    { label: "Contas a Receber", href: "/receivables" },
];

export default function Header() {
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handler);
        return () => window.removeEventListener("scroll", handler);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? "bg-white/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.08)]"
                : "bg-white"
                }`}
        >
            <div className="max-w-[1280px] mx-auto flex items-center justify-between px-6 h-[72px]">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 shrink-0">
                    <Image src="/logo.png" alt="finHouse" width={32} height={32} className="rounded-lg" />
                    <span className="text-[19px] font-semibold tracking-[-0.02em] text-[#222]">
                        finHouse
                    </span>
                </Link>

                {/* Desktop Nav — centered */}
                <nav className="hidden lg:flex items-center gap-1">
                    {NAV_ITEMS.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="px-4 py-2 rounded-full text-[14px] font-medium text-[#717171] hover:text-[#222] hover:bg-[#f7f7f7] transition-all duration-200"
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                {/* Right side */}
                <div className="hidden lg:flex items-center gap-2">
                    <a
                        href={INSTAGRAM_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-full text-[#717171] hover:text-[#222] hover:bg-[#f7f7f7] transition-all"
                        aria-label="Instagram"
                    >
                        <Instagram className="w-[18px] h-[18px]" />
                    </a>
                    <a
                        href={WHATSAPP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-full text-[#717171] hover:text-[#222] hover:bg-[#f7f7f7] transition-all"
                        aria-label="WhatsApp"
                    >
                        <MessageCircle className="w-[18px] h-[18px]" />
                    </a>

                    {/* User menu — Airbnb style */}
                    {user ? (
                        <div className="flex items-center gap-2 ml-1">
                            <Link href="/dashboard">
                                <div className="flex items-center gap-2 border border-[#ddd] rounded-full py-1.5 px-3 hover:shadow-md transition-shadow cursor-pointer">
                                    <Menu className="w-4 h-4 text-[#717171]" />
                                    <div className="w-7 h-7 rounded-full bg-[#222] flex items-center justify-center">
                                        <span className="text-white text-xs font-semibold">{user.username[0].toUpperCase()}</span>
                                    </div>
                                </div>
                            </Link>
                            <button
                                onClick={logout}
                                className="text-[13px] text-[#717171] hover:text-[#222] hover:underline transition-colors"
                            >
                                Sair
                            </button>
                        </div>
                    ) : (
                        <Link href="/login">
                            <div className="flex items-center gap-2 border border-[#ddd] rounded-full py-1.5 px-3 hover:shadow-md transition-shadow cursor-pointer">
                                <Menu className="w-4 h-4 text-[#717171]" />
                                <div className="w-7 h-7 rounded-full bg-[#717171] flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </Link>
                    )}
                </div>

                {/* Mobile hamburger */}
                <button
                    className="lg:hidden p-2 rounded-full hover:bg-[#f7f7f7] text-[#222] transition-colors"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Menu"
                >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="lg:hidden bg-white border-t border-[#ebebeb] animate-fade-up">
                    <nav className="flex flex-col p-4 max-w-md mx-auto">
                        {NAV_ITEMS.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className="px-4 py-3 text-[15px] font-medium text-[#222] hover:bg-[#f7f7f7] rounded-xl transition-colors"
                            >
                                {item.label}
                            </a>
                        ))}
                        {user ? (
                            <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-[15px] font-medium text-[#222] hover:bg-[#f7f7f7] rounded-xl transition-colors">
                                Meu Painel
                            </Link>
                        ) : (
                            <Link href="/login" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-[15px] font-medium text-[#222] hover:bg-[#f7f7f7] rounded-xl transition-colors">
                                Entrar / Login
                            </Link>
                        )}
                        <hr className="my-3 border-[#ebebeb]" />
                        <a
                            href={WHATSAPP_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mx-4 my-1 py-3 rounded-xl bg-[#25D366] text-white text-center text-[15px] font-semibold hover:bg-[#22c35e] transition-colors flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-5 h-5 text-white" /> Fale pelo WhatsApp
                        </a>
                        {user && (
                            <button
                                onClick={() => { logout(); setMobileOpen(false); }}
                                className="mx-4 mt-2 py-3 rounded-xl border border-red-50 text-[#717171] hover:text-red-500 hover:bg-red-50 transition-colors text-[14px]"
                            >
                                Sair da conta
                            </button>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
