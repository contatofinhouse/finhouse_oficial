"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

function LoginForm() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { error: loginError } = await login(email, password);

        if (!loginError) {
            router.push("/dashboard");
        } else {
            setError(loginError === "Invalid login credentials" ? "E-mail ou senha inválidos." : loginError);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7]">
            <div className="w-full max-w-[420px] px-6">
                {/* Back */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[14px] text-[#717171] hover:text-[#222] mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao site
                </Link>

                <div className="bg-white rounded-3xl border border-[#ebebeb] shadow-sm p-8 md:p-10">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <Link href="/">
                            <Image src="/logo.png" alt="FinHouse" width={56} height={56} className="rounded-xl mx-auto mb-4" />
                        </Link>
                        <h1 className="text-[24px] font-bold text-[#222] tracking-[-0.02em]">Bem-vindo de volta</h1>
                        <p className="text-[14px] text-[#717171] mt-1">Acesse seu painel FinHouse</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[13px] font-semibold text-[#222]">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="rounded-xl h-12 border-[#ddd] text-[15px] focus:border-[#222] focus:ring-[#222]"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-[13px] font-semibold text-[#222]">Senha</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPass ? "text" : "password"}
                                    placeholder="Sua senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="rounded-xl h-12 border-[#ddd] text-[15px] pr-11 focus:border-[#222] focus:ring-[#222]"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b0b0b0] hover:text-[#222] transition-colors"
                                >
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-full bg-[#222] text-white text-[15px] font-semibold hover:bg-[#333] disabled:opacity-50 transition-colors flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Entrar"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <LoginForm />
    );
}
