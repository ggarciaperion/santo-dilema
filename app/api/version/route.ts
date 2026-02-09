import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: '2.5.4',
    timestamp: new Date().toISOString(),
    commit: 'payment-simplification',
    deployed: true,
    feature: 'Simplificación de método de pago contraentrega',
    changes: {
      payment: '✅ Contraentrega ahora es solo EFECTIVO (exacto o con cambio)',
      payment_yape: '✅ Yape/Plin solo disponible con pago anticipado (QR)',
      delivery_view: '✅ Eliminada opción contraentrega-yape-plin de visualización',
      checkout: '✅ Modal de contraentrega muestra directamente opciones de efectivo',
      all_sounds: '✅ Todos los sonidos funcionando correctamente'
    }
  });
}
