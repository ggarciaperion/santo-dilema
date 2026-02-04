import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// GET - Obtener todos los cierres diarios
export async function GET() {
  try {
    const dailyCloses = await storage.getDailyCloses();
    return NextResponse.json(dailyCloses);
  } catch (error) {
    console.error("Error al leer cierres diarios:", error);
    return NextResponse.json({ error: "Error al leer cierres diarios" }, { status: 500 });
  }
}

// POST - Registrar nuevo cierre diario
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("🔥 Body recibido:", body);

    const newDailyClose = {
      id: Date.now().toString(),
      date: body.date || new Date().toISOString().split('T')[0],
      sales: body.sales || [], // Array de { productName, quantity }
      packagingUsed: body.packagingUsed || [], // Array de { packagingName, suggested, actual, difference }
      totalDifference: body.totalDifference || 0,
      notes: body.notes || "",
      createdAt: new Date().toISOString(),
    };

    console.log("🔥 Cierre diario a guardar:", newDailyClose);
    const savedClose = await storage.saveDailyClose(newDailyClose);

    return NextResponse.json(savedClose, { status: 201 });
  } catch (error) {
    console.error("Error al registrar cierre diario:", error);
    return NextResponse.json({ error: "Error al registrar cierre diario", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// DELETE - Eliminar cierre diario
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const deleted = await storage.deleteDailyClose(id);

    if (!deleted) {
      return NextResponse.json({ error: "Cierre diario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar cierre diario:", error);
    return NextResponse.json({ error: "Error al eliminar cierre diario" }, { status: 500 });
  }
}
