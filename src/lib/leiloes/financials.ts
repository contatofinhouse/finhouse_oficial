import { ScrapedAuctionLot, isLotInSecondPraca } from "@/lib/leiloes-utils";

export type PropertyTier = "AAA" | "Médio" | "Econômico";
export type PropertyCategory = "Apartamento" | "Casa" | "Comercial" | "Terreno";
export type ReformaLevel = 0 | 1 | 2 | 3;
export type TrafficLight = "green" | "yellow" | "red";

export interface ReformaLevelSpec {
  level: ReformaLevel;
  label: string;
  shortLabel: string;
  description: string;
  costPerM2: Record<PropertyTier, number>;
}

/**
 * Tabela de Custo de Reforma SP (Anexo A do Plano 1 — Base CUB SindusCon-SP / SINAPI-SP)
 */
export const REFORMA_SP_TABLE: Record<ReformaLevel, ReformaLevelSpec> = {
  0: {
    level: 0,
    label: "Nível 0 — Sem Reforma / Limpeza",
    shortLabel: "Sem Reforma",
    description:
      "Apenas limpeza pesada pós-desocupação, troca de fechadura e pequenos reparos.",
    costPerM2: { Econômico: 60, Médio: 90, AAA: 140 },
  },
  1: {
    level: 1,
    label: "Nível 1 — Cosmética / Giro Rápido",
    shortLabel: "Cosmética",
    description:
      "Pintura geral acrílica, revisão elétrica/hidráulica pontual, luminárias e metais.",
    costPerM2: { Econômico: 550, Médio: 800, AAA: 1300 },
  },
  2: {
    level: 2,
    label: "Nível 2 — Intermediária / Modernização",
    shortLabel: "Intermediária",
    description:
      "Troca de pisos/porcelanato ou vinílico, revestimento de áreas frias e bancadas.",
    costPerM2: { Econômico: 1250, Médio: 1850, AAA: 3000 },
  },
  3: {
    level: 3,
    label: "Nível 3 — Pesada / Retrofit Completo",
    shortLabel: "Retrofit Pesado",
    description:
      "Substituição de infra elétrica/hidráulica, esquadrias, layout e acabamentos.",
    costPerM2: { Econômico: 2800, Médio: 3200, AAA: 4500 },
  },
};

export interface PrelimEvaluation {
  prelimScore: number; // 0 to 100
  propertyCategory: PropertyCategory;
  propertyTier: PropertyTier;
  estimatedAreaM2: number;
  effectiveOccupancy: "Desocupado" | "Ocupado" | "Ver no Edital";
  isSecondPracaActive: boolean;
  pricePerM2Bid: number;
  pricePerM2Market: number;
  suggestedReformaLevel: ReformaLevel;
  badges: {
    label: string;
    tone: "emerald" | "amber" | "rose" | "indigo" | "slate";
  }[];
  verdictStatus: TrafficLight;
  verdictLabel: string;
}

export interface LegalMatrixItem {
  id: string;
  number: number;
  title: string;
  level: TrafficLight;
  statusLabel: string;
  finding: string;
  citation: string;
  documentName: string;
  pageRef: string;
  deepDive: {
    legalBasis: string;
    financialAndTimeImpact: string;
    practicalChecklist: string[];
  };
}

export interface SimulationParams {
  simulatedBid: number;
  reformaLevel: ReformaLevel;
  holdingMonths: number; // 6, 9, 12, 18
  targetMarginPct: number; // default 18%
  customMarketValue?: number; // valor de mercado real ajustado por comparáveis ou pelo investidor
  useFinancing?: boolean;
}

export interface ScenarioResult {
  label: string;
  subtitle: string;
  bidAmount: number;
  totalInvestment: number;
  netSaleRevenue: number;
  netProfit: number;
  roiPct: number;
  netMarginPct: number;
  monthlyIrrPct: number;
  viable: boolean;
}

export interface DealFinancialSimulation {
  lotId: string;
  editalMarketValue: number;
  marketValueEffective: number;
  benchmarkM2: number;
  benchmarkTotalValue: number;
  benchmarkLabel: string;
  editalVsBenchmarkPct: number;
  liquidityHaircutPct: number;
  realisticSalePrice: number;
  estimatedAreaM2: number;
  propertyCategory: PropertyCategory;
  propertyTier: PropertyTier;
  effectiveOccupancy: "Desocupado" | "Ocupado" | "Ver no Edital";
  // Breakdown of costs for the simulated bid
  simulatedBid: number;
  auctioneerFee: number; // 5%
  itbiCost: number; // 3% SP
  registryAndDeedCost: number; // Escritura/Carta + Registro CRI + Baixa de Gravames
  evictionAndLegalCost: number; // Desocupação (liminar/acordo)
  legalContingencyReserve: number; // Reserva p/ eventual defesa/reversão judicial ou passivo residual
  reformaCost: number;
  holdingCostTotal: number; // IPTU + Condomínio durante vacância
  holdingMonthlyEstimate: number;
  totalAcquisitionAndHolding: number;
  // Exit (Resale)
  brokerFee: number; // 6%
  capitalGainsTax: number; // 15% over gross profit
  netProfit: number;
  roiPct: number;
  netMarginPct: number;
  monthlyIrrPct: number;
  // Exit (Rental / Buy & Hold)
  estimatedMonthlyRent: number;
  annualRentalYieldPct: number;
  // Reverse Max Bid (Lance Teto Máximo Indicado)
  maxRecommendedBid: number;
  maxBidBufferAmount: number; // R$ acima do lance mínimo até bater no teto
  headroomToMaxBidPct: number;
  isAboveMaxBid: boolean;
  // 3 Standard Scenarios
  scenarios: {
    minBid: ScenarioResult;
    moderateDispute: ScenarioResult;
    ceilingBid: ScenarioResult;
  };
}

/**
 * Reconstrói o Valor de Avaliação real quando o snapshot tem marketValue === minBid mas possui discountPct > 0
 */
