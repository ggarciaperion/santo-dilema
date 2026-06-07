import { NextResponse } from "next/server";

// Endpoint retirado el 2026-06-06.
// Dependía de getWheelSpins (función no existente) y del sistema de cupones (retirado).
// Se mantiene el archivo para no romper posibles llamadas existentes.

export async function POST() {
  return NextResponse.json(
    { error: "Este endpoint ha sido retirado del sistema." },
    { status: 410 }
  );
}
