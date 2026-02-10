import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: '2.8.0',
    timestamp: new Date().toISOString(),
    commit: 'order-delivery-tracking',
    deployed: true,
    feature: 'Tracking de tiempos por etapa + toast de entrega',
    changes: {
      status_timestamps: '✅ Se guardan timestamps al confirmar, poner en camino y entregar cada pedido',
      time_trail: '✅ Rastro de tiempos visible en cada card: hora por etapa + minutos entre etapas',
      delivery_toast: '✅ Toast no intrusivo en esquina al entregar un pedido (muestra ID + nombre cliente)'
    }
  });
}
