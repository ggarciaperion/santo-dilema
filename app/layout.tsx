import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./components/Providers";
import MaintenanceWrapper from "./maintenance-wrapper";
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Santo Dilema - Fit o Fat",
  description: "Elige tu camino: ensaladas fit o alitas fat",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`antialiased ${bebasNeue.variable}`}>
        <Providers>
          <MaintenanceWrapper>
            {children}
          </MaintenanceWrapper>
        </Providers>
      </body>
    </html>
  );
}
