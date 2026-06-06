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
      const from = new Date(dashboardDateFrom + "T00:00:00-05:00");
      const to   = new Date(dashboardDateTo   + "T23:59:59-05:00");
      delivered = delivered.filter((o: any) => { const d = getPeruDate(o.createdAt); return d >= from && d <= to; });
      inv       = inv.filter((p: any) => { const d = (p.purchaseDate || "").slice(0,10); return d >= dashboardDateFrom && d <= dashboardDateTo; });
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
    if (isDashboardDateFiltered && dashboardDateFrom && dashboardDateTo) {
      const from = new Date(dashboardDateFrom + "T00:00:00-05:00");
      const to   = new Date(dashboardDateTo   + "T23:59:59-05:00");
      list = list.filter((p: any) => { const d = getPeruDate(p.purchaseDate); return d >= from && d <= to; });
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
  }, [inventory, isDashboardDateFiltered, dashboardDateFrom, dashboardDateTo, inventoryCategoryFilter, inventorySearchTerm, liquidadoFilter, getPeruDate]);

  const purchaseSummary = useMemo(() => {
    const s = (cat: string) => filteredInv.filter((p: any) => (p.category || "operativos") === cat).reduce((a: number, p: any) => a + p.totalAmount, 0);
    const total     = filteredInv.reduce((a: number, p: any) => a + p.totalAmount, 0);
    const pendiente = filteredInv.filter((p: any) => !p.liquidado).reduce((a: number, p: any) => a + p.totalAmount, 0);
    return {
      operativos: s("operativos"), fijos: s("fijos"), personal: s("personal"), marketing: s("marketing"),
      total, pendiente, nPendiente: filteredInv.filter((p: any) => !p.liquidado).length,
    };
  }, [filteredInv]);

  /* ─── Preset helpers ─── */
  const setPreset = (preset: "today" | "month" | "all") => {
    if (preset === "today") {
      const t = new Date().toISOString().split("T")[0];
      setDashboardDateFrom(t); setDashboardDateTo(t); setIsDashboardDateFiltered(true);
    } else if (preset === "month") {
      const now   = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      setDashboardDateFrom(first); setDashboardDateTo(now.toISOString().split("T")[0]); setIsDashboardDateFiltered(true);
    } else {
      setDashboardDateFrom(""); setDashboardDateTo(""); setIsDashboardDateFiltered(false);
    }
  };

  const activePreset = (): "today" | "month" | "all" | null => {
    if (!isDashboardDateFiltered) return "all";
    const today = new Date().toISOString().split("T")[0];
    if (dashboardDateFrom === today && dashboardDateTo === today) return "today";
    const now   = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    if (dashboardDateFrom === first && dashboardDateTo === today) return "month";
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

  const preset = activePreset();

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <section className="bg-gray-50 min-h-screen">

      {/* ── HEADER ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-black text-gray-900 leading-none">Finanzas</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">Caja · ingresos · gastos</p>
            </div>
            <button
              onClick={() => setExpandCaja(v => !v)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-black border transition-all ${
                cajaActual >= 0
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              }`}
            >
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Caja</span>
              S/ {cajaActual.toFixed(2)}
              {expandCaja ? " ▲" : " ▼"}
            </button>
            {dash.nPorPagar > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                <span className="text-[10px] font-bold text-amber-600">⏳ {dash.nPorPagar} por pagar</span>
                <span className="text-xs font-black text-amber-700">S/{dash.porPagar.toFixed(0)}</span>
              </div>
            )}
          </div>
          {/* Main tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(["dashboard", "purchases"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFinancialSection(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  financialSection === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "dashboard" ? "📊 Resumen" : "🛒 Gastos"}
              </button>
            ))}
          </div>
        </div>

        {/* Caja expand */}
        {expandCaja && (
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Caja actual</p>
              <p className={`text-3xl font-black ${cajaActual >= 0 ? "text-emerald-600" : "text-red-600"}`}>S/ {cajaActual.toFixed(2)}</p>
              {cajaData && (
                <div className="flex flex-wrap gap-4 text-xs text-gray-400 mt-2">
                  <span>Base: <span className="text-gray-700 font-bold">S/ {cajaSnapshot.toFixed(2)}</span></span>
                  <span>+ Ventas: <span className="text-emerald-600 font-bold">S/ {ventasDesdeSnapshot.toFixed(2)}</span></span>
                  <span>− Pagos: <span className="text-red-500 font-bold">S/ {pagosDesdeSnapshot.toFixed(2)}</span></span>
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              {!cajaEditMode ? (
                <button
                  onClick={() => {
                    setCajaEditBalance(cajaData ? String(cajaData.snapshotBalance) : "");
                    setCajaEditDate(cajaData?.snapshotDate || new Date().toLocaleDateString("en-CA"));
                    setCajaEditMode(true);
                  }}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-all"
                >
                  {cajaData ? "Ajustar base" : "Configurar caja"}
                </button>
              ) : (
                <div className="bg-white border border-gray-300 rounded-xl p-4 space-y-2.5 min-w-[230px]">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Base de caja</p>
                  <input
                    type="number" step="0.01" value={cajaEditBalance}
                    onChange={e => setCajaEditBalance(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-indigo-400 focus:outline-none"
                    placeholder="521.80"
                  />
                  <input
                    type="date" value={cajaEditDate}
                    onChange={e => setCajaEditDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-indigo-400 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveCajaSnapshot} className="flex-1 bg-gray-900 hover:bg-gray-700 text-white py-1.5 rounded-lg text-sm font-bold">Guardar</button>
                    <button onClick={() => setCajaEditMode(false)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg text-sm">✕</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-5">

        {/* Period presets — shared */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Período</span>
          {([
            { key: "today", label: "Hoy" },
            { key: "month", label: "Este mes" },
            { key: "all",   label: "Histórico" },
          ] as const).map(p => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                preset === p.key
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════ RESUMEN ═══════════════════════ */}
        {financialSection === "dashboard" && (
          <div className="space-y-5">

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Ingresos", value: `S/ ${dash.totalVentas.toFixed(2)}`, sub: `${dash.delivered.length} pedidos`,    cls: "text-emerald-600" },
                { label: "Gastos",   value: `S/ ${dash.totalGastos.toFixed(2)}`, sub: `${dash.inv.length} compras`,          cls: "text-red-500" },
                { label: "Utilidad", value: `S/ ${dash.utilidad.toFixed(2)}`,    sub: "Ingresos − gastos",                   cls: dash.utilidad >= 0 ? "text-emerald-600" : "text-red-500" },
                { label: "Margen",   value: `${dash.margen.toFixed(1)}%`,        sub: `Ticket S/ ${dash.ticket.toFixed(2)}`, cls: "text-indigo-600" },
              ].map(k => (
                <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
                  <p className={`text-2xl font-black ${k.cls}`}>{k.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Gastos breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-wide">Desglose de gastos</h3>
                <span className="text-xs text-gray-400">Total: <span className="font-black text-gray-700">S/ {dash.totalGastos.toFixed(2)}</span></span>
              </div>
              <div className="space-y-3">
                {([
                  { key: "operativos", value: dash.compras },
                  { key: "fijos",      value: dash.fijos },
                  { key: "personal",   value: dash.personal },
                  { key: "marketing",  value: dash.mkt },
                ] as const).map(({ key, value }) => {
                  const cfg = CAT[key];
                  const pct = dash.totalGastos > 0 ? (value / dash.totalGastos) * 100 : 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{pct.toFixed(0)}%</span>
                          <span className={`text-xs font-black ${cfg.color}`}>S/ {value.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${cfg.barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Recuperación de inversión</p>
                  <p className={`text-3xl font-black ${dash.recup >= 100 ? "text-emerald-600" : "text-amber-500"}`}>{dash.recup.toFixed(0)}%</p>
                  <p className={`text-xs mt-1 ${dash.recup >= 100 ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                    {dash.recup >= 100
                      ? `✓ Excedente S/ ${(dash.totalVentas - dash.totalGastos).toFixed(2)}`
                      : `Faltan S/ ${(dash.totalGastos - dash.totalVentas).toFixed(2)} para recuperar`}
                  </p>
                </div>
                {dash.nPorPagar > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-right">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">⏳ Por pagar</p>
                    <p className="text-xl font-black text-amber-600">S/ {dash.porPagar.toFixed(2)}</p>
                    <button
                      onClick={() => { setFinancialSection("purchases"); setLiquidadoFilter("pendiente"); }}
                      className="text-[10px] font-bold text-amber-700 underline hover:no-underline mt-1 block"
                    >
                      Ver pendientes →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ GASTOS ═══════════════════════ */}
        {financialSection === "purchases" && (
          <div className="space-y-4">

            {/* Quick expense form */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3">Registrar gasto / compra</p>
              <div className="flex gap-2 flex-wrap mb-3">
                {(["operativos", "fijos", "personal", "marketing"] as const).map(cat => {
                  const cfg = CAT[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setExp(e => ({ ...e, cat }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        exp.cat === cat
                          ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-1 ring-offset-1 ring-current`
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <input
                  type="text" placeholder="Concepto *"
                  value={exp.desc} onChange={e => setExp(x => ({ ...x, desc: e.target.value }))}
                  className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400"
                />
                <input
                  type="number" placeholder="S/ monto *" step="0.01" min="0"
                  value={exp.amount} onChange={e => setExp(x => ({ ...x, amount: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400"
                />
                <select
                  value={exp.payment} onChange={e => setExp(x => ({ ...x, payment: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-800 bg-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="plin-yape">📱 Plin/Yape</option>
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="transferencia">🏦 Transf.</option>
                  <option value="tarjeta">💳 Tarjeta</option>
                </select>
                <input
                  type="text" placeholder="Proveedor"
                  value={exp.supplier} onChange={e => setExp(x => ({ ...x, supplier: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400"
                />
                <input
                  type="date" value={exp.date}
                  onChange={e => setExp(x => ({ ...x, date: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={submitExpense}
                  disabled={submitting || !exp.desc.trim() || !exp.amount}
                  className="px-5 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                >
                  {submitting ? "Guardando..." : "Guardar gasto →"}
                </button>
              </div>
            </div>

            {/* Category filter cards + search */}
            <div className="flex flex-wrap gap-2 items-center">
              <div
                className={`bg-white rounded-xl border p-3 cursor-pointer transition-all flex items-center gap-2 ${
                  inventoryCategoryFilter === "all" ? "border-gray-400 ring-1 ring-gray-400" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setInventoryCategoryFilter("all")}
              >
                <span className="text-xs font-bold text-gray-500">Todos</span>
                <span className="text-sm font-black text-gray-800">S/{purchaseSummary.total.toFixed(0)}</span>
              </div>
              {(["operativos", "fijos", "personal", "marketing"] as const).map(key => {
                const cfg = CAT[key];
                const val = purchaseSummary[key];
                return (
                  <div
                    key={key}
                    className={`${cfg.bg} rounded-xl border p-3 cursor-pointer transition-all flex items-center gap-2 ${
                      inventoryCategoryFilter === key ? `${cfg.border} ring-2 ring-offset-1 ring-current` : cfg.border
                    }`}
                    onClick={() => setInventoryCategoryFilter(inventoryCategoryFilter === key ? "all" : key)}
                  >
                    <span className={`text-xs font-bold ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                    <span className={`text-sm font-black ${cfg.color}`}>S/{val.toFixed(0)}</span>
                  </div>
                );
              })}
              {purchaseSummary.nPendiente > 0 && (
                <div
                  className={`rounded-xl border p-3 cursor-pointer transition-all flex items-center gap-2 ${
                    liquidadoFilter === "pendiente"
                      ? "bg-amber-100 border-amber-300 ring-2 ring-amber-400 ring-offset-1"
                      : "bg-white border-amber-200 hover:bg-amber-50"
                  }`}
                  onClick={() => setLiquidadoFilter(liquidadoFilter === "pendiente" ? "all" : "pendiente")}
                >
                  <span className="text-xs font-bold text-amber-600">⏳ Por pagar</span>
                  <span className="text-sm font-black text-amber-600">S/{purchaseSummary.pendiente.toFixed(0)}</span>
                </div>
              )}
              <div className="relative ml-auto">
                <input
                  type="text" placeholder="Buscar..."
                  value={inventorySearchTerm}
                  onChange={e => setInventorySearchTerm(e.target.value)}
                  className="pl-3 pr-7 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-400 w-44"
                />
                {inventorySearchTerm && (
                  <button onClick={() => setInventorySearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold">✕</button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {filteredInv.length === 0 ? (
                <div className="text-center py-14 text-gray-400">
                  <p className="text-4xl mb-3">🛒</p>
                  <p className="font-semibold text-gray-500 text-sm">
                    {inventorySearchTerm ? `Sin resultados para "${inventorySearchTerm}"` : "No hay gastos registrados"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Proveedor</th>
                        <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase">Cat.</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Concepto</th>
                        <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase">Pago</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase">Acc.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredInv.map((purchase: any) =>
                        purchase.items.map((item: any, itemIdx: number) => {
                          const cfg      = CAT[purchase.category || "operativos"] || CAT.operativos;
                          const isOp     = (purchase.category || "operativos") === "operativos";
                          const rowTotal = isOp ? item.unitCost : item.total;
                          return (
                            <tr key={`${purchase.id}-${itemIdx}`} className={`hover:bg-gray-50 transition-colors ${!purchase.liquidado ? "bg-amber-50/20" : ""}`}>
                              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                {new Date(purchase.purchaseDate).toLocaleDateString("es-PE", { day:"2-digit", month:"2-digit", year:"2-digit" })}
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-xs font-semibold text-gray-800">{purchase.supplier}</p>
                                {purchase.supplierPhone && <p className="text-[10px] text-gray-400">{purchase.supplierPhone}</p>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`text-sm`}>{cfg.icon}</span>
                              </td>
                              <td className="px-4 py-3 text-xs font-semibold text-gray-800">{item.productName || "—"}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-[10px] font-semibold text-gray-600">{PAYMENT_LABEL[purchase.paymentMethod] || purchase.paymentMethod}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-xs font-black text-gray-800">S/ {(rowTotal || 0).toFixed(2)}</span>
                              </td>
                              {itemIdx === 0 ? (
                                <td className="px-4 py-3 text-center" rowSpan={purchase.items.length}>
                                  <button
                                    onClick={() => toggleLiquidado(purchase.id, !!purchase.liquidado)}
                                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                                      purchase.liquidado
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                        : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                    }`}
                                  >
                                    {purchase.liquidado ? "✅ Pagado" : "⏳ Pagar"}
                                  </button>
                                </td>
                              ) : null}
                              <td className="px-4 py-3 text-center">
                                {itemIdx === 0 && (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => { setEditingPurchase(purchase); setShowInventoryEditModal(true); }}
                                      className="text-gray-400 hover:text-amber-500 transition-colors text-sm"
                                      title="Editar"
                                    >✏️</button>
                                    <button
                                      onClick={() => handleDeleteInventory(purchase.id)}
                                      className="text-gray-400 hover:text-red-500 transition-colors text-sm font-bold"
                                      title="Eliminar"
                                    >✕</button>
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
                        <td colSpan={5} className="px-4 py-2 text-xs font-bold text-gray-500 text-right uppercase tracking-wide">Total</td>
                        <td className="px-4 py-2 text-right text-sm font-black text-gray-900">S/ {purchaseSummary.total.toFixed(2)}</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
