import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mundial 2026 — Análisis & Predicciones | SantoDilema',
  description:
    'Plataforma de análisis estadístico y predicciones para el Mundial FIFA 2026. Modelos ELO, Poisson y Bayesiano. Resultados en tiempo real.',
  openGraph: {
    title: 'Mundial 2026 — Análisis Estadístico',
    description: 'Predicciones fundamentadas para el Mundial 2026. 48 selecciones. 104 partidos.',
    url: 'https://www.santodilema.com/mundial2026',
  },
}

export default function Mundial2026Layout({ children }: { children: React.ReactNode }) {
  // Isolated layout: overrides body font with clean sans-serif
  return (
    <div
      style={{
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#05070F',
        minHeight: '100vh',
      }}
    >
      {children}
    </div>
  )
}
