import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anúncio Grátis | finHouse",
  description: "Anuncie seu imóvel grátis na finHouse. Vende melhor, mais rápido e com segurança total.",
  openGraph: {
    title: "Anúncio Grátis de Imóveis | finHouse",
    description: "Anuncie seu imóvel grátis na finHouse. Vende melhor, mais rápido e com visibilidade nos maiores portais.",
    images: [
      {
        url: "https://finhousebr.com.br/og-anunciar.png",
        width: 1200,
        height: 630,
        alt: "Anuncie seu imóvel na finHouse",
      },
    ],
    type: "website",
  },
};

export default function AnunciarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