export function resolveEffectiveMarketValue(lot: ScrapedAuctionLot): number {
  const minBid = Math.max(1, lot.minBid || 0);
  const rawMv = lot.marketValue || 0;
  const disc = lot.discountPct || 0;

  if (rawMv > minBid * 1.03) {
    return Math.round(rawMv);
  }
  if (disc > 0 && disc < 85) {
    return Math.round(minBid / (1 - disc / 100));
  }
  return Math.round(minBid * 1.3);
}

/**
 * Normaliza a situação ocupacional (identificando menções explícitas a DESOCUPADO ou OCUPADO no título/resumo)
 */
export function resolveEffectiveOccupancy(
  lot: ScrapedAuctionLot
): "Desocupado" | "Ocupado" | "Ver no Edital" {
  if (lot.occupancy === "Desocupado") return "Desocupado";
  if (lot.occupancy === "Ocupado") return "Ocupado";

  const fullText = `${lot.title || ""} ${lot.aiSummary || ""} ${
    lot.aiChecklist?.lawyerAlert || ""
  }`.toLowerCase();

  if (
    /\bdesocupad[oa]s?\b/i.test(fullText) ||
    fullText.includes("livre de pessoas") ||
    fullText.includes("vago")
  ) {
    return "Desocupado";
  }
  if (/\bocupad[oa]s?\b/i.test(fullText)) {
    return "Ocupado";
  }
  return "Ver no Edital";
}

/**
 * Verifica de forma consistente com /leilaocom-ia se o lote está em 2ª Praça ativa (com deságio aberto)
 */
export function isLotActiveSecondPraca(lot: ScrapedAuctionLot): boolean {
  if (isLotInSecondPraca(lot)) return true;
  const titleLower = (lot.title || "").toLowerCase();
  if (
    titleLower.includes("1ª praça") ||
    titleLower.includes("1º leilão") ||
    titleLower.includes("primeira praça") ||
    titleLower.includes("praça única")
  ) {
    return false;
  }
  if ((lot.discountPct || 0) > 0) return true;
  return /2[ªa]\s*praça|segunda\s*praça|2[ºo]\s*leilão|segundo\s*leilão/i.test(
    `${lot.title} ${lot.aiSummary || ""} ${lot.modality || ""}`
  );
}

export function inferPropertyCategory(lot: ScrapedAuctionLot): PropertyCategory {
  const t = `${lot.title} ${lot.aiSummary || ""}`.toLowerCase();
  if (
    t.includes("terreno") ||
    t.includes("gleba") ||
    t.includes("lote de terreno") ||
    t.includes("área rural") ||
    t.includes("chácara")
  ) {
    return "Terreno";
  }
  if (
    t.includes("comercial") ||
    t.includes("sala") ||
    t.includes("conjunto") ||
    t.includes("galpão") ||
    t.includes("galpao") ||
    t.includes("loja") ||
    t.includes("prédio") ||
    t.includes("predio") ||
    t.includes("vaga de garagem")
  ) {
    return "Comercial";
  }
  if (t.includes("casa") || t.includes("sobrado")) {
    return "Casa";
  }
  return "Apartamento";
}

export function estimateAreaM2(lot: ScrapedAuctionLot): number {
  if (lot.areaM2 && lot.areaM2 >= 12 && lot.areaM2 <= 5000) {
    return Math.round(lot.areaM2);
  }
  const textMatch = `${lot.title} ${lot.aiSummary || ""}`.match(
    /(\d{2,4}(?:[.,]\d{1,2})?)\s*m[²2]/i
  );
  if (textMatch?.[1]) {
    const parsed = parseFloat(textMatch[1].replace(",", "."));
    if (parsed >= 12 && parsed <= 5000) return Math.round(parsed);
  }
  const effectiveMv = resolveEffectiveMarketValue(lot);
  const cat = inferPropertyCategory(lot);
  if (cat === "Casa")
    return Math.max(75, Math.min(300, Math.round(effectiveMv / 6800)));
  if (cat === "Comercial")
    return Math.max(30, Math.min(250, Math.round(effectiveMv / 7500)));
  if (cat === "Terreno") return 250;
  return Math.max(38, Math.min(200, Math.round(effectiveMv / 8200)));
}

/**
 * Classifica o Padrão Construtivo (AAA, Médio, Econômico) com consistência entre avaliação,
 * lance mínimo, R$/m² real e localização.
 */
export function inferPropertyTier(
  lot: ScrapedAuctionLot,
  areaM2: number,
  category?: PropertyCategory,
  effectiveMv?: number
): PropertyTier {
  const cat = category || inferPropertyCategory(lot);
  const mv = effectiveMv || resolveEffectiveMarketValue(lot);
  const m2Value = areaM2 > 0 ? mv / areaM2 : 0;

  const nobleNeighborhoods = [
    "jardim paulista",
    "jardins",
    "jardim europa",
    "jardim america",
    "itaim",
    "vila nova conceição",
    "vila nova conceicao",
    "moema",
    "pinheiros",
    "vila olímpia",
    "vila olimpia",
    "alto de pinheiros",
    "higienópolis",
    "higienopolis",
    "brooklin",
    "campo belo",
    "perdizes",
    "vila madalena",
    "alphaville",
    "tamboré",
    "tambore",
    "pacaembu",
    "morumbi",
    "chácara klabin",
    "chacara klabin",
    "anália franco",
    "analia franco",
  ];
  const neighLower = `${lot.neighborhood} ${lot.address} ${lot.title}`.toLowerCase();
  const isNoble = nobleNeighborhoods.some((n) => neighLower.includes(n));

  if (cat === "Terreno") {
    if (mv >= 1_200_000 || (isNoble && mv >= 750_000)) return "AAA";
    if (mv <= 350_000 || lot.minBid <= 180_000) return "Econômico";
    return "Médio";
  }

  if (
    mv <= 400_000 ||
    lot.minBid <= 200_000 ||
    (m2Value > 0 && m2Value < 4_200 && mv < 1_200_000)
  ) {
    return "Econômico";
  }

  if (
    (mv >= 1_150_000 && m2Value >= 6_000) ||
    mv >= 1_800_000 ||
    (isNoble && mv >= 750_000) ||
    (m2Value >= 10_500 && mv >= 650_000)
  ) {
    return "AAA";
  }

  return "Médio";
}

