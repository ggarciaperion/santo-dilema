import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

// GET — config pública
export async function GET() {
  try {
    const config = await storage.getSorteoMundialConfig();

    // Hora Lima actual
    const ahora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const dia = ahora.getDay();       // 0=Dom, 4=Jue, 5=Vie, 6=Sáb
    const hora = ahora.getHours();    // 0-23

    // Vigencia: días válidos + antes de las 23:00 Lima
    const esDiaValido = [0, 4, 5, 6].includes(dia);
    const dentroDeHorario = hora < 23;

    return NextResponse.json({
      active: config.active && esDiaValido && dentroDeHorario,
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
      // Info para admin (no filtrada)
      _raw: {
        active: config.active,
        esDiaValido,
        dentroDeHorario,
        horaActualLima: hora,
      },
    });
  } catch (err) {
    console.error('[sorteo-mundial/config GET]', err);
    return NextResponse.json({ active: false }, { status: 500 });
  }
}

// PUT — actualiza config (solo admin)
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
