export interface ScrapedAuctionLot {
  id: string;
  code: string;
  source:
    | "Mega Leilões"
    | "Portal Zuk"
    | "Superbid"
    | "Sold Leilões"
    | "Sodré Santoro"
    | "Banco do Brasil"
    | "Caixa";
  sourceUrl: string;
  imageUrl: string;
  title: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  marketValue: number;
  minBid: number;
  discountPct: number;
  modality: string;
  seller: string;
  auctionDate: string;
  isSecondPraca?: boolean;
  areaM2: number | null;
  acceptsFinancing: boolean;
  occupancy: "Desocupado" | "Ocupado" | "Ver no Edital";
  riskLevel: "baixo" | "medio" | "alto";
  riskScore: number;
  aiSummary: string;
  aiChecklist: {
    debts: string;
    matriculaStatus: string;
    paymentRule: string;
    lawyerAlert: string;
  };
  documentsRead: { label: string; url: string }[];
}

export interface DailySnapshot {
  timestamp: number;
  updatedAt: string;
  count: number;
  uf: string;
  lots: ScrapedAuctionLot[];
}

/**
 * Determina com precisão se um lote já está na 2ª Praça (com deságio ativo sobre a avaliação)
 * Função isenta de dependências de Node.js/fs, segura para Server e Client Components.
 */
export function isLotInSecondPraca(lot: {
  isSecondPraca?: boolean;
  discountPct?: number;
  modality?: string;
  aiSummary?: string;
  title?: string;
  source?: string;
}): boolean {
  // 1. Definição booleana explícita vinda do scraper especializado (ex: Superbid com metadados de leilão)
  if (lot.isSecondPraca === true) return true;
  if (lot.isSecondPraca === false) return false;

  const summaryLower = (lot.aiSummary || "").toLowerCase();
  const titleLower = (lot.title || "").toLowerCase();
  const modalityLower = (lot.modality || "").toLowerCase();

  // 2. Se o título indica explicitamente 1ª Praça / 1º Leilão / Praça Única, NÃO é 2ª Praça
  if (
    titleLower.includes("1ª praça") ||
    titleLower.includes("1º leilão") ||
    titleLower.includes("primeira praça") ||
    titleLower.includes("primeiro leilão") ||
    titleLower.includes("praça única") ||
    titleLower.includes("praca unica")
  ) {
    return false;
  }

  // 3. Superbid e Sold Leilões: sem flag explícita, só aceita se o título expressar textualmente 2ª praça / 2º leilão
  if (lot.source === "Superbid" || lot.source === "Sold Leilões") {
    return (
      titleLower.includes("2ª praça") ||
      titleLower.includes("2º leilão") ||
      titleLower.includes("segunda praça") ||
      titleLower.includes("segundo leilão")
    );
  }

  // 4. Menções explícitas de 2ª Praça no título
  if (
    titleLower.includes("2ª praça") ||
    titleLower.includes("2º leilão") ||
    titleLower.includes("segunda praça") ||
    titleLower.includes("segundo leilão")
  ) {
    return true;
  }

  // 5. Mega Leilões e Portal Zuk com deságio judicial ativo (Art. 891 CPC: deságio de 40% a 60% sobre a avaliação)
  if (
    (lot.source === "Mega Leilões" || lot.source === "Portal Zuk") &&
    modalityLower.includes("judicial") &&
    (lot.discountPct || 0) >= 30
  ) {
    return true;
  }

  if (summaryLower.includes("sobre a 1ª praça") && (lot.discountPct || 0) > 0) {
    return true;
  }

  // 6. Resumo textual afirmativo de 2ª praça aberta
  if (
    summaryLower.includes("em 2ª praça") ||
    summaryLower.includes("aberto para 2ª praça") ||
    summaryLower.includes("está em 2ª praça") ||
    summaryLower.includes("segunda praça aberta") ||
    summaryLower.includes("2ª praça ativa")
  ) {
    return true;
  }

  return false;
}

