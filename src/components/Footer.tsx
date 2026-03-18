"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const WA = "https://wa.me/5511955842951";

export default function Footer() {
    return (
        <footer className="border-t border-[#ebebeb] bg-[#f7f7f7]">
            <div className="max-w-[1280px] mx-auto px-6 py-12">
                <div className="grid md:grid-cols-5 gap-8 mb-10">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2.5 mb-2">
                            <Image src="/logo.png" alt="finHouse" width={32} height={32} className="rounded-lg" />
                            <span className="text-[17px] font-bold text-[#222]">finHouse. <span className="text-[14px] font-medium text-[#717171] uppercase tracking-[0.2em] ml-2 underline decoration-amber-400 decoration-2 underline-offset-4">vende melhor.</span></span>
                        </div>
                        <p className="text-[14px] text-[#717171] leading-relaxed max-w-sm">
                            Seu portal de imóveis e assessoria em financiamentos. Curadoria de imóveis e soluções de crédito com inteligência e transparência.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-[14px] font-semibold text-[#222] mb-4">Navegação</h4>
                        <ul className="space-y-2.5">
                            {[
                                { label: "Imóveis", href: "/imoveis" },
                                { label: "Indicação", href: "/#indicacao" },
                                { label: "Financiamento", href: "/#financiamento" },
                                { label: "Painel do Corretor", href: "/login" },
                            ].map((l) => (
                                <li key={l.label}>
                                    <Link href={l.href} className="text-[14px] text-[#717171] hover:text-[#222] transition-colors">{l.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-[14px] font-semibold text-[#222] mb-4">Contato</h4>
                        <ul className="space-y-2.5">
                            <li>
                                <a href={WA} target="_blank" rel="noopener noreferrer" className="text-[14px] text-[#717171] hover:text-[#222] transition-colors font-medium">
                                    (11) 95584-2951
                                </a>
                            </li>
                            <li>
                                <a href="https://instagram.com/finhouse_oficial" target="_blank" rel="noopener noreferrer" className="text-[14px] text-[#717171] hover:text-[#222] transition-colors">
                                    @finhouse_oficial
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-[14px] font-semibold text-[#222] mb-4">Legal</h4>
                        <ul className="space-y-2.5">
                            {[
                                { label: "Termos e Condições", href: "/termos-e-condicoes" },
                                { label: "Segurança e LGPD", href: "/lgpd" },
                            ].map((l) => (
                                <li key={l.label}>
                                    <a href={l.href} className="text-[14px] text-[#717171] hover:text-[#222] transition-colors">{l.label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-[#ebebeb] pt-8 flex flex-col items-center gap-4">
                    <div className="max-w-2xl text-center">
                        <p className="text-[12px] text-[#b0b0b0] leading-relaxed">
                            finHouse · CNPJ: 60.806.192/0001-50<br />
                            A finHouse é um correspondente bancário e não uma instituição financeira. Não cobramos qualquer taxa ou comissão de nossos clientes.
                        </p>
                    </div>
                    <p className="text-[11px] text-[#ddd] font-medium tracking-widest lowercase underline decoration-[#eee] underline-offset-4">© {new Date().getFullYear()} finHouse · vende melhor.</p>
                </div>
            </div>
        </footer>
    );
}
