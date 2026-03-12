"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowRight, Building2 } from "lucide-react";

const WA = "https://wa.me/5511955842951";

interface SimulationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function SimulationModal({ open, onOpenChange }: SimulationModalProps) {
    const [propertyValue, setPropertyValue] = useState(500000);
    const [downPayment, setDownPayment] = useState(100000);
    const [years, setYears] = useState(30);
    const financed = propertyValue - downPayment;
    const rate = 0.0085; // ~10.2% a.a.
    const months = years * 12;
    const monthly = financed > 0
        ? (financed * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1)
        : 0;

    const fmt = (val: number) =>
        val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

    const handleWhatsApp = () => {
        const msg = `Olá! Gostaria de saber mais sobre financiamento. Simulei um imóvel de ${fmt(propertyValue)} com entrada de ${fmt(downPayment)} em ${years} anos.`;
        window.open(`${WA}?text=${encodeURIComponent(msg)}`, "_blank");
    };

    const banks = [
        { name: "Itaú", color: "#EC7000" },
        { name: "Inter", color: "#FF7A00" },
        { name: "Bradesco", color: "#CC092F" },
        { name: "Santander", color: "#EC0000" },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-md rounded-[32px] border-[#ebebeb] p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
                <div className="p-5 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-[20px] md:text-[24px] font-extrabold text-[#222] tracking-tight">
                            Simulação Instantânea
                        </DialogTitle>
                        <DialogDescription className="text-[14px] text-[#717171]">
                            Ajuste os valores para ver a parcela na hora.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-8">
                        {/* Property Value */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <Label className="text-[13px] font-bold text-[#222] uppercase tracking-wider">Valor do Imóvel</Label>
                                <span className="text-[18px] font-bold text-[#222] bg-[#f7f7f7] px-3 py-1 rounded-lg border border-[#eee]">{fmt(propertyValue)}</span>
                            </div>
                            <input
                                type="range"
                                min="100000"
                                max="5000000"
                                step="10000"
                                value={propertyValue}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setPropertyValue(val);
                                    if (downPayment > val) setDownPayment(val);
                                }}
                                className="w-full h-2 bg-[#eee] rounded-lg appearance-none cursor-pointer accent-[#222]"
                            />
                        </div>

                        {/* Down Payment */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <Label className="text-[13px] font-bold text-[#222] uppercase tracking-wider">Entrada</Label>
                                <span className="text-[18px] font-bold text-[#222] bg-[#f7f7f7] px-3 py-1 rounded-lg border border-[#eee]">{fmt(downPayment)}</span>
                            </div>
                            <input
                                type="range"
                                min="20000"
                                max={propertyValue}
                                step="5000"
                                value={downPayment}
                                onChange={(e) => setDownPayment(parseInt(e.target.value))}
                                className="w-full h-2 bg-[#eee] rounded-lg appearance-none cursor-pointer accent-[#222]"
                            />
                            <p className="text-[11px] text-[#717171] text-right">Mínimo sugerido: {fmt(propertyValue * 0.2)} (20%)</p>
                        </div>

                        {/* Years */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <Label className="text-[13px] font-bold text-[#222] uppercase tracking-wider">Prazo</Label>
                                <span className="text-[18px] font-bold text-[#222] bg-[#f7f7f7] px-3 py-1 rounded-lg border border-[#eee]">{years} anos</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="35"
                                step="1"
                                value={years}
                                onChange={(e) => setYears(parseInt(e.target.value))}
                                className="w-full h-2 bg-[#eee] rounded-lg appearance-none cursor-pointer accent-[#222]"
                            />
                        </div>
                    </div>

                    {/* Result Card */}
                    <div className="p-6 rounded-3xl bg-[#222] text-white space-y-4 shadow-xl shadow-black/10">
                        <div className="flex justify-between items-center">
                            <span className="text-[14px] text-white/70">Parcela mensal</span>
                            <span className="text-[28px] font-extrabold">{fmt(monthly)}</span>
                        </div>
                        <div className="h-px bg-white/10 w-full" />
                        <div className="flex justify-between items-center">
                            <span className="text-[13px] text-white/50">Total financiado</span>
                            <span className="text-[15px] font-semibold">{fmt(propertyValue - downPayment)}</span>
                        </div>
                        <button
                            onClick={handleWhatsApp}
                            className="w-full py-4 rounded-2xl bg-white text-[#222] text-[15px] font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            Solicitar Análise Grátis <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Partner Banks */}
                    <div className="pt-2">
                        <p className="text-[11px] font-bold text-[#b0b0b0] uppercase tracking-[0.1em] text-center mb-4">Principais Bancos Parceiros</p>
                        <div className="flex justify-around items-center opacity-70 grayscale hover:grayscale-0 transition-all px-1">
                            {banks.map((bank) => (
                                <div key={bank.name} className="flex flex-col items-center gap-1 group">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-[#222]/20 transition-all">
                                        <Building2 className="w-5 h-5" style={{ color: bank.color }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-[#717171]">{bank.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
