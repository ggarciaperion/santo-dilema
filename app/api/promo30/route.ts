import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// GET - Estado actual de la promo 30%
export async function GET() {
  try {
    const promo = await storage.getPromo30();
    return NextResponse.json({
      active: promo.active,
      count: promo.count,
      limit: promo.limit,
      remaining: Math.max(0, promo.limit - promo.count),
      orders: promo.orders,
    });
  } catch (error) {
    console.error("Error al obtener promo30:", error);
    // En caso de error, asumir activa para no bloquear ventas
    return NextResponse.json({ active: true, count: 0, limit: 30, remaining: 30, orders: [] });
  }
}
