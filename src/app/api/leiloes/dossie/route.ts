import { NextResponse } from "next/server";
import {
  loadDailySnapshot,
  runDailyScrape,
  saveDailySnapshot,
} from "@/lib/leiloes-service";
import { getServerUser, reserveOrLinkLotReport } from "@/lib/auth-server";
import { ScrapedAuctionLot } from "@/lib/leiloes-utils";
import {
  buildDefaultLegalMatrix,
  evaluateLotPreliminary,
  extractCondominiumName,
  LegalMatrixItem,
  simulateAuctionDeal,
  TrafficLight,
} from "@/lib/leiloes/financials";

export interface MarketComparableItem {
  title: string;
  priceLabel: string;
  sourcePortal: string;
  url?: string;
}

export interface MarketValuationResult {
  estimatedMarketPrice: number;
  estimatedPricePerM2: number;
  confidence: "Comparáveis Web" | "Referência Regional SP";
  methodologyNote: string;
  comparables: MarketComparableItem[];
}

export interface DeepDossierReport {
  lotId: string;
  generatedAt: string;
  cached: boolean;
  usedCredit: boolean;
  usedAiModel: string;
  verdict: {
    status: TrafficLight;
    score: number;
    headline: string;
    executiveSummary: string;
  };
  marketValuation?: MarketValuationResult;
  legalMatrix: LegalMatrixItem[];
  documentsRead: { label: string; url: string }[];
  lot: ScrapedAuctionLot;
}

const globalDossierCache = new Map<string, DeepDossierReport>();

