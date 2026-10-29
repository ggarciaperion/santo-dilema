"use client";
import { useState, useEffect, useCallback } from "react";

// ─── Catálogo maestro de productos conocidos ────────────────────────────────
// Fuente única: reproduce exactamente los productId usados en checkout/orders.
const CATALOG_PRODUCTS = [
  // FAT
  { id: "pequeno-dilema",    name: "Pequeño Dilema",        category: "fat",    price: 22 },
  { id: "duo-dilema",        name: "Dúo Dilema",            category: "fat",    price: 34 },
  { id: "santo-pecado",      name: "Santo Pecado",          category: "fat",    price: 47 },
  // FIT
  { id: "ensalada-clasica",       name: "Clásica Fresh Bowl",    category: "fit", price: 18.5 },
  { id: "ensalada-proteica",      name: "César Power Bowl",       category: "fit", price: 20 },
  { id: "ensalada-caesar",        name: "Protein Fit Bowl",       category: "fit", price: 20 },
  { id: "ensalada-mediterranea",  name: "Tuna Fresh Bowl",        category: "fit", price: 23.5 },
  { id: "cobb-supreme-bowl",      name: "Cobb Supreme Bowl",      category: "fit", price: 23.5 },
  { id: "crispy-chicken-bowl",    name: "Crispy Chicken Bowl",    category: "fit", price: 22.5 },
  { id: "pasta-power-bowl",       name: "Pasta Power Bowl",       category: "fit", price: 22.5 },
  // TACO
  { id: "taco-duo",          name: "Dúo de Tacos",          category: "taco",   price: 24.9 },
  // BURGER
  { id: "burger-duo",        name: "Dúo Mini Burgers",      category: "burger", price: 19.9 },
  { id: "burger-trio",       name: "Trío Mini Burgers",     category: "burger", price: 23.5 },
  // COMBOS
  { id: "combo-chiguan",        name: "Combo Chiguan",        category: "combo", price: 20 },
  { id: "combo-perfecto",       name: "Combo Perfecto",       category: "combo", price: 40 },
  { id: "combo-especial",       name: "Combo Especial",       category: "combo", price: 42 },
  { id: "combo-alitas",         name: "Combo Alitas",         category: "combo", price: 52 },
  { id: "combo-santo-dilema",   name: "Combo Santo Dilema",   category: "combo", price: 76 },
  // BEBIDAS
  { id: "coca-cola",         name: "Coca Cola 500ml",        category: "bebida", price: 4 },
  { id: "inka-cola",         name: "Inka Cola 500ml",        category: "bebida", price: 4 },
  { id: "sprite",            name: "Sprite 500ml",           category: "bebida", price: 4 },
  { id: "fanta",             name: "Fanta 500ml",            category: "bebida", price: 4 },
  { id: "agua-mineral",      name: "Agua mineral",           category: "bebida", price: 4 },
  // EXTRAS
  { id: "extra-papas",       name: "Extra papas",            category: "extra",  price: 5 },
  { id: "extra-nachos",      name: "Extra nachos",           category: "extra",  price: 5 },
  { id: "extra-salsa",       name: "Extra salsa",            category: "extra",  price: 3 },
  { id: "extra-aderezo",     name: "Extra aderezo",          category: "extra",  price: 3 },
  { id: "pollo-grillado",    name: "Pollo grillado",         category: "extra",  price: 5 },
  { id: "nachos",            name: "Nachos (incluido)",      category: "extra",  price: 0 },
  { id: "papas-fritas",      name: "Papas fritas (incluidas)", category: "extra", price: 0 },
  { id: "chifles",           name: "Chifles (incluidos)",    category: "extra",  price: 0 },
];

const CAT_LABELS: Record<string, string> = {
  fat: "🍗 FAT", fit: "🥗 FIT", taco: "🌮 Tacos",
  burger: "🍔 Burgers", combo: "🔥 Combos",
  bebida: "🥤 Bebidas", extra: "➕ Extras",
};

const CAT_ORDER = ["fat","fit","taco","burger","combo","bebida","extra"];

