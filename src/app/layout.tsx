import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Líder Imobiliária PE | Encontre seu Lar em Pernambuco",
  description: "A Líder Imobiliária PE oferece os melhores imóveis para venda e aluguel em Pernambuco. Atendimento exclusivo e imóveis de alto padrão.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${outfit.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

