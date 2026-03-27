"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ArrowRight, ArrowLeft, Home, MapPin, BadgeDollarSign, 
  CheckCircle2, Briefcase, Zap, ShieldCheck, Phone,
  UploadCloud, GripVertical, Trash2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Listing } from "@/contexts/ListingsContext";
import { BAIRROS_SJC, BAIRROS_SP } from "@/lib/constants";

type Step = 1 | 2 | 3 | 4;

const maskPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export default function AnunciarWizard() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulário do Imóvel
  const [propertyData, setPropertyData] = useState({
    title: "",
    description: "",
    type: "venda",
    propertyType: "Apartamento",
    cep: "",
    city: "",
    neighborhood: "",
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

  // Força logout se for uma máquina de corretor que já estava logada.
  React.useEffect(() => {
    supabase.auth.signOut();
  }, []);

  // Fotos
  const [photos, setPhotos] = useState<{ id: string; file: File; url: string }[]>([]);

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
    // Validate Step 1 if needed
    if (step === 1) {
      if (!propertyData.title) return alert("Preencha o título do anúncio");
      if (!propertyData.price) return alert("Preencha o valor do imóvel");
      if (!propertyData.city) return alert("Informe a cidade");
      if (photos.length === 0) return alert("Envie pelo menos 1 foto do imóvel");
    }
    setStep((prev) => (prev + 1) as Step);
  };
  const handlePrevStep = () => setStep((prev) => (prev - 1) as Step);

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
      setPhotos(prev => [...prev, ...newArr].slice(0, 20));
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
  const removePhoto = (index: number) => setPhotos(prev => prev.filter((_, i) => i !== index));

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (authData.isLogin) {
        // Tentativa de Login
        const { error } = await login(authData.email, authData.password);
        if (error) throw new Error(error);
      } else {
        // Tentativa de Cadastro
        const { error: signUpError } = await supabase.auth.signUp({
          email: authData.email,
          password: authData.password,
          options: {
            data: {
              full_name: authData.name,
              role: 'owner' // podemos marcar como proprietário
            }
          }
        });
        if (signUpError) throw new Error(signUpError.message);
        
        // E loga na sequência
        await login(authData.email, authData.password);
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
      // 1. Pega sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Usuário não autenticado");

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

      // 3. Monta o Payload do Anúncio
      const payload: Partial<Listing> = {
        title: propertyData.title,
        description: propertyData.description || `Plano selecionado: ${selectedPlan.toUpperCase()}.`,
        type: propertyData.type as "venda" | "aluguel",
        propertyType: propertyData.propertyType,
        price: parseCurrency(propertyData.price) || 0,
        condominium: parseCurrency(propertyData.condominium) || 0,
        area: Number(propertyData.area) || 0,
        bedrooms: Number(propertyData.bedrooms) || 0,
        bathrooms: Number(propertyData.bathrooms) || 0,
        parking: Number(propertyData.parking) || 0,
        cep: propertyData.cep,
        city: propertyData.city,
        neighborhood: propertyData.neighborhood,
        address: propertyData.address,
        images: uploadedUrls,
        user_id: session.user.id,
        author: session.user.email?.split("@")[0] || "Proprietário",
        acceptsExchange: propertyData.acceptsExchange,
        iptu: parseCurrency(propertyData.iptu) || 0,
        owner_name: authData.name || session.user.email?.split("@")[0],
        owner_phone: authData.phone.replace(/\D/g, ""), // Salvar apenas números
        plan: selectedPlan,
        status: "pending_approval"
      };

      // 4. Salva no Supabase (na tabela listings)
      const { error } = await supabase.from('listings').insert([payload]);
      
      if (error) throw error;

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
                    <label className="text-sm font-semibold text-[#222]">Título do Anúncio *</label>
                    <input type="text" placeholder="Ex: Lindo apartamento com varanda gourmet, vista livre..." value={propertyData.title} onChange={e => setPropertyData({...propertyData, title: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                  </div>

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
                        <label className="text-sm font-semibold text-[#222]">Cidade (Onde fica?)</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <select 
                            value={propertyData.city}
                            onChange={e => setPropertyData({...propertyData, city: e.target.value, neighborhood: ""})}
                            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black appearance-none"
                          >
                            <option value="" disabled>Selecione a cidade</option>
                            <option value="São José dos Campos">São José dos Campos</option>
                            <option value="São Paulo">São Paulo</option>
                            <option value="" disabled>Outras cidades em breve...</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#222]">Bairro</label>
                        <select 
                          value={propertyData.neighborhood} 
                          onChange={e => setPropertyData({...propertyData, neighborhood: e.target.value})} 
                          disabled={!propertyData.city}
                          className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black appearance-none disabled:opacity-50"
                        >
                          <option value="" disabled>{propertyData.city ? "Selecione o bairro" : "Selecione a cidade primeiro"}</option>
                          {propertyData.city === "São José dos Campos" && BAIRROS_SJC.map((b: string) => <option key={b} value={b}>{b}</option>)}
                          {propertyData.city === "São Paulo" && BAIRROS_SP.map((b: string) => <option key={b} value={b}>{b}</option>)}
                          {propertyData.city && <option value="Outro">Outro (Não listado)</option>}
                        </select>
                      </div>

                      <div className="space-y-2 col-span-1 md:col-span-2">
                        <label className="text-sm font-semibold text-[#222]">Endereço Completo</label>
                        <input type="text" placeholder="Sua rua e número (não será exibido no anúncio)" value={propertyData.address} onChange={e => setPropertyData({...propertyData, address: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#222]">Quartos</label>
                    <input type="number" placeholder="0" value={propertyData.bedrooms} onChange={e => setPropertyData({...propertyData, bedrooms: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#222]">Banheiros</label>
                    <input type="number" placeholder="0" value={propertyData.bathrooms} onChange={e => setPropertyData({...propertyData, bathrooms: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#222]">Vagas na Garagem</label>
                    <input type="number" placeholder="0" value={propertyData.parking} onChange={e => setPropertyData({...propertyData, parking: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#222]">Área Útil (m²)</label>
                    <input type="number" placeholder="Ex: 80" value={propertyData.area} onChange={e => setPropertyData({...propertyData, area: e.target.value})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-[#222]">Descrição do Imóvel</label>
                    <textarea 
                      placeholder="Fale um pouco sobre o imóvel..." 
                      value={propertyData.description} 
                      onChange={e => setPropertyData({...propertyData, description: e.target.value})} 
                      className="w-full min-h-[120px] p-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none" 
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-4">
                      <label className="text-sm font-semibold text-[#222]">Fotos (até 20) * - Arraste para ordenar</label>
                      <label className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-[#ddd] rounded-2xl cursor-pointer hover:bg-[#f7f7f7] transition-colors p-4 text-center">
                          <UploadCloud className="w-8 h-8 text-[#b0b0b0] mb-2" />
                          <span className="text-[14px] font-semibold text-[#222]">Clique para selecionar fotos</span>
                          <span className="text-[13px] text-[#717171] mt-1">Carregue imagens bem iluminadas do seu imóvel</span>
                          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>

                      {photos.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                              {photos.map((photo, index) => (
                                  <div
                                      key={photo.id}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, index)}
                                      onDrop={(e) => handleDrop(e, index)}
                                      onDragOver={handleDragOver}
                                      className="relative aspect-square rounded-xl overflow-hidden group border border-[#ebebeb] cursor-grab active:cursor-grabbing bg-[#f7f7f7]"
                                  >
                                      <img src={photo.url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                          <button type="button" onClick={() => removePhoto(index)} className="p-1.5 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors" title="Excluir">
                                              <Trash2 className="w-4 h-4" />
                                          </button>
                                      </div>
                                      <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                          {index + 1}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="space-y-4 col-span-1 md:col-span-2 mt-4 pt-6 border-t border-gray-100">
                    <label className="text-sm font-semibold text-[#222] flex items-center gap-2"><BadgeDollarSign className="w-5 h-5 text-amber-500" /> Valores Esperados (R$)</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Valor do Imóvel *</span>
                        <input type="text" placeholder="R$ 500.000,00" value={propertyData.price} onChange={e => setPropertyData({...propertyData, price: formatCurrency(e.target.value)})} className="w-full h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-lg font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
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

                  <div className="col-span-1 md:col-span-2 flex items-center gap-2 pt-2">
                      <input type="checkbox" id="permuta" checked={propertyData.acceptsExchange} onChange={(e) => setPropertyData({...propertyData, acceptsExchange: e.target.checked})} className="w-5 h-5 rounded border-[#ddd] text-[#222]" />
                      <label htmlFor="permuta" className="text-sm font-semibold text-[#222] cursor-pointer">Aceita Permuta?</label>
                  </div>
                </div>

              <div className="mt-10 flex justify-end">
                <button 
                  onClick={handleNextStep}
                  disabled={!propertyData.city || !propertyData.price}
                  className="bg-[#222] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-black transition-colors disabled:opacity-50"
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
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 w-full max-w-[900px]">
              <div className="mb-10 text-center">
                <p className="text-amber-500 font-bold text-sm tracking-widest uppercase mb-2">Passo 3 de 3</p>
                <h1 className="text-3xl md:text-5xl font-extrabold text-[#222] mb-4">Escolha o plano ideal</h1>
                <p className="text-[#717171] text-lg max-w-2xl mx-auto">Venda do seu jeito. Com assessoria completa, ou apenas com uma ajudinha para organizar.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* PLANO A: FREE */}
                <div 
                  onClick={() => setSelectedPlan("free")}
                  className={`bg-white rounded-[32px] p-8 border-2 cursor-pointer transition-all hover:-translate-y-1 ${selectedPlan === "free" ? "border-black shadow-2xl shadow-black/10 scale-[1.02]" : "border-[#ebebeb] hover:border-gray-300"}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Home className="w-6 h-6 text-[#222]" />
                    </div>
                    {selectedPlan === "free" && <CheckCircle2 className="w-6 h-6 text-black fill-black/10" />}
                  </div>
                  <h3 className="text-xl font-extrabold text-[#222] mb-1">Básico</h3>
                  <p className="text-sm font-bold text-emerald-600 mb-6 uppercase tracking-wider">Anúncio Grátis</p>
                  <p className="text-sm text-[#717171] mb-8 min-h-[60px]">Seu imóvel visível na plataforma finHouse para milhares de compradores.</p>
                  
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3 text-sm text-[#444] font-medium"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Anúncio no site finHouse</li>
                    <li className="flex items-start gap-3 text-sm text-[#444] font-medium"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Sem exclusividade</li>
                    <li className="flex items-start gap-3 text-sm text-[#444] font-medium"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Financiamento para o comprador</li>
                  </ul>
                  
                  <p className="text-xs text-gray-400 font-medium">Comissão padrão apenas se a venda ocorrer conosco.</p>
                </div>

                {/* PLANO B: PREMIUM (MERCADO) */}
                <div 
                  onClick={() => setSelectedPlan("premium")}
                  className={`bg-black rounded-[32px] p-8 border-2 cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden ${selectedPlan === "premium" ? "border-amber-400 shadow-2xl shadow-amber-500/20 scale-[1.02]" : "border-transparent"}`}
                >
                  <div className="absolute top-6 right-6 px-3 py-1 bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest rounded-full">Recomendado</div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 border border-white/20">
                    <Briefcase className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-extrabold text-white mb-1">Elite Premium</h3>
                  <p className="text-sm font-bold text-amber-400 mb-6 uppercase tracking-wider">Comissão Mercado (6%)</p>
                  <p className="text-sm text-white/70 mb-8 min-h-[60px]">A experiência sem dor de cabeça. Nós gerenciamos tudo, você só assina o contrato.</p>
                  
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3 text-sm text-white/90 font-medium"><Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Anúncio Premium (ZAP, VivaReal)</li>
                    <li className="flex items-start gap-3 text-sm text-white/90 font-medium"><ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Filtro de Curiosos pelas visitas</li>
                    <li className="flex items-start gap-3 text-sm text-white/90 font-medium"><Briefcase className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Assessor Pessoal Dedicado</li>
                    <li className="flex items-start gap-3 text-sm text-white/90 font-medium"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> Fotos Profissionais</li>
                  </ul>
                  <p className="text-xs text-white/40 font-medium">Zero custo fixo. Só paga se vender.</p>
                </div>

                {/* PLANO C: JURIDICO */}
                <div 
                  onClick={() => setSelectedPlan("legal")}
                  className={`bg-white rounded-[32px] p-8 border-2 cursor-pointer transition-all hover:-translate-y-1 ${selectedPlan === "legal" ? "border-black shadow-2xl shadow-black/10 scale-[1.02]" : "border-[#ebebeb] hover:border-gray-300"}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-blue-600" />
                    </div>
                    {selectedPlan === "legal" && <CheckCircle2 className="w-6 h-6 text-black fill-black/10" />}
                  </div>
                  <h3 className="text-xl font-extrabold text-[#222] mb-1">Só Assessoria</h3>
                  <p className="text-sm font-bold text-blue-600 mb-6 uppercase tracking-wider">A partir de 1,5%</p>
                  <p className="text-sm text-[#717171] mb-8 min-h-[60px]">Achou o comprador sozinho, mas precisa de ajuda com a burocracia e financiamento?</p>
                  
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3 text-sm text-[#444] font-medium"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Contrato Jurídico Blindado</li>
                    <li className="flex items-start gap-3 text-sm text-[#444] font-medium"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Emissão de Certidões</li>
                    <li className="flex items-start gap-3 text-sm text-[#444] font-medium"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Orientação no Financiamento</li>
                  </ul>
                  <p className="text-xs text-gray-400 font-medium">Para transações de Venda Direta seguras.</p>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between">
                <button type="button" onClick={handlePrevStep} className="p-4 rounded-2xl hover:bg-gray-200 text-gray-500 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleFinish}
                  disabled={isSubmitting || !selectedPlan}
                  className="bg-[#222] text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 hover:bg-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-black/10"
                >
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
                Já estamos enviando as informações para a nossa equipe. Você será redirecionado para o seu painel de controle em instantes...
              </p>
              <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin mx-auto"></div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
