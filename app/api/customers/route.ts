import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// GET - Buscar cliente por DNI
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get("dni");

    if (!dni) {
      return NextResponse.json(
        { error: "DNI es requerido" },
        { status: 400 }
      );
    }

    const result = await storage.findCustomerByDni(dni);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error al buscar cliente:", error);
    return NextResponse.json(
      { error: "Error al buscar cliente" },
      { status: 500 }
    );
  }
}
