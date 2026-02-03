import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// GET - Obtener todas las deducciones de stock
export async function GET() {
  try {
    const deductions = await storage.getDeductions();
    return NextResponse.json(deductions);
  } catch (error) {
    console.error("Error al leer deducciones:", error);
    return NextResponse.json({ error: "Error al leer deducciones" }, { status: 500 });
  }
}
