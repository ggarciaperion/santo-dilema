import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

// GET — config pública (sin datos sensibles)
export async function GET() {
  try {
    const config = await storage.getSorteoMundialConfig();

    // Verificar si hoy es día válido (Jue/Vie/Sáb/Dom) en Lima
    const ahora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const dia = ahora.getDay(); // 0=Dom, 4=Jue, 5=Vie, 6=Sáb
    const esDiaValido = [0, 4, 5, 6].includes(dia);

    // Verificar rango de fechas
    let dentroDeRango = true;
    if (config.fechaDesde) {
      dentroDeRango = ahora >= new Date(config.fechaDesde);
    }
    if (config.fechaHasta && dentroDeRango) {
      const hasta = new Date(config.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      dentroDeRango = ahora <= hasta;
    }

    return NextResponse.json({
      active: config.active && esDiaValido && dentroDeRango,
      concursoAbierto: config.concursoAbierto,
      matchId: config.matchId || null,
      matchLabel: config.matchLabel || null,
      equipoLocal: config.equipoLocal || null,
      equipoVisitante: config.equipoVisitante || null,
      flagLocal: config.flagLocal || null,
      flagVisitante: config.flagVisitante || null,
      fechaPartido: config.fechaPartido || null,
      horaPartido: config.horaPartido || null,
      mensajePromo: config.mensajePromo || '🏆 ¡Participa y gana alitas gratis!',
      premio: config.premio || 'Alitas gratis',
      esDiaValido,
      dentroDeRango,
    });
  } catch (err) {
    console.error('[sorteo-mundial/config GET]', err);
    return NextResponse.json({ active: false }, { status: 500 });
  }
}

// PUT — solo admin, actualiza config completa
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const actual = await storage.getSorteoMundialConfig();
    const nueva = { ...actual, ...body, updatedAt: new Date().toISOString() };
    await storage.saveSorteoMundialConfig(nueva);
    return NextResponse.json({ ok: true, config: nueva });
  } catch (err) {
    console.error('[sorteo-mundial/config PUT]', err);
    return NextResponse.json({ error: 'Error guardando config' }, { status: 500 });
  }
}
