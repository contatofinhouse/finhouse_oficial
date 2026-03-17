import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "finHouse | Portal de Imóveis, Financiamentos e Consórcio",
  description:
    "A finHouse é o seu portal de imóveis, financiamentos e consórcios. Encontre imóveis, simule financiamento, conheça nosso programa de indicação e torne-se um parceiro corretor.",
  keywords: [
    "imobiliária",
    "imóveis",
    "financiamento",
    "consórcio",
    "compra",
    "venda",
    "aluguel",
    "FinHouse",
  ],
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "finHouse | Portal de Imóveis",
    description: "Seu portal de imóveis, financiamento, consórcio e muito mais.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
