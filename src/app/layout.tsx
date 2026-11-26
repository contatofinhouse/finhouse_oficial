import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.finhousebr.com.br"),
  title: {
    default: "finHouse | Leilão de Imóveis em SP com IA, Imóveis e Financiamento",
    template: "%s | finHouse",
  },
  description:
    "Encontre imóveis em leilão em São Paulo com até 50% de desconto na 2ª praça, análise jurídica de edital com IA, cálculo de Lance Teto e financiamento imobiliário. Teste 15 dias grátis.",
  keywords: [
    "leilão de imóveis SP",
    "leilão judicial São Paulo",
    "leilão extrajudicial",
    "imóveis em leilão",
    "2ª praça leilão",
    "análise de edital com IA",
    "financiamento imobiliário",
    "finHouse",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "finHouse | Leilão de Imóveis em SP com IA e Viabilidade",
    description:
      "Mapa interativo com 500+ imóveis em leilão em SP (Mega Leilões, Portal Zuk, Superbid e Sold), análise jurídica com IA e cálculo de Lance Teto.",
    url: "https://www.finhousebr.com.br",
    siteName: "finHouse",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "finHouse" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "finHouse | Leilão de Imóveis em SP com IA",
    description:
      "500+ imóveis em leilão em SP com mapa interativo, análise de edital com IA e cálculo de Lance Teto.",
    images: ["/logo.png"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.finhousebr.com.br/#organization",
      name: "finHouse",
      url: "https://www.finhousebr.com.br",
      logo: "https://www.finhousebr.com.br/logo.png",
    },
    {
      "@type": "WebSite",
      "@id": "https://www.finhousebr.com.br/#website",
      url: "https://www.finhousebr.com.br",
      name: "finHouse — Leilão de Imóveis em SP com IA",
      inLanguage: "pt-BR",
      publisher: { "@id": "https://www.finhousebr.com.br/#organization" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased font-sans`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
