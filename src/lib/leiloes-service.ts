import { put, list } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

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

const DAILY_TTL_MS = 24 * 60 * 60 * 1000;

// Cache volátil em memória (Node.js process level)
let inMemorySnapshot: DailySnapshot | null = null;

const STATE_CENTERS: Record<string, [number, number]> = {
  sp: [-23.5505, -46.6333],
  rj: [-22.9068, -43.1729],
  mg: [-19.9167, -43.9345],
  pr: [-25.4284, -49.2733],
  sc: [-27.5954, -48.548],
  rs: [-30.0346, -51.2177],
  ba: [-12.9714, -38.5014],
  df: [-15.7975, -47.8919],
  go: [-16.6869, -49.2648],
};

const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  "alto da mooca": [-23.5614, -46.5924],
  mooca: [-23.5558, -46.5967],
  centro: [-23.5453, -46.636],
  republica: [-23.5432, -46.6426],
  "santa cecilia": [-23.5329, -46.6518],
  bela_vista: [-23.5616, -46.649],
  "bela vista": [-23.5616, -46.649],
  consolacao: [-23.5535, -46.6582],
  pinheiros: [-23.5642, -46.6894],
  "jardim paulista": [-23.5679, -46.6612],
  jardins: [-23.5679, -46.6612],
  "itaim bibi": [-23.5848, -46.6784],
  moema: [-23.5991, -46.6658],
  indianopolis: [-23.6032, -46.6621],
  "vila mariana": [-23.5815, -46.6382],
  "vila olimpia": [-23.5955, -46.6848],
  brooklin: [-23.6122, -46.6895],
  "jardim das acacias": [-23.6215, -46.6951],
  "santo amaro": [-23.6528, -46.7074],
  "campo belo": [-23.6224, -46.6708],
  jabaquara: [-23.6461, -46.6411],
  ipiranga: [-23.5858, -46.6097],
  saude: [-23.6148, -46.6368],
  perdizes: [-23.5368, -46.6741],
  pompeia: [-23.5298, -46.6836],
  lapa: [-23.5236, -46.7022],
  butanta: [-23.5719, -46.7086],
  morumbi: [-23.5972, -46.7201],
  "vila sonia": [-23.5988, -46.7375],
  santana: [-23.5015, -46.6248],
  tucuruvi: [-23.4792, -46.6031],
  tatuape: [-23.5402, -46.5766],
  "vila formosa": [-23.5665, -46.5469],
  penha: [-23.5234, -46.5409],
  itaquera: [-23.5418, -46.4539],
  "vila prudente": [-23.5835, -46.5819],
  interlagos: [-23.6815, -46.6889],
  barra: [-23.0003, -43.3658],
  copacabana: [-22.9698, -43.1869],
  ipanema: [-22.9838, -43.2096],
  botafogo: [-22.9519, -43.1857],
  tijuca: [-22.9248, -43.2325],
  recreio: [-23.0205, -43.4694],
  savassi: [-19.9388, -43.9348],
  lourdes: [-19.9311, -43.9438],
  batel: [-25.4418, -49.2869],
};

const SP_CITIES_COORDS: Record<string, [number, number]> = {
  "sao paulo": [-23.5505, -46.6333],
  campinas: [-22.9099, -47.0626],
  guarulhos: [-23.4542, -46.5333],
  sorocaba: [-23.5015, -47.4526],
  santos: [-23.9608, -46.3336],
  guaruja: [-23.9934, -46.2564],
  "sao vicente": [-23.9632, -46.3919],
  "sao bernardo do campo": [-23.6914, -46.5646],
  "santo andre": [-23.6639, -46.5383],
  osasco: [-23.5329, -46.792],
  "ribeirao preto": [-21.1775, -47.8103],
  "sao jose dos campos": [-23.2237, -45.9009],
  "sao jose do rio preto": [-20.8113, -49.3758],
  piracicaba: [-22.7253, -47.6492],
  jundiai: [-23.1857, -46.8978],
  bauru: [-22.3145, -49.0587],
  marilia: [-22.2139, -49.9458],
  indaiatuba: [-23.0903, -47.2181],
  "rio claro": [-22.4149, -47.5614],
  jaboticabal: [-21.2558, -48.3244],
  taubate: [-23.0205, -45.5564],
  americana: [-22.7374, -47.3333],
  araraquara: [-21.7944, -48.1758],
  franca: [-20.5386, -47.4008],
  barueri: [-23.5105, -46.8761],
  cotia: [-23.6039, -46.919],
  praia_grande: [-24.0058, -46.4028],
  "praia grande": [-24.0058, -46.4028],
  itanhaem: [-24.1831, -46.7889],
  bertioga: [-23.8542, -46.1383],
  assis: [-22.6617, -50.4181],
  "mogi mirim": [-22.4319, -46.9578],
  avare: [-23.0989, -48.9256],
  "aguas de santa barbara": [-22.8814, -49.2414],
  "mogi guacu": [-22.3686, -46.9425],
  salto: [-23.2008, -47.2869],
  itatiba: [-23.0058, -46.8408],
  carapicuiba: [-23.5228, -46.8356],
  aracatuba: [-21.2089, -50.4328],
  itapetininga: [-23.5894, -48.0531],
  aruja: [-23.3967, -46.3203],
  diadema: [-23.6864, -46.6228],
  maua: [-23.6678, -46.4614],
  suzano: [-23.5425, -46.3108],
  limeira: [-22.5647, -47.4017],
  sumare: [-22.8208, -47.2669],
  "sao carlos": [-22.0175, -47.8908],
  jacarei: [-23.3053, -45.9658],
  hortolandia: [-22.8583, -47.2203],
  "presidente prudente": [-22.1256, -51.3889],
  itapevi: [-23.5489, -46.9344],
  mongagua: [-24.0931, -46.6208],
  peruibe: [-24.3208, -46.9983],
  caraguatatuba: [-23.6228, -45.4128],
  ubatuba: [-23.4339, -45.0839],
  atibaia: [-23.1172, -46.5561],
  "braganca paulista": [-22.9525, -46.5419],
  valinhos: [-22.9708, -46.9958],
  vinhedo: [-23.0297, -46.9744],
  paulinia: [-22.7611, -47.1539],
  itu: [-23.2642, -47.2992],
  botucatu: [-22.8858, -48.445],
  catanduva: [-21.1389, -48.9731],
  barretos: [-20.5572, -48.5678],
  jau: [-22.2964, -48.5586],
};

