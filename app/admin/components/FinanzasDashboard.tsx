"use client";

import { useMemo, useState } from "react";

interface FinanzasDashboardProps {
  financialSection: "dashboard" | "purchases" | "products" | "stock" | "canjes";
  setFinancialSection: (s: "dashboard" | "purchases" | "products" | "stock" | "canjes") => void;
  orders: any[];
  inventory: any[];
  cajaData: any;
  cajaEditMode: boolean;
  setCajaEditMode: (b: boolean) => void;
  cajaEditBalance: string;
  setCajaEditBalance: (s: string) => void;
  cajaEditDate: string;
  setCajaEditDate: (s: string) => void;
  saveCajaSnapshot: () => void;
  dashboardDateFrom: string;
  setDashboardDateFrom: (s: string) => void;
  dashboardDateTo: string;
  setDashboardDateTo: (s: string) => void;
  isDashboardDateFiltered: boolean;
  setIsDashboardDateFiltered: (b: boolean) => void;
  inventoryCategoryFilter: string;
  setInventoryCategoryFilter: (s: string) => void;
  inventorySearchTerm: string;
  setInventorySearchTerm: (s: string) => void;
  liquidadoFilter: "all" | "pendiente" | "liquidado";
  setLiquidadoFilter: (s: "all" | "pendiente" | "liquidado") => void;
  toggleLiquidado: (id: string, current: boolean) => void;
  handleDeleteInventory: (id: string) => void;
  setEditingPurchase: (p: any) => void;
  setShowInventoryEditModal: (b: boolean) => void;
  getPeruDate: (d: string) => Date;
  loadInventory: () => void;
}