interface ProductCostRecord {
  id: string;
  productId: string;
  productName: string;
  category: string;
  cost: number;
  breakdown: { ingredientes?: number; empaque?: number; salsas?: number; papas?: number; otros?: number };
  effectiveFrom: string;
  notes: string;
  createdAt: string;
}

interface OrderMarginRow {
  orderId: string;
  orderDate: string;
  customerName: string;
  ventaNeta: number;
  costoVendido: number | null; // null = algún item sin costo
  margenBruto: number | null;
  margenPct: number | null;
  hasMissingCosts: boolean;
  items: { name: string; qty: number; precio: number; costo: number | null }[];
}

interface Props {
  orders: any[];
}

// ─── Helper: costo vigente para un productId en una fecha dada ───────────────
function getCostAtDate(
  productId: string,
  date: string, // ISO string
  costRecords: ProductCostRecord[]
): ProductCostRecord | null {
  const orderDate = date.slice(0, 10); // "YYYY-MM-DD"
  const relevant = costRecords
    .filter(r => r.productId === productId && r.effectiveFrom <= orderDate)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  return relevant[0] || null;
}

// ─── Helper: costo vigente más reciente (para mostrar en registro) ───────────
function getCurrentCost(productId: string, costRecords: ProductCostRecord[]): ProductCostRecord | null {
  const today = new Date().toISOString().slice(0, 10);
  return getCostAtDate(productId, today, costRecords);
}

// ─── Helper: calcular margen de un pedido ───────────────────────────────────
function calcOrderMargin(order: any, costRecords: ProductCostRecord[]): OrderMarginRow {
  const orderDate = order.createdAt || order.timestamp || new Date().toISOString();
  const deliveryCost = order.deliveryCost || 0;
  const ventaNeta = (order.totalPrice || 0) - deliveryCost;

  const items = order.completedOrders || order.cart || [];
  let totalCosto = 0;
  let hasMissingCosts = false;
  const itemRows: OrderMarginRow["items"] = [];

  items.forEach((item: any) => {
    const pid = item.productId || "";
    const qty = item.quantity || 1;
    const precio = (item.finalPrice ?? item.price ?? 0);

    // Costo del producto principal
    const costRec = getCostAtDate(pid, orderDate, costRecords);
    const unitCost = costRec ? costRec.cost : null;
    if (unitCost === null) hasMissingCosts = true;
    else totalCosto += unitCost * qty;

    itemRows.push({ name: item.name || pid, qty, precio, costo: unitCost });

    // Costo de complementos (bebidas, extras)
    const compIds: string[] = item.complementIds || [];
    compIds.forEach((compId: string) => {
      const compCostRec = getCostAtDate(compId, orderDate, costRecords);
      const compUnitCost = compCostRec ? compCostRec.cost : null;
      if (compUnitCost === null) hasMissingCosts = true;
      else totalCosto += compUnitCost;
    });
  });

  const costoVendido = hasMissingCosts ? null : totalCosto;
  const margenBruto = costoVendido !== null ? ventaNeta - costoVendido : null;
  const margenPct = margenBruto !== null && ventaNeta > 0 ? (margenBruto / ventaNeta) * 100 : null;

  return {
    orderId: order.id,
    orderDate,
    customerName: order.name || "—",
    ventaNeta,
    costoVendido,
    margenBruto,
    margenPct,
    hasMissingCosts,
    items: itemRows,
  };
}

