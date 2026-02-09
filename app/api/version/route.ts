import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: '2.5.2',
    timestamp: new Date().toISOString(),
    commit: 'useRef-fix-stale-closure',
    deployed: true,
    critical_fix: 'useRef para evitar stale closure en detección de nuevos pedidos',
    changes: {
      delivery: '✅ CONTRAENTREGA - YAPE/PLIN visible',
      delivery_sound: '✅ Sonido funciona en Safari',
      admin_detection: '✅ useRef para tracking de IDs (evita stale closure)',
      admin_logging: '✅ Logging extenso con prefijo [ADMIN]'
    }
  });
}
