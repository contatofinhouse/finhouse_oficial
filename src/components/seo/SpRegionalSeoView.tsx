import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  BarChart3,
  ChevronRight,
  Landmark,
  ExternalLink,
  Lock,
  Calendar,
} from "lucide-react";
import Footer from "@/components/Footer";
import {
  loadDailySnapshot,
  runDailyScrape,
  saveDailySnapshot,
  type ScrapedAuctionLot,
} from "@/lib/leiloes-service";
import {
  isLotInSecondPraca,
  slugifyTerm,
  withFinhouseUtm,
} from "@/lib/leiloes-utils";

export const SP_PRIORITY_CITIES: Record<string, string> = {
  "sao-paulo": "São Paulo",
  campinas: "Campinas",
  guarulhos: "Guarulhos",
  "sao-bernardo-do-campo": "São Bernardo do Campo",
  "santo-andre": "Santo André",
  santos: "Santos",
  "sao-jose-dos-campos": "São José dos Campos",
  sorocaba: "Sorocaba",
  "ribeirao-preto": "Ribeirão Preto",
  osasco: "Osasco",
  jundiai: "Jundiaí",
  piracicaba: "Piracicaba",
  barueri: "Barueri",
  "praia-grande": "Praia Grande",
  guaruja: "Guarujá",
  "sao-caetano-do-sul": "São Caetano do Sul",
  bauru: "Bauru",
  "sao-jose-do-rio-preto": "São José do Rio Preto",
  "mogi-das-cruzes": "Mogi das Cruzes",
  diadema: "Diadema",
  cotia: "Cotia",
  indaiatuba: "Indaiatuba",
  taubate: "Taubaté",
  suzano: "Suzano",
  "taboao-da-serra": "Taboão da Serra",
  americana: "Americana",
  itu: "Itu",
  atibaia: "Atibaia",
  "braganca-paulista": "Bragança Paulista",
  vinhedo: "Vinhedo",
  valinhos: "Valinhos",
  "sao-vicente": "São Vicente",
  caraguatatuba: "Caraguatatuba",
  ubatuba: "Ubatuba",
  bertioga: "Bertioga",
  marilia: "Marília",
  limeira: "Limeira",
  araraquara: "Araraquara",
  "sao-carlos": "São Carlos",
  franca: "Franca",
};

function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
}