function stripTags(html: string): string {
  return (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPdfBase64IfPossible(
  pdfUrl: string
): Promise<string | null> {
  try {
    const cleanUrl = pdfUrl.replace(/&amp;/g, "&").trim();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("pdf") && !cleanUrl.toLowerCase().includes(".pdf")) {
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength < 500 || arrayBuffer.byteLength > 5 * 1024 * 1024) {
      return null;
    }
    return Buffer.from(arrayBuffer).toString("base64");
  } catch {
    return null;
  }
}

async function scrapePageAndDocs(sourceUrl: string) {
  const docs: { label: string; url: string }[] = [];
  const seen = new Set<string>();
  const addDoc = (rawLabel: string, rawUrl: string) => {
    const cleanUrl = rawUrl.replace(/&amp;/g, "&").trim();
    if (!cleanUrl) return;
    const fullUrl = cleanUrl.startsWith("http")
      ? cleanUrl
      : cleanUrl.startsWith("//")
      ? `https:${cleanUrl}`
      : new URL(cleanUrl, sourceUrl).toString();
    if (seen.has(fullUrl) || fullUrl.toLowerCase().includes("privacidade")) {
      return;
    }
    seen.add(fullUrl);
    let label = stripTags(rawLabel || "").trim();
    if (!label || label.length > 56) label = "Documento PDF";
    if (/edital/i.test(fullUrl) || /edital/i.test(label)) {
      label = "Edital do Leilão";
    } else if (/matr/i.test(fullUrl) || /matr/i.test(label)) {
      label = "Matrícula do Imóvel";
    } else if (/laudo/i.test(fullUrl) || /laudo/i.test(label)) {
      label = "Laudo de Avaliação";
    } else if (/iptu|d[ée]bito/i.test(label)) {
      label = "Demonstrativo de Débitos / IPTU";
    }
    docs.push({ label, url: fullUrl });
  };

  try {
    // 1. Caso Superbid / Sold Leilões (SPA -> consulta direta na API oficial offer-query em ~150ms)
    const sbMatch = sourceUrl.match(/superbid\.net\/oferta\/(\d+)/i);
    if (sbMatch?.[1]) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(
        `https://offer-query.superbid.net/offers/?portalId=[2,15]&filter=id:${sbMatch[1]}`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        }
      );
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const offer = data?.offers?.[0];
        if (offer) {
          if (Array.isArray(offer.product?.attachments)) {
            for (const att of offer.product.attachments) {
              if (att?.link) {
                addDoc(att.originalFileName || "Matrícula / Anexo PDF", att.link);
              }
            }
          }
          const desc = stripTags(
            `${offer.offerDescription?.offerDescription || ""} ${
              offer.product?.detailedDescription || ""
            }`
          ).slice(0, 6500);
          return { legalText: desc, docs };
        }
      }
    }

    // 2. Caso Sodré Santoro (consulta API de anexos e condições de venda do leilão)
    const ssMatch = sourceUrl.match(/sodresantoro\.com\.br\/leilao\/(\d+)\/lote\/(\d+)/i);
    if (ssMatch?.[1]) {
      const auctionId = ssMatch[1];
      const [attRes, condRes] = await Promise.allSettled([
        fetch(
          `https://prd-api.sodresantoro.com.br/api/v1/site/attachments?auctionId=${auctionId}`,
          { headers: { "User-Agent": "Mozilla/5.0" } }
        ),
        fetch(
          `https://prd-api.sodresantoro.com.br/api/v1/site/conditions-of-sale?auctionId=${auctionId}`,
          { headers: { "User-Agent": "Mozilla/5.0" } }
        ),
      ]);
      let condText = "";
      if (attRes.status === "fulfilled" && attRes.value.ok) {
        const attData = await attRes.value.json().catch(() => ({}));
        if (Array.isArray(attData?.data)) {
          for (const a of attData.data) {
            if (a?.link) addDoc(a.name || "Edital / Anexo", a.link);
          }
        }
      }
      if (condRes.status === "fulfilled" && condRes.value.ok) {
        const condData = await condRes.value.json().catch(() => ({}));
        if (condData?.data?.text) {
          condText = stripTags(condData.data.text).slice(0, 5000);
        }
      }
      return { legalText: condText, docs };
    }

    // 3. Demais Leiloeiros (HTML SSR: Mega Leilões, Portal Zuk, Biasi, Frazão, Grupo Lance)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5500);
    const res = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return { legalText: "", docs: [] };

    const html = await res.text();

    // Se for Frazão Leilões, busca o endpoint /Sale/LotDocs com todos os PDFs (Edital, Matrícula, IPTU, Laudo)
    const frazaoDocsMatch = html.match(
      /id="LotDocs"[^>]*data-leilao-id="(\d+)"[^>]*data-lote-id="(\d+)"/i
    );
    if (frazaoDocsMatch?.[1] && frazaoDocsMatch?.[2]) {
      try {
        const fzRes = await fetch(
          `https://www.frazaoleiloes.com.br/Sale/LotDocs?loteId=${frazaoDocsMatch[2]}&leilaoId=${frazaoDocsMatch[1]}`,
          { headers: { "User-Agent": "Mozilla/5.0" } }
        );
        if (fzRes.ok) {
          const fzHtml = await fzRes.text();
          for (const fm of fzHtml.matchAll(
            /<a[^>]*href=["']([^"']+\.pdf(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/gi
          )) {
            addDoc(fm[2], fm[1]);
          }
        }
      } catch {}
    }

    // Links <a href="...pdf">
    const matches = [
      ...html.matchAll(
        /<a[^>]*href=["']([^"']+\.pdf(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/gi
      ),
    ];
    for (const m of matches) {
      addDoc(m[2], m[1]);
    }

    // Links diretos .pdf soltos no HTML (ex: CloudFront Portal Zuk ou CDNs)
    const rawPdfUrls = [
      ...html.matchAll(/(?:https?:)?\/\/[^"'\s<>]+\.pdf(?:\?[^"'\s<>]*)?/gi),
    ].map((m) => m[0]);
    for (const rawPdf of rawPdfUrls) {
      addDoc(rawPdf.split("/").pop()?.split("?")[0] || "Edital PDF", rawPdf);
    }

    const semIdx = html.indexOf("semelhantes");
    const safeHtml = semIdx > -1 ? html.slice(0, semIdx) : html.slice(0, 22000);
    const legalText = stripTags(safeHtml).slice(0, 6500);

    return { legalText, docs };
  } catch {
    return { legalText: "", docs: [] };
  }
}

async function generateMatrixWithAI(
  options: {
    geminiKey?: string;
    openRouterKey?: string;
    openRouterModel?: string;
  },
  lot: ScrapedAuctionLot,
  legalText: string,
  pdfBase64: string | null,
  defaultMatrix: LegalMatrixItem[]
): Promise<{
  legalMatrix: LegalMatrixItem[];
  executiveSummary: string;
  headline: string;
  occupancyStatus: "Desocupado" | "Ocupado" | "Ver no Edital";
  modelLabel: string;
} | null> {
  try {
    const prompt = `Você é um auditor jurídico-imobiliário especialista em leilões no Estado de São Paulo.
Analise os dados e o documento oficial deste lote e devolva um JSON estrito com:
{
  "headline": "Frase executiva direta de 1 linha sobre a viabilidade jurídica e financeira do lote",
  "executiveSummary": "Resumo factual de 2 a 3 frases sobre rito, dívidas, ocupação e ponto principal de atenção antes do lance.",
  "occupancyStatus": "Desocupado" | "Ocupado" | "Ver no Edital",
  "items": [
    {
      "id": "rito" | "iptu" | "condominio" | "ocupacao" | "pagamento" | "gravames" | "comissao" | "documentos",
      "level": "green" | "yellow" | "red",
      "statusLabel": "Rótulo curto de até 38 caracteres",
      "finding": "Explicação objetiva do que consta no edital/matrícula para este item",
      "citation": "Trecho literal curto ou referência factual extraída do texto",
      "pageRef": "Cláusula ou seção onde consta a informação"
    }
  ]
}
Regra para occupancyStatus: retorne "Desocupado" apenas se o texto/PDF afirmar que o imóvel está desocupado/vago/livre; retorne "Ocupado" se afirmar que está ocupado, locado ou na posse de terceiros/executados; retorne "Ver no Edital" somente se o documento realmente não informar o estado de ocupação.
Lote: ${lot.title} | Leiloeiro: ${lot.source} | Modalidade: ${lot.modality}
Lance Mínimo: R$ ${lot.minBid} | Avaliação: R$ ${lot.marketValue} | Deságio: ${lot.discountPct}%
Texto extraído da página/edital: """${legalText.slice(0, 4800)}"""`;

    let raw = "";
    let modelLabel = "Leitura da página e regras do Edital";

    if (options.openRouterKey) {
      const model = options.openRouterModel || "google/gemini-2.5-flash";
      const userContent = pdfBase64
        ? [
            { type: "text", text: prompt },
            {
              type: "file",
              file: {
                filename: "edital_matricula_lote.pdf",
                file_data: `data:application/pdf;base64,${pdfBase64}`,
              },
            },
          ]
        : prompt;

      const callOpenRouter = async (contentPayload: unknown, withPlugin: boolean) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 14000);
        try {
          return await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${options.openRouterKey}`,
              "HTTP-Referer": "https://www.finhouse.com.br",
              "X-Title": "finHouse Leilao com IA",
            },
            body: JSON.stringify({
              model,
              temperature: 0.15,
              response_format: { type: "json_object" },
              ...(withPlugin
                ? { plugins: [{ id: "file-parser", pdf: { engine: "pdf-text" } }] }
                : {}),
              messages: [
                {
                  role: "system",
                  content:
                    "Você é um auditor jurídico-imobiliário especialista em leilões no Estado de São Paulo. Responda estritamente em JSON válido, sem markdown.",
                },
                { role: "user", content: contentPayload },
              ],
            }),
          });
        } finally {
          clearTimeout(timeout);
        }
      };

      const isNativeMultimodal = /gemini|claude|gpt-4o/i.test(model);
      let res = await callOpenRouter(userContent, Boolean(pdfBase64 && !isNativeMultimodal));
      if (!res.ok && pdfBase64) {
        // Fallback rápido sem o anexo binário caso o PDF seja escaneado/grande demais para o parser de texto
        res = await callOpenRouter(prompt, false);
      }

      if (res.ok) {
        const data = await res.json();
        raw = data?.choices?.[0]?.message?.content || "";
        modelLabel = pdfBase64
          ? `Leitura completa de PDF e Edital (${model})`
          : `Análise Jurídica IA (${model})`;
      }
    }

    if (!raw && options.geminiKey) {
      const parts: Record<string, unknown>[] = [{ text: prompt }];
      if (pdfBase64) {
        parts.push({
          inline_data: {
            mime_type: "application/pdf",
            data: pdfBase64,
          },
        });
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        options.geminiKey
      )}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.15,
            responseMimeType: "application/json",
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        modelLabel = pdfBase64
          ? "Leitura completa de PDF e Edital (Gemini 2.5 Flash)"
          : "Leitura da página e regras do Edital (Gemini 2.5 Flash)";
      }
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    const aiItems: Record<string, Partial<LegalMatrixItem>> = {};
    if (Array.isArray(parsed.items)) {
      for (const it of parsed.items) {
        if (it?.id) aiItems[it.id] = it;
      }
    }

    const mergedMatrix = defaultMatrix.map((baseItem) => {
      const over = aiItems[baseItem.id];
      if (!over) return baseItem;
      return {
        ...baseItem,
        level:
          over.level === "green" || over.level === "yellow" || over.level === "red"
            ? over.level
            : baseItem.level,
        statusLabel: over.statusLabel || baseItem.statusLabel,
        finding: over.finding || baseItem.finding,
        citation: over.citation || baseItem.citation,
        pageRef: over.pageRef || baseItem.pageRef,
      };
    });

    const occRaw = String(parsed.occupancyStatus || "").toLowerCase();
    const occItemText = `${aiItems["ocupacao"]?.statusLabel || ""} ${
      aiItems["ocupacao"]?.finding || ""
    }`.toLowerCase();

    let occupancyStatus: "Desocupado" | "Ocupado" | "Ver no Edital" =
      lot.occupancy === "Desocupado" || lot.occupancy === "Ocupado"
        ? lot.occupancy
        : "Ver no Edital";

    if (occRaw === "desocupado") {
      occupancyStatus = "Desocupado";
    } else if (occRaw === "ocupado") {
      occupancyStatus = "Ocupado";
    } else if (
      occItemText.includes("desocupado") ||
      occItemText.includes("livre de ocup") ||
      occItemText.includes("vago")
    ) {
      occupancyStatus = "Desocupado";
    } else if (
      occItemText.includes("ocupado") ||
      occItemText.includes("locado") ||
      occItemText.includes("posse de terceiros")
    ) {
      occupancyStatus = "Ocupado";
    }

    return {
      legalMatrix: mergedMatrix,
      executiveSummary: parsed.executiveSummary || lot.aiSummary,
      headline:
        parsed.headline ||
        `Oportunidade com ${lot.discountPct}% de deságio em ${lot.neighborhood}, ${lot.city}`,
      occupancyStatus,
      modelLabel,
    };
  } catch {
    return null;
  }
}

async function fetchMarketComparablesWithGemini(
  apiKey: string,
  lot: ScrapedAuctionLot,
  areaM2: number,
  category: string,
  benchmarkM2: number,
  benchmarkTotalValue: number
): Promise<MarketValuationResult | null> {
  try {
    const condoName = extractCondominiumName(lot);
    const minArea = Math.max(15, Math.round(areaM2 * 0.8));
    const maxArea = Math.round(areaM2 * 1.2);

    const prompt = `Pesquise no Google anúncios atuais de venda de imóveis comparáveis (ZAP Imóveis, VivaReal, QuintoAndar, OLX, Loft, Imovelweb) para estimar o valor real de mercado deste imóvel em São Paulo:
Imóvel: ${lot.title}
${condoName ? `Nome do Edifício/Condomínio identificado: "${condoName}"` : ""}
Endereço: ${lot.address}
Bairro: ${lot.neighborhood} | Cidade: ${lot.city}/${lot.state}
Tipologia: ${category} | Área útil estimada: ${areaM2} m² (faixa comparável: ${minArea} a ${maxArea} m²)
Referência regional ajustada pela metragem: R$ ${benchmarkM2}/m² (total ~ R$ ${benchmarkTotalValue})

REGRAS ESTRITAS DE PESQUISA:
1. ${
      condoName
        ? `PRIORIDADE MÁXIMA: Pesquise primeiro por anúncios à venda no próprio "${condoName}" em ${lot.city} (ex: "${condoName} ${lot.city} a venda" ou "${condoName} apartamento"). Unidades do mesmo condomínio são a melhor referência.`
        : `Pesquise por anúncios de ${category} na mesma rua ou bairro (${lot.neighborhood}, ${lot.city}).`
    }
2. RESPEITE A FAIXA DE METRAGEM (${minArea} a ${maxArea} m²): Nunca use R$/m² de studio/compacto (≤42 m²) para avaliar apartamento grande (>120 m²), nem o contrário, pois o R$/m² varia muito conforme o tamanho da unidade no mesmo bairro.

Retorne APENAS um JSON válido (sem markdown extra) no formato:
{
  "estimatedPricePerM2": 12500,
  "estimatedMarketPrice": 862500,
  "methodologyNote": "Resumo curto de 1 frase dizendo se encontrou anúncios no mesmo condomínio ou na mesma faixa de metragem no bairro.",
  "comparables": [
    { "title": "Descrição curta do comparável (m² e condomínio/rua)", "priceLabel": "R$ 890.000 (70 m²)", "sourcePortal": "ZAP / VivaReal / OLX" }
  ]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.1,
        },
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    const rawPrice = Number(parsed.estimatedMarketPrice || 0);
    const rawM2 = Number(parsed.estimatedPricePerM2 || 0);
    if (rawPrice <= 10000 || rawM2 <= 500) return null;

    // Extrai eventuais URLs reais do groundingMetadata do Google Search
    const chunks: { web?: { uri?: string; title?: string } }[] =
      candidate?.groundingMetadata?.groundingChunks || [];
    const groundingUrls = chunks
      .map((c) => c.web?.uri)
      .filter((u): u is string => Boolean(u));

    const comparables: MarketComparableItem[] = Array.isArray(parsed.comparables)
      ? parsed.comparables.slice(0, 3).map((c: MarketComparableItem, idx: number) => ({
          title: String(c.title || "Imóvel comparável na região"),
          priceLabel: String(c.priceLabel || ""),
          sourcePortal: String(c.sourcePortal || "Portal Imobiliário"),
          url: groundingUrls[idx] || undefined,
        }))
      : [];

    return {
      estimatedMarketPrice: Math.round(rawPrice),
      estimatedPricePerM2: Math.round(rawM2),
      confidence: "Comparáveis Web",
      methodologyNote:
        String(parsed.methodologyNote || "") ||
        `Estimativa baseada em anúncios ativos na região de ${lot.neighborhood || lot.city}.`,
      comparables,
    };
  } catch {
    return null;
  }
}

async function findLotInSpSnapshot(
  rawLotId: string
): Promise<ScrapedAuctionLot | undefined> {
  const norm = decodeURIComponent(rawLotId || "").trim().toLowerCase();
  if (!norm) return undefined;

  let snapshot = await loadDailySnapshot("sp");
  if (!snapshot || snapshot.lots.length === 0) {
    const scraped = await runDailyScrape("sp");
    snapshot = await saveDailySnapshot("sp", scraped);
  }

  return snapshot.lots.find((l) => {
    const idLower = (l.id || "").toLowerCase();
    const codeLower = (l.code || "").toLowerCase();
    return (
      idLower === norm ||
      codeLower === norm ||
      idLower.endsWith(`-${norm}`) ||
      codeLower.endsWith(`-${norm}`)
    );
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lotId = searchParams.get("lotId");

  if (!lotId) {
    // Retorna lista de IDs que já estão em cache (0 crédito)
    return NextResponse.json({
      cachedLotIds: Array.from(globalDossierCache.keys()),
    });
  }

  const cached = globalDossierCache.get(lotId);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true, usedCredit: false });
  }

  const foundLot = await findLotInSpSnapshot(lotId);

  if (!foundLot) {
    return NextResponse.json({ error: "Lote não encontrado" }, { status: 404 });
  }

  const prelim = evaluateLotPreliminary(foundLot, false);
  const sim = simulateAuctionDeal(foundLot);
  const defaultMatrix = buildDefaultLegalMatrix(foundLot);

  const report: DeepDossierReport = {
    lotId: foundLot.id,
    generatedAt: new Date().toISOString(),
    cached: false,
    usedCredit: false,
    usedAiModel: "Análise Preliminar do Lote",
    verdict: {
      status: prelim.verdictStatus,
      score: prelim.prelimScore,
      headline: `${prelim.verdictLabel} · Lance Teto Recomendado: R$ ${sim.maxRecommendedBid.toLocaleString(
        "pt-BR"
      )}`,
      executiveSummary: foundLot.aiSummary,
    },
    marketValuation: {
      estimatedMarketPrice: sim.benchmarkTotalValue,
      estimatedPricePerM2: sim.benchmarkM2,
      confidence: "Referência Regional SP",
      methodologyNote: `${sim.benchmarkLabel} aplicado sobre ${sim.estimatedAreaM2} m².`,
      comparables: [],
    },
    legalMatrix: defaultMatrix,
    documentsRead: foundLot.documentsRead || [],
    lot: foundLot,
  };

  return NextResponse.json(report);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lotId, lot: clientLot } = body as {
      lotId?: string;
      lot?: ScrapedAuctionLot;
    };

    const resolvedLot =
      (lotId ? await findLotInSpSnapshot(lotId) : undefined) || clientLot;

    if (!resolvedLot) {
      return NextResponse.json(
        { error: "Lote não encontrado na base de SP" },
        { status: 404 }
      );
    }

    const serverUser = await getServerUser(req);
    const existing = globalDossierCache.get(resolvedLot.id);
    if (existing) {
      if (serverUser) {
        const check = await reserveOrLinkLotReport(serverUser, resolvedLot.id, true);
        if (!check.ok) {
          return NextResponse.json(
            {
              error: "Seu período de 15 dias de teste expirou.",
              code: "TRIAL_EXPIRED",
            },
            { status: 403 }
          );
        }
      }
      return NextResponse.json({
        ...existing,
        cached: true,
        usedCredit: false,
      });
    }

    if (serverUser) {
      const check = await reserveOrLinkLotReport(serverUser, resolvedLot.id, false);
      if (!check.ok) {
        if (check.code === "expired") {
          return NextResponse.json(
            {
              error: "Seu período de 15 dias de teste expirou.",
              code: "TRIAL_EXPIRED",
            },
            { status: 403 }
          );
        }
        return NextResponse.json(
          {
            error:
              "Detectamos um volume incomum de requisições automáticas em curto intervalo. Aguarde alguns instantes ou consulte os dossiês já abertos.",
            code: "FAIR_USE_LIMIT_REACHED",
          },
          { status: 429 }
        );
      }
    }

    const prelim = evaluateLotPreliminary(resolvedLot, true);
    const sim = simulateAuctionDeal(resolvedLot);
    const defaultMatrix = buildDefaultLegalMatrix(resolvedLot);

    const { legalText, docs } = await scrapePageAndDocs(resolvedLot.sourceUrl);
    const mergedDocs =
      docs.length > 0 ? docs : resolvedLot.documentsRead || [];

    const geminiKey = process.env.GEMINI_API_KEY?.trim() || "";
    const openRouterKey = process.env.OPENROUTER_API_KEY?.trim() || "";
    const openRouterModel =
      process.env.OPENROUTER_MODEL?.trim() || "google/gemini-2.5-flash";
    let usedAiModel = "Baseado nos dados do lote e edital";
    let finalMatrix = defaultMatrix;
    let headline = `${prelim.verdictLabel} · Margem projetada de ${sim.scenarios.minBid.netMarginPct}% no lance mínimo`;
    let executiveSummary = resolvedLot.aiSummary;
    let resolvedOccupancy: "Desocupado" | "Ocupado" | "Ver no Edital" =
      resolvedLot.occupancy === "Desocupado" ||
      resolvedLot.occupancy === "Ocupado"
        ? resolvedLot.occupancy
        : "Ver no Edital";

    if (resolvedOccupancy === "Ver no Edital" && legalText) {
      const lowerText = legalText.toLowerCase();
      if (
        lowerText.includes("imóvel desocupado") ||
        lowerText.includes("encontra-se desocupado") ||
        lowerText.includes("livre de pessoas e coisas")
      ) {
        resolvedOccupancy = "Desocupado";
      } else if (
        lowerText.includes("imóvel ocupado") ||
        lowerText.includes("encontra-se ocupado")
      ) {
        resolvedOccupancy = "Ocupado";
      }
    }

    let marketValuation: MarketValuationResult = {
      estimatedMarketPrice: sim.benchmarkTotalValue,
      estimatedPricePerM2: sim.benchmarkM2,
      confidence: "Referência Regional SP",
      methodologyNote: `${sim.benchmarkLabel} aplicado sobre ${sim.estimatedAreaM2} m².`,
      comparables: [],
    };

    if (openRouterKey || geminiKey) {
      const priorityPdfDoc =
        mergedDocs.find(
          (d) =>
            d.url.toLowerCase().includes(".pdf") &&
            /edital|matr/i.test(d.label)
        ) ||
        mergedDocs.find((d) => d.url.toLowerCase().includes(".pdf"));
      const pdfBase64 = priorityPdfDoc
        ? await fetchPdfBase64IfPossible(priorityPdfDoc.url)
        : null;

      const [aiEnhanced, webValuation] = await Promise.all([
        legalText.length > 80 || mergedDocs.length > 0
          ? generateMatrixWithAI(
              { geminiKey, openRouterKey, openRouterModel },
              resolvedLot,
              legalText || resolvedLot.aiSummary,
              pdfBase64,
              defaultMatrix
            )
          : Promise.resolve(null),
        geminiKey
          ? fetchMarketComparablesWithGemini(
              geminiKey,
              resolvedLot,
              sim.estimatedAreaM2,
              sim.propertyCategory,
              sim.benchmarkM2,
              sim.benchmarkTotalValue
            )
          : Promise.resolve(null),
      ]);

      if (aiEnhanced) {
        finalMatrix = aiEnhanced.legalMatrix;
        executiveSummary = aiEnhanced.executiveSummary;
        headline = aiEnhanced.headline;
        resolvedOccupancy = aiEnhanced.occupancyStatus;
        usedAiModel = aiEnhanced.modelLabel;
      }

      if (webValuation) {
        marketValuation = webValuation;
      }
    }

    const finalLot: ScrapedAuctionLot = {
      ...resolvedLot,
      occupancy: resolvedOccupancy,
      aiSummary: executiveSummary,
      documentsRead: mergedDocs,
    };

    const report: DeepDossierReport = {
      lotId: resolvedLot.id,
      generatedAt: new Date().toISOString(),
      cached: false,
      usedCredit: true,
      usedAiModel,
      verdict: {
        status: prelim.verdictStatus,
        score: prelim.prelimScore,
        headline,
        executiveSummary,
      },
      marketValuation,
      legalMatrix: finalMatrix,
      documentsRead: mergedDocs,
      lot: finalLot,
    };

    globalDossierCache.set(resolvedLot.id, report);
    return NextResponse.json(report);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro ao gerar dossiê profundo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

