"use client";
import { useState, useEffect, useCallback } from "react";

// ── Catálogo de productos (mismas IDs que checkout/orders) ───────────────────
const CATALOG = [
  { id: "pequeno-dilema",        name: "Pequeño Dilema",        category: "fat"    },
  { id: "duo-dilema",            name: "Dúo Dilema",            category: "fat"    },
  { id: "santo-pecado",          name: "Santo Pecado",          category: "fat"    },
  { id: "ensalada-clasica",      name: "Clásica Fresh Bowl",    category: "fit"    },
  { id: "ensalada-proteica",     name: "César Power Bowl",      category: "fit"    },
  { id: "ensalada-caesar",       name: "Protein Fit Bowl",      category: "fit"    },
  { id: "ensalada-mediterranea", name: "Tuna Fresh Bowl",       category: "fit"    },
  { id: "cobb-supreme-bowl",     name: "Cobb Supreme Bowl",     category: "fit"    },
  { id: "crispy-chicken-bowl",   name: "Crispy Chicken Bowl",   category: "fit"    },
  { id: "pasta-power-bowl",      name: "Pasta Power Bowl",      category: "fit"    },
  { id: "taco-duo",              name: "Dúo de Tacos",          category: "taco"   },
  { id: "burger-duo",            name: "Dúo Mini Burgers",      category: "burger" },
  { id: "burger-trio",           name: "Trío Mini Burgers",     category: "burger" },
  { id: "combo-chiguan",         name: "Combo Chiguan",         category: "combo"  },
  { id: "combo-perfecto",        name: "Combo Perfecto",        category: "combo"  },
  { id: "combo-especial",        name: "Combo Especial",        category: "combo"  },
  { id: "combo-alitas",          name: "Combo Alitas",          category: "combo"  },
  { id: "combo-santo-dilema",    name: "Combo Santo Dilema",    category: "combo"  },
  { id: "todos-pecan",           name: "Todos Pecan",           category: "fat"    },
  { id: "extra-papas",           name: "Extra papas",           category: "extra"  },
  { id: "extra-nachos",          name: "Extra nachos",          category: "extra"  },
  { id: "extra-salsa",           name: "Extra salsa",           category: "extra"  },
  { id: "extra-aderezo",         name: "Extra aderezo",         category: "extra"  },
  { id: "pollo-grillado",        name: "Pollo grillado",        category: "extra"  },
  { id: "agua-mineral",          name: "Agua mineral",          category: "bebida" },
  { id: "coca-cola",             name: "Coca Cola 500ml",       category: "bebida" },
  { id: "inka-cola",             name: "Inka Cola 500ml",       category: "bebida" },
  { id: "sprite",                name: "Sprite 500ml",          category: "bebida" },
  { id: "fanta",                 name: "Fanta 500ml",           category: "bebida" },
  // ── Sabores de Mini Burgers (ID = "burger-flavor-" + nombre normalizado) ──
  { id: "burger-flavor-bacon-pecado",        name: "Burger: Bacon Pecado",        category: "burger-flavor" },
  { id: "burger-flavor-chicken-grill",       name: "Burger: Chicken Grill",       category: "burger-flavor" },
  { id: "burger-flavor-marina-crunch",       name: "Burger: Marina Crunch",       category: "burger-flavor" },
  { id: "burger-flavor-santo-smash",         name: "Burger: Santo Smash",         category: "burger-flavor" },
  { id: "burger-flavor-dilema-veggie",       name: "Burger: Dilema Veggie",       category: "burger-flavor" },
  { id: "burger-flavor-tentacion-tropical",  name: "Burger: Tentación Tropical",  category: "burger-flavor" },
  // ── Sabores de Tacos (ID = "taco-flavor-" + ID del checkout) ──────────────
  { id: "taco-flavor-santo-crujiente",  name: "Taco: Crunch Supreme",  category: "taco-flavor" },
  { id: "taco-flavor-tex-dilema",       name: "Taco: Tex Supreme",     category: "taco-flavor" },
  { id: "taco-flavor-santo-bacon",      name: "Taco: Bacon Deluxe",    category: "taco-flavor" },
  // ── Complementos / salsas de burger ───────────────────────────────────────
  { id: "burger-salsa-honey-mustard",   name: "Salsa Honey Mustard",   category: "complement" },
  { id: "burger-salsa-barbecue",        name: "Salsa BBQ",             category: "complement" },
  { id: "burger-salsa-buffalo-picante", name: "Salsa Santo Picante",   category: "complement" },
  { id: "burger-salsa-parmesano-ajo",   name: "Salsa Crispy Celestial",category: "complement" },
  { id: "burger-salsa-teriyaki",        name: "Salsa Teriyaki",        category: "complement" },
  { id: "burger-salsa-ahumada",         name: "Salsa Acevichada",      category: "complement" },
  { id: "burger-salsa-macerichada",     name: "Salsa Sweet & Sour",    category: "complement" },
];