const CAT: Record<string, { icon: string; color: string; bg: string; border: string; label: string; barColor: string }> = {
  operativos: { icon: "🍖", color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",   label: "Insumos / Op.",  barColor: "bg-blue-400" },
  fijos:      { icon: "🏢", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", label: "Gastos Fijos",   barColor: "bg-purple-400" },
  personal:   { icon: "👥", color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200",  label: "Planilla",       barColor: "bg-green-400" },
  marketing:  { icon: "📢", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", label: "Marketing",      barColor: "bg-orange-400" },
};

const PAYMENT_LABEL: Record<string, string> = {
  "plin-yape":     "📱 Plin/Yape",
  "efectivo":      "💵 Efectivo",
  "transferencia": "🏦 Transf.",
  "tarjeta":       "💳 Tarjeta",
};

const EMPTY_EXP = {
  cat: "operativos", desc: "", amount: "", payment: "plin-yape", supplier: "",
  date: new Date().toISOString().split("T")[0],
};

export default function FinanzasDashboard({
  financialSection, setFinancialSection,
  orders, inventory, cajaData,
  cajaEditMode, setCajaEditMode, cajaEditBalance, setCajaEditBalance, cajaEditDate, setCajaEditDate,
  saveCajaSnapshot,
  dashboardDateFrom, setDashboardDateFrom, dashboardDateTo, setDashboardDateTo,
  isDashboardDateFiltered, setIsDashboardDateFiltered,
  inventoryCategoryFilter, setInventoryCategoryFilter,
  inventorySearchTerm, setInventorySearchTerm,
  liquidadoFilter, setLiquidadoFilter,
  toggleLiquidado, handleDeleteInventory,
  setEditingPurchase, setShowInventoryEditModal,
  getPeruDate, loadInventory,
}: FinanzasDashboardProps) {

  const [expandCaja,  setExpandCaja]  = useState(false);
  const [exp,         setExp]         = useState(EMPTY_EXP);
  const [submitting,  setSubmitting]  = useState(false);

  /* ─── Purchases date filter (independent from dashboard) ─── */
  const [purchasesDateFrom,       setPurchasesDateFrom]       = useState("");
  const [purchasesDateTo,         setPurchasesDateTo]         = useState("");
  const [isPurchasesDateFiltered, setIsPurchasesDateFiltered] = useState(false);

  /* ─── Caja ─── */
  const cajaSnapshot   = cajaData?.snapshotBalance || 0;
  const cajaSnapshotTs = cajaData?.snapshotCreatedAt || "";

  const ventasDesdeSnapshot = useMemo(() =>
    cajaSnapshotTs
      ? orders.filter((o: any) =>
          !o.isCanje &&
          (o.status === "delivered" || o.status === "Entregado" || o.status?.toLowerCase() === "entregado") &&
          (o.createdAt || "") > cajaSnapshotTs
        ).reduce((s: number, o: any) => s + (o.totalPrice || 0), 0)
      : 0,
  [orders, cajaSnapshotTs]);

  const pagosDesdeSnapshot = useMemo(() =>
    cajaSnapshotTs
      ? inventory.filter((p: any) => (p.createdAt || "") > cajaSnapshotTs)
          .reduce((s: number, p: any) => s + (p.totalAmount || 0), 0)
      : 0,
  [inventory, cajaSnapshotTs]);

  const cajaActual = cajaSnapshot + ventasDesdeSnapshot - pagosDesdeSnapshot;

  /* ─── Dashboard KPIs ─── */
  const dash = useMemo(() => {
    let delivered = orders.filter((o: any) =>
      !o.isCanje &&
      (o.status === "delivered" || o.status === "Entregado" || o.status?.toLowerCase() === "entregado")
    );
    let inv = inventory;

    if (isDashboardDateFiltered && dashboardDateFrom && dashboardDateTo) {
      delivered = delivered.filter((o: any) => {
        const dateStr = new Date(o.createdAt).toLocaleDateString("en-CA", { timeZone: "America/Lima" });
        return dateStr >= dashboardDateFrom && dateStr <= dashboardDateTo;
      });
      inv = inv.filter((p: any) => {
        const d = (p.purchaseDate || "").slice(0, 10);
        return d >= dashboardDateFrom && d <= dashboardDateTo;
      });
    }

    const totalVentas  = delivered.reduce((s: number, o: any) => s + (o.totalPrice || 0), 0);
    const byCateg = (cat: string) => inv.filter((p: any) => (p.category || "operativos") === cat).reduce((s: number, p: any) => s + (p.totalAmount || 0), 0);
    const compras    = byCateg("operativos");
    const fijos      = byCateg("fijos");
    const personal   = byCateg("personal");
    const mkt        = byCateg("marketing");
    const totalGastos = compras + fijos + personal + mkt;
    const utilidad   = totalVentas - totalGastos;
    const margen     = totalVentas > 0 ? (utilidad / totalVentas) * 100 : 0;
    const ticket     = delivered.length > 0 ? totalVentas / delivered.length : 0;
    const recup      = totalGastos > 0 ? (totalVentas / totalGastos) * 100 : 0;
    const porPagar   = inventory.filter((p: any) => !p.liquidado).reduce((s: number, p: any) => s + (p.totalAmount || 0), 0);
    const nPorPagar  = inventory.filter((p: any) => !p.liquidado).length;

    return { delivered, inv, totalVentas, compras, fijos, personal, mkt, totalGastos, utilidad, margen, ticket, recup, porPagar, nPorPagar };
  }, [orders, inventory, isDashboardDateFiltered, dashboardDateFrom, dashboardDateTo, getPeruDate]);

  /* ─── Purchases filtered ─── */
  const filteredInv = useMemo(() => {
    let list = inventory;
    if (isPurchasesDateFiltered && purchasesDateFrom && purchasesDateTo) {
      list = list.filter((p: any) => {
        const d = (p.purchaseDate || "").slice(0, 10);
        return d >= purchasesDateFrom && d <= purchasesDateTo;
      });
    }
    if (inventoryCategoryFilter !== "all") list = list.filter((p: any) => (p.category || "operativos") === inventoryCategoryFilter);
    if (inventorySearchTerm) {
      const q = inventorySearchTerm.toLowerCase();
      list = list.filter((p: any) =>
        p.items.some((it: any) => it.productName.toLowerCase().includes(q)) ||
        p.supplier?.toLowerCase().includes(q) ||
        p.paymentMethod?.toLowerCase().includes(q)
      );
    }
    if (liquidadoFilter !== "all") list = list.filter((p: any) => liquidadoFilter === "liquidado" ? !!p.liquidado : !p.liquidado);
    return list;
  }, [inventory, isPurchasesDateFiltered, purchasesDateFrom, purchasesDateTo, inventoryCategoryFilter, inventorySearchTerm, liquidadoFilter]);

  const purchaseSummary = useMemo(() => {
    const s = (cat: string) => filteredInv.filter((p: any) => (p.category || "operativos") === cat).reduce((a: number, p: any) => a + p.totalAmount, 0);
    const total     = filteredInv.reduce((a: number, p: any) => a + p.totalAmount, 0);
    const pendiente = filteredInv.filter((p: any) => !p.liquidado).reduce((a: number, p: any) => a + p.totalAmount, 0);
    return {
      operativos: s("operativos"), fijos: s("fijos"), personal: s("personal"), marketing: s("marketing"),
      total, pendiente, nPendiente: filteredInv.filter((p: any) => !p.liquidado).length,
    };
  }, [filteredInv]);

  /* ─── Helper: fecha en zona horaria Perú ─── */
  const peruDateStr = (d: Date = new Date()) =>
    d.toLocaleDateString("en-CA", { timeZone: "America/Lima" }); // "YYYY-MM-DD"

  /* ─── Preset helpers — Dashboard ─── */
  const setPreset = (preset: "today" | "month" | "all") => {
    if (preset === "today") {
      const t = peruDateStr();
      setDashboardDateFrom(t); setDashboardDateTo(t); setIsDashboardDateFiltered(true);
    } else if (preset === "month") {
      const today = peruDateStr();
      const [y, m] = today.split("-").map(Number);
      const first  = `${y}-${String(m).padStart(2, "0")}-01`;
      setDashboardDateFrom(first); setDashboardDateTo(today); setIsDashboardDateFiltered(true);
    } else {
      setDashboardDateFrom(""); setDashboardDateTo(""); setIsDashboardDateFiltered(false);
    }
  };

  const activePreset = (): "today" | "month" | "all" | null => {
    if (!isDashboardDateFiltered) return "all";
    const today = peruDateStr();
    if (dashboardDateFrom === today && dashboardDateTo === today) return "today";
    const [y, m] = today.split("-").map(Number);
    const first  = `${y}-${String(m).padStart(2, "0")}-01`;
    if (dashboardDateFrom === first && dashboardDateTo === today) return "month";
    return null;
  };

  /* ─── Preset helpers — Purchases ─── */
  const setPurchasesPreset = (preset: "today" | "month" | "all") => {
    if (preset === "today") {
      const t = peruDateStr();
      setPurchasesDateFrom(t); setPurchasesDateTo(t); setIsPurchasesDateFiltered(true);
    } else if (preset === "month") {
      const today = peruDateStr();
      const [y, m] = today.split("-").map(Number);
      const first  = `${y}-${String(m).padStart(2, "0")}-01`;
      setPurchasesDateFrom(first); setPurchasesDateTo(today); setIsPurchasesDateFiltered(true);
    } else {
      setPurchasesDateFrom(""); setPurchasesDateTo(""); setIsPurchasesDateFiltered(false);
    }
  };

  const activePurchasesPreset = (): "today" | "month" | "all" | null => {
    if (!isPurchasesDateFiltered) return "all";
    const today = peruDateStr();
    if (purchasesDateFrom === today && purchasesDateTo === today) return "today";
    const [y, m] = today.split("-").map(Number);
    const first  = `${y}-${String(m).padStart(2, "0")}-01`;
    if (purchasesDateFrom === first && purchasesDateTo === today) return "month";
    return null;
  };

  /* ─── Quick expense ─── */
  const submitExpense = async () => {
    if (!exp.desc.trim() || !exp.amount) return;
    const amt = parseFloat(exp.amount);
    if (isNaN(amt) || amt <= 0) return;
    setSubmitting(true);
    try {
      await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier: exp.supplier || "Sin proveedor",
          category: exp.cat,
          paymentMethod: exp.payment,
          items: [{ productName: exp.desc.trim(), quantity: 1, unit: "UNIDAD", unitCost: amt, total: amt }],
          totalAmount: amt,
          purchaseDate: exp.date,
        }),
      });
      setExp(EMPTY_EXP);
      await loadInventory();
    } finally {
      setSubmitting(false);
    }
  };

  /* ══════════════════════════════════════════
     COMPUTED — ventas por día + período anterior
  ══════════════════════════════════════════ */

  /* Daily sales breakdown (for current filtered delivered orders) */
  const dailySales = useMemo(() => {
    const map: Record<string, { date: string; count: number; revenue: number }> = {};
    dash.delivered.forEach((o: any) => {
      const d = new Date(o.createdAt).toLocaleDateString("en-CA", { timeZone: "America/Lima" });
      if (!map[d]) map[d] = { date: d, count: 0, revenue: 0 };
      map[d].count   += 1;
      map[d].revenue += o.totalPrice || 0;
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  }, [dash.delivered]);

  const maxDayRevenue = Math.max(...dailySales.map(d => d.revenue), 1);

  /* Previous period comparison */
  const prevDash = useMemo(() => {
    const hasPeriod = isDashboardDateFiltered && dashboardDateFrom && dashboardDateTo;
    if (!hasPeriod) return null;
    const from  = new Date(dashboardDateFrom + "T00:00:00-05:00");
    const to    = new Date(dashboardDateTo   + "T23:59:59-05:00");
    const span  = to.getTime() - from.getTime();
    const pFrom = new Date(from.getTime() - span - 86400000).toLocaleDateString("en-CA");
    const pTo   = new Date(from.getTime() - 86400000).toLocaleDateString("en-CA");

    const prevDelivered = orders.filter((o: any) => {
      if (o.isCanje) return false;
      const s = o.status?.toLowerCase();
      if (s !== "delivered" && s !== "entregado") return false;
      const d = new Date(o.createdAt).toLocaleDateString("en-CA", { timeZone: "America/Lima" });
      return d >= pFrom && d <= pTo;
    });
    const prevInv = inventory.filter((p: any) => {
      const d = (p.purchaseDate || "").slice(0, 10);
      return d >= pFrom && d <= pTo;
    });
    const prevVentas  = prevDelivered.reduce((s: number, o: any) => s + (o.totalPrice || 0), 0);
    const prevGastos  = prevInv.reduce((s: number, p: any) => s + (p.totalAmount || 0), 0);
    const prevUtilidad = prevVentas - prevGastos;
    return { ventas: prevVentas, gastos: prevGastos, utilidad: prevUtilidad };
  }, [orders, inventory, isDashboardDateFiltered, dashboardDateFrom, dashboardDateTo]);

  const delta = (cur: number, prev: number | null) => {
    if (prev === null || prev === 0) return null;
    return ((cur - prev) / Math.abs(prev)) * 100;
  };

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <section className="bg-[#F8FAFC] min-h-screen">

      {/* ── HEADER STICKY ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          {/* Period controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:inline">Período</span>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {([
                { key: "today", label: "Hoy" },
                { key: "month", label: "Mes" },
                { key: "all",   label: "Todo" },
              ] as const).map(p => (
                <button key={p.key} onClick={() => setPreset(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activePreset() === p.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}>{p.label}</button>
              ))}
            </div>
            {isDashboardDateFiltered && (
              <div className="flex items-center gap-1">
                <input type="date" value={dashboardDateFrom}
                  onChange={e => { setDashboardDateFrom(e.target.value); setIsDashboardDateFiltered(true); }}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-gray-400 bg-white" />
                <span className="text-gray-400 text-xs">—</span>
                <input type="date" value={dashboardDateTo}
                  onChange={e => { setDashboardDateTo(e.target.value); setIsDashboardDateFiltered(true); }}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-gray-400 bg-white" />
              </div>
            )}
          </div>

          {/* Shortcuts */}
          <div className="flex items-center gap-2">
            {dash.nPorPagar > 0 && (
              <button onClick={() => { setFinancialSection("purchases"); setLiquidadoFilter("pendiente"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all">
                ⏳ {dash.nPorPagar} pend. · S/{dash.porPagar.toFixed(0)}
              </button>
            )}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {(["dashboard", "purchases"] as const).map(tab => (
                <button key={tab} onClick={() => setFinancialSection(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    financialSection === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}>
                  {tab === "dashboard" ? "Resumen" : "Gastos"}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════ RESUMEN ════════════════════════ */}
      {financialSection === "dashboard" && (
        <div className="px-6 py-6 space-y-5">

          {/* ── ROW 1: Hero metrics ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Ingresos */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ingresos netos</p>
              <p className="text-4xl font-black text-gray-900 leading-none">S/ {dash.totalVentas.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-2">{dash.delivered.length} pedidos entregados</p>
              {(() => {
                const d = delta(dash.totalVentas, prevDash?.ventas ?? null);
                if (d === null) return null;
                return (
                  <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-black ${d >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                    {d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(1)}% vs período anterior
                  </div>
                );
              })()}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-400 rounded-b-2xl opacity-60" />
            </div>

            {/* Gastos */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Gastos totales</p>
              <p className="text-4xl font-black text-gray-900 leading-none">S/ {dash.totalGastos.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-2">{dash.inv.length} registros · {Object.entries({ operativos: dash.compras, fijos: dash.fijos, personal: dash.personal, marketing: dash.mkt }).filter(([,v]) => v > 0).length} categorías</p>
              {(() => {
                const d = delta(dash.totalGastos, prevDash?.gastos ?? null);
                if (d === null) return null;
                return (
                  <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-black ${d <= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                    {d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(1)}% vs período anterior
                  </div>
                );
              })()}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-400 rounded-b-2xl opacity-60" />
            </div>

            {/* Resultado */}
            <div className={`rounded-2xl border shadow-sm p-5 relative overflow-hidden ${
              dash.utilidad >= 0
                ? "bg-emerald-600 border-emerald-500"
                : "bg-red-600 border-red-500"
            }`}>
              <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />
              <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-2">
                {dash.utilidad >= 0 ? "Resultado · ganancia" : "Resultado · pérdida"}
              </p>
              <p className="text-4xl font-black text-white leading-none">
                {dash.utilidad >= 0 ? "+" : ""}S/ {dash.utilidad.toFixed(2)}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-white/80">
                  {dash.margen.toFixed(1)}% margen neto
                </span>
                <span className="text-[10px] text-white/60">·</span>
                <span className="text-xs text-white/80">
                  Recuperación {dash.recup.toFixed(0)}%
                </span>
              </div>
              {(() => {
                const d = delta(dash.utilidad, prevDash?.utilidad ?? null);
                if (d === null) return null;
                return (
                  <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-black ${d >= 0 ? "bg-white/20 text-white" : "bg-black/20 text-white"}`}>
                    {d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(1)}% vs período anterior
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ── ROW 2: Secondary KPIs ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: "Ticket promedio",
                value: dash.delivered.length > 0 ? `S/ ${dash.ticket.toFixed(2)}` : "—",
                sub: `${dash.delivered.length} órdenes`,
                icon: "🧾",
              },
              {
                label: "Días con ventas",
                value: String(dailySales.length),
                sub: dailySales.length > 0 ? `Mejor: S/${Math.max(...dailySales.map(d => d.revenue)).toFixed(0)}` : "Sin ventas",
                icon: "📅",
              },
              {
                label: "Caja actual",
                value: `S/ ${cajaActual.toFixed(2)}`,
                sub: cajaData ? `Base S/${cajaSnapshot.toFixed(0)} · ${cajaData.snapshotDate || "—"}` : "Sin configurar",
                icon: "💰",
                color: cajaActual >= 0 ? "text-emerald-600" : "text-red-500",
              },
              {
                label: "Por pagar",
                value: dash.nPorPagar > 0 ? `S/ ${dash.porPagar.toFixed(2)}` : "Al día",
                sub: dash.nPorPagar > 0 ? `${dash.nPorPagar} compra${dash.nPorPagar > 1 ? "s" : ""} pendiente${dash.nPorPagar > 1 ? "s" : ""}` : "Sin deuda pendiente",
                icon: dash.nPorPagar > 0 ? "⏳" : "✅",
                color: dash.nPorPagar > 0 ? "text-amber-600" : "text-emerald-600",
                warn: dash.nPorPagar > 0,
              },
            ].map(kpi => (
              <div key={kpi.label} className={`bg-white rounded-xl border p-4 shadow-sm ${kpi.warn ? "border-amber-200" : "border-gray-100"}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                  <span className="text-base">{kpi.icon}</span>
                </div>
                <p className={`text-xl font-black ${kpi.color || "text-gray-900"}`}>{kpi.value}</p>
                <p className="text-[10px] text-gray-400 mt-1">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* ── ROW 3: Gastos desglose + Caja ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Gastos breakdown (3/5) */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black text-gray-800">Desglose de gastos</h3>
                <span className="text-xs text-gray-400">Total: <span className="font-black text-gray-800">S/ {dash.totalGastos.toFixed(2)}</span></span>
              </div>
              {dash.totalGastos === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sin gastos registrados en este período</p>
              ) : (
                <div className="space-y-4">
                  {([
                    { key: "operativos", value: dash.compras,  icon: "🍖", label: "Insumos / Operativos",  color: "bg-blue-500",   text: "text-blue-700",   bg: "bg-blue-50"   },
                    { key: "fijos",      value: dash.fijos,    icon: "🏢", label: "Gastos fijos",          color: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50" },
                    { key: "personal",   value: dash.personal, icon: "👥", label: "Personal / Planilla",   color: "bg-green-500",  text: "text-green-700",  bg: "bg-green-50"  },
                    { key: "marketing",  value: dash.mkt,      icon: "📢", label: "Marketing / Publicidad",color: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50" },
                  ].filter(c => c.value > 0 || dash.totalGastos === 0)).map(c => {
                    const pct = dash.totalGastos > 0 ? (c.value / dash.totalGastos) * 100 : 0;
                    return (
                      <div key={c.key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{c.icon}</span>
                            <span className={`text-xs font-bold ${c.text}`}>{c.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-gray-400 font-semibold">{pct.toFixed(0)}%</span>
                            <span className={`text-sm font-black ${c.text}`}>S/ {c.value.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${c.color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className={`mt-5 pt-4 border-t border-gray-100 flex items-center justify-between`}>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Recuperación</p>
                  <p className={`text-3xl font-black ${dash.recup >= 100 ? "text-emerald-600" : "text-red-500"}`}>{dash.recup.toFixed(0)}%</p>
                  <p className="text-[10px] text-gray-400 mt-1">de cada S/ invertido</p>
                </div>
                {dash.totalGastos > 0 && (
                  <div className="text-right">
                    {dash.utilidad >= 0 ? (
                      <>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">Excedente</p>
                        <p className="text-xl font-black text-emerald-600">+S/ {dash.utilidad.toFixed(2)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide">Déficit</p>
                        <p className="text-xl font-black text-red-500">S/ {dash.utilidad.toFixed(2)}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Caja (2/5) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
              <h3 className="text-sm font-black text-gray-800 mb-4">Caja corriente</h3>
              <div className={`rounded-xl p-4 mb-4 ${cajaActual >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Saldo estimado</p>
                <p className={`text-3xl font-black ${cajaActual >= 0 ? "text-emerald-700" : "text-red-600"}`}>S/ {cajaActual.toFixed(2)}</p>
              </div>
              {cajaData && (
                <div className="space-y-2 text-xs mb-4 flex-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base {cajaData.snapshotDate}</span>
                    <span className="font-bold text-gray-700">S/ {cajaSnapshot.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">+ Ventas desde base</span>
                    <span className="font-bold text-emerald-600">+S/ {ventasDesdeSnapshot.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">− Pagos desde base</span>
                    <span className="font-bold text-red-500">−S/ {pagosDesdeSnapshot.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between">
                    <span className="font-bold text-gray-600">Saldo actual</span>
                    <span className={`font-black ${cajaActual >= 0 ? "text-emerald-600" : "text-red-500"}`}>S/ {cajaActual.toFixed(2)}</span>
                  </div>
                </div>
              )}
              {!cajaEditMode ? (
                <button
                  onClick={() => {
                    setCajaEditBalance(cajaData ? String(cajaData.snapshotBalance) : "");
                    setCajaEditDate(cajaData?.snapshotDate || new Date().toLocaleDateString("en-CA"));
                    setCajaEditMode(true);
                  }}
                  className="w-full mt-auto py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:border-gray-400 hover:text-gray-800 transition-all"
                >
                  {cajaData ? "Ajustar base de caja" : "Configurar caja inicial"}
                </button>
              ) : (
                <div className="space-y-2">
                  <input type="number" step="0.01" value={cajaEditBalance}
                    onChange={e => setCajaEditBalance(e.target.value)}
                    placeholder="Saldo base" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400" />
                  <input type="date" value={cajaEditDate}
                    onChange={e => setCajaEditDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400" />
                  <div className="flex gap-2">
                    <button onClick={saveCajaSnapshot} className="flex-1 bg-gray-900 text-white py-2 rounded-xl text-sm font-bold hover:bg-gray-700">Guardar</button>
                    <button onClick={() => setCajaEditMode(false)} className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm hover:bg-gray-200">✕</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── ROW 4: Ventas por día ── */}
          {dailySales.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-gray-800">Ventas por día</h3>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{dailySales.length} días con ventas</span>
              </div>
              <div className="space-y-2">
                {dailySales.map(day => {
                  const barPct = (day.revenue / maxDayRevenue) * 100;
                  const dateObj = new Date(day.date + "T12:00:00");
                  const label = dateObj.toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "short" });
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-400 w-24 shrink-0 capitalize">{label}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full transition-all duration-500 flex items-center pl-2"
                          style={{ width: `${Math.max(barPct, 3)}%` }}>
                          {barPct > 20 && <span className="text-[10px] font-bold text-white whitespace-nowrap">S/ {day.revenue.toFixed(0)}</span>}
                        </div>
                      </div>
                      {barPct <= 20 && <span className="text-[10px] font-bold text-gray-600 shrink-0">S/ {day.revenue.toFixed(0)}</span>}
                      <span className="text-[10px] text-gray-400 w-16 text-right shrink-0">{day.count} pedido{day.count !== 1 ? "s" : ""}</span>
                    </div>
                  );
                })}
              </div>
              {dailySales.length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-6 text-xs text-gray-500">
                  <span>Promedio/día: <strong className="text-gray-800">S/ {(dash.totalVentas / dailySales.length).toFixed(2)}</strong></span>
                  <span>Mejor día: <strong className="text-emerald-600">S/ {maxDayRevenue.toFixed(2)}</strong></span>
                  <span>Días activos: <strong className="text-gray-800">{dailySales.length}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* ── ROW 5: Quick expense ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Registrar gasto rápido</p>
            <div className="flex gap-2 flex-wrap mb-3">
              {(["operativos", "fijos", "personal", "marketing"] as const).map(cat => {
                const cfg = CAT[cat];
                return (
                  <button key={cat} onClick={() => setExp(e => ({ ...e, cat }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      exp.cat === cat
                        ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-2 ring-offset-1 ring-current`
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    }`}>
                    {cfg.icon} {cfg.label}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <input type="text" placeholder="Concepto *" value={exp.desc} onChange={e => setExp(x => ({ ...x, desc: e.target.value }))}
                className="col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400" />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">S/</span>
                <input type="number" placeholder="Monto *" step="0.01" min="0" value={exp.amount} onChange={e => setExp(x => ({ ...x, amount: e.target.value }))}
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400" />
              </div>
              <select value={exp.payment} onChange={e => setExp(x => ({ ...x, payment: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 bg-white focus:outline-none focus:border-gray-400">
                <option value="plin-yape">📱 Plin/Yape</option>
                <option value="efectivo">💵 Efectivo</option>
                <option value="transferencia">🏦 Transf.</option>
                <option value="tarjeta">💳 Tarjeta</option>
              </select>
              <input type="text" placeholder="Proveedor" value={exp.supplier} onChange={e => setExp(x => ({ ...x, supplier: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400" />
              <input type="date" value={exp.date} onChange={e => setExp(x => ({ ...x, date: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-gray-400" />
            </div>
            <div className="flex justify-end mt-3">
              <button onClick={submitExpense} disabled={submitting || !exp.desc.trim() || !exp.amount}
                className="px-6 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-40">
                {submitting ? "Guardando..." : "Guardar gasto →"}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ════════════════════════ GASTOS ════════════════════════ */}
      {financialSection === "purchases" && (
        <div className="px-6 py-5 space-y-4">

          {/* Period presets — Purchases */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Período</span>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {([
                { key: "today", label: "Hoy" },
                { key: "month", label: "Mes" },
                { key: "all",   label: "Todo" },
              ] as const).map(p => (
                <button key={p.key} onClick={() => setPurchasesPreset(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activePurchasesPreset() === p.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}>{p.label}</button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <input type="date" value={purchasesDateFrom}
                onChange={e => { setPurchasesDateFrom(e.target.value); setIsPurchasesDateFiltered(true); }}
                className="px-2 py-1 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-gray-400 bg-white" />
              <span className="text-gray-400 text-xs">—</span>
              <input type="date" value={purchasesDateTo}
                onChange={e => { setPurchasesDateTo(e.target.value); setIsPurchasesDateFiltered(true); }}
                className="px-2 py-1 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-gray-400 bg-white" />
              {isPurchasesDateFiltered && (
                <button onClick={() => setPurchasesPreset("all")} className="ml-1 text-gray-400 hover:text-gray-600 text-xs font-bold">✕</button>
              )}
            </div>
          </div>

          {/* Summary chips */}
          <div className="flex flex-wrap gap-2">
            <div onClick={() => setInventoryCategoryFilter("all")}
              className={`cursor-pointer bg-white rounded-xl border px-4 py-2.5 flex items-center gap-2 transition-all ${
                inventoryCategoryFilter === "all" ? "border-gray-800 ring-1 ring-gray-800" : "border-gray-200 hover:border-gray-300"
              }`}>
              <span className="text-xs font-bold text-gray-500">Todos</span>
              <span className="text-sm font-black text-gray-900">S/{purchaseSummary.total.toFixed(0)}</span>
            </div>
            {(["operativos", "fijos", "personal", "marketing"] as const).map(key => {
              const cfg = CAT[key];
              const val = purchaseSummary[key];
              if (val === 0 && inventoryCategoryFilter !== key) return null;
              return (
                <div key={key} onClick={() => setInventoryCategoryFilter(inventoryCategoryFilter === key ? "all" : key)}
                  className={`cursor-pointer ${cfg.bg} rounded-xl border px-4 py-2.5 flex items-center gap-2 transition-all ${
                    inventoryCategoryFilter === key ? `${cfg.border} ring-2 ring-offset-1` : cfg.border
                  }`}>
                  <span className={`text-xs font-bold ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                  <span className={`text-sm font-black ${cfg.color}`}>S/{val.toFixed(0)}</span>
                </div>
              );
            })}
            {purchaseSummary.nPendiente > 0 && (
              <div onClick={() => setLiquidadoFilter(liquidadoFilter === "pendiente" ? "all" : "pendiente")}
                className={`cursor-pointer rounded-xl border px-4 py-2.5 flex items-center gap-2 transition-all ${
                  liquidadoFilter === "pendiente" ? "bg-amber-100 border-amber-400 ring-2 ring-amber-400 ring-offset-1" : "bg-amber-50 border-amber-200 hover:bg-amber-100"
                }`}>
                <span className="text-xs font-bold text-amber-700">⏳ Por pagar</span>
                <span className="text-sm font-black text-amber-700">S/{purchaseSummary.pendiente.toFixed(0)}</span>
              </div>
            )}
            <div className="relative ml-auto">
              <input type="text" placeholder="Buscar..." value={inventorySearchTerm}
                onChange={e => setInventorySearchTerm(e.target.value)}
                className="pl-3 pr-7 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 w-44 bg-white" />
              {inventorySearchTerm && (
                <button onClick={() => setInventorySearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold">✕</button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filteredInv.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🛒</p>
                <p className="font-semibold text-gray-500 text-sm">
                  {inventorySearchTerm ? `Sin resultados para "${inventorySearchTerm}"` : "No hay gastos en este período"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Proveedor</th>
                      <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">Cat.</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Concepto</th>
                      <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">Pago</th>
                      <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">Acc.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredInv.map((purchase: any) =>
                      purchase.items.map((item: any, itemIdx: number) => {
                        const cfg    = CAT[purchase.category || "operativos"] || CAT.operativos;
                        const isOp   = (purchase.category || "operativos") === "operativos";
                        const rowTotal = isOp ? item.unitCost : item.total;
                        return (
                          <tr key={`${purchase.id}-${itemIdx}`}
                            className={`hover:bg-gray-50 transition-colors ${!purchase.liquidado ? "bg-amber-50/30" : ""}`}>
                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                              {new Date(purchase.purchaseDate).toLocaleDateString("es-PE", { day:"2-digit", month:"2-digit", year:"2-digit" })}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs font-semibold text-gray-800">{purchase.supplier}</p>
                              {purchase.supplierPhone && <p className="text-[10px] text-gray-400">{purchase.supplierPhone}</p>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 ${cfg.bg} rounded-lg text-sm`}>{cfg.icon}</span>
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold text-gray-800">{item.productName || "—"}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-[10px] font-semibold text-gray-500">{PAYMENT_LABEL[purchase.paymentMethod] || purchase.paymentMethod}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-xs font-black text-gray-900">S/ {(rowTotal || 0).toFixed(2)}</span>
                            </td>
                            {itemIdx === 0 ? (
                              <td className="px-4 py-3 text-center" rowSpan={purchase.items.length}>
                                <button onClick={() => toggleLiquidado(purchase.id, !!purchase.liquidado)}
                                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border transition-all ${
                                    purchase.liquidado
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                      : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                  }`}>
                                  {purchase.liquidado ? "✅ Pagado" : "⏳ Pagar"}
                                </button>
                              </td>
                            ) : null}
                            <td className="px-4 py-3 text-center">
                              {itemIdx === 0 && (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button onClick={() => { setEditingPurchase(purchase); setShowInventoryEditModal(true); }}
                                    className="text-gray-300 hover:text-amber-500 transition-colors text-base" title="Editar">✏️</button>
                                  <button onClick={() => handleDeleteInventory(purchase.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors text-sm font-bold" title="Eliminar">✕</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-xs font-black text-gray-500 text-right uppercase tracking-wide">Total período</td>
                      <td className="px-4 py-3 text-right text-sm font-black text-gray-900">S/ {purchaseSummary.total.toFixed(2)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </section>
  );
}