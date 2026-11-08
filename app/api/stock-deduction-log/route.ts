import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    return NextResponse.json(await storage.getStockDeductionLog());
  } catch (e) {
    return NextResponse.json({ error: "Error al leer log" }, { status: 500 });
  }
}

// PATCH - update a pending entry.
// action: "dismiss" → mark specific products as explicitly dismissed (with reason)
// action: "resolve" → mark entry as fully resolved (all pending gone, no dismiss)
export async function PATCH(req: Request) {
  try {
    const { orderId, action, productIds, reason } = await req.json();
    if (!orderId || !action) return NextResponse.json({ error: "orderId y action requeridos" }, { status: 400 });

    const log = await storage.getStockDeductionLog();
    const idx = log.findIndex((e: any) => e.orderId === orderId);
    if (idx === -1) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const entry = log[idx];

    if (action === "dismiss") {
      if (!reason?.trim()) return NextResponse.json({ error: "Motivo requerido para omitir" }, { status: 400 });
      const idsToMiss: string[] = productIds || entry.pendingProducts?.map((p: any) => p.productId) || [];
      const dismissed = entry.dismissedProducts || [];
      const now = new Date().toISOString();
      for (const pid of idsToMiss) {
        const p = (entry.pendingProducts || []).find((pp: any) => pp.productId === pid);
        if (!p) continue;
        dismissed.push({ ...p, dismissedAt: now, reason });
      }
      const remaining = (entry.pendingProducts || []).filter((p: any) => !idsToMiss.includes(p.productId));
      log[idx] = {
        ...entry,
        partial: remaining.length > 0,
        pendingProducts: remaining.length > 0 ? remaining : undefined,
        cart: remaining.length > 0 ? entry.cart : undefined,
        dismissedProducts: dismissed,
      };
    } else if (action === "resolve") {
      log[idx] = { ...entry, partial: false, pendingProducts: undefined, cart: undefined, resolvedAt: new Date().toISOString() };
    } else {
      return NextResponse.json({ error: "action desconocida" }, { status: 400 });
    }

    await (storage as any).updateStockDeductionLog(log);
    return NextResponse.json({ success: true, entry: log[idx] });
  } catch (e) {
    return NextResponse.json({ error: "Error al actualizar log" }, { status: 500 });
  }
}
