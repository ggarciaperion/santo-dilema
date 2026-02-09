import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: '2.5.1',
    timestamp: new Date().toISOString(),
    commit: '0f29959-plus-fixes',
    deployed: true,
    changes: {
      delivery: 'CONTRAENTREGA - YAPE/PLIN visible',
      admin: 'Detección por ID activa',
      safari: 'Soporte mejorado'
    }
  });
}
