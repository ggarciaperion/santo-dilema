import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

function getFechaLima(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }); // YYYY-MM-DD
}

function validarCelularPeru(tel: string): boolean {
  return /^9[0-9]{8}$/.test(tel.replace(/\s/g, ''));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, telefono, prediccion } = body;

    // Validaciones de entrada
    if (!nombre?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    if (!telefono?.trim()) {
      return NextResponse.json({ error: 'El celular es requerido' }, { status: 400 });
    }
    if (!validarCelularPeru(telefono.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Ingresa un número de celular peruano válido (9 dígitos, empieza con 9)' }, { status: 400 });
    }
    if (!['local', 'empate', 'visitante'].includes(prediccion)) {
      return NextResponse.json({ error: 'Predicción inválida' }, { status: 400 });
    }

    // Verificar config activa
    const config = await storage.getSorteoMundialConfig();
    if (!config.active) {
      return NextResponse.json({ error: 'El concurso no está activo en este momento' }, { status: 400 });
    }
    if (!config.concursoAbierto) {
      return NextResponse.json({ error: 'El concurso está cerrado' }, { status: 400 });
    }
    if (!config.matchId) {
      return NextResponse.json({ error: 'No hay partido configurado' }, { status: 400 });
    }

    // Verificar día válido
    const ahora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const dia = ahora.getDay();
    if (![0, 4, 5, 6].includes(dia)) {
      return NextResponse.json({ error: 'El concurso solo está disponible de jueves a domingo' }, { status: 400 });
    }

    const telefonoLimpio = telefono.replace(/\s/g, '');
    const hoy = getFechaLima();

    // Deduplicación: un teléfono por día
    const todos = await storage.getSorteoMundialParticipantes();
    const yaParticipo = todos.some((p: any) => {
      const fechaP = new Date(p.fechaParticipacion).toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
      return p.telefono === telefonoLimpio && fechaP === hoy;
    });

    if (yaParticipo) {
      return NextResponse.json({ error: 'Este número ya participó hoy. ¡Vuelve mañana!' }, { status: 409 });
    }

    // IP rate limiting: máx 5 por IP por día (anti-abuso)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               req.headers.get('x-real-ip') || 'unknown';
    const porIP = todos.filter((p: any) => {
      const fechaP = new Date(p.fechaParticipacion).toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
      return p.ip === ip && fechaP === hoy;
    });
    if (porIP.length >= 5) {
      return NextResponse.json({ error: 'Demasiadas participaciones desde esta conexión' }, { status: 429 });
    }

    // Registrar participación
    const nuevo = {
      id: `sm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      nombre: nombre.trim(),
      telefono: telefonoLimpio,
      matchId: config.matchId,
      matchLabel: config.matchLabel || `${config.equipoLocal} vs ${config.equipoVisitante}`,
      equipoLocal: config.equipoLocal,
      equipoVisitante: config.equipoVisitante,
      prediccion, // 'local' | 'empate' | 'visitante'
      prediccionLabel: prediccion === 'local' ? `Gana ${config.equipoLocal}`
        : prediccion === 'visitante' ? `Gana ${config.equipoVisitante}`
        : 'Empate',
      fechaParticipacion: new Date().toISOString(),
      ip,
      userAgent: req.headers.get('user-agent') || '',
      estado: 'participando',
    };

    await storage.saveSorteoMundialParticipante(nuevo);

    // Actualizar métricas
    const metricas = await storage.getSorteoMundialMetricas();
    metricas.participaciones = (metricas.participaciones || 0) + 1;
    metricas.porDia = metricas.porDia || {};
    metricas.porDia[hoy] = (metricas.porDia[hoy] || 0) + 1;
    await storage.saveSorteoMundialMetricas(metricas);

    return NextResponse.json({ ok: true, id: nuevo.id });
  } catch (err) {
    console.error('[sorteo-mundial/participar POST]', err);
    return NextResponse.json({ error: 'Error al registrar participación' }, { status: 500 });
  }
}
