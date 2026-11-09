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

/**
 * Bairros EXCLUSIVOS da cidade de São Paulo (Capital).
 * NUNCA devem ser aplicados quando a cidade for diferente de "São Paulo".
 */
const SP_CAPITAL_NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  "alto da mooca": [-23.5614, -46.5924],
  mooca: [-23.5558, -46.5967],
  centro: [-23.5453, -46.636],
  republica: [-23.5432, -46.6426],
  "santa cecilia": [-23.5329, -46.6518],
  bela_vista: [-23.5616, -46.649],
  "bela vista": [-23.5616, -46.649],
  consolacao: [-23.5535, -46.6582],
  pinheiros: [-23.5642, -46.6894],
  "alto de pinheiros": [-23.5512, -46.7089],
  "vila madalena": [-23.5518, -46.6914],
  "jardim paulista": [-23.5679, -46.6612],
  jardins: [-23.5679, -46.6612],
  "itaim bibi": [-23.5848, -46.6784],
  moema: [-23.5991, -46.6658],
  indianopolis: [-23.6032, -46.6621],
  "vila mariana": [-23.5815, -46.6382],
  "chacara klabin": [-23.5919, -46.6248],
  aclimacao: [-23.5718, -46.6292],
  liberdade: [-23.5594, -46.6347],
  cambuci: [-23.5656, -46.6164],
  "vila olimpia": [-23.5955, -46.6848],
  brooklin: [-23.6122, -46.6895],
  "jardim edith": [-23.6098, -46.6938],
  "jardim das acacias": [-23.6215, -46.6951],
  "santo amaro": [-23.6528, -46.7074],
  "chacara santo antonio": [-23.6319, -46.7019],
  "campo belo": [-23.6224, -46.6708],
  "vila mascote": [-23.6431, -46.6628],
  jabaquara: [-23.6461, -46.6411],
  "cidade ademar": [-23.6731, -46.6552],
  ipiranga: [-23.5858, -46.6097],
  sacoma: [-23.6012, -46.6025],
  cursino: [-23.6184, -46.6158],
  saude: [-23.6148, -46.6368],
  "bosque da saude": [-23.6098, -46.6251],
  perdizes: [-23.5368, -46.6741],
  sumare: [-23.5458, -46.6784],
  pompeia: [-23.5298, -46.6836],
  "barra funda": [-23.5258, -46.6631],
  "agua branca": [-23.5214, -46.6789],
  lapa: [-23.5236, -46.7022],
  "vila leopoldina": [-23.5294, -46.7289],
  jaguare: [-23.5425, -46.7481],
  butanta: [-23.5719, -46.7086],
  "rio pequeno": [-23.5761, -46.7539],
  morumbi: [-23.5972, -46.7201],
  "vila andrade": [-23.6258, -46.7352],
  "parque reboucas": [-23.6239, -46.7495],
  "campo limpo": [-23.6489, -46.7589],
  "capao redondo": [-23.6689, -46.7789],
  "vila sonia": [-23.5988, -46.7375],
  santana: [-23.5015, -46.6248],
  mandaqui: [-23.4795, -46.6318],
  tremembe: [-23.4558, -46.6189],
  tucuruvi: [-23.4792, -46.6031],
  "vila maria": [-23.5142, -46.5889],
  "vila guilherme": [-23.5148, -46.6078],
  "casa verde": [-23.5058, -46.6558],
  limao: [-23.5028, -46.6728],
  "freguesia do o": [-23.4958, -46.6989],
  pirituba: [-23.4858, -46.7258],
  jaragua: [-23.4558, -46.7489],
  perus: [-23.4089, -46.7528],
  tatuape: [-23.5402, -46.5766],
  belem: [-23.5418, -46.5931],
  bras: [-23.5452, -46.6164],
  "bom retiro": [-23.5278, -46.6389],
  "agua rasa": [-23.5628, -46.5728],
  "vila formosa": [-23.5665, -46.5469],
  "vila carrao": [-23.5518, -46.5358],
  aricanduva: [-23.5678, -46.5128],
  penha: [-23.5234, -46.5409],
  "vila matilde": [-23.5364, -46.5248],
  "artur alvim": [-23.5398, -46.4858],
  "vila campanela": [-23.5412, -46.4695],
  itaquera: [-23.5418, -46.4539],
  "sao miguel paulista": [-23.4958, -46.4418],
  "itaim paulista": [-23.5018, -46.3989],
  guaianases: [-23.5428, -46.4128],
  "sao mateus": [-23.5989, -46.4758],
  sapopemba: [-23.6042, -46.5089],
  "vila prudente": [-23.5835, -46.5819],
  "vila zelina": [-23.5892, -46.5689],
  interlagos: [-23.6815, -46.6889],
  "cidade dutra": [-23.7128, -46.6989],
  grajau: [-23.7458, -46.6958],
};

