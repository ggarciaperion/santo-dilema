import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    return NextResponse.json(await storage.getSupplies());
  } catch (e) {
    return NextResponse.json({ error: "Error al leer insumos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    const supply = {
      id: `sup-${Date.now()}`,
      name: body.name.trim(),
      unit: body.unit || "unidades",
      available: body.initialQty ?? 0,
      minimum: body.minimum ?? 0,
      controlStartDate: body.controlStartDate || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Record initial movement if qty > 0
    if (supply.available > 0) {
      await storage.addSupplyMovement({
        id: `mov-${Date.now()}-ini`,
        itemId: supply.id,
        itemName: supply.name,
        type: "inicial",
        quantity: supply.available,
        balanceAfter: supply.available,
        date: supply.controlStartDate,
        createdAt: new Date().toISOString(),
      });
    }
    return NextResponse.json(await storage.saveSupply(supply), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Error al crear insumo" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    const ok = await storage.updateSupply({ ...body, updatedAt: new Date().toISOString() });
    if (!ok) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(await storage.getSupplies());
  } catch (e) {
    return NextResponse.json({ error: "Error al actualizar insumo" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    const ok = await storage.deleteSupply(id);
    if (!ok) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Error al eliminar insumo" }, { status: 500 });
  }
}
