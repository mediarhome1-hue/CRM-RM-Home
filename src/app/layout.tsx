import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

import Script from "next/script";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"], // Regular, Medium, Semibold, Bold, ExtraBold, Black
  variable: "--font-montserrat",
});

const SITE_URL = "https://www.rmhomeimobiliaria.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "RM Home Imobiliária - A Melhor Experiência na Realização do Sonho da Casa Própria",
    template: "%s | RM Home Imobiliária"
  },
  description: "Na RM Home Imobiliária, você tem suporte completo, carteira de imóveis exclusiva e uma equipe de corretores apaixonada pelo que faz. Seu sonho de morar bem começa na RM Home!",
  keywords: [
    "RM Home Imobiliária",
    "RM Home",
    "Imobiliária Pernambuco",
    "Imobiliária Recife",
    "Imobiliária Paulista",
    "Minha Casa Minha Vida Pernambuco",
    "Morar Bem PE",
    "Comprar apartamento Recife",
    "Comprar casa Paulista",
    "Imóveis na planta Pernambuco",
    "Valle Encantado Paulista",
    "Bela Vista Imobiliária",
    "Caixa Econômica Imóveis"
  ],
  authors: [{ name: "RM Home Imobiliária", url: SITE_URL }],
  creator: "RM Home Imobiliária",
  publisher: "RM Home Imobiliária",
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "RM Home Imobiliária",
    title: "RM Home Imobiliária - A Melhor Experiência na Realização do Sonho da Casa Própria",
    description: "Na RM Home Imobiliária, você tem suporte completo, carteira de imóveis exclusiva e uma equipe de corretores apaixonada pelo que faz. Seu sonho de morar bem começa na RM Home!",
    images: [
      {
        url: `${SITE_URL}/prop1.jpg`,
        width: 1200,
        height: 630,
        alt: "RM Home Imobiliária Pernambuco - Realizando o Seu Sonho da Casa Própria",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RM Home Imobiliária - A Melhor Experiência na Realização do Sonho da Casa Própria",
    description: "Na RM Home Imobiliária, você tem suporte completo, carteira de imóveis exclusiva e uma equipe de corretores apaixonada pelo que faz. Seu sonho de morar bem começa na RM Home!",
    images: [`${SITE_URL}/prop1.jpg`],
  },
  verification: {
    google: "G-4J2QLMHZWH",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "RM Home Imobiliária",
    "image": `${SITE_URL}/logotipo-rm-home.png`,
    "@id": SITE_URL,
    "url": SITE_URL,
    "telephone": "+5581983241960",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Região Metropolitana de Recife",
      "addressLocality": "Recife",
      "addressRegion": "PE",
      "postalCode": "50000-000",
      "addressCountry": "BR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -8.047562,
      "longitude": -34.876964
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "08:00",
      "closes": "18:00"
    },
    "sameAs": [
      "https://www.instagram.com/amaro_bispo_imoveis/",
      "https://www.instagram.com/daiany_corretora"
    ]
  };

  return (
    <html lang="pt-BR">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