/**
 * Bairros específicos de outras cidades da Grande SP / Interior ("cidade:bairro")
 */
const CITY_NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  "diadema:centro": [-23.6864, -46.6228],
  "diadema:piraporinha": [-23.6932, -46.5978],
  "diadema:canhema": [-23.6798, -46.6095],
  "diadema:taboao": [-23.6685, -46.6042],
  "diadema:campanario": [-23.6718, -46.6255],
  "diadema:conceicao": [-23.6961, -46.6248],
  "diadema:serraria": [-23.7024, -46.6164],
  "diadema:eldorado": [-23.7245, -46.6258],
  "diadema:casa grande": [-23.7068, -46.5992],
  "santo andre:centro": [-23.6578, -46.5278],
  "santo andre:jardim": [-23.6538, -46.5382],
  "santo andre:campestre": [-23.6412, -46.5448],
  "santo andre:vila assuncao": [-23.6678, -46.5218],
  "sao bernardo do campo:centro": [-23.7012, -46.5512],
  "sao bernardo do campo:rudge ramos": [-23.6558, -46.5698],
  "sao bernardo do campo:baeta neves": [-23.6918, -46.5448],
  "sao bernardo do campo:assuncao": [-23.7218, -46.5658],
  "sao caetano do sul:centro": [-23.6148, -46.5692],
  "sao caetano do sul:santa paula": [-23.6182, -46.5592],
  "barueri:alphaville": [-23.4958, -46.8518],
  "barueri:tambore": [-23.4858, -46.8358],
  "santana de parnaiba:alphaville": [-23.4689, -46.8689],
  "cotia:granja viana": [-23.5912, -46.8364],
};

/**
 * Coordenadas oficiais de municípios do Estado de São Paulo (IBGE / Centro Urbano)
 */
