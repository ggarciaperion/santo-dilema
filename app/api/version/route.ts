import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: '2.5.5',
    timestamp: new Date().toISOString(),
    commit: 'fix-item-price-display',
    deployed: true,
    feature: 'Mostrar solo precio base del menú en items',
    changes: {
      admin_fix: '✅ Precio debajo del nombre muestra solo precio del menú',
      delivery_fix: '✅ Precio debajo del nombre muestra solo precio del menú',
      complement_display: '✅ Complementos agrupados con precio acumulado',
      total_display: '✅ Total general mostrado al lado derecho (admin)'
    }
  });
}
