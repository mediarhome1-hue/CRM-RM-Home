import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

import Script from "next/script";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"], // Regular, Medium, Semibold, Bold, ExtraBold, Black
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Líder Imobiliária - A Maior de Pernambuco",
  description: "A Maior de Pernambuco",
  icons: {
    icon: [
      { url: "/icon.png" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${montserrat.variable} font-sans antialiased`}>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-4J2QLMHZWH" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          
            gtag('config', 'G-4J2QLMHZWH');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
