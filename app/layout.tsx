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
  title: "Santo Dilema - Fit o Fat",
  description: "Elige tu camino: ensaladas fit o alitas fat",
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
