import { NextResponse } from "next/server";
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'FIXREDIS2026SD') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const rawData = await redis.get('orders');

    if (Array.isArray(rawData)) {
      return NextResponse.json({
        status: 'ok',
        message: 'Redis ya tiene formato correcto',
        count: (rawData as any[]).length
      });
    }

    let orders: any[];

    if (typeof rawData === 'string') {
      orders = JSON.parse(rawData);
      if (!Array.isArray(orders)) {
        orders = JSON.parse(orders as any);
      }
    } else if (rawData === null) {
      orders = [];
    } else {
      return NextResponse.json({ status: 'error', message: 'Tipo inesperado', type: typeof rawData }, { status: 500 });
    }

    await redis.set('orders', orders);

    return NextResponse.json({
      status: 'fixed',
      message: `Corregido: ${orders.length} pedidos restaurados`,
      count: orders.length,
      ids: orders.map((o: any) => o.id)
    });

  } catch (error) {
    return NextResponse.json({ status: 'error', message: String(error) }, { status: 500 });
  }
}