function unslugifyFallback(slug: string): string {
  if (SP_PRIORITY_CITIES[slug]) return SP_PRIORITY_CITIES[slug];
  return slug
    .split("-")
    .filter(Boolean)
    .map((w, i) =>
      i > 0 && ["de", "da", "do", "das", "dos"].includes(w)
        ? w
        : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(" ");
}

export async function getSpLotsServerSnapshot(): Promise<{
  lots: ScrapedAuctionLot[];
  updatedAt: string;
}> {
  try {
    const existing = await loadDailySnapshot("sp");
    if (existing && existing.lots.length > 0) {
      return { lots: existing.lots, updatedAt: existing.updatedAt };
    }
    const fresh = await runDailyScrape("sp");
    const saved = await saveDailySnapshot("sp", fresh);
    return { lots: saved.lots, updatedAt: saved.updatedAt };
  } catch {
    return { lots: [], updatedAt: "Hoje" };
  }
}

export async function resolveRegionalSeoData(
  cidadeSlug: string,
  bairroSlug?: string
) {
  const { lots, updatedAt } = await getSpLotsServerSnapshot();

  const cityLots = lots.filter(
    (lot) => slugifyTerm(lot.city) === cidadeSlug
  );

  const cityName =
    cityLots[0]?.city || unslugifyFallback(cidadeSlug);

  const matchedLots = bairroSlug
    ? cityLots.filter(
        (lot) => slugifyTerm(lot.neighborhood) === bairroSlug
      )
    : cityLots;

  const bairroName = bairroSlug
    ? matchedLots[0]?.neighborhood || unslugifyFallback(bairroSlug)
    : null;

  // Estatísticas da seleção atual
  const secondPracaCount = matchedLots.filter((l) =>
    isLotInSecondPraca(l)
  ).length;
  const validPrices = matchedLots
    .map((l) => l.minBid)
    .filter((p) => p > 0);
  const minBid =
    validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const maxDiscount = matchedLots.reduce(
    (acc, l) => Math.max(acc, l.discountPct || 0),
    0
  );
  const activeSources = Array.from(
    new Set(matchedLots.map((l) => l.source))
  );

  // Bairros da cidade (para links internos de cauda longa)
  const neighborhoodCounts = new Map<
    string,
    { name: string; slug: string; count: number }
  >();
  for (const l of cityLots) {
    const rawN = (l.neighborhood || "").trim();
    const nSlug = slugifyTerm(rawN);
    if (!rawN || !nSlug || nSlug === "centro-geral" || rawN.length < 3) continue;
    const prev = neighborhoodCounts.get(nSlug);
    if (!prev) {
      neighborhoodCounts.set(nSlug, { name: rawN, slug: nSlug, count: 1 });
    } else {
      prev.count += 1;
    }
  }
  const topNeighborhoods = Array.from(neighborhoodCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 24);

  // Ranking geral de cidades em SP (para malha interna de links SEO)
  const cityCounts = new Map<
    string,
    { name: string; slug: string; count: number; minBid: number; maxDiscount: number }
  >();
  for (const l of lots) {
    const rawC = (l.city || "").trim();
    const cSlug = slugifyTerm(rawC);
    if (!rawC || !cSlug) continue;
    const prev = cityCounts.get(cSlug);
    if (!prev) {
      cityCounts.set(cSlug, {
        name: rawC,
        slug: cSlug,
        count: 1,
        minBid: l.minBid || 0,
        maxDiscount: l.discountPct || 0,
      });
    } else {
      prev.count += 1;
      if (l.minBid > 0 && (prev.minBid === 0 || l.minBid < prev.minBid)) {
        prev.minBid = l.minBid;
      }
      if ((l.discountPct || 0) > prev.maxDiscount) {
        prev.maxDiscount = l.discountPct || 0;
      }
    }
  }
  const otherSpCities = Array.from(cityCounts.values())
    .filter((c) => c.slug !== cidadeSlug)
    .sort((a, b) => b.count - a.count)
    .slice(0, 24);

  // Ordena lotes da página pelos melhores descontos primeiro
  const sortedLots = [...matchedLots].sort(
    (a, b) => (b.discountPct || 0) - (a.discountPct || 0)
  );

  return {
    cityName,
    cidadeSlug,
    bairroName,
    bairroSlug: bairroSlug || null,
    updatedAt,
    lots: sortedLots,
    totalSpLots: lots.length,
    secondPracaCount,
    minBid,
    maxDiscount,
    activeSources,
    topNeighborhoods,
    otherSpCities,
  };
}

export default async function SpRegionalSeoView({
  cidadeSlug,
  bairroSlug,
}: {
  cidadeSlug: string;
  bairroSlug?: string;
}) {
  const data = await resolveRegionalSeoData(cidadeSlug, bairroSlug);
  const {
    cityName,
    bairroName,
    updatedAt,
    lots,
    secondPracaCount,
    minBid,
    maxDiscount,
    activeSources,
    topNeighborhoods,
    otherSpCities,
  } = data;

  const locationLabel = bairroName
    ? `${bairroName}, ${cityName}/SP`
    : `${cityName}/SP`;

  const mapHref = bairroName
    ? `/leilaocom-ia?cidade=${encodeURIComponent(
        cityName
      )}&busca=${encodeURIComponent(bairroName)}`
    : `/leilaocom-ia?cidade=${encodeURIComponent(cityName)}`;

  const screenerHref = `/leilaocom-ia/premium?cidade=${encodeURIComponent(
    cityName
  )}`;

  const pageUrl = bairroSlug
    ? `https://www.finhousebr.com.br/leilaocom-ia/sp/${cidadeSlug}/${bairroSlug}`
    : `https://www.finhousebr.com.br/leilaocom-ia/sp/${cidadeSlug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "finHouse",
            item: "https://www.finhousebr.com.br",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Leilão de Imóveis em SP",
            item: "https://www.finhousebr.com.br/leilaocom-ia",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `Leilões em ${cityName}`,
            item: `https://www.finhousebr.com.br/leilaocom-ia/sp/${cidadeSlug}`,
          },
          ...(bairroName && bairroSlug
            ? [
                {
                  "@type": "ListItem",
                  position: 4,
                  name: bairroName,
                  item: pageUrl,
                },
              ]
            : []),
        ],
      },
      {
        "@type": "ItemList",
        name: `Imóveis em Leilão em ${locationLabel}`,
        numberOfItems: lots.length,
        itemListElement: lots.slice(0, 20).map((lot, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: lot.title,
          url: `https://www.finhousebr.com.br/leilaocom-ia?lote=${encodeURIComponent(
            lot.id
          )}`,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `Quantos imóveis em leilão estão ativos hoje em ${locationLabel}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text:
                lots.length > 0
                  ? `Atualmente existem ${lots.length} imóveis em leilão monitorados em ${locationLabel} (${secondPracaCount} em 2ª praça), com lances mínimos a partir de ${
                      minBid > 0 ? formatBRL(minBid) : "consulta no edital"
                    } e descontos de até ${maxDiscount}%.`
                  : `A base estadual da finHouse é sincronizada diariamente nos principais leiloeiros oficiais de São Paulo para identificar novas praças em ${locationLabel}.`,
            },
          },
          {
            "@type": "Question",
            name: `Como calcular ROI e Lance Teto para leilões em ${cityName}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Na finHouse você analisa gratuitamente por 15 dias o Dossiê Completo de cada lote em ${cityName}, incluindo leitura de edital e matrícula, dívidas de IPTU/condomínio, Lance Teto seguro e ROI descontando ITBI, comissão de 5% do leiloeiro, cartório e reforma.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header Minimalista Institucional */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-[1280px] mx-auto h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image
                src="/logo.png"
                alt="finHouse"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="text-[17px] sm:text-[19px] font-semibold tracking-[-0.02em] text-[#222222]">
                finHouse
              </span>
            </Link>
            <span className="h-4 w-px bg-[#E2E8F0]" aria-hidden="true" />
            <Link
              href="/leilaocom-ia"
              className="flex items-center gap-1.5 shrink-0"
            >
              <span className="text-[15px] sm:text-[17px] tracking-[-0.02em] flex items-baseline">
                <span className="font-semibold text-[#222222]">leilão</span>
                <span className="font-normal text-[#717171] text-[13px] mx-1">
                  com
                </span>
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#0F2744] text-white text-[10px] sm:text-[11px] font-bold">
                IA
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={mapHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#CBD5E1] hover:border-[#0F2744] bg-white text-[#0F172A] text-xs font-semibold transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-[#0F3B78]" />
              <span>Mapa</span>
            </Link>
            <Link
              href={screenerHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0F2744] hover:bg-[#0A1B30] text-white text-xs font-semibold transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Comparar ROI</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 flex-1">
        {/* Breadcrumb + Hero Regional */}
        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-7 space-y-5 shadow-2xs">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs text-[#64748B]"
          >
            <Link href="/leilaocom-ia" className="hover:text-[#0F172A]">
              Leilões SP
            </Link>
            <span>/</span>
            {bairroName ? (
              <>
                <Link
                  href={`/leilaocom-ia/sp/${cidadeSlug}`}
                  className="hover:text-[#0F172A]"
                >
                  {cityName}
                </Link>
                <span>/</span>
                <span className="font-semibold text-[#0F172A]">
                  {bairroName}
                </span>
              </>
            ) : (
              <span className="font-semibold text-[#0F172A]">{cityName}</span>
            )}
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <h1 className="text-xl sm:text-3xl font-bold tracking-[-0.02em] text-[#0F172A]">
                Leilão de Imóveis em {locationLabel}
              </h1>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                {lots.length > 0 ? (
                  <>
                    Encontre <strong>{lots.length} imóveis em leilão</strong>{" "}
                    ativos em {locationLabel} consolidados de{" "}
                    {activeSources.join(", ")} (atualizado em {updatedAt}).
                    Compare descontos de 2ª praça, descubra o{" "}
                    <strong>ROI</strong> e calcule o <strong>Lance Teto</strong>{" "}
                    antes de ofertar.
                  </>
                ) : (
                  <>
                    Acompanhe oportunidades de leilão judicial e extrajudicial
                    em {locationLabel}. Explore abaixo outras regiões próximas
                    com lotes ativos no Estado de São Paulo.
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href={mapHref}
                className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] hover:border-[#0F2744] bg-white text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[#0F3B78]" />
                <span>Abrir {cityName} no Mapa</span>
              </Link>
              <Link
                href={screenerHref}
                className="px-4 py-2.5 rounded-xl bg-[#0F2744] hover:bg-[#0A1B30] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Ranking de ROI (15d grátis)</span>
              </Link>
            </div>
          </div>

          {/* 4 Indicadores Regionais */}
          {lots.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="text-[11px] text-[#64748B]">Imóveis Ativos</div>
                <div className="text-lg font-bold text-[#0F172A] mt-0.5 tabular-nums">
                  {lots.length}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="text-[11px] text-[#64748B]">Em 2ª Praça</div>
                <div className="text-lg font-bold text-[#0F2744] mt-0.5 tabular-nums">
                  {secondPracaCount}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="text-[11px] text-[#64748B]">Lance Inicial</div>
                <div className="text-lg font-bold text-[#0F172A] mt-0.5 tabular-nums">
                  {minBid > 0 ? formatBRL(minBid) : "No Edital"}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
                <div className="text-[11px] text-emerald-900">Maior Deságio</div>
                <div className="text-lg font-bold text-emerald-700 mt-0.5 tabular-nums">
                  {maxDiscount > 0 ? `-${maxDiscount}%` : "1ª Praça"}
                </div>
              </div>
            </div>
          )}

          {/* Malha de Bairros de {cityName} */}
          {topNeighborhoods.length > 1 && (
            <div className="pt-3 border-t border-[#F1F5F9] space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Bairros com imóveis em leilão em {cityName}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {bairroSlug && (
                  <Link
                    href={`/leilaocom-ia/sp/${cidadeSlug}`}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border border-[#CBD5E1] bg-white hover:border-[#0F2744] text-[#0F172A]"
                  >
                    Todos em {cityName}
                  </Link>
                )}
                {topNeighborhoods.map((n) => {
                  const active = n.slug === bairroSlug;
                  return (
                    <Link
                      key={n.slug}
                      href={`/leilaocom-ia/sp/${cidadeSlug}/${n.slug}`}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? "bg-[#0F2744] text-white border-[#0F2744]"
                          : "bg-[#F8FAFC] hover:bg-white text-[#334155] border-[#E2E8F0] hover:border-[#CBD5E1]"
                      }`}
                    >
                      {n.name} ({n.count})
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Grade SSR de Lotes Ativos */}
        {lots.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                Oportunidades Disponíveis em {locationLabel}
              </h2>
              <span className="text-xs text-[#64748B]">
                Ordenado por maior desconto
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lots.map((lot) => {
                const secondStage = isLotInSecondPraca(lot);
                return (
                  <article
                    key={lot.id}
                    className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-44 w-full bg-slate-100">
                        {lot.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={lot.imageUrl}
                            alt={lot.title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <Landmark className="w-9 h-9 stroke-[1.5]" />
                            <span className="text-[11px] mt-1">
                              Foto oficial no edital
                            </span>
                          </div>
                        )}

                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            {lot.discountPct > 0 && (
                              <span className="bg-emerald-600/95 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                -{lot.discountPct}% OFF
                              </span>
                            )}
                            {secondStage && (
                              <span className="bg-[#0F2744]/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                2ª Praça
                              </span>
                            )}
                          </div>
                          <span className="bg-slate-900/75 text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full">
                            {lot.source}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-2.5">
                        <div>
                          <div className="text-[11px] font-medium text-[#64748B]">
                            {lot.modality} · Lote {lot.code}
                          </div>
                          <h3 className="text-sm font-bold text-[#0F172A] line-clamp-2 leading-snug mt-0.5">
                            <Link
                              href={`/leilaocom-ia?lote=${encodeURIComponent(
                                lot.id
                              )}`}
                              className="hover:text-[#0F3B78]"
                            >
                              {lot.title}
                            </Link>
                          </h3>
                          <p className="text-xs text-[#475569] truncate mt-1">
                            {lot.address}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-[#64748B]">
                          <span className="inline-flex items-center gap-1 truncate">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {lot.auctionDate || "Consultar edital"}
                          </span>
                          {lot.areaM2 && (
                            <span className="font-semibold text-[#0F172A] shrink-0">
                              {lot.areaM2} m²
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/leilaocom-ia/premium/analise/${encodeURIComponent(
                            lot.id
                          )}`}
                          className="px-2.5 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-between gap-2 text-[11px] transition-colors"
                        >
                          <span className="flex items-center gap-1.5 text-[#475569] truncate">
                            <Lock className="w-3 h-3 text-[#0F2744] shrink-0" />
                            <span className="truncate">
                              ROI e Lance Teto no Dossiê
                            </span>
                          </span>
                          <span className="font-semibold text-emerald-700 shrink-0">
                            15d grátis
                          </span>
                        </Link>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2.5 border-t border-[#F1F5F9] flex items-end justify-between gap-2">
                      <div>
                        <div className="text-[11px] text-[#64748B]">
                          Lance Mínimo
                        </div>
                        <div className="text-base font-bold text-[#0F172A]">
                          {lot.minBid > 0
                            ? formatBRL(lot.minBid)
                            : "Ver Edital"}
                        </div>
                        {lot.marketValue > lot.minBid && (
                          <div className="text-[11px] text-[#94A3B8] line-through">
                            Avaliação: {formatBRL(lot.marketValue)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={withFinhouseUtm(
                            lot.sourceUrl,
                            `seo_${cidadeSlug}`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir no site do leiloeiro"
                          className="p-2 rounded-xl border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A] hover:bg-slate-50 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <Link
                          href={`/leilaocom-ia/premium/analise/${encodeURIComponent(
                            lot.id
                          )}`}
                          className="px-3 py-2 rounded-xl bg-[#0F2744] hover:bg-[#0A1B30] text-white text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <span>Ver Dossiê</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center space-y-3">
            <h2 className="text-base font-bold text-[#0F172A]">
              Sem lotes abertos hoje em {locationLabel}
            </h2>
            <p className="text-xs text-[#64748B] max-w-lg mx-auto">
              Novos editais são sincronizados diariamente nos 8 maiores
              leiloeiros oficiais. Explore o mapa estadual ou confira abaixo as
              cidades paulistas com maior estoque ativo hoje.
            </p>
            <div>
              <Link
                href="/leilaocom-ia"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F2744] text-white text-xs font-bold"
              >
                <span>Explorar Mapa Completo de SP</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        )}

        {/* Malha Interna de SEO: Outras Cidades de SP com Leilões Ativos */}
        {otherSpCities.length > 0 && (
          <section className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F3B78]">
                Cobertura Estadual SP
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A] mt-0.5">
                Leilões de Imóveis em Outras Cidades de São Paulo
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {otherSpCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/leilaocom-ia/sp/${c.slug}`}
                  className="p-3 rounded-xl bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#0F2744]/40 transition-all space-y-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[#0F172A] truncate">
                      {c.name}
                    </span>
                    <span className="text-[10px] font-semibold text-[#0F2744] bg-white border border-[#E2E8F0] px-1.5 py-0.5 rounded shrink-0">
                      {c.count}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#475569] truncate">
                    {c.minBid > 0
                      ? `Desde ${formatBRL(c.minBid)}`
                      : "Ver lotes"}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
