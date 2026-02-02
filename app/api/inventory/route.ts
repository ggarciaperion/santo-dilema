import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// GET - Obtener todas las compras de inventario
export async function GET() {
  try {
    const inventory = await storage.getInventory();
    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Error al leer inventario:", error);
    return NextResponse.json({ error: "Error al leer inventario" }, { status: 500 });
  }
}

// POST - Registrar nueva compra de inventario
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newPurchase = {
      id: Date.now().toString(),
      supplier: body.supplier,
      supplierRuc: body.supplierRuc || "",
      supplierPhone: body.supplierPhone || "",
      paymentMethod: body.paymentMethod || "plin-yape",
      items: body.items, // Array de { productName, quantity, unit, unitCost, total }
      totalAmount: body.totalAmount,
      notes: body.notes || "",
      purchaseDate: body.purchaseDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const savedPurchase = await storage.saveInventoryPurchase(newPurchase);

    return NextResponse.json(savedPurchase, { status: 201 });
  } catch (error) {
    console.error("Error al registrar compra:", error);
    return NextResponse.json({ error: "Error al registrar compra", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// DELETE - Eliminar registro de compra
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const deleted = await storage.deleteInventoryPurchase(id);

    if (!deleted) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar compra:", error);
    return NextResponse.json({ error: "Error al eliminar compra" }, { status: 500 });
  }
}