/**
 * Calcula o Score Preliminar (0 a 100) e selos de triagem na lista (Custo R$ 0 de IA)
 */
export function evaluateLotPreliminary(
  lot: ScrapedAuctionLot,
  isCachedDossier = false
): PrelimEvaluation {
  const category = inferPropertyCategory(lot);
  const effectiveMv = resolveEffectiveMarketValue(lot);
  const areaM2 = estimateAreaM2(lot);
  const tier = inferPropertyTier(lot, areaM2, category, effectiveMv);
  const effectiveOccupancy = resolveEffectiveOccupancy(lot);
  const secondPraca = isLotActiveSecondPraca(lot);

  let score = 50;

  const discount =
    lot.discountPct > 0
      ? lot.discountPct
      : effectiveMv > lot.minBid
      ? Math.round((1 - lot.minBid / effectiveMv) * 100)
      : 0;

  if (discount >= 50) score += 28;
  else if (discount >= 40) score += 23;
  else if (discount >= 30) score += 16;
  else if (discount >= 20) score += 9;
  else score -= 6;

  if (effectiveOccupancy === "Desocupado") score += 10;
  else score -= 3;

  const modLower = (lot.modality || "").toLowerCase();
  const isExtrajudicial =
    modLower.includes("extrajudicial") ||
    lot.source === "Caixa" ||
    lot.source === "Banco do Brasil";
  if (isExtrajudicial) score += 7;

  if (lot.acceptsFinancing) score += 5;

  const summaryLower = `${lot.aiSummary || ""} ${
    lot.aiChecklist?.lawyerAlert || ""
  }`.toLowerCase();
  if (summaryLower.includes("usufruto")) score -= 22;
  if (summaryLower.includes("indisponibilidade")) score -= 8;

  const finalScore = Math.max(25, Math.min(98, Math.round(score)));

  const badges: PrelimEvaluation["badges"] = [];
  if (isCachedDossier) {
    badges.push({ label: "Analisado", tone: "indigo" });
  }
  if (secondPraca) {
    badges.push({ label: `2ª Praça · -${discount}%`, tone: "emerald" });
  } else if (discount >= 35) {
    badges.push({ label: `-${discount}% s/ Avaliação`, tone: "emerald" });
  }
  if (effectiveOccupancy === "Desocupado") {
    badges.push({ label: "Desocupado", tone: "emerald" });
  } else {
    badges.push({ label: effectiveOccupancy, tone: "amber" });
  }
  if (lot.acceptsFinancing) {
    badges.push({ label: "Aceita Financiamento", tone: "slate" });
  }

  const verdictStatus: TrafficLight =
    finalScore >= 76 ? "green" : finalScore >= 58 ? "yellow" : "red";
  const verdictLabel =
    verdictStatus === "green"
      ? "Recomendado até o Lance Teto"
      : verdictStatus === "yellow"
      ? "Viável com Reserva Jurídica/Reforma"
      : "Alto Risco · Exige Diligência Estrita";

  const suggestedReformaLevel: ReformaLevel =
    category === "Terreno" ? 0 : effectiveOccupancy === "Desocupado" ? 1 : 2;

  return {
    prelimScore: finalScore,
    propertyCategory: category,
    propertyTier: tier,
    estimatedAreaM2: areaM2,
    effectiveOccupancy,
    isSecondPracaActive: secondPraca,
    pricePerM2Bid: areaM2 > 0 ? Math.round(lot.minBid / areaM2) : 0,
    pricePerM2Market: areaM2 > 0 ? Math.round(effectiveMv / areaM2) : 0,
    suggestedReformaLevel,
    badges,
    verdictStatus,
    verdictLabel,
  };
}

/**
 * Referência média de R$/m² em bairros e cidades do Estado de SP (Base FipeZAP / Mercado Imobiliário SP)
 */
const SP_MARKET_M2_BENCHMARKS: { keywords: string[]; m2: number; label: string }[] = [
  { keywords: ["itaim bibi", "jardim europa", "jardim paulistano", "jardim américa", "vila nova conceição"], m2: 18500, label: "Itaim / Jardins (SP)" },
  { keywords: ["vila olímpia", "vila olimpia"], m2: 15800, label: "Vila Olímpia (SP)" },
  { keywords: ["pinheiros", "alto de pinheiros"], m2: 14800, label: "Pinheiros (SP)" },
  { keywords: ["moema"], m2: 14200, label: "Moema (SP)" },
  { keywords: ["higienópolis", "higienopolis", "pacaembu"], m2: 13200, label: "Higienópolis / Pacaembu (SP)" },
  { keywords: ["brooklin", "campo belo"], m2: 12900, label: "Brooklin / Campo Belo (SP)" },
  { keywords: ["vila mariana", "paraíso", "paraiso", "aclimação", "aclimacao"], m2: 12400, label: "Vila Mariana / Paraíso (SP)" },
  { keywords: ["perdizes", "pompeia", "pompéia"], m2: 12100, label: "Perdizes / Pompeia (SP)" },
  { keywords: ["vila leopoldina", "lapa"], m2: 10800, label: "Lapa / Vila Leopoldina (SP)" },
  { keywords: ["bela vista", "consolação", "consolacao", "santa cecília"], m2: 10200, label: "Bela Vista / Consolação (SP)" },
  { keywords: ["saúde", "saude", "vila prudente"], m2: 9800, label: "Saúde / Vila Prudente (SP)" },
  { keywords: ["ipiranga"], m2: 10600, label: "Ipiranga (SP)" },
  { keywords: ["mooca", "tatuapé", "tatuape", "analia franco", "anália franco"], m2: 9800, label: "Tatuapé / Mooca (SP)" },
  { keywords: ["santana", "tucuruvi", "casa verde"], m2: 8800, label: "Santana / Zona Norte (SP)" },
  { keywords: ["morumbi", "real parque", "vila andrade", "panamby"], m2: 8200, label: "Morumbi / Panamby (SP)" },
  { keywords: ["santo amaro", "chácara santo antônio", "chacara santo antonio"], m2: 9900, label: "Santo Amaro (SP)" },
  { keywords: ["butantã", "butanta", "rio pequeno"], m2: 8400, label: "Butantã (SP)" },
  { keywords: ["centro", "república", "republica", "sé", "liberdade"], m2: 7900, label: "Centro / Liberdade (SP)" },
  { keywords: ["alphaville", "tamboré", "tambore", "barueri"], m2: 10600, label: "Alphaville / Barueri" },
  { keywords: ["são caetano", "sao caetano"], m2: 9200, label: "São Caetano do Sul" },
  { keywords: ["santo andré", "santo andre"], m2: 7600, label: "Santo André" },
  { keywords: ["são bernardo", "sao bernardo"], m2: 7200, label: "São Bernardo do Campo" },
  { keywords: ["campinas", "cambuí", "cambui"], m2: 8300, label: "Campinas" },
  { keywords: ["santos", "gonzaga", "boqueirão"], m2: 8900, label: "Santos" },
  { keywords: ["guarulhos", "vila augusta", "maia"], m2: 6700, label: "Guarulhos" },
  { keywords: ["osasco"], m2: 7100, label: "Osasco" },
  { keywords: ["são josé dos campos", "sao jose dos campos"], m2: 7400, label: "São José dos Campos" },
  { keywords: ["ribeirão preto", "ribeirao preto"], m2: 6200, label: "Ribeirão Preto" },
  { keywords: ["sorocaba"], m2: 5900, label: "Sorocaba" },
  { keywords: ["jundiaí", "jundiai"], m2: 7300, label: "Jundiaí" },
];

