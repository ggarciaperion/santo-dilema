import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

// POST — registra que el modal se mostró (métrica de impresión)
export async function POST() {
  try {
    const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    const metricas = await storage.getSorteoMundialMetricas();
    metricas.impresiones = (metricas.impresiones || 0) + 1;
    metricas.porDia = metricas.porDia || {};
    metricas.impresiones_por_dia = metricas.impresiones_por_dia || {};
    metricas.impresiones_por_dia[hoy] = (metricas.impresiones_por_dia[hoy] || 0) + 1;
    await storage.saveSorteoMundialMetricas(metricas);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// GET — stats para admin
export async function GET() {
  try {
    const metricas = await storage.getSorteoMundialMetricas();
    const conversion = metricas.impresiones > 0
      ? ((metricas.participaciones / metricas.impresiones) * 100).toFixed(1)
      : '0.0';
    return NextResponse.json({ ...metricas, conversion: parseFloat(conversion) });
  } catch {
    return NextResponse.json({ impresiones: 0, participaciones: 0, conversion: 0 });
  }
}
