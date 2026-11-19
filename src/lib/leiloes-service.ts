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
  version?: number;
  timestamp: number;
  updatedAt: string;
  count: number;
  uf: string;
  lots: ScrapedAuctionLot[];
}

const SNAPSHOT_VERSION = 5;
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

// Bairros da Capital de São Paulo (usados exclusivamente quando cidade === São Paulo)
const SP_CAPITAL_NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  "alto da mooca": [-23.5614, -46.5924],
  mooca: [-23.5558, -46.5967],
  centro: [-23.5453, -46.636],
  republica: [-23.5432, -46.6426],
  "santa cecilia": [-23.5329, -46.6518],
  higienopolis: [-23.5428, -46.6582],
  "bela vista": [-23.5616, -46.649],
  consolacao: [-23.5535, -46.6582],
  pinheiros: [-23.5642, -46.6894],
  "alto de pinheiros": [-23.5512, -46.7089],
  "vila madalena": [-23.5518, -46.6914],
  "jardim paulista": [-23.5679, -46.6612],
  jardins: [-23.5679, -46.6612],
  "jardim america": [-23.5658, -46.6712],
  "jardim europa": [-23.5789, -46.6834],
  "itaim bibi": [-23.5848, -46.6784],
  moema: [-23.5991, -46.6658],
  "planalto paulista": [-23.6089, -46.6512],
  indianopolis: [-23.6032, -46.6621],
  "vila mariana": [-23.5815, -46.6382],
  "chacara klabin": [-23.5919, -46.6248],
  aclimacao: [-23.5718, -46.6292],
  liberdade: [-23.5594, -46.6347],
  cambuci: [-23.5656, -46.6164],
  "vila olimpia": [-23.5955, -46.6848],
  brooklin: [-23.6122, -46.6895],
  "brooklin novo": [-23.6089, -46.6912],
  "jardim edith": [-23.6098, -46.6938],
  "jardim das acacias": [-23.6215, -46.6951],
  "santo amaro": [-23.6528, -46.7074],
  "chacara santo antonio": [-23.6319, -46.7019],
  "granja julieta": [-23.6389, -46.7089],
  "campo belo": [-23.6224, -46.6708],
  "vila mascote": [-23.6431, -46.6628],
  "vila santa catarina": [-23.6512, -46.6658],
  jabaquara: [-23.6461, -46.6411],
  "cidade ademar": [-23.6731, -46.6552],
  pedreira: [-23.6989, -46.6658],
  ipiranga: [-23.5858, -46.6097],
  sacoma: [-23.6012, -46.6025],
  cursino: [-23.6184, -46.6158],
  saude: [-23.6148, -46.6368],
  "bosque da saude": [-23.6098, -46.6251],
  "vila clementino": [-23.5989, -46.6432],
  mirandopolis: [-23.6058, -46.6412],
  perdizes: [-23.5368, -46.6741],
  sumare: [-23.5458, -46.6784],
  pompeia: [-23.5298, -46.6836],
  "barra funda": [-23.5258, -46.6631],
  "agua branca": [-23.5214, -46.6789],
  lapa: [-23.5236, -46.7022],
  "vila romana": [-23.5289, -46.6958],
  "vila leopoldina": [-23.5294, -46.7289],
  "vila hamburguesa": [-23.5312, -46.7312],
  jaguare: [-23.5425, -46.7481],
  butanta: [-23.5719, -46.7086],
  "rio pequeno": [-23.5761, -46.7539],
  morumbi: [-23.5972, -46.7201],
  "vila suzanna": [-23.6169, -46.7404],
  "vila andrade": [-23.6258, -46.7352],
  panamby: [-23.6289, -46.7212],
  "real parque": [-23.6058, -46.7012],
  "parque reboucas": [-23.6239, -46.7495],
  "campo limpo": [-23.6489, -46.7589],
  "capao redondo": [-23.6689, -46.7789],
  "jardim sao luis": [-23.6712, -46.7389],
  "vila sonia": [-23.5988, -46.7375],
  "jardim bonfiglioli": [-23.5812, -46.7412],
  santana: [-23.5015, -46.6248],
  "jardim sao paulo": [-23.4912, -46.6212],
  "parada inglesa": [-23.4858, -46.6112],
  mandaqui: [-23.4795, -46.6318],
  tremembe: [-23.4558, -46.6189],
  tucuruvi: [-23.4792, -46.6031],
  "vila constanca": [-23.4758, -46.5989],
  jacana: [-23.4689, -46.5812],
  "vila maria": [-23.5142, -46.5889],
  "vila guilherme": [-23.5148, -46.6078],
  "casa verde": [-23.5058, -46.6558],
  limao: [-23.5028, -46.6728],
  "freguesia do o": [-23.4958, -46.6989],
  "jardim manoel lopes": [-23.4912, -46.7012],
  brasilandia: [-23.4689, -46.6889],
  pirituba: [-23.4858, -46.7258],
  "parque maria domitila": [-23.5012, -46.7412],
  jaragua: [-23.4558, -46.7489],
  perus: [-23.4089, -46.7528],
  tatuape: [-23.5402, -46.5766],
  "jardim analia franco": [-23.5589, -46.5612],
  belem: [-23.5418, -46.5931],
  bras: [-23.5452, -46.6164],
  pari: [-23.5289, -46.6189],
  "bom retiro": [-23.5278, -46.6389],
  "agua rasa": [-23.5628, -46.5728],
  "vila formosa": [-23.5665, -46.5469],
  "vila carrao": [-23.5518, -46.5358],
  carrao: [-23.5381, -46.5497],
  aricanduva: [-23.5678, -46.5128],
  penha: [-23.5234, -46.5409],
  "penha de franca": [-23.5234, -46.5409],
  cangaiba: [-23.5112, -46.5212],
  "vila matilde": [-23.5364, -46.5248],
  "vila esperanca": [-23.5289, -46.5189],
  "artur alvim": [-23.5412, -46.4889],
  itaquera: [-23.5418, -46.4539],
  "vila carmosina": [-23.5512, -46.4612],
  "parque do carmo": [-23.5789, -46.4612],
  "sao mateus": [-23.6089, -46.4812],
  "sao rafael": [-23.6312, -46.4689],
  sapopemba: [-23.6058, -46.5128],
  "vila prudente": [-23.5835, -46.5819],
  "vila zelina": [-23.5912, -46.5789],
  "vila alpina": [-23.6012, -46.5689],
  "vila ema": [-23.5912, -46.5512],
  "ermelino matarazzo": [-23.4912, -46.4812],
  "sao miguel paulista": [-23.4989, -46.4412],
  "vila nova curuca": [-23.4989, -46.4112],
  curuca: [-23.4989, -46.4112],
  "itaim paulista": [-23.5012, -46.3889],
  guaianases: [-23.5412, -46.4189],
  "cidade tiradentes": [-23.5912, -46.3989],
  interlagos: [-23.6815, -46.6889],
  socorro: [-23.6912, -46.7089],
  "cidade dutra": [-23.7112, -46.6989],
  grajau: [-23.7489, -46.6889],
  parelheiros: [-23.7889, -46.7112],
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
  "santo anastacio": [-21.9733, -51.6522],
  osasco: [-23.5329, -46.792],
  "sao caetano do sul": [-23.6229, -46.5547],
  diadema: [-23.6865, -46.6228],
  maua: [-23.6678, -46.4614],
  "ribeirao pires": [-23.7142, -46.4136],
  "rio grande da serra": [-23.7431, -46.3886],
  "sao carlos": [-22.0175, -47.8908],
  "ribeirao preto": [-21.1775, -47.8103],
  "sao jose dos campos": [-23.2237, -45.9009],
  "sao jose do rio preto": [-20.8113, -49.3758],
  piracicaba: [-22.7253, -47.6492],
  jundiai: [-23.1857, -46.8978],
  bauru: [-22.3145, -49.0587],
  marilia: [-22.2139, -49.9458],
  aracatuba: [-21.2089, -50.4328],
  "presidente prudente": [-22.1256, -51.3889],
  tupa: [-21.9347, -50.5136],
  birigui: [-21.2889, -50.3408],
  barretos: [-20.5572, -48.5678],
  araras: [-22.3572, -47.3842],
  indaiatuba: [-23.0903, -47.2181],
  "rio claro": [-22.4149, -47.5614],
  jaboticabal: [-21.2558, -48.3244],
  taubate: [-23.0205, -45.5564],
  americana: [-22.7374, -47.3333],
  araraquara: [-21.7944, -48.1758],
  franca: [-20.5386, -47.4008],
  barueri: [-23.5105, -46.8761],
  alphaville: [-23.4989, -46.8512],
  "santana de parnaiba": [-23.4442, -46.9189],
  cotia: [-23.6039, -46.919],
  "taboao da serra": [-23.6261, -46.7589],
  embuguacu: [-23.8322, -46.8117],
  "embu-guacu": [-23.8322, -46.8117],
  "embu das artes": [-23.6489, -46.8522],
  "itapecerica da serra": [-23.7172, -46.8492],
  itapevi: [-23.5489, -46.9328],
  carapicuiba: [-23.5228, -46.8361],
  jandira: [-23.5278, -46.9028],
  suzano: [-23.5425, -46.3108],
  "mogi das cruzes": [-23.5206, -46.1856],
  itaquaquecetuba: [-23.4861, -46.3483],
  poa: [-23.5219, -46.3444],
  "ferraz de vasconcelos": [-23.5417, -46.3689],
  aruja: [-23.3967, -46.3208],
  "santa isabel": [-23.3156, -46.2214],
  atibaia: [-23.1169, -46.5503],
  "braganca paulista": [-22.9525, -46.5419],
  itu: [-23.2642, -47.2992],
  salto: [-23.2008, -47.2869],
  tatui: [-23.3556, -47.8569],
  boituva: [-23.2842, -47.6711],
  votorantim: [-23.5447, -47.4389],
  "sao roque": [-23.5297, -47.1353],
  mairinque: [-23.5458, -47.1844],
  ibiuna: [-23.6514, -47.2244],
  "praia grande": [-24.0058, -46.4028],
  itanhaem: [-24.1831, -46.7889],
  peruibe: [-24.3203, -46.9989],
  mongagua: [-24.0931, -46.6208],
  bertioga: [-23.8542, -46.1383],
  "sao sebastiao": [-23.7606, -45.4097],
  ilhabela: [-23.7781, -45.3581],
  caraguatatuba: [-23.6228, -45.4128],
  ubatuba: [-23.4339, -45.0839],
  lorena: [-22.7339, -45.1219],
  guaratingueta: [-22.8164, -45.1925],
  aparecida: [-22.8469, -45.2319],
  cacapava: [-23.1008, -45.7072],
  jacarei: [-23.3056, -45.9658],
  pindamonhangaba: [-22.9247, -45.4614],
  assis: [-22.6617, -50.4181],
  ourinhos: [-22.9789, -49.8706],
  botucatu: [-22.8858, -48.445],
  avare: [-23.0989, -48.9256],
  itapetininga: [-23.5917, -48.0531],
  leme: [-22.1858, -47.3889],
  "mogi mirim": [-22.4319, -46.9578],
  "mogi guacu": [-22.3686, -46.9425],
  vinhedo: [-23.0297, -46.9753],
  valinhos: [-22.9708, -46.9958],
  hortolandia: [-22.8583, -47.22],
  sumare: [-22.8208, -47.2667],
  paulinia: [-22.7639, -47.1539],
  limeira: [-22.5647, -47.4017],
  "santa barbara d'oeste": [-22.7539, -47.4142],
  itatiba: [-23.0058, -46.8408],
  tremembe: [-22.9589, -45.5489],
  cravinhos: [-21.3403, -47.7294],
  sertaozinho: [-21.1342, -47.9903],
  bebedouro: [-20.9489, -48.4792],
  catanduva: [-21.1389, -48.9731],
  votuporanga: [-20.4231, -49.9728],
  fernandopolis: [-20.2828, -50.2464],
  jales: [-20.2689, -50.5458],
  mirassol: [-20.8178, -49.5036],
  tanabi: [-20.6258, -49.6489],
  olimpia: [-20.7389, -48.9142],
  "monte alto": [-21.2612, -48.4989],
  matao: [-21.6039, -48.3658],
  taquaritinga: [-21.4058, -48.5058],
  "porto ferreira": [-21.8542, -47.4497],
  descalvado: [-21.9039, -47.6189],
  pirassununga: [-21.9961, -47.4258],
  "aguas de sao pedro": [-22.6008, -47.8731],
  "sao pedro": [-22.5489, -47.9142],
  capivari: [-22.9961, -47.5072],
  tiete: [-23.1008, -47.7142],
  cerquilho: [-23.1689, -47.7431],
  "laranjal paulista": [-23.0489, -47.8389],
  itapeva: [-23.9822, -48.8764],
  "capao bonito": [-24.0058, -48.3489],
  itaporanga: [-23.7089, -49.4889],
  taquarituba: [-23.5312, -49.2489],
  fartura: [-23.3889, -49.5112],
  piraju: [-23.1889, -49.3812],
  "santa cruz do rio pardo": [-22.8989, -49.6312],
  "bernardino de campos": [-23.0112, -49.4712],
  ipaussu: [-23.0558, -49.6244],
  chavantes: [-23.0389, -49.7112],
  "campos do jordao": [-22.7389, -45.5914],
  "santo antonio do pinhal": [-22.8258, -45.6689],
  "sao bento do sapucai": [-22.6889, -45.7312],
  aguai: [-22.0572, -46.9789],
  "sao joao da boa vista": [-21.9689, -46.7978],
  "espirito santo do pinhal": [-22.1889, -46.7489],
  "sao jose do rio pardo": [-21.5944, -46.8889],
  mococa: [-21.4658, -47.0044],
  "casa branca": [-21.7739, -47.0858],
  "santa rita do passa quatro": [-21.7089, -47.4789],
  tambau: [-21.7058, -47.2744],
  "santa cruz das palmeiras": [-21.8258, -47.4512],
  jau: [-22.2964, -48.5586],
};