function normalizeStr(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function hashOffset(seed: string): [number, number] {
  let h1 = 0;
  let h2 = 0;
  for (let i = 0; i < seed.length; i++) {
    h1 = (h1 * 31 + seed.charCodeAt(i)) % 1000;
    h2 = (h2 * 17 + seed.charCodeAt(i)) % 1000;
  }
  return [((h1 - 500) / 500) * 0.012, ((h2 - 500) / 500) * 0.012];
}

function resolveCoords(neighborhood: string, city: string, uf: string, code: string): [number, number] {
  const normN = normalizeStr(neighborhood);
  const normC = normalizeStr(city);
  const [dLat, dLng] = hashOffset(code + neighborhood + city);

  for (const [key, coords] of Object.entries(NEIGHBORHOOD_COORDS)) {
    if (normN.includes(key) || key.includes(normN)) {
      return [coords[0] + dLat * 0.4, coords[1] + dLng * 0.4];
    }
  }

  for (const [cKey, coords] of Object.entries(SP_CITIES_COORDS)) {
    if (normC.includes(cKey) || cKey.includes(normC)) {
      return [coords[0] + dLat * 1.5, coords[1] + dLng * 1.5];
    }
  }

  const base = STATE_CENTERS[uf.toLowerCase()] || STATE_CENTERS.sp;
  return [base[0] + dLat * 2.5, base[1] + dLng * 2.5];
}

function parseBRLNumber(raw?: string | null): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d,]/g, "").replace(",", ".");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(str: string): string {
  if (!str) return "";
  const lowers = ["de", "da", "do", "das", "dos", "em", "e", "para", "com"];
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && lowers.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export async function scrapeMegaLeiloes(uf: string): Promise<ScrapedAuctionLot[]> {
  const targetUrl = `https://www.megaleiloes.com.br/imoveis/${uf.toLowerCase()}`;

  const res = await fetch(targetUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    next: { revalidate: 600 },
  });

  if (!res.ok) return [];
  const html = await res.text();
  const blocks = html.split('<div class="card open">').slice(1);
  const results: ScrapedAuctionLot[] = [];

  for (const b of blocks.slice(0, 28)) {
    const urlMatch = b.match(/class="card-title"\s+href="([^"]+)"/);
    const titleMatch = b.match(/class="card-title"[^>]*>([\s\S]*?)<\/a>/);
    const codeMatch = b.match(/class="card-number[^"]*">([^<]+)</);
    const imgMatch =
      b.match(/data-bg="([^"]+)"/) ||
      b.match(/data-src="([^"]+)"/) ||
      b.match(/<img[^>]+src="([^"]+)"/i) ||
      b.match(/class="card-image"[^>]*src="([^"]+)"/i);
    const priceMatch = b.match(/class="card-price">([^<]+)</);
    const downMatch = b.match(/class="card-down"[\s\S]*?<span class="value">(\d+)%<\/span>/);
    const firstValMatch = b.match(/instance first[\s\S]*?card-instance-value">([^<]+)</);
    const secondDateMatch =
      b.match(/card-second-instance-date">[\s\S]*?<\/b>\s*([^<]+)</) ||
      b.match(/card-first-instance-date">[\s\S]*?<\/b>\s*([^<]+)</);
    const localityMatch = b.match(/class="card-locality"[^>]*>([^<]+)</);
    const instanceTypeMatch = b.match(/class="card-instance-title"><a[^>]*>([^<]+)</);

    const rawTitle = stripTags(titleMatch?.[1] || "");
    const code = codeMatch?.[1]?.trim() || `ML-${results.length + 1}`;
    const sourceUrl = (urlMatch?.[1] || "").split("?")[0];
    if (!rawTitle || !sourceUrl) continue;

    const minBid = parseBRLNumber(priceMatch?.[1]);
    if (minBid <= 0) continue;

    const firstVal = parseBRLNumber(firstValMatch?.[1]);
    const discountPct = downMatch
      ? parseInt(downMatch[1], 10)
      : firstVal > minBid && firstVal > 0
      ? Math.round((1 - minBid / firstVal) * 100)
      : 0;
    const marketValue =
      firstVal > minBid
        ? firstVal
        : discountPct > 0
        ? Math.round(minBid / (1 - discountPct / 100))
        : Math.round(minBid * 1.35);

    const titleParts = rawTitle.split(" - ").map((s) => s.trim());
    const mainTitle = titleParts[0] || rawTitle;
    const rawNeighborhood = titleParts.length >= 3 ? titleParts[1] : "Centro";
    const localityRaw = localityMatch?.[1]?.trim() || "São Paulo, SP";
    const [cityPart, statePart] = localityRaw.split(",").map((s) => s.trim());

    const formattedCity = toTitleCase(cityPart || "São Paulo");
    const formattedNeighborhood = toTitleCase(rawNeighborhood);

    const areaMatch = rawTitle.match(/(\d+(?:[.,]\d+)?)\s*m²/i);
    const areaM2 = areaMatch ? Math.round(parseFloat(areaMatch[1].replace(",", "."))) : null;

    const isJudicial =
      (instanceTypeMatch?.[1] || "").toLowerCase().includes("judicial") ||
      code.startsWith("J");
    const hasDireitos = rawTitle.toLowerCase().includes("direitos");

    const riskLevel: "baixo" | "medio" | "alto" = hasDireitos
      ? "medio"
      : !isJudicial
      ? "baixo"
      : discountPct >= 45
      ? "medio"
      : "baixo";
    const riskScore = riskLevel === "baixo" ? 89 : riskLevel === "medio" ? 76 : 64;

    const [lat, lng] = resolveCoords(
      formattedNeighborhood,
      formattedCity,
      statePart || uf.toUpperCase(),
      code
    );

    results.push({
      id: `ml-${code}`,
      code,
      source: "Mega Leilões",
      sourceUrl,
      imageUrl: imgMatch?.[1] || "",
      title: `${mainTitle} · ${formattedNeighborhood} (${formattedCity})`,
      address: `${formattedNeighborhood} · ${formattedCity}/${statePart || uf.toUpperCase()}`,
      neighborhood: formattedNeighborhood,
      city: formattedCity,
      state: statePart || uf.toUpperCase(),
      lat,
      lng,
      marketValue,
      minBid,
      discountPct,
      modality: isJudicial ? "Leilão Judicial" : "Extrajudicial",
      seller: isJudicial ? "Tribunal de Justiça" : "Comitente Bancário",
      auctionDate: secondDateMatch?.[1]?.trim() || "Em aberto",
      areaM2,
      acceptsFinancing: !isJudicial,
      occupancy: "Ver no Edital",
      riskLevel,
      riskScore,
      aiSummary: `Lote ${code} capturado em tempo real no Mega Leilões (${
        isJudicial ? "Leilão Judicial" : "Extrajudicial"
      }).`,
      aiChecklist: {
        debts: isJudicial
          ? "Em leilões judiciais, o IPTU geralmente sub-roga no preço (Art. 130 CTN); débitos de condomínio devem ser checados no edital."
          : "Regras de quitação de IPTU e condomínio definidas pelo banco comitente no edital.",
        matriculaStatus: hasDireitos
          ? "Leilão de Direitos Aquisitivos: requer verificação de eventual saldo fiduciário remanescente na matrícula."
          : "Propriedade plena listada no lote; clique para ler os detalhes da matrícula no edital.",
        paymentRule: isJudicial
          ? "À vista ou parcelamento judicial (25% de entrada + até 30x pelo Art. 895 do CPC)."
          : "Permite análise de financiamento imobiliário ou recursos próprios via finHouse.",
        lawyerAlert:
          "Indispensável diligência jurídica nos autos e conferência da posse antes da oferta do lance.",
      },
      documentsRead: [{ label: "Página Oficial e Edital (Mega Leilões)", url: sourceUrl }],
    });
  }

  return results;
}

export async function scrapePortalZuk(uf: string): Promise<ScrapedAuctionLot[]> {
  const targetUrl = `https://www.portalzuk.com.br/leilao-de-imoveis/u/todos-imoveis/${uf.toLowerCase()}`;

  const res = await fetch(targetUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    next: { revalidate: 600 },
  });

  if (!res.ok) return [];
  const html = await res.text();
  const blocks = html.split('class="card-property card_lotes_div"').slice(1);
  const results: ScrapedAuctionLot[] = [];

  for (const b of blocks.slice(0, 28)) {
    const cutIdx = b.indexOf("<script");
    const safeB = cutIdx > -1 ? b.slice(0, cutIdx) : b;

    const urlMatch = safeB.match(
      /href="(https:\/\/www\.portalzuk\.com\.br\/imovel\/[^"]+)"/
    );
    const titleAttrMatch = safeB.match(/title="([^"]+)"/);
    const imgMatch =
      safeB.match(/<img[^>]+src="(https:\/\/imagens\.portalzuk\.com\.br\/[^"]+)"/i) ||
      safeB.match(/data-src="(https:\/\/imagens\.portalzuk\.com\.br\/[^"]+)"/i) ||
      safeB.match(/data-original="(https:\/\/imagens\.portalzuk\.com\.br\/[^"]+)"/i) ||
      safeB.match(/src="(https:\/\/imagens\.portalzuk\.com\.br\/[^"]+)"/i);
    const typeMatch = safeB.match(/card-property-price-lote">([^<]+)</);
    const addrBlock = safeB.match(
      /<address class="card-property-address">([\s\S]*?)<\/address>/
    );
    const areaMatch = safeB.match(/card-property-info-label">([\d.,]+)m²/i);
    const priceBlocks = [
      ...safeB.matchAll(
        /card-property-price-value">R\$\s*(?:<span[^>]*>)?([\d.,]+)/g
      ),
    ];
    const dateBlocks = [...safeB.matchAll(/card-property-price-data">([^<]+)</g)];

    const sourceUrl = urlMatch?.[1];
    if (!sourceUrl) continue;

    const p1 = parseBRLNumber(priceBlocks[0]?.[1]);
    const p2 = parseBRLNumber(priceBlocks[1]?.[1]);
    const minBid = p2 > 0 ? p2 : p1;
    if (minBid <= 0) continue;

    const marketValue = p2 > 0 && p1 > p2 ? p1 : minBid;
    const discountPct =
      marketValue > minBid ? Math.round((1 - minBid / marketValue) * 100) : 0;

    const urlPath = sourceUrl.replace("https://www.portalzuk.com.br/imovel/", "");
    const urlParts = urlPath.split("/");
    const slugState = (urlParts[0] || uf).toUpperCase();
    const slugCity = (urlParts[1] || "sao-paulo").replace(/-/g, " ");
    const slugNeighborhood = (urlParts[2] || "centro").replace(/-/g, " ");
    const lastPart = urlParts[urlParts.length - 1] || "";

    const rawAttr = stripTags(titleAttrMatch?.[1] || "");
    const [leftPart, codePart] = rawAttr.split("|").map((s) => s.trim());
    const code = codePart || `ZUK-${results.length + 1}`;
    const uniqueId = `zuk-${lastPart || code || results.length + 1}`;
    const dashParts = (leftPart || "").split(" - ").map((s) => s.trim());
    const seller = dashParts[dashParts.length - 1] || "Instituição Financeira";
    const street = dashParts[1] || "";

    let parsedCity = slugCity;
    let parsedNeighborhood = slugNeighborhood;

    const addrClean = stripTags(addrBlock?.[1] || "");
    const dashMatch = addrClean.match(/^([^/]+)\s*\/\s*SP\s*-\s*([^\n\r]+?)(?:\s+(?:Rua|Av|Avenida|Alameda|Travessa|Praça|Rodovia|Estrada|Lote|Condomínio)|$)/i);
    if (dashMatch) {
      if (dashMatch[1]?.trim()) parsedCity = dashMatch[1].trim();
      if (dashMatch[2]?.trim()) parsedNeighborhood = dashMatch[2].trim();
    }

    const formattedCity = toTitleCase(parsedCity);
    const formattedNeighborhood = toTitleCase(parsedNeighborhood);

    let fullAddress = "";
    if (street && (/\d/.test(street) || /^(rua|av|avenida|al|alameda|praça|praca|travessa|rod|rodovia|estrada)/i.test(street))) {
      fullAddress = `${street} — ${formattedNeighborhood}, ${formattedCity}/${slugState}`;
    } else if (addrClean) {
      fullAddress = addrClean;
    } else {
      fullAddress = `${formattedNeighborhood} · ${formattedCity}/${slugState}`;
    }

    const propType = typeMatch?.[1]?.trim() || "Imóvel";
    const areaM2 = areaMatch
      ? Math.round(parseFloat(areaMatch[1].replace(".", "").replace(",", ".")))
      : null;

    const isJudicial =
      seller.toLowerCase().includes("tribunal") ||
      seller.toLowerCase().includes("justiça") ||
      seller.toLowerCase().includes("vara");

    const riskLevel: "baixo" | "medio" | "alto" = !isJudicial
      ? "baixo"
      : discountPct >= 45
      ? "medio"
      : "baixo";
    const riskScore = !isJudicial ? 91 : 78;

    const [lat, lng] = resolveCoords(formattedNeighborhood, formattedCity, slugState, code);

    results.push({
      id: uniqueId,
      code,
      source: "Portal Zuk",
      sourceUrl,
      imageUrl: imgMatch?.[1] || "",
      title: `${propType}${areaM2 ? ` ${areaM2}m²` : ""} · ${formattedNeighborhood} (${formattedCity})`,
      address: fullAddress,
      neighborhood: formattedNeighborhood,
      city: formattedCity,
      state: slugState,
      lat,
      lng,
      marketValue,
      minBid,
      discountPct,
      modality: isJudicial ? "Leilão Judicial" : `Extrajudicial · ${seller}`,
      seller,
      auctionDate: dateBlocks[dateBlocks.length - 1]?.[1]?.trim() || "Em aberto",
      areaM2,
      acceptsFinancing: !isJudicial,
      occupancy: "Ver no Edital",
      riskLevel,
      riskScore,
      aiSummary: `Imóvel ofertado via Portal Zuk (${seller}). ${
        discountPct > 0
          ? `Desconto de ${discountPct}% sobre a 1ª praça.`
          : "Leilão em praça única."
      } Selecione para ver análise completa com IA.`,
      aiChecklist: {
        debts: !isJudicial
          ? `Leilão bancário (${seller}): verificar no edital se débitos condominiais/IPTU até a data da venda são quitados pelo banco vendedor.`
          : "Leilão Judicial: IPTU sub-roga no valor da arrematação (Art. 130 CTN).",
        matriculaStatus: "Matrícula e certidões disponíveis na página do leiloeiro.",
        paymentRule: !isJudicial
          ? "Consulte condições de à vista, parcelamento ou financiamento com o banco comitente / FinHouse."
          : "À vista ou parcelamento judicial nos termos do edital.",
        lawyerAlert:
          "Requer validação da situação ocupacional e leitura integral das observações do edital antes do lance.",
      },
      documentsRead: [{ label: "Edital e Ficha Oficial (Portal Zuk)", url: sourceUrl }],
    });
  }

  return results;
}

/**
 * Raspa Superbid Exchange & Sold Leilões (Estado de SP — Apenas Imóveis)
 */
export async function scrapeSuperbidAndSold(uf = "sp"): Promise<ScrapedAuctionLot[]> {
  if (uf.toLowerCase() !== "sp") return [];

  const targetUrl =
    "https://offer-query.superbid.net/offers/?portalId=[2,15]&filter=product.productType.description:imoveis;product.location.state:S%C3%A3o%20Paulo&orderBy=id:desc&pageNumber=1&pageSize=45";

  try {
    const res = await fetch(targetUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      next: { revalidate: 600 },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const offers = Array.isArray(data?.offers) ? data.offers : [];
    const results: ScrapedAuctionLot[] = [];

    for (const o of offers) {
      const minBid = typeof o.price === "number" ? Math.round(o.price) : 0;
      if (minBid < 25000) continue;

      const shortDesc = stripTags(o.product?.shortDesc || "");
      const detailedDesc = stripTags(o.product?.detailedDescription || "");
      const sellerName = stripTags(o.seller?.name || o.store?.name || "Comitente Superbid");
      const storeName = (o.store?.name || "").toUpperCase();

      if (
        !shortDesc ||
        shortDesc.toLowerCase().includes("teste") ||
        sellerName.toLowerCase().includes("demo")
      ) {
        continue;
      }

      // Garante estritamente Estado de SP
      const rawCityState = o.product?.location?.city || "São Paulo - SP";
      const rawState = (o.product?.location?.state || "SP").toLowerCase();
      if (
        !rawState.includes("paulo") &&
        rawState !== "sp" &&
        !rawCityState.toUpperCase().includes("SP")
      ) {
        continue;
      }

      const cityClean = toTitleCase(
        rawCityState.replace(/\s*[-/]\s*SP$/i, "").trim() || "São Paulo"
      );

      // Tenta extrair bairro da descrição curta (ex: "Apartamento - Vila Matilde - São Paulo/SP")
      const descParts = shortDesc
        .replace(/\.\s*$/, "")
        .split(/\s+-\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      let neighborhood = "Centro";
      if (descParts.length >= 3) {
        neighborhood = toTitleCase(descParts[descParts.length - 2].replace(/\/SP$/i, ""));
      } else if (descParts.length === 2) {
        neighborhood = toTitleCase(descParts[1].replace(/\/SP$/i, ""));
      }

      // Extrai área m² da descrição
      const combinedText = `${shortDesc} ${detailedDesc}`;
      const areaMatch = combinedText.match(/(\d+(?:[.,]\d+)?)\s*m[²2]/i);
      const areaM2 = areaMatch
        ? Math.round(parseFloat(areaMatch[1].replace(".", "").replace(",", ".")))
        : null;

      // Extrai desconto explícito se houver "(XX% abaixo da avaliação)"
      const discMatch = combinedText.match(/(\d{1,2})\s*%\s*abaixo/i);
      const discountPct = discMatch ? parseInt(discMatch[1], 10) : 25;
      const marketValue =
        discountPct > 0 && discountPct < 85
          ? Math.round(minBid / (1 - discountPct / 100))
          : Math.round(minBid * 1.33);

      // Define a fonte exata (Sold Leilões, Superbid, Caixa ou Banco do Brasil)
      const sellerLower = sellerName.toLowerCase();
      let source: ScrapedAuctionLot["source"] = storeName.includes("SOLD")
        ? "Sold Leilões"
        : "Superbid";
      if (sellerLower.includes("caixa") || sellerLower.includes("cef")) {
        source = "Caixa";
      } else if (sellerLower.includes("banco do brasil")) {
        source = "Banco do Brasil";
      }

      const code = `SB-${o.id}`;
      const geoLat = o.product?.location?.locationGeo?.lat;
      const geoLon = o.product?.location?.locationGeo?.lon;
      const [fallbackLat, fallbackLng] = resolveCoords(neighborhood, cityClean, "SP", code);
      const lat =
        typeof geoLat === "number" && Number.isFinite(geoLat) && geoLat < -19 && geoLat > -26
          ? geoLat
          : fallbackLat;
      const lng =
        typeof geoLon === "number" && Number.isFinite(geoLon) && geoLon < -44 && geoLon > -54
          ? geoLon
          : fallbackLng;

      const isJudicial =
        sellerLower.includes("tribunal") ||
        sellerLower.includes("justiça") ||
        storeName.includes("JUDICIAL");

      // Formata data de encerramento (ex: "2026-12-10 11:30:30" -> "10/12/2026 às 11:30")
      let auctionDate = "Em aberto";
      if (typeof o.endDate === "string" && o.endDate.includes("-")) {
        const [dPart, tPart] = o.endDate.split(" ");
        const [yyyy, mm, dd] = (dPart || "").split("-");
        if (yyyy && mm && dd) {
          auctionDate = `${dd}/${mm}/${yyyy}${tPart ? ` às ${tPart.slice(0, 5)}` : ""}`;
        }
      }

      const sourceUrl = `https://www.superbid.net/oferta/${o.id}`;
      const matMatch = detailedDesc.match(/matr[íi]cula\s*:?\s*([\d.]+)/i);

      results.push({
        id: `sb-${o.id}`,
        code,
        source,
        sourceUrl,
        imageUrl: o.product?.thumbnailUrl || "",
        title: shortDesc.length > 95 ? `${shortDesc.slice(0, 92)}...` : shortDesc,
        address: `${neighborhood} · ${cityClean}/SP`,
        neighborhood,
        city: cityClean,
        state: "SP",
        lat,
        lng,
        marketValue,
        minBid,
        discountPct,
        modality: isJudicial ? "Leilão Judicial" : `Extrajudicial · ${sellerName}`,
        seller: sellerName,
        auctionDate,
        areaM2: areaM2 && areaM2 > 10 && areaM2 < 10000 ? areaM2 : null,
        acceptsFinancing: !isJudicial,
        occupancy: combinedText.toLowerCase().includes("desocupad") ? "Desocupado" : "Ocupado",
        riskLevel: !isJudicial ? "baixo" : "medio",
        riskScore: !isJudicial ? 90 : 79,
        aiSummary:
          detailedDesc.slice(0, 380) ||
          `Imóvel em leilão via ${source} (${sellerName}) localizado em ${cityClean}/SP.`,
        aiChecklist: {
          debts: !isJudicial
            ? `Leilão corporativo/bancário (${sellerName}): verificar regra de quitação de IPTU e condomínio no edital.`
            : "Leilão Judicial: IPTU sub-roga no preço da arrematação (Art. 130 CTN).",
          matriculaStatus: matMatch
            ? `Matrícula nº ${matMatch[1]} identificada na descrição oficial do lote.`
            : "Matrícula e certidões disponíveis no edital oficial da oferta.",
          paymentRule: !isJudicial
            ? "À vista, parcelamento conforme edital ou análise de financiamento via finHouse."
            : "À vista ou parcelamento judicial (Art. 895 CPC).",
          lawyerAlert:
            "Conferir condições de venda do comitente e situação ocupacional antes do lance.",
        },
        documentsRead: [{ label: `Oferta e Edital Oficial (${source})`, url: sourceUrl }],
      });
    }

    return results;
  } catch (err) {
    console.warn("[Scraper] Aviso ao raspar Superbid/Sold:", err);
    return [];
  }
}

/**
 * Raspa Sodré Santoro (Estado de SP — Apenas Imóveis)
 */
export async function scrapeSodreSantoro(uf = "sp"): Promise<ScrapedAuctionLot[]> {
  if (uf.toLowerCase() !== "sp") return [];

  try {
    const pageRes = await fetch("https://www.sodresantoro.com.br/imoveis/lotes", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      next: { revalidate: 600 },
    });

    const getSetCookie = (pageRes.headers as any).getSetCookie;
    const cookies =
      typeof getSetCookie === "function"
        ? getSetCookie
            .call(pageRes.headers)
            .map((c: string) => c.split(";")[0])
            .join("; ")
        : pageRes.headers.get("set-cookie") || "";

    const searchRes = await fetch("https://www.sodresantoro.com.br/api/search-lots", {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
        Cookie: cookies,
        Origin: "https://www.sodresantoro.com.br",
        Referer: "https://www.sodresantoro.com.br/imoveis/lotes",
      },
      body: JSON.stringify({
        page: 1,
        perPage: 30,
        query: {
          bool: {
            filter: [{ term: { segment_base: "imoveis" } }],
          },
        },
      }),
    });

    if (!searchRes.ok) return [];
    const data = await searchRes.json();
    const items = Array.isArray(data?.results) ? data.results : [];
    const results: ScrapedAuctionLot[] = [];

    for (const item of items) {
      const st = (item.lot_state || "").toLowerCase();
      const loc = (item.lot_location || "").toLowerCase();
      if (!st.includes("paulo") && st !== "sp" && !loc.includes("/ sp")) {
        continue;
      }

      const bidInitial = parseFloat(item.bid_initial || item.bid_actual || "0");
      const secondPracaVal = parseFloat(item.tj_praca_value || "0");
      const minBid =
        secondPracaVal > 0 && secondPracaVal < bidInitial
          ? Math.round(secondPracaVal)
          : Math.round(bidInitial);
      if (!minBid || minBid < 20000) continue;

      const discountPct = item.tj_praca_discount
        ? parseInt(String(item.tj_praca_discount), 10)
        : secondPracaVal > 0 && bidInitial > secondPracaVal
        ? Math.round((1 - secondPracaVal / bidInitial) * 100)
        : 0;
      const marketValue =
        bidInitial > minBid ? Math.round(bidInitial) : Math.round(minBid * 1.35);

      const city = toTitleCase(item.lot_city || "São Paulo");
      const neighborhood = toTitleCase(item.lot_neighborhood || "Centro");
      const street = item.lot_street ? toTitleCase(item.lot_street) : "";
      const code = `SS-${item.lot_id || item.id}`;

      let lat = 0;
      let lng = 0;
      if (typeof item.lot_coordinates === "string" && item.lot_coordinates.includes(",")) {
        const [cLat, cLng] = item.lot_coordinates.split(",").map((s: string) => parseFloat(s.trim()));
        if (Number.isFinite(cLat) && Number.isFinite(cLng)) {
          lat = cLat;
          lng = cLng;
        }
      }
      if (!lat || !lng) {
        [lat, lng] = resolveCoords(neighborhood, city, "SP", code);
      }

      const desc = stripTags(item.lot_description || "");
      const areaMatch = desc.match(/(\d+(?:[.,]\d+)?)\s*m²/i);
      const areaM2 = areaMatch
        ? Math.round(parseFloat(areaMatch[1].replace(".", "").replace(",", ".")))
        : null;
      const matMatch = desc.match(/matr[íi]cula\s*n?[º°]?\s*([\d.]+[^,.;\n]{0,40})/i);

      const rawDate = item.lot_date_end || item.auction_date_2 || item.auction_date_end || "";
      let auctionDate = "Em aberto";
      if (typeof rawDate === "string" && rawDate.includes("-")) {
        const [dPart, tPart] = rawDate.split(" ");
        const [yyyy, mm, dd] = (dPart || "").split("-");
        if (yyyy && mm && dd) {
          auctionDate = `${dd}/${mm}/${yyyy}${tPart ? ` às ${tPart.slice(0, 5)}` : ""}`;
        }
      }

      const isJudicial = Boolean(item.lot_is_judicial);
      const seller = toTitleCase(item.client_name || "Sodré Santoro");
      const sourceUrl = `https://leilao.sodresantoro.com.br/leilao/${item.auction_id}/lote/${item.lot_id}/`;
      const imageUrl =
        Array.isArray(item.lot_pictures) && item.lot_pictures[0] ? item.lot_pictures[0] : "";

      results.push({
        id: `ss-${item.lot_id || item.id}`,
        code,
        source: "Sodré Santoro",
        sourceUrl,
        imageUrl,
        title: `${toTitleCase(item.lot_category || "Imóvel")}${areaM2 ? ` ${areaM2}m²` : ""} · ${neighborhood} (${city})`,
        address: street ? `${street} — ${neighborhood}, ${city}/SP` : `${neighborhood} · ${city}/SP`,
        neighborhood,
        city,
        state: "SP",
        lat,
        lng,
        marketValue,
        minBid,
        discountPct,
        modality: isJudicial ? "Leilão Judicial" : `Extrajudicial · ${seller}`,
        seller,
        auctionDate,
        areaM2,
        acceptsFinancing: !isJudicial,
        occupancy:
          (item.lot_occupied || "").toLowerCase().includes("desocupad")
            ? "Desocupado"
            : "Ocupado",
        riskLevel: !isJudicial ? "baixo" : "medio",
        riskScore: !isJudicial ? 90 : 80,
        aiSummary: desc.slice(0, 420) || `Lote oficial Sodré Santoro em ${city}/SP.`,
        aiChecklist: {
          debts: isJudicial
            ? "Leilão Judicial Sodré Santoro: IPTU sub-roga no preço da arrematação (Art. 130 CTN)."
            : "Verificar regras do comitente vendedor no edital para IPTU e condomínio.",
          matriculaStatus: matMatch
            ? `Extraído da descrição: Matrícula ${matMatch[1].trim()}.`
            : "Matrícula e edital disponíveis na página oficial do lote.",
          paymentRule: isJudicial
            ? "À vista ou parcelamento judicial conforme Art. 895 do CPC."
            : "À vista ou financiamento conforme condições de venda.",
          lawyerAlert: item.lot_judicial_process
            ? `Processo Judicial nº ${item.lot_judicial_process} (${toTitleCase(item.lot_judicial_court || "TJSP")}): recomendada revisão dos autos antes do lance.`
            : "Recomendada conferência das condições de venda e posse antes do lance.",
        },
        documentsRead: [{ label: "Edital e Ficha Oficial (Sodré Santoro)", url: sourceUrl }],
      });
    }

    return results;
  } catch (err) {
    console.warn("[Scraper] Aviso ao raspar Sodré Santoro:", err);
    return [];
  }
}

/**
 * Raspa Seu Imóvel BB — Banco do Brasil (Estado de SP — Apenas Imóveis)
 */
export async function scrapeBancoDoBrasil(uf = "sp"): Promise<ScrapedAuctionLot[]> {
  if (uf.toLowerCase() !== "sp") return [];

  try {
    const bbPage = await fetch("https://seuimovelbb.com.br/catalogo/imoveis?uf=SP", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      next: { revalidate: 600 },
    });

    if (!bbPage.ok) return [];
    const getSetCookie = (bbPage.headers as any).getSetCookie;
    const cookies =
      typeof getSetCookie === "function"
        ? getSetCookie
            .call(bbPage.headers)
            .map((c: string) => c.split(";")[0])
            .join("; ")
        : bbPage.headers.get("set-cookie") || "";

    const bbHtml = await bbPage.text();
    const cppnp = bbHtml.match(/id="_cppnp"[^>]*>([^<]+)</)?.[1] || "";
    if (!cppnp) return [];

    const form = new URLSearchParams({
      pagina: "1",
      categorias: "",
      tipoVenda: "",
      tipoPagamento: "",
      evolua: "",
      localidade: "SP||",
      minimo: "",
      maximo: "",
      texto: "",
      ordem: "0",
      contento: "0",
      cppnp,
    });

    const bbPost = await fetch("https://seuimovelbb.com.br/catalogo", {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        Referer: "https://seuimovelbb.com.br/catalogo/imoveis?uf=SP",
        Origin: "https://seuimovelbb.com.br",
        Cookie: cookies,
      },
      body: form.toString(),
    });

    if (!bbPost.ok) return [];
    const bbJson = await bbPost.json();
    const cards = (bbJson?.lista || "").split('<div class="card carta">').slice(1);
    const results: ScrapedAuctionLot[] = [];

    for (const c of cards.slice(0, 28)) {
      const hrefMatch = c.match(/href="(\/imovel\/id\/(\d+))"/);
      const imgMatch = c.match(/src="(\/imagem\/imovel\/[^"]+)"/);
      const tipoMatch = c.match(/<div class="tipo">[\s\S]*?<\/i>\s*([^<]+)</);
      const valorMatch = c.match(/<div class="valor">\s*(R\$\s*[\d.,]+)/i);
      const avalMatch = c.match(/<div class="avaliacao">\s*(?:Avalia[çc][ãa]o:?\s*)?(R\$\s*[\d.,]+)/i);
      const locMatch = c.match(/<div class="localidade">[\s\S]*?<\/i>\s*([^<]+)</);
      const shareMatch = c.match(/_compartilhar\('([\s\S]*?)',\s*'([^']+)'\)/);

      if (!hrefMatch || !valorMatch) continue;
      const bbId = hrefMatch[2];
      const minBid = parseBRLNumber(valorMatch[1]);
      if (minBid < 20000) continue;

      const evalVal = parseBRLNumber(avalMatch?.[1]);
      const marketValue = evalVal > minBid ? evalVal : Math.round(minBid * 1.38);
      const discountPct =
        marketValue > minBid ? Math.round((1 - minBid / marketValue) * 100) : 28;

      const rawLoc = (locMatch?.[1] || "São Paulo - SP").trim();
      const city = toTitleCase(rawLoc.replace(/\s*-\s*SP$/i, "").trim() || "São Paulo");
      const propType = toTitleCase((tipoMatch?.[1] || "Imóvel").trim());

      const shareDesc = stripTags((shareMatch?.[1] || "").replace(/\s+/g, " "));
      const areaMatch = shareDesc.match(/(\d+(?:[.,]\d+)?)\s*m²/i);
      const areaM2 = areaMatch
        ? Math.round(parseFloat(areaMatch[1].replace(".", "").replace(",", ".")))
        : null;

      // Tenta extrair bairro da descrição legal se houver ("Bairro X", "Jardim X", "Vila X")
      const bairroMatch = shareDesc.match(
        /\b((?:Jardim|Vila|Parque|Residencial|Centro|Bairro)\s+[A-Za-zÀ-ÿ\s]{2,22}?)(?:[,.]|em\s|\s-\s|$)/i
      );
      const neighborhood = bairroMatch ? toTitleCase(bairroMatch[1].trim()) : "Centro";

      const code = `BB-${bbId}`;
      const [lat, lng] = resolveCoords(neighborhood, city, "SP", code);
      const sourceUrl = `https://seuimovelbb.com.br${hrefMatch[1]}`;
      const imageUrl = imgMatch?.[1] ? `https://seuimovelbb.com.br${imgMatch[1]}` : "";

      results.push({
        id: `bb-${bbId}`,
        code,
        source: "Banco do Brasil",
        sourceUrl,
        imageUrl,
        title: `${propType}${areaM2 ? ` ${areaM2}m²` : ""} · ${neighborhood} (${city})`,
        address: `${neighborhood} · ${city}/SP`,
        neighborhood,
        city,
        state: "SP",
        lat,
        lng,
        marketValue,
        minBid,
        discountPct,
        modality: "Venda Direta / Leilão · Banco do Brasil",
        seller: "Banco do Brasil S.A.",
        auctionDate: "Proposta Imediata",
        areaM2,
        acceptsFinancing: true,
        occupancy: "Ver no Edital",
        riskLevel: "baixo",
        riskScore: 92,
        aiSummary:
          shareDesc ||
          `Imóvel retomado do Banco do Brasil S.A. em ${city}/SP com venda direta/leilão.`,
        aiChecklist: {
          debts:
            "Imóvel patrimonial do Banco do Brasil (Seu Imóvel BB): regra geral com quitação de débitos anteriores até a data da venda conforme edital.",
          matriculaStatus:
            "Propriedade consolidada em nome do Banco do Brasil S.A.",
          paymentRule:
            "Aceita proposta à vista ou financiamento imobiliário elegível conforme regras do BB / finHouse.",
          lawyerAlert:
            "Conferir situação ocupacional e termos da proposta na ficha oficial do Seu Imóvel BB.",
        },
        documentsRead: [{ label: "Ficha Oficial (Seu Imóvel BB)", url: sourceUrl }],
      });
    }

    return results;
  } catch (err) {
    console.warn("[Scraper] Aviso ao raspar Banco do Brasil:", err);
    return [];
  }
}

