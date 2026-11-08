import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// ── Explicit flavor ID map (name/alias → canonical recipe ID) ──────────────
// Prevents breakage when display names change.
// Key: any string that may appear in salsas[] (display name or checkout ID)
// Value: stable recipe productId
const BURGER_FLAVOR_MAP: Record<string, string> = {
  // canonical IDs (from checkout)
  "bacon-pecado":        "burger-flavor-bacon-pecado",
  "chicken-grill":       "burger-flavor-chicken-grill",
  "marina-crunch":       "burger-flavor-marina-crunch",
  "santo-smash":         "burger-flavor-santo-smash",
  "dilema-veggie":       "burger-flavor-dilema-veggie",
  "tentacion-tropical":  "burger-flavor-tentacion-tropical",
  // historical display names
  "Bacon Pecado":        "burger-flavor-bacon-pecado",
  "Chicken Grill":       "burger-flavor-chicken-grill",
  "Marina Crunch":       "burger-flavor-marina-crunch",
  "Santo Smash":         "burger-flavor-santo-smash",
  "Dilema Veggie":       "burger-flavor-dilema-veggie",
  "Tentación Tropical":  "burger-flavor-tentacion-tropical",
};

const TACO_FLAVOR_MAP: Record<string, string> = {
  "santo-crujiente": "taco-flavor-santo-crujiente",
  "tex-dilema":      "taco-flavor-tex-dilema",
  "santo-bacon":     "taco-flavor-santo-bacon",
};

// Resolve a flavor string to a stable recipe ID.
// Uses explicit map first; falls back to text normalization for new/unknown flavors.
function resolveFlavorId(raw: string, type: "burger" | "taco"): string {
  const map = type === "burger" ? BURGER_FLAVOR_MAP : TACO_FLAVOR_MAP;
  if (map[raw]) return map[raw];
  // Fallback normalization (handles future flavors not yet in the map)
  return (
    `${type}-flavor-` +
    raw.toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

// POST - consume inventory for a delivered order (idempotent)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, orderDate, cart } = body;
    if (!orderId) return NextResponse.json({ error: "orderId requerido" }, { status: 400 });

    // ── Idempotency check ──────────────────────────────────────────────────
    const log = await storage.getStockDeductionLog();
    if (log.some((e: any) => e.orderId === orderId)) {
      return NextResponse.json({ skipped: true, reason: "ya procesado" });
    }

    const [recipes, supplies] = await Promise.all([storage.getRecipes(), storage.getSupplies()]);
    if (recipes.length === 0 || supplies.length === 0) {
      return NextResponse.json({ skipped: true, reason: "sin recetas configuradas" });
    }

    const warnings: string[] = [];
    const pendingProducts: { productId: string; name: string; reason: string }[] = [];
    const consumed: { itemId: string; name: string; qty: number }[] = [];

    // ── Helper: apply consumption ──────────────────────────────────────────
    const applyRecipe = async (recipeItems: any[], multiplier: number) => {
      for (const ri of recipeItems) {
        if (ri.scope === "per_order" && multiplier !== 1) continue;
        const supply = supplies.find((s: any) => s.id === ri.itemId);
        if (!supply) { warnings.push(`Insumo ${ri.itemId} no encontrado`); continue; }
        const orderDay = (orderDate || "").slice(0, 10);
        if (orderDay && orderDay < supply.controlStartDate) continue;
        const qty = ri.quantity * (ri.scope === "per_order" ? 1 : multiplier);
        const newBalance = supply.available - qty;
        supply.available = newBalance;
        await storage.updateSupply({ ...supply, available: newBalance, updatedAt: new Date().toISOString() });
        await storage.addSupplyMovement({
          id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          itemId: supply.id, itemName: supply.name, type: "consumo",
          quantity: -qty, balanceAfter: newBalance, reference: orderId,
          date: orderDay || new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
        });
        consumed.push({ itemId: supply.id, name: supply.name, qty });
      }
    };

    // ── Process each cart item ─────────────────────────────────────────────
    const orderItems: any[] = cart || [];
    for (const item of orderItems) {
      const pid = item.productId || "";
      const qty = item.quantity || 1;
      const isBurger = ["burger-duo", "burger-trio"].includes(pid);
      const isTaco = pid === "taco-duo";

      // 1. Base recipe (common components, x qty)
      const baseRecipe = recipes.find((r: any) => r.productId === pid);
      if (baseRecipe) {
        await applyRecipe(baseRecipe.items.filter((ri: any) => ri.scope === "per_product"), qty);
      }

      if (isBurger || isTaco) {
        // 2. Flavor recipes — each salsas[] element = 1 physical unit
        const type = isBurger ? "burger" : "taco";
        for (const salsa of (item.salsas || [])) {
          const fid = resolveFlavorId(salsa, type);
          const flavorRecipe = recipes.find((r: any) => r.productId === fid);
          if (flavorRecipe && flavorRecipe.items.length > 0) {
            await applyRecipe(flavorRecipe.items.filter((ri: any) => ri.scope !== "per_order"), 1);
          } else {
            if (!pendingProducts.some((p) => p.productId === fid)) {
              pendingProducts.push({ productId: fid, name: salsa, reason: "sin receta configurada" });
              warnings.push(`Sin receta: ${salsa} (${fid})`);
            }
          }
        }
        // 3. Complement recipes x qty
        for (const compId of (item.complementIds || [])) {
          const compRecipe = recipes.find((r: any) => r.productId === compId);
          if (compRecipe && compRecipe.items.length > 0) {
            await applyRecipe(compRecipe.items.filter((ri: any) => ri.scope !== "per_order"), qty);
          }
        }
      } else {
        if (!baseRecipe && pid && pid !== "__per_order__") {
          if (!pendingProducts.some((p) => p.productId === pid)) {
            pendingProducts.push({ productId: pid, name: item.name || pid, reason: "sin receta configurada" });
          }
        }
      }
    }

    // ── Per-order recipe ──────────────────────────────────────────────────
    const perOrderRecipe = recipes.find((r: any) => r.productId === "__per_order__");
    if (perOrderRecipe) await applyRecipe(perOrderRecipe.items, 1);

    // ── Log the deduction ─────────────────────────────────────────────────
    const isPartial = pendingProducts.length > 0;
    await storage.addStockDeductionEntry({
      orderId,
      orderDate: (orderDate || "").slice(0, 10),
      cart: isPartial ? cart : undefined, // keep cart only for partial entries (needed for completion)
      deductedAt: new Date().toISOString(),
      consumed: consumed.length,
      warnings: warnings.length,
      partial: isPartial,
      pendingProducts: isPartial ? pendingProducts : undefined,
    });

    return NextResponse.json({ success: true, consumed, warnings, pendingProducts });
  } catch (e) {
    console.error("Error en stock-consume:", e);
    return NextResponse.json({ error: "Error al consumir inventario", details: String(e) }, { status: 500 });
  }
}
