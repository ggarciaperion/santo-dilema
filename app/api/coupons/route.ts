import { NextResponse } from "next/server";

// Sistema de cupones retirado el 2026-06-06.
// El archivo histórico de cupones se conserva en data/coupons-backup-2026-06-06.json
// Los pedidos históricos que tenían couponDiscount/couponCode siguen intactos en orders.

const GONE = { error: "El sistema de cupones ha sido retirado del sistema." };

export async function GET() {
  return NextResponse.json(GONE, { status: 410 });
}
export async function POST() {
  return NextResponse.json(GONE, { status: 410 });
}
export async function DELETE() {
  return NextResponse.json(GONE, { status: 410 });
}
export async function PATCH() {
  return NextResponse.json(GONE, { status: 410 });
}
