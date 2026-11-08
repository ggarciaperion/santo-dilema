import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// POST - complete consumption of pending products for an already-processed order.
// Only processes products still listed in pendingProducts; never re-processes
// products that were already consumed.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, productIds, expectedProductIds, expectedDeductions } = body;
    if (!orderId) return NextResponse.json({ error: "orderId requerido" }, { status: 400 });

    const log = await storage.getStockDeductionLog();
    const entryIdx = log.findIndex((e: any) => e.orderId === orderId);
    if (entryIdx === -1) return NextResponse.json({ error: "Pedido no encontrado en log" }, { status: 404 });

    const entry = log[entryIdx];
    if (!entry.partial || !entry.pendingProducts?.length) {
      return NextResponse.json({ skipped: true, reason: "no hay pendientes para este pedido" });
    }

    // Staleness check 1: product list changed
    if (expectedProductIds?.length) {
      const currentIds = (entry.pendingProducts || []).map((p: any) => p.productId).sort().join(",");
      const expectedIds = [...expectedProductIds].sort().join(",");
      if (currentIds !== expectedIds) {
        return NextResponse.json({
          stale: true,
          reason: "Los productos pendientes cambiaron desde la vista previa. Actualiza antes de continuar.",
          currentPending: entry.pendingProducts,
        }, { status: 409 });
      }
    }

    // Staleness check 2: recipe/quantity changes — re-compute fresh deductions and compare with preview.
    // Uses supplyId (not supplyName) so renaming a supply doesn't trigger a false stale.
    if (expectedDeductions?.length) {
      const [recipesNow, suppliesNow] = await Promise.all([storage.getRecipes(), storage.getSupplies()]);
      const freshDeductions: { productId: string; supplyId: string; qty: number }[] = [];
      for (const pending of (entry.pendingProducts || [])) {
        const recipe = recipesNow.find((r: any) => r.productId === pending.productId);
        if (!recipe) continue;
        for (const ri of recipe.items.filter((ri: any) => ri.scope !== "per_order")) {
          freshDeductions.push({ productId: pending.productId, supplyId: ri.itemId, qty: ri.quantity });
        }
      }
      // Key uses supplyId — immune to name changes; two supplies with similar names won't collide
      const toKey = (d: any) => `${d.productId}|${d.supplyId}|${d.qty}`;
      const freshSet = new Set(freshDeductions.map(toKey));
      const expectedSet = new Set((expectedDeductions as any[]).map((d: any) => `${d.productId}|${d.supplyId}|${d.qty}`));
      const changed = freshDeductions.some(d => !expectedSet.has(toKey(d))) ||
                      (expectedDeductions as any[]).some((d: any) => !freshSet.has(`${d.productId}|${d.supplyId}|${d.qty}`));
      if (changed) {
        return NextResponse.json({
          stale: true,
          reason: "Las cantidades o recetas cambiaron desde la vista previa. Actualiza antes de continuar.",
          freshDeductions,
        }, { status: 409 });
      }
    }

    // Determine which pending products to process (all, or a specific subset)
    const toProcess: any[] = productIds?.length
      ? entry.pendingProducts.filter((p: any) => productIds.includes(p.productId))
      : entry.pendingProducts;

    if (!toProcess.length) return NextResponse.json({ skipped: true, reason: "ningún ID coincide con pendientes" });

    const [recipes, supplies] = await Promise.all([storage.getRecipes(), storage.getSupplies()]);
    const orderDate = entry.orderDate || new Date().toISOString().slice(0, 10);

    const consumed: { itemId: string; name: string; qty: number }[] = [];
    const stillPending: any[] = [];
    const warnings: string[] = [];

    // Load existing movements once for idempotency check
    const existingMovements = await storage.getSupplyMovements();

    for (const pending of toProcess) {
      const recipe = recipes.find((r: any) => r.productId === pending.productId);
      if (!recipe || !recipe.items.length) {
        stillPending.push(pending);
        warnings.push(`Receta aún no configurada: ${pending.name}`);
        continue;
      }

      // Apply consumption for this flavor/product
      for (const ri of recipe.items.filter((ri: any) => ri.scope !== "per_order")) {
        const supply = supplies.find((s: any) => s.id === ri.itemId);
        if (!supply) { warnings.push(`Insumo ${ri.itemId} no encontrado`); continue; }
        if (orderDate < supply.controlStartDate) continue;

        // Per-movement idempotency: reference is unique per order+product+supply
        const movRef = `${orderId}-pending-${pending.productId}-${supply.id}`;
        const alreadyDone = (existingMovements as any[]).some(
          (m: any) => m.reference === movRef && m.type === "consumo"
        );
        if (alreadyDone) {
          consumed.push({ itemId: supply.id, name: supply.name, qty: ri.quantity });
          continue;
        }

        const qty = ri.quantity;
        const newBalance = supply.available - qty;
        supply.available = newBalance;

        await storage.updateSupply({ ...supply, available: newBalance, updatedAt: new Date().toISOString() });
        await storage.addSupplyMovement({
          id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          itemId: supply.id, itemName: supply.name, type: "consumo",
          quantity: -qty, balanceAfter: newBalance,
          reference: movRef,
          date: orderDate, createdAt: new Date().toISOString(),
          notes: `Consumo completado: ${pending.name}`,
        });
        consumed.push({ itemId: supply.id, name: supply.name, qty });
      }
    }

    // Keep pending products that were NOT processed (not in toProcess) + ones still without recipe
    const notProcessedIds = new Set(toProcess.map((p: any) => p.productId));
    const remainingFromOtherSets = entry.pendingProducts.filter(
      (p: any) => !notProcessedIds.has(p.productId)
    );
    const newPending = [...remainingFromOtherSets, ...stillPending];

    // Update log entry
    log[entryIdx] = {
      ...entry,
      partial: newPending.length > 0,
      pendingProducts: newPending.length > 0 ? newPending : undefined,
      cart: newPending.length > 0 ? entry.cart : undefined,
      pendingCompletedAt: new Date().toISOString(),
    };
    await (storage as any).updateStockDeductionLog(log);

    return NextResponse.json({ success: true, consumed, warnings, remainingPending: newPending });
  } catch (e) {
    console.error("Error en stock-consume-pending:", e);
    return NextResponse.json({ error: "Error al completar consumo", details: String(e) }, { status: 500 });
  }
}

