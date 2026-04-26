"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ArrowRight, ArrowLeft, Home, MapPin, BadgeDollarSign, 
  CheckCircle2, Briefcase, Zap, ShieldCheck, Phone,
  UploadCloud, Trash2, Star, Loader2, Search, Scale,
  Building2, CalendarCheck, FileText, Users, Wrench, Receipt
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

      // Se der erro no upload e não subir nada, podemos colocar o placeholder
      if (uploadedUrls.length === 0) {
          uploadedUrls.push("https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800");
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

      // 5. Redireciona para o sucesso (futuramente pode ir pro dashboard do proprietário)
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
      <header className="bg-white border-b border-[#ebebeb] py-4 px-6 sticky top-0 z-10">
        <div className="max-w-[1000px] mx-auto flex items-center justify-between">
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

      <main className="flex-1 flex flex-col items-center justify-center p-6 py-12">
        <div className="w-full max-w-[800px]">
          
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
                        {cepStatus === 'notfound' && <p className="text-xs text-red-500">CEP não encontrado. Preencha manualmente.</p>}
                        {!manualAddress && cepStatus === 'idle' && <button type="button" onClick={() => setManualAddress(true)} className="text-xs text-amber-600 hover:underline">Não sei meu CEP</button>}
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
                    <p className="text-xs text-gray-400">Opcional. Se não preencher, geramos automaticamente.</p>
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-[#222]">Descrição do Imóvel</label>
                    <textarea placeholder="Fale um pouco sobre o imóvel..." value={propertyData.description} onChange={e => setPropertyData({...propertyData, description: e.target.value})} className="w-full min-h-[120px] p-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none" />
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-4">
                      <label className="text-sm font-semibold text-[#222]">Fotos (até 20) * — Toque na ⭐ para definir a capa</label>
                      <label className="flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-dashed border-[#ddd] rounded-2xl cursor-pointer hover:bg-[#f7f7f7] transition-colors p-4 text-center">
                          <UploadCloud className="w-8 h-8 text-[#b0b0b0] mb-2" />
                          <span className="text-[14px] font-semibold text-[#222]">Clique para selecionar fotos</span>
                          <span className="text-[13px] text-[#717171] mt-1">Imagens bem iluminadas vendem mais rápido</span>
                          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>
                      {photos.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                              {photos.map((photo, index) => (
                                  <div key={photo.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDrop={(e) => handleDrop(e, index)} onDragOver={handleDragOver} className={`relative aspect-square rounded-xl overflow-hidden group cursor-grab active:cursor-grabbing ${coverPhotoId === photo.id ? 'ring-2 ring-amber-400 ring-offset-2' : 'border border-[#ebebeb]'}`}>
                                      <img src={photo.url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                          <button type="button" onClick={() => setCoverPhotoId(photo.id)} className={`p-1.5 rounded-lg transition-colors ${coverPhotoId === photo.id ? 'bg-amber-400 text-black' : 'bg-white/80 text-gray-700 hover:bg-amber-400 hover:text-black'}`} title="Foto de capa"><Star className="w-4 h-4" /></button>
                                          <button type="button" onClick={() => removePhoto(index)} className="p-1.5 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                                      </div>
                                      {coverPhotoId === photo.id && <div className="absolute top-1 left-1 bg-amber-400 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">CAPA</div>}
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
                        <input type="text" placeholder={propertyData.type === 'aluguel' ? 'R$ 2.500,00' : 'R$ 500.000,00'} value={propertyData.price} onChange={e => setPropertyData({...propertyData, price: formatCurrency(e.target.value)})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-lg font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Condomínio</span>
                        <input type="text" placeholder="R$ 800,00" value={propertyData.condominium} onChange={e => setPropertyData({...propertyData, condominium: formatCurrency(e.target.value)})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">IPTU</span>
                        <input type="text" placeholder="R$ 1.500,00" value={propertyData.iptu} onChange={e => setPropertyData({...propertyData, iptu: formatCurrency(e.target.value)})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                      </div>
                    </div>
                  </div>

                  {propertyData.type === 'venda' && (
                    <div className="col-span-1 md:col-span-2 flex items-center gap-2 pt-2">
                      <input type="checkbox" id="permuta" checked={propertyData.acceptsExchange} onChange={(e) => setPropertyData({...propertyData, acceptsExchange: e.target.checked})} className="w-5 h-5 rounded border-[#ddd] text-[#222]" />
                      <label htmlFor="permuta" className="text-sm font-semibold text-[#222] cursor-pointer">Aceita Permuta?</label>
                    </div>
                  )}
                </div>

              <div className="mt-10 flex justify-end">
                <button 
                  onClick={handleNextStep}
                  disabled={!propertyData.price || photos.length === 0}
                  className="w-full md:w-auto bg-[#222] text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-colors disabled:opacity-50"
                >
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
                <p className="text-[#717171]">Crie sua conta rapidinho para salvar e organizar seus anúncios ou de seus clientes.</p>
              </div>

              <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl">
                <button 
                  onClick={() => setAuthData({...authData, isLogin: false})}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${!authData.isLogin ? "bg-white text-black shadow-sm" : "text-gray-500"}`}
                >
                  Criar Conta
                </button>
                <button 
                  onClick={() => setAuthData({...authData, isLogin: true})}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${authData.isLogin ? "bg-white text-black shadow-sm" : "text-gray-500"}`}
                >
                  Já tenho conta
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {!authData.isLogin && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#222]">Seu Nome Completo</label>
                      <input 
                        type="text" 
                        required
                        value={authData.name}
                        onChange={e => setAuthData({...authData, name: e.target.value})}
                        className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#222] flex items-center gap-2"><Phone className="w-4 h-4" /> WhatsApp / Telefone</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="(11) 99999-9999"
                        value={maskPhone(authData.phone)}
                        onChange={e => setAuthData({...authData, phone: e.target.value})}
                        className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black" 
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#222]">E-mail</label>
                  <input 
                    type="email" 
                    required
                    value={authData.email}
                    onChange={e => setAuthData({...authData, email: e.target.value})}
                    className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#222]">Senha</label>
                  <input 
                    type="password" 
                    required
                    minLength={6}
                    value={authData.password}
                    onChange={e => setAuthData({...authData, password: e.target.value})}
                    className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black" 
                  />
                </div>

                <div className="pt-6 flex items-center gap-4">
                  <button type="button" onClick={handlePrevStep} className="p-4 rounded-2xl hover:bg-gray-100 text-gray-400 hover:text-black transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#222] text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Autenticando..." : "Continuar"} <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PASSO 3: PLANOS */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 w-full max-w-[960px] mx-auto">
              <div className="mb-10 text-center">
                <p className="text-amber-500 font-bold text-sm tracking-widest uppercase mb-2">Passo 3 de 3</p>
                <h1 className="text-3xl md:text-5xl font-extrabold text-[#222] mb-4">Escolha o plano ideal</h1>
                <p className="text-[#717171] text-lg max-w-2xl mx-auto">{propertyData.type === 'aluguel' ? 'Alugue com tranquilidade. Escolha como quer administrar.' : 'Venda do seu jeito. Com gestão completa, ou apenas assessoria jurídica.'}</p>
              </div>

              <div className={`grid gap-6 ${propertyData.type === 'venda' ? 'md:grid-cols-3' : 'md:grid-cols-2 max-w-[700px] mx-auto'}`}>
                {/* PLANO BÁSICO */}
                <div onClick={() => setSelectedPlan("free")} className={`bg-white rounded-[28px] p-6 md:p-8 border-2 cursor-pointer transition-all hover:-translate-y-1 ${selectedPlan === "free" ? "border-black shadow-2xl shadow-black/10 scale-[1.02]" : "border-[#ebebeb] hover:border-gray-300"}`}>
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center"><Home className="w-5 h-5 text-[#222]" /></div>
                    {selectedPlan === "free" && <CheckCircle2 className="w-6 h-6 text-black fill-black/10" />}
                  </div>
                  <h3 className="text-xl font-extrabold text-[#222] mb-1">Básico</h3>
                  <p className="text-sm font-bold text-emerald-600 mb-4 uppercase tracking-wider">Anúncio Grátis</p>
                  <p className="text-sm text-[#717171] mb-6">{propertyData.type === 'aluguel' ? 'Seu imóvel visível para milhares de inquilinos em potencial na plataforma finHouse.' : 'Seu imóvel visível para milhares de visitantes mensais na plataforma finHouse.'}</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2.5 text-sm text-[#444] font-medium"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Anúncio no site finHouse (milhares de views/mês)</li>
                    <li className="flex items-start gap-2.5 text-sm text-[#444] font-medium"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Sem exclusividade</li>
                    <li className="flex items-start gap-2.5 text-sm text-[#444] font-medium"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {propertyData.type === 'aluguel' ? 'Análise de perfil do inquilino' : 'Financiamento para o comprador'}</li>
                  </ul>
                  <p className="text-xs text-gray-400 font-medium">{propertyData.type === 'aluguel' ? 'Comissão padrão apenas se alugar conosco.' : 'Comissão padrão apenas se a venda ocorrer conosco.'}</p>
                </div>

                {/* PLANO ELITE PREMIUM */}
                <div onClick={() => setSelectedPlan("premium")} className={`bg-black rounded-[28px] p-6 md:p-8 border-2 cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden ${selectedPlan === "premium" ? "border-amber-400 shadow-2xl shadow-amber-500/20 scale-[1.02]" : "border-transparent"}`}>
                  <div className="absolute top-5 right-5 px-3 py-1 bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest rounded-full">Recomendado</div>
                  <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-5 border border-white/20"><Briefcase className="w-5 h-5 text-amber-400" /></div>
                  <h3 className="text-xl font-extrabold text-white mb-1">Elite Premium</h3>
                  <p className="text-sm font-bold text-amber-400 mb-4 uppercase tracking-wider">{propertyData.type === 'aluguel' ? '8% mensal + 1º aluguel' : 'Comissão de mercado (6%)'}</p>
                  <p className="text-sm text-white/70 mb-6">{propertyData.type === 'aluguel' ? 'Nós administramos seu imóvel. Você só recebe o pagamento todo mês.' : 'Nós cuidamos de tudo. Você só assina o contrato.'}</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2.5 text-sm text-white/90 font-medium"><Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Anúncio em ZAP, Viva Real e OLX</li>
                    <li className="flex items-start gap-2.5 text-sm text-white/90 font-medium"><Home className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Anúncio Premium no site finHouse</li>
                    {propertyData.type === 'aluguel' ? (<>
                      <li className="flex items-start gap-2.5 text-sm text-white/90 font-medium"><Receipt className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Controle de inadimplência</li>
                      <li className="flex items-start gap-2.5 text-sm text-white/90 font-medium"><FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Emissão de boletos</li>
                      <li className="flex items-start gap-2.5 text-sm text-white/90 font-medium"><CalendarCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Organização de visitas</li>
                      <li className="flex items-start gap-2.5 text-sm text-white/90 font-medium"><Search className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Vistoria de entrada e saída</li>
                      <li className="flex items-start gap-2.5 text-sm text-white/90 font-medium"><Scale className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Contrato de locação</li>
                      <li className="flex items-start gap-2.5 text-sm text-white/90 font-medium"><Wrench className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Gestão de manutenções</li>
                      <li className="flex items-start gap-2.5 text-sm text-white/90 font-medium"><Users className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Assessor pessoal dedicado</li>
                    </>) : (<>
                      <li className="flex items-start gap-2.5 text-sm text-white/90 font-medium"><BadgeDollarSign className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Time para maximizar preço de venda</li>
                      <li className="flex items-start gap-2.5 text-sm text-white/90 font-medium"><CalendarCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Organização e agendamento de visitas</li>
                      <li className="flex items-start gap-2.5 text-sm text-white/90 font-medium"><ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Filtro de curiosos (pré-qualificação)</li>
                      <li className="flex items-start gap-2.5 text-sm text-white/90 font-medium"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Fotos profissionais</li>
                      <li className="flex items-start gap-2.5 text-sm text-white/90 font-medium"><Users className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Assessor pessoal dedicado</li>
                      <li className="flex items-start gap-2.5 text-sm text-white/90 font-medium"><Scale className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Assessoria jurídica completa inclusa</li>
                    </>)}
                  </ul>
                  <p className="text-xs text-white/40 font-medium">{propertyData.type === 'aluguel' ? 'Renda passiva sem preocupação.' : 'Zero custo fixo. Só paga se vender.'}</p>
                </div>

                {/* PLANO ASSESSORIA JURÍDICA — SÓ VENDA */}
                {propertyData.type === 'venda' && (
                  <div onClick={() => setSelectedPlan("legal")} className={`bg-white rounded-[28px] p-6 md:p-8 border-2 cursor-pointer transition-all hover:-translate-y-1 ${selectedPlan === "legal" ? "border-black shadow-2xl shadow-black/10 scale-[1.02]" : "border-[#ebebeb] hover:border-gray-300"}`}>
                    <div className="flex justify-between items-start mb-5">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center"><Scale className="w-5 h-5 text-blue-600" /></div>
                      {selectedPlan === "legal" && <CheckCircle2 className="w-6 h-6 text-black fill-black/10" />}
                    </div>
                    <h3 className="text-xl font-extrabold text-[#222] mb-1">Assessoria Jurídica</h3>
                    <p className="text-sm font-bold text-blue-600 mb-4 uppercase tracking-wider">1,9% do valor da venda</p>
                    <p className="text-sm text-[#717171] mb-6">Já encontrou o comprador? Garantimos a segurança jurídica da sua transação.</p>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start gap-2.5 text-sm text-[#444] font-medium"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Análise Jurídica da Documentação Inicial (Diagnóstico 48h)</li>
                      <li className="flex items-start gap-2.5 text-sm text-[#444] font-medium"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Elaboração de Contrato de Compra e Venda</li>
                      <li className="flex items-start gap-2.5 text-sm text-[#444] font-medium"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Apoio na Assinatura do Contrato</li>
                      <li className="flex items-start gap-2.5 text-sm text-[#444] font-medium"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Acompanhamento em Cartório (Escritura)</li>
                    </ul>
                    <p className="text-xs text-gray-400 font-medium">Para transações de Venda Direta com segurança.</p>
                  </div>
                )}
              </div>

              <div className="mt-10 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                <button type="button" onClick={handlePrevStep} className="p-4 rounded-2xl hover:bg-gray-200 text-gray-500 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button onClick={handleFinish} disabled={isSubmitting || !selectedPlan} className="w-full sm:w-auto bg-[#222] text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-black/10">
                  {isSubmitting ? "Finalizando..." : "Publicar Meu Anúncio"} <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* SUCESSO */}
          {step === 4 && (
            <div className="text-center animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-emerald-50">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h1 className="text-4xl font-black text-[#222] mb-4">Anúncio criado com sucesso!</h1>
              <p className="text-[#717171] text-lg max-w-lg mx-auto mb-8">
                {tempUser 
                  ? `Já recebemos os dados! Por favor, verifique seu e-mail (${tempUser.email}) para confirmar sua conta e ativar seu anúncio.`
                  : "Já estamos enviando as informações para a nossa equipe. Você será redirecionado para o seu painel de controle em instantes..."}
              </p>
              {!tempUser && <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin mx-auto"></div>}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