/**
 * Executa a raspagem unificada de todas as fontes em SP (apenas Imóveis) com deduplicação
 */
export async function runDailyScrape(uf = "sp"): Promise<ScrapedAuctionLot[]> {
  const [megaLots, zukLots, sbSoldLots, sodreLots, bbLots] = await Promise.allSettled([
    scrapeMegaLeiloes(uf),
    scrapePortalZuk(uf),
    scrapeSuperbidAndSold(uf),
    scrapeSodreSantoro(uf),
    scrapeBancoDoBrasil(uf),
  ]);

  const rawCombined: ScrapedAuctionLot[] = [
    ...(zukLots.status === "fulfilled" ? zukLots.value : []),
    ...(megaLots.status === "fulfilled" ? megaLots.value : []),
    ...(sbSoldLots.status === "fulfilled" ? sbSoldLots.value : []),
    ...(sodreLots.status === "fulfilled" ? sodreLots.value : []),
    ...(bbLots.status === "fulfilled" ? bbLots.value : []),
  ];

  const seenIds = new Set<string>();
  const combined: ScrapedAuctionLot[] = [];
  for (const lot of rawCombined) {
    if (!seenIds.has(lot.id)) {
      seenIds.add(lot.id);
      combined.push(lot);
    }
  }

  combined.sort((a, b) => b.discountPct - a.discountPct);
  return combined;
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".next", "cache", "leiloes");
const SNAPSHOT_VERSION = "v2";

