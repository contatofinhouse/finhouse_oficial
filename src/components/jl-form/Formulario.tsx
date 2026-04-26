"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Save, CheckCircle2, ChevronRight, ChevronLeft, UploadCloud, File, Trash2, MapPin } from 'lucide-react';
import { formatTelefone, formatCEP, formatCurrency, formatDate, isValidCEP } from '@/lib/formatters';

interface FormularioProps {
  cpf: string;
  initialData: any;
}

const STEPS = [
  { id: 1, title: 'Dados Pessoais' },
  { id: 2, title: 'Endereço' },
  { id: 3, title: 'Profissional e Renda' },
  { id: 4, title: 'Cônjuge' },
  { id: 5, title: 'Imóvel' },
  { id: 6, title: 'Documentos' },
];

export function Formulario({ cpf, initialData }: FormularioProps) {
  const [formData, setFormData] = useState<any>(initialData || {});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [currentStep, setCurrentStep] = useState(1);
  const [cepLoading, setCepLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Formatters mapping
  const formatField = (field: string, value: string) => {
    if (!value) return '';
    if (field.includes('telefone') || field.includes('celular')) return formatTelefone(value);
    if (field.includes('cep')) return formatCEP(value);
    if (field.includes('renda')) return formatCurrency(value);
    if (field.includes('data_nascimento')) return formatDate(value);
    return value;
  };

  const handleChange = (field: string, value: string) => {
    const formattedValue = formatField(field, value);
    setFormData((prev: any) => ({ ...prev, [field]: formattedValue }));
    setSaveStatus('saving');
    
    // Auto-fetch CEP
    if (field === 'endereco_cep' && isValidCEP(formattedValue)) {
      fetchViaCep(formattedValue.replace(/\D/g, ''));
    }
  };

  const fetchViaCep = async (cleanCep: string) => {
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData((prev: any) => ({
          ...prev,
          endereco_logradouro: data.logradouro,
          endereco_bairro: data.bairro,
          endereco_cidade: data.localidade,
          endereco_estado: data.uf,
        }));
        setSaveStatus('saving');
      }
    } catch (err) {
      console.error("Erro ViaCEP", err);
    } finally {
      setCepLoading(false);
    }
  };

  const saveToSupabase = useCallback(async (dataToSave: any) => {
    try {
      // Prepara os dados para o formato esperado pelo PostgreSQL
      const cleanData = { ...dataToSave };

      const parseDate = (d: string) => {
        if (!d || d.length !== 10) return null; // Evita salvar datas incompletas
        if (d.includes('/')) {
          const [dia, mes, ano] = d.split('/');
          return `${ano}-${mes}-${dia}`;
        }
        return d;
      };

      const parseCurrency = (c: string) => {
        if (!c) return null;
        // R$ 5.000,00 -> 5000.00
        const strNum = c.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        return parseFloat(strNum) || null;
      };

      if (cleanData.data_nascimento) cleanData.data_nascimento = parseDate(cleanData.data_nascimento);
      if (cleanData.conjuge_data_nascimento) cleanData.conjuge_data_nascimento = parseDate(cleanData.conjuge_data_nascimento);
      
      if (cleanData.renda_mensal_bruta) cleanData.renda_mensal_bruta = parseCurrency(cleanData.renda_mensal_bruta);
      if (cleanData.conjuge_renda_mensal_bruta) cleanData.conjuge_renda_mensal_bruta = parseCurrency(cleanData.conjuge_renda_mensal_bruta);

      if (cleanData.tempo_trabalho_anos === '') cleanData.tempo_trabalho_anos = null;
      if (cleanData.tempo_trabalho_meses === '') cleanData.tempo_trabalho_meses = null;

      const { error } = await supabase
        .from('leads_jl')
        .update({
          ...cleanData,
          updated_at: new Date().toISOString(),
        })
        .eq('cpf', cpf);

      if (error) throw error;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSaveStatus('idle');
    }
  }, [cpf]);

  useEffect(() => {
    if (saveStatus !== 'saving') return;
    const timer = setTimeout(() => {
      saveToSupabase(formData);
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData, saveStatus, saveToSupabase]);

  // File Upload Logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${cpf}/${docType}-${Math.random()}.${fileExt}`;

    try {
      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('documentos_leads')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('documentos_leads')
        .getPublicUrl(fileName);

      // 3. Update Form Data (JSONB field)
      const currentDocs = formData.documentos || {};
      const updatedDocs = { ...currentDocs, [docType]: publicUrlData.publicUrl };
      
      setFormData((prev: any) => ({ ...prev, documentos: updatedDocs }));
      setSaveStatus('saving');

    } catch (error) {
      console.error("Erro no upload", error);
      alert("Erro ao fazer upload. Verifique se o Bucket 'documentos_leads' existe e é público.");
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (docType: string) => {
    const currentDocs = formData.documentos || {};
    const updatedDocs = { ...currentDocs };
    delete updatedDocs[docType];
    setFormData((prev: any) => ({ ...prev, documentos: updatedDocs }));
    setSaveStatus('saving');
  };

  // Step navigation helpers
  const isSpouseRequired = formData.estado_civil === 'Casado(a)' || formData.estado_civil === 'União estável';
  const visibleSteps = STEPS.filter(s => s.id !== 4 || isSpouseRequired);
  const currentVisibleIndex = visibleSteps.findIndex(s => s.id === currentStep);

  const nextStep = () => {
    const currentIndex = visibleSteps.findIndex(s => s.id === currentStep);
    if (currentIndex < visibleSteps.length - 1) {
      setCurrentStep(visibleSteps[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = visibleSteps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(visibleSteps[currentIndex - 1].id);
    }
  };

  // Auto-skip spouse step if marital status changes
  useEffect(() => {
    if (currentStep === 4 && !isSpouseRequired) {
      setCurrentStep(5);
    }
  }, [formData.estado_civil, currentStep, isSpouseRequired]);

  // Progress Bar Width
  const progress = (currentVisibleIndex / (visibleSteps.length - 1)) * 100;

  if (isFinished) {
    return (
      <div 
        className="min-h-screen relative flex flex-col items-center justify-center p-4"
      >
        {/* Imagem de Fundo com Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-15"
          style={{ backgroundImage: "url('/bg_imovel.png')" }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/80 to-background/50" />

        <div className="relative z-10 max-w-lg w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="mb-2">
              <img src="/logo.png" alt="Finhouse" className="h-12 object-contain" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">Cadastro enviado</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Nossa equipe recebeu seus dados e documentos com sucesso. 
                Realizaremos a análise e entraremos em contato em breve.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-background/60 backdrop-blur-md shadow-xl overflow-hidden">
            <div className="flex flex-col space-y-1.5 p-6 border-b border-border/50 bg-muted/20">
              <h3 className="font-semibold leading-none tracking-tight">Soluções Finhouse</h3>
              <p className="text-sm text-muted-foreground">
                Conheça outras formas que ajudamos nossos clientes a realizar negócios.
              </p>
            </div>
            <div className="p-0">
              <div className="grid grid-cols-1 divide-y divide-border/50">
                <a href="https://finhousebr.com.br" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Financiamento Imobiliário</p>
                    <p className="text-sm text-muted-foreground">As melhores taxas para seu imóvel</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </a>
                <a href="https://finhousebr.com.br" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Financiamento de Veículos</p>
                    <p className="text-sm text-muted-foreground">Crédito rápido e sem burocracia</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </a>
                <a href="https://finhousebr.com.br" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Consórcios</p>
                    <p className="text-sm text-muted-foreground">Planejamento inteligente para o futuro</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-4">
            <Button asChild className="w-full h-11 shadow-md">
              <a href="https://finhousebr.com.br" target="_blank" rel="noopener noreferrer">
                Acessar finhousebr.com.br
              </a>
            </Button>
            <Button variant="ghost" onClick={() => window.location.reload()} className="text-xs text-muted-foreground hover:bg-background/50">
              Voltar ao formulário
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-12 font-sans text-foreground">
      {/* Header Status & Progress */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
        <div className="px-4 py-3 max-w-3xl mx-auto flex justify-between items-center">
          <div className="font-bold text-lg text-primary tracking-tight">Ficha Cadastral</div>
          <div className="flex items-center text-sm font-medium transition-all duration-300">
            {saveStatus === 'saving' && (
              <span className="flex items-center text-muted-foreground"><Save className="mr-2 h-4 w-4 animate-pulse" />Salvando...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center text-emerald-600"><CheckCircle2 className="mr-2 h-4 w-4" />Salvo</span>
            )}
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-secondary h-1.5">
          <div className="bg-primary h-1.5 transition-all duration-500 ease-in-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 mt-6">
        {/* Etapas Indicator */}
        <div className="mb-8 hidden sm:flex justify-between text-sm font-medium text-muted-foreground">
          {visibleSteps.map((step, index) => (
            <div key={step.id} className={`flex flex-col items-center gap-2 ${currentStep === step.id ? 'text-primary' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${currentVisibleIndex >= index ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'}`}>
                {index + 1}
              </div>
              <span className="text-xs hidden md:block">{step.title}</span>
            </div>
          ))}
        </div>

        <Card className="border-t-4 border-t-primary shadow-lg bg-card transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl">{STEPS[currentStep-1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Informações básicas sobre você."}
              {currentStep === 2 && "Onde você mora atualmente."}
              {currentStep === 3 && "Sua ocupação e comprovantes de renda."}
              {currentStep === 4 && "Preencha apenas se for casado(a) ou em união estável."}
              {currentStep === 5 && "Informações sobre a locação."}
              {currentStep === 6 && "Anexos obrigatórios para análise de crédito."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* STEP 1: DADOS PESSOAIS */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome completo</Label><Input value={formData.nome_completo || ''} onChange={(e) => handleChange('nome_completo', e.target.value)} /></div>
                <div className="space-y-2"><Label>CPF</Label><Input value={cpf} disabled className="bg-muted text-muted-foreground font-mono" /></div>
                <div className="space-y-2"><Label>RG</Label><Input value={formData.rg || ''} onChange={(e) => handleChange('rg', e.target.value)} /></div>
                <div className="space-y-2"><Label>Órgão Expedidor</Label><Input value={formData.orgao_expedidor || ''} onChange={(e) => handleChange('orgao_expedidor', e.target.value)} /></div>
                <div className="space-y-2"><Label>Data de Nascimento</Label><Input placeholder="DD/MM/AAAA" value={formData.data_nascimento || ''} onChange={(e) => handleChange('data_nascimento', e.target.value)} /></div>
                <div className="space-y-2"><Label>Nacionalidade</Label><Input value={formData.nacionalidade || ''} onChange={(e) => handleChange('nacionalidade', e.target.value)} /></div>
                <div className="space-y-2"><Label>Naturalidade</Label><Input value={formData.naturalidade || ''} onChange={(e) => handleChange('naturalidade', e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Estado Civil</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.estado_civil || ''} onChange={(e) => handleChange('estado_civil', e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="Solteiro(a)">Solteiro(a)</option><option value="Casado(a)">Casado(a)</option><option value="União estável">União estável</option><option value="Divorciado(a)">Divorciado(a)</option><option value="Viúvo(a)">Viúvo(a)</option>
                  </select>
                </div>
                <div className="space-y-2"><Label>Profissão</Label><Input value={formData.profissao || ''} onChange={(e) => handleChange('profissao', e.target.value)} /></div>
                <div className="space-y-2"><Label>Telefone Celular</Label><Input placeholder="(00) 00000-0000" value={formData.telefone_celular || ''} onChange={(e) => handleChange('telefone_celular', e.target.value)} /></div>
                <div className="space-y-2 md:col-span-2"><Label>E-mail</Label><Input type="email" value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} /></div>
              </div>
            )}

            {/* STEP 2: ENDEREÇO */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2 relative">
                  <Label>CEP</Label>
                  <div className="relative">
                    <Input placeholder="00000-000" value={formData.endereco_cep || ''} onChange={(e) => handleChange('endereco_cep', e.target.value)} className="pr-10" />
                    {cepLoading && <MapPin className="absolute right-3 top-3 h-4 w-4 animate-bounce text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">O endereço é preenchido automaticamente ao digitar o CEP.</p>
                </div>
                <div className="space-y-2 md:col-span-2"><Label>Logradouro (Rua, Av, Número, Compl.)</Label><Input value={formData.endereco_logradouro || ''} onChange={(e) => handleChange('endereco_logradouro', e.target.value)} /></div>
                <div className="space-y-2"><Label>Bairro</Label><Input value={formData.endereco_bairro || ''} onChange={(e) => handleChange('endereco_bairro', e.target.value)} /></div>
                <div className="space-y-2"><Label>Cidade</Label><Input value={formData.endereco_cidade || ''} onChange={(e) => handleChange('endereco_cidade', e.target.value)} /></div>
                <div className="space-y-2"><Label>Estado (UF)</Label><Input maxLength={2} value={formData.endereco_estado || ''} onChange={(e) => handleChange('endereco_estado', e.target.value)} /></div>
              </div>
            )}

            {/* STEP 3: PROFISSIONAL E RENDA */}
            {currentStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Situação Profissional</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.situacao_profissional || ''} onChange={(e) => handleChange('situacao_profissional', e.target.value)}>
                    <option value="">Selecione...</option><option value="Empregado CLT">Empregado CLT</option><option value="Autônomo">Autônomo</option><option value="Empresário">Empresário</option><option value="Aposentado">Aposentado</option><option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-2"><Label>Empresa/Empregador</Label><Input value={formData.empresa || ''} onChange={(e) => handleChange('empresa', e.target.value)} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Endereço Comercial</Label><Input value={formData.endereco_comercial || ''} onChange={(e) => handleChange('endereco_comercial', e.target.value)} /></div>
                <div className="space-y-2"><Label>Cargo/Função</Label><Input value={formData.cargo || ''} onChange={(e) => handleChange('cargo', e.target.value)} /></div>
                <div className="space-y-2"><Label>Telefone Comercial</Label><Input placeholder="(00) 0000-0000" value={formData.telefone_comercial || ''} onChange={(e) => handleChange('telefone_comercial', e.target.value)} /></div>
                <div className="space-y-2"><Label>Tempo de Trabalho (Anos)</Label><Input type="number" value={formData.tempo_trabalho_anos || ''} onChange={(e) => handleChange('tempo_trabalho_anos', e.target.value)} /></div>
                <div className="space-y-2"><Label>Tempo de Trabalho (Meses)</Label><Input type="number" value={formData.tempo_trabalho_meses || ''} onChange={(e) => handleChange('tempo_trabalho_meses', e.target.value)} /></div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-primary font-bold">Renda Mensal Bruta (R$)</Label>
                  <Input className="text-lg font-semibold bg-primary/5" placeholder="R$ 0,00" value={formData.renda_mensal_bruta || ''} onChange={(e) => handleChange('renda_mensal_bruta', e.target.value)} />
                </div>
              </div>
            )}

            {/* STEP 4: CONJUGE */}
            {currentStep === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2"><Label>Nome Completo do Cônjuge</Label><Input value={formData.conjuge_nome_completo || ''} onChange={(e) => handleChange('conjuge_nome_completo', e.target.value)} /></div>
                <div className="space-y-2"><Label>CPF</Label><Input value={formData.conjuge_cpf || ''} onChange={(e) => handleChange('conjuge_cpf', e.target.value)} /></div>
                <div className="space-y-2"><Label>RG</Label><Input value={formData.conjuge_rg || ''} onChange={(e) => handleChange('conjuge_rg', e.target.value)} /></div>
                <div className="space-y-2"><Label>Data de Nascimento</Label><Input placeholder="DD/MM/AAAA" value={formData.conjuge_data_nascimento || ''} onChange={(e) => handleChange('conjuge_data_nascimento', e.target.value)} /></div>
                <div className="space-y-2"><Label>Nacionalidade</Label><Input value={formData.conjuge_nacionalidade || ''} onChange={(e) => handleChange('conjuge_nacionalidade', e.target.value)} /></div>
                <div className="space-y-2"><Label>Profissão</Label><Input value={formData.conjuge_profissao || ''} onChange={(e) => handleChange('conjuge_profissao', e.target.value)} /></div>
                <div className="space-y-2"><Label>Empresa</Label><Input value={formData.conjuge_empresa || ''} onChange={(e) => handleChange('conjuge_empresa', e.target.value)} /></div>
                <div className="space-y-2"><Label>Telefone Celular</Label><Input value={formData.conjuge_telefone_celular || ''} onChange={(e) => handleChange('conjuge_telefone_celular', e.target.value)} /></div>
                <div className="space-y-2"><Label>Renda Mensal Bruta (R$)</Label><Input value={formData.conjuge_renda_mensal_bruta || ''} onChange={(e) => handleChange('conjuge_renda_mensal_bruta', e.target.value)} /></div>
              </div>
            )}

            {/* STEP 5: IMÓVEL */}
            {currentStep === 5 && (
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Quem vai morar no apartamento?</Label>
                  <textarea 
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Descreva as pessoas, grau de parentesco, animais de estimação, etc."
                    value={formData.quem_vai_morar || ''}
                    onChange={(e) => handleChange('quem_vai_morar', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidade Pretendida (se souber)</Label>
                  <Input placeholder="Ex: Apto 101" value={formData.unidade_pretendida || ''} onChange={(e) => handleChange('unidade_pretendida', e.target.value)} />
                </div>
              </div>
            )}

            {/* STEP 6: UPLOADS */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="bg-blue-50 text-blue-800 p-4 rounded-md text-sm mb-4 border border-blue-200">
                  <p>Por favor, anexe os documentos legíveis. Formatos aceitos: PDF, JPG, PNG.</p>
                </div>

                {['RG (Frente e Verso)', 'CPF', 'Comprovante de Residência (Máx 90 dias)', 'Comprovantes de Renda'].map(docLabel => {
                  const docKey = docLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
                  const docUrl = formData.documentos?.[docKey];

                  return (
                    <div key={docKey} className="border p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30">
                      <div className="space-y-1">
                        <Label className="font-semibold text-base">{docLabel}</Label>
                        <p className="text-xs text-muted-foreground">Obrigatório</p>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {docUrl ? (
                          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-md border border-emerald-200">
                            <File className="h-4 w-4" />
                            <span className="text-xs font-medium truncate max-w-[150px]">Enviado</span>
                            <button onClick={() => removeDocument(docKey)} className="ml-2 hover:bg-emerald-100 p-1 rounded-md text-emerald-900 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative group">
                            <Input 
                              type="file" 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                              onChange={(e) => handleFileUpload(e, docKey)}
                              disabled={uploading}
                            />
                            <Button variant="outline" className="w-full sm:w-auto pointer-events-none group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                              <UploadCloud className="mr-2 h-4 w-4" /> 
                              {uploading ? 'Enviando...' : 'Anexar Arquivo'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-6 bg-muted/10">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            
            {currentStep < STEPS.length ? (
              <Button onClick={nextStep}>
                Próximo <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => setIsFinished(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Finalizar Cadastro <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
