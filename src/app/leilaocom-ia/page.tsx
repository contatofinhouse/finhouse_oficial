"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import {
  Search,
  Scale,
  Landmark,
  FileText,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  ArrowUpRight,
  X,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Lock,
  BarChart3,
  Copy,
  Check,
  Printer,
  Compass,
  SlidersHorizontal,
  Percent,
  Sparkles,
  Heart,
  Share2,
} from "lucide-react";
import type { ScrapedAuctionLot } from "@/app/api/leiloes/route";

const WA_NUMBER = "5511955842951";
const DOSSIE_PRICE = "R$ 49,90";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

// Helper para normalizar strings removendo acentos e pontuações
const normalizeTerm = (val: string) =>
  (val || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Helper para máscara de telefone (11) 99999-9999
const formatPhoneInput = (val: string) => {
  const digits = val.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

// Helper para máscara de moeda BRL (recurso próprio e filtros)
const formatCurrencyInput = (val: string) => {
  const digits = val.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(num);
};

// Fórmula Haversine para cálculo de distância em km entre dois pontos geográficos
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Coordenadas centrais de Bairros e Cidades de SP para pesquisa e expansão inteligente de raio (5 a 10km)
const SEARCH_LOCATIONS_COORDS: Record<string, [number, number]> = {
  // Bairros SP Capital
  moema: [-23.5991, -46.6658],
  indianopolis: [-23.6032, -46.6621],
  "itaim bibi": [-23.5848, -46.6784],
  "vila olimpia": [-23.5955, -46.6848],
  brooklin: [-23.6122, -46.6895],
  "campo belo": [-23.6224, -46.6708],
  "jardim das acacias": [-23.6215, -46.6951],
  "planalto paulista": [-23.608, -46.649],
  "vila mariana": [-23.5815, -46.6382],
  "jardim paulista": [-23.5679, -46.6612],
  jardins: [-23.5679, -46.6612],
  pinheiros: [-23.5642, -46.6894],
  "vila madalena": [-23.5542, -46.6932],
  perdizes: [-23.5368, -46.6741],
  pompeia: [-23.5298, -46.6836],
  lapa: [-23.5236, -46.7022],
  "bela vista": [-23.5616, -46.649],
  consolacao: [-23.5535, -46.6582],
  "santa cecilia": [-23.5329, -46.6518],
  centro: [-23.5453, -46.636],
  republica: [-23.5432, -46.6426],
  mooca: [-23.5558, -46.5967],
  "alto da mooca": [-23.5614, -46.5924],
  tatuape: [-23.5402, -46.5766],
  "vila formosa": [-23.5665, -46.5469],
  penha: [-23.5234, -46.5409],
  itaquera: [-23.5418, -46.4539],
  "vila prudente": [-23.5835, -46.5819],
  ipiranga: [-23.5858, -46.6097],
  saude: [-23.6148, -46.6368],
  jabaquara: [-23.6461, -46.6411],
  "santo amaro": [-23.6528, -46.7074],
  morumbi: [-23.5972, -46.7201],
  "vila sonia": [-23.5988, -46.7375],
  butanta: [-23.5719, -46.7086],
  santana: [-23.5015, -46.6248],
  tucuruvi: [-23.4792, -46.6031],
  "vila curuca": [-23.4988, -46.4225],

  // Cidades do Estado de São Paulo (Litoral e Interior)
  campinas: [-22.9099, -47.0626],
  santos: [-23.9608, -46.3336],
  guaruja: [-23.9934, -46.2564],
  "sao vicente": [-23.9632, -46.3919],
  "praia grande": [-24.0058, -46.4028],
  itanhaem: [-24.1831, -46.7889],
  bertioga: [-23.8542, -46.1383],
  sorocaba: [-23.5015, -47.4526],
  "ribeirao preto": [-21.1775, -47.8103],
  "sao jose dos campos": [-23.2237, -45.9009],
  "sao jose do rio preto": [-20.8113, -49.3758],
  jundiai: [-23.1857, -46.8978],
  piracicaba: [-22.7253, -47.6492],
  bauru: [-22.3145, -49.0587],
  marilia: [-22.2139, -49.9458],
  indaiatuba: [-23.0903, -47.2181],
  "rio claro": [-22.4149, -47.5614],
  jaboticabal: [-21.2558, -48.3244],
  barueri: [-23.5105, -46.8761],
  osasco: [-23.5329, -46.792],
  "sao bernardo do campo": [-23.6914, -46.5646],
  "santo andre": [-23.6639, -46.5383],
  guarulhos: [-23.4542, -46.5333],
  aracatuba: [-21.2089, -50.4328],
  assis: [-22.6617, -50.4181],
  salto: [-23.2008, -47.2869],
  itatiba: [-23.0058, -46.8408],
  carapicuiba: [-23.5228, -46.8356],
  aruja: [-23.3967, -46.3203],
  "mogi mirim": [-22.4319, -46.9578],
  "mogi guacu": [-22.3686, -46.9425],
};

// Base referencial de m² em bairros e regiões de São Paulo para o Estudo de Viabilidade
const SP_M2_BENCHMARK: Record<string, number> = {
  "itaim bibi": 17800,
  "vila nova conceicao": 19500,
  jardins: 16200,
  "jardim paulista": 15900,
  pinheiros: 14800,
  moema: 14500,
  indianopolis: 13200,
  "vila olimpia": 15400,
  brooklin: 13600,
  "campo belo": 12400,
  "planalto paulista": 11900,
  "vila mariana": 12600,
  perdizes: 12200,
  pompeia: 11800,
  "bela vista": 10200,
  consolacao: 10800,
  "santa cecilia": 9800,
  tatuape: 9900,
  mooca: 9100,
  "alto da mooca": 8900,
  "vila prudente": 8700,
  ipiranga: 9200,
  saude: 9600,
  jabaquara: 7900,
  "santo amaro": 8600,
  morumbi: 8800,
  santana: 9100,
  lapa: 9500,
  centro: 7800,
  campinas: 8500,
  santos: 8800,
  guaruja: 7600,
  sorocaba: 6200,
  "sao jose dos campos": 7900,
  "ribeirao preto": 6800,
  indaiatuba: 7400,
  jundiai: 7800,
};

function computeLotViability(lot: ScrapedAuctionLot) {
  const normNeighborhood = normalizeTerm(lot.neighborhood);
  const normCity = normalizeTerm(lot.city);

  let benchmarkM2 = 9400;
  for (const [k, val] of Object.entries(SP_M2_BENCHMARK)) {
    if (
      normNeighborhood.includes(k) ||
      k.includes(normNeighborhood) ||
      normCity.includes(k)
    ) {
      benchmarkM2 = val;
      break;
    }
  }

  const estimatedArea =
    lot.areaM2 && lot.areaM2 >= 20
      ? lot.areaM2
      : Math.max(38, Math.round((lot.marketValue || lot.minBid * 1.4) / benchmarkM2));

  const bidM2 = Math.round(lot.minBid / estimatedArea);
  const marketResaleValue =
    lot.marketValue > lot.minBid
      ? lot.marketValue
      : Math.round(estimatedArea * benchmarkM2);

  // Custos reais de aquisição em leilão em SP
  const auctioneerFee = Math.round(lot.minBid * 0.05); // 5% Leiloeiro
  const itbiSp = Math.round(lot.minBid * 0.03); // 3% ITBI
  const registryAndDeed = Math.round(
    Math.min(18500, Math.max(4200, lot.minBid * 0.015))
  ); // Emolumentos Cartório SP
  const holdingAndLightReform = Math.round(lot.minBid * 0.045); // Reserva 6 meses condomínio/IPTU/reforma leve

  const totalAcquisitionCost =
    lot.minBid + auctioneerFee + itbiSp + registryAndDeed + holdingAndLightReform;

  const grossProfit = Math.max(0, marketResaleValue - totalAcquisitionCost);
  const capitalGainsTax = Math.round(grossProfit * 0.15); // 15% IR Ganho de Capital
  const netProfitFlip = Math.max(0, grossProfit - capitalGainsTax);
  const netRoiPct =
    totalAcquisitionCost > 0
      ? Math.round((netProfitFlip / totalAcquisitionCost) * 100)
      : 0;

  // Projeção de Renda Mensal
  const tradMonthlyRent = Math.round(marketResaleValue * 0.0052);
  const shortStayMonthlyNet = Math.round(tradMonthlyRent * 1.38);

  // Lance Teto Recomendado: valor máximo de lance que ainda preserva margem líquida segura após todos os custos
  const rawMaxBid = Math.round((marketResaleValue * 0.78 - registryAndDeed) / 1.125);
  const maxRecommendedBid = Math.max(
    Math.round(lot.minBid * 1.08),
    Math.min(rawMaxBid, Math.round(marketResaleValue * 0.82))
  );

  return {
    estimatedArea,
    bidM2,
    benchmarkM2,
    marketResaleValue,
    maxRecommendedBid,
    auctioneerFee,
    itbiSp,
    registryAndDeed,
    holdingAndLightReform,
    totalAcquisitionCost,
    grossProfit,
    capitalGainsTax,
    netProfitFlip,
    netRoiPct,
    tradMonthlyRent,
    shortStayMonthlyNet,
  };
}

export default function LeilaoComIaPage() {
  const [lots, setLots] = useState<ScrapedAuctionLot[]>([]);
  const [loadingLots, setLoadingLots] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analyzedCache, setAnalyzedCache] = useState<Record<string, boolean>>({});
  const [updatedAtLabel, setUpdatedAtLabel] = useState<string>("Hoje");

  // Controle de Visualização Mobile ("map" = mapa, "feed" = feed vertical contínuo, "detail" = ficha detalhada)
  const [mobileTab, setMobileTab] = useState<"map" | "feed" | "detail">("map");
  const [sortOrder, setSortOrder] = useState<"discount" | "price_asc">("discount");

  // Favoritos & Compartilhamento
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("finhouse_leiloes_favs");
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const toggleFavorite = (lotId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setFavorites((prev) => {
      const next = { ...prev };
      if (next[lotId]) {
        delete next[lotId];
      } else {
        next[lotId] = true;
      }
      try {
        localStorage.setItem("finhouse_leiloes_favs", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleShare = async (lot: ScrapedAuctionLot, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/leilaocom-ia?lote=${encodeURIComponent(lot.id)}`
        : "";
    const shareText = `Confira este imóvel em leilão: ${lot.title} (${lot.neighborhood || lot.city}/SP) por ${
      lot.minBid > 0 ? formatBRL(lot.minBid) : "Ver Edital"
    }${lot.discountPct > 0 ? ` com -${lot.discountPct}% OFF` : ""}.`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${lot.title} · finHouse`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setToastMessage("Link copiado para a área de transferência!");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
    } catch {}

    setToastMessage("Link: " + shareUrl);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Rastreia se o usuário já clicou/interagiu com algum lote (evita auto-zoom colado na abertura inicial)
  const hasUserInteractedRef = useRef(false);

  // Controle de Dossiês desbloqueados na sessão
  const [unlockedLots, setUnlockedLots] = useState<Record<string, boolean>>({});
  const [pixCopied, setPixCopied] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFinancing, setFilterFinancing] = useState(false);
  const [filterHighDiscount, setFilterHighDiscount] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string>("");

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterFinancing) count++;
    if (filterHighDiscount) count++;
    if (minValue) count++;
    if (maxValue) count++;
    if (filterFavoritesOnly) count++;
    return count;
  }, [filterFinancing, filterHighDiscount, minValue, maxValue, filterFavoritesOnly]);

  // Referência da coluna de detalhes para resetar scroll ao topo
  const rightColumnRef = useRef<HTMLDivElement | null>(null);

  const openLotDetail = (lotId: string) => {
    hasUserInteractedRef.current = true;
    setSelectedId(lotId);
    setMobileTab("detail");
    try {
      if (typeof window !== "undefined") {
        window.scrollTo(0, 0);
      }
      if (rightColumnRef.current) {
        rightColumnRef.current.scrollTop = 0;
      }
    } catch {}
  };

  const openDossieModal = (lotId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    hasUserInteractedRef.current = true;
    setSelectedId(lotId);
    setModalMode(unlockedLots[lotId] ? "dossie_view" : "dossie_checkout");
  };

  useEffect(() => {
    if (mobileTab === "detail") {
      try {
        if (typeof window !== "undefined") {
          window.scrollTo(0, 0);
        }
        if (rightColumnRef.current) {
          rightColumnRef.current.scrollTop = 0;
        }
      } catch {}
    }
  }, [mobileTab, selectedId]);

  // Modais: Advogado / Financiamento / Checkout Dossiê R$ 49,90 / Visualização Dossiê Completo
  const [modalMode, setModalMode] = useState<
    null | "lawyer" | "credit" | "dossie_checkout" | "dossie_view"
  >(null);
  const [mobileMapPreviewLotId, setMobileMapPreviewLotId] = useState<string | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadBudget, setLeadBudget] = useState("");

  // Referências do Mapa Interativo (Leaflet + CARTO Voyager)
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [mapReady, setMapReady] = useState(false);

  // Busca os leilões de SP (com cache diário de 24h no servidor)
  const fetchLiveAuctions = async () => {
    setLoadingLots(true);
    try {
      const res = await fetch(`/api/leiloes?uf=sp`);
      const data = await res.json();
      if (data?.lots && Array.isArray(data.lots)) {
        setLots(data.lots);
        if (data.updatedAt) setUpdatedAtLabel(data.updatedAt);
        if (data.lots.length > 0) {
          setSelectedId(data.lots[0].id);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar leilões:", err);
    } finally {
      setLoadingLots(false);
    }
  };

  useEffect(() => {
    fetchLiveAuctions();
  }, []);

  // Busca inteligente por CEP via ViaCEP automática
  const [cepResolvedNeighborhood, setCepResolvedNeighborhood] = useState<string>("");
  const [cepResolvedCity, setCepResolvedCity] = useState<string>("");

  useEffect(() => {
    const rawDigits = searchQuery.replace(/\D/g, "");
    if (rawDigits.length === 8) {
      fetch(`https://viacep.com.br/ws/${rawDigits}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.bairro) {
            setCepResolvedNeighborhood(data.bairro);
            setCepResolvedCity(data.localidade || "");
          } else {
            setCepResolvedNeighborhood("");
            setCepResolvedCity("");
          }
        })
        .catch(() => {
          setCepResolvedNeighborhood("");
          setCepResolvedCity("");
        });
    } else {
      setCepResolvedNeighborhood("");
      setCepResolvedCity("");
    }
  }, [searchQuery]);

  // Filtragem com suporte a Bairro, CEP, Cidade e Expansão de Raio Automática (<= 6 km)
  const { filteredLots, proximityNotice, lotDistances } = useMemo(() => {
    const minNum = minValue ? parseInt(minValue.replace(/\D/g, ""), 10) : 0;
    const maxNum = maxValue ? parseInt(maxValue.replace(/\D/g, ""), 10) : Infinity;

    const normQuery = normalizeTerm(searchQuery);
    const normCepBairro = normalizeTerm(cepResolvedNeighborhood);
    const normCepCity = normalizeTerm(cepResolvedCity);

    const applySort = (list: ScrapedAuctionLot[]) => {
      const copy = [...list];
      if (sortOrder === "price_asc") {
        return copy.sort((a, b) => a.minBid - b.minBid);
      }
      return copy.sort((a, b) => b.discountPct - a.discountPct);
    };

    // 1. Aplica filtros base (Valor, Financiamento, Super Desconto e Favoritos)
    const baseLots = lots.filter((lot) => {
      const matchesFinancing = !filterFinancing || lot.acceptsFinancing;
      const matchesDiscount = !filterHighDiscount || lot.discountPct >= 35;
      const matchesFavorite = !filterFavoritesOnly || Boolean(favorites[lot.id]);
      const matchesMin = isNaN(minNum) || minNum === 0 || lot.minBid >= minNum;
      const matchesMax = isNaN(maxNum) || maxNum === Infinity || lot.minBid <= maxNum;
      return matchesFinancing && matchesDiscount && matchesFavorite && matchesMin && matchesMax;
    });

    if (!normQuery && !normCepBairro) {
      return {
        filteredLots: applySort(baseLots),
        proximityNotice: null,
        lotDistances: {} as Record<string, number>,
      };
    }

    // 2. Tenta correspondência textual direta
    const directMatches = baseLots.filter((lot) => {
      const normNeighborhood = normalizeTerm(lot.neighborhood);
      const normTitle = normalizeTerm(lot.title);
      const normAddress = normalizeTerm(lot.address);
      const normCity = normalizeTerm(lot.city);
      const normCode = normalizeTerm(lot.code);
      const normSeller = normalizeTerm(lot.seller);

      return (
        (normQuery &&
          (normNeighborhood.includes(normQuery) ||
            normTitle.includes(normQuery) ||
            normAddress.includes(normQuery) ||
            normCity.includes(normQuery) ||
            normCode.includes(normQuery) ||
            normSeller.includes(normQuery))) ||
        (normCepBairro &&
          (normNeighborhood.includes(normCepBairro) ||
            normCepBairro.includes(normNeighborhood) ||
            normAddress.includes(normCepBairro))) ||
        (normCepCity && normCity.includes(normCepCity))
      );
    });

    if (directMatches.length > 0) {
      return {
        filteredLots: applySort(directMatches),
        proximityNotice: null,
        lotDistances: {} as Record<string, number>,
      };
    }

    // 3. REGRA DE EXPANSÃO DE RAIO QUANDO NÃO HÁ MATCH DIRETO (ex: "Moema" ou CEP sem lote estrito hoje)
    const termToLocate = normCepBairro || normQuery;
    let targetCoords: [number, number] | null = null;
    let locationLabel = cepResolvedNeighborhood || searchQuery.trim();

    for (const [name, coords] of Object.entries(SEARCH_LOCATIONS_COORDS)) {
      if (termToLocate.includes(name) || name.includes(termToLocate)) {
        targetCoords = coords;
        locationLabel = name.charAt(0).toUpperCase() + name.slice(1);
        break;
      }
    }

    if (targetCoords) {
      const distances: Record<string, number> = {};
      const nearby: { lot: ScrapedAuctionLot; dist: number }[] = [];

      baseLots.forEach((lot) => {
        const d = calculateDistanceKm(
          targetCoords![0],
          targetCoords![1],
          lot.lat,
          lot.lng
        );
        distances[lot.id] = Math.round(d * 10) / 10;
        if (d <= 12) {
          nearby.push({ lot, dist: d });
        }
      });

      nearby.sort((a, b) => a.dist - b.dist);

      if (nearby.length > 0) {
        // Seleciona preferencialmente os lotes dentro de até ~6.5km, ou os mais próximos até 10km
        const within6km = nearby.filter((item) => item.dist <= 6.5);
        const finalSelection = within6km.length >= 2 ? within6km : nearby.slice(0, 8);
        const lotsResult = finalSelection.map((item) => item.lot);

        const maxFoundDist = Math.max(...finalSelection.map((i) => i.dist));
        const radiusDisplay = Math.ceil(maxFoundDist);

        const nearbyNeighborhoods = Array.from(
          new Set(lotsResult.map((l) => l.neighborhood || l.city))
        ).slice(0, 4);

        return {
          filteredLots: applySort(lotsResult),
          proximityNotice: {
            term: locationLabel,
            radiusKm: Math.max(5, radiusDisplay),
            count: lotsResult.length,
            neighborhoods: nearbyNeighborhoods,
          },
          lotDistances: distances,
        };
      }
    }

    return {
      filteredLots: [],
      proximityNotice: null,
      lotDistances: {} as Record<string, number>,
    };
  }, [
    lots,
    searchQuery,
    cepResolvedNeighborhood,
    cepResolvedCity,
    filterFinancing,
    filterHighDiscount,
    filterFavoritesOnly,
    favorites,
    minValue,
    maxValue,
    sortOrder,
  ]);

  const selectedLot = useMemo(() => {
    return (
      filteredLots.find((l) => l.id === selectedId) ||
      filteredLots[0] ||
      lots[0] ||
      null
    );
  }, [filteredLots, lots, selectedId]);

  const mobileMapPreviewLot = useMemo(() => {
    if (!mobileMapPreviewLotId) return null;
    return lots.find((l) => l.id === mobileMapPreviewLotId) || null;
  }, [lots, mobileMapPreviewLotId]);

  const viability = useMemo(() => {
    if (!selectedLot) return null;
    return computeLotViability(selectedLot);
  }, [selectedLot]);

  // Busca os dados factuais da página do lote (cacheado por 24h no servidor)
  const triggerDeepAnalysis = async (lot: ScrapedAuctionLot) => {
    if (!lot?.sourceUrl || analyzedCache[lot.id]) return;

    setAnalyzingId(lot.id);
    try {
      const res = await fetch("/api/leiloes/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: lot.sourceUrl,
          title: lot.title,
          modality: lot.modality,
          minBid: lot.minBid,
          marketValue: lot.marketValue,
        }),
      });

      if (!res.ok) return;
      const result = await res.json();

      setAnalyzedCache((prev) => ({ ...prev, [lot.id]: true }));
      setLots((prev) =>
        prev.map((item) => {
          if (item.id !== lot.id) return item;
          const safeLat =
            typeof result.exactLat === "number" && Number.isFinite(result.exactLat)
              ? result.exactLat
              : item.lat;
          const safeLng =
            typeof result.exactLng === "number" && Number.isFinite(result.exactLng)
              ? result.exactLng
              : item.lng;

          const rawChecklist = result.aiChecklist || {};
          const toSafeStr = (val: any, fallback: string) =>
            typeof val === "string" && val.trim()
              ? val.trim()
              : val && typeof val === "object"
              ? Object.values(val).filter(Boolean).join(" ") || fallback
              : fallback;

          return {
            ...item,
            imageUrl:
              typeof result.imageUrl === "string" && result.imageUrl
                ? result.imageUrl
                : item.imageUrl,
            lat: safeLat,
            lng: safeLng,
            riskLevel: result.riskLevel || item.riskLevel,
            riskScore:
              typeof result.riskScore === "number"
                ? result.riskScore
                : item.riskScore,
            occupancy: result.occupancy || item.occupancy,
            acceptsFinancing:
              typeof result.acceptsFinancing === "boolean"
                ? result.acceptsFinancing
                : item.acceptsFinancing,
            auctionDate:
              typeof result.auctionDate === "string" && result.auctionDate
                ? result.auctionDate
                : item.auctionDate,
            aiSummary: toSafeStr(result.aiSummary, item.aiSummary),
            aiChecklist: {
              debts: toSafeStr(rawChecklist.debts, item.aiChecklist?.debts || ""),
              matriculaStatus: toSafeStr(
                rawChecklist.matriculaStatus,
                item.aiChecklist?.matriculaStatus || ""
              ),
              paymentRule: toSafeStr(
                rawChecklist.paymentRule,
                item.aiChecklist?.paymentRule || ""
              ),
              lawyerAlert: toSafeStr(
                rawChecklist.lawyerAlert,
                item.aiChecklist?.lawyerAlert || ""
              ),
            },
            documentsRead: Array.isArray(result.documentsRead) && result.documentsRead.length > 0
              ? result.documentsRead
              : item.documentsRead,
          };
        })
      );
    } catch (e) {
      console.error("Erro na leitura do lote:", e);
    } finally {
      setAnalyzingId(null);
    }
  };

  useEffect(() => {
    if (selectedLot && !analyzedCache[selectedLot.id]) {
      triggerDeepAnalysis(selectedLot);
    }
  }, [selectedLot?.id]);

  // Inicializa Leaflet via CDN com CARTO Voyager (Singleton + ResizeObserver + StrictMode Safe)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let handleResize: (() => void) | null = null;
    const SP_CENTER: [number, number] = [-23.5505, -46.6333];
    const SP_MACRO_ZOOM = 9;

    const ensureLeafletScript = (): Promise<any> => {
      if ((window as any).L) return Promise.resolve((window as any).L);
      if ((window as any).__leafletLoadingPromise) {
        return (window as any).__leafletLoadingPromise;
      }

      (window as any).__leafletLoadingPromise = new Promise<any>((resolve) => {
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        const script = document.createElement("script");
        script.id = "leaflet-js-sdk";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.onload = () => resolve((window as any).L);
        script.onerror = () => {
          const fallback = document.createElement("script");
          fallback.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
          fallback.async = true;
          fallback.onload = () => resolve((window as any).L);
          fallback.onerror = () => resolve(null);
          document.body.appendChild(fallback);
        };
        document.body.appendChild(script);
      });

      return (window as any).__leafletLoadingPromise;
    };

    const initMap = async () => {
      const L = await ensureLeafletScript();
      if (cancelled || !L || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: SP_CENTER,
        zoom: SP_MACRO_ZOOM,
        zoomSnap: 1,
        zoomDelta: 1,
        minZoom: 5,
        maxZoom: 18,
        zoomControl: false,
      });

      L.tileLayer("/api/leiloes/tile?z={z}&x={x}&y={y}&r={r}", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        maxZoom: 20,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      map.on("dragstart", () => {
        hasUserInteractedRef.current = true;
      });

      mapInstanceRef.current = map;
      setMapReady(true);

      const enforceSpFocus = () => {
        if (cancelled || !mapInstanceRef.current || !mapContainerRef.current) return;
        if (
          mapContainerRef.current.clientWidth === 0 ||
          mapContainerRef.current.clientHeight === 0
        ) {
          return;
        }
        try {
          mapInstanceRef.current.invalidateSize({ pan: false });
          if (!hasUserInteractedRef.current) {
            mapInstanceRef.current.setView(SP_CENTER, SP_MACRO_ZOOM, { animate: false });
          }
        } catch {}
      };

      enforceSpFocus();
      setTimeout(enforceSpFocus, 60);
      setTimeout(enforceSpFocus, 220);
      setTimeout(enforceSpFocus, 550);

      if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
              enforceSpFocus();
            }
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      handleResize = () => enforceSpFocus();
      window.addEventListener("resize", handleResize);
      window.addEventListener("orientationchange", handleResize);
    };

    initMap();

    return () => {
      cancelled = true;
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (handleResize) {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("orientationchange", handleResize);
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      setMapReady(false);
    };
  }, []);

  // Quando o usuário alterna abas no mobile, força recálculo das dimensões do Leaflet sem alterar o zoom atual
  useEffect(() => {
    if (mapReady && mapInstanceRef.current && mobileTab === "map") {
      const fix = () => {
        if (!mapInstanceRef.current || !mapContainerRef.current) return;
        if (
          mapContainerRef.current.clientWidth === 0 ||
          mapContainerRef.current.clientHeight === 0
        ) {
          return;
        }
        try {
          mapInstanceRef.current.invalidateSize({ pan: false });
          if (!hasUserInteractedRef.current) {
            mapInstanceRef.current.setView([-23.5505, -46.6333], 9, { animate: false });
          }
        } catch {}
      };
      setTimeout(fix, 50);
      setTimeout(fix, 200);
      setTimeout(fix, 500);
    }
  }, [mobileTab, mapReady]);

  // Quando os lotes terminam de carregar da API, garante que o mapa permaneça perfeitamente focado em SP
  useEffect(() => {
    if (mapReady && mapInstanceRef.current && !hasUserInteractedRef.current && lots.length > 0) {
      setTimeout(() => {
        if (
          mapInstanceRef.current &&
          mapContainerRef.current &&
          mapContainerRef.current.clientWidth > 0 &&
          !hasUserInteractedRef.current
        ) {
          try {
            mapInstanceRef.current.invalidateSize({ pan: false });
            mapInstanceRef.current.setView([-23.5505, -46.6333], 9, { animate: false });
          } catch {}
        }
      }, 120);
    }
  }, [lots.length, mapReady]);

  // Renderiza pins harmoniosos no mapa (Paleta finHouse: Navy + Branco + Verde Esmeralda)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const L = (window as any).L;
    const map = mapInstanceRef.current;

    Object.values(markersRef.current).forEach((m: any) => {
      try {
        m.remove();
      } catch {}
    });
    markersRef.current = {};

    filteredLots.forEach((lot) => {
      const isSelected = lot.id === selectedLot?.id;
      const dotColor = lot.acceptsFinancing ? "#059669" : "#0F3B78";

      const bg = isSelected ? "#0F2744" : "#FFFFFF";
      const text = isSelected ? "#FFFFFF" : "#0F172A";
      const border = isSelected ? "#0F2744" : "#CBD5E1";
      const scale = isSelected ? "scale(1.08)" : "scale(1)";
      const zIndex = isSelected ? 900 : 100;

      const discountLabel =
        lot.discountPct > 0
          ? `-${lot.discountPct}%`
          : lot.source === "Portal Zuk"
          ? "ZUK"
          : "ML";

      const icon = L.divIcon({
        className: "finhouse-auction-pin",
        html: `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: ${bg};
            color: ${text};
            border: 1.5px solid ${border};
            border-radius: 9999px;
            padding: 5px 12px;
            font-family: Inter, system-ui, sans-serif;
            font-size: 11.5px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(15, 39, 68, 0.16);
            transform: ${scale};
            transition: all 0.18s ease;
            cursor: pointer;
          ">
            <span style="width: 7px; height: 7px; border-radius: 9999px; background: ${dotColor}; display: inline-block;"></span>
            <span>${discountLabel}</span>
            <span style="opacity: 0.35; font-weight: 400;">|</span>
            <span style="font-weight: 600;">R$ ${Math.round(lot.minBid / 1000)}k</span>
          </div>
        `,
        iconSize: [115, 32],
        iconAnchor: [57, 16],
      });

      if (!Number.isFinite(lot.lat) || !Number.isFinite(lot.lng)) return;

      try {
        const marker = L.marker([lot.lat, lot.lng], {
          icon,
          zIndexOffset: zIndex,
        })
          .addTo(map)
          .on("click", () => {
            hasUserInteractedRef.current = true;
            setSelectedId(lot.id);
            // No mobile, mantém o mapa exatamente como está (sem dar zoom) e abre o modal com o card do lote
            if (typeof window !== "undefined" && window.innerWidth < 1024) {
              setMobileMapPreviewLotId(lot.id);
            }
          });

        markersRef.current[lot.id] = marker;
      } catch {}
    });
  }, [mapReady, filteredLots, selectedLot]);

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot) return;

    if (modalMode === "dossie_checkout") {
      setUnlockedLots((prev) => ({ ...prev, [selectedLot.id]: true }));
      setModalMode("dossie_view");
      return;
    }

    const msg =
      modalMode === "lawyer"
        ? `Olá! Vi o lote *${selectedLot.code} (${selectedLot.title} - ${selectedLot.neighborhood})* de ${selectedLot.source} no /leilaocom-ia da finHouse.\n\n• Lance Mínimo: ${formatBRL(
            selectedLot.minBid
          )} (-${selectedLot.discountPct}%)\n• Link Oficial: ${
            selectedLot.sourceUrl
          }\n\nQuero falar com o Advogado Especialista parceiro para validar a due diligence processual antes do lance.\n\nNome: ${leadName}\nWhatsApp: ${leadPhone}`
        : `Olá, equipe finHouse! Quero simular Financiamento para arrematar o lote *${selectedLot.code} (${selectedLot.title} - ${selectedLot.neighborhood})* no valor de ${formatBRL(
            selectedLot.minBid
          )}.\n\nLink do Leilão: ${selectedLot.sourceUrl}\nNome: ${leadName}\nWhatsApp: ${leadPhone}\nCapital próprio para entrada: ${
            leadBudget || "A definir"
          }`;

    window.open(
      `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
    setModalMode(null);
  };

  const isSelectedUnlocked = Boolean(selectedLot && unlockedLots[selectedLot.id]);

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans antialiased">
      {/* ─── HEADER INSTITUCIONAL FLUTUANTE (FINHOUSE) ─── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-xs transition-shadow">
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 shrink-0">
              {/* Logo Institucional finHouse (mesma tipografia da Home) */}
              <Link href="/" className="flex items-center gap-2 shrink-0 group">
                <Image
                  src="/logo.png"
                  alt="finHouse"
                  width={30}
                  height={30}
                  className="rounded-lg"
                />
                <span className="text-[18px] sm:text-[19px] font-semibold tracking-[-0.02em] text-[#222222]">
                  finHouse
                </span>
              </Link>

              {/* Divisor Vertical Sutil */}
              <span className="h-5 w-px bg-[#E2E8F0]" aria-hidden="true" />

              {/* Sub-brand Logo: leilão com IA (leitura clara sem confundir com .com) */}
              <Link
                href="/leilaocom-ia"
                className="flex items-center gap-1.5 shrink-0 select-none"
                title="Leilão com Inteligência Artificial — finHouse"
              >
                <span className="text-[17px] sm:text-[18px] tracking-[-0.02em] flex items-baseline">
                  <span className="font-semibold text-[#222222]">leilão</span>
                  <span className="font-normal text-[#717171] text-[14px] sm:text-[15px] mx-1">
                    com
                  </span>
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#0F2744] text-white text-[11px] sm:text-[12px] font-bold tracking-tight leading-none shadow-2xs">
                  IA
                </span>
              </Link>
            </div>

            {/* Busca + Botão Menu de Filtro no Desktop */}
            <div className="hidden xl:flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Bairro, CEP ou cidade em SP..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-full text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0F3B78] w-64 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-[#94A3B8] hover:text-[#0F172A]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Botão de Menu de Filtros no Desktop */}
              <button
                type="button"
                onClick={() => setShowFilterModal(true)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeFilterCount > 0
                    ? "bg-[#0F2744] text-white border-[#0F2744] shadow-xs"
                    : "bg-white text-[#334155] border-[#CBD5E1] hover:border-[#0F2744] hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filtros</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white text-[#0F2744] text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Favoritos Desktop */}
              <button
                type="button"
                onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  filterFavoritesOnly
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]"
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    filterFavoritesOnly ? "fill-white text-white" : "text-rose-500"
                  }`}
                />
                <span>Salvos ({Object.keys(favorites).length})</span>
              </button>

              {/* Botão Limpar Tudo se algum filtro estiver ativo */}
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterFinancing(false);
                    setFilterHighDiscount(false);
                    setFilterFavoritesOnly(false);
                    setMinValue("");
                    setMaxValue("");
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline px-1 cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Status de Sincronização Diária no Estado de SP */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#64748B]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Base SP sincronizada ({updatedAtLabel})</span>
          </div>
        </div>

        {/* Linha Limpa no Mobile / Tablet: Campo de Busca + Botão de Filtro + Salvos */}
        <div className="xl:hidden px-3.5 py-2 border-t border-[#F1F5F9] flex items-center gap-2 bg-white">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar bairro, CEP ou cidade em SP..."
              className="w-full pl-8 pr-7 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0F3B78]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botão Único que Abre o Menu de Filtros (Sem Poluição) */}
          <button
            type="button"
            onClick={() => setShowFilterModal(true)}
            className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
              activeFilterCount > 0
                ? "bg-[#0F2744] text-white border-[#0F2744] shadow-xs"
                : "bg-white text-[#334155] border-[#CBD5E1] hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-[#0F2744] text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Botão Rápido de Salvos */}
          <button
            type="button"
            onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
            className={`p-2 rounded-xl border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              filterFavoritesOnly
                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                : "bg-white text-[#475569] border-[#CBD5E1] hover:border-rose-400"
            }`}
            title="Ver imóveis favoritados"
          >
            <Heart
              className={`w-4 h-4 ${
                filterFavoritesOnly ? "fill-white text-white" : "text-rose-500"
              }`}
            />
          </button>
        </div>
      </header>

      {/* ─── SELETOR DE ABA MOBILE (MAPA VS FEED DE IMÓVEIS) ─── */}
      <div className="lg:hidden flex items-center bg-white border-b border-[#E2E8F0] p-1.5 gap-1.5 z-20">
        <button
          type="button"
          onClick={() => {
            setMobileTab("map");
            setTimeout(() => {
              if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
            }, 150);
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            mobileTab === "map"
              ? "bg-[#0F2744] text-white shadow-xs"
              : "bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Ver no Mapa
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("feed")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            mobileTab === "feed" || mobileTab === "detail"
              ? "bg-[#0F2744] text-white shadow-xs"
              : "bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Ver Imóveis ({filteredLots.length})
        </button>
      </div>

      {/* ─── BANNER DE EXPANSÃO DE RAIO QUANDO NÃO HÁ MATCH EXATO ─── */}
      {proximityNotice && (
        <div className="bg-blue-50/90 border-b border-blue-200/80 px-4 py-2.5 text-xs text-[#0F3B78] flex items-center gap-2.5 z-20">
          <Compass className="w-4 h-4 text-[#0F3B78] shrink-0 animate-pulse" />
          <div className="flex-1 leading-snug">
            <span>
              Não encontramos leilões com endereço exato em{" "}
              <strong>&ldquo;{proximityNotice.term}&rdquo;</strong> hoje.
            </span>{" "}
            <span className="font-semibold">
              Expandimos a busca para até {proximityNotice.radiusKm} km
            </span>{" "}
            <span>
              e encontramos <strong>{proximityNotice.count} leilões na vizinhança</strong>
              {proximityNotice.neighborhoods.length > 0 &&
                ` (${proximityNotice.neighborhoods.join(", ")})`}
              :
            </span>
          </div>
        </div>
      )}

      {/* ─── WORKSPACE SPLIT-VIEW: MAPA INTERATIVO + PAINEL DO LOTE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 w-full max-w-full min-h-[calc(100vh-64px)] flex-1">
        {/* COLUNA ESQUERDA: MAPA INTERATIVO + SELETOR DE LOTES */}
        <div
          className={`w-full max-w-full min-w-0 overflow-hidden lg:col-span-7 relative flex-col border-b lg:border-b-0 lg:border-r border-[#E2E8F0] ${
            mobileTab === "map" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Palco dedicado do Mapa com altura explícita no Mobile e flex-1 no Desktop */}
          <div className="relative w-full h-[58vh] min-h-[400px] lg:h-auto lg:flex-1 lg:min-h-[600px] overflow-hidden bg-[#E2E8F0]">
            <div
              ref={mapContainerRef}
              className="w-full h-full z-10"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            />

            {/* Contador e Botão de Visão Macro no Topo do Mapa */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
              <div className="bg-white/95 backdrop-blur-sm border border-[#E2E8F0] rounded-full px-3.5 py-1.5 shadow-sm flex items-center gap-2.5 text-[11px] text-[#475569] pointer-events-auto">
                {loadingLots ? (
                  <span className="flex items-center gap-1.5 font-semibold text-[#0F3B78]">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Sincronizando leilões de São Paulo...
                  </span>
                ) : (
                  <>
                    <span className="font-semibold text-[#0F172A]">
                      {filteredLots.length} oportunidades em SP
                    </span>
                    <span className="text-[#CBD5E1]">|</span>
                    <span className="hidden sm:inline text-[#64748B]">
                      Mega Leilões & Portal Zuk
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (mapInstanceRef.current) {
                    hasUserInteractedRef.current = false;
                    try {
                      mapInstanceRef.current.setView([-23.5505, -46.6333], 9, { animate: false });
                    } catch {}
                  }
                }}
                className="bg-white/95 backdrop-blur-sm border border-[#CBD5E1] hover:border-[#0F2744] rounded-full px-3 py-1.5 shadow-sm text-[11px] font-semibold text-[#0F2744] hover:bg-slate-50 transition-colors pointer-events-auto flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Centralizar na cidade de São Paulo com 5x zoom out"
              >
                <Compass className="w-3.5 h-3.5 text-[#0F3B78]" />
                <span>Visão Macro SP (5x)</span>
              </button>
            </div>
          </div>

          {/* Carrossel Inferior de Lotes no Mapa com Fotos Reais (Estilo Airbnb / QuintoAndar) */}
          <div className="w-full max-w-full bg-white border-t border-[#E2E8F0] px-3 py-2.5 z-20 overflow-x-auto">
            <div className="flex items-center gap-2.5">
              {filteredLots.map((lot) => {
                const active = lot.id === selectedLot?.id;
                const dist = lotDistances[lot.id];
                return (
                  <div
                    key={lot.id}
                    onClick={() => {
                      hasUserInteractedRef.current = true;
                      setSelectedId(lot.id);
                      if (typeof window !== "undefined" && window.innerWidth < 1024) {
                        setMobileMapPreviewLotId(lot.id);
                      }
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all shrink-0 w-[295px] sm:w-[325px] cursor-pointer ${
                      active
                        ? "bg-[#0F2744] text-white border-[#0F2744] shadow-md ring-2 ring-[#0F2744]/25"
                        : "bg-[#F8FAFC] hover:bg-white text-[#0F172A] border-[#E2E8F0]"
                    }`}
                  >
                    {/* Thumbnail com Foto Real do Lote */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                      {lot.imageUrl ? (
                        <img
                          src={lot.imageUrl}
                          alt={lot.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                          <Landmark className="w-6 h-6 stroke-[1.5]" />
                        </div>
                      )}
                      {lot.discountPct > 0 && (
                        <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                          -{lot.discountPct}%
                        </span>
                      )}

                      {/* Botão Favoritar na Thumbnail */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(lot.id, e)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-white/90 hover:bg-white shadow-xs z-10 cursor-pointer active:scale-90 transition-transform"
                        title={favorites[lot.id] ? "Remover dos favoritos" : "Salvar nos favoritos"}
                      >
                        <Heart
                          className={`w-3 h-3 transition-colors ${
                            favorites[lot.id]
                              ? "fill-rose-500 text-rose-500"
                              : "text-slate-600 hover:text-rose-500"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Detalhes do Imóvel: Bairro, Cidade, Rua e Preço */}
                    <div className="min-w-0 flex-1 flex flex-col justify-between h-20 py-0.5">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 truncate">
                            {lot.source} · {lot.neighborhood}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold opacity-95 truncate leading-tight">
                          {lot.city}/SP
                        </div>
                        <div className="text-[10px] opacity-70 truncate mt-0.5">
                          {lot.address}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-black/5 dark:border-white/10">
                        <div className="text-xs font-bold truncate">
                          {lot.minBid > 0 ? formatBRL(lot.minBid) : "Sob Consulta"}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleShare(lot, e)}
                            className={`p-1 rounded-lg border text-[10px] flex items-center justify-center transition-colors cursor-pointer ${
                              active
                                ? "border-white/30 text-white hover:bg-white/10"
                                : "border-[#CBD5E1] text-[#0F2744] hover:bg-slate-100"
                            }`}
                            title="Compartilhar imóvel"
                          >
                            <Share2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => openDossieModal(lot.id, e)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-0.5 shrink-0 whitespace-nowrap transition-colors cursor-pointer ${
                              active
                                ? "bg-white text-[#0F2744] hover:bg-slate-100 shadow-xs"
                                : "bg-[#0F2744] text-white hover:bg-[#0A1B30]"
                            }`}
                          >
                            Ver Dossiê
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: FEED DE IMÓVEIS (MOBILE) OU DETALHES DO LOTE (DESKTOP & MOBILE DETAIL) */}
        <div
          ref={rightColumnRef}
          className={`w-full max-w-full min-w-0 overflow-x-hidden lg:col-span-5 bg-white flex-col h-full overflow-y-auto ${
            mobileTab !== "map" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* MODO 1 (MOBILE): FEED VERTICAL CONTÍNUO COM FOTOS GRANDES (ESTILO AIRBNB / QUINTOANDAR) */}
          {mobileTab === "feed" && (
            <div className="lg:hidden p-3.5 space-y-4 pb-24">
              {/* Topo do Feed com Contador, Favoritos e Botão Mapa */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E2E8F0]">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#0F172A] truncate">
                    {filteredLots.length} Imóveis Disponíveis
                  </div>
                  <div className="text-[10px] text-[#64748B] truncate">
                    Toque no card para detalhes
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                      filterFavoritesOnly
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]"
                    }`}
                  >
                    <Heart
                      className={`w-3 h-3 shrink-0 ${
                        filterFavoritesOnly ? "fill-white text-white" : "text-rose-500"
                      }`}
                    />
                    <span className="whitespace-nowrap">Favoritos ({Object.keys(favorites).length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileTab("map");
                      setTimeout(() => {
                        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
                      }, 150);
                    }}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#0F2744]/5 text-[#0F2744] border border-[#0F2744]/15 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-[#0F3B78] shrink-0" />
                    <span className="whitespace-nowrap">Mapa</span>
                  </button>
                </div>
              </div>

              {/* Lista Vertical de Cards no Feed */}
              {filteredLots.map((lot) => {
                return (
                  <div
                    key={lot.id}
                    onClick={() => openLotDetail(lot.id)}
                    className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    {/* Foto Principal Limpa com Desconto + Favoritar/Share */}
                    <div className="relative h-48 sm:h-52 w-full bg-slate-100">
                      {lot.imageUrl ? (
                        <img
                          src={lot.imageUrl}
                          alt={lot.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                          <Landmark className="w-10 h-10 stroke-[1.5]" />
                          <span className="text-[11px] font-medium mt-1">Foto oficial no edital</span>
                        </div>
                      )}

                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                        <div className="flex items-center gap-1.5 pointer-events-auto">
                          {lot.discountPct > 0 && (
                            <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                              -{lot.discountPct}% OFF
                            </span>
                          )}
                          <span className="bg-slate-900/75 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full shadow-sm">
                            {lot.source}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 pointer-events-auto">
                          <button
                            type="button"
                            onClick={(e) => handleShare(lot, e)}
                            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-md text-[#0F172A] flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
                            title="Compartilhar imóvel"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(lot.id, e)}
                            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-md flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
                            title={favorites[lot.id] ? "Remover dos favoritos" : "Salvar nos favoritos"}
                          >
                            <Heart
                              className={`w-4 h-4 transition-colors ${
                                favorites[lot.id]
                                  ? "fill-rose-500 text-rose-500"
                                  : "text-[#0F172A] hover:text-rose-500"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dados do Imóvel Limpos */}
                    <div className="p-4 space-y-2.5">
                      <div>
                        <div className="text-[11px] font-medium text-[#64748B]">
                          {lot.modality} · Lote {lot.code}
                        </div>
                        <h3 className="text-sm font-bold text-[#0F172A] line-clamp-2 leading-snug mt-0.5">
                          {lot.title}
                        </h3>
                        <div className="text-xs text-[#475569] truncate mt-1">
                          {lot.address}
                        </div>
                      </div>

                      {/* Data e Área */}
                      <div className="flex items-center justify-between text-xs text-[#64748B] pt-0.5">
                        <span className="truncate">
                          Encerramento: {lot.auctionDate || "Ver no Edital"}
                        </span>
                        {lot.areaM2 && (
                          <span className="font-semibold text-[#0F172A] shrink-0">
                            {lot.areaM2} m²
                          </span>
                        )}
                      </div>

                      {/* Bloco de Preço e CTAs */}
                      <div className="pt-2.5 border-t border-[#F1F5F9] flex items-end justify-between gap-2">
                        <div>
                          <div className="text-[11px] text-[#64748B]">Lance Mínimo</div>
                          <div className="text-base font-bold text-[#0F172A]">
                            {lot.minBid > 0 ? formatBRL(lot.minBid) : "Ver Edital"}
                          </div>
                          {lot.marketValue > lot.minBid && (
                            <div className="text-[11px] text-[#94A3B8] line-through">
                              Avaliação: {formatBRL(lot.marketValue)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              hasUserInteractedRef.current = true;
                              setSelectedId(lot.id);
                              setMobileTab("map");
                            }}
                            className="p-2 rounded-xl border border-[#CBD5E1] text-[#0F2744] hover:bg-slate-50 transition-colors cursor-pointer"
                            title="Localizar no mapa"
                          >
                            <MapPin className="w-4 h-4 text-[#0F3B78]" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => openDossieModal(lot.id, e)}
                            className="px-3.5 py-2 rounded-xl bg-[#0F2744] hover:bg-[#0A1B30] text-white text-xs font-bold shadow-xs flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                          >
                            <span>Ver Dossiê</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MODO 2: FICHA LIMPA DO IMÓVEL (DESKTOP SEMPRE OU MOBILE QUANDO NO MODO "DETAIL") */}
          <div className={`${mobileTab === "feed" ? "hidden" : "flex"} flex-col flex-1`}>
            {/* Barra de Retorno ao Feed no Mobile */}
            <div className="lg:hidden p-3 bg-white border-b border-[#E2E8F0] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setMobileTab("feed")}
                className="py-1.5 px-3 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                ← Voltar para Imóveis
              </button>
              <button
                type="button"
                onClick={() => {
                  hasUserInteractedRef.current = true;
                  setMobileTab("map");
                }}
                className="py-1.5 px-3 rounded-xl border border-[#CBD5E1] text-[#0F2744] text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#0F3B78]" />
                Ver no Mapa
              </button>
            </div>

            {selectedLot && viability ? (
              <>
                <div className="p-4 sm:p-6 flex-1 space-y-5">
                  {/* 1. Foto Limpa (Sem Texto Repetido embaixo) */}
                  <div className="relative w-full h-52 sm:h-60 rounded-2xl overflow-hidden bg-slate-100 border border-[#E2E8F0]">
                    {selectedLot.imageUrl ? (
                      <img
                        src={selectedLot.imageUrl}
                        alt={selectedLot.title}
                        className="w-full h-full object-cover"
                        loading="eager"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                        <Landmark className="w-10 h-10 stroke-[1.5]" />
                        <span className="text-xs font-medium mt-1">Foto oficial no edital</span>
                      </div>
                    )}

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                      <div className="flex items-center gap-1.5 pointer-events-auto">
                        {selectedLot.discountPct > 0 && (
                          <span className="bg-emerald-600/95 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                            -{selectedLot.discountPct}% OFF
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 pointer-events-auto">
                        <button
                          type="button"
                          onClick={(e) => handleShare(selectedLot, e)}
                          className="h-8 px-3 rounded-full bg-white/95 hover:bg-white backdrop-blur-md text-[#0F172A] flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer text-xs font-semibold"
                          title="Compartilhar imóvel"
                        >
                          <Share2 className="w-3.5 h-3.5 text-[#0F3B78]" />
                          <span className="hidden sm:inline">Compartilhar</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(selectedLot.id, e)}
                          className="h-8 px-3 rounded-full bg-white/95 hover:bg-white backdrop-blur-md flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer text-xs font-semibold"
                          title={favorites[selectedLot.id] ? "Remover dos favoritos" : "Salvar nos favoritos"}
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${
                              favorites[selectedLot.id]
                                ? "fill-rose-500 text-rose-500"
                                : "text-[#0F172A] hover:text-rose-500"
                            }`}
                          />
                          <span
                            className={`hidden sm:inline ${
                              favorites[selectedLot.id]
                                ? "text-rose-600 font-bold"
                                : "text-[#0F172A]"
                            }`}
                          >
                            {favorites[selectedLot.id] ? "Salvo" : "Salvar"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. Cabeçalho Unificado (Tipografia Única e Limpa) */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B]">
                      <span>
                        {selectedLot.source} · Lote {selectedLot.code} · {selectedLot.modality}
                      </span>
                      <a
                        href={selectedLot.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#0F3B78] hover:underline"
                      >
                        Abrir leiloeiro
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <h1 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug">
                      {selectedLot.title}
                    </h1>

                    <p className="text-xs sm:text-sm text-[#475569]">
                      {selectedLot.address}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#475569]">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                        <Calendar className="w-3.5 h-3.5 text-[#0F3B78]" />
                        <span>Encerramento: <strong className="text-[#0F172A]">{selectedLot.auctionDate || "Consultar no Edital"}</strong></span>
                      </span>
                      {lotDistances[selectedLot.id] !== undefined && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                          ~{lotDistances[selectedLot.id]} km da busca
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3. Resumo Financeiro Direto (3 Colunas Limpas) */}
                  <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div>
                      <div className="text-[11px] text-[#64748B]">Lance Mínimo</div>
                      <div className="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5">
                        {selectedLot.minBid > 0 ? formatBRL(selectedLot.minBid) : "Ver Edital"}
                      </div>
                      {selectedLot.marketValue > selectedLot.minBid && (
                        <div className="text-[11px] text-[#94A3B8] line-through mt-0.5">
                          {formatBRL(selectedLot.marketValue)}
                        </div>
                      )}
                    </div>

                    <div className="border-l border-[#E2E8F0] pl-3">
                      <div className="text-[11px] text-[#64748B]">Desconto</div>
                      <div className="text-sm sm:text-base font-bold text-emerald-700 mt-0.5">
                        {selectedLot.discountPct > 0 ? `-${selectedLot.discountPct}%` : "Praça Única"}
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        {selectedLot.acceptsFinancing ? "Financiável" : "Recursos próprios"}
                      </div>
                    </div>

                    <div className="border-l border-[#E2E8F0] pl-3">
                      <div className="text-[11px] text-[#64748B]">Preço / m²</div>
                      <div className="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5">
                        {formatBRL(viability.bidM2)}
                      </div>
                      <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                        Região: {formatBRL(viability.benchmarkM2)}
                      </div>
                    </div>
                  </div>

                  {/* 4. Card Único do Dossiê Completo (Sem Duplicação de Blocos Borrados) */}
                  <div className="rounded-2xl border border-[#CBD5E1] bg-white p-4 sm:p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-bold text-[#0F172A]">
                          Dossiê Completo do Imóvel
                        </h2>
                        <p className="text-xs text-[#64748B]">
                          Viabilidade financeira, lance teto e leitura do edital
                        </p>
                      </div>
                      <span className="whitespace-nowrap shrink-0 text-xs font-bold px-3 py-1 rounded-full bg-[#0F2744] text-white">
                        {isSelectedUnlocked ? "Liberado" : DOSSIE_PRICE}
                      </span>
                    </div>

                    {/* Lista Limpa dos 3 Entregáveis do Dossiê */}
                    <div className="divide-y divide-[#F1F5F9] border-t border-b border-[#F1F5F9] text-xs">
                      {/* Item 1: Lance Teto */}
                      <div
                        onClick={() => !isSelectedUnlocked && setModalMode("dossie_checkout")}
                        className="py-3 flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div>
                          <div className="font-semibold text-[#0F172A]">
                            Até Quanto Vale Pagar (Lance Teto)
                          </div>
                          <div className="text-[#64748B] text-[11px]">
                            Limite máximo mantendo margem de segurança pós-custos
                          </div>
                        </div>
                        {isSelectedUnlocked ? (
                          <span className="font-bold text-sm text-[#0F2744] whitespace-nowrap shrink-0">
                            {formatBRL(viability.maxRecommendedBid)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[#0F2744] font-semibold text-[11px] whitespace-nowrap shrink-0">
                            <Lock className="w-3 h-3 text-[#0F3B78]" />
                            Bloqueado
                          </span>
                        )}
                      </div>

                      {/* Item 2: Lucro Líquido & ROI */}
                      <div
                        onClick={() => !isSelectedUnlocked && setModalMode("dossie_checkout")}
                        className="py-3 flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div>
                          <div className="font-semibold text-[#0F172A]">
                            Lucro Líquido & ROI Estimado
                          </div>
                          <div className="text-[#64748B] text-[11px]">
                            Descontando ITBI, comissão (5%), cartório e reforma
                          </div>
                        </div>
                        {isSelectedUnlocked ? (
                          <div className="text-right whitespace-nowrap shrink-0">
                            <div className="font-bold text-sm text-emerald-700">
                              {formatBRL(viability.netProfitFlip)}
                            </div>
                            <div className="text-[10px] font-semibold text-emerald-700">
                              ROI +{viability.netRoiPct}%
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[#0F2744] font-semibold text-[11px] whitespace-nowrap shrink-0">
                            <Lock className="w-3 h-3 text-[#0F3B78]" />
                            Bloqueado
                          </span>
                        )}
                      </div>

                      {/* Item 3: Auditoria de Edital & Matrícula */}
                      <div
                        onClick={() => !isSelectedUnlocked && setModalMode("dossie_checkout")}
                        className="py-3 space-y-2 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-[#0F172A]">
                              Auditoria de Dívidas, Edital & Matrícula
                            </div>
                            <div className="text-[#64748B] text-[11px]">
                              Regras de IPTU, condomínio, posse e gravames
                            </div>
                          </div>
                          {!isSelectedUnlocked && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[#0F2744] font-semibold text-[11px] whitespace-nowrap shrink-0">
                              <Lock className="w-3 h-3 text-[#0F3B78]" />
                              Bloqueado
                            </span>
                          )}
                        </div>

                        {isSelectedUnlocked && (
                          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs text-[#334155]">
                            <div>
                              <strong className="text-[#0F172A]">Pagamento: </strong>
                              {String(selectedLot.aiChecklist?.paymentRule || "Consultar edital")}
                            </div>
                            <div>
                              <strong className="text-[#0F172A]">Dívidas (IPTU/Condomínio): </strong>
                              {String(selectedLot.aiChecklist?.debts || "Consultar edital")}
                            </div>
                            <div>
                              <strong className="text-[#0F172A]">Matrícula: </strong>
                              {String(selectedLot.aiChecklist?.matriculaStatus || "Consultar edital")}
                            </div>
                            <div className="text-amber-800 font-medium">
                              <strong>Atenção jurídica: </strong>
                              {String(selectedLot.aiChecklist?.lawyerAlert || "Validar certidões antes do lance")}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botão Principal de Compra/Abertura do Dossiê (Preço Nunca Quebra) */}
                    <button
                      type="button"
                      onClick={() =>
                        setModalMode(
                          isSelectedUnlocked ? "dossie_view" : "dossie_checkout"
                        )
                      }
                      className="w-full py-3.5 px-4 rounded-xl bg-[#0F2744] hover:bg-[#0A1B30] text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-between gap-2 cursor-pointer shadow-sm"
                    >
                      <span>
                        {isSelectedUnlocked
                          ? "Abrir Relatório Completo para Impressão (PDF)"
                          : "Desbloquear Dossiê Completo do Imóvel"}
                      </span>
                      <span className="whitespace-nowrap shrink-0 bg-white/15 px-2.5 py-1 rounded-lg text-xs font-bold">
                        {isSelectedUnlocked ? "Abrir PDF →" : DOSSIE_PRICE}
                      </span>
                    </button>
                  </div>

                  {/* 5. Serviços finHouse (Botões Secundários Sóbrios e Limpos) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setModalMode("credit")}
                      className="py-3 px-4 rounded-xl border border-[#CBD5E1] hover:border-[#0F2744] bg-white hover:bg-slate-50 text-[#0F172A] font-semibold text-xs transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>Simular Financiamento</span>
                      <ChevronRight className="w-4 h-4 text-[#64748B]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalMode("lawyer")}
                      className="py-3 px-4 rounded-xl border border-[#CBD5E1] hover:border-[#0F2744] bg-white hover:bg-slate-50 text-[#0F172A] font-semibold text-xs transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>Consultar Advogado</span>
                      <ChevronRight className="w-4 h-4 text-[#64748B]" />
                    </button>
                  </div>
                </div>

                {/* Sticky Bottom Action Bar no Mobile */}
                <div className="lg:hidden sticky bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#CBD5E1] p-3 z-30 shadow-lg flex items-center justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider">
                      Lance Mínimo
                    </div>
                    <div className="text-sm font-bold text-[#0F172A] truncate">
                      {selectedLot.minBid > 0 ? formatBRL(selectedLot.minBid) : "Ver Edital"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setModalMode("credit")}
                      className="px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#0F2744] font-bold text-xs bg-white hover:bg-slate-50 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      Financiar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        isSelectedUnlocked
                          ? setModalMode("dossie_view")
                          : setModalMode("dossie_checkout")
                      }
                      className="px-3.5 py-2 rounded-xl bg-[#0F2744] hover:bg-[#0A1B30] text-white font-bold text-xs shadow-xs flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <span>{isSelectedUnlocked ? "Ver Dossiê" : `Dossiê · ${DOSSIE_PRICE}`}</span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-sm text-[#64748B] m-auto space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0F3B78]" />
                <div>Carregando oportunidades de leilão em São Paulo...</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL MOBILE DE PREVIEW DO LOTE NO MAPA (CARD IDÊNTICO À ABA VER IMÓVEIS) ─── */}
      {mobileMapPreviewLot && (
        <div
          onClick={() => setMobileMapPreviewLotId(null)}
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              setMobileMapPreviewLotId(null);
              openLotDetail(mobileMapPreviewLot.id);
            }}
            className="w-full max-w-sm bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xl transition-all cursor-pointer relative animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Foto Principal Limpa com Desconto + Favoritar/Share + Fechar */}
            <div className="relative h-48 sm:h-52 w-full bg-slate-100">
              {mobileMapPreviewLot.imageUrl ? (
                <img
                  src={mobileMapPreviewLot.imageUrl}
                  alt={mobileMapPreviewLot.title}
                  className="w-full h-full object-cover"
                  loading="eager"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                  <Landmark className="w-10 h-10 stroke-[1.5]" />
                  <span className="text-[11px] font-medium mt-1">Foto oficial no edital</span>
                </div>
              )}

              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                <div className="flex items-center gap-1.5 pointer-events-auto">
                  {mobileMapPreviewLot.discountPct > 0 && (
                    <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                      -{mobileMapPreviewLot.discountPct}% OFF
                    </span>
                  )}
                  <span className="bg-slate-900/75 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full shadow-sm">
                    {mobileMapPreviewLot.source}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => handleShare(mobileMapPreviewLot, e)}
                    className="w-8 h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-md text-[#0F172A] flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
                    title="Compartilhar imóvel"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(mobileMapPreviewLot.id, e)}
                    className="w-8 h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-md flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
                    title={
                      favorites[mobileMapPreviewLot.id]
                        ? "Remover dos favoritos"
                        : "Salvar nos favoritos"
                    }
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        favorites[mobileMapPreviewLot.id]
                          ? "fill-rose-500 text-rose-500"
                          : "text-[#0F172A] hover:text-rose-500"
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileMapPreviewLotId(null);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
                    title="Fechar card"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dados do Imóvel Limpos (Idêntico à aba Ver Imóveis) */}
            <div className="p-4 space-y-2.5">
              <div>
                <div className="text-[11px] font-medium text-[#64748B]">
                  {mobileMapPreviewLot.modality} · Lote {mobileMapPreviewLot.code}
                </div>
                <h3 className="text-sm font-bold text-[#0F172A] line-clamp-2 leading-snug mt-0.5">
                  {mobileMapPreviewLot.title}
                </h3>
                <div className="text-xs text-[#475569] truncate mt-1">
                  {mobileMapPreviewLot.address}
                </div>
              </div>

              {/* Data e Área */}
              <div className="flex items-center justify-between text-xs text-[#64748B] pt-0.5">
                <span className="truncate">
                  Encerramento: {mobileMapPreviewLot.auctionDate || "Ver no Edital"}
                </span>
                {mobileMapPreviewLot.areaM2 && (
                  <span className="font-semibold text-[#0F172A] shrink-0">
                    {mobileMapPreviewLot.areaM2} m²
                  </span>
                )}
              </div>

              {/* Bloco de Preço e CTAs */}
              <div className="pt-2.5 border-t border-[#F1F5F9] flex items-end justify-between gap-2">
                <div>
                  <div className="text-[11px] text-[#64748B]">Lance Mínimo</div>
                  <div className="text-base font-bold text-[#0F172A]">
                    {mobileMapPreviewLot.minBid > 0
                      ? formatBRL(mobileMapPreviewLot.minBid)
                      : "Ver Edital"}
                  </div>
                  {mobileMapPreviewLot.marketValue > mobileMapPreviewLot.minBid && (
                    <div className="text-[11px] text-[#94A3B8] line-through">
                      Avaliação: {formatBRL(mobileMapPreviewLot.marketValue)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileMapPreviewLotId(null);
                      openLotDetail(mobileMapPreviewLot.id);
                    }}
                    className="px-3 py-2 rounded-xl border border-[#CBD5E1] text-[#0F2744] hover:bg-slate-50 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                  >
                    Detalhes
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      setMobileMapPreviewLotId(null);
                      openDossieModal(mobileMapPreviewLot.id, e);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#0F2744] hover:bg-[#0A1B30] text-white text-xs font-bold shadow-xs flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                  >
                    <span>Ver Dossiê</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAIS DE CONVERSÃO & DOSSIÊ DE R$ 49,90 ─── */}
      {modalMode && selectedLot && viability && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* MODAL 1: CHECKOUT DO DOSSIÊ DE VIABILIDADE (R$ 49,90) */}
          {modalMode === "dossie_checkout" && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl space-y-4 relative max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#0F3B78]">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Estudo de Viabilidade Comercial & m²
                </div>
                <h3 className="text-lg font-bold text-[#0F172A]">
                  Desbloquear Dossiê Completo do Lote ({DOSSIE_PRICE})
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Lote:{" "}
                  <strong className="text-[#0F172A]">
                    {selectedLot.code} · {selectedLot.title}
                  </strong>
                </p>
              </div>

              {/* O que vem no Dossiê */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs text-[#334155]">
                <div className="font-semibold text-[#0F172A]">
                  O que você libera imediatamente neste Dossiê:
                </div>
                <ul className="space-y-1.5 text-[11px]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Até Quanto Vale Pagar (Lance Teto):</strong> limite máximo de lance considerando todos os custos + potencial de revenda
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Relatório Prévio dos Documentos:</strong> leitura de dívidas (IPTU/Condomínio), matrícula e alertas do edital
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Lucro Líquido e Custos Reais:</strong> ITBI SP, leiloeiro, cartório, reforma e valor de mercado no bairro
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Bônus:</strong> Os {DOSSIE_PRICE} são 100% abatidos caso contrate nossa assessoria jurídica parceira
                    </span>
                  </li>
                </ul>
              </div>

              <form onSubmit={handleLeadSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#334155] mb-1">
                    Seu Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#CBD5E1] focus:outline-none focus:border-[#0F3B78]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#334155] mb-1">
                    WhatsApp (para receber cópia do Dossiê)
                  </label>
                  <input
                    type="tel"
                    required
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(formatPhoneInput(e.target.value))}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#CBD5E1] focus:outline-none focus:border-[#0F3B78]"
                  />
                </div>

                {/* Chave PIX Rápida */}
                <div className="p-3 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#64748B] font-semibold">
                      PIX Chave CNPJ finHouse ({DOSSIE_PRICE})
                    </div>
                    <div className="font-mono font-bold text-[#0F172A] mt-0.5">
                      60.806.192/0001-50
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("60.806.192/0001-50");
                      setPixCopied(true);
                      setTimeout(() => setPixCopied(false), 2500);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer"
                  >
                    {pixCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar CNPJ
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#0F2744] hover:bg-[#0A1B30] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Liberar Meu Dossiê Completo Agora
                </button>
              </form>
            </div>
          )}

          {/* MODAL 2: DOSSIÊ DE VIABILIDADE COMPLETO DESBLOQUEADO (IMPRIMÍVEL / PDF) */}
          {modalMode === "dossie_view" && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full p-5 sm:p-8 shadow-xl space-y-6 relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F3B78]">
                    finHouse · Dossiê de Viabilidade Comercial & Financeira
                  </span>
                  <h3 className="text-lg font-bold text-[#0F172A] mt-0.5">
                    {selectedLot.code} · {selectedLot.title}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    {selectedLot.address} · Encerramento:{" "}
                    {selectedLot.auctionDate || "Ver Edital"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Salvar PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="p-1.5 rounded-full text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 1. Indicadores Estratégicos: Lance Teto, Preço m² e Lucro Líquido */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                  <div className="text-[11px] text-[#0F3B78] font-semibold">
                    Até Quanto Vale Pagar (Lance Teto)
                  </div>
                  <div className="text-base font-bold text-[#0F172A] mt-0.5">
                    {formatBRL(viability.maxRecommendedBid)}
                  </div>
                  <div className="text-[10px] text-[#475569] mt-0.5">
                    Teto p/ manter margem líquida segura
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="text-[11px] text-[#64748B]">
                    Preço m² Leilão vs. Bairro
                  </div>
                  <div className="text-base font-bold text-[#0F172A] mt-0.5">
                    {formatBRL(viability.bidM2)}{" "}
                    <span className="text-xs font-normal text-[#64748B]">
                      vs. {formatBRL(viability.benchmarkM2)}/m²
                    </span>
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-0.5">
                    Área estimada: {viability.estimatedArea} m²
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-[11px] text-emerald-900 font-medium">
                    Lucro Líquido Projetado (Pós-Custos)
                  </div>
                  <div className="text-base font-bold text-emerald-800 mt-0.5">
                    {formatBRL(viability.netProfitFlip)}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    ROI Líquido Estimado: +{viability.netRoiPct}%
                  </div>
                </div>
              </div>

              {/* 1.5 Relatório Prévio de Análise dos Documentos */}
              <div className="rounded-xl border border-[#E2E8F0] p-4 space-y-2.5 bg-[#F8FAFC] text-xs">
                <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#0F3B78]" />
                  Relatório Prévio de Análise Documental (Edital & Matrícula)
                </div>
                <p className="text-[#334155] leading-relaxed">
                  {String(selectedLot.aiSummary || "")}
                </p>
                <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0]">
                    <span className="font-semibold text-[#0F172A] block mb-0.5">
                      Dívidas (IPTU / Condomínio):
                    </span>
                    <span className="text-[#475569]">
                      {String(selectedLot.aiChecklist?.debts || "Consultar edital")}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0]">
                    <span className="font-semibold text-[#0F172A] block mb-0.5">
                      Matrícula & Gravames:
                    </span>
                    <span className="text-[#475569]">
                      {String(selectedLot.aiChecklist?.matriculaStatus || "Consultar edital")}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Planilha Completa de Custos Ocultos em SP */}
              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden text-xs">
                <div className="bg-[#F8FAFC] px-4 py-2.5 font-bold text-[#0F172A] border-b border-[#E2E8F0]">
                  Demonstrativo de Custos de Aquisição e Revenda (São Paulo/SP)
                </div>
                <div className="divide-y divide-[#F1F5F9] px-4">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#475569]">1. Valor do Lance Mínimo</span>
                    <span className="font-semibold text-[#0F172A]">
                      {formatBRL(selectedLot.minBid)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#475569]">
                      2. Comissão Oficial do Leiloeiro (5%)
                    </span>
                    <span className="font-medium text-[#0F172A]">
                      {formatBRL(viability.auctioneerFee)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#475569]">
                      3. ITBI Prefeitura (3%)
                    </span>
                    <span className="font-medium text-[#0F172A]">
                      {formatBRL(viability.itbiSp)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#475569]">
                      4. Registro Cartório de Imóveis / Carta de Arrematação
                    </span>
                    <span className="font-medium text-[#0F172A]">
                      {formatBRL(viability.registryAndDeed)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#475569]">
                      5. Reserva p/ Reforma Leve + 6 meses Condomínio/IPTU
                    </span>
                    <span className="font-medium text-[#0F172A]">
                      {formatBRL(viability.holdingAndLightReform)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between bg-[#F8FAFC] -mx-4 px-4 font-bold text-[#0F172A]">
                    <span>Investimento Total desembolsado</span>
                    <span>{formatBRL(viability.totalAcquisitionCost)}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#475569]">
                      Valor Estimado de Revenda a Mercado
                    </span>
                    <span className="font-semibold text-[#0F172A]">
                      {formatBRL(viability.marketResaleValue)}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#475569]">
                      Provisão IR Ganho de Capital (15%)
                    </span>
                    <span className="font-medium text-rose-700">
                      - {formatBRL(viability.capitalGainsTax)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Comparativo de Renda Passiva */}
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-[#E2E8F0]">
                  <div className="text-[#64748B]">
                    Renda Mensal em Locação Tradicional
                  </div>
                  <div className="text-sm font-bold text-[#0F172A] mt-0.5">
                    {formatBRL(viability.tradMonthlyRent)} / mês
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="text-[#0F3B78] font-semibold">
                    Renda Mensal Short Stay (Gestão finHouse)
                  </div>
                  <div className="text-sm font-bold text-[#0F172A] mt-0.5">
                    {formatBRL(viability.shortStayMonthlyNet)} / mês líquido
                  </div>
                </div>
              </div>

              {/* 4. Checklist Obrigatório para o Advogado */}
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2.5 text-xs">
                <div className="font-bold text-[#78350F] flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-700" />
                  Checklist que seu Advogado deve validar nos autos antes do lance:
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[#78350F]">
                  <li>
                    Conferência de nulidades de intimação do executado/devedor fiduciante.
                  </li>
                  <li>
                    Levantamento atualizado de débitos condominiais junto à administradora.
                  </li>
                  <li>
                    Certidões forenses cíveis, trabalhistas e fiscais do proprietário anterior.
                  </li>
                  <li>
                    Estratégia de Imissão na Posse (desocupação) pós-expedição da Carta/Escritura.
                  </li>
                </ul>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setModalMode("lawyer")}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#1E293B] text-white font-semibold text-xs cursor-pointer text-center"
                  >
                    Abater meus R$ 49,90 na Due Diligence com Advogado Parceiro
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode("credit")}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-[#CBD5E1] text-[#0F3B78] font-bold text-xs cursor-pointer text-center"
                  >
                    Simular Financiamento finHouse
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-[#94A3B8] leading-relaxed">
                <strong>Aviso Legal:</strong> Este documento é um estudo econômico-financeiro e mercadológico automatizado pela finHouse com base em indicadores médios da região e dados públicos do edital. Não constitui parecer jurídico, laudo pericial ou garantia de inexistência de passivos processuais ocultos.
              </p>
            </div>
          )}

          {/* MODAL 3: ADVOGADO ESPECIALISTA OU FINANCIAMENTO FINHOUSE */}
          {(modalMode === "lawyer" || modalMode === "credit") && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl space-y-4 relative max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <form onSubmit={handleLeadSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#0F3B78]">
                    {modalMode === "lawyer" ? (
                      <>
                        <Scale className="w-3.5 h-3.5" />
                        Due Diligence & Desocupação
                      </>
                    ) : (
                      <>
                        <Landmark className="w-3.5 h-3.5" />
                        Mesa de Crédito finHouse
                      </>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A]">
                    {modalMode === "lawyer"
                      ? "Solicitar Proposta de Advogado Especialista"
                      : "Simular Financiamento para este Leilão"}
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Lote selecionado:{" "}
                    <strong className="text-[#0F172A]">
                      {selectedLot.code} · {selectedLot.title} (
                      {formatBRL(selectedLot.minBid)})
                    </strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#334155] mb-1">
                    Seu Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#CBD5E1] focus:outline-none focus:border-[#0F3B78]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#334155] mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(formatPhoneInput(e.target.value))}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#CBD5E1] focus:outline-none focus:border-[#0F3B78]"
                  />
                </div>

                {modalMode === "credit" && (
                  <div>
                    <label className="block text-xs font-medium text-[#334155] mb-1">
                      Recurso próprio disponível para entrada (Opcional)
                    </label>
                    <input
                      type="text"
                      value={leadBudget}
                      onChange={(e) =>
                        setLeadBudget(formatCurrencyInput(e.target.value))
                      }
                      placeholder="R$ 150.000"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#CBD5E1] focus:outline-none focus:border-[#0F3B78]"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full py-3 rounded-xl text-white font-bold text-xs transition-colors cursor-pointer shadow-sm ${
                    modalMode === "credit"
                      ? "bg-[#0F3B78] hover:bg-[#0B2E60]"
                      : "bg-[#1E293B] hover:bg-[#0F172A]"
                  }`}
                >
                  {modalMode === "lawyer"
                    ? "Solicitar Proposta do Advogado Especialista"
                    : "Simular Financiamento na finHouse"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL DE MENU DE FILTROS (ORGANIZADO & SEM POLUIÇÃO) ─── */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header do Menu de Filtros */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2 text-[#0F172A] font-bold text-base">
                <SlidersHorizontal className="w-4 h-4 text-[#0F3B78]" />
                <span>Filtros de Oportunidades</span>
                {activeFilterCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#0F2744] text-white">
                    {activeFilterCount} {activeFilterCount === 1 ? "ativo" : "ativos"}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="p-1.5 rounded-full text-[#64748B] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Modalidade de Leilão */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                Modalidade do Leilão
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFilterFinancing(false)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    !filterFinancing
                      ? "bg-[#0F2744] text-white border-[#0F2744] shadow-xs"
                      : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  Todos os Leilões
                </button>
                <button
                  type="button"
                  onClick={() => setFilterFinancing(true)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    filterFinancing
                      ? "bg-[#0F2744] text-white border-[#0F2744] shadow-xs"
                      : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <span>🏦 Bancos / Financiamento</span>
                </button>
              </div>
            </div>

            {/* 2. Desconto Mínimo */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                Desconto sobre Avaliação
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFilterHighDiscount(false)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    !filterHighDiscount
                      ? "bg-[#0F2744] text-white border-[#0F2744] shadow-xs"
                      : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  Qualquer Desconto
                </button>
                <button
                  type="button"
                  onClick={() => setFilterHighDiscount(true)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    filterHighDiscount
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                      : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Super Desconto (+35%)</span>
                </button>
              </div>
            </div>

            {/* 3. Faixa de Preço (Lance Mínimo) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                Faixa de Preço (Lance Mínimo)
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <span className="text-[11px] text-[#64748B] font-medium block mb-1">A partir de</span>
                  <input
                    type="text"
                    value={minValue ? formatCurrencyInput(minValue) : ""}
                    onChange={(e) => setMinValue(e.target.value.replace(/\D/g, ""))}
                    placeholder="R$ 0"
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#0F3B78]"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] font-medium block mb-1">Até o teto de</span>
                  <input
                    type="text"
                    value={maxValue ? formatCurrencyInput(maxValue) : ""}
                    onChange={(e) => setMaxValue(e.target.value.replace(/\D/g, ""))}
                    placeholder="R$ Sem limite"
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#0F3B78]"
                  />
                </div>
              </div>

              {/* Atalhos Rápidos de Valor */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => { setMinValue(""); setMaxValue("350000"); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                    maxValue === "350000" && !minValue
                      ? "bg-[#0F2744] text-white border-[#0F2744]"
                      : "bg-slate-50 text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  Até R$ 350k
                </button>
                <button
                  type="button"
                  onClick={() => { setMinValue(""); setMaxValue("700000"); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                    maxValue === "700000" && !minValue
                      ? "bg-[#0F2744] text-white border-[#0F2744]"
                      : "bg-slate-50 text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  Até R$ 700k
                </button>
                <button
                  type="button"
                  onClick={() => { setMinValue(""); setMaxValue("1500000"); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                    maxValue === "1500000" && !minValue
                      ? "bg-[#0F2744] text-white border-[#0F2744]"
                      : "bg-slate-50 text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  Até R$ 1,5M
                </button>
                {(minValue || maxValue) && (
                  <button
                    type="button"
                    onClick={() => { setMinValue(""); setMaxValue(""); }}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    Qualquer valor
                  </button>
                )}
              </div>
            </div>

            {/* 4. Apenas Salvos */}
            <div className="p-3 rounded-xl bg-slate-50 border border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className={`w-4 h-4 ${filterFavoritesOnly ? "fill-rose-500 text-rose-500" : "text-[#64748B]"}`} />
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">Apenas Imóveis Salvos</div>
                  <div className="text-[10px] text-[#64748B]">
                    {Object.keys(favorites).length} imóveis favoritados na sua lista
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={filterFavoritesOnly}
                onChange={(e) => setFilterFavoritesOnly(e.target.checked)}
                className="w-4 h-4 text-[#0F3B78] rounded border-slate-300 focus:ring-[#0F3B78] cursor-pointer"
              />
            </div>

            {/* Rodapé Fixo de Ações do Modal */}
            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setFilterFinancing(false);
                  setFilterHighDiscount(false);
                  setFilterFavoritesOnly(false);
                  setMinValue("");
                  setMaxValue("");
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline cursor-pointer"
              >
                Limpar Filtros
              </button>

              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="flex-1 py-3 rounded-xl bg-[#0F2744] hover:bg-[#0A1B30] text-white font-bold text-xs shadow-md transition-colors cursor-pointer text-center"
              >
                Ver {filteredLots.length} Oportunidades
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOAST DE NOTIFICAÇÃO (COMPARTILHAMENTO / AÇÕES) ─── */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#0F2744] text-white px-4 py-2.5 rounded-full shadow-xl text-xs font-semibold flex items-center gap-2 border border-white/10 pointer-events-none">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── FOOTER OFICIAL FINHOUSE (RESPALDO INSTITUCIONAL) ─── */}
      <Footer />
    </div>
  );
}
