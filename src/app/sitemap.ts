import type { MetadataRoute } from "next";
import { loadDailySnapshot } from "@/lib/leiloes-service";
import { slugifyTerm } from "@/lib/leiloes-utils";
import { SP_PRIORITY_CITIES } from "@/components/seo/SpRegionalSeoView";

const BASE_URL = "https://www.finhousebr.com.br";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/leilaocom-ia`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/leilaocom-ia/premium`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/imoveis`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/parceiros`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/anunciar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/bnb`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/lgpd`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/termos-e-condicoes`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Cidades prioritárias garantidas + todas as cidades e bairros ativos no snapshot diário de SP
  const citySlugs = new Set<string>(Object.keys(SP_PRIORITY_CITIES));
  const neighborhoodKeyCounts = new Map<string, number>();

  try {
    const snapshot = await loadDailySnapshot("sp");
    if (snapshot && Array.isArray(snapshot.lots)) {
      for (const lot of snapshot.lots) {
        const cSlug = slugifyTerm(lot.city);
        if (!cSlug) continue;
        citySlugs.add(cSlug);

        const nRaw = (lot.neighborhood || "").trim();
        const nSlug = slugifyTerm(nRaw);
        if (nSlug && nSlug !== "centro-geral" && nRaw.length >= 3) {
          const key = `${cSlug}/${nSlug}`;
          neighborhoodKeyCounts.set(
            key,
            (neighborhoodKeyCounts.get(key) || 0) + 1
          );
        }
      }
    }
  } catch {
    // Segue com a semente de cidades principais de SP caso o snapshot não esteja disponível no build
  }

  const cityRoutes: MetadataRoute.Sitemap = Array.from(citySlugs).map(
    (cSlug) => ({
      url: `${BASE_URL}/leilaocom-ia/sp/${cSlug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: cSlug === "sao-paulo" ? 0.9 : 0.85,
    })
  );

  // Inclui páginas de bairros que possuem pelo menos 2 imóveis ativos (evita thin content)
  const neighborhoodRoutes: MetadataRoute.Sitemap = Array.from(
    neighborhoodKeyCounts.entries()
  )
    .filter(([, count]) => count >= 2)
    .map(([pathPair]) => ({
      url: `${BASE_URL}/leilaocom-ia/sp/${pathPair}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.78,
    }));

  return [...staticRoutes, ...cityRoutes, ...neighborhoodRoutes];
}
