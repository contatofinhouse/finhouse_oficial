"use client";

import { useState } from 'react';
import { Identificacao } from '@/components/jl-form/Identificacao';
import { Formulario } from '@/components/jl-form/Formulario';

export default function LeadPage() {
  const [cpf, setCpf] = useState<string | null>(null);
  const [leadData, setLeadData] = useState<any>(null);

  const handleIdentificacaoSuccess = (cleanCpf: string, data: any) => {
    setCpf(cleanCpf);
    setLeadData(data);
  };

  return (
    <main className="min-h-screen">
      {!cpf ? (
        <Identificacao onSuccess={handleIdentificacaoSuccess} />
      ) : (
        <Formulario cpf={cpf} initialData={leadData} />
      )}
    </main>
  );
}
