import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: '2.5.3',
    timestamp: new Date().toISOString(),
    commit: 'useRef-fix-delivered-sound',
    deployed: true,
    critical_fix: 'useRef para detectar pedidos entregados (evita stale closure)',
    changes: {
      delivery: '✅ CONTRAENTREGA - YAPE/PLIN visible',
      delivery_sound: '✅ Sonido funciona en Safari',
      admin_new_orders: '✅ Sonido de nuevos pedidos funciona',
      admin_delivered: '✅ Sonido de entrega confirmada con useRef para status',
      admin_logging: '✅ Logging extenso con prefijo [ADMIN]'
    }
  });
}
