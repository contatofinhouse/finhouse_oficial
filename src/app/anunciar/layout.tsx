import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anúncio Grátis | finHouse",
  description: "Anuncie seu imóvel grátis na finHouse. Vende melhor, mais rápido e com segurança total.",
  openGraph: {
    title: "Anúncio Grátis de Imóveis | finHouse",
    description: "Anuncie seu imóvel grátis na finHouse. Vende melhor, mais rápido e com visibilidade nos maiores portais.",
    images: [
      {
        url: "https://finhousebr.com.br/og-anunciar-house.png",
        width: 1024,
        height: 1024,
        alt: "Anuncie seu imóvel na finHouse com a melhor visibilidade",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anúncio Grátis de Imóveis | finHouse",
    description: "Anuncie seu imóvel grátis na finHouse. Vende melhor, mais rápido e com segurança total.",
    images: ["https://finhousebr.com.br/og-anunciar-house.png"],
  },
};

export default function AnunciarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
