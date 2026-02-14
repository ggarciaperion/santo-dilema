import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// GET - Obtener estado de stock de todos los menús
export async function GET() {
  try {
    const menuStock = await storage.getMenuStock();
    return NextResponse.json(menuStock);
  } catch (error) {
    console.error("Error al obtener menu stock:", error);
    return NextResponse.json({}, { status: 200 });
  }
}

// PATCH - Actualizar estado agotado de un menú
// Body: { productId: string, soldOut: boolean }
export async function PATCH(request: Request) {
  try {
    const { productId, soldOut } = await request.json();

    if (!productId || typeof soldOut !== "boolean") {
      return NextResponse.json(
        { error: "productId y soldOut son requeridos" },
        { status: 400 }
      );
    }

    const menuStock = await storage.getMenuStock();
    menuStock[productId] = soldOut;
    await storage.saveMenuStock(menuStock);

    return NextResponse.json({ success: true, productId, soldOut });
  } catch (error) {
    console.error("Error al actualizar menu stock:", error);
    return NextResponse.json(
      { error: "Error al actualizar el stock" },
      { status: 500 }
    );
  }
}