// ────────────────────────────────────────────────────────────────────────────
export default function CostosMargenesAdmin({ orders }: Props) {
  const [subTab, setSubTab] = useState<"registro" | "margenes" | "reporte">("registro");
  const [costRecords, setCostRecords] = useState<ProductCostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal de edición de costo
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProductCostRecord | null>(null);
  const [form, setForm] = useState({
    productId: "",
    productName: "",
    category: "fat",
    cost: "",
    ingredientes: "",
    empaque: "",
    salsas: "",
    papas: "",
    otros: "",
    effectiveFrom: new Date().toISOString().slice(0, 10),
    notes: "",
    useBreakdown: false,
  });

  // Filtros de márgenes
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // ── Cargar costos ─────────────────────────────────────────────────────────
  const loadCosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/costs");
      if (res.ok) setCostRecords(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCosts(); }, [loadCosts]);

  // ── Abrir modal para nuevo costo ──────────────────────────────────────────
  const openNew = (product?: (typeof CATALOG_PRODUCTS)[0]) => {
    setEditingRecord(null);
    const cur = product ? getCurrentCost(product.id, costRecords) : null;
    setForm({
      productId: product?.id || "",
      productName: product?.name || "",
      category: product?.category || "fat",
      cost: cur ? String(cur.cost) : "",
      ingredientes: cur ? String(cur.breakdown.ingredientes ?? "") : "",
      empaque: cur ? String(cur.breakdown.empaque ?? "") : "",
      salsas: cur ? String(cur.breakdown.salsas ?? "") : "",
      papas: cur ? String(cur.breakdown.papas ?? "") : "",
      otros: cur ? String(cur.breakdown.otros ?? "") : "",
      effectiveFrom: new Date().toISOString().slice(0, 10),
      notes: "",
      useBreakdown: false,
    });
    setShowModal(true);
  };

  const openEdit = (record: ProductCostRecord) => {
    setEditingRecord(record);
    const b = record.breakdown || {};
    const hasBreakdown = Object.values(b).some(v => v && v > 0);
    setForm({
      productId: record.productId,
      productName: record.productName,
      category: record.category,
      cost: String(record.cost),
      ingredientes: String(b.ingredientes ?? ""),
      empaque: String(b.empaque ?? ""),
      salsas: String(b.salsas ?? ""),
      papas: String(b.papas ?? ""),
      otros: String(b.otros ?? ""),
      effectiveFrom: record.effectiveFrom,
      notes: record.notes || "",
      useBreakdown: hasBreakdown,
    });
    setShowModal(true);
  };

  // Calcular costo total desde desglose
  const breakdownTotal =
    (parseFloat(form.ingredientes) || 0) +
    (parseFloat(form.empaque) || 0) +
    (parseFloat(form.salsas) || 0) +
    (parseFloat(form.papas) || 0) +
    (parseFloat(form.otros) || 0);

  const effectiveCost = form.useBreakdown && breakdownTotal > 0 ? breakdownTotal : parseFloat(form.cost) || 0;

  const handleSave = async () => {
    if (!form.productId || effectiveCost <= 0) return;
    setSaving(true);
    try {
      const payload = {
        productId: form.productId,
        productName: form.productName,
        category: form.category,
        cost: effectiveCost,
        breakdown: form.useBreakdown ? {
          ingredientes: parseFloat(form.ingredientes) || 0,
          empaque: parseFloat(form.empaque) || 0,
          salsas: parseFloat(form.salsas) || 0,
          papas: parseFloat(form.papas) || 0,
          otros: parseFloat(form.otros) || 0,
        } : {},
        effectiveFrom: form.effectiveFrom,
        notes: form.notes,
      };

      if (editingRecord) {
        await fetch("/api/costs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingRecord.id, ...payload }),
        });
      } else {
        await fetch("/api/costs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      await loadCosts();
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este registro de costo?")) return;
    await fetch(`/api/costs?id=${id}`, { method: "DELETE" });
    await loadCosts();
  };

  // ── Pedidos válidos para márgen ──────────────────────────────────────────
  const deliveredOrders = orders.filter(o =>
    !o.isCanje &&
    (o.status === "delivered" || o.status === "Entregado" || o.status?.toLowerCase() === "entregado")
  );

  const filteredOrders = deliveredOrders.filter(o => {
    if (!dateFrom && !dateTo) return true;
    const d = (o.createdAt || "").slice(0, 10);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  });

  const marginRows: OrderMarginRow[] = filteredOrders.map(o => calcOrderMargin(o, costRecords));

  // KPIs agregados (solo pedidos con costos completos)
  const completeRows = marginRows.filter(r => !r.hasMissingCosts);
  const totalVenta = marginRows.reduce((s, r) => s + r.ventaNeta, 0);
  const totalCosto = completeRows.reduce((s, r) => s + (r.costoVendido || 0), 0);
  const totalMargen = completeRows.reduce((s, r) => s + (r.margenBruto || 0), 0);
  const margenPctTotal = totalVenta > 0 ? (totalMargen / completeRows.reduce((s, r) => s + r.ventaNeta, 0)) * 100 : null;
  const pendingCount = marginRows.filter(r => r.hasMissingCosts).length;

  // ── Reporte por producto ─────────────────────────────────────────────────
  const productReport: Record<string, { name: string; category: string; units: number; venta: number; costo: number; hasMissing: boolean }> = {};
  filteredOrders.forEach(order => {
    const items = order.completedOrders || order.cart || [];
    const orderDate = order.createdAt || order.timestamp || "";
    items.forEach((item: any) => {
      const pid = item.productId || item.name || "";
      const qty = item.quantity || 1;
      const precio = (item.finalPrice ?? item.price ?? 0) * qty;
      const costRec = getCostAtDate(pid, orderDate, costRecords);
      if (!productReport[pid]) {
        productReport[pid] = { name: item.name || pid, category: item.category || "—", units: 0, venta: 0, costo: 0, hasMissing: false };
      }
      productReport[pid].units += qty;
      productReport[pid].venta += precio;
      if (costRec) productReport[pid].costo += costRec.cost * qty;
      else productReport[pid].hasMissing = true;
    });
  });
  const reportRows = Object.entries(productReport).map(([, v]) => v).sort((a, b) => b.venta - a.venta);

  // ── Helpers UI ─────────────────────────────────────────────────────────
  const fmt = (n: number) => `S/ ${n.toFixed(2)}`;
  const pctColor = (p: number | null) => {
    if (p === null) return "text-gray-400";
    if (p >= 50) return "text-emerald-400";
    if (p >= 30) return "text-amber-400";
    return "text-red-400";
  };

  // Productos ordenados por categoría para la tabla de registro
  const productsByCategory = CAT_ORDER.map(cat => ({
    cat,
    products: CATALOG_PRODUCTS.filter(p => p.category === cat),
  })).filter(g => g.products.length > 0);

  // Historial de costos (todos los registros, agrupados por producto)
  const costHistory = [...costRecords].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sub-nav */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {(["registro","margenes","reporte"] as const).map(tab => (
            <button key={tab} onClick={() => setSubTab(tab)}
              className={`px-5 py-3 text-sm font-bold border-b-2 -mb-px transition-all ${subTab === tab ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"}`}>
              {tab === "registro" ? "📋 Registro de costos" : tab === "margenes" ? "📊 Márgenes por venta" : "📈 Reporte"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">

        {/* ════════════════════════ REGISTRO ════════════════════════ */}
        {subTab === "registro" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-gray-900">Registro de costos</h3>
                <p className="text-sm text-gray-500 mt-0.5">Registra el costo de preparación de cada producto. El costo vigente se aplica a los pedidos según su fecha.</p>
              </div>
            </div>

            {/* Tabla por categoría */}
            {loading ? (
              <div className="text-center py-12 text-gray-400">Cargando...</div>
            ) : (
              productsByCategory.map(({ cat, products }) => (
                <div key={cat}>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{CAT_LABELS[cat]}</h4>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 uppercase">Producto</th>
                          <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600 uppercase">Precio</th>
                          <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600 uppercase">Costo vigente</th>
                          <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600 uppercase">Margen bruto</th>
                          <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600 uppercase">Desde</th>
                          <th className="px-4 py-2.5 text-center text-xs font-bold text-gray-600 uppercase">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p, i) => {
                          const cur = getCurrentCost(p.id, costRecords);
                          const margen = cur && p.price > 0 ? ((p.price - cur.cost) / p.price) * 100 : null;
                          return (
                            <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-800">{p.name}</td>
                              <td className="px-4 py-3 text-right text-sm text-gray-600">{p.price > 0 ? fmt(p.price) : "—"}</td>
                              <td className="px-4 py-3 text-right">
                                {cur ? (
                                  <span className="text-sm font-bold text-red-500">{fmt(cur.cost)}</span>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">sin costo</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {margen !== null ? (
                                  <span className={`text-sm font-black ${pctColor(margen)}`}>{margen.toFixed(1)}%</span>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right text-xs text-gray-400">
                                {cur ? cur.effectiveFrom : "—"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button onClick={() => openNew(p)}
                                  className="bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                                  {cur ? "Actualizar" : "+ Registrar"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}

            {/* Historial de registros */}
            {costHistory.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Historial de registros ({costHistory.length})</h4>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 uppercase">Producto</th>
                        <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600 uppercase">Costo</th>
                        <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600 uppercase">Vigente desde</th>
                        <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 uppercase hidden md:table-cell">Desglose</th>
                        <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 uppercase hidden lg:table-cell">Notas</th>
                        <th className="px-4 py-2.5 text-center text-xs font-bold text-gray-600 uppercase">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costHistory.map((r, i) => {
                        const b = r.breakdown || {};
                        const hasBreakdown = Object.values(b).some(v => v && (v as number) > 0);
                        return (
                          <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50 text-sm ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                            <td className="px-4 py-3 font-semibold text-gray-800">{r.productName}</td>
                            <td className="px-4 py-3 text-right font-bold text-red-500">{fmt(r.cost)}</td>
                            <td className="px-4 py-3 text-right text-gray-500">{r.effectiveFrom}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                              {hasBreakdown ? (
                                <div className="space-y-0.5">
                                  {b.ingredientes ? <div>Ing. S/{b.ingredientes}</div> : null}
                                  {b.empaque ? <div>Emp. S/{b.empaque}</div> : null}
                                  {b.salsas ? <div>Sals. S/{b.salsas}</div> : null}
                                  {b.papas ? <div>Papas S/{b.papas}</div> : null}
                                  {b.otros ? <div>Otros S/{b.otros}</div> : null}
                                </div>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{r.notes || "—"}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => openEdit(r)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">Editar</button>
                                <button onClick={() => handleDelete(r.id)} className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">×</button>
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
          </div>
        )}

        {/* ════════════════════════ MÁRGENES ════════════════════════ */}
        {subTab === "margenes" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-xl font-black text-gray-900">Márgenes por venta</h3>
                <p className="text-sm text-gray-500 mt-0.5">Solo pedidos entregados y no canjeados. Venta neta = totalPedido − delivery.</p>
              </div>
              <div className="flex gap-2 items-center text-sm">
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700" />
                <span className="text-gray-400">–</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700" />
                {(dateFrom || dateTo) && (
                  <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-gray-400 hover:text-gray-600">Limpiar</button>
                )}
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Venta neta", value: fmt(totalVenta), sub: `${marginRows.length} pedidos` },
                { label: "Costo vendido", value: fmt(totalCosto), sub: `${completeRows.length} con costo` },
                { label: "Margen bruto", value: fmt(totalMargen), sub: margenPctTotal !== null ? `${margenPctTotal.toFixed(1)}%` : "—" },
                { label: "Sin costo", value: String(pendingCount), sub: "pedidos incompletos", warn: pendingCount > 0 },
              ].map(kpi => (
                <div key={kpi.label} className={`bg-white rounded-xl border p-4 ${kpi.warn && pendingCount > 0 ? "border-amber-300" : "border-gray-200"}`}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">{kpi.label}</p>
                  <p className={`text-2xl font-black mt-1 ${kpi.warn && pendingCount > 0 ? "text-amber-500" : "text-gray-900"}`}>{kpi.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* Tabla de pedidos */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 uppercase">Pedido</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 uppercase hidden md:table-cell">Fecha</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 uppercase hidden lg:table-cell">Cliente</th>
                    <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600 uppercase">Venta neta</th>
                    <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600 uppercase">Costo</th>
                    <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600 uppercase">Margen</th>
                    <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600 uppercase">%</th>
                    <th className="px-4 py-2.5 text-center text-xs font-bold text-gray-600 uppercase">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {marginRows.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">Sin pedidos entregados en el período.</td></tr>
                  ) : marginRows.map((row, i) => (
                    <>
                      <tr key={row.orderId}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/40"}`}>
                        <td className="px-4 py-3 font-bold text-sm text-gray-800">{row.orderId}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                          {new Date(row.orderDate).toLocaleDateString("es-PE", { day:"2-digit", month:"short", year:"2-digit", timeZone:"America/Lima" })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{row.customerName}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-800">{fmt(row.ventaNeta)}</td>
                        <td className="px-4 py-3 text-right text-sm">
                          {row.costoVendido !== null ? (
                            <span className="text-red-500 font-semibold">{fmt(row.costoVendido)}</span>
                          ) : (
                            <span className="text-xs text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded">pendiente</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          {row.margenBruto !== null ? (
                            <span className={`font-bold ${row.margenBruto >= 0 ? "text-emerald-600" : "text-red-500"}`}>{fmt(row.margenBruto)}</span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.margenPct !== null ? (
                            <span className={`text-sm font-black ${pctColor(row.margenPct)}`}>{row.margenPct.toFixed(1)}%</span>
                          ) : <span className="text-gray-300 text-sm">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => setExpandedOrder(expandedOrder === row.orderId ? null : row.orderId)}
                            className="text-xs text-blue-500 hover:text-blue-700 font-bold">
                            {expandedOrder === row.orderId ? "▲" : "▼"}
                          </button>
                        </td>
                      </tr>
                      {expandedOrder === row.orderId && (
                        <tr key={`${row.orderId}-detail`} className="bg-blue-50/40">
                          <td colSpan={8} className="px-6 py-3">
                            <table className="w-full text-xs">
                              <thead><tr className="text-gray-500 uppercase">
                                <th className="text-left pb-1">Ítem</th>
                                <th className="text-right pb-1">Cant.</th>
                                <th className="text-right pb-1">P.venta</th>
                                <th className="text-right pb-1">Costo unit.</th>
                              </tr></thead>
                              <tbody>
                                {row.items.map((it, j) => (
                                  <tr key={j} className="border-t border-blue-100">
                                    <td className="py-1 text-gray-700 font-medium">{it.name}</td>
                                    <td className="py-1 text-right text-gray-600">{it.qty}</td>
                                    <td className="py-1 text-right text-gray-600">{fmt(it.precio)}</td>
                                    <td className="py-1 text-right">
                                      {it.costo !== null ? (
                                        <span className="text-red-500 font-semibold">{fmt(it.costo)}</span>
                                      ) : (
                                        <span className="text-amber-500 italic">sin costo</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════ REPORTE ════════════════════════ */}
        {subTab === "reporte" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-xl font-black text-gray-900">Reporte por producto</h3>
                <p className="text-sm text-gray-500 mt-0.5">Resumen agregado. Margen % calculado sobre totales, no promedio de porcentajes.</p>
              </div>
              <div className="flex gap-2 items-center">
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700" />
                <span className="text-gray-400">–</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700" />
                {(dateFrom || dateTo) && (
                  <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-gray-400 hover:text-gray-600">Limpiar</button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 uppercase">Producto</th>
                    <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600 uppercase">Unidades</th>
                    <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600 uppercase">Venta neta</th>
                    <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600 uppercase">Costo</th>
                    <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600 uppercase">Margen</th>
                    <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600 uppercase">%</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Sin datos en el período.</td></tr>
                  ) : reportRows.map((row, i) => {
                    const margen = row.venta > 0 && !row.hasMissing ? row.venta - row.costo : null;
                    const pct = margen !== null && row.venta > 0 ? (margen / row.venta) * 100 : null;
                    return (
                      <tr key={i} className={`border-b border-gray-100 hover:bg-gray-50 text-sm ${i % 2 === 0 ? "" : "bg-gray-50/40"}`}>
                        <td className="px-4 py-3 font-semibold text-gray-800">{row.name}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{row.units}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmt(row.venta)}</td>
                        <td className="px-4 py-3 text-right">
                          {row.hasMissing ? (
                            <span className="text-xs text-amber-500 font-bold bg-amber-50 px-1.5 py-0.5 rounded">costo pendiente</span>
                          ) : (
                            <span className="text-red-500 font-semibold">{fmt(row.costo)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {margen !== null ? (
                            <span className={`font-bold ${margen >= 0 ? "text-emerald-600" : "text-red-500"}`}>{fmt(margen)}</span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {pct !== null ? (
                            <span className={`font-black ${pctColor(pct)}`}>{pct.toFixed(1)}%</span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {reportRows.length > 0 && (
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                    <tr>
                      <td className="px-4 py-3 font-black text-sm text-gray-900">TOTAL</td>
                      <td className="px-4 py-3 text-right font-bold text-sm text-gray-900">
                        {reportRows.reduce((s, r) => s + r.units, 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-sm text-gray-900">
                        {fmt(reportRows.reduce((s, r) => s + r.venta, 0))}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-sm text-red-500">
                        {fmt(reportRows.filter(r => !r.hasMissing).reduce((s, r) => s + r.costo, 0))}
                      </td>
                      <td colSpan={2} className="px-4 py-3 text-right font-black text-sm text-emerald-600">
                        {(() => {
                          const tv = reportRows.reduce((s, r) => s + r.venta, 0);
                          const tc = reportRows.filter(r => !r.hasMissing).reduce((s, r) => s + r.costo, 0);
                          const tm = tv - tc;
                          const tp = tv > 0 ? (tm / tv) * 100 : null;
                          return `${fmt(tm)} (${tp !== null ? tp.toFixed(1) + "%" : "—"})`;
                        })()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ════════════ MODAL COSTO ════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-black text-gray-900">{editingRecord ? "Editar costo" : "Registrar costo"}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{form.productName}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Producto (si es nuevo sin producto preseleccionado) */}
              {!editingRecord && !form.productName && (
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Producto</label>
                  <select value={form.productId}
                    onChange={e => {
                      const p = CATALOG_PRODUCTS.find(x => x.id === e.target.value);
                      setForm(f => ({ ...f, productId: e.target.value, productName: p?.name || "", category: p?.category || "fat" }));
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">— Selecciona —</option>
                    {CAT_ORDER.map(cat => (
                      <optgroup key={cat} label={CAT_LABELS[cat]}>
                        {CATALOG_PRODUCTS.filter(p => p.category === cat).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              {/* Desglose toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.useBreakdown} onChange={e => setForm(f => ({ ...f, useBreakdown: e.target.checked }))}
                  className="rounded" />
                <span className="text-sm font-semibold text-gray-700">Desglosar por concepto</span>
              </label>

              {form.useBreakdown ? (
                <div className="space-y-2 bg-gray-50 rounded-xl p-4">
                  {[
                    { key: "ingredientes", label: "🥩 Ingredientes" },
                    { key: "empaque",      label: "📦 Empaque" },
                    { key: "salsas",       label: "🌶️ Salsas" },
                    { key: "papas",        label: "🍟 Papas" },
                    { key: "otros",        label: "➕ Otros" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-28">{label}</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
                        <input type="number" step="0.01" min="0"
                          value={(form as any)[key]}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-sm" />
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">Total</span>
                    <span className="font-black text-red-500">{fmt(breakdownTotal)}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Costo total de preparación</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">S/</span>
                    <input type="number" step="0.01" min="0" value={form.cost}
                      onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm" />
                  </div>
                </div>
              )}

              {/* Fecha de vigencia */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Vigente desde</label>
                <input type="date" value={form.effectiveFrom}
                  onChange={e => setForm(f => ({ ...f, effectiveFrom: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <p className="text-xs text-gray-400 mt-1">Pedidos entregados desde esta fecha usarán este costo. No altera pedidos anteriores.</p>
              </div>

              {/* Notas */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Notas (opcional)</label>
                <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="ej: subió el precio del pollo" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-semibold">Cancelar</button>
              <button onClick={handleSave} disabled={saving || effectiveCost <= 0}
                className="bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all">
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
