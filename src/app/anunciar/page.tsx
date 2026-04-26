"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ArrowRight, ArrowLeft, Home, MapPin, BadgeDollarSign, 
  CheckCircle2, Briefcase, Zap, ShieldCheck, Phone,
  UploadCloud, Trash2, Star, Loader2, Search, Scale,
  Building2, CalendarCheck, FileText, Users, Wrench, Receipt,
  Rocket,
  Check,
  ChevronRight
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

const LandingIntro = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-white flex items-center justify-center py-16 md:py-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#f7f7f7] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Subtle background image for mobile/desktop background texture */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/anunciar-hero.png"
          alt=""
          className="w-full h-full object-cover opacity-[0.04] md:opacity-[0.02]"
        />
      </div>

      <div className="max-w-[1280px] mx-auto px-6 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          <div className="animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f7f7f7] border border-[#ebebeb] mb-8 font-bold text-[11px] text-[#222]/60 uppercase tracking-widest">
              Anuncie na Rede de Elite
            </div>
            
            <h1 className="text-[44px] md:text-[64px] font-black text-[#222] leading-[1] tracking-[-0.04em] mb-8">
              Anuncie seu imóvel <span className="underline decoration-amber-400 decoration-4 underline-offset-[12px]">gratuitamente</span> na finHouse.
            </h1>
            
            <p className="text-[18px] md:text-[21px] text-[#717171] leading-relaxed mb-10 font-medium max-w-xl">
              Sua casa na plataforma que mais cresce em SJC. Venda mais rápido com crédito integrado e visibilidade nos maiores portais do país.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={onStart}
                className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-[#222] text-white text-[16px] font-black uppercase hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/10"
              >
                Começar agora <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white border border-[#ebebeb] text-[#222]/60 text-[13px] font-bold">
                 <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                 Zero Custo Fixo
              </div>
            </div>

            <div className="flex items-center gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
               <span className="text-[11px] font-black text-[#222] uppercase tracking-widest shrink-0">Nos Maiores Portais</span>
               <div className="h-px bg-[#ebebeb] flex-1" />
               <div className="flex gap-6 font-black text-[#222] text-[14px]">
                 <span>ZAP</span>
                 <span>OLX</span>
                 <span>VIVAREAL</span>
               </div>
            </div>
          </div>

          {/* Cards section */}
          <div className="grid sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
            {[
              { 
                icon: Rocket, 
                title: "Visibilidade Elite", 
                desc: "Anúncio destaque na finHouse e nos maiores portais imobiliários." 
              },
              { 
                icon: Zap, 
                title: "Crédito Integrado", 
                desc: "Financiamento e Consórcio para acelerar a venda para o seu comprador." 
              },
              { 
                icon: ShieldCheck, 
                title: "Segurança Total", 
                desc: "Assessoria jurídica e operacional do início ao fechamento do negócio." 
              },
              { 
                icon: BadgeDollarSign, 
                title: "Custo Zero", 
                desc: "Anúncio 100% grátis na plataforma. Sem taxas escondidas, sem mensalidade." 
              },
            ].map((item) => (
              <div key={item.title} className="p-8 rounded-[32px] bg-white border border-[#ebebeb] hover:border-amber-400/50 hover:shadow-2xl hover:shadow-amber-500/5 transition-all group cursor-pointer" onClick={onStart}>
                <div className="w-14 h-14 rounded-2xl bg-[#f7f7f7] flex items-center justify-center mb-6 group-hover:bg-amber-400 transition-colors">
                  <item.icon className="w-6 h-6 text-[#222] group-hover:text-white transition-colors" strokeWidth={2.5} />
                </div>
                <h3 className="text-[18px] font-black text-[#222] mb-2 tracking-tight">{item.title}</h3>
                <p className="text-[15px] text-[#717171] leading-relaxed font-medium">{item.desc}</p>
                <div className="mt-4 flex items-center gap-2 text-[12px] font-black text-amber-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 uppercase tracking-widest">
                  Anunciar <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function AnunciarWizardContent() {
  const router = useRouter();
  const { login, user } = useAuth();
  
  const [showIntro, setShowIntro] = useState(true);
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepStatus, setCepStatus] = useState<'idle' | 'found' | 'notfound'>('idle');
  const [manualAddress, setManualAddress] = useState(false);
  const [tempUser, setTempUser] = useState<{ id: string; email: string } | null>(null);

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

  const [photos, setPhotos] = useState<{ id: string; file: File; url: string }[]>([]);
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null);

  const [authData, setAuthData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    isLogin: false
  });

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
    if (step === 1 && !!user) { setStep(3); return; }
    setStep((prev) => (prev + 1) as Step);
  };
  const handlePrevStep = () => {
    if (step === 3 && !!user) { setStep(1); return; }
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
      if (!coverPhotoId && combined.length > 0) setCoverPhotoId(combined[0].id);
  };

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
        const { error } = await login(authData.email, authData.password);
        if (error) throw new Error(typeof error === 'string' ? error : (error as any).message);
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: authData.email,
          password: authData.password,
          options: { data: { full_name: authData.name, role: 'owner' } }
        });
        if (signUpError) throw new Error(signUpError.message);
        if (signUpData.user && !signUpData.session) {
          setTempUser({ id: signUpData.user.id, email: signUpData.user.email || authData.email });
        } else if (!signUpData.session) {
          const { error: loginError } = await login(authData.email, authData.password);
          if (loginError) {
            const msg = typeof loginError === 'string' ? loginError : (loginError as any).message;
            if (msg.includes("Email not confirmed")) {
               setTempUser({ id: signUpData.user?.id || "", email: authData.email });
            } else { throw new Error(msg); }
          }
        }
      }
      handleNextStep();
    } catch (err: any) {
      alert("Erro na autenticação: " + (err.message || "Verifique seus dados"));
    } finally { setIsSubmitting(false); }
  };

  const handleFinish = async () => {
    if (!selectedPlan) { alert("Por favor, selecione um plano para continuar."); return; }
    setIsSubmitting(true);
    try {
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      const currentUser = sbUser || user || (tempUser ? { id: tempUser.id, email: tempUser.email } : null);
      if (!currentUser) {
        alert("Sua sessão não foi identificada. Por favor, retorne ao Passo 2 e informe seus dados.");
        setStep(2); setIsSubmitting(false); return;
      }
      const uploadedUrls: string[] = [];
      for (const photo of photos) {
          if (photo.file) {
              const processedBlob = await processImage(photo.file);
              const ext = photo.file.name.split('.').pop() || 'jpg';
              const fileName = `${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${ext}`;
              const { data, error } = await supabase.storage.from('listings_images').upload(fileName, processedBlob, { contentType: photo.file.type });
              if (data && !error) {
                  const { data: urlData } = supabase.storage.from('listings_images').getPublicUrl(fileName);
                  uploadedUrls.push(urlData.publicUrl);
              }
          }
      }
      if (coverPhotoId) {
        const coverIdx = photos.findIndex(p => p.id === coverPhotoId);
        if (coverIdx > 0) {
          const coverUrl = uploadedUrls[coverIdx];
          uploadedUrls.splice(coverIdx, 1);
          uploadedUrls.unshift(coverUrl);
        }
      }
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
      const { error } = await supabase.from('listings').insert([payload]);
      if (error) { alert("Erro ao salvar o anúncio: " + error.message); setIsSubmitting(false); return; }
      setStep(4);
      setTimeout(() => router.push("/dashboard"), 4000);
    } catch (err: any) { alert("Erro ao salvar o anúncio: " + err.message); } finally { setIsSubmitting(false); }
  };

  if (showIntro) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-white border-b border-[#ebebeb] py-4 px-6 sticky top-0 z-50">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
              <Image src="/logo.png" alt="finHouse" width={32} height={32} className="rounded-lg" />
              <span className="text-[20px] font-bold text-[#222] tracking-tight">finHouse.</span>
            </div>
          </div>
        </header>
        <LandingIntro onStart={() => setShowIntro(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <header className="bg-white border-b border-[#ebebeb] py-4 px-6 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
            <Image src="/logo.png" alt="finHouse" width={32} height={32} className="rounded-lg" />
            <span className="text-[20px] font-bold text-[#222] tracking-tight">finHouse.</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-12 h-1.5 rounded-full transition-colors ${step >= s ? "bg-amber-400" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 md:py-20 px-6">
        <div className="max-w-2xl mx-auto w-full">
          {step === 1 && (
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-black/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <p className="text-amber-500 font-bold text-sm tracking-widest uppercase mb-2">Passo 1 de 3</p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#222] mb-3">Sobre o Imóvel</h1>
                <p className="text-[#717171] text-lg font-medium leading-tight">Conte-nos os detalhes do imóvel que deseja anunciar.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-[#222]">Tipo de Anúncio</label>
                  <div className="flex gap-4">
                    <label className="flex-1 cursor-pointer">
                      <input type="radio" className="peer sr-only" name="type" checked={propertyData.type === "venda"} onChange={() => setPropertyData({...propertyData, type: "venda"})} />
                      <div className="p-4 rounded-2xl border-2 border-gray-100 peer-checked:border-[#222] peer-checked:bg-[#222] peer-checked:text-white text-center font-bold transition-all">À Venda</div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input type="radio" className="peer sr-only" name="type" checked={propertyData.type === "aluguel"} onChange={() => setPropertyData({...propertyData, type: "aluguel"})} />
                      <div className="p-4 rounded-2xl border-2 border-gray-100 peer-checked:border-[#222] peer-checked:bg-[#222] peer-checked:text-white text-center font-bold transition-all">Para Alugar</div>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#222]">Tipo de Imóvel</label>
                  <select value={propertyData.propertyType} onChange={e => setPropertyData({...propertyData, propertyType: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black">
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
                      <label className="text-sm font-semibold text-[#222]">CEP *</label>
                      <input type="text" placeholder="00000-000" value={propertyData.cep} onChange={e => { const v = maskCep(e.target.value); setPropertyData({...propertyData, cep: v}); if (v.replace(/\D/g,"").length === 8) fetchCep(v); }} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#222]">Número *</label>
                      <input type="text" value={propertyData.number} onChange={e => setPropertyData({...propertyData, number: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none" />
                    </div>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#222]">Quartos</label>
                    <input type="number" value={propertyData.bedrooms} onChange={e => setPropertyData({...propertyData, bedrooms: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#222]">Banheiros</label>
                    <input type="number" value={propertyData.bathrooms} onChange={e => setPropertyData({...propertyData, bathrooms: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#222]">Vagas</label>
                    <input type="number" value={propertyData.parking} onChange={e => setPropertyData({...propertyData, parking: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#222]">Área (m²)</label>
                    <input type="number" value={propertyData.area} onChange={e => setPropertyData({...propertyData, area: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200" />
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 space-y-4">
                    <label className="text-sm font-semibold text-[#222]">Fotos (até 20) *</label>
                    <label className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-[#ddd] rounded-3xl cursor-pointer hover:bg-[#f7f7f7] p-4 text-center transition-colors">
                        <UploadCloud className="w-8 h-8 text-[#b0b0b0] mb-2" />
                        <span className="text-[14px] font-bold text-[#222]">Selecionar Fotos</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                    {photos.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                            {photos.map((photo, index) => (
                                <div key={photo.id} className={`relative aspect-square rounded-2xl overflow-hidden border border-[#ebebeb] ${coverPhotoId === photo.id ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}>
                                    <img src={photo.url} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={() => setCoverPhotoId(photo.id)} className="p-2 bg-white rounded-xl shadow-lg"><Star className="w-4 h-4 text-amber-500" /></button>
                                        <button onClick={() => removePhoto(index)} className="p-2 bg-red-500 rounded-xl text-white shadow-lg"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2 pt-4 border-t border-gray-100">
                    <label className="text-sm font-semibold text-[#222]">Preço de {propertyData.type === 'venda' ? 'Venda' : 'Aluguel'} *</label>
                    <input type="text" value={propertyData.price} onChange={e => setPropertyData({...propertyData, price: formatCurrency(e.target.value)})} className="w-full h-16 px-6 rounded-3xl bg-gray-50 border border-gray-200 text-xl font-black text-[#222] focus:outline-none focus:border-black transition-colors" />
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button onClick={handleNextStep} disabled={!propertyData.price || photos.length === 0} className="w-full md:w-auto bg-[#222] text-white px-10 py-5 rounded-2xl font-black uppercase hover:bg-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-xl shadow-black/10">Continuar <ArrowRight className="w-5 h-5" /></button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-black/5 animate-in fade-in slide-in-from-right-4 duration-500 max-w-xl mx-auto">
              <div className="mb-8 text-center">
                <p className="text-amber-500 font-bold text-sm tracking-widest uppercase mb-2">Passo 2 de 3</p>
                <h1 className="text-3xl font-extrabold text-[#222] mb-3">Sua Conta</h1>
                <p className="text-[#717171] font-medium">Crie sua conta para gerenciar seu anúncio.</p>
              </div>
              <div className="flex gap-2 mb-8 bg-[#f7f7f7] p-2 rounded-2xl">
                <button onClick={() => setAuthData({...authData, isLogin: false})} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${!authData.isLogin ? "bg-[#222] text-white shadow-lg" : "text-gray-500"}`}>Criar Conta</button>
                <button onClick={() => setAuthData({...authData, isLogin: true})} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${authData.isLogin ? "bg-[#222] text-white shadow-lg" : "text-gray-500"}`}>Login</button>
              </div>
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {!authData.isLogin && (
                  <>
                    <input type="text" required placeholder="Nome Completo" value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black transition-colors" />
                    <input type="tel" required placeholder="WhatsApp" value={maskPhone(authData.phone)} onChange={e => setAuthData({...authData, phone: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black transition-colors" />
                  </>
                )}
                <input type="email" required placeholder="E-mail" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black transition-colors" />
                <input type="password" required placeholder="Senha" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black transition-colors" />
                <div className="pt-6 flex gap-4">
                  <button type="button" onClick={handlePrevStep} className="p-5 rounded-2xl hover:bg-gray-100 text-gray-400 transition-all"><ArrowLeft className="w-5 h-5" /></button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#222] text-white h-14 rounded-2xl font-black uppercase hover:bg-black transition-all shadow-xl shadow-black/10">Continuar</button>
                </div>
              </form>
            </div>
          )}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 w-full max-w-[1000px] mx-auto">
              <div className="mb-10 text-center">
                <p className="text-amber-500 font-bold text-sm tracking-widest uppercase mb-2">Passo 3 de 3</p>
                <h1 className="text-3xl md:text-5xl font-black text-[#222] mb-4">Escolha seu Plano</h1>
                <p className="text-[#717171] text-lg font-medium">Selecione como deseja anunciar seu imóvel.</p>
              </div>
              <div className={`grid gap-6 ${propertyData.type === 'venda' ? 'md:grid-cols-3' : 'md:grid-cols-2 max-w-[700px] mx-auto'}`}>
                <div onClick={() => setSelectedPlan("free")} className={`bg-white rounded-[40px] p-8 md:p-10 border-2 cursor-pointer transition-all hover:shadow-2xl ${selectedPlan === "free" ? "border-[#222] shadow-xl scale-[1.02]" : "border-[#ebebeb]"}`}>
                  <h3 className="text-2xl font-black text-[#222] mb-2">Básico</h3>
                  <p className="text-sm font-black text-emerald-600 mb-6 uppercase tracking-widest">Grátis</p>
                  <ul className="space-y-4 mb-8 text-[15px] font-medium text-[#444]">
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Anúncio no site finHouse</li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Sem exclusividade</li>
                  </ul>
                </div>
                <div onClick={() => setSelectedPlan("premium")} className={`bg-black rounded-[40px] p-8 md:p-10 border-2 cursor-pointer transition-all hover:shadow-2xl relative ${selectedPlan === "premium" ? "border-amber-400 shadow-xl scale-[1.02]" : "border-transparent"}`}>
                  <div className="absolute -top-4 right-8 bg-amber-400 text-[#222] px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest">Recomendado</div>
                  <h3 className="text-2xl font-black text-white mb-2">Elite Premium</h3>
                  <p className="text-sm font-black text-amber-400 mb-6 uppercase tracking-widest">{propertyData.type === 'aluguel' ? '8% Mensal' : '6% Comissão'}</p>
                  <ul className="space-y-4 mb-8 text-[15px] font-medium text-white/80">
                    <li className="flex items-start gap-3"><Zap className="w-5 h-5 text-amber-400 shrink-0" /> Anúncio em todos os Portais</li>
                    <li className="flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" /> Assessoria Jurídica Total</li>
                    <li className="flex items-start gap-3"><Star className="w-5 h-5 text-amber-400 shrink-0" /> Fotos Profissionais</li>
                  </ul>
                </div>
                {propertyData.type === 'venda' && (
                  <div onClick={() => setSelectedPlan("legal")} className={`bg-white rounded-[40px] p-8 md:p-10 border-2 cursor-pointer transition-all hover:shadow-2xl ${selectedPlan === "legal" ? "border-blue-600 shadow-xl scale-[1.02]" : "border-[#ebebeb]"}`}>
                    <h3 className="text-2xl font-black text-[#222] mb-2">Jurídico</h3>
                    <p className="text-sm font-black text-blue-600 mb-6 uppercase tracking-widest">1,9% Comissão</p>
                    <ul className="space-y-4 mb-8 text-[15px] font-medium text-[#444]">
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Elaboração de Contrato</li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Gestão de Documentos</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="mt-12 flex items-center justify-between gap-4">
                <button type="button" onClick={handlePrevStep} className="p-5 rounded-2xl hover:bg-gray-200 transition-all"><ArrowLeft className="w-5 h-5" /></button>
                <button onClick={handleFinish} disabled={isSubmitting || !selectedPlan} className="flex-1 max-w-xs bg-[#222] text-white py-6 rounded-3xl font-black uppercase hover:bg-black shadow-xl shadow-black/10 transition-all hover:scale-105">Publicar Anúncio</button>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="text-center animate-in zoom-in duration-500 max-w-xl mx-auto py-10">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/10"><CheckCircle2 className="w-12 h-12 text-emerald-600" /></div>
              <h1 className="text-4xl font-black text-[#222] mb-4 tracking-tight">Tudo pronto!</h1>
              <p className="text-[#717171] text-lg font-medium mb-8 leading-relaxed">{tempUser ? `Verifique seu e-mail (${tempUser.email}) para confirmar sua conta.` : "Seu anúncio foi criado com sucesso. Redirecionando para o seu painel..."}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AnunciarWizard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-amber-400" /></div>}>
      <AnunciarWizardContent />
    </Suspense>
  );
}
