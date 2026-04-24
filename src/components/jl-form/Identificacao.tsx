"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

interface IdentificacaoProps {
  onSuccess: (cpf: string, data: any) => void;
}

export function Identificacao({ onSuccess }: IdentificacaoProps) {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCPF = (v: string) => {
    v = v.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return v;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, '');
    
    if (cleanCpf.length !== 11) {
      setError("CPF inválido. Digite os 11 dígitos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Tentar buscar lead existente
      const { data, error: fetchError } = await supabase
        .from('leads_jl')
        .select('*')
        .eq('cpf', cleanCpf)
        .single();

      if (data) {
        onSuccess(cleanCpf, data);
        return;
      }

      // 2. Se não existir, criar novo lead (fricção zero)
      const { data: newData, error: insertError } = await supabase
        .from('leads_jl')
        .insert([{ cpf: cleanCpf }])
        .select()
        .single();

      if (insertError) {
        console.error("Erro na inserção", insertError);
        // Caso falhe por unicidade enquanto tentava criar (concorrência)
        if (insertError.code === '23505') {
          const { data: retryData } = await supabase.from('leads_jl').select('*').eq('cpf', cleanCpf).single();
          onSuccess(cleanCpf, retryData);
        } else {
          throw insertError;
        }
      } else {
        onSuccess(cleanCpf, newData);
      }
    } catch (err: any) {
      console.error("Erro completo:", err);
      setError(`Erro do servidor: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
       {/* Background subtle effect */}
       <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: "url('/bg_imovel.png')", backgroundSize: 'cover' }} />
       
       <Card className="w-full max-w-md shadow-2xl border-primary/10 relative z-10 backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
             <img src="/logo.png" alt="Finhouse" className="h-10 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Ficha Cadastral</CardTitle>
          <CardDescription>
            Digite seu CPF para iniciar ou retomar seu preenchimento.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2 border border-destructive/20 animate-in fade-in zoom-in-95">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCpfChange}
                className="text-lg text-center font-mono py-6 tracking-widest focus:ring-primary h-14"
                disabled={loading}
                autoFocus
              />
            </div>
          </CardContent>
          <CardFooter className="pt-2 pb-8">
            <Button className="w-full h-12 text-base font-semibold group" disabled={loading || cpf.length < 14}>
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>Continuar <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