/**
 * Salva o Snapshot no Vercel Blob (se disponível), em arquivo local e em memória
 */
export async function saveDailySnapshot(
  uf: string,
  lots: ScrapedAuctionLot[]
): Promise<DailySnapshot> {
  const now = Date.now();
  const snapshot: DailySnapshot = {
    timestamp: now,
    updatedAt: new Date(now).toLocaleDateString("pt-BR"),
    count: lots.length,
    uf: uf.toUpperCase(),
    lots,
  };

  // 1. Atualiza memória RAM
  inMemorySnapshot = snapshot;

  const blobKey = `leiloes/${uf.toLowerCase()}_${SNAPSHOT_VERSION}_latest.json`;
  const localFileName = `${uf.toLowerCase()}_${SNAPSHOT_VERSION}_latest.json`;

  // 2. Tenta salvar no Vercel Blob se o token estiver configurado
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await put(blobKey, JSON.stringify(snapshot), {
        access: "public",
        addRandomSuffix: false,
      });
      console.log(`[Storage] Snapshot salvo com sucesso no Vercel Blob (${lots.length} lotes).`);
    } catch (err) {
      console.warn("[Storage] Aviso ao gravar no Vercel Blob:", err);
    }
  }

  // 3. Salva em disco local como garantia/fallback
  try {
    await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
    const filePath = path.join(LOCAL_STORAGE_DIR, localFileName);
    await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), "utf-8");
  } catch (err) {
    // Em serverless puro somente /tmp é gravável
    try {
      const tmpPath = path.join("/tmp", `leiloes_${localFileName}`);
      await fs.writeFile(tmpPath, JSON.stringify(snapshot), "utf-8");
    } catch {}
  }

  return snapshot;
}

