import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./components/Providers";
import MaintenanceWrapper from "./maintenance-wrapper";
import { Lilita_One } from "next/font/google";

const lilitaOne = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-graffiti",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Santo Dilema | Dark Kitchen · Chancay",
  description: "Alitas premium, ensaladas gourmet, tacos auténticos y combos irresistibles. Delivery en Chancay. Pide ahora.",
  keywords: ["alitas", "ensaladas", "tacos", "dark kitchen", "delivery", "Chancay", "combos", "Santo Dilema"],
  openGraph: {
    title: "Santo Dilema | Dark Kitchen · Chancay",
    description: "Alitas premium, ensaladas gourmet y tacos auténticos. Delivery en Chancay. 🔥",
    url: "https://www.santodilema.com",
    siteName: "Santo Dilema",
    images: [
      {
        url: "https://www.santodilema.com/logoprincipal.png",
        width: 1200,
        height: 630,
        alt: "Santo Dilema - Dark Kitchen",
      },
    ],
    locale: "es_PE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Santo Dilema | Dark Kitchen · Chancay",
    description: "Alitas premium, ensaladas gourmet y tacos auténticos. Delivery en Chancay. 🔥",
    images: ["https://www.santodilema.com/logoprincipal.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/logoprincipal.png",
    apple: "/logoprincipal.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Santo Dilema" />
      </head>
      <body className={`antialiased ${lilitaOne.variable}`}>
        <Providers>
          <MaintenanceWrapper>
            {children}
          </MaintenanceWrapper>
        </Providers>
      </body>
    </html>
  );
}
