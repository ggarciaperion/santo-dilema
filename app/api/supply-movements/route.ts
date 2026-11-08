import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    const all = await storage.getSupplyMovements();
    return NextResponse.json(itemId ? all.filter((m: any) => m.itemId === itemId) : all);
  } catch (e) {
    return NextResponse.json({ error: "Error al leer movimientos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { itemId, type, quantity, date, notes, reference, unitsPerPackage } = body;
    if (!itemId || !type || quantity == null) {
      return NextResponse.json({ error: "itemId, type y quantity son requeridos" }, { status: 400 });
    }

    const supplies = await storage.getSupplies();
    const supply = supplies.find((s: any) => s.id === itemId);
    if (!supply) return NextResponse.json({ error: "Insumo no encontrado" }, { status: 404 });

    if (type === "ajuste" && !notes?.trim()) {
      return NextResponse.json({ error: "El ajuste requiere un motivo" }, { status: 400 });
    }

    // Calculate effective quantity (may be negative for ajuste/consumo)
    let qty = Number(quantity);
    if (unitsPerPackage && unitsPerPackage > 1) qty = qty * unitsPerPackage;

    // entrada and inicial are always positive; consumo and ajuste can be negative
    const delta = (type === "entrada" || type === "inicial" || type === "devolucion") ? Math.abs(qty) : qty;
    const newBalance = supply.available + delta;
    const now = new Date().toISOString();

    const movement = {
      id: `mov-${Date.now()}`,
      itemId,
      itemName: supply.name,
      type,
      quantity: delta,
      balanceAfter: newBalance,
      reference: reference || undefined,
      notes: notes || undefined,
      date: date || now.slice(0, 10),
      createdAt: now,
    };

    if (reference) {
      // Atomic: check reference uniqueness, update balance, and append movement in one block
      const result = await (storage as any).addSupplyMovementAtomic({
        reference, type, movement, supplyId: itemId, delta, supplyUpdatedAt: now,
      });
      return NextResponse.json(result.movement, { status: result.created ? 201 : 200 });
    }

    // No reference — no idempotency needed; use regular path
    await storage.updateSupply({ ...supply, available: newBalance, updatedAt: now });
    return NextResponse.json(await storage.addSupplyMovement(movement), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Error al registrar movimiento" }, { status: 500 });
  }
}