export function extractCondominiumName(lot: ScrapedAuctionLot): string | null {
  const source = `${lot.title || ""} ${lot.address || ""}`;
  const match = source.match(
    /\b(?:edif[ií]cio|ed\.|condom[ií]nio|cond\.|residencial|torre|conjunto\s+residencial)\s+([A-ZÀ-Ú0-9][A-Za-zÀ-ú0-9\s'&-]{2,40}?)(?=\s*(?:[-–,·/|()]|\b(?:apto|apartamento|unidade|bloco|bl\.|rua|av\.|avenida|alameda|são paulo|sao paulo|sp)\b|$))/i
  );
  if (!match?.[0]) return null;
  const cleaned = match[0].replace(/\s+/g, " ").trim();
  return cleaned.length >= 6 ? cleaned : null;
}

export function estimateSpMarketBenchmark(
  lot: ScrapedAuctionLot,
  areaM2: number,
  category: PropertyCategory,
  tier: PropertyTier
): {
  benchmarkM2: number;
  benchmarkTotalValue: number;
  benchmarkLabel: string;
} {
  const text = `${lot.neighborhood || ""} ${lot.city || ""} ${lot.address || ""} ${
    lot.title || ""
  }`.toLowerCase();

  let baseM2 = 0;
  let label = "";

  for (const entry of SP_MARKET_M2_BENCHMARKS) {
    if (entry.keywords.some((kw) => text.includes(kw))) {
      baseM2 = entry.m2;
      label = `Ref. FipeZAP/Mercado — ${entry.label}`;
      break;
    }
  }

  if (!baseM2) {
    const isCapital = text.includes("são paulo") || text.includes("sao paulo");
    if (isCapital) {
      baseM2 = tier === "AAA" ? 13200 : tier === "Médio" ? 9400 : 6500;
      label = `Média SP Capital (Padrão ${tier})`;
    } else {
      baseM2 = tier === "AAA" ? 8900 : tier === "Médio" ? 6400 : 4500;
      label = `Média ${lot.city || "Interior/RMSP"} (Padrão ${tier})`;
    }
  }

  const catFactor =
    category === "Terreno"
      ? 0.48
      : category === "Casa"
      ? 0.92
      : category === "Comercial"
      ? 0.95
      : 1.0;

  // Curva de R$/m² por faixa de metragem (compactos têm R$/m² maior que unidades grandes no mesmo bairro)
  let areaFactor = 1.0;
  let areaNote = "";
  if (category === "Apartamento" || category === "Comercial") {
    if (areaM2 <= 42) {
      areaFactor = 1.18;
      areaNote = " · compacto ≤42m² (+18%/m²)";
    } else if (areaM2 <= 65) {
      areaFactor = 1.05;
      areaNote = " · 43–65m² (+5%/m²)";
    } else if (areaM2 <= 105) {
      areaFactor = 1.0;
    } else if (areaM2 <= 150) {
      areaFactor = 0.92;
      areaNote = " · amplo 106–150m² (-8%/m²)";
    } else {
      areaFactor = 0.85;
      areaNote = " · grande porte >150m² (-15%/m²)";
    }
  }

  // Ajuste por número de vagas de garagem em apartamentos (2+ vagas agregam liquidez e R$/m² em SP)
  let parkingFactor = 1.0;
  let parkingNote = "";
  if (category === "Apartamento") {
    if (/\b(?:0?3|tr[eê]s|0?4|quatro)\s*vagas?\b/i.test(text)) {
      parkingFactor = 1.12;
      parkingNote = " · 3+ vagas (+12%)";
    } else if (/\b(?:0?2|duas)\s*vagas?\b/i.test(text)) {
      parkingFactor = 1.06;
      parkingNote = " · 2 vagas (+6%)";
    }
  }

  const benchmarkM2 = Math.round(baseM2 * catFactor * areaFactor * parkingFactor);
  const benchmarkTotalValue = Math.round(benchmarkM2 * Math.max(1, areaM2));

  return {
    benchmarkM2,
    benchmarkTotalValue,
    benchmarkLabel: `${label}${areaNote}${parkingNote}`,
  };
}

/**
 * Simulador Financeiro Completo & Calculadora Reversa de Lance Teto (Isomórfico)
 */
export function simulateAuctionDeal(
  lot: ScrapedAuctionLot,
  params?: Partial<SimulationParams>
): DealFinancialSimulation {
  const prelim = evaluateLotPreliminary(lot);
  const areaM2 = prelim.estimatedAreaM2;
  const category = prelim.propertyCategory;
  const tier = prelim.propertyTier;
  const effectiveOccupancy = prelim.effectiveOccupancy;

  const simulatedBid = params?.simulatedBid ?? lot.minBid;
  const reformaLevel = params?.reformaLevel ?? prelim.suggestedReformaLevel;
  const holdingMonths =
    params?.holdingMonths ?? (effectiveOccupancy === "Desocupado" ? 6 : 9);
  const targetMarginPct = params?.targetMarginPct ?? 18;

  const editalMarketValue = resolveEffectiveMarketValue(lot);
  const { benchmarkM2, benchmarkTotalValue, benchmarkLabel } =
    estimateSpMarketBenchmark(lot, areaM2, category, tier);

  const marketValueEffective =
    params?.customMarketValue && params.customMarketValue > 0
      ? Math.round(params.customMarketValue)
      : editalMarketValue;

  const editalVsBenchmarkPct =
    benchmarkTotalValue > 0
      ? Math.round(
          ((editalMarketValue - benchmarkTotalValue) / benchmarkTotalValue) * 100
        )
      : 0;

  const liquidityHaircutPct = 6;
  const realisticSalePrice = Math.round(
    marketValueEffective * (1 - liquidityHaircutPct / 100)
  );

  // Custos de reforma SP (+15% automático para Casas conforme Anexo A)
  const baseReformaM2 = REFORMA_SP_TABLE[reformaLevel].costPerM2[tier];
  const houseMultiplier =
    category === "Casa" ? 1.15 : category === "Terreno" ? 0 : 1.0;
  const reformaCost = Math.round(areaM2 * baseReformaM2 * houseMultiplier);

  // 1. Custo de Desocupação e Imissão na Posse (separado da reserva de contingência)
  // Se Desocupado: apenas diligência de imissão/vistoria (R$ 1.800).
  // Se Ocupado / Ver no Edital: ação de imissão liminar + oficial de justiça / acordo de saída (R$ 7.500 a R$ 9.500).
  const evictionAndLegalCost =
    effectiveOccupancy === "Desocupado"
      ? 1800
      : category === "Casa"
      ? 8500
      : 6800;

  // 2. Reserva de Contingência Jurídica & Passivos Editalícios (defesa em eventual embargos/impugnação Art. 903 CPC,
  // certidões cartorárias e eventuais resíduos propter rem)
  const modLower = (lot.modality || "").toLowerCase();
  const isJudicial =
    modLower.includes("judicial") && !modLower.includes("extrajudicial");
  const legalContingencyReserve = isJudicial
    ? Math.max(4500, Math.round(marketValueEffective * 0.012))
    : Math.max(2800, Math.round(marketValueEffective * 0.007));

  // Condomínio + IPTU mensal estimado durante os meses de giro
  const holdingMonthlyEstimate =
    category === "Apartamento"
      ? Math.max(650, Math.round(marketValueEffective * 0.0014))
      : Math.max(320, Math.round(marketValueEffective * 0.0006));
  const holdingCostTotal = holdingMonthlyEstimate * holdingMonths;

  const computeForBid = (
    bid: number,
    label: string,
    subtitle: string
  ): ScenarioResult => {
    const auctioneerFee = Math.round(bid * 0.05); // 5% leiloeiro
    const itbiCost = Math.round(bid * 0.03); // 3% ITBI SP
    const registryAndDeedCost = Math.max(3500, Math.round(bid * 0.013)); // Escritura/Carta + Registro CRI + Baixa de Penhoras

    const totalInvestment =
      bid +
      auctioneerFee +
      itbiCost +
      registryAndDeedCost +
      evictionAndLegalCost +
      legalContingencyReserve +
      reformaCost +
      holdingCostTotal;

    const brokerFee = Math.round(realisticSalePrice * 0.06); // 6% corretagem na saída
    const grossProfitBeforeTax =
      realisticSalePrice - brokerFee - totalInvestment;
    const capitalGainsTax =
      grossProfitBeforeTax > 0 ? Math.round(grossProfitBeforeTax * 0.15) : 0;
    const netProfit = grossProfitBeforeTax - capitalGainsTax;

    const roiPct =
      totalInvestment > 0
        ? Number(((netProfit / totalInvestment) * 100).toFixed(1))
        : 0;
    const netMarginPct =
      realisticSalePrice > 0
        ? Number(((netProfit / realisticSalePrice) * 100).toFixed(1))
        : 0;
    const monthlyIrrPct =
      roiPct > -90 && holdingMonths > 0
        ? Number(
            (
              (Math.pow(1 + Math.max(-0.8, roiPct / 100), 1 / holdingMonths) -
                1) *
              100
            ).toFixed(2)
          )
        : 0;

    return {
      label,
      subtitle,
      bidAmount: bid,
      totalInvestment,
      netSaleRevenue: realisticSalePrice - brokerFee - capitalGainsTax,
      netProfit,
      roiPct,
      netMarginPct,
      monthlyIrrPct,
      viable: netMarginPct >= targetMarginPct && netProfit > 0,
    };
  };

  // Calculadora Reversa de Lance Teto Máximo Indicado
  const targetNetProfit = realisticSalePrice * (targetMarginPct / 100);
  const targetGrossProfit = targetNetProfit / 0.85; // antes dos 15% de IR
  const maxAllowedTotalInvestment =
    realisticSalePrice * 0.94 - targetGrossProfit;
  const fixedNonBidCosts =
    evictionAndLegalCost +
    legalContingencyReserve +
    reformaCost +
    holdingCostTotal;
  const rawMaxBid = (maxAllowedTotalInvestment - fixedNonBidCosts) / 1.093; // 1 + 5% + 3% + 1.3%
  const maxRecommendedBid = Math.max(
    Math.round(lot.minBid * 0.85),
    Math.round(rawMaxBid / 1000) * 1000
  );

  const currentScenario = computeForBid(
    simulatedBid,
    "Simulação Atual",
    "Ajustada no simulador"
  );
  const minBidScenario = computeForBid(
    lot.minBid,
    "Cenário 1 · Lance Mínimo",
    "Arremate sem disputa na praça"
  );
  const moderateScenario = computeForBid(
    Math.round(lot.minBid * 1.1),
    "Cenário 2 · Disputa Moderada (+10%)",
    "Pregão com 2 a 4 licitantes ativos"
  );
  const ceilingScenario = computeForBid(
    maxRecommendedBid,
    `Cenário 3 · No Lance Teto Indicado`,
    `Limite máximo p/ preservar ${targetMarginPct}% de margem líquida`
  );

  const auctioneerFee = Math.round(simulatedBid * 0.05);
  const itbiCost = Math.round(simulatedBid * 0.03);
  const registryAndDeedCost = Math.max(3500, Math.round(simulatedBid * 0.013));
  const brokerFee = Math.round(realisticSalePrice * 0.06);
  const grossProfit =
    realisticSalePrice - brokerFee - currentScenario.totalInvestment;
  const capitalGainsTax = grossProfit > 0 ? Math.round(grossProfit * 0.15) : 0;

  const estimatedMonthlyRent = Math.round(realisticSalePrice * 0.0055);
  const annualRentalYieldPct =
    currentScenario.totalInvestment > 0
      ? Number(
          (
            ((estimatedMonthlyRent * 12) / currentScenario.totalInvestment) *
            100
          ).toFixed(1)
        )
      : 0;

  const maxBidBufferAmount = maxRecommendedBid - lot.minBid;
  const headroomToMaxBidPct =
    lot.minBid > 0
      ? Number(
          (((maxRecommendedBid - lot.minBid) / lot.minBid) * 100).toFixed(1)
        )
      : 0;

  return {
    lotId: lot.id,
    editalMarketValue,
    marketValueEffective,
    benchmarkM2,
    benchmarkTotalValue,
    benchmarkLabel,
    editalVsBenchmarkPct,
    liquidityHaircutPct,
    realisticSalePrice,
    estimatedAreaM2: areaM2,
    propertyCategory: category,
    propertyTier: tier,
    effectiveOccupancy,
    simulatedBid,
    auctioneerFee,
    itbiCost,
    registryAndDeedCost,
    evictionAndLegalCost,
    legalContingencyReserve,
    reformaCost,
    holdingCostTotal,
    holdingMonthlyEstimate,
    totalAcquisitionAndHolding: currentScenario.totalInvestment,
    brokerFee,
    capitalGainsTax,
    netProfit: currentScenario.netProfit,
    roiPct: currentScenario.roiPct,
    netMarginPct: currentScenario.netMarginPct,
    monthlyIrrPct: currentScenario.monthlyIrrPct,
    estimatedMonthlyRent,
    annualRentalYieldPct,
    maxRecommendedBid,
    maxBidBufferAmount,
    headroomToMaxBidPct,
    isAboveMaxBid: simulatedBid > maxRecommendedBid,
    scenarios: {
      minBid: minBidScenario,
      moderateDispute: moderateScenario,
      ceilingBid: ceilingScenario,
    },
  };
}

/**
 * Gera a Matriz Jurídica de 8 Itens com Semáforo, citações e aprofundamento técnico expansível (+)
 */
export function buildDefaultLegalMatrix(
  lot: ScrapedAuctionLot
): LegalMatrixItem[] {
  const modLower = (lot.modality || "").toLowerCase();
  const isExtrajudicial =
    modLower.includes("extrajudicial") ||
    lot.source === "Caixa" ||
    lot.source === "Banco do Brasil";
  const summaryLower = `${lot.aiSummary || ""} ${
    lot.aiChecklist?.debts || ""
  } ${lot.aiChecklist?.matriculaStatus || ""}`.toLowerCase();

  const debtsSubrogated =
    summaryLower.includes("sub-roga") ||
    summaryLower.includes("quitados") ||
    summaryLower.includes("art. 130") ||
    (!isExtrajudicial && !summaryLower.includes("conta do arrematante"));

  const hasUsufruto = summaryLower.includes("usufruto");
  const hasIndisponibilidade = summaryLower.includes("indisponibilidade");
  const mainDoc = lot.documentsRead?.[0]?.label || "Edital do Leilão";
  const effectiveOccupancy = resolveEffectiveOccupancy(lot);

  return [
    {
      id: "rito",
      number: 1,
      title: "Natureza e Rito do Leilão",
      level: isExtrajudicial ? "green" : "yellow",
      statusLabel: isExtrajudicial
        ? "Extrajudicial (Lei 9.514/97)"
        : "Judicial (Carta de Arrematação)",
      finding: isExtrajudicial
        ? "Consolidação fiduciária com rito célere de transferência e liminar de imissão na posse em 60 dias (Art. 30 da Lei 9.514/97)."
        : "Execução judicial sujeita à expedição de Carta de Arrematação e ordem de imissão pelo juízo da vara.",
      citation: `Modalidade registrada no lote: "${lot.modality}" · Comitente/Vara: ${lot.seller}.`,
      documentName: mainDoc,
      pageRef: "Quadro Resumo / Cláusula 1ª",
      deepDive: {
        legalBasis: isExtrajudicial
          ? "Lei Federal nº 9.514/1997 (Arts. 26, 27 e 30) — Alienação Fiduciária de Coisa Imóvel. A propriedade já foi consolidada em nome do credor fiduciário."
          : "Código de Processo Civil (Arts. 879 a 903 do CPC). A arrematação judicial é considerada aquisição originária e torna-se perfeita e acabada com a assinatura do Auto de Arrematação (Art. 903, caput).",
        financialAndTimeImpact: isExtrajudicial
          ? "Prazo médio de 30 a 45 dias para lavratura da escritura/contrato e registro no CRI, com taxa reduzida de risco de impugnação processual."
          : "Prazo médio de 60 a 120 dias para expedição da Carta de Arrematação e mandado de imissão. A DRE já provisiona reserva de contingência jurídica para eventual manifestação nos autos.",
        practicalChecklist: isExtrajudicial
          ? [
              "Verificar na matrícula a averbação da consolidação da propriedade e das intimações do devedor fiduciante.",
              "Confirmar ausência de liminar ativa suspendendo o leilão no TJSP.",
            ]
          : [
              "Conferir nos autos do processo se o executado e eventuais coproprietários/cônjuges foram regularmente intimados da praça (Art. 889 CPC).",
              "Peticionar imediatamente após o Auto de Arrematação requerendo a expedição prioritária da Carta e do mandado de imissão (Art. 901 §1º CPC).",
            ],
      },
    },
    {
      id: "iptu",
      number: 2,
      title: "Responsabilidade por Dívidas de IPTU",
      level: debtsSubrogated ? "green" : "yellow",
      statusLabel: debtsSubrogated
        ? "Sub-rogação no Preço (Art. 130 CTN)"
        : "Conferir Quitação no Edital",
      finding: debtsSubrogated
        ? "Indicação de sub-rogação dos créditos tributários anteriores no preço da arrematação (Art. 130, parágrafo único do CTN)."
        : lot.aiChecklist?.debts ||
          "Recomendado provisionar certidão negativa municipal antes do pregão para confirmar ausência de repasse ao comprador.",
      citation:
        lot.aiChecklist?.debts ||
        "Disposição sobre tributos municipais conforme regras gerais do edital.",
      documentName: mainDoc,
      pageRef: "Seção de Débitos e Ônus",
      deepDive: {
        legalBasis:
          "Art. 130, parágrafo único do Código Tributário Nacional (CTN) e jurisprudência pacificada do STJ (Tema Repetitivo 1.134): no leilão judicial, a sub-rogação ocorre no preço pago, salvo previsão expressa no edital em leilões extrajudiciais.",
        financialAndTimeImpact: debtsSubrogated
          ? "Sem impacto adicional sobre o caixa do arrematante para dívidas anteriores à data do leilão; apenas o IPTU vincendo pós-arrematação entra na DRE."
          : "Caso o edital transfira expressamente o IPTU pretérito ao comprador, o valor em aberto na prefeitura deve ser abatido diretamente do seu Lance Teto.",
        practicalChecklist: [
          "Emitir a Certidão Conjunta de Débitos de Tributos Imobiliários pelo número do Contribuinte (SQL/Inscrição Municipal) no site da Prefeitura.",
          "Conferir na cláusula de débitos do edital se consta 'sub-rogados no preço' ou 'por conta do arrematante'.",
        ],
      },
    },
    {
      id: "condominio",
      number: 3,
      title: "Dívidas de Condomínio (Propter Rem)",
      level: summaryLower.includes("conta do arrematante") ? "yellow" : "green",
      statusLabel: summaryLower.includes("conta do arrematante")
        ? "Atenção: Obrigação Propter Rem"
        : "Dentro do Limite / Sub-rogado",
      finding: summaryLower.includes("conta do arrematante")
        ? "O edital menciona responsabilidade do comprador por eventuais cotas condominiais em aberto. Solicitar demonstrativo ao síndico/administradora."
        : "Sem apontamento de passivo condominial extraordinário acima do valor de reserva da operação.",
      citation:
        lot.aiChecklist?.debts ||
        "Verificação de obrigações condominiais anteriores à data da praça.",
      documentName: mainDoc,
      pageRef: "Cláusula de Encargos",
      deepDive: {
        legalBasis:
          "Art. 1.345 do Código Civil e entendimento do STJ (REsp 1.672.508): débitos condominiais têm natureza propter rem, mas o arrematante não responde por dívidas anteriores se o edital for omisso ou previr sub-rogação no preço.",
        financialAndTimeImpact:
          "Em bancos como Caixa e BB, alguns editais quitam condomínio acima de 10% da avaliação ou integralmente até a data da venda. Nas demais modalidades, a DRE já inclui reserva de contingência.",
        practicalChecklist: [
          "Consultar no processo judicial se o próprio condomínio é o exequente ou se há planilha atualizada de débitos juntada aos autos.",
          "Contatar a administradora do condomínio para confirmar o valor da cota mensal ordinária vigente.",
        ],
      },
    },
    {
      id: "ocupacao",
      number: 4,
      title: "Situação Ocupacional & Desocupação",
      level: effectiveOccupancy === "Desocupado" ? "green" : "yellow",
      statusLabel:
        effectiveOccupancy === "Desocupado"
          ? "Imóvel Desocupado"
          : "Ocupado / Ver no Edital (Provisão Inclusa)",
      finding:
        effectiveOccupancy === "Desocupado"
          ? "Imóvel reportado como livre de ocupantes, permitindo vistoria e início imediato de reforma cosmética após posse."
          : "Situação ocupacional exige provisão de desocupação. A DRE e o Lance Teto já descontam assessoria jurídica e meses de vacância.",
      citation: `Status ocupacional consta como "${effectiveOccupancy}" na descrição oficial do lote.`,
      documentName: mainDoc,
      pageRef: "Descrição do Bem",
      deepDive: {
        legalBasis: isExtrajudicial
          ? "Art. 30 da Lei 9.514/97: assegura ao adquirente a reintegração na posse concedida liminarmente para desocupação no prazo de 60 dias."
          : "Art. 901 §1º do CPC: a ordem de entrega do bem (mandado de imissão na posse) é expedida pelo próprio juiz da execução nos mesmos autos, sem necessidade de nova ação.",
        financialAndTimeImpact:
          effectiveOccupancy === "Desocupado"
            ? "Economia estimada de R$ 5.000 a R$ 7.500 em custos jurídicos e redução de 3 a 4 meses no ciclo de giro do capital."
            : "A DRE já desconta de R$ 6.800 a R$ 8.500 para assessoria de desocupação (acordo amigável ou cumprimento de mandado) mais os meses de condomínio/IPTU durante a posse.",
        practicalChecklist: [
          "Confirmar na portaria do edifício ou vizinhança quem ocupa o imóvel (antigo proprietário, inquilino ou imóvel fechado).",
          "Priorizar acordo extrajudicial amigável (auxílio-mudança mediante entrega das chaves e termo de vistoria) para antecipar a posse em 15 a 30 dias.",
        ],
      },
    },
    {
      id: "pagamento",
      number: 5,
      title: "Formas de Pagamento no Edital",
      level: lot.acceptsFinancing ? "green" : "yellow",
      statusLabel: lot.acceptsFinancing
        ? "À Vista, Parcelado ou Financiamento"
        : "Pagamento à Vista / CPC Art. 895",
      finding:
        lot.aiChecklist?.paymentRule ||
        "Permite pagamento à vista ou proposta de parcelamento conforme regras do edital do leiloeiro.",
      citation:
        lot.aiChecklist?.paymentRule ||
        "Condições de pagamento da arrematação homologadas pelo leiloeiro oficial.",
      documentName: mainDoc,
      pageRef: "Condições de Pagamento",
      deepDive: {
        legalBasis: isExtrajudicial
          ? "Regras contratuais do comitente vendedor (à vista com desconto, parcelamento direto ou financiamento bancário SFH/SFI)."
          : "Art. 895 do CPC: permite proposta de aquisição parcelada com entrada mínima de 25% à vista e o restante em até 30 prestações mensais corrigidas + hipoteca do próprio bem.",
        financialAndTimeImpact:
          "A alavancagem via financiamento ou parcelamento pelo Art. 895 CPC reduz o desembolso inicial e pode elevar a TIR sobre o capital próprio investido.",
        practicalChecklist: [
          "Atenção: No leilão judicial, o lance à vista sempre prefere ao lance parcelado de igual valor (Art. 895 §7º do CPC).",
          "Em leilão bancário com financiamento, aprovar previamente a carta de crédito antes do encerramento da praça.",
        ],
      },
    },
    {
      id: "gravames",
      number: 6,
      title: "Gravames e Ônus na Matrícula",
      level: hasUsufruto ? "red" : hasIndisponibilidade ? "yellow" : "green",
      statusLabel: hasUsufruto
        ? "Crítico: Menção a Usufruto"
        : hasIndisponibilidade
        ? "Baixa de Penhora/Indisponibilidade"
        : "Penhora/AF Extingue com Arrematação",
      finding:
        lot.aiChecklist?.matriculaStatus ||
        "Matrícula vinculada ao edital sem restrições impeditivas de transferência após baixa regular do gravame exequendo.",
      citation: `${lot.aiChecklist?.matriculaStatus || ""} ${
        lot.aiChecklist?.lawyerAlert || ""
      }`.trim(),
      documentName:
        lot.documentsRead?.find((d) =>
          d.label.toLowerCase().includes("matr")
        )?.label || "Matrícula / Edital",
      pageRef: "Certidão de Matrícula CRI",
      deepDive: {
        legalBasis:
          "Art. 1.499, inciso VI do Código Civil e Provimento CNJ nº 39/2014: a arrematação extingue a hipoteca e desvincula o imóvel das penhoras que recaíram sobre ele, transferindo a discussão dos credores para o produto pecuniário do leilão.",
        financialAndTimeImpact: hasUsufruto
          ? "Atenção máxima: o usufruto vitalício registrado antes da penhora NÃO se extingue automaticamente com a arrematação da nua-propriedade, salvo se o usufrutuário também for executado ou já for falecido."
          : "Custas de averbação de cancelamento de penhoras/indisponibilidade no Cartório de Registro de Imóveis já estão incluídas na linha de Registro Cartorário da DRE.",
        practicalChecklist: [
          "Ler todos os atos de Registro (R.) e Averbação (Av.) do final da matrícula para verificar se há indisponibilidade da Justiça Federal/Trabalhista (CNIB).",
          "Caso haja penhora de outro juízo, requerer no processo o ofício de comunicação para baixa das demais constrições.",
        ],
      },
    },
    {
      id: "comissao",
      number: 7,
      title: "Comissão do Leiloeiro e Taxas",
      level: "green",
      statusLabel: "5% sobre o Lance (Já na DRE)",
      finding:
        "Comissão oficial padrão de 5% paga diretamente ao leiloeiro em até 24h/48h após o encerramento do pregão, já contabilizada no Lance Teto.",
      citation: `Leiloeiro Oficial: ${lot.source} · Código do Lote: ${lot.code}.`,
      documentName: mainDoc,
      pageRef: "Comissão e Prazo",
      deepDive: {
        legalBasis:
          "Art. 24, parágrafo único do Decreto nº 21.981/1932 e Art. 884, parágrafo único do CPC. A comissão do leiloeiro não compõe o valor da arrematação e é paga à vista.",
        financialAndTimeImpact:
          "Representa 5% do lance vencedor, com vencimento em 24h a 48h corridas via guia/boleto ou PIX. Em caso de anulação do leilão sem culpa do arrematante, o valor é integralmente restituído (Art. 903 §1º CPC).",
        practicalChecklist: [
          "Manter liquidez imediata em conta bancária de mesma titularidade do arrematante para pagamento do sinal/lance e da comissão de 5% no dia do pregão.",
          "Guardar os comprovantes separados (Auto de Arrematação + Recibo de Comissão do Leiloeiro) para dedução como custo de aquisição na apuração do Ganho de Capital.",
        ],
      },
    },
    {
      id: "documentos",
      number: 8,
      title: "Acervo Documental Auditado",
      level: (lot.documentsRead?.length || 0) > 0 ? "green" : "yellow",
      statusLabel: `${
        lot.documentsRead?.length || 1
      } documento(s) oficial(is) vinculado(s)`,
      finding:
        "Links diretos do leiloeiro disponíveis abaixo para download e conferência integral de Edital, Matrícula e Laudo.",
      citation:
        (lot.documentsRead || []).map((d) => d.label).join(" · ") ||
        "Página Oficial do Leiloeiro",
      documentName: "Anexos Oficiais",
      pageRef: "Links Verificados",
      deepDive: {
        legalBasis:
          "Dever de publicidade e transparência do edital (Art. 886 do CPC). As condições específicas do edital prevalecem sobre informações resumidas de divulgação.",
        financialAndTimeImpact:
          "A conferência prévia dos anexos elimina surpresas com taxas extras, prazos de pagamento curtos ou pendências de regularização de área construída.",
        practicalChecklist: [
          "Solicitar habilitação prévia no portal do leiloeiro com pelo menos 24h de antecedência ao encerramento da praça.",
          "Baixar e arquivar em PDF o Edital e a Matrícula vigentes na data do seu lance como prova das condições ofertadas.",
        ],
      },
    },
  ];
}
