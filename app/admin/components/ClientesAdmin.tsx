"use client";
import { useState, useMemo, useCallback } from "react";

interface Customer {
  phone: string;
  name: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  avgTicket: number;
  lastOrderDate: string;
  addressHistory?: string[];
  birthday?: string;
  tags?: string[];
  notes?: string;
  orders: any[];
}

interface Props {
  customers: Customer[];
  allCustomers: Customer[];
  customerSegment: string;
  setCustomerSegment: (s: string) => void;
  customerSegments: Record<string, Customer[]>;
  customerSearchTerm: string;
  setCustomerSearchTerm: (s: string) => void;
  onSelectCustomer?: (c: Customer | null) => void;
  loading: boolean;
  getBirthdayBadge: (bd: string | undefined) => null | "today" | "tomorrow" | "week" | "month";
  buildWhatsApp: (phone: string, msg: string) => string;
  birthdayAlerts?: any;
}

const SEGS = [
  { key: "all", label: "Todos" },
  { key: "vip", label: "VIP" },
  { key: "active", label: "Activos" },
  { key: "new", label: "Nuevos" },
  { key: "recurrent", label: "Recurrentes" },
  { key: "inactive", label: "Inactivos" },
  { key: "birthday", label: "Cumpleaños" },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", "pendiente-verificacion": "Verificando",
  confirmed: "Confirmado", "en-camino": "En camino",
  delivered: "Entregado", cancelled: "Cancelado",
};
const PAY: Record<string, string> = {
  yape: "Yape", plin: "Plin", efectivo: "Efectivo",
  transferencia: "Transferencia", anticipado: "Anticipado", tarjeta: "Tarjeta",
};

