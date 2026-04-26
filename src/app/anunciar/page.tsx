"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ArrowRight, ArrowLeft, Home, MapPin, BadgeDollarSign, 
  CheckCircle2, Briefcase, Zap, ShieldCheck, Phone,
  UploadCloud, Trash2, Star, Loader2, Search, Scale,
  Building2, CalendarCheck, FileText, Users, Wrench, Receipt,
  Rocket
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Listing } from "@/contexts/ListingsContext";

type Step = 1 | 2 | 3 | 4;

const maskPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const maskCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const BrandBenefits = ({ isMobile = false }: { isMobile?: boolean }) => {
  const items = [
    {
      icon: Rocket,
      title: "Visibilidade Total",
      desc: "Anunciamos nos 4 maiores portais (ZAP, VivaReal, OLX e ImovelWeb).",
      color: "bg-blue-50 text-blue-600"
    },
    {
      icon: Zap,
      title: "Crédito Integrado",
      desc: "Financiamento e Consórcio para facilitar a vida do seu comprador.",
      color: "bg-amber-50 text-amber-600"
    },
    {
      icon: ShieldCheck,
      title: "Assessoria Jurídica",
      desc: "Cuidamos de toda a documentação e segurança do negócio.",
      color: "bg-emerald-50 text-emerald-600"
    }
  ];

  if (isMobile) {
    return (
      <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-6 px-6">
        {items.map((item, i) => (
          <div key={i} className="min-w-[280px] bg-white p-5 rounded-2xl border border-[#ebebeb] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${item.color}`}><item.icon className="w-4 h-4" /></div>
              <h4 className="font-bold text-[14px] text-[#222]">{item.title}</h4>
            </div>
            <p className="text-[13px] text-[#717171] leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-8 rounded-[32px] border border-[#ebebeb] shadow-sm">
        <h3 className="text-[18px] font-black text-[#222] mb-6 uppercase tracking-widest">Por que finHouse?</h3>
        <div className="space-y-8">
          {items.map((item, i) => (
            <div key={i} className="flex gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-[15px] text-[#222] mb-1">{item.title}</h4>
                <p className="text-[14px] text-[#717171] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#222] p-8 rounded-[32px] text-white">
        <p className="text-amber-400 font-black text-[11px] uppercase tracking-widest mb-2">Zero Custo Fixo</p>
        <p className="text-[14px] text-white/70">Você só paga a comissão se o negócio for fechado. Sem letras miúdas.</p>
      </div>
    </div>
  );
};

export default function AnunciarWizard() {
  const router = useRouter();
  const { login, user } = useAuth();
  
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepStatus, setCepStatus] = useState<'idle' | 'found' | 'notfound'>('idle');
  const [manualAddress, setManualAddress] = useState(false);
  const [tempUser, setTempUser] = useState<{ id: string; email: string } | null>(null);

  // Formulário do Imóvel
  const [propertyData, setPropertyData] = useState({
    title: "",
    description: "",
    type: "venda",
    propertyType: "Apartamento",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    uf: "",
    address: "",
    price: "",
    condominium: "",
    iptu: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    parking: "",
    acceptsExchange: false,
  });

  // ViaCEP integration
  const fetchCep = useCallback(async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    setCepStatus('idle');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepStatus('notfound');
        setManualAddress(true);
      } else {
        setCepStatus('found');
        setManualAddress(false);
        setPropertyData(prev => ({
          ...prev,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          uf: data.uf || "",
        }));
      }
    } catch {
      setCepStatus('notfound');
      setManualAddress(true);
    } finally {
      setCepLoading(false);
    }
  }, []);

  // Fotos — com suporte a foto de capa
  const [photos, setPhotos] = useState<{ id: string; file: File; url: string }[]>([]);
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null);

  // Formulário de Cadastro/Login
  const [authData, setAuthData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    isLogin: false
  });

  // Plano Escolhido
  const [selectedPlan, setSelectedPlan] = useState<"free" | "premium" | "legal" | null>(null);

  const formatCurrency = (v: string) => {
    const num = v.replace(/\D/g, "");
    if (!num) return "";
    return (Number(num) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };
  const parseCurrency = (v: string) => Number(v.replace(/\D/g, "")) / 100;

  const handleNextStep = () => {
    if (step === 1) {
      if (!propertyData.cep && !manualAddress) return alert("Preencha o CEP do imóvel");
      if (!propertyData.city) return alert("Informe a cidade");
      if (!propertyData.number) return alert("Informe o número do imóvel");
      if (!propertyData.price) return alert("Preencha o valor do imóvel");
      if (photos.length === 0) return alert("Envie pelo menos 1 foto do imóvel");
    }
    // Pula passo 2 se já está logado
    if (step === 1 && !!user) {
      setStep(3);
      return;
    }
    setStep((prev) => (prev + 1) as Step);
  };
  const handlePrevStep = () => {
    // Volta do passo 3 para 1 se já logado (pula 2)
    if (step === 3 && !!user) {
      setStep(1);
      return;
    }
    setStep((prev) => (prev - 1) as Step);
  };

  const processImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new (window as any).Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) return resolve(file);

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const logo = new (window as any).Image();
                logo.src = "/logo.png";
                logo.onload = () => {
                    const centerSize = Math.max(100, canvas.width * 0.25);
                    ctx.globalAlpha = 0.1;
                    ctx.drawImage(logo, (canvas.width - centerSize) / 2, (canvas.height - centerSize) / 2, centerSize, centerSize);
                    
                    const padding = canvas.width * 0.02;
                    const logoSize = Math.max(25, canvas.width * 0.035);
                    const fontSize = logoSize * 0.45;
                    ctx.globalAlpha = 0.25;
                    ctx.drawImage(logo, canvas.width - logoSize - padding, canvas.height - logoSize - padding, logoSize, logoSize);
                    
                    ctx.fillStyle = "white";
                    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
                    const text1 = "finHouse Collection";
                    const text2 = "vende melhor.";
                    const textWidth = ctx.measureText(text1).width;
                    
                    ctx.fillText(text1, canvas.width - logoSize - padding - textWidth - 8, canvas.height - padding - logoSize * 0.55);
                    ctx.font = `${fontSize * 0.7}px Inter, sans-serif`;
                    ctx.fillText(text2, canvas.width - logoSize - padding - ctx.measureText(text2).width - 8, canvas.height - padding - logoSize * 0.25);
                    
                    ctx.globalAlpha = 1.0;
                    canvas.toBlob((blob) => resolve(blob || file), file.type, 0.9);
                };
                logo.onerror = () => resolve(file);
            };
        };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const newArr = Array.from(e.target.files).map(f => ({
          id: Math.random().toString(36).substring(7),
          file: f,
          url: URL.createObjectURL(f)
      }));
      const combined = [...photos, ...newArr].slice(0, 20);
      setPhotos(combined);
      // Auto-seleciona a primeira como capa se nenhuma selecionada
      if (!coverPhotoId && combined.length > 0) setCoverPhotoId(combined[0].id);
  };

  const handleDragStart = (e: React.DragEvent, i: number) => e.dataTransfer.setData("idx", i.toString());
  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
      e.preventDefault();
      const srcIdx = parseInt(e.dataTransfer.getData("idx"));
      if (isNaN(srcIdx) || srcIdx === targetIdx) return;
      const arr = [...photos];
      const [moved] = arr.splice(srcIdx, 1);
      arr.splice(targetIdx, 0, moved);
      setPhotos(arr);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const removePhoto = (index: number) => {
    const removed = photos[index];
    if (removed && coverPhotoId === removed.id) {
      const remaining = photos.filter((_, i) => i !== index);
      setCoverPhotoId(remaining.length > 0 ? remaining[0].id : null);
    }
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (authData.isLogin) {
        // Tentativa de Login
        const { error } = await login(authData.email, authData.password);
        if (error) throw new Error(typeof error === 'string' ? error : (error as any).message);
      } else {
        // Tentativa de Cadastro
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: authData.email,
          password: authData.password,
          options: {
            data: {
              full_name: authData.name,
              role: 'owner'
            }
          }
        });
        
        if (signUpError) throw new Error(signUpError.message);
        
        // Se o cadastro funcionou mas não logou (confirmação pendente), guardamos o ID para o Passo 3
        if (signUpData.user && !signUpData.session) {
          setTempUser({ id: signUpData.user.id, email: signUpData.user.email || authData.email });
        } else if (!signUpData.session) {
          // Tenta login se não houver sessão
          const { error: loginError } = await login(authData.email, authData.password);
          if (loginError) {
            const msg = typeof loginError === 'string' ? loginError : (loginError as any).message;
            if (msg.includes("Email not confirmed")) {
               setTempUser({ id: signUpData.user?.id || "", email: authData.email });
            } else {
               throw new Error(msg);
            }
          }
        }
      }
      
      handleNextStep();
    } catch (err: any) {
      alert("Erro na autenticação: " + (err.message || "Verifique seus dados"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    if (!selectedPlan) {
      alert("Por favor, selecione um plano para continuar.");
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Pega usuário atual (pode ser o do context, direto do SB ou o temporário do cadastro)
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      const currentUser = sbUser || user || (tempUser ? { id: tempUser.id, email: tempUser.email } : null);

      if (!currentUser) {
        alert("Sua sessão não foi identificada. Por favor, retorne ao Passo 2 e informe seus dados.");
        setStep(2);
        setIsSubmitting(false);
        return;
      }

      // 2. Upload da(s) imagem(ns) pro bucket
      const uploadedUrls: string[] = [];
      for (const photo of photos) {
          if (photo.file) {
              const processedBlob = await processImage(photo.file);
              const ext = photo.file.name.split('.').pop() || 'jpg';
              const fileName = `${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${ext}`;
              const { data, error } = await supabase.storage
                  .from('listings_images')
                  .upload(fileName, processedBlob, { contentType: photo.file.type });
              if (data && !error) {
                  const { data: urlData } = supabase.storage.from('listings_images').getPublicUrl(fileName);
                  uploadedUrls.push(urlData.publicUrl);
              }
          }
      }

      // Reordena para que a foto de capa fique primeiro
      if (coverPhotoId) {
        const coverIdx = photos.findIndex(p => p.id === coverPhotoId);
        if (coverIdx > 0) {
          const coverUrl = uploadedUrls[coverIdx];
          uploadedUrls.splice(coverIdx, 1);
          uploadedUrls.unshift(coverUrl);
        }
      }

      // 3. Monta o Payload do Anúncio
      const fullAddress = [propertyData.street, propertyData.number, propertyData.complement].filter(Boolean).join(", ");
      const payload: Partial<Listing> = {
        title: propertyData.title || `${propertyData.propertyType} em ${propertyData.neighborhood || propertyData.city}`,
        description: propertyData.description || `Plano selecionado: ${selectedPlan.toUpperCase()}.`,
        type: propertyData.type as "venda" | "aluguel",
        propertyType: propertyData.propertyType,
        price: parseCurrency(propertyData.price) || 0,
        condominium: parseCurrency(propertyData.condominium) || 0,
        area: Number(propertyData.area) || 0,
        bedrooms: Number(propertyData.bedrooms) || 0,
        bathrooms: Number(propertyData.bathrooms) || 0,
        parking: Number(propertyData.parking) || 0,
        cep: propertyData.cep.replace(/\D/g, ""),
        street: propertyData.street,
        number: propertyData.number,
        complement: propertyData.complement,
        uf: propertyData.uf,
        city: propertyData.city,
        neighborhood: propertyData.neighborhood,
        address: fullAddress,
        images: uploadedUrls,
        user_id: currentUser.id,
        author: currentUser.email?.split("@")[0] || "Proprietário",
        acceptsExchange: propertyData.type === "venda" ? propertyData.acceptsExchange : false,
        iptu: parseCurrency(propertyData.iptu) || 0,
        owner_name: authData.name || currentUser.email?.split("@")[0],
        owner_phone: authData.phone.replace(/\D/g, ""),
        plan: selectedPlan,
        status: "pending_approval"
      };

      // 4. Salva no Supabase (na tabela listings)
      const { error } = await supabase.from('listings').insert([payload]);
      
      if (error) {
        console.error("ERRO SUPABASE DETALHADO:", error.message, error.details, error.hint);
        
        if (error.code === '42501' || error.message.includes('permission denied')) {
           alert("Permissão negada (RLS). Por favor, verifique se você seguiu o passo de ajustar as 'Policies' no Supabase para permitir inserções públicas (anon).");
        } else if (error.message.includes('column')) {
           alert("Coluna faltando no banco de dados. Verifique se você rodou o comando SQL que te enviei anteriormente.");
        } else {
           alert("Erro ao salvar no Supabase: " + error.message);
        }
        
        setIsSubmitting(false);
        return;
      }

      // 5. Redireciona para o sucesso
      setStep(4);
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 4000);

    } catch (err: any) {
      alert("Erro ao salvar o anúncio: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      {/* HEADER SIMPLIFICADO */}
      <header className="bg-white border-b border-[#ebebeb] py-4 px-6 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
            <Image src="/logo.png" alt="finHouse" width={32} height={32} className="rounded-lg" />
            <span className="text-[20px] font-bold text-[#222] tracking-tight">finHouse.</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`w-12 h-1.5 rounded-full transition-colors ${step >= s ? "bg-amber-400" : "bg-gray-200"}`}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 md:py-20 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-12 items-start">
          
          {/* Sidebar Desktop — Reforço de Marca */}
          {step < 4 && (
            <aside className="hidden lg:block w-[350px] sticky top-28">
              <BrandBenefits />
            </aside>
          )}

          <div className={`flex-1 w-full ${step < 4 ? 'max-w-2xl' : 'max-w-4xl mx-auto'}`}>
            {/* Banner Mobile — Reforço de Marca */}
            {step < 4 && (
              <div className="lg:hidden mb-10">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Vantagens finHouse</p>
                <BrandBenefits isMobile />
              </div>
            )}

            {/* PASSO 1: DADOS DO IMÓVEL */}
            {step === 1 && (
              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-black/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <p className="text-amber-500 font-bold text-sm tracking-widest uppercase mb-2">Passo 1 de 3</p>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-[#222] mb-3">Conte sobre o seu imóvel</h1>
                  <p className="text-[#717171] text-lg">Precisamos de alguns detalhes para criar um anúncio incrível.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-[#222]">Que tipo de imóvel você quer anunciar?</label>
                    <div className="flex gap-4">
                      <label className="flex-1 cursor-pointer">
                        <input type="radio" className="peer sr-only" name="type" checked={propertyData.type === "venda"} onChange={() => setPropertyData({...propertyData, type: "venda"})} />
                        <div className="p-4 rounded-2xl border-2 border-gray-200 peer-checked:border-black peer-checked:bg-black peer-checked:text-white text-center font-bold transition-all">
                          À Venda
                        </div>
                      </label>
                      <label className="flex-1 cursor-pointer">
                        <input type="radio" className="peer sr-only" name="type" checked={propertyData.type === "aluguel"} onChange={() => setPropertyData({...propertyData, type: "aluguel"})} />
                        <div className="p-4 rounded-2xl border-2 border-gray-200 peer-checked:border-black peer-checked:bg-black peer-checked:text-white text-center font-bold transition-all">
                          Para Alugar
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#222]">Tipo</label>
                    <select 
                      value={propertyData.propertyType} 
                      onChange={e => setPropertyData({...propertyData, propertyType: e.target.value})}
                      className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    >
                      <option value="Apartamento">Apartamento</option>
                      <option value="Casa">Casa</option>
                      <option value="Cobertura">Cobertura</option>
                      <option value="Terreno">Terreno</option>
                      <option value="Comercial">Comercial</option>
                    </select>
                  </div>

                  <div className="space-y-4 col-span-1 md:col-span-2 mt-2 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#222] flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-500" /> CEP *</label>
                        <div className="relative">
                          <input type="text" placeholder="00000-000" value={propertyData.cep} onChange={e => { const v = maskCep(e.target.value); setPropertyData({...propertyData, cep: v}); if (v.replace(/\D/g,"").length === 8) fetchCep(v); }} className={`w-full h-14 px-4 pr-12 rounded-2xl bg-gray-50 border focus:outline-none focus:ring-1 ${cepStatus === 'found' ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500' : cepStatus === 'notfound' ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-black focus:ring-black'}`} />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">{cepLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : cepStatus === 'found' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : cepStatus === 'notfound' ? <span className="text-red-400 text-xs font-bold">!</span> : null}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#222]">Rua / Logradouro</label>
                        <input type="text" placeholder="Preenchido pelo CEP" value={propertyData.street} onChange={e => setPropertyData({...propertyData, street: e.target.value})} readOnly={cepStatus === 'found' && !manualAddress} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black read-only:bg-gray-100 read-only:text-gray-600" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#222]">Número *</label>
                        <input type="text" placeholder="Ex: 123" value={propertyData.number} onChange={e => setPropertyData({...propertyData, number: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#222]">Complemento</label>
                        <input type="text" placeholder="Apto, Bloco, Sala..." value={propertyData.complement} onChange={e => setPropertyData({...propertyData, complement: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#222]">Bairro</label>
                        <input type="text" placeholder="Preenchido pelo CEP" value={propertyData.neighborhood} onChange={e => setPropertyData({...propertyData, neighborhood: e.target.value})} readOnly={cepStatus === 'found' && !manualAddress} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black read-only:bg-gray-100 read-only:text-gray-600" />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-2 col-span-2">
                          <label className="text-sm font-semibold text-[#222]">Cidade</label>
                          <input type="text" placeholder="Cidade" value={propertyData.city} onChange={e => setPropertyData({...propertyData, city: e.target.value})} readOnly={cepStatus === 'found' && !manualAddress} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black read-only:bg-gray-100 read-only:text-gray-600" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-[#222]">UF</label>
                          <input type="text" placeholder="SP" maxLength={2} value={propertyData.uf} onChange={e => setPropertyData({...propertyData, uf: e.target.value.toUpperCase()})} readOnly={cepStatus === 'found' && !manualAddress} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black read-only:bg-gray-100 read-only:text-gray-600 text-center" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#222]">Quartos</label>
                      <input type="number" placeholder="0" value={propertyData.bedrooms} onChange={e => setPropertyData({...propertyData, bedrooms: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#222]">Banheiros</label>
                      <input type="number" placeholder="0" value={propertyData.bathrooms} onChange={e => setPropertyData({...propertyData, bathrooms: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#222]">Vagas</label>
                      <input type="number" placeholder="0" value={propertyData.parking} onChange={e => setPropertyData({...propertyData, parking: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#222]">Área (m²)</label>
                      <input type="number" placeholder="80" value={propertyData.area} onChange={e => setPropertyData({...propertyData, area: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-[#222]">Título do Anúncio</label>
                    <input type="text" placeholder="Ex: Lindo apartamento com varanda gourmet..." value={propertyData.title} onChange={e => setPropertyData({...propertyData, title: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-[#222]">Descrição</label>
                    <textarea placeholder="Fale um pouco sobre o imóvel..." value={propertyData.description} onChange={e => setPropertyData({...propertyData, description: e.target.value})} className="w-full min-h-[120px] p-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none" />
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-4">
                      <label className="text-sm font-semibold text-[#222]">Fotos (até 20) * — ⭐ = Capa</label>
                      <label className="flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-dashed border-[#ddd] rounded-2xl cursor-pointer hover:bg-[#f7f7f7] transition-colors p-4 text-center">
                          <UploadCloud className="w-8 h-8 text-[#b0b0b0] mb-2" />
                          <span className="text-[14px] font-semibold text-[#222]">Clique para selecionar fotos</span>
                          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>
                      {photos.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                              {photos.map((photo, index) => (
                                  <div key={photo.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDrop={(e) => handleDrop(e, index)} onDragOver={handleDragOver} className={`relative aspect-square rounded-xl overflow-hidden group cursor-grab active:cursor-grabbing ${coverPhotoId === photo.id ? 'ring-2 ring-amber-400 ring-offset-2' : 'border border-[#ebebeb]'}`}>
                                      <img src={photo.url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                          <button type="button" onClick={() => setCoverPhotoId(photo.id)} className={`p-1.5 rounded-lg transition-colors ${coverPhotoId === photo.id ? 'bg-amber-400 text-black' : 'bg-white/80 text-gray-700 hover:bg-amber-400 hover:text-black'}`}><Star className="w-4 h-4" /></button>
                                          <button type="button" onClick={() => removePhoto(index)} className="p-1.5 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="space-y-4 col-span-1 md:col-span-2 mt-4 pt-6 border-t border-gray-100">
                    <label className="text-sm font-semibold text-[#222] flex items-center gap-2"><BadgeDollarSign className="w-5 h-5 text-amber-500" /> Valores (R$)</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{propertyData.type === 'aluguel' ? 'Valor do Aluguel' : 'Valor de Venda'} *</span>
                        <input type="text" placeholder="R$ 0,00" value={propertyData.price} onChange={e => setPropertyData({...propertyData, price: formatCurrency(e.target.value)})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-lg font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Condomínio</span>
                        <input type="text" placeholder="R$ 0,00" value={propertyData.condominium} onChange={e => setPropertyData({...propertyData, condominium: formatCurrency(e.target.value)})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">IPTU</span>
                        <input type="text" placeholder="R$ 0,00" value={propertyData.iptu} onChange={e => setPropertyData({...propertyData, iptu: formatCurrency(e.target.value)})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex justify-end">
                  <button onClick={handleNextStep} disabled={!propertyData.price || photos.length === 0} className="w-full md:w-auto bg-[#222] text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-colors disabled:opacity-50">
                    Continuar <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 2: AUTENTICAÇÃO */}
            {step === 2 && (
              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-black/5 animate-in fade-in slide-in-from-right-4 duration-500 max-w-xl mx-auto">
                <div className="mb-8 text-center">
                  <p className="text-amber-500 font-bold text-sm tracking-widest uppercase mb-2">Passo 2 de 3</p>
                  <h1 className="text-3xl font-extrabold text-[#222] mb-3">Quase lá!</h1>
                  <p className="text-[#717171]">Crie sua conta para salvar seu anúncio.</p>
                </div>

                <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl">
                  <button onClick={() => setAuthData({...authData, isLogin: false})} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${!authData.isLogin ? "bg-white text-black shadow-sm" : "text-gray-500"}`}>Criar Conta</button>
                  <button onClick={() => setAuthData({...authData, isLogin: true})} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${authData.isLogin ? "bg-white text-black shadow-sm" : "text-gray-500"}`}>Login</button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {!authData.isLogin && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#222]">Nome Completo</label>
                        <input type="text" required value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#222]">WhatsApp</label>
                        <input type="tel" required placeholder="(11) 99999-9999" value={maskPhone(authData.phone)} onChange={e => setAuthData({...authData, phone: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black" />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#222]">E-mail</label>
                    <input type="email" required value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#222]">Senha</label>
                    <input type="password" required minLength={6} value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black" />
                  </div>
                  <div className="pt-6 flex items-center gap-4">
                    <button type="button" onClick={handlePrevStep} className="p-4 rounded-2xl hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#222] text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50">{isSubmitting ? "..." : "Continuar"}</button>
                  </div>
                </form>
              </div>
            )}

            {/* PASSO 3: PLANOS */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 w-full max-w-[960px] mx-auto">
                <div className="mb-10 text-center">
                  <p className="text-amber-500 font-bold text-sm tracking-widest uppercase mb-2">Passo 3 de 3</p>
                  <h1 className="text-3xl md:text-5xl font-extrabold text-[#222] mb-4">Escolha seu plano</h1>
                </div>

                <div className={`grid gap-6 ${propertyData.type === 'venda' ? 'md:grid-cols-3' : 'md:grid-cols-2 max-w-[700px] mx-auto'}`}>
                  {/* FREE */}
                  <div onClick={() => setSelectedPlan("free")} className={`bg-white rounded-[28px] p-6 md:p-8 border-2 cursor-pointer transition-all ${selectedPlan === "free" ? "border-black shadow-xl scale-[1.02]" : "border-[#ebebeb] hover:border-gray-300"}`}>
                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center mb-5"><Home className="w-5 h-5 text-[#222]" /></div>
                    <h3 className="text-xl font-extrabold text-[#222] mb-1">Básico</h3>
                    <p className="text-sm font-bold text-emerald-600 mb-4">GRÁTIS</p>
                    <ul className="space-y-3 mb-6 text-sm text-[#444]">
                      <li className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Anúncio no site finHouse</li>
                      <li className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Sem exclusividade</li>
                    </ul>
                  </div>

                  {/* PREMIUM */}
                  <div onClick={() => setSelectedPlan("premium")} className={`bg-black rounded-[28px] p-6 md:p-8 border-2 cursor-pointer transition-all relative ${selectedPlan === "premium" ? "border-amber-400 shadow-xl scale-[1.02]" : "border-transparent"}`}>
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-5"><Briefcase className="w-5 h-5 text-amber-400" /></div>
                    <h3 className="text-xl font-extrabold text-white mb-1">Elite Premium</h3>
                    <p className="text-sm font-bold text-amber-400 mb-4">{propertyData.type === 'aluguel' ? '8% mensal' : '6% comissão'}</p>
                    <ul className="space-y-3 mb-6 text-sm text-white/90">
                      <li className="flex items-start gap-2.5"><Zap className="w-4 h-4 text-amber-400 shrink-0" /> Anúncio em ZAP, Viva Real e OLX</li>
                      <li className="flex items-start gap-2.5"><ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" /> Assessoria Jurídica completa</li>
                      <li className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Fotos Profissionais</li>
                    </ul>
                  </div>

                  {/* LEGAL */}
                  {propertyData.type === 'venda' && (
                    <div onClick={() => setSelectedPlan("legal")} className={`bg-white rounded-[28px] p-6 md:p-8 border-2 cursor-pointer transition-all ${selectedPlan === "legal" ? "border-black shadow-xl scale-[1.02]" : "border-[#ebebeb]"}`}>
                      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-5"><Scale className="w-5 h-5 text-blue-600" /></div>
                      <h3 className="text-xl font-extrabold text-[#222] mb-1">Jurídico</h3>
                      <p className="text-sm font-bold text-blue-600 mb-4">1,9% comissão</p>
                      <ul className="space-y-3 mb-6 text-sm text-[#444]">
                        <li className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Elaboração de contrato</li>
                        <li className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Acompanhamento em cartório</li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-10 flex items-center justify-between gap-4">
                  <button type="button" onClick={handlePrevStep} className="p-4 rounded-2xl hover:bg-gray-200 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                  <button onClick={handleFinish} disabled={isSubmitting || !selectedPlan} className="flex-1 max-w-xs bg-[#222] text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg">
                    {isSubmitting ? "Finalizando..." : "Publicar Anúncio"} <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}

            {/* SUCESSO */}
            {step === 4 && (
              <div className="text-center animate-in zoom-in duration-500 max-w-xl mx-auto">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                </div>
                <h1 className="text-4xl font-black text-[#222] mb-4">Tudo pronto!</h1>
                <p className="text-[#717171] text-lg mb-8">
                  {tempUser 
                    ? `Verifique seu e-mail (${tempUser.email}) para confirmar sua conta.`
                    : "Seu anúncio foi criado. Redirecionando..."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
