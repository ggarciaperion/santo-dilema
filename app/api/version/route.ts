import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: '2.7.0',
    timestamp: new Date().toISOString(),
    commit: 'analytics-enhancements',
    deployed: true,
    feature: 'Mejoras Analytics: % ingresos, ranking completo extras, control stock',
    changes: {
      product_percentage: '✅ Productos ahora muestran % del total de ingresos del mes',
      all_complements: '✅ Lista completa de extras/complementos/salsas por categoría (no solo top 3)',
      menu_stock_control: '✅ Nueva sección: Menús vendidos hoy para control de stock',
      removed_sections: '✅ Eliminadas secciones: Progreso de órdenes y Productos vendidos duplicados',
      row_format: '✅ Complementos en formato fila para mejor visualización'
    }
  });
}
