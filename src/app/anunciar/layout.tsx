import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anuncie seu Imóvel Grátis | finHouse",
  description: "Venda ou alugue seu imóvel mais rápido. Anúncio 100% grátis com visibilidade nos maiores portais do Brasil.",
  openGraph: {
    title: "Anuncie seu Imóvel Grátis | finHouse",
    description: "Venda ou alugue seu imóvel mais rápido. Anúncio 100% grátis com visibilidade nos maiores portais do Brasil.",
    url: "https://finhousebr.com.br/anunciar",
    siteName: "finHouse",
    images: [
      {
        url: "https://finhousebr.com.br/og-anunciar-v2.png",
        width: 1200,
        height: 630,
        alt: "Anuncie seu imóvel na finHouse",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anuncie seu Imóvel Grátis | finHouse",
    description: "Venda ou alugue seu imóvel mais rápido. Anúncio 100% grátis com visibilidade nos maiores portais do Brasil.",
    images: ["https://finhousebr.com.br/og-anunciar-v2.png"],
  },
};

export default function AnunciarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