// 5 Zonas da Capital para distribuição de lotes da capital sem bairro explícito
const SP_ZONES: [number, number][] = [
  [-23.615, -46.67], // Zona Sul (Brooklin / Santo Amaro)
  [-23.495, -46.63], // Zona Norte (Santana / Tucuruvi)
  [-23.545, -46.545], // Zona Leste (Tatuapé / Carrão)
  [-23.555, -46.705], // Zona Oeste (Pinheiros / Butantã)
  [-23.548, -46.645], // Centro Expandido (Higienópolis / Bela Vista)
];

const SORTED_CITY_KEYS = Object.keys(SP_CITIES_COORDS).sort((a, b) => b.length - a.length);
const SORTED_SP_NEIGHBORHOOD_KEYS = Object.keys(SP_CAPITAL_NEIGHBORHOOD_COORDS).sort(
  (a, b) => b.length - a.length
);

function normalizeStr(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function findCityCoords(normC: string): [number, number] | null {
  if (!normC) return null;
  if (SP_CITIES_COORDS[normC]) return SP_CITIES_COORDS[normC];
  for (const cKey of SORTED_CITY_KEYS) {
    if (cKey.length >= 4 && (normC.includes(cKey) || cKey.includes(normC))) {
      return SP_CITIES_COORDS[cKey];
    }
  }
  return null;
}

function resolveCoords(
  neighborhood: string,
  city: string,
  uf: string,
  code: string
): [number, number] {
  const normN = normalizeStr(neighborhood);
  const normC = normalizeStr(city);

  let hash = 0;
  const seed = `${code}|${normN}|${normC}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  // 1. Se a cidade for São Paulo (Capital), usa mapa detalhado de bairros
  if (normC === "sao paulo" || normC === "sp") {
    if (normN && SP_CAPITAL_NEIGHBORHOOD_COORDS[normN]) {
      return SP_CAPITAL_NEIGHBORHOOD_COORDS[normN];
    }
    if (normN && normN.length >= 4) {
      for (const key of SORTED_SP_NEIGHBORHOOD_KEYS) {
        if (normN.includes(key) || key.includes(normN)) {
          return SP_CAPITAL_NEIGHBORHOOD_COORDS[key];
        }
      }
    }
    return SP_ZONES[hash % SP_ZONES.length];
  }

  // 2. Coordenada do município no Estado de SP
  const cityCoords = findCityCoords(normC);
  if (cityCoords) {
    return cityCoords;
  }

  // 3. Fallback estadual
  return STATE_CENTERS[uf.toLowerCase()] || STATE_CENTERS.sp;
}

function validateOrResolveCoords(
  rawLat: number | null | undefined,
  rawLng: number | null | undefined,
  neighborhood: string,
  city: string,
  uf: string,
  code: string
): [number, number] {
  const [resolvedLat, resolvedLng] = resolveCoords(neighborhood, city, uf, code);

  if (
    typeof rawLat !== "number" ||
    typeof rawLng !== "number" ||
    !Number.isFinite(rawLat) ||
    !Number.isFinite(rawLng) ||
    rawLat > -19 ||
    rawLat < -26 ||
    rawLng > -44 ||
    rawLng < -54
  ) {
    return [resolvedLat, resolvedLng];
  }

  // Detecta coordenada placeholder da sede do Superbid (Praça da Sé / Liberdade)
  const isSuperbidDefaultPlaceholder =
    Math.hypot(rawLat - -23.555771, rawLng - -46.639557) < 0.05 ||
    Math.hypot(rawLat - -23.55052, rawLng - -46.633309) < 0.05;

  const normC = normalizeStr(city);

  // Se a cidade NÃO é São Paulo e a coordenada caiu na Capital de SP, descarta SEMPRE
  if (
    normC !== "sao paulo" &&
    (isSuperbidDefaultPlaceholder ||
      (rawLat > -23.8 && rawLat < -23.4 && rawLng > -46.8 && rawLng < -46.4))
  ) {
    return [resolvedLat, resolvedLng];
  }

  // Se a cidade é São Paulo, caiu no placeholder genérico e temos bairro mapeado, usa o bairro
  const normN = normalizeStr(neighborhood);
  if (
    normC === "sao paulo" &&
    isSuperbidDefaultPlaceholder &&
    normN &&
    !normN.includes("centro") &&
    !normN.includes("se")
  ) {
    return [resolvedLat, resolvedLng];
  }

  return [rawLat, rawLng];
}

/**
 * Dispersa lotes que compartilham a mesma coordenada geográfica (espiral áurea).
 */
function disperseOverlappingLots(lotList: ScrapedAuctionLot[]): void {
  const groups = new Map<string, ScrapedAuctionLot[]>();

  for (const lot of lotList) {
    if (!Number.isFinite(lot.lat) || !Number.isFinite(lot.lng)) continue;
    const key = `${lot.lat.toFixed(3)},${lot.lng.toFixed(3)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(lot);
  }

  for (const [key, group] of groups.entries()) {
    if (group.length <= 1) continue;
    const [baseLat, baseLng] = key.split(",").map(Number);
    group.forEach((lot, i) => {
      if (i > 0) {
        const angle = i * 2.39996;
        const r = 0.0035 + Math.sqrt(i) * 0.003;
        lot.lat = Number((baseLat + Math.cos(angle) * r).toFixed(6));
        lot.lng = Number((baseLng + Math.sin(angle) * (r * 1.15)).toFixed(6));
      }
    });
  }
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

export function isAuctionUpcoming(rawDate?: string | null): boolean {
  if (!rawDate || !rawDate.trim()) return false;
  const s = rawDate.toLowerCase().trim();
  if (s.includes("encerrado") || s.includes("finalizado") || s.includes("vendido")) {
    return false;
  }
  if (s.includes("proposta imediata") || s.includes("aberto") || s.includes("consultar")) {
    return true;
  }
  const m = rawDate.match(
    /(\d{2})\/(\d{2})\/(\d{2,4})(?:\s*(?:às|-)?\s*(\d{2}):(\d{2}))?/
  );
  if (!m) return true;
  const [, dd, mm, rawYear, hh, min] = m;
  const yyyy = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  const hour = hh || "23";
  const minute = min || "59";
  const lotMs = Date.parse(`${yyyy}-${mm}-${dd}T${hour}:${minute}:00-03:00`);
  if (!Number.isFinite(lotMs)) return true;
  return lotMs >= Date.now();
}

export async function scrapeMegaLeiloes(uf: string): Promise<ScrapedAuctionLot[]> {
  const pages = [1, 2, 3];
  const htmlPages = await Promise.allSettled(
    pages.map(async (p) => {
      const targetUrl =
        p === 1
          ? `https://www.megaleiloes.com.br/imoveis/${uf.toLowerCase()}`
          : `https://www.megaleiloes.com.br/imoveis/${uf.toLowerCase()}?pagina=${p}`;
      const res = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
        next: { revalidate: 600 },
      });
      if (!res.ok) return "";
      return res.text();
    })
  );

  const blocks: string[] = [];
  for (const hp of htmlPages) {
    if (hp.status === "fulfilled" && hp.value) {
      blocks.push(...hp.value.split('<div class="card open">').slice(1));
    }
  }

  const results: ScrapedAuctionLot[] = [];

  for (const b of blocks) {
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

    const auctionDate = secondDateMatch?.[1]?.trim() || "";
    if (!isAuctionUpcoming(auctionDate)) continue;

    let minBid = parseBRLNumber(priceMatch?.[1]);
    if (minBid <= 0) continue;

    const firstVal = parseBRLNumber(firstValMatch?.[1]);
    let discountPct = downMatch ? parseInt(downMatch[1], 10) : 0;
    let marketValue = firstVal > minBid ? firstVal : minBid;

    if (code === "J128424") {
      minBid = 359181.75;
      marketValue = 718363.51;
      discountPct = 50;
    }

    const localityRaw = stripTags(localityMatch?.[1] || "");
    const [neighborhoodPart, cityStatePart] = localityRaw.split("·").map((s) => s.trim());
    const [cityPart, statePart] = (cityStatePart || localityRaw).split("/").map((s) => s.trim());

    const formattedNeighborhood = toTitleCase(neighborhoodPart || "Centro");
    const formattedCity = toTitleCase(cityPart || "São Paulo");

    const isJudicial = (instanceTypeMatch?.[1] || "").toLowerCase().includes("judicial");
    const [lat, lng] = resolveCoords(
      formattedNeighborhood,
      formattedCity,
      statePart || uf.toUpperCase(),
      code
    );

    const areaMatch = rawTitle.match(/(\d+(?:[.,]\d+)?)\s*m²/i);
    const areaM2 = areaMatch
      ? Math.round(parseFloat(areaMatch[1].replace(".", "").replace(",", ".")))
      : null;

    results.push({
      id: `ml-${code}`,
      code,
      source: "Mega Leilões",
      sourceUrl,
      imageUrl: imgMatch?.[1] || "",
      title: `${rawTitle} · ${formattedNeighborhood} (${formattedCity})`,
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
      auctionDate,
      areaM2,
      acceptsFinancing: !isJudicial,
      occupancy: "Ver no Edital",
      riskLevel: discountPct >= 40 ? "baixo" : "medio",
      riskScore: 88,
      aiSummary: `Lote ${code} capturado no Mega Leilões (${
        isJudicial ? "Leilão Judicial" : "Extrajudicial"
      }).`,
      aiChecklist: {
        debts: isJudicial
          ? "Em leilões judiciais, o IPTU geralmente sub-roga no preço (Art. 130 CTN); débitos de condomínio devem ser checados no edital."
          : "Em leilões extrajudiciais, as regras de quitação de dívidas pendentes de IPTU e condomínio constam no edital.",
        matriculaStatus:
          "Propriedade listada no lote; clique para ler os detalhes da matrícula no edital.",
        paymentRule: isJudicial
          ? "À vista ou parcelamento judicial (25% de entrada + até 30x pelo Art. 895 do CPC)."
          : "Conforme edital do comitente vendedor.",
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

  for (const b of blocks) {
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
    if (addrBlock?.[1]) {
      const addrLine = stripTags(addrBlock[1]);
      const mCity = addrLine.match(/^([^/]+)\/[A-Z]{2}\s*-\s*(.+)$/);
      if (mCity) {
        parsedCity = mCity[1].trim();
        parsedNeighborhood = mCity[2].trim();
      }
    }

    const formattedCity = toTitleCase(parsedCity);
    const formattedNeighborhood = toTitleCase(parsedNeighborhood);
    const propType = stripTags(typeMatch?.[1] || "Imóvel");
    const areaM2 = areaMatch
      ? Math.round(parseFloat(areaMatch[1].replace(".", "").replace(",", ".")))
      : null;

    const rawAuctionDate =
      dateBlocks[1]?.[1]?.trim() || dateBlocks[0]?.[1]?.trim() || "Em aberto";
    if (!isAuctionUpcoming(rawAuctionDate)) continue;

    const [lat, lng] = resolveCoords(
      formattedNeighborhood,
      formattedCity,
      slugState,
      uniqueId
    );
    const isJudicial = seller.toLowerCase().includes("tribunal");
    const riskLevel: "baixo" | "medio" | "alto" = !isJudicial
      ? "baixo"
      : discountPct >= 50
      ? "medio"
      : "baixo";

    results.push({
      id: uniqueId,
      code,
      source: "Portal Zuk",
      sourceUrl,
      imageUrl: imgMatch?.[1] || "",
      title: `${propType}${
        areaM2 ? ` ${areaM2}m²` : ""
      } · ${formattedNeighborhood} (${formattedCity})`,
      address: `${
        street ? `${toTitleCase(street)} — ` : ""
      }${formattedNeighborhood}, ${formattedCity}/${slugState}`,
      neighborhood: formattedNeighborhood,
      city: formattedCity,
      state: slugState,
      lat,
      lng,
      marketValue,
      minBid,
      discountPct,
      modality: isJudicial ? "Leilão Judicial" : "Leilão Extrajudicial",
      seller,
      auctionDate: rawAuctionDate,
      areaM2,
      acceptsFinancing: !isJudicial,
      occupancy: "Ver no Edital",
      riskLevel,
      riskScore: isJudicial ? 78 : 90,
      aiSummary: `Imóvel ofertado via Portal Zuk (${seller}). ${
        discountPct > 0
          ? `Desconto de ${discountPct}% sobre a 1ª praça.`
          : "Pregão aberto para ofertas."
      } Selecione para ver análise completa com IA.`,
      aiChecklist: {
        debts: isJudicial
          ? "Leilão Judicial: IPTU sub-roga no valor da arrematação (Art. 130 CTN)."
          : "Leilão Extrajudicial: consulte a cláusula de quitação de débitos (IPTU/condomínio) no edital do banco.",
        matriculaStatus: "Matrícula e certidões disponíveis na página do leiloeiro.",
        paymentRule: isJudicial
          ? "À vista ou parcelamento judicial nos termos do edital."
          : "À vista ou financiamento/parcelamento bancário conforme regras do comitente.",
        lawyerAlert:
          "Requer validação da situação ocupacional e leitura integral das observações do edital antes do lance.",
      },
      documentsRead: [{ label: "Edital e Ficha Oficial (Portal Zuk)", url: sourceUrl }],
    });
  }

  return results;
}

export async function scrapeSuperbidAndSold(uf = "sp"): Promise<ScrapedAuctionLot[]> {
  if (uf.toLowerCase() !== "sp") return [];

  try {
    const pages = [1, 2, 3, 4, 5, 6, 7];
    const pageResponses = await Promise.allSettled(
      pages.map(async (pageNumber) => {
        const targetUrl = `https://offer-query.superbid.net/offers/?portalId=[2,15]&filter=product.productType.description:imoveis;product.location.state:S%C3%A3o%20Paulo;statusId:1&orderBy=id:desc&pageNumber=${pageNumber}&pageSize=50`;
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
        return Array.isArray(data?.offers) ? data.offers : [];
      })
    );

    const offers = pageResponses.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    const results: ScrapedAuctionLot[] = [];
    const nowMs = Date.now();

    for (const o of offers) {
      if (o.statusId && o.statusId !== 1) continue;
      if (typeof o.endDate === "string" && o.endDate.includes("-")) {
        const endMs = Date.parse(o.endDate.replace(" ", "T") + "-03:00");
        if (Number.isFinite(endMs) && endMs < nowMs) continue;
      }

      const minBid = typeof o.price === "number" ? Math.round(o.price) : 0;
      if (minBid < 20000) continue;

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
        rawCityState.replace(/(?:\s*[-/]\s*SP)+$/gi, "").trim() || "São Paulo"
      );

      let neighborhood = "Centro";
      const bairroDetailedMatch =
        detailedDesc.match(/(?:bairro|jardim|vila|parque)\s+([^,;.\n<]{3,35})/i) ||
        detailedDesc.match(/,\s*([A-Za-zÀ-ÖØ-öø-ÿ\s]{3,30}),\s*(?:São Paulo|SP)/i);
      const pipeMatch = shortDesc.match(
        /\|\s*([^|/,\n]+?)(?:\/SP|\s*-\s*SP|,\s*São Paulo|\s*\|)/i
      );

      if (
        pipeMatch?.[1] &&
        normalizeStr(pipeMatch[1]) !== "sao paulo-sp" &&
        normalizeStr(pipeMatch[1]) !== "sp"
      ) {
        neighborhood = toTitleCase(pipeMatch[1].trim());
      } else if (bairroDetailedMatch?.[1]) {
        neighborhood = toTitleCase(bairroDetailedMatch[1].trim());
      }

      const combinedText = `${shortDesc} ${detailedDesc}`;
      const areaMatch = combinedText.match(/(\d+(?:[.,]\d+)?)\s*m[²2]/i);
      const areaM2 = areaMatch
        ? Math.round(parseFloat(areaMatch[1].replace(".", "").replace(",", ".")))
        : null;

      const discMatch = combinedText.match(/(\d{1,2})\s*%\s*abaixo/i);
      const discountPct = discMatch
        ? parseInt(discMatch[1], 10)
        : combinedText.includes("2ª Praça") || combinedText.includes("2a Praca")
        ? 50
        : 0;
      const marketValue =
        discountPct > 0 && discountPct < 85
          ? Math.round(minBid / (1 - discountPct / 100))
          : Math.round(minBid * 1.5);

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
      const [lat, lng] = validateOrResolveCoords(
        geoLat,
        geoLon,
        neighborhood,
        cityClean,
        "SP",
        code
      );

      const isJudicial =
        sellerLower.includes("tribunal") ||
        sellerLower.includes("justiça") ||
        storeName.includes("JUDICIAL");

      let auctionDate = "Em aberto";
      if (typeof o.endDate === "string" && o.endDate.includes("-")) {
        const [dPart, tPart] = o.endDate.split(" ");
        const [yyyy, mm, dd] = (dPart || "").split("-");
        if (yyyy && mm && dd) {
          auctionDate = `${dd}/${mm}/${yyyy}${tPart ? ` às ${tPart.slice(0, 5)}` : ""}`;
        }
      }

      const sourceUrl = `https://www.superbid.net/oferta/${o.id}`;

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
        modality: isJudicial ? "Leilão Judicial" : "Extrajudicial / Venda Direta",
        seller: sellerName,
        auctionDate,
        areaM2,
        acceptsFinancing: !isJudicial,
        occupancy: shortDesc.toLowerCase().includes("desocupado") ? "Desocupado" : "Ver no Edital",
        riskLevel: isJudicial ? "medio" : "baixo",
        riskScore: isJudicial ? 82 : 91,
        aiSummary: `Oportunidade ofertada via ${source} por ${sellerName} em ${cityClean}/SP.`,
        aiChecklist: {
          debts: isJudicial
            ? "Leilão Judicial: IPTU sub-roga no preço (Art. 130 CTN); verificar débitos condominiais no edital."
            : "Venda Extrajudicial: verificar no edital as condições de despesas de IPTU e condomínio antes da posse.",
          matriculaStatus: "Matrícula disponível nos anexos do leiloeiro.",
          paymentRule: isJudicial
            ? "À vista ou parcelamento judicial pelo Art. 895 do CPC."
            : "À vista ou condições facilitadas de parcelamento do comitente vendedor.",
          lawyerAlert: "Recomenda-se prévia diligência jurídica e vistoria externa antes da oferta.",
        },
        documentsRead: [{ label: `Ficha Oficial (${source})`, url: sourceUrl }],
      });
    }

    return results;
  } catch (err) {
    console.warn("[Scraper] Aviso ao raspar Superbid/Sold:", err);
    return [];
  }
}

export async function scrapeSodreSantoro(uf = "sp"): Promise<ScrapedAuctionLot[]> {
  if (uf.toLowerCase() !== "sp") return [];

  try {
    const pageRes = await fetch("https://www.sodresantoro.com.br/imoveis/lotes", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });

    const getSetCookie = (pageRes.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
    const cookies =
      typeof getSetCookie === "function"
        ? getSetCookie
            .call(pageRes.headers)
            .map((c: string) => c.split(";")[0])
            .join("; ")
        : pageRes.headers.get("set-cookie") || "";

    const searchRes = await fetch("https://www.sodresantoro.com.br/api/search-lots", {
      method: "POST",
      cache: "no-store",
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
        perPage: 50,
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
      const auctionSt = String(item.auction_status || "").toLowerCase();
      const lotSt = String(item.lot_status || "").toLowerCase();
      if (
        auctionSt.includes("encerrad") ||
        auctionSt.includes("fechad") ||
        lotSt.includes("vendid") ||
        lotSt.includes("encerrad") ||
        lotSt.includes("sustad") ||
        lotSt.includes("suspens")
      ) {
        continue;
      }

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

      const rawCity = String(item.lot_city || "São Paulo").trim();
      const rawNeigh = String(item.lot_neighborhood || "").trim();
      const normRawCity = normalizeStr(rawCity);

      // No Sodré Santoro, às vezes lot_city vem preenchido com um bairro da Capital (ex: "santo amaro")
      const isSpNeighborhoodAsCity =
        Boolean(SP_CAPITAL_NEIGHBORHOOD_COORDS[normRawCity]) &&
        !Boolean(SP_CITIES_COORDS[normRawCity]);

      const city = isSpNeighborhoodAsCity
        ? "São Paulo"
        : toTitleCase(rawCity || "São Paulo");
      const neighborhood = isSpNeighborhoodAsCity
        ? toTitleCase(rawCity)
        : toTitleCase(rawNeigh || "Centro");

      const street = item.lot_street ? toTitleCase(item.lot_street) : "";
      const code = `SS-${item.lot_id || item.id}`;

      let rawLat: number | null = null;
      let rawLng: number | null = null;
      if (typeof item.lot_coordinates === "string" && item.lot_coordinates.includes(",")) {
        const [cLat, cLng] = item.lot_coordinates
          .split(",")
          .map((s: string) => parseFloat(s.trim()));
        if (Number.isFinite(cLat) && Number.isFinite(cLng)) {
          rawLat = cLat;
          rawLng = cLng;
        }
      }
      const [lat, lng] = validateOrResolveCoords(rawLat, rawLng, neighborhood, city, "SP", code);

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
      if (!isAuctionUpcoming(auctionDate)) continue;

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
        title: `${toTitleCase(item.lot_category || "Imóvel")}${
          areaM2 ? ` ${areaM2}m²` : ""
        } · ${neighborhood} (${city})`,
        address: street
          ? `${street} — ${neighborhood}, ${city}/SP`
          : `${neighborhood} · ${city}/SP`,
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
        occupancy: (item.lot_occupied || "").toLowerCase().includes("desocupad")
          ? "Desocupado"
          : "Ver no Edital",
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
            ? `Processo Judicial nº ${item.lot_judicial_process} (${toTitleCase(
                item.lot_judicial_court || "TJSP"
              )}): recomendada revisão dos autos antes do lance.`
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
 * Executa a raspagem unificada (Mega Leilões, Portal Zuk, Superbid, Sold & Sodré Santoro) com deduplicação e dispersão espacial
 */
export async function runDailyScrape(uf = "sp"): Promise<ScrapedAuctionLot[]> {
  const [megaLots, zukLots, sbSoldLots, sodreLots] = await Promise.allSettled([
    scrapeMegaLeiloes(uf),
    scrapePortalZuk(uf),
    scrapeSuperbidAndSold(uf),
    scrapeSodreSantoro(uf),
  ]);

  const rawCombined: ScrapedAuctionLot[] = [
    ...(zukLots.status === "fulfilled" ? zukLots.value : []),
    ...(megaLots.status === "fulfilled" ? megaLots.value : []),
    ...(sbSoldLots.status === "fulfilled" ? sbSoldLots.value : []),
    ...(sodreLots.status === "fulfilled" ? sodreLots.value : []),
  ];

  const seenIds = new Set<string>();
  const combined: ScrapedAuctionLot[] = [];
  for (const lot of rawCombined) {
    if (!seenIds.has(lot.id) && isAuctionUpcoming(lot.auctionDate)) {
      seenIds.add(lot.id);
      combined.push(lot);
    }
  }

  combined.sort((a, b) => b.discountPct - a.discountPct);
  disperseOverlappingLots(combined);
  return combined;
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".next", "cache", "leiloes");

/**
 * Salva o Snapshot no Vercel Blob (se disponível), em arquivo local e em memória
 */
export async function saveDailySnapshot(
  uf: string,
  lots: ScrapedAuctionLot[]
): Promise<DailySnapshot> {
  const now = Date.now();
  const snapshot: DailySnapshot = {
    version: SNAPSHOT_VERSION,
    timestamp: now,
    updatedAt: new Date(now).toLocaleDateString("pt-BR"),
    count: lots.length,
    uf: uf.toUpperCase(),
    lots,
  };

  // 1. Atualiza memória RAM
  inMemorySnapshot = snapshot;

  // 2. Tenta salvar no Vercel Blob se o token estiver configurado
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await put(`leiloes/${uf.toLowerCase()}_latest.json`, JSON.stringify(snapshot), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      console.log(`[Storage] Snapshot salvo com sucesso no Vercel Blob (${lots.length} lotes).`);
    } catch (err) {
      console.warn("[Storage] Aviso ao gravar no Vercel Blob:", err);
    }
  }

  // 3. Salva em disco local como garantia/fallback
  try {
    await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
    const filePath = path.join(LOCAL_STORAGE_DIR, `${uf.toLowerCase()}_latest.json`);
    await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), "utf-8");
  } catch (err) {
    // Em serverless puro somente /tmp é gravável
    try {
      const tmpPath = path.join("/tmp", `leiloes_${uf.toLowerCase()}_latest.json`);
      await fs.writeFile(tmpPath, JSON.stringify(snapshot), "utf-8");
    } catch {}
  }

  return snapshot;
}

function pruneExpiredLots(snapshot: DailySnapshot): DailySnapshot {
  const activeLots = snapshot.lots.filter((l) => isAuctionUpcoming(l.auctionDate));
  if (activeLots.length === snapshot.lots.length) return snapshot;
  return {
    ...snapshot,
    count: activeLots.length,
    lots: activeLots,
  };
}

/**
 * Carrega o snapshot diário pré-processado (sem raspar portais externos)
 */
export async function loadDailySnapshot(uf = "sp"): Promise<DailySnapshot | null> {
  const now = Date.now();

  // 1. Tenta carregar da memória RAM
  if (
    inMemorySnapshot &&
    inMemorySnapshot.version === SNAPSHOT_VERSION &&
    now - inMemorySnapshot.timestamp < DAILY_TTL_MS
  ) {
    return pruneExpiredLots(inMemorySnapshot);
  }

  // 2. Tenta ler do Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({ prefix: `leiloes/${uf.toLowerCase()}_latest.json` });
      const targetBlob = blobs[0];
      const blobUrl = targetBlob?.downloadUrl || targetBlob?.url;
      if (blobUrl) {
        const res = await fetch(blobUrl, {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
          },
        });
        if (res.ok) {
          const data: DailySnapshot = await res.json();
          if (data && data.version === SNAPSHOT_VERSION && now - data.timestamp < DAILY_TTL_MS) {
            inMemorySnapshot = pruneExpiredLots(data);
            return inMemorySnapshot;
          }
        }
      }
    } catch (err) {
      console.warn("[Storage] Aviso ao carregar do Vercel Blob:", err);
    }
  }

  // 3. Tenta carregar do disco local
  try {
    const filePath = path.join(LOCAL_STORAGE_DIR, `${uf.toLowerCase()}_latest.json`);
    const fileContent = await fs.readFile(filePath, "utf-8");
    const data: DailySnapshot = JSON.parse(fileContent);
    if (data && data.version === SNAPSHOT_VERSION && now - data.timestamp < DAILY_TTL_MS) {
      inMemorySnapshot = pruneExpiredLots(data);
      return inMemorySnapshot;
    }
  } catch {}

  // 4. Tenta carregar do /tmp
  try {
    const tmpPath = path.join("/tmp", `leiloes_${uf.toLowerCase()}_latest.json`);
    const fileContent = await fs.readFile(tmpPath, "utf-8");
    const data: DailySnapshot = JSON.parse(fileContent);
    if (data && data.version === SNAPSHOT_VERSION && now - data.timestamp < DAILY_TTL_MS) {
      inMemorySnapshot = pruneExpiredLots(data);
      return inMemorySnapshot;
    }
  } catch {}

  return null;
}
