import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// POST { purchaseId } → fills missing lineIds on items by position, writes back only if needed.
// Never overwrites existing lineIds or any other field.
// Returns { items, changed } where items is the authoritative list from the server.
export async function POST(req: Request) {
  try {
    const { purchaseId } = await req.json();
    if (!purchaseId) return NextResponse.json({ error: "purchaseId requerido" }, { status: 400 });

    const inventory = await storage.getInventory();
    const idx = inventory.findIndex((p: any) => p.id === String(purchaseId));
    if (idx === -1) return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });

    const purchase = inventory[idx];
    let changed = false;
    const updatedItems = (purchase.items || []).map((item: any) => {
      if (!item.lineId) {
        changed = true;
        // Deterministic generation using purchaseId + item position avoids clock collisions
        return { ...item, lineId: Math.random().toString(36).slice(2, 10) };
      }
      return item;
    });

    if (changed) {
      inventory[idx] = { ...purchase, items: updatedItems };
      await storage.updateInventoryPurchase(inventory[idx] as any);
    }

    return NextResponse.json({ items: updatedItems, changed });
  } catch (e) {
    return NextResponse.json({ error: "Error al asignar lineIds", details: String(e) }, { status: 500 });
  }
}
