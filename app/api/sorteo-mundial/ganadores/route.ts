import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

// GET — admin: ver acertantes de un partido (requiere ?matchId=X&resultado=local|empate|visitante)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get('matchId');
    const resultado = searchParams.get('resultado'); // 'local' | 'empate' | 'visitante'

    if (!matchId) {
      return NextResponse.json({ error: 'matchId requerido' }, { status: 400 });
    }

    const todos = await storage.getSorteoMundialParticipantes();
    const delPartido = todos.filter((p: any) => p.matchId === matchId);

    if (resultado) {
      const acertantes = delPartido.filter((p: any) => p.prediccion === resultado && p.estado !== 'no_acerto');
      return NextResponse.json({ acertantes, total: acertantes.length });
    }

    return NextResponse.json({ participantes: delPartido, total: delPartido.length });
  } catch (err) {
    console.error('[sorteo-mundial/ganadores GET]', err);
    return NextResponse.json({ error: 'Error cargando datos' }, { status: 500 });
  }
}

// POST — seleccionar ganador (random o manual) y registrar resultado del partido
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { matchId, resultadoPartido, modo, ganadorId } = body;
    // resultadoPartido: 'local' | 'empate' | 'visitante'
    // modo: 'random' | 'manual'
    // ganadorId: solo si modo === 'manual'

    if (!matchId || !resultadoPartido) {
      return NextResponse.json({ error: 'matchId y resultadoPartido son requeridos' }, { status: 400 });
    }

    const todos = await storage.getSorteoMundialParticipantes();

    // Marcar acertantes y no acertantes
    for (const p of todos) {
      if (p.matchId !== matchId) continue;
      if (p.estado === 'ganador') continue; // ya procesado
      p.estado = p.prediccion === resultadoPartido ? 'acerto' : 'no_acerto';
    }

    // Seleccionar ganador entre acertantes
    const acertantes = todos.filter((p: any) => p.matchId === matchId && p.estado === 'acerto');
    let ganador: any = null;

    if (acertantes.length > 0) {
      if (modo === 'manual' && ganadorId) {
        ganador = acertantes.find((p: any) => p.id === ganadorId) || null;
      } else {
        ganador = acertantes[Math.floor(Math.random() * acertantes.length)];
      }
      if (ganador) {
        const idx = todos.findIndex((p: any) => p.id === ganador.id);
        if (idx >= 0) todos[idx].estado = 'ganador';
      }
    }

    // Persistir todo de una sola vez
    if (process.env.VERCEL === '1') {
      const { Redis } = await import('@upstash/redis');
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        await redis.set('sorteoMundialParticipantes', todos);
      }
    } else {
      const fs = require('fs');
      const path = require('path');
      const fp = path.join(process.cwd(), 'data', 'sorteo-mundial-participantes.json');
      fs.writeFileSync(fp, JSON.stringify(todos, null, 2));
    }

    return NextResponse.json({
      ok: true,
      ganador: ganador || null,
      totalAcertantes: acertantes.length,
    });
  } catch (err) {
    console.error('[sorteo-mundial/ganadores POST]', err);
    return NextResponse.json({ error: 'Error procesando resultado' }, { status: 500 });
  }
}
