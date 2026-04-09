import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const caja = await storage.getCaja();
    return NextResponse.json(caja);
  } catch (error) {
    return NextResponse.json({ error: "Error al leer caja" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { snapshotBalance, snapshotDate } = body;
    if (typeof snapshotBalance !== "number" || !snapshotDate) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    await storage.saveCaja({ snapshotBalance, snapshotDate });
    return NextResponse.json({ success: true, snapshotBalance, snapshotDate });
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar caja" }, { status: 500 });
  }
}
