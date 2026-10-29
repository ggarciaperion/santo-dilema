import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

// GET - Obtener todos los registros de costos
export async function GET() {
  try {
    const records = await storage.getProductCosts();
    return NextResponse.json(records);
  } catch (error) {
    console.error("Error al obtener costos:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST - Crear o reemplazar costo de un producto
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, productName, category, cost, breakdown, effectiveFrom, notes } = body;

    if (!productId || cost === undefined) {
      return NextResponse.json({ error: "productId y cost son obligatorios" }, { status: 400 });
    }

    const record = {
      id: `${productId}-${Date.now()}`,
      productId,
      productName: productName || productId,
      category: category || "general",
      cost: parseFloat(cost),
      breakdown: breakdown || {},
      effectiveFrom: effectiveFrom || new Date().toISOString().slice(0, 10),
      notes: notes || "",
      createdAt: new Date().toISOString(),
    };

    await storage.saveProductCost(record);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Error al guardar costo:", error);
    return NextResponse.json({ error: "Error al guardar costo" }, { status: 500 });
  }
}

// PATCH - Actualizar un registro de costo
export async function PATCH(request: Request) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
    const updated = await storage.updateProductCost(id, { ...updates, updatedAt: new Date().toISOString() });
    if (!updated) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar costo:", error);
    return NextResponse.json({ error: "Error al actualizar costo" }, { status: 500 });
  }
}

// DELETE - Eliminar un registro de costo
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
    const deleted = await storage.deleteProductCost(id);
    if (!deleted) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar costo:", error);
    return NextResponse.json({ error: "Error al eliminar costo" }, { status: 500 });
  }
}