const SP_CITIES_COORDS: Record<string, [number, number]> = {
  "sao paulo": [-23.5505, -46.6333],
  campinas: [-22.9099, -47.0626],
  guarulhos: [-23.4542, -46.5333],
  sorocaba: [-23.5015, -47.4526],
  santos: [-23.9608, -46.3336],
  guaruja: [-23.9934, -46.2564],
  "sao vicente": [-23.9632, -46.3919],
  "sao bernardo do campo": [-23.6914, -46.5646],
  "sao bernado do campo": [-23.6914, -46.5646],
  "santo andre": [-23.6639, -46.5383],
  "sao caetano do sul": [-23.6229, -46.5548],
  diadema: [-23.6864, -46.6228],
  maua: [-23.6678, -46.4614],
  "ribeirao pires": [-23.7114, -46.4136],
  "rio grande da serra": [-23.7439, -46.3983],
  osasco: [-23.5329, -46.792],
  barueri: [-23.5105, -46.8761],
  "santana de parnaiba": [-23.4439, -46.9178],
  carapicuiba: [-23.5228, -46.8356],
  jandira: [-23.5275, -46.9028],
  itapevi: [-23.5489, -46.9344],
  cotia: [-23.6039, -46.919],
  "vargem grande paulista": [-23.6033, -47.0258],
  "taboao da serra": [-23.6089, -46.7578],
  "embu das artes": [-23.6489, -46.8522],
  "itapecerica da serra": [-23.7169, -46.8492],
  cajamar: [-23.3561, -46.8769],
  caieiras: [-23.3644, -46.7408],
  "franco da rocha": [-23.3217, -46.7269],
  "francisco morato": [-23.2817, -46.7425],
  mairipora: [-23.3186, -46.5869],
  aruja: [-23.3967, -46.3203],
  "santa isabel": [-23.3158, -46.2208],
  itaquaquecetuba: [-23.4864, -46.3486],
  poa: [-23.5286, -46.345],
  "ferraz de vasconcelos": [-23.5408, -46.3686],
  suzano: [-23.5425, -46.3108],
  "mogi das cruzes": [-23.5225, -46.1883],
  guararema: [-23.4147, -46.0369],
  "ribeirao preto": [-21.1775, -47.8103],
  "sao jose dos campos": [-23.2237, -45.9009],
  "sao jose do rio preto": [-20.8113, -49.3758],
  piracicaba: [-22.7253, -47.6492],
  jundiai: [-23.1857, -46.8978],
  "campo limpo paulista": [-23.2064, -46.7844],
  "varzea paulista": [-23.2114, -46.8289],
  jarinu: [-23.1022, -46.7283],
  itupeva: [-23.1528, -47.0578],
  louveira: [-23.0858, -46.9486],
  cabreuva: [-23.3075, -47.1328],
  bauru: [-22.3145, -49.0587],
  marilia: [-22.2139, -49.9458],
  indaiatuba: [-23.0903, -47.2181],
  "rio claro": [-22.4149, -47.5614],
  jaboticabal: [-21.2558, -48.3244],
  taubate: [-23.0205, -45.5564],
  pindamonhangaba: [-22.9239, -45.4617],
  guaratingueta: [-22.8164, -45.1925],
  aparecida: [-22.8469, -45.2297],
  lorena: [-22.7308, -45.1247],
  "cachoeira paulista": [-22.665, -45.0094],
  cruzeiro: [-22.5761, -44.9614],
  "campos do jordao": [-22.7394, -45.5914],
  cacapava: [-23.1008, -45.7069],
  jacarei: [-23.3053, -45.9658],
  americana: [-22.7374, -47.3333],
  "santa barbara d'oeste": [-22.7539, -47.4144],
  "santa barbara doeste": [-22.7539, -47.4144],
  araraquara: [-21.7944, -48.1758],
  "sao carlos": [-22.0175, -47.8908],
  franca: [-20.5386, -47.4008],
  "patrocinio paulista": [-20.6394, -47.2819],
  praia_grande: [-24.0058, -46.4028],
  "praia grande": [-24.0058, -46.4028],
  itanhaem: [-24.1831, -46.7889],
  mongagua: [-24.0931, -46.6208],
  peruibe: [-24.3208, -46.9983],
  bertioga: [-23.8542, -46.1383],
  cubatao: [-23.895, -46.4253],
  "sao sebastiao": [-23.8058, -45.4019],
  ilhabela: [-23.7781, -45.3581],
  caraguatatuba: [-23.6228, -45.4128],
  ubatuba: [-23.4339, -45.0839],
  assis: [-22.6617, -50.4181],
  ourinhos: [-22.9789, -49.8708],
  "santa cruz do rio pardo": [-22.8989, -49.6328],
  palmital: [-22.7889, -50.2175],
  "paraguacu paulista": [-22.4119, -50.5758],
  "mogi mirim": [-22.4319, -46.9578],
  "mogi guacu": [-22.3686, -46.9425],
  itapira: [-22.4361, -46.8219],
  araras: [-22.3569, -47.3842],
  leme: [-22.1856, -47.3903],
  conchal: [-22.3292, -47.1725],
  "sao joao da boa vista": [-21.9692, -46.7989],
  "vargem grande do sul": [-21.8289, -46.8936],
  "sao sebastiao da grama": [-21.7111, -46.8208],
  avare: [-23.0989, -48.9256],
  arandu: [-23.1344, -49.0542],
  "aguas de santa barbara": [-22.8814, -49.2414],
  botucatu: [-22.8858, -48.445],
  pardinho: [-23.0811, -48.3736],
  "sao manuel": [-22.7311, -48.5706],
  "barra bonita": [-22.4947, -48.5581],
  jau: [-22.2964, -48.5586],
  salto: [-23.2008, -47.2869],
  itu: [-23.2642, -47.2992],
  "capela do alto": [-23.4708, -47.7347],
  tatui: [-23.3556, -47.8569],
  boituva: [-23.2831, -47.6722],
  itapetininga: [-23.5894, -48.0531],
  itarare: [-24.1125, -49.3314],
  itapeva: [-23.9822, -48.8756],
  itatiba: [-23.0058, -46.8408],
  atibaia: [-23.1172, -46.5561],
  "braganca paulista": [-22.9525, -46.5419],
  valinhos: [-22.9708, -46.9958],
  vinhedo: [-23.0297, -46.9744],
  paulinia: [-22.7611, -47.1539],
  jaguariuna: [-22.7056, -46.9858],
  cosmopolis: [-22.6458, -47.1961],
  hortolandia: [-22.8583, -47.2203],
  sumare: [-22.8208, -47.2669],
  limeira: [-22.5647, -47.4017],
  charqueada: [-22.5097, -47.7781],
  aracatuba: [-21.2089, -50.4328],
  birigui: [-21.2886, -50.3408],
  penapolis: [-21.4197, -50.0775],
  barbosa: [-21.2667, -49.9492],
  buritama: [-21.0669, -50.1475],
  "ilha solteira": [-20.4328, -51.3425],
  andradina: [-20.8961, -51.3794],
  "presidente prudente": [-22.1256, -51.3889],
  martinopolis: [-22.1464, -51.1708],
  "santo anastacio": [-21.9769, -51.6519],
  panorama: [-21.3564, -51.8597],
  tupa: [-21.9347, -50.5136],
  lins: [-21.6786, -49.7458],
  promissao: [-21.5369, -49.8581],
  "julio mesquita": [-22.0089, -49.7872],
  catanduva: [-21.1389, -48.9731],
  novais: [-20.9922, -48.9189],
  potirendaba: [-21.0428, -49.3769],
  mendonca: [-21.1664, -49.5808],
  ubarana: [-21.1669, -49.7186],
  zacarias: [-21.0519, -50.0508],
  "nova granada": [-20.5339, -49.3142],
  votuporanga: [-20.4228, -49.9728],
  fernandopolis: [-20.2839, -50.2464],
  "santa fe do sul": [-20.2111, -50.9258],
  urania: [-20.2461, -50.6428],
  jales: [-20.2689, -50.5458],
  barretos: [-20.5572, -48.5678],
  bebedouro: [-20.9494, -48.4792],
  olimpia: [-20.7372, -48.9147],
  itapolis: [-21.5956, -48.8128],
  guariba: [-21.3603, -48.2283],
  pontal: [-21.0225, -48.0372],
  sertaozinho: [-21.1378, -47.9903],
  cravinhos: [-21.3403, -47.7294],
  "sao simao": [-21.4792, -47.5508],
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

const SORTED_CITY_KEYS = Object.keys(SP_CITIES_COORDS).sort((a, b) => b.length - a.length);
const SORTED_SP_NEIGHBORHOOD_KEYS = Object.keys(SP_CAPITAL_NEIGHBORHOOD_COORDS).sort(
  (a, b) => b.length - a.length
);

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

function resolveCoords(neighborhood: string, city: string, uf: string, code: string): [number, number] {
  const normN = normalizeStr(neighborhood);
  const normC = normalizeStr(city);
  const [dLat, dLng] = hashOffset(code + "|" + normN + "|" + normC);

  // 1. Se a cidade for São Paulo (Capital), usa o mapa de bairros da Capital
  if (normC === "sao paulo") {
    if (normN && SP_CAPITAL_NEIGHBORHOOD_COORDS[normN]) {
      const coords = SP_CAPITAL_NEIGHBORHOOD_COORDS[normN];
      return [coords[0] + dLat * 0.25, coords[1] + dLng * 0.25];
    }
    if (normN && normN.length >= 4) {
      for (const key of SORTED_SP_NEIGHBORHOOD_KEYS) {
        if (normN.includes(key) || key.includes(normN)) {
          const coords = SP_CAPITAL_NEIGHBORHOOD_COORDS[key];
          return [coords[0] + dLat * 0.25, coords[1] + dLng * 0.25];
        }
      }
    }
    const spBase = SP_CITIES_COORDS["sao paulo"];
    return [spBase[0] + dLat * 0.4, spBase[1] + dLng * 0.4];
  }

  // 2. Bairros mapeados para outras cidades específicas ("diadema:centro", "barueri:alphaville", etc.)
  const compositeKey = `${normC}:${normN}`;
  if (CITY_NEIGHBORHOOD_COORDS[compositeKey]) {
    const coords = CITY_NEIGHBORHOOD_COORDS[compositeKey];
    return [coords[0] + dLat * 0.2, coords[1] + dLng * 0.2];
  }

  // 3. Coordenada exata do município no Estado de SP (com micro-offset de ~300m para nunca sair do município)
  const cityCoords = findCityCoords(normC);
  if (cityCoords) {
    return [cityCoords[0] + dLat * 0.28, cityCoords[1] + dLng * 0.28];
  }

  // 4. Fallback estadual caso município não esteja listado
  const base = STATE_CENTERS[uf.toLowerCase()] || STATE_CENTERS.sp;
  return [base[0] + dLat * 0.5, base[1] + dLng * 0.5];
}

/**
 * Valida se a coordenada GPS vinda do leiloeiro é consistente com o município do lote.
 * Evita que coordenadas genéricas da praça/sede em São Paulo joguem lotes de Diadema/ABC/Interior dentro da Capital.
 */
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

  // Coordenada placeholder genérica do Superbid para Centro de SP (-23.555771, -46.639557)
  const isSuperbidDefaultPlaceholder =
    Math.abs(rawLat - -23.555771) < 0.002 && Math.abs(rawLng - -46.639557) < 0.002;
  if (isSuperbidDefaultPlaceholder) {
    return [resolvedLat, resolvedLng];
  }

  const normC = normalizeStr(city);
  const cityCenter = findCityCoords(normC);
  if (cityCenter) {
    const distFromCity = Math.hypot(rawLat - cityCenter[0], rawLng - cityCenter[1]);
    // Para cidades fora da Capital (ex: Diadema, São Caetano, Osasco), se o ponto estiver a mais de ~8km do centro da cidade, usa resolvedCoords
    const maxDistDeg = normC === "sao paulo" ? 0.16 : 0.075;
    if (distFromCity > maxDistDeg) {
      return [resolvedLat, resolvedLng];
    }
  }

  return [rawLat, rawLng];
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

/**
 * Garante que apenas leilões A VENCER (hoje ou no futuro) sejam aceitos,
 * descartando qualquer lote com data vencida/encerrada.
 */
function isAuctionUpcoming(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const clean = dateStr.trim().toLowerCase();
  if (clean.includes("proposta imediata")) return true;
  if (
    clean.includes("encerrad") ||
    clean.includes("vendid") ||
    clean.includes("suspens") ||
    clean.includes("cancelad") ||
    clean.includes("sustad")
  ) {
    return false;
  }

  // Formato brasileiro DD/MM/YYYY ou DD/MM/YY
  const brMatch = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (brMatch) {
    const day = parseInt(brMatch[1], 10);
    const month = parseInt(brMatch[2], 10);
    let year = parseInt(brMatch[3], 10);
    if (year < 100) year += 2000;
    const endOfAuctionDay = new Date(year, month - 1, day, 23, 59, 59).getTime();
    return endOfAuctionDay >= Date.now();
  }

  // Formato ISO YYYY-MM-DD
  const isoMatch = clean.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    const endOfAuctionDay = new Date(year, month - 1, day, 23, 59, 59).getTime();
    return endOfAuctionDay >= Date.now();
  }

  return true;
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

  // <div class="card open"> garante apenas lotes com pregão ABERTO no Mega Leilões
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
      auctionDate,
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

    const auctionDate = dateBlocks[dateBlocks.length - 1]?.[1]?.trim() || "Em aberto";
    if (!isAuctionUpcoming(auctionDate)) continue;

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
 * Raspa Superbid Exchange & Sold Leilões (Estado de SP — Apenas Imóveis, Paginado p/ 1..3 e Apenas Leilões a Vencer)
 */
export async function scrapeSuperbidAndSold(uf = "sp"): Promise<ScrapedAuctionLot[]> {
  if (uf.toLowerCase() !== "sp") return [];

  try {
    const pages = [1, 2, 3];
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
        if (Number.isFinite(endMs) && endMs < nowMs) {
          continue; // Lote já encerrado / vencido
        }
      }

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
        rawCityState.replace(/(?:\s*[-/]\s*SP)+$/gi, "").trim() || "São Paulo"
      );

      // Tenta extrair bairro da descrição curta (ex: "Apartamento - Vila Matilde - São Paulo/SP" ou "no bairro Jardim Edith em São Paulo/SP")
      const descParts = shortDesc
        .replace(/\.\s*$/, "")
        .split(/\s+-\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      let neighborhood = "Centro";
      const bairroRegexMatch =
        shortDesc.match(/no\s+bairro\s+([^,|-]+?)(?:\s*\([^)]+\))?\s+em\s+/i) ||
        shortDesc.match(/\|\s*([^|,]+?),\s*[^|,]+\/SP/i);
      if (bairroRegexMatch?.[1]?.trim()) {
        neighborhood = toTitleCase(bairroRegexMatch[1].trim());
      } else if (descParts.length >= 3) {
        neighborhood = toTitleCase(descParts[descParts.length - 2].replace(/\/SP$/i, ""));
      } else if (descParts.length === 2) {
        const candidate = descParts[1].replace(/\/SP$/i, "").replace(/^em\s+/i, "").trim();
        if (normalizeStr(candidate) !== normalizeStr(cityClean)) {
          neighborhood = toTitleCase(candidate);
        }
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
      // Filtra apenas leilões abertos e lotes em andamento
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

      const city = toTitleCase(item.lot_city || "São Paulo");
      const neighborhood = toTitleCase(item.lot_neighborhood || "Centro");
      const street = item.lot_street ? toTitleCase(item.lot_street) : "";
      const code = `SS-${item.lot_id || item.id}`;

      let rawLat: number | null = null;
      let rawLng: number | null = null;
      if (typeof item.lot_coordinates === "string" && item.lot_coordinates.includes(",")) {
        const [cLat, cLng] = item.lot_coordinates.split(",").map((s: string) => parseFloat(s.trim()));
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
 * Raspa Seu Imóvel BB — Banco do Brasil (Estado de SP — Apenas Imóveis, Paginado p/ 1..2)
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

    // Pagina pelas páginas 1 e 2 do catálogo de SP do Seu Imóvel BB
    const pages = ["1", "2"];
    const pageCards = await Promise.allSettled(
      pages.map(async (pagina) => {
        const form = new URLSearchParams({
          pagina,
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
        return (bbJson?.lista || "").split('<div class="card carta">').slice(1);
      })
    );

    const cards = pageCards.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    const results: ScrapedAuctionLot[] = [];

    for (const c of cards) {
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
      const city = toTitleCase(
        rawLoc
          .replace(/(?:\s*[-/]\s*SP)+$/gi, "")
          .replace(/Bernado/i, "Bernardo")
          .trim() || "São Paulo"
      );
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
 * Executa a raspagem unificada de todas as fontes em SP (apenas Imóveis e apenas leilões a vencer) com deduplicação
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
    if (!seenIds.has(lot.id) && isAuctionUpcoming(lot.auctionDate)) {
      seenIds.add(lot.id);
      combined.push(lot);
    }
  }

  combined.sort((a, b) => b.discountPct - a.discountPct);
  return combined;
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".next", "cache", "leiloes");
const SNAPSHOT_VERSION = "v4";

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

