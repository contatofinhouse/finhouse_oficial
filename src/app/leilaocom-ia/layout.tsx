import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leilão de Imóveis em SP com IA — Mapa Interativo e Análise de Edital",
  description:
    "Explore no mapa mais de 500 imóveis em leilão judicial e extrajudicial no Estado de São Paulo (Mega Leilões, Portal Zuk, Superbid e Sold). Calcule o Lance Teto e teste 15 dias grátis o Módulo Premium.",
  alternates: {
    canonical: "/leilaocom-ia",
  },
  openGraph: {
    title: "Leilão de Imóveis em SP com IA | finHouse",
    description:
      "Mapa interativo com 500+ oportunidades em leilão em SP, filtro de 2ª praça, análise jurídica de edital com IA e cálculo de Lance Teto.",
    url: "https://www.finhousebr.com.br/leilaocom-ia",
    type: "website",
  },
};

const leilaoJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "finHouse Leilão com IA",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: "https://www.finhousebr.com.br/leilaocom-ia",
      offers: {
        "@type": "Offer",
        price: "59.90",
        priceCurrency: "BRL",
        description: "15 dias grátis; depois R$ 59,90 por 6 meses",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Como comprar imóvel em leilão em São Paulo com segurança?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Antes de dar o lance, analise a matrícula atualizada, o edital (dívidas de IPTU e condomínio), a situação ocupacional e calcule o Lance Teto considerando comissão de 5%, ITBI, registro, reforma e margem líquida.",
          },
        },
        {
          "@type": "Question",
          name: "Qual a diferença entre 1ª praça e 2ª praça em leilões de imóveis?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Na 1ª praça o lance mínimo costuma partir do valor de avaliação do imóvel. Caso não haja arrematação, o imóvel vai à 2ª praça com descontos que frequentemente chegam a 40% ou 50% sobre a avaliação.",
          },
        },
        {
          "@type": "Question",
          name: "É possível financiar um imóvel comprado em leilão?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sim, em muitos leilões extrajudiciais de bancos é possível utilizar financiamento imobiliário. Em leilões judiciais, o pagamento costuma ser à vista ou parcelado judicialmente (Art. 895 do CPC: 25% de entrada e saldo em até 30 parcelas).",
          },
        },
        {
          "@type": "Question",
          name: "Quem paga as dívidas de IPTU e condomínio em leilão judicial?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Em regra, no leilão judicial os débitos tributários (IPTU) sub-rogam no preço da arrematação (Art. 130, parágrafo único, do CTN), enquanto débitos condominiais dependem do que dispõe o edital e o processo. Sempre valide no edital oficial.",
          },
        },
        {
          "@type": "Question",
          name: "Como funciona o teste grátis de 15 dias do Módulo Premium finHouse?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Entrando com sua conta Google você libera 15 dias grátis sem cartão de crédito, com até 3 dossiês completos inéditos por dia, Semáforo Jurídico, Calculadora de Lance Teto, Comparador e Exportação CSV/PDF.",
          },
        },
      ],
    },
  ],
};

export default function LeilaoComIaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(leilaoJsonLd) }}
      />
      {children}
    </>
  );
}

