import type { Metadata } from "next";
import SpRegionalSeoView, {
  resolveRegionalSeoData,
} from "@/components/seo/SpRegionalSeoView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cidade: string; bairro: string }>;
}): Promise<Metadata> {
  const { cidade, bairro } = await params;
  const data = await resolveRegionalSeoData(cidade, bairro);
  const { cityName, bairroName, lots, maxDiscount, minBid } = data;
  const loc = `${bairroName || bairro}, ${cityName}/SP`;

  const countPrefix = lots.length > 0 ? `${lots.length} ` : "";
  const discountSuffix =
    maxDiscount > 0 ? ` (até -${maxDiscount}%)` : "";

  const title = `Leilão de Imóveis em ${loc} — ${countPrefix}Oportunidades${discountSuffix}`;
  const description =
    lots.length > 0
      ? `Veja ${lots.length} imóveis em leilão no bairro ${bairroName} em ${cityName}/SP, com lances a partir de ${
          minBid > 0
            ? minBid.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              })
            : "consulta no edital"
        }. Calcule ROI, Lance Teto e riscos do edital na finHouse.`
      : `Acompanhe imóveis em leilão judicial e extrajudicial no bairro ${bairroName} em ${cityName}/SP, com cálculo de ROI e Lance Teto na finHouse.`;

  const canonicalPath = `/leilaocom-ia/sp/${cidade}/${bairro}`;

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

export default async function LeilaoBairroSpPage({
  params,
}: {
  params: Promise<{ cidade: string; bairro: string }>;
}) {
  const { cidade, bairro } = await params;
  return <SpRegionalSeoView cidadeSlug={cidade} bairroSlug={bairro} />;
}
