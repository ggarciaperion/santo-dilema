import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./components/Providers";
import MaintenanceWrapper from "./maintenance-wrapper";
import { Bangers } from "next/font/google";

const bangers = Bangers({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bangers",
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
      <body className={`antialiased ${bangers.variable}`}>
        <Providers>
          <MaintenanceWrapper>
            {children}
          </MaintenanceWrapper>
        </Providers>
      </body>
    </html>
  );
}