const CAT_LABELS: Record<string, string> = {
  fat: "🍗 FAT", fit: "🥗 FIT", taco: "🌮 Tacos", burger: "🍔 Burgers",
  combo: "🔥 Combos", extra: "➕ Extras", bebida: "🥤 Bebidas",
  "burger-flavor": "🍔 Sabores Burger", "taco-flavor": "🌮 Sabores Taco",
  complement: "🌶️ Complementos",
};

const UNITS = ["unidades", "gramos", "kilogramos", "mililitros", "litros", "porciones", "paquetes", "otro"];

interface Supply {
  id: string; name: string; unit: string; available: number;
  minimum: number; controlStartDate: string; createdAt: string; updatedAt: string;
}

interface Movement {
  id: string; itemId: string; itemName: string;
  type: "inicial" | "entrada" | "consumo" | "ajuste" | "devolucion";
  quantity: number; balanceAfter: number; reference?: string;
  notes?: string; date: string; createdAt: string;
}

interface RecipeItem { itemId: string; quantity: number; scope: "per_product" | "per_order"; }
interface Recipe { productId: string; items: RecipeItem[]; updatedAt: string; }

export default function InventarioAdmin() {
  const [view, setView] = useState<"stock" | "recipes">("stock");
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deductionLog, setDeductionLog] = useState<any[]>([]);

  // Pending consumption states
  const [processingPendingId, setProcessingPendingId] = useState<string | null>(null);
  const [dismissingOrderId, setDismissingOrderId] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState("");
  const [pendingPreview, setPendingPreview] = useState<{ orderId: string; preview: any[] } | null>(null);

  // Modals
  const [modalSupply, setModalSupply] = useState<"new" | Supply | null>(null);
  const [modalEntry, setModalEntry] = useState<Supply | null>(null);
  const [modalAdjust, setModalAdjust] = useState<Supply | null>(null);
  const [modalMovements, setModalMovements] = useState<Supply | null>(null);
  const [movementsLoading, setMovementsLoading] = useState(false);

  // Recipe editing
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState<RecipeItem[]>([]);
  const [recipeSaving, setRecipeSaving] = useState(false);

  // Forms
  const emptySupplyForm = { name: "", unit: "unidades", initialQty: "", minimum: "", controlStartDate: new Date().toISOString().slice(0, 10) };
  const [supplyForm, setSupplyForm] = useState(emptySupplyForm);
  const [supplyFormSaving, setSupplyFormSaving] = useState(false);

  const [entryForm, setEntryForm] = useState({ quantity: "", date: new Date().toISOString().slice(0, 10), notes: "", usePackage: false, unitsPerPackage: "" });
  const [adjustForm, setAdjustForm] = useState({ delta: "", sign: "-" as "+" | "-", date: new Date().toISOString().slice(0, 10), notes: "" });
  const [entrySaving, setEntrySaving] = useState(false);

  const loadSupplies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supplies");
      if (res.ok) setSupplies(await res.json());
      else setSupplies([]);
    } finally { setLoading(false); }
  }, []);

  const loadRecipes = useCallback(async () => {
    const res = await fetch("/api/recipes");
    if (res.ok) setRecipes(await res.json());
  }, []);

  const loadDeductionLog = useCallback(async () => {
    const res = await fetch("/api/stock-deduction-log");
    if (res.ok) setDeductionLog(await res.json());
  }, []);

  useEffect(() => { loadSupplies(); loadDeductionLog(); }, [loadSupplies, loadDeductionLog]);
  useEffect(() => { if (view === "recipes") loadRecipes(); }, [view, loadRecipes]);

  // ── Status helpers ─────────────────────────────────────────────────────────
  const getStatus = (s: Supply) => {
    if (s.available <= 0) return "agotado";
    if (s.available <= s.minimum) return "bajo";
    return "ok";
  };
  const statusLabel = { ok: "Disponible", bajo: "Stock bajo", agotado: "Agotado" };
  const statusCls = { ok: "text-emerald-600", bajo: "text-amber-500", agotado: "text-red-500" };

  const lowItems = supplies.filter(s => getStatus(s) !== "ok");

  // ── Save supply (new / edit) ───────────────────────────────────────────────
  const handleSaveSupply = async () => {
    if (!supplyForm.name.trim()) return;
    setSupplyFormSaving(true);
    try {
      if (modalSupply === "new") {
        await fetch("/api/supplies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: supplyForm.name.trim(),
            unit: supplyForm.unit,
            initialQty: parseFloat(supplyForm.initialQty) || 0,
            minimum: parseFloat(supplyForm.minimum) || 0,
            controlStartDate: supplyForm.controlStartDate,
          }),
        });
      } else if (modalSupply && typeof modalSupply === "object") {
        await fetch("/api/supplies", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...modalSupply,
            name: supplyForm.name.trim(),
            unit: supplyForm.unit,
            minimum: parseFloat(supplyForm.minimum) || 0,
            controlStartDate: supplyForm.controlStartDate,
          }),
        });
      }
      await loadSupplies();
      setModalSupply(null);
    } finally { setSupplyFormSaving(false); }
  };

  const openNewSupply = () => {
    setSupplyForm(emptySupplyForm);
    setModalSupply("new");
  };
  const openEditSupply = (s: Supply) => {
    setSupplyForm({ name: s.name, unit: s.unit, initialQty: String(s.available), minimum: String(s.minimum), controlStartDate: s.controlStartDate });
    setModalSupply(s);
  };

  const handleDeleteSupply = async (id: string) => {
    if (!confirm("¿Eliminar este insumo y sus movimientos?")) return;
    await fetch(`/api/supplies?id=${id}`, { method: "DELETE" });
    await loadSupplies();
  };

  // ── Register entry ─────────────────────────────────────────────────────────
  const handleEntry = async () => {
    if (!modalEntry || !entryForm.quantity) return;
    setEntrySaving(true);
    try {
      await fetch("/api/supply-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: modalEntry.id,
          type: "entrada",
          quantity: parseFloat(entryForm.quantity),
          date: entryForm.date,
          notes: entryForm.notes || undefined,
          unitsPerPackage: entryForm.usePackage && entryForm.unitsPerPackage ? parseFloat(entryForm.unitsPerPackage) : undefined,
        }),
      });
      await loadSupplies();
      setModalEntry(null);
      setEntryForm({ quantity: "", date: new Date().toISOString().slice(0, 10), notes: "", usePackage: false, unitsPerPackage: "" });
    } finally { setEntrySaving(false); }
  };

  // ── Adjust stock ────────────────────────────────────────────────────────────
  const handleAdjust = async () => {
    if (!modalAdjust || !adjustForm.delta || !adjustForm.notes.trim()) return;
    setEntrySaving(true);
    try {
      const qty = parseFloat(adjustForm.delta) * (adjustForm.sign === "-" ? -1 : 1);
      await fetch("/api/supply-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: modalAdjust.id,
          type: "ajuste",
          quantity: qty,
          date: adjustForm.date,
          notes: adjustForm.notes.trim(),
        }),
      });
      await loadSupplies();
      setModalAdjust(null);
      setAdjustForm({ delta: "", sign: "-", date: new Date().toISOString().slice(0, 10), notes: "" });
    } finally { setEntrySaving(false); }
  };

  // ── Load movements for history ─────────────────────────────────────────────
  const openMovements = async (s: Supply) => {
    setModalMovements(s);
    setMovementsLoading(true);
    try {
      const res = await fetch(`/api/supply-movements?itemId=${s.id}`);
      if (res.ok) setMovements(await res.json());
    } finally { setMovementsLoading(false); }
  };

  // ── Recipe editing ─────────────────────────────────────────────────────────
  const openRecipe = (productId: string) => {
    const existing = recipes.find(r => r.productId === productId);
    setEditingItems(existing ? [...existing.items] : []);
    setEditingRecipeId(productId);
  };

  const saveRecipe = async () => {
    if (!editingRecipeId) return;
    setRecipeSaving(true);
    try {
      await fetch("/api/recipes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: editingRecipeId, items: editingItems }),
      });
      await loadRecipes();
      setEditingRecipeId(null);
    } finally { setRecipeSaving(false); }
  };

  const addRecipeRow = () => setEditingItems(prev => [...prev, { itemId: "", quantity: 0, scope: "per_product" }]);
  const updateRecipeRow = (i: number, field: keyof RecipeItem, val: string | number) =>
    setEditingItems(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const removeRecipeRow = (i: number) => setEditingItems(prev => prev.filter((_, idx) => idx !== i));

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmt = (n: number) => Number.isInteger(n) ? String(n) : n.toFixed(2);
  const movTypeLabel: Record<string, string> = {
    inicial: "Inicio", entrada: "Entrada", consumo: "Consumo",
    ajuste: "Ajuste", devolucion: "Devolución",
  };

  // ═══════════════════════════════ RENDER ════════════════════════════════════
  return (
    <div className="space-y-5">

      {/* ── STOCK VIEW ──────────────────────────────────────────────────────── */}
      {view === "stock" && (
        <>
          {/* Alert banner: stock bajo/agotado */}
          {lowItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-800 font-semibold">
              {lowItems.filter(s => getStatus(s) === "agotado").length > 0 && (
                <span className="text-red-600 mr-3">
                  {lowItems.filter(s => getStatus(s) === "agotado").length} agotado(s).
                </span>
              )}
              {lowItems.filter(s => getStatus(s) === "bajo").length} insumo(s) con stock bajo — revisar antes de preparar.
            </div>
          )}

          {/* Pending consumption warnings — 3 states: partial / dismissed / resolved */}
          {deductionLog.filter(e => e.partial).length > 0 && (
            <div className="bg-orange-50 border border-orange-300 rounded-xl px-4 py-3 space-y-2">
              <p className="text-sm font-bold text-orange-700">
                ⚠️ {deductionLog.filter(e => e.partial).length} pedido(s) con consumo incompleto
              </p>
              {deductionLog.filter(e => e.partial).map((entry: any) => {
                const stillPending = entry.pendingProducts || [];
                const dismissed = entry.dismissedProducts || [];
                const isDismissing = dismissingOrderId === entry.orderId;
                const isProcessing = processingPendingId === entry.orderId;
                return (
                  <div key={entry.orderId} className="bg-white border border-orange-200 rounded-lg px-3 py-2 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-700">Pedido {entry.orderId}</span>
                      <span className="text-gray-400">{entry.deductedAt?.slice(0,10)}</span>
                    </div>

                    {/* Still pending products (orange) */}
                    {stillPending.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-orange-600 font-semibold">Pendiente de consumo:</p>
                        <div className="flex flex-wrap gap-1">
                          {stillPending.map((p: any) => (
                            <span key={p.productId} className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-semibold">
                              {p.name}
                            </span>
                          ))}
                        </div>
                        <p className="text-gray-400">
                          Lo que se pudo descontar ya fue procesado. Configura la receta faltante y luego usa "Completar consumo".
                        </p>
                        {/* Actions */}
                        {!isDismissing && (
                          <div className="flex gap-2 pt-1">
                            <button
                              disabled={isProcessing}
                              onClick={async () => {
                                setProcessingPendingId(entry.orderId);
                                try {
                                  const res = await fetch(`/api/stock-consume-pending?orderId=${encodeURIComponent(entry.orderId)}`);
                                  const data = await res.json();
                                  if (res.ok) {
                                    setPendingPreview({ orderId: entry.orderId, preview: data.preview || [] });
                                  } else {
                                    alert("Error al previsualizar: " + (data.error || ""));
                                  }
                                } finally {
                                  setProcessingPendingId(null);
                                }
                              }}
                              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-3 py-1 rounded font-bold"
                            >
                              {isProcessing ? "Cargando..." : "Completar consumo"}
                            </button>
                            <button
                              onClick={() => { setDismissingOrderId(entry.orderId); setDismissReason(""); }}
                              className="border border-gray-300 text-gray-500 hover:text-gray-700 px-3 py-1 rounded font-bold"
                            >
                              Omitir
                            </button>
                          </div>
                        )}
                        {/* Dismiss reason input */}
                        {isDismissing && (
                          <div className="space-y-1 pt-1">
                            <input
                              type="text"
                              placeholder="Motivo para omitir (requerido)"
                              value={dismissReason}
                              onChange={e => setDismissReason(e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                            />
                            <div className="flex gap-2">
                              <button
                                disabled={!dismissReason.trim()}
                                onClick={async () => {
                                  await fetch("/api/stock-deduction-log", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ orderId: entry.orderId, action: "dismiss", reason: dismissReason }),
                                  });
                                  setDismissingOrderId(null);
                                  setDismissReason("");
                                  loadDeductionLog();
                                }}
                                className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white px-3 py-1 rounded font-bold"
                              >
                                Confirmar omisión
                              </button>
                              <button
                                onClick={() => setDismissingOrderId(null)}
                                className="border border-gray-300 text-gray-500 px-3 py-1 rounded"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dismissed products (gray) */}
                    {dismissed.length > 0 && (
                      <div className="space-y-1 border-t border-gray-100 pt-1">
                        <p className="text-gray-400 font-semibold">Omitidos expresamente:</p>
                        {dismissed.map((p: any, i: number) => (
                          <div key={i} className="flex flex-wrap items-center gap-1">
                            <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded line-through">{p.name}</span>
                            <span className="text-gray-400">— {p.reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Preview modal for pending consumption */}
          {pendingPreview && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                <h3 className="text-lg font-black text-gray-900">Confirmar consumo pendiente</h3>
                <p className="text-sm text-gray-500">Pedido <span className="font-bold text-gray-700">{pendingPreview.orderId}</span></p>
                {pendingPreview.preview.length === 0 ? (
                  <p className="text-sm text-orange-600">No hay recetas configuradas para los productos pendientes.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {pendingPreview.preview.map((p: any) => (
                      <div key={p.productId} className="bg-gray-50 rounded-lg px-3 py-2 text-xs">
                        <p className="font-bold text-gray-700 mb-1">{p.name}</p>
                        {p.hasRecipe ? (
                          <ul className="space-y-0.5">
                            {p.items.map((item: any, i: number) => (
                              <li key={i} className="text-gray-600">— {item.supplyName}: <span className="font-semibold">{item.qty}</span></li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-orange-500">Sin receta configurada — no se descontará</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    disabled={processingPendingId === pendingPreview.orderId || pendingPreview.preview.every((p: any) => !p.hasRecipe)}
                    onClick={async () => {
                      const orderId = pendingPreview.orderId;
                      setProcessingPendingId(orderId);
                      try {
                        // Include full deduction snapshot so server detects both product and recipe/quantity changes.
                        // Uses supplyId (stable) — immune to supply name changes.
                        const expectedProductIds = pendingPreview.preview.map((p: any) => p.productId);
                        const expectedDeductions = pendingPreview.preview.flatMap((p: any) =>
                          (p.items || []).map((item: any) => ({ productId: p.productId, supplyId: item.supplyId, qty: item.qty }))
                        );
                        const res = await fetch("/api/stock-consume-pending", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ orderId, expectedProductIds, expectedDeductions }),
                        });
                        const data = await res.json();
                        if (res.status === 409 && data.stale) {
                          alert("Las cantidades o recetas cambiaron desde la vista previa. Cierra y abre de nuevo para ver los valores actualizados.");
                          setPendingPreview(null);
                          await loadDeductionLog();
                        } else if (res.ok) {
                          setPendingPreview(null);
                          await Promise.all([loadDeductionLog(), loadSupplies()]);
                        } else {
                          alert("Error: " + (data.error || ""));
                        }
                      } finally {
                        setProcessingPendingId(null);
                      }
                    }}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-2 rounded-lg font-bold text-sm"
                  >
                    {processingPendingId === pendingPreview.orderId ? "Procesando..." : "Confirmar y descontar"}
                  </button>
                  <button
                    onClick={() => setPendingPreview(null)}
                    className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg font-bold text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xl font-black text-gray-900">Inventario</h3>
            <div className="flex gap-2">
              <button onClick={() => setView("recipes")}
                className="border border-gray-300 text-gray-700 hover:border-gray-500 px-4 py-2 rounded-lg text-xs font-bold transition-all">
                Configurar productos
              </button>
              <button onClick={openNewSupply}
                className="bg-[#F58424] hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all">
                + Agregar insumo
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-16 text-gray-400 text-sm">Cargando...</div>
          ) : supplies.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-sm text-gray-400">
              Sin insumos registrados. Agrega el primero con "+ Agregar insumo".
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 700 }}>
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {["Insumo o empaque", "Disponible", "Unidad", "Mínimo", "Estado", "Acciones"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {supplies.map(s => {
                      const st = getStatus(s);
                      return (
                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-900">{s.name}</td>
                          <td className={`px-4 py-3 font-black tabular-nums ${st === "agotado" ? "text-red-500" : st === "bajo" ? "text-amber-500" : "text-gray-800"}`}>
                            {fmt(s.available)}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{s.unit}</td>
                          <td className="px-4 py-3 text-gray-400 tabular-nums">{fmt(s.minimum)}</td>
                          <td className={`px-4 py-3 font-semibold ${statusCls[st]}`}>{statusLabel[st]}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              <button onClick={() => { setEntryForm({ quantity: "", date: new Date().toISOString().slice(0, 10), notes: "", usePackage: false, unitsPerPackage: "" }); setModalEntry(s); }}
                                className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-all">
                                Entrada
                              </button>
                              <button onClick={() => { setAdjustForm({ delta: "", sign: "-", date: new Date().toISOString().slice(0, 10), notes: "" }); setModalAdjust(s); }}
                                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition-all">
                                Ajustar
                              </button>
                              <button onClick={() => openMovements(s)}
                                className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-all">
                                Movimientos
                              </button>
                              <button onClick={() => openEditSupply(s)}
                                className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-all">
                                Editar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── RECIPES VIEW ────────────────────────────────────────────────────── */}
      {view === "recipes" && (
        <>
          <div className="flex items-center gap-4">
            <button onClick={() => { setView("stock"); setEditingRecipeId(null); }}
              className="text-sm text-gray-500 hover:text-gray-900 font-semibold flex items-center gap-1">
              ← Volver a Inventario
            </button>
            <h3 className="text-xl font-black text-gray-900">Configurar productos</h3>
          </div>

          {supplies.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700">
              Primero agrega insumos en Inventario para poder configurar recetas.
            </div>
          )}

          {/* Per-order items */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Consumo por pedido</p>
                <p className="text-xs text-gray-400 mt-0.5">Se descuenta una vez por pedido, independientemente de cuántos productos lleve.</p>
              </div>
              <button onClick={() => openRecipe("__per_order__")}
                className="bg-[#F58424] hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                {recipes.find(r => r.productId === "__per_order__") ? "Editar" : "Configurar"}
              </button>
            </div>
            {recipes.find(r => r.productId === "__per_order__")?.items?.length ? (
              <div className="px-4 py-3 text-xs text-gray-600 flex flex-wrap gap-3">
                {recipes.find(r => r.productId === "__per_order__")!.items.map((ri, i) => {
                  const sup = supplies.find(s => s.id === ri.itemId);
                  return (
                    <span key={i} className="bg-gray-50 border border-gray-200 px-2 py-1 rounded">
                      {sup?.name || ri.itemId}: {ri.quantity} {sup?.unit || ""}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="px-4 py-3 text-xs text-gray-400 italic">Sin consumos por pedido configurados.</p>
            )}
          </div>

          {/* Per-product recipes by category */}
          {Object.entries(CAT_LABELS).map(([cat, label]) => {
            const prods = CATALOG.filter(p => p.category === cat);
            if (!prods.length) return null;
            return (
              <div key={cat}>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{label}</h4>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                  {prods.map(prod => {
                    const recipe = recipes.find(r => r.productId === prod.id);
                    const hasItems = (recipe?.items?.length ?? 0) > 0;
                    return (
                      <div key={prod.id} className="px-4 py-3 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{prod.name}</p>
                          {hasItems ? (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {recipe!.items.map(ri => {
                                const sup = supplies.find(s => s.id === ri.itemId);
                                return `${sup?.name || ri.itemId} ×${ri.quantity}`;
                              }).join(", ")}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-300 italic">Sin receta configurada</p>
                          )}
                        </div>
                        <button onClick={() => openRecipe(prod.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${hasItems ? "border border-gray-300 text-gray-700 hover:border-gray-500" : "bg-[#F58424] hover:bg-orange-600 text-white"}`}>
                          {hasItems ? "Editar" : "Configurar"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ═══════════════════════ MODALS ═══════════════════════════════════════ */}

      {/* Add / Edit supply */}
      {modalSupply !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-black text-gray-900">{modalSupply === "new" ? "Agregar insumo" : "Editar insumo"}</h3>
              <button onClick={() => setModalSupply(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nombre</label>
                <input type="text" value={supplyForm.name}
                  onChange={e => setSupplyForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58424] focus:outline-none"
                  placeholder="Bowls, tapas, bolsas kraft..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Unidad de control</label>
                  <select value={supplyForm.unit} onChange={e => setSupplyForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58424] focus:outline-none">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Stock mínimo</label>
                  <input type="number" min="0" value={supplyForm.minimum}
                    onChange={e => setSupplyForm(f => ({ ...f, minimum: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58424] focus:outline-none"
                    placeholder="0" />
                </div>
              </div>
              {modalSupply === "new" && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Existencia inicial</label>
                  <input type="number" min="0" value={supplyForm.initialQty}
                    onChange={e => setSupplyForm(f => ({ ...f, initialQty: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58424] focus:outline-none"
                    placeholder="0" />
                  <p className="text-xs text-gray-400 mt-1">Para agregar stock después, usa "Entrada". No vuelvas a registrar el inicial.</p>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Inicio del control</label>
                <input type="date" value={supplyForm.controlStartDate}
                  onChange={e => setSupplyForm(f => ({ ...f, controlStartDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58424] focus:outline-none [color-scheme:light]" />
                <p className="text-xs text-gray-400 mt-1">No se descontará en pedidos anteriores a esta fecha.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center gap-3">
              {modalSupply !== "new" && (
                <button onClick={() => handleDeleteSupply((modalSupply as Supply).id)}
                  className="text-xs text-red-400 hover:text-red-600 font-semibold">
                  Eliminar
                </button>
              )}
              <div className="flex gap-3 ml-auto">
                <button onClick={() => setModalSupply(null)} className="px-4 py-2 text-sm text-gray-600 font-semibold">Cancelar</button>
                <button onClick={handleSaveSupply} disabled={supplyFormSaving || !supplyForm.name.trim()}
                  className="bg-[#F58424] hover:bg-orange-600 disabled:opacity-40 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all">
                  {supplyFormSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register entry */}
      {modalEntry && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-gray-900">Registrar entrada</h3>
                <p className="text-xs text-gray-400 mt-0.5">{modalEntry.name}</p>
              </div>
              <button onClick={() => setModalEntry(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Cantidad ({modalEntry.unit})</label>
                  <input type="number" min="0" step="any" value={entryForm.quantity}
                    onChange={e => setEntryForm(f => ({ ...f, quantity: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58424] focus:outline-none"
                    placeholder="0" autoFocus />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Fecha</label>
                  <input type="date" value={entryForm.date}
                    onChange={e => setEntryForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58424] focus:outline-none [color-scheme:light]" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input type="checkbox" checked={entryForm.usePackage}
                  onChange={e => setEntryForm(f => ({ ...f, usePackage: e.target.checked }))}
                  className="rounded" />
                <span className="text-gray-700">Viene en cajas / paquetes</span>
              </label>
              {entryForm.usePackage && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Unidades por paquete</label>
                  <input type="number" min="1" value={entryForm.unitsPerPackage}
                    onChange={e => setEntryForm(f => ({ ...f, unitsPerPackage: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58424] focus:outline-none"
                    placeholder="Ej: 100" />
                  {entryForm.quantity && entryForm.unitsPerPackage && (
                    <p className="text-xs text-gray-500 mt-1">
                      Total: {parseFloat(entryForm.quantity) * parseFloat(entryForm.unitsPerPackage)} {modalEntry.unit}
                    </p>
                  )}
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Notas (opcional)</label>
                <input type="text" value={entryForm.notes}
                  onChange={e => setEntryForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58424] focus:outline-none"
                  placeholder="Proveedor, factura..." />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModalEntry(null)} className="px-4 py-2 text-sm text-gray-600 font-semibold">Cancelar</button>
              <button onClick={handleEntry} disabled={entrySaving || !entryForm.quantity}
                className="bg-[#F58424] hover:bg-orange-600 disabled:opacity-40 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all">
                {entrySaving ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust stock */}
      {modalAdjust && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-gray-900">Ajustar existencia</h3>
                <p className="text-xs text-gray-400 mt-0.5">{modalAdjust.name} — actual: {fmt(modalAdjust.available)} {modalAdjust.unit}</p>
              </div>
              <button onClick={() => setModalAdjust(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Ajuste ({modalAdjust.unit})</label>
                <div className="flex gap-2">
                  <select value={adjustForm.sign} onChange={e => setAdjustForm(f => ({ ...f, sign: e.target.value as "+" | "-" }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold focus:border-[#F58424] focus:outline-none">
                    <option value="-">− Merma</option>
                    <option value="+">+ Devolución</option>
                  </select>
                  <input type="number" min="0" step="any" value={adjustForm.delta}
                    onChange={e => setAdjustForm(f => ({ ...f, delta: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58424] focus:outline-none"
                    placeholder="0" autoFocus />
                </div>
                {adjustForm.delta && (
                  <p className="text-xs text-gray-500 mt-1">
                    Resultado: {fmt(modalAdjust.available + parseFloat(adjustForm.delta) * (adjustForm.sign === "+" ? 1 : -1))} {modalAdjust.unit}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Fecha</label>
                <input type="date" value={adjustForm.date}
                  onChange={e => setAdjustForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58424] focus:outline-none [color-scheme:light]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Motivo (obligatorio)</label>
                <input type="text" value={adjustForm.notes}
                  onChange={e => setAdjustForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58424] focus:outline-none"
                  placeholder="Merma, error de conteo, devolución..." />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModalAdjust(null)} className="px-4 py-2 text-sm text-gray-600 font-semibold">Cancelar</button>
              <button onClick={handleAdjust} disabled={entrySaving || !adjustForm.delta || !adjustForm.notes.trim()}
                className="bg-[#F58424] hover:bg-orange-600 disabled:opacity-40 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all">
                {entrySaving ? "Guardando..." : "Ajustar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movement history */}
      {modalMovements && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-gray-900">Movimientos — {modalMovements.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Actual: {fmt(modalMovements.available)} {modalMovements.unit}</p>
              </div>
              <button onClick={() => setModalMovements(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <div className="overflow-y-auto flex-1">
              {movementsLoading ? (
                <div className="text-center py-10 text-gray-400 text-sm">Cargando...</div>
              ) : movements.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">Sin movimientos registrados.</div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      {["Fecha", "Movimiento", "Cantidad", "Saldo", "Referencia / Motivo"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(m => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{m.date}</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-800">{movTypeLabel[m.type] || m.type}</td>
                        <td className={`px-4 py-2.5 font-bold tabular-nums ${m.quantity < 0 ? "text-red-500" : "text-emerald-600"}`}>
                          {m.quantity > 0 ? "+" : ""}{fmt(m.quantity)}
                        </td>
                        <td className="px-4 py-2.5 text-gray-700 tabular-nums font-semibold">{fmt(m.balanceAfter)}</td>
                        <td className="px-4 py-2.5 text-gray-400">{m.reference || m.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-3 border-t border-gray-100">
              <button onClick={() => setModalMovements(null)} className="text-sm text-gray-500 font-semibold hover:text-gray-900">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe editor */}
      {editingRecipeId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-gray-900">
                  {editingRecipeId === "__per_order__"
                    ? "Consumo por pedido"
                    : CATALOG.find(p => p.id === editingRecipeId)?.name || editingRecipeId}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editingRecipeId === "__per_order__"
                    ? "Se descuenta una vez por pedido completo."
                    : "Se multiplica por la cantidad vendida de este producto."}
                </p>
              </div>
              <button onClick={() => setEditingRecipeId(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {editingItems.length === 0 ? (
                <p className="text-sm text-gray-400 italic mb-4">Sin insumos configurados. Agrega una fila.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  <div className="grid grid-cols-[1fr_80px_120px_28px] gap-2 px-1 mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Insumo</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase text-right">Cantidad</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Ámbito</span>
                    <span />
                  </div>
                  {editingItems.map((ri, i) => {
                    const sup = supplies.find(s => s.id === ri.itemId);
                    return (
                      <div key={i} className="grid grid-cols-[1fr_80px_120px_28px] gap-2 items-center">
                        <select value={ri.itemId} onChange={e => updateRecipeRow(i, "itemId", e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:border-[#F58424] focus:outline-none">
                          <option value="">— elegir —</option>
                          {supplies.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
                        </select>
                        <div className="flex items-center gap-1">
                          <input type="number" min="0" step="any" value={ri.quantity || ""}
                            onChange={e => updateRecipeRow(i, "quantity", parseFloat(e.target.value) || 0)}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:border-[#F58424] focus:outline-none" />
                        </div>
                        <select value={ri.scope} onChange={e => updateRecipeRow(i, "scope", e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:border-[#F58424] focus:outline-none">
                          <option value="per_product">Por unidad</option>
                          <option value="per_order">Por pedido</option>
                        </select>
                        <button onClick={() => removeRecipeRow(i)}
                          className="w-7 h-7 flex items-center justify-center rounded bg-red-50 hover:bg-red-100 text-red-400 font-bold text-xs">
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <button onClick={addRecipeRow}
                className="text-sm font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all">
                + Agregar fila
              </button>
              {supplies.length === 0 && (
                <p className="text-xs text-amber-500 mt-3">Agrega insumos primero en la pestaña Inventario.</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setEditingRecipeId(null)} className="px-4 py-2 text-sm text-gray-600 font-semibold">Cancelar</button>
              <button onClick={saveRecipe} disabled={recipeSaving}
                className="bg-[#F58424] hover:bg-orange-600 disabled:opacity-40 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all">
                {recipeSaving ? "Guardando..." : "Guardar receta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
