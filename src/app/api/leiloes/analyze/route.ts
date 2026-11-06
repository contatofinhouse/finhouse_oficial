import { NextResponse } from "next/server";

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/id="[^"]*"/gi, " ")
    .replace(/class="[^"]*"/gi, " ")
    .replace(/data-[a-z0-9-]+="[^"]*"/gi, " ")
    .replace(/[a-z0-9-]+="[^"]*"/gi, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function scrapeLotDetailPage(sourceUrl: string) {
  const res = await fetch(sourceUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Não foi possível acessar a página do leilão (${res.status})`);
  }

  const html = await res.text();

  // Extrai links reais de PDFs (Edital, Matrícula, Laudo) priorizando o texto âncora e nome real
  const anchorMatches = [
    ...html.matchAll(
      /<a[^>]*href=["']([^"']+\.pdf(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/gi
    ),
  ];

  const seenUrls = new Set<string>();
  const documentsRead: { label: string; url: string }[] = [];

  for (const match of anchorMatches) {
    const rawUrl = match[1];
    const fullUrl = rawUrl.startsWith("http")
      ? rawUrl
      : new URL(rawUrl, sourceUrl).toString();

    const lower = fullUrl.toLowerCase();
    if (
      lower.includes("privacidade") ||
      lower.includes("modelo-de-proposta") ||
      seenUrls.has(fullUrl)
    ) {
      continue;
    }
    seenUrls.add(fullUrl);

    // Texto âncora visível no HTML (ex: "Edital de venda do imóvel", "Laudo de Avaliação", "Matricula")
    const anchorText = stripTags(match[2] || "").trim();

    let label = "";
    const anchorLower = anchorText.toLowerCase();

    if (anchorText && anchorText.length > 2 && anchorText.length < 50 && !anchorLower.includes("clique aqui")) {
      label = anchorText;
    } else if (anchorLower.includes("edital") || lower.includes("edital")) {
      label = "Edital de Venda / Leilão";
    } else if (anchorLower.includes("matr") || lower.includes("matricula")) {
      label = "Matrícula do Imóvel";
    } else if (anchorLower.includes("laudo") || lower.includes("laudo")) {
      label = "Laudo de Avaliação";
    } else {
      // Tenta extrair do nome do arquivo (ex: "I37795lote001Editaldevendadoimovel...pdf")
      const filename = fullUrl.split("/").pop()?.split("?")[0] || "";
      if (/edital/i.test(filename)) {
        label = "Edital de Venda";
      } else if (/matricula/i.test(filename)) {
        label = "Matrícula do Imóvel";
      } else if (/laudo/i.test(filename)) {
        label = "Laudo de Avaliação";
      } else {
        label = "Edital e Regulamento";
      }
    }

    // Normaliza acentos comuns
    if (label.toLowerCase() === "matricula") label = "Matrícula do Imóvel";
    if (label.toLowerCase() === "edital") label = "Edital de Venda";
    if (label.toLowerCase() === "laudo") label = "Laudo de Avaliação";

    documentsRead.push({ label, url: fullUrl });
  }

  // Fallback caso algum link de PDF não estivesse em tag <a> comum
  const rawPdfMatches = [
    ...new Set(html.match(/https?:\/\/[^"'\s>]+\.pdf/gi) || []),
  ];
  for (const url of rawPdfMatches) {
    const lower = url.toLowerCase();
    if (
      lower.includes("privacidade") ||
      lower.includes("modelo-de-proposta") ||
      seenUrls.has(url)
    ) {
      continue;
    }
    seenUrls.add(url);

    let label = "Edital de Venda";
    if (lower.includes("matricula")) label = "Matrícula do Imóvel";
    else if (lower.includes("laudo")) label = "Laudo de Avaliação";
    else if (lower.includes("edital")) label = "Edital de Venda";

    documentsRead.push({ label, url });
  }

  if (documentsRead.length === 0) {
    documentsRead.push({ label: "Página Oficial e Edital", url: sourceUrl });
  }

  // 1. Data oficial e exata de encerramento do lote
  let exactAuctionDate: string | null = null;

  // Portal Zuk: extrai da tag de data de ação do lote
  const zukActionMatch = html.match(
    /class="card-action-item-date"[^>]*>([\s\S]*?)<\/span>/i
  );
  if (zukActionMatch?.[1]) {
    const rawZukDate = stripTags(zukActionMatch[1]).trim();
    // Normaliza "09/11/26 às 12h18" para "09/11/2026 às 12:18"
    exactAuctionDate = rawZukDate
      .replace(/(\d{2}\/\d{2}\/)(\d{2})(\s*(?:às|as)\s*\d{2})h(\d{2})/i, "$120$2$3:$4")
      .replace(/h(\d{2})/i, ":$1");
  }

  // Mega Leilões: extrai da 2ª ou 1ª praça
  if (!exactAuctionDate) {
    const megaSecondMatch = html.match(
      /class="card-second-instance-date">[\s\S]*?<b>[^<]*<\/b>\s*([^<]+)/i
    );
    const megaFirstMatch = html.match(
      /class="card-first-instance-date">[\s\S]*?<b>[^<]*<\/b>\s*([^<]+)/i
    );
    const megaDate = (megaSecondMatch?.[1] || megaFirstMatch?.[1] || "").trim();
    if (megaDate) {
      exactAuctionDate = megaDate.replace(/\s+/g, " ").trim();
    }
  }

  // Fallback seguro: busca tags card-property-price-data ANTES de qualquer carrossel
  if (!exactAuctionDate) {
    const semIdx = html.indexOf("semelhantes");
    const topHtml = semIdx > -1 ? html.slice(0, semIdx) : html.slice(0, 45000);
    const priceDataMatches = [
      ...topHtml.matchAll(/class="card-property-price-data"[^>]*>([^<]+)/gi),
    ];
    if (priceDataMatches.length > 0) {
      exactAuctionDate = priceDataMatches[priceDataMatches.length - 1][1].trim();
    }
  }

  // Coordenadas exatas se disponíveis no HTML (ex: Portal Zuk)
  const latMatch = html.match(/var\s+maps_lat\s*=\s*(-?\d+\.\d+)/);
  const lngMatch = html.match(/var\s+maps_lng\s*=\s*(-?\d+\.\d+)/);
  const exactLat = latMatch ? parseFloat(latMatch[1]) : null;
  const exactLng = lngMatch ? parseFloat(lngMatch[1]) : null;

  // Extrai o texto jurídico relevante de forma ESTRITAMENTE ISOLADA (sem vazamento de outros lotes)
  let legalText = "";

  const megaDescIdx = html.indexOf('id="tab-description"');
  if (megaDescIdx > -1) {
    const sliceEnd = html.indexOf("</div>", megaDescIdx + 2000);
    const rawSlice = html.slice(megaDescIdx, sliceEnd > -1 ? sliceEnd + 3000 : megaDescIdx + 7000);
    // Remove a tag de abertura <div id="tab-description" ...> inteira antes de limpar
    const cleanTag = rawSlice.replace(/^[^>]*>/, "");
    legalText += stripTags(cleanTag) + "\n\n";
  }

  const zukDescIdx = html.indexOf("Descrição do imóvel");
  if (zukDescIdx > -1) {
    // Corta antes do carrossel ("card-property", "swiper-slide" ou "semelhantes")
    const nextCardIdx = html.indexOf('class="card-property', zukDescIdx + 150);
    const endSlice = nextCardIdx > -1 ? nextCardIdx : zukDescIdx + 5000;
    const rawSlice = html.slice(zukDescIdx, endSlice);
    const cleanTag = rawSlice.replace(/^[^>]*>/, "");
    legalText += stripTags(cleanTag) + "\n\n";
  }

  if (!legalText) {
    const semIdx = html.indexOf("semelhantes");
    const safeHtml = semIdx > -1 ? html.slice(0, semIdx) : html.slice(0, 15000);
    legalText = stripTags(safeHtml).slice(0, 6000);
  }

  // Extrai foto oficial de alta resolução (og:image)
  const ogImageMatch =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  const lotImage = ogImageMatch?.[1]?.trim() || null;

  return {
    legalText: legalText.slice(0, 7500),
    documentsRead,
    exactLat,
    exactLng,
    exactAuctionDate,
    lotImage,
  };
}

function buildSmartExtractionFromLegalText(
  legalText: string,
  title: string,
  modality: string,
  exactAuctionDate?: string | null
) {
  const lower = legalText.toLowerCase();

  // Matrícula
  const matMatch = legalText.match(/matr[íi]cula\s*n?[º°]?\s*([\d.]+[^,.;\n]{0,55})/i);
  const matriculaStatus = matMatch
    ? `Extraído do edital: Matrícula ${matMatch[1].trim()}.`
    : "Matrícula referenciada nos documentos oficiais do lote (ver PDF anexo).";

  // Ocupação
  const isDesocupado = lower.includes("desocupad");
  const isOcupado = lower.includes("ocupad") && !isDesocupado;
  const occupancy: "Desocupado" | "Ocupado" | "Ver no Edital" = isDesocupado
    ? "Desocupado"
    : isOcupado
    ? "Ocupado"
    : "Ocupado";

  // Dívidas (IPTU e Condomínio): extrai sentença factual de responsabilidade do edital
  let debts =
    "Verificar no edital a regra de quitação ou sub-rogação de débitos tributários e condominiais.";
  const debtMatch =
    legalText.match(
      /((?:eventuais débitos|débitos de condomínio|débitos de iptu|débitos condominiais)[^.]*\.(?:[^.]*pelo banco[^.]*\.)?)/i
    ) ||
    legalText.match(
      /((?:débitos|iptu)[^.]*(?:serão quitados|quitação|sub-roga|responsabilidade)[^.]*\.)/i
    );
  if (debtMatch?.[1] && !debtMatch[1].toLowerCase().includes("condomínio edifício")) {
    debts = debtMatch[1].trim();
  }

  // Alertas de gravames
  const hasUsufruto = lower.includes("usufruto");
  const hasAlienacao =
    lower.includes("alienação fiduciária") ||
    lower.includes("alienacao fiduciaria") ||
    lower.includes("cdhu");
  const hasPenhora = lower.includes("penhora") || lower.includes("indisponibilidade");

  let riskLevel: "baixo" | "medio" | "alto" = "baixo";
  let riskScore = 88;
  let lawyerAlert =
    "Recomendada conferência das certidões atualizadas e estratégia de imissão na posse por advogado especialista antes do lance.";

  if (hasUsufruto) {
    riskLevel = "alto";
    riskScore = 62;
    lawyerAlert =
      "Atenção: O texto do lote menciona USUFRUTO. É indispensável que o advogado verifique a baixa ou óbito do usufrutuário antes de ofertar lance.";
  } else if (hasAlienacao) {
    riskLevel = "medio";
    riskScore = 74;
    lawyerAlert =
      "Consta menção a Alienação Fiduciária / Direitos Aquisitivos no histórico do imóvel. O advogado deve validar se o saldo fiduciário é extinto ou assumido pelo arrematante.";
  } else if (hasPenhora || isOcupado) {
    riskLevel = "medio";
    riskScore = 79;
    lawyerAlert =
      "Imóvel requer diligência processual para baixa de eventuais gravames na matrícula e protocolo de imissão na posse pós-arrematação.";
  }

  const acceptsFinancing =
    lower.includes("financiamento") ||
    (!modality.toLowerCase().includes("judicial") && !hasAlienacao);

  const paymentRule =
    lower.includes("parcela") || modality.toLowerCase().includes("judicial")
      ? "À vista ou parcelamento (consulte regras do Art. 895 CPC ou parcelamento do comitente no edital)."
      : "À vista, recursos próprios ou financiamento imobiliário finHouse conforme regras do comitente.";

  // Data de encerramento: usa prioritariamente a data extraída do cabeçalho oficial do lote
  let finalAuctionDate = exactAuctionDate || "";
  if (!finalAuctionDate) {
    const dateMatch =
      legalText.match(/(?:encerramento|2ª praça|1ª praça|leilão dia)[^.\n]{0,60}?(\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s*às\s*\d{1,2}[:h]\d{2})?)/i);
    if (dateMatch?.[1]) {
      finalAuctionDate = dateMatch[1].trim();
    }
  }

  const cleanText = legalText
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Divide em frases completas para não cortar no meio com "..."
  const sentences = cleanText.split(/(?<=[.!?])\s+/);
  let summary = "";
  for (const s of sentences) {
    if ((summary + " " + s).trim().length <= 480) {
      summary = (summary + " " + s).trim();
    } else {
      break;
    }
  }

  if (!summary) {
    summary = cleanText.slice(0, 360).trim();
    if (!summary.endsWith(".")) summary += ".";
  }

  return {
    usedAiModel: null,
    riskLevel,
    riskScore,
    occupancy,
    acceptsFinancing,
    auctionDate: finalAuctionDate || undefined,
    aiSummary: summary,
    aiChecklist: {
      debts,
      matriculaStatus,
      paymentRule,
      lawyerAlert,
    },
  };
}

async function analyzeWithGemini(apiKey: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erro Gemini API (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJson) throw new Error("Resposta vazia do Gemini");
  return {
    ...JSON.parse(rawJson),
    usedAiModel: "Gemini 2.5 Flash",
  };
}

async function analyzeWithOpenAI(apiKey: string, prompt: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Você é um advogado especialista em leilões de imóveis no Brasil. Responda estritamente em JSON válido.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erro OpenAI API (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const rawJson = data?.choices?.[0]?.message?.content;
  if (!rawJson) throw new Error("Resposta vazia da OpenAI");
  return {
    ...JSON.parse(rawJson),
    usedAiModel: "OpenAI GPT-4o-mini",
  };
}

// Cache diário (24h) por lote para garantir consumo mínimo/zero de tokens por visitante
const DAILY_ANALYSIS_CACHE_TTL = 24 * 60 * 60 * 1000;
const dailyLotAnalysisCache = new Map<
  string,
  { timestamp: number; payload: Record<string, any> }
>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sourceUrl, title, modality, minBid, marketValue } = body;

    if (!sourceUrl) {
      return NextResponse.json(
        { error: "URL do leilão é obrigatória" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const cached = dailyLotAnalysisCache.get(sourceUrl);
    if (cached && now - cached.timestamp < DAILY_ANALYSIS_CACHE_TTL) {
      return NextResponse.json({
        ...cached.payload,
        cachedDaily: true,
      });
    }

    const apiKey =
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY?.trim() ||
      "";

    // 1. Raspa o texto oficial da matrícula/edital, data oficial, foto e os PDFs na página do leiloeiro
    const {
      legalText,
      documentsRead,
      exactLat,
      exactLng,
      exactAuctionDate,
      lotImage,
    } = await scrapeLotDetailPage(sourceUrl);

    // 2. Extração factual determinística como base (custo zero de tokens e zero alucinação)
    const factualBase = buildSmartExtractionFromLegalText(
      legalText,
      title || "",
      modality || "",
      exactAuctionDate
    );

    // 3. Se houver chave no servidor (.env.local), roda apenas 1x por dia por lote com prompt enxuto e factual
    if (apiKey) {
      const compactText = legalText.slice(0, 2200);
      const prompt = `Resuma de forma estritamente factual (sem emitir parecer jurídico opinativo) os dados extraídos deste edital de leilão em JSON:
{
  "occupancy": "Ocupado" | "Desocupado",
  "acceptsFinancing": boolean,
  "aiSummary": "Resumo factual objetivo em 2 frases descrevendo o imóvel e o que consta textualmente na descrição oficial.",
  "aiChecklist": {
    "debts": "O que o texto informa sobre responsabilidade de IPTU e Condomínio.",
    "matriculaStatus": "Número da matrícula, Cartório (CRI) e averbações citadas no texto.",
    "paymentRule": "Condições de pagamento mencionadas (à vista, parcelamento ou financiamento).",
    "lawyerAlert": "Quais certidões e pontos do processo um advogado especialista deve conferir nos autos antes do lance."
  }
}
Lote: ${title || ""} | Modalidade: ${modality || ""} | Lance: R$ ${minBid || 0}
Texto do Edital: """${compactText}"""`;

      try {
        const aiResult = apiKey.startsWith("sk-")
          ? await analyzeWithOpenAI(apiKey, prompt)
          : await analyzeWithGemini(apiKey, prompt);

        const finalPayload = {
          ...factualBase,
          ...aiResult,
          documentsRead,
          exactLat,
          exactLng,
          imageUrl: lotImage,
        };
        dailyLotAnalysisCache.set(sourceUrl, {
          timestamp: now,
          payload: finalPayload,
        });
        return NextResponse.json(finalPayload);
      } catch (aiErr: any) {
        console.error("Fallback para extração factual direta:", aiErr?.message);
      }
    }

    const fallbackPayload = {
      ...factualBase,
      documentsRead,
      exactLat,
      exactLng,
      imageUrl: lotImage,
    };

    dailyLotAnalysisCache.set(sourceUrl, {
      timestamp: now,
      payload: fallbackPayload,
    });

    return NextResponse.json(fallbackPayload);
  } catch (error: any) {
    console.error("Erro ao analisar lote:", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao analisar o edital do leilão" },
      { status: 500 }
    );
  }
}