function initials(n: string) {
  const p = n.trim().split(" ").filter(Boolean);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : n.slice(0, 2).toUpperCase();
}
function dSince(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}
function segLabel(c: Customer): string {
  const d = dSince(c.lastOrderDate);
  if (c.totalOrders > 3) return "VIP";
  if (c.totalOrders > 1) return "Regular";
  if (d > 30) return "Inactivo";
  return "Nuevo";
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function ClientesAdmin({
  customers, allCustomers,
  customerSegment, setCustomerSegment, customerSegments,
  customerSearchTerm, setCustomerSearchTerm,
  onSelectCustomer, loading, getBirthdayBadge,
}: Props) {

  const [sel, setSel]             = useState<Customer | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "pedidos" | "dirs">("info");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [sortKey, setSortKey]     = useState("totalOrders");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("desc");
  const [crmOpen, setCrmOpen]     = useState(false);
  const [crmSaving, setCrmSaving] = useState(false);
  const [crmForm, setCrmForm]     = useState({ birthday: "", tags: "", notes: "" });

  const openCustomer = useCallback((c: Customer) => {
    setSel(c);
    setDetailTab("info");
    setExpandedOrder(null);
    setCrmOpen(false);
    setCrmForm({
      birthday: c.birthday ? `${c.birthday.split("-")[1]}/${c.birthday.split("-")[0]}` : "",
      tags: (c.tags || []).join(", "),
      notes: c.notes || "",
    });
    onSelectCustomer?.(c);
  }, [onSelectCustomer]);

  const saveCrm = async () => {
    if (!sel) return;
    setCrmSaving(true);
    try {
      let birthday = "";
      const [dd, mm] = (crmForm.birthday || "").split("/");
      if (dd && mm) birthday = `${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
      const tags = crmForm.tags.split(",").map(t => t.trim()).filter(Boolean);
      await fetch("/api/customer-profiles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: sel.phone, birthday, tags, notes: crmForm.notes }),
      });
      setCrmOpen(false);
    } finally { setCrmSaving(false); }
  };

  const kpis = useMemo(() => ({
    total:   allCustomers.length,
    revenue: allCustomers.reduce((s, c) => s + c.totalSpent, 0),
    avg:     allCustomers.length > 0 ? allCustomers.reduce((s, c) => s + c.avgTicket, 0) / allCustomers.length : 0,
    vip:     customerSegments.vip?.length    || 0,
    active:  customerSegments.active?.length || 0,
  }), [allCustomers, customerSegments]);

  const sorted = useMemo(() => [...customers].sort((a: any, b: any) => {
    let av: any, bv: any;
    switch (sortKey) {
      case "name":    av = a.name || ""; bv = b.name || ""; break;
      case "orders":  av = a.totalOrders; bv = b.totalOrders; break;
      case "spent":   av = a.totalSpent;  bv = b.totalSpent;  break;
      case "last":    av = new Date(a.lastOrderDate).getTime(); bv = new Date(b.lastOrderDate).getTime(); break;
      default:        av = 0; bv = 0;
    }
    return typeof av === "string"
      ? (sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av))
      : (sortDir === "asc" ? av - bv : bv - av);
  }), [customers, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc"); }
  };

  const segCount = (key: string) =>
    key === "birthday" ? allCustomers.filter(c => !!c.birthday).length
    : customerSegments[key as keyof typeof customerSegments]?.length || 0;

  /* ── DETAIL VIEW ──────────────────────────────────────────────── */
  if (sel) {
    const c = sel;
    const bdBadge = getBirthdayBadge(c.birthday);
    const d = dSince(c.lastOrderDate);
    const sortedOrders = [...c.orders].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const addrHistory = c.addressHistory || (c.address ? [c.address] : []);

    let freqLabel = "—";
    if (sortedOrders.length >= 2) {
      const span = new Date(sortedOrders[0].createdAt).getTime() - new Date(sortedOrders[sortedOrders.length - 1].createdAt).getTime();
      const avg = Math.round(span / 86400000 / (sortedOrders.length - 1));
      freqLabel = avg <= 7 ? "Semanal" : avg <= 15 ? "Quincenal" : avg <= 35 ? "Mensual" : `c/${avg}d`;
    }

    const prodMap: Record<string, { name: string; qty: number }> = {};
    c.orders.forEach((o: any) => {
      (o.completedOrders || o.cart || []).forEach((it: any) => {
        const name = it.name || "—";
        if (!prodMap[name]) prodMap[name] = { name, qty: 0 };
        prodMap[name].qty += it.quantity || 0;
      });
    });
    const topProds = Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

    return (
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 bg-zinc-50">
          <button onClick={() => { setSel(null); onSelectCustomer?.(null); }}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
            ← Volver al listado
          </button>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-mono">{c.phone}</span>
            <span>·</span>
            <span>{segLabel(c)}</span>
            {bdBadge === "today" && <span className="text-pink-500 font-bold">· Cumpleaños HOY</span>}
            {bdBadge === "tomorrow" && <span className="text-orange-500 font-bold">· Cumpleaños mañana</span>}
          </div>
          <button onClick={() => setCrmOpen(o => !o)}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 border border-zinc-200 px-3 py-1.5 rounded-lg hover:border-zinc-400 transition-all">
            {crmOpen ? "Cerrar edición" : "Editar perfil"}
          </button>
        </div>

        <div className="flex divide-x divide-zinc-100">

          {/* ── Left: datos del cliente ── */}
          <div className="w-72 flex-shrink-0 px-6 py-5 space-y-6">

            {/* Nombre + avatar */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-zinc-900 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                {initials(c.name)}
              </div>
              <div>
                <p className="text-base font-black text-zinc-900 leading-tight">{c.name}</p>
                <p className="text-xs text-zinc-400 font-mono">{c.phone}</p>
              </div>
            </div>

            {/* Métricas clave */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Métricas</p>
              {[
                { label: "Total pedidos",    val: c.totalOrders },
                { label: "Total gastado",    val: `S/ ${c.totalSpent.toFixed(2)}` },
                { label: "Ticket promedio",  val: `S/ ${c.avgTicket.toFixed(2)}` },
                { label: "Último pedido",    val: d === 0 ? "Hoy" : `Hace ${d} días` },
                { label: "Frecuencia",       val: freqLabel },
              ].map(r => (
                <div key={r.label} className="flex justify-between items-baseline border-b border-zinc-50 pb-2">
                  <span className="text-xs text-zinc-500">{r.label}</span>
                  <span className="text-xs font-black text-zinc-900">{r.val}</span>
                </div>
              ))}
            </div>

            {/* Cumpleaños */}
            {c.birthday && (() => {
              const [mm, dd] = c.birthday.split("-");
              return (
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Cumpleaños</p>
                  <p className={`text-sm font-bold ${bdBadge === "today" ? "text-pink-600" : bdBadge === "tomorrow" ? "text-orange-500" : "text-zinc-900"}`}>
                    {dd}/{mm}
                    {bdBadge === "today" && " · HOY"}
                    {bdBadge === "tomorrow" && " · Mañana"}
                  </p>
                </div>
              );
            })()}

            {/* Tags */}
            {(c.tags || []).length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Etiquetas</p>
                <div className="flex flex-wrap gap-1.5">
                  {(c.tags || []).map((t: string) => (
                    <span key={t} className="px-2 py-0.5 text-[11px] font-semibold bg-zinc-100 text-zinc-600 rounded border border-zinc-200">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Notas */}
            {c.notes && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nota</p>
                <p className="text-xs text-zinc-600 leading-relaxed">{c.notes}</p>
              </div>
            )}

            {/* Top productos */}
            {topProds.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Productos favoritos</p>
                <div className="space-y-1.5">
                  {topProds.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-zinc-400 w-4">{i + 1}</span>
                      <span className="text-xs text-zinc-700 flex-1 truncate">{p.name}</span>
                      <span className="text-[10px] font-black text-zinc-500">{p.qty}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: historial + dirs + edicion ── */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Edit CRM panel */}
            {crmOpen && (
              <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50 space-y-3">
                <p className="text-xs font-black text-zinc-700 uppercase tracking-widest">Editar perfil</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 mb-1">Cumpleaños (DD/MM)</label>
                    <input type="text" placeholder="15/06" value={crmForm.birthday}
                      onChange={e => setCrmForm(f => ({ ...f, birthday: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-900 bg-white focus:outline-none focus:border-zinc-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 mb-1">Etiquetas (coma)</label>
                    <input type="text" placeholder="vip, frecuente" value={crmForm.tags}
                      onChange={e => setCrmForm(f => ({ ...f, tags: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-900 bg-white focus:outline-none focus:border-zinc-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 mb-1">Nota interna</label>
                    <input type="text" placeholder="Prefiere sin picante" value={crmForm.notes}
                      onChange={e => setCrmForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-900 bg-white focus:outline-none focus:border-zinc-400" />
                  </div>
                </div>
                <button onClick={saveCrm} disabled={crmSaving}
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors">
                  {crmSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-zinc-100">
              {(["info", "pedidos", "dirs"] as const).map(t => (
                <button key={t} onClick={() => setDetailTab(t)}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wide transition-colors border-b-2 -mb-px ${
                    detailTab === t ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400 hover:text-zinc-700"
                  }`}>
                  {t === "info" ? "Información" : t === "pedidos" ? `Pedidos (${sortedOrders.length})` : `Direcciones (${addrHistory.length})`}
                </button>
              ))}
            </div>

            {/* ── Tab: Info ── */}
            {detailTab === "info" && (
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Registro</p>
                    <div className="space-y-2">
                      {[
                        { k: "Primer pedido", v: fmtDate(c.orders.reduce((e: any, o: any) => new Date(o.createdAt) < new Date(e.createdAt) ? o : e).createdAt) },
                        { k: "Último pedido",  v: fmtDate(c.lastOrderDate) },
                        { k: "Segmento",       v: segLabel(c) },
                        { k: "Dirección principal", v: c.address || "—" },
                      ].map(r => (
                        <div key={r.k} className="flex justify-between gap-4 py-1.5 border-b border-zinc-50 last:border-0">
                          <span className="text-xs text-zinc-500 flex-shrink-0">{r.k}</span>
                          <span className="text-xs font-semibold text-zinc-900 text-right">{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Resumen financiero</p>
                    <div className="space-y-2">
                      {[
                        { k: "Total pedidos",   v: String(c.totalOrders) },
                        { k: "Total gastado",   v: `S/ ${c.totalSpent.toFixed(2)}` },
                        { k: "Ticket promedio", v: `S/ ${c.avgTicket.toFixed(2)}` },
                        { k: "Frecuencia",      v: freqLabel },
                      ].map(r => (
                        <div key={r.k} className="flex justify-between gap-4 py-1.5 border-b border-zinc-50 last:border-0">
                          <span className="text-xs text-zinc-500">{r.k}</span>
                          <span className="text-xs font-black text-zinc-900">{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Pedidos ── */}
            {detailTab === "pedidos" && (
              <div className="flex-1 overflow-y-auto">
                {sortedOrders.length === 0 ? (
                  <p className="text-center text-zinc-400 text-sm py-12">Sin pedidos</p>
                ) : sortedOrders.map((order: any) => {
                  const isExp   = expandedOrder === order.id;
                  const items   = order.completedOrders || order.cart || [];
                  const sub     = items.reduce((s: number, it: any) => s + ((it.finalPrice ?? it.price ?? 0) * (it.quantity || 0)), 0);
                  const coupon  = order.couponDiscount || 0;
                  const combo   = order.comboDiscount  || 0;
                  const deliv   = order.deliveryCost   || 0;
                  const stLbl   = STATUS_LABEL[order.status] || order.status;
                  const stDot   = order.status === "delivered" ? "bg-green-500" : order.status === "cancelled" ? "bg-red-400" : order.status === "en-camino" ? "bg-purple-500" : "bg-amber-400";

                  return (
                    <div key={order.id} className="border-b border-zinc-100 last:border-0">
                      <button className="w-full text-left px-6 py-3 hover:bg-zinc-50 transition-colors"
                        onClick={() => setExpandedOrder(isExp ? null : order.id)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${stDot}`} />
                            <span className="text-xs font-mono font-bold text-zinc-700">{order.id}</span>
                            <span className="text-[10px] text-zinc-400">{stLbl}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-zinc-400">{fmtDate(order.createdAt)}</span>
                            {order.paymentMethod && <span className="text-[10px] text-zinc-400">{PAY[order.paymentMethod] || order.paymentMethod}</span>}
                            <span className="text-sm font-black text-zinc-900">S/ {(order.totalPrice || 0).toFixed(2)}</span>
                            <span className="text-zinc-300 text-xs">{isExp ? "▲" : "▼"}</span>
                          </div>
                        </div>
                        {order.address && <p className="text-[10px] text-zinc-400 mt-1 ml-4">📍 {order.address}</p>}
                      </button>

                      {isExp && (
                        <div className="px-6 pb-4 space-y-3 bg-zinc-50">
                          {/* Productos */}
                          <div className="space-y-1">
                            {items.map((it: any, i: number) => {
                              const name = it.name || it.product?.name || "—";
                              const qty  = it.quantity || 1;
                              const price = it.finalPrice ?? it.price ?? it.product?.price ?? 0;
                              const salsas = it.salsaIds || it.salsas || [];
                              return (
                                <div key={i} className="flex items-start gap-3 py-1.5 border-b border-zinc-100 last:border-0">
                                  <span className="text-xs font-black text-zinc-400 w-5 text-right flex-shrink-0">{qty}×</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-900">{name}</p>
                                    {salsas.length > 0 && <p className="text-[10px] text-zinc-400 mt-0.5">{salsas.join(", ")}</p>}
                                  </div>
                                  <span className="text-xs font-black text-zinc-900">S/ {(price * qty).toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>
                          {/* Totales */}
                          <div className="text-right space-y-1 pt-1">
                            <p className="text-[11px] text-zinc-400">Subtotal S/ {sub.toFixed(2)}</p>
                            {coupon > 0 && <p className="text-[11px] text-green-600">Cupón −{coupon}% = −S/ {(sub * coupon / 100).toFixed(2)}</p>}
                            {combo  > 0 && <p className="text-[11px] text-blue-600">Desc. combo −S/ {combo.toFixed(2)}</p>}
                            {deliv  > 0 && <p className="text-[11px] text-zinc-400">Delivery +S/ {deliv.toFixed(2)}</p>}
                            <p className="text-sm font-black text-zinc-900">Total S/ {(order.totalPrice || 0).toFixed(2)}</p>
                          </div>
                          {order.notes && <p className="text-xs text-zinc-500 italic border-t border-zinc-100 pt-2">"{order.notes}"</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Tab: Direcciones ── */}
            {detailTab === "dirs" && (
              <div className="px-6 py-5 space-y-2">
                {addrHistory.length === 0 ? (
                  <p className="text-zinc-400 text-xs py-8 text-center">Sin direcciones registradas</p>
                ) : addrHistory.map((addr, i) => (
                  <div key={i} className="flex items-start gap-3 py-3 border-b border-zinc-50 last:border-0">
                    <span className="text-zinc-300 text-xs mt-0.5 flex-shrink-0">{i + 1}</span>
                    <p className="text-sm text-zinc-800 flex-1">{addr}</p>
                    {i === 0 && <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded flex-shrink-0">Principal</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── LIST VIEW ────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">

      {/* KPIs — row de 5 números limpios */}
      <div className="grid grid-cols-5 gap-px bg-zinc-200 rounded-xl overflow-hidden border border-zinc-200">
        {[
          { label: "Clientes",        value: kpis.total,                      unit: "" },
          { label: "Ingresos totales",value: kpis.revenue.toFixed(0),         unit: "S/" },
          { label: "Ticket promedio", value: kpis.avg.toFixed(1),             unit: "S/" },
          { label: "VIP",             value: kpis.vip,                        unit: "" },
          { label: "Activos",         value: kpis.active,                     unit: "" },
        ].map(k => (
          <div key={k.label} className="bg-white px-4 py-3">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{k.label}</p>
            <p className="text-xl font-black text-zinc-900 mt-1">{k.unit}{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Segmentos */}
        <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg">
          {SEGS.map(s => {
            const act = customerSegment === s.key;
            return (
              <button key={s.key} onClick={() => setCustomerSegment(s.key)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${act ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}>
                {s.label}
                <span className={`ml-1 text-[10px] ${act ? "text-zinc-500" : "text-zinc-400"}`}>
                  {segCount(s.key)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Búsqueda */}
        <div className="relative ml-auto">
          <input type="text" value={customerSearchTerm} onChange={e => setCustomerSearchTerm(e.target.value)}
            placeholder="Buscar cliente..."
            className="pl-8 pr-7 py-2 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 w-52 bg-white" />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none">⌕</span>
          {customerSearchTerm && (
            <button onClick={() => setCustomerSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-bold">×</button>
          )}
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-16 text-zinc-400 text-sm">Cargando...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">
          {customerSearchTerm ? `Sin resultados para "${customerSearchTerm}"` : "No hay clientes en este segmento"}
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          {/* Header columnas */}
          <div className="grid grid-cols-[1fr_140px_110px_100px_90px] gap-4 px-5 py-2.5 bg-zinc-50 border-b border-zinc-200">
            {[
              { col: "name",   label: "Cliente" },
              { col: "last",   label: "Último pedido" },
              { col: "orders", label: "Pedidos" },
              { col: "spent",  label: "Total" },
              { col: "",       label: "Segmento" },
            ].map(h => (
              h.col ? (
                <button key={h.col} onClick={() => handleSort(h.col)}
                  className={`flex items-center gap-1 text-left text-[10px] font-black uppercase tracking-widest transition-colors select-none ${sortKey === h.col ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}>
                  {h.label}
                  <span className="text-[9px]">{sortKey === h.col ? (sortDir === "asc" ? "↑" : "↓") : ""}</span>
                </button>
              ) : (
                <span key={h.label} className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{h.label}</span>
              )
            ))}
          </div>

          {/* Filas */}
          {sorted.map((c: any, idx: number) => {
            const d       = dSince(c.lastOrderDate);
            const seg     = segLabel(c);
            const bdBadge = getBirthdayBadge(c.birthday);
            const segStyle =
              seg === "VIP"      ? "text-amber-700 bg-amber-50" :
              seg === "Regular"  ? "text-blue-700 bg-blue-50"   :
              seg === "Inactivo" ? "text-red-600 bg-red-50"     :
                                   "text-emerald-700 bg-emerald-50";

            return (
              <div key={c.phone} onClick={() => openCustomer(c)}
                className={`grid grid-cols-[1fr_140px_110px_100px_90px] gap-4 items-center px-5 py-3 cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors ${
                  bdBadge === "today" ? "bg-pink-50/60" : bdBadge === "tomorrow" ? "bg-orange-50/40" : idx % 2 === 1 ? "bg-zinc-50/50" : ""
                }`}>

                {/* Cliente */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-[11px] font-black text-white flex-shrink-0">
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate leading-tight">{c.name}</p>
                    <p className="text-[11px] text-zinc-400 font-mono leading-tight">{c.phone}</p>
                    {bdBadge === "today"    && <span className="text-[9px] font-black text-pink-600">🎂 Cumpleaños hoy</span>}
                    {bdBadge === "tomorrow" && <span className="text-[9px] font-bold text-orange-500">🎁 Cumpleaños mañana</span>}
                  </div>
                </div>

                {/* Último pedido */}
                <div>
                  <p className={`text-xs font-bold ${d === 0 ? "text-green-600" : d <= 7 ? "text-green-600" : d <= 30 ? "text-amber-600" : "text-red-500"}`}>
                    {d === 0 ? "Hoy" : d === 1 ? "Ayer" : `Hace ${d}d`}
                  </p>
                  <p className="text-[10px] text-zinc-400">{fmtDate(c.lastOrderDate)}</p>
                </div>

                {/* Pedidos */}
                <p className="text-sm font-black text-zinc-900">{c.totalOrders}</p>

                {/* Total */}
                <p className="text-sm font-black text-zinc-900">S/ {c.totalSpent.toFixed(0)}</p>

                {/* Segmento */}
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${segStyle}`}>
                  {seg}
                </span>
              </div>
            );
          })}

          {/* Footer */}
          <div className="px-5 py-2.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
            <p className="text-[11px] text-zinc-400">
              {sorted.length} de {allCustomers.length} clientes
            </p>
            {customerSearchTerm && (
              <button onClick={() => setCustomerSearchTerm("")} className="text-[11px] text-zinc-500 hover:text-zinc-900 underline">
                Limpiar búsqueda
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
