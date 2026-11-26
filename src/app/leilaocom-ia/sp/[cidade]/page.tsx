import type { Metadata } from "next";
import SpRegionalSeoView, {
  resolveRegionalSeoData,
} from "@/components/seo/SpRegionalSeoView";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cidade: string }>;
}): Promise<Metadata> {
  const { cidade } = await params;
  const data = await resolveRegionalSeoData(cidade);
  const { cityName, lots, maxDiscount, minBid, secondPracaCount } = data;

  const countPrefix = lots.length > 0 ? `${lots.length} ` : "";
  const discountSuffix =
    maxDiscount > 0 ? ` com até -${maxDiscount}%` : " com Análise de ROI";

  const title = `Leilão de Imóveis em ${cityName}/SP (${countPrefix}Oportunidades${discountSuffix})`;
  const description =
    lots.length > 0
      ? `Confira ${lots.length} imóveis em leilão judicial e extrajudicial em ${cityName}/SP (${secondPracaCount} em 2ª praça), a partir de ${
          minBid > 0
            ? minBid.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              })
            : "consulta no edital"
        }. Veja ROI, Lance Teto e edital na finHouse.`
      : `Explore imóveis em leilão judicial e extrajudicial em ${cityName}/SP consolidados dos maiores leiloeiros oficiais, com cálculo de ROI e Lance Teto na finHouse.`;

  const canonicalPath = `/leilaocom-ia/sp/${cidade}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${title} | finHouse`,
      description,
      url: `https://www.finhousebr.com.br${canonicalPath}`,
      type: "website",
    },
  };
}

export default async function LeilaoCidadeSpPage({
  params,
}: {
  params: Promise<{ cidade: string }>;
}) {
  const { cidade } = await params;
  return <SpRegionalSeoView cidadeSlug={cidade} />;
}