/**
 * Carrega o snapshot diário pré-processado (sem raspar portais externos)
 */
export async function loadDailySnapshot(uf = "sp"): Promise<DailySnapshot | null> {
  const now = Date.now();
  const blobKey = `leiloes/${uf.toLowerCase()}_${SNAPSHOT_VERSION}_latest.json`;
  const localFileName = `${uf.toLowerCase()}_${SNAPSHOT_VERSION}_latest.json`;

  // 1. Tenta carregar da memória RAM
  if (inMemorySnapshot && now - inMemorySnapshot.timestamp < DAILY_TTL_MS) {
    return inMemorySnapshot;
  }

  // 2. Tenta ler do Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({ prefix: blobKey });
      if (blobs.length > 0 && blobs[0].downloadUrl) {
        const res = await fetch(blobs[0].downloadUrl, { cache: "no-store" });
        if (res.ok) {
          const data: DailySnapshot = await res.json();
          if (data && now - data.timestamp < DAILY_TTL_MS) {
            inMemorySnapshot = data;
            return data;
          }
        }
      }
    } catch (err) {
      console.warn("[Storage] Aviso ao carregar do Vercel Blob:", err);
    }
  }

  // 3. Tenta carregar do disco local
  try {
    const filePath = path.join(LOCAL_STORAGE_DIR, localFileName);
    const fileContent = await fs.readFile(filePath, "utf-8");
    const data: DailySnapshot = JSON.parse(fileContent);
    if (data && now - data.timestamp < DAILY_TTL_MS) {
      inMemorySnapshot = data;
      return data;
    }
  } catch {}

  // 4. Tenta carregar do /tmp
  try {
    const tmpPath = path.join("/tmp", `leiloes_${localFileName}`);
    const fileContent = await fs.readFile(tmpPath, "utf-8");
    const data: DailySnapshot = JSON.parse(fileContent);
    if (data && now - data.timestamp < DAILY_TTL_MS) {
      inMemorySnapshot = data;
      return data;
    }
  } catch {}

  return null;
}