// GET - preview what would be consumed for pending products of an order
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    if (!orderId) return NextResponse.json({ error: "orderId requerido" }, { status: 400 });

    const log = await storage.getStockDeductionLog();
    const entry = log.find((e: any) => e.orderId === orderId);
    if (!entry?.partial || !entry.pendingProducts?.length) {
      return NextResponse.json({ preview: [] });
    }

    const [recipes, supplies] = await Promise.all([storage.getRecipes(), storage.getSupplies()]);
    const preview: { productId: string; name: string; items: { supplyId: string; supplyName: string; qty: number }[]; hasRecipe: boolean }[] = [];

    for (const pending of entry.pendingProducts) {
      const recipe = recipes.find((r: any) => r.productId === pending.productId);
      if (!recipe || !recipe.items.length) {
        preview.push({ productId: pending.productId, name: pending.name, items: [], hasRecipe: false });
        continue;
      }
      const items = recipe.items
        .filter((ri: any) => ri.scope !== "per_order")
        .map((ri: any) => {
          const supply = supplies.find((s: any) => s.id === ri.itemId);
          return { supplyId: ri.itemId, supplyName: supply?.name || ri.itemId, qty: ri.quantity };
        });
      preview.push({ productId: pending.productId, name: pending.name, items, hasRecipe: true });
    }

    return NextResponse.json({ preview });
  } catch (e) {
    return NextResponse.json({ error: "Error al previsualizar", details: String(e) }, { status: 500 });
  }
}
