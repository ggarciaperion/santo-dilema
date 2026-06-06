"use client";

import { useState, useMemo, useRef } from "react";

interface ClientesCRMProps {
  customers: any[];
  allCustomers: any[];
  customerSegments: any;
  customerSegment: string;
  setCustomerSegment: (s: string) => void;
  customerSearchTerm: string;
  setCustomerSearchTerm: (s: string) => void;
  customerSortKey: string;
  setCustomerSortKey: (s: string) => void;
  customerSortDir: "asc" | "desc";
  setCustomerSortDir: (d: "asc" | "desc") => void;
  selectedCustomer: any;
  setSelectedCustomer: (c: any) => void;
  generatedCoupons: Record<string, boolean>;
  setGeneratedCoupons: (fn: (prev: any) => any) => void;
  generatingCouponFor: string | null;
  setGeneratingCouponFor: (s: string | null) => void;
  couponCampaignCode: string;
  setCouponCampaignCode: (s: string) => void;
  couponCampaignExpiry: string;
  setCouponCampaignExpiry: (s: string) => void;
  setShowCrmModal: (b: boolean) => void;
  setCrmEditPhone: (s: string) => void;
  setCrmForm: (f: any) => void;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
  buildWhatsApp: (phone: string, msg: string) => string;
  getCampaignTemplate: (seg: string, customer: any) => string;
}

function getSegBadge(customer: any) {
  const days = getDaysSince(customer.lastOrderDate);
  if (customer.totalOrders > 3)  return { label: "VIP",        cls: "bg-amber-100 text-amber-700 border-amber-300",       avatarCls: "bg-amber-400" };
  if (customer.totalOrders > 1)  return { label: "Recurrente", cls: "bg-blue-100 text-blue-700 border-blue-300",          avatarCls: "bg-blue-400" };
  if (days > 30)                 return { label: "Inactivo",   cls: "bg-red-100 text-red-700 border-red-300",             avatarCls: "bg-red-300" };
  return                                { label: "Nuevo",      cls: "bg-emerald-100 text-emerald-700 border-emerald-300", avatarCls: "bg-emerald-400" };
}

function getDaysSince(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function UrgencyPill({ days }: { days: number }) {
  const cls =
    days <= 7  ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
    days <= 14 ? "text-amber-600 bg-amber-50 border-amber-200"       :
    days <= 30 ? "text-orange-600 bg-orange-50 border-orange-200"    :
                 "text-red-600 bg-red-50 border-red-200";
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border tabular-nums ${cls}`}>{days}d</span>;
}

function getWaMsg(seg: string, customer: any): string {
  const name = (customer.name || "").split(" ")[0];
  if (seg === "VIP")        return `Hola ${name} 👑 ¡Eres uno de nuestros clientes más especiales en Santo Dilema! Te tenemos una sorpresa exclusiva. ¿Cuándo nos visitas? 🍖`;
  if (seg === "Recurrente") return `Hola ${name} 🔁 ¡Gracias por seguir eligiendo Santo Dilema! ¿Ya viste nuestras novedades de esta semana? 🍖`;
  if (seg === "Inactivo")   return `Hola ${name} 😊 ¡Te extrañamos en Santo Dilema! Han pasado varios días y queremos verte de vuelta. ¿Qué te parece si pedimos algo hoy? 🍖`;
  return `Hola ${name} ✨ ¡Bienvenido a Santo Dilema! ¿Cómo te fue con tu primer pedido? Nos encantaría saber tu opinión. 🍖`;
}

function WaIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function ClientesCRM({
  customers, allCustomers, customerSegments,
  customerSegment, setCustomerSegment,
  customerSearchTerm, setCustomerSearchTerm,
  selectedCustomer, setSelectedCustomer,
  generatedCoupons, setGeneratedCoupons,
  generatingCouponFor, setGeneratingCouponFor,
  couponCampaignCode, setCouponCampaignCode,
  couponCampaignExpiry, setCouponCampaignExpiry,
  setShowCrmModal, setCrmEditPhone, setCrmForm,
  statusColors, statusLabels,
  buildWhatsApp,
}: ClientesCRMProps) {

  const [inlineNote,      setInlineNote]      = useState("");
  const [showCouponForm,  setShowCouponForm]  = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const tot   = allCustomers.length;
    const spent = allCustomers.reduce((s: number, c: any) => s + (c.totalSpent || 0), 0);
    const ords  = allCustomers.reduce((s: number, c: any) => s + (c.totalOrders || 0), 0);
    return {
      total:    tot,
      vip:      customerSegments.vip?.length || 0,
      active:   customerSegments.active?.length || 0,
      inactive: allCustomers.filter((c: any) => getDaysSince(c.lastOrderDate) > 15).length,
      avgTicket: ords > 0 ? spent / ords : 0,
    };
  }, [allCustomers, customerSegments]);

  /* ── Sort: always by last order, most recent first ── */
  const sorted = useMemo(() =>
    [...customers].sort((a: any, b: any) =>
      new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
    ),
  [customers]);

  /* ── Detail computed ── */
  const detailProducts = useMemo(() => {
    if (!selectedCustomer) return [];
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    selectedCustomer.orders.forEach((order: any) => {
      const items = order.completedOrders || order.cart || [];
      const disc  = 1 - (order.couponDiscount || 0) / 100;
      items.forEach((it: any) => {
        const name  = it.name || it.product?.name || "Sin nombre";
        const qty   = it.quantity || 0;
        const price = (it.finalPrice ?? it.price ?? it.product?.price ?? 0) * disc;
        if (!map[name]) map[name] = { name, qty: 0, revenue: 0 };
        map[name].qty     += qty;
        map[name].revenue += price * qty;
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [selectedCustomer]);

  const sortedOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return [...selectedCustomer.orders].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [selectedCustomer]);

  /* ── Segments config ── */
  const segs = [
    { key: "all",       label: "Todos",          count: customerSegments.all?.length || 0,       act: "bg-gray-800 text-white",     inact: "bg-white text-gray-600 border border-gray-200 hover:border-gray-400" },
    { key: "vip",       label: "👑 VIP",         count: customerSegments.vip?.length || 0,       act: "bg-amber-500 text-white",    inact: "bg-white text-amber-600 border border-amber-200 hover:border-amber-400" },
    { key: "new",       label: "✨ Nuevos",      count: customerSegments.new?.length || 0,       act: "bg-emerald-500 text-white",  inact: "bg-white text-emerald-600 border border-emerald-200 hover:border-emerald-400" },
    { key: "active",    label: "🟢 Activos",     count: customerSegments.active?.length || 0,    act: "bg-teal-500 text-white",     inact: "bg-white text-teal-600 border border-teal-200 hover:border-teal-400" },
    { key: "recurrent", label: "🔁 Recurrentes", count: customerSegments.recurrent?.length || 0, act: "bg-blue-500 text-white",     inact: "bg-white text-blue-600 border border-blue-200 hover:border-blue-400" },
    { key: "inactive",  label: "💤 Inactivos",   count: customerSegments.inactive?.length || 0,  act: "bg-red-500 text-white",      inact: "bg-white text-red-600 border border-red-200 hover:border-red-400" },
    { key: "birthday",  label: "🎂 Cumpleaños",  count: allCustomers.filter((c: any) => !!c.birthday).length, act: "bg-pink-500 text-white", inact: "bg-white text-pink-600 border border-pink-200 hover:border-pink-400" },
  ];

  const openCrmModal = (customer: any, overrideNotes?: string) => {
    setCrmEditPhone(customer.phone);
    setCrmForm({
      birthday: customer.birthday ? `${customer.birthday.split("-")[1]}/${customer.birthday.split("-")[0]}` : "",
      tags:  customer.tags  || [],
      notes: overrideNotes ?? customer.notes ?? "",
    });
    setShowCrmModal(true);
  };

  const saveQuickNote = () => {
    if (!inlineNote.trim() || !selectedCustomer) return;
    const ts  = new Date().toLocaleString("es-PE", { day:"2-digit", month:"2-digit", year:"2-digit", hour:"2-digit", minute:"2-digit" });
    const existing = selectedCustomer.notes || "";
    const merged   = existing ? `${existing}\n[${ts}] ${inlineNote.trim()}` : `[${ts}] ${inlineNote.trim()}`;
    setInlineNote("");
    openCrmModal(selectedCustomer, merged);
  };

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── HEADER ── */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex-shrink-0">
        {/* Title + KPIs */}
        <div className="flex items-center gap-5 flex-wrap mb-3">
          <div>
            <h2 className="text-base font-black text-gray-900 leading-none">Clientes</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">CRM · {kpis.total} contactos activos</p>
          </div>
          <div className="flex items-center gap-3">
            {[
              { val: kpis.total,                         color: "text-gray-900",    label: "Total" },
              { val: kpis.vip,                           color: "text-amber-500",   label: "VIP" },
              { val: kpis.active,                        color: "text-emerald-500", label: "Activos" },
              { val: kpis.inactive,                      color: "text-red-500",     label: ">15d" },
              { val: `S/${kpis.avgTicket.toFixed(0)}`,   color: "text-indigo-500",  label: "Ticket" },
            ].map((k, i) => (
              <div key={i} className="flex items-center gap-3">
                {i > 0 && <div className="w-px h-6 bg-gray-200" />}
                <div className="text-center">
                  <p className={`text-lg font-black leading-none ${k.color}`}>{k.val}</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">{k.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Segment pills + search */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {segs.map(s => (
            <button
              key={s.key}
              onClick={() => setCustomerSegment(s.key)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all flex-shrink-0 ${customerSegment === s.key ? s.act : s.inact}`}
            >
              {s.label} <span className="opacity-60">({s.count})</span>
            </button>
          ))}
          <div className="relative ml-auto">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              value={customerSearchTerm}
              onChange={e => setCustomerSearchTerm(e.target.value)}
              placeholder="Nombre, teléfono..."
              className="pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 w-44"
            />
            {customerSearchTerm && (
              <button onClick={() => setCustomerSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Lista */}
        <div className={`flex flex-col overflow-hidden ${selectedCustomer ? "w-72 flex-shrink-0 border-r border-gray-200 bg-white" : "flex-1"}`}>
          <div className="flex-1 overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <p className="text-4xl mb-3">👤</p>
                <p className="text-sm font-semibold text-gray-500">Sin clientes en este segmento</p>
              </div>
            ) : selectedCustomer ? (
              /* Compact list when detail is open */
              <div className="divide-y divide-gray-100">
                {sorted.map((c: any) => {
                  const sg    = getSegBadge(c);
                  const d     = getDaysSince(c.lastOrderDate);
                  const isSel = selectedCustomer?.phone === c.phone;
                  return (
                    <button
                      key={c.phone}
                      onClick={() => setSelectedCustomer(isSel ? null : c)}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors hover:bg-gray-50 ${
                        isSel ? "bg-indigo-50 border-l-2 border-l-indigo-500" : ""
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${sg.avatarCls}`}>
                        {(c.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{c.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{c.phone}</p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                        <UrgencyPill days={d} />
                        <span className="text-[9px] text-gray-400">{c.totalOrders}p · S/{c.totalSpent.toFixed(0)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Card grid when no detail */
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-4">
                {sorted.map((c: any) => {
                  const sg = getSegBadge(c);
                  const d  = getDaysSince(c.lastOrderDate);
                  return (
                    <div
                      key={c.phone}
                      onClick={() => setSelectedCustomer(c)}
                      className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0 ${sg.avatarCls}`}>
                            {(c.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 leading-tight truncate">{c.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{c.phone}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex-shrink-0 ${sg.cls}`}>{sg.label}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center mb-2">
                        <div className="bg-gray-50 rounded-lg py-1.5 border border-gray-100">
                          <p className="text-sm font-black text-indigo-600">{c.totalOrders}</p>
                          <p className="text-[9px] text-gray-400 uppercase">Pedidos</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg py-1.5 border border-gray-100">
                          <p className="text-sm font-black text-amber-600">S/{c.totalSpent.toFixed(0)}</p>
                          <p className="text-[9px] text-gray-400 uppercase">Total</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg py-1.5 border border-gray-100 flex flex-col items-center justify-center gap-0.5">
                          <UrgencyPill days={d} />
                          <p className="text-[9px] text-gray-400 uppercase">Última</p>
                        </div>
                      </div>
                      {c.notes && (
                        <p className="text-[10px] text-gray-500 italic truncate bg-amber-50 rounded px-2 py-0.5 border border-amber-100 mb-2">{c.notes}</p>
                      )}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <a
                          href={buildWhatsApp(c.phone, getWaMsg(sg.label, c))}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-[11px] font-bold hover:bg-emerald-100 transition-colors"
                        >
                          <WaIcon /> WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex-shrink-0 px-4 py-1.5 border-t border-gray-100 bg-white text-[10px] text-gray-400">
            {sorted.length} cliente{sorted.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* ── Panel de detalle ── */}
        {selectedCustomer && (() => {
          const sg   = getSegBadge(selectedCustomer);
          const days = getDaysSince(selectedCustomer.lastOrderDate);
          const firstOrder = selectedCustomer.orders.length > 0
            ? [...selectedCustomer.orders].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]
            : null;
          const freqDays = selectedCustomer.totalOrders > 1 && firstOrder
            ? Math.round(getDaysSince(firstOrder.createdAt) / (selectedCustomer.totalOrders - 1))
            : null;

          return (
            <div className="flex-1 flex flex-col overflow-hidden bg-white">

              {/* Detail header */}
              <div className="flex-shrink-0 border-b border-gray-200 px-5 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-white ${sg.avatarCls}`}>
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black text-gray-900">{selectedCustomer.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sg.cls}`}>{sg.label}</span>
                        {selectedCustomer.birthday && (
                          <span className="text-[10px] text-pink-500 font-semibold">🎂 {selectedCustomer.birthday.split("-").reverse().join("/")}</span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-500 font-mono mt-0.5">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs transition-all flex-shrink-0"
                  >✕</button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-indigo-600 leading-none">{selectedCustomer.totalOrders}</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-1">Pedidos</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                    <p className="text-base font-black text-amber-600 leading-none">S/{selectedCustomer.totalSpent.toFixed(0)}</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-1">Gastado</p>
                  </div>
                  <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-center">
                    <p className="text-base font-black text-teal-600 leading-none">S/{(selectedCustomer.avgTicket || 0).toFixed(0)}</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-1">Ticket</p>
                  </div>
                  <div className={`border rounded-xl p-3 text-center ${days > 30 ? "bg-red-50 border-red-100" : days > 15 ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-100"}`}>
                    <p className={`text-2xl font-black leading-none ${days > 30 ? "text-red-500" : days > 15 ? "text-orange-500" : "text-gray-700"}`}>{days}d</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-1">Sin comprar</p>
                  </div>
                </div>
              </div>

              {/* Single scrollable content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">

                {/* Historial */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">📋 Historial de pedidos</p>
                  {sortedOrders.length === 0
                    ? <p className="text-xs text-gray-400 italic">Sin pedidos registrados</p>
                    : sortedOrders.map((order: any) => {
                        const items = order.completedOrders || order.cart || [];
                        return (
                          <div key={order.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3 mb-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">#{order.id}</span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(order.createdAt).toLocaleDateString("es-PE", { day:"2-digit", month:"short", year:"2-digit" })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                  {statusLabels[order.status as keyof typeof statusLabels] || order.status}
                                </span>
                                <span className="text-amber-600 font-black text-xs">S/{order.totalPrice?.toFixed(0) || "0"}</span>
                              </div>
                            </div>
                            {items.length > 0 && (
                              <p className="text-[10px] text-gray-500 leading-relaxed">
                                {items.map((it: any) => `${it.name || it.product?.name || "?"} ×${it.quantity || 0}`).join(" · ")}
                              </p>
                            )}
                            {order.couponDiscount > 0 && (
                              <p className="text-[10px] text-emerald-600 mt-1 font-semibold">🎟 Cupón {order.couponDiscount}% aplicado</p>
                            )}
                          </div>
                        );
                      })
                  }
                </div>

                {/* Favoritos */}
                {detailProducts.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">⭐ Productos favoritos</p>
                    {detailProducts.map((p: any, i: number) => {
                      const pct = detailProducts[0].qty > 0 ? (p.qty / detailProducts[0].qty) * 100 : 0;
                      return (
                        <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 px-3 py-2.5 mb-1.5">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-black text-gray-300 w-4">{i + 1}</span>
                            <span className="flex-1 text-xs text-gray-800 font-semibold">{p.name}</span>
                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{p.qty}×</span>
                            <span className="text-xs font-bold text-amber-600 w-16 text-right">S/{p.revenue.toFixed(0)}</span>
                          </div>
                          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Estadísticas + tags + notas */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">👤 Gestión</p>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-2 mb-3">
                    {[
                      { label: "Primer pedido", value: firstOrder ? new Date(firstOrder.createdAt).toLocaleDateString("es-PE", { day:"2-digit", month:"short", year:"2-digit" }) : "—" },
                      { label: "Frecuencia",    value: freqDays ? `c/${freqDays} días` : "1 vez" },
                      { label: "LTV acumulado", value: `S/ ${selectedCustomer.totalSpent.toFixed(2)}`, cls: "text-amber-600 font-black" },
                      { label: "Días inactivo", value: `${days} días`, cls: days > 30 ? "text-red-500 font-bold" : days > 15 ? "text-orange-500 font-bold" : "text-emerald-600 font-bold" },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{row.label}</span>
                        <span className={`text-xs font-semibold text-gray-800 ${(row as any).cls || ""}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {(selectedCustomer.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(selectedCustomer.tags || []).map((t: string) => (
                        <span key={t} className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">{t}</span>
                      ))}
                    </div>
                  )}

                  {selectedCustomer.address && (
                    <p className="text-xs text-gray-600 mb-3">📍 {selectedCustomer.address}</p>
                  )}

                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Notas</p>
                    {selectedCustomer.notes ? (
                      <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-100 mb-2">
                        <p className="text-xs text-gray-700 italic whitespace-pre-line leading-relaxed">{selectedCustomer.notes}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300 italic mb-2">Sin notas</p>
                    )}
                    <textarea
                      ref={noteRef}
                      value={inlineNote}
                      onChange={e => setInlineNote(e.target.value)}
                      placeholder="Escribe una nota rápida..."
                      rows={2}
                      className="w-full text-xs text-gray-800 bg-white border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 placeholder-gray-400"
                    />
                    <div className="flex justify-end mt-1.5">
                      <button
                        onClick={saveQuickNote}
                        disabled={!inlineNote.trim()}
                        className="px-3 py-1 bg-gray-900 text-white rounded-lg text-[11px] font-bold disabled:opacity-40 hover:bg-gray-700 transition-all"
                      >
                        Guardar →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Footer: 2 actions ── */}
              <div className="flex-shrink-0 border-t border-gray-200 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={buildWhatsApp(selectedCustomer.phone, getWaMsg(sg.label, selectedCustomer))}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    <WaIcon /> WhatsApp
                  </a>
                  {generatedCoupons[selectedCustomer.phone] ? (
                    <div className="flex items-center justify-center py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold">
                      ✓ Cupón enviado
                    </div>
                  ) : (
                    <button
                      disabled={generatingCouponFor === selectedCustomer.phone}
                      onClick={async () => {
                        if (!couponCampaignCode || !couponCampaignExpiry) {
                          setShowCouponForm(v => !v);
                          return;
                        }
                        setGeneratingCouponFor(selectedCustomer.phone);
                        try {
                          const expiresAt = new Date(couponCampaignExpiry + ':00-05:00').toISOString();
                          const res = await fetch('/api/coupons', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action:'create-campaign-single', code:couponCampaignCode, discount:20, expiresAt, phone:selectedCustomer.phone, customerName:selectedCustomer.name }),
                          });
                          const data = await res.json();
                          if (data.success || data.alreadyHas) setGeneratedCoupons((prev: any) => ({ ...prev, [selectedCustomer.phone]: true }));
                        } finally { setGeneratingCouponFor(null); }
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-bold disabled:opacity-40 hover:bg-amber-100 transition-all"
                    >
                      {generatingCouponFor === selectedCustomer.phone ? "..." : !couponCampaignCode ? "⚙ Configurar cupón" : "🎟 Dar cupón 20%"}
                    </button>
                  )}
                </div>
                {/* Inline coupon setup */}
                {showCouponForm && (
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={couponCampaignCode}
                      onChange={e => setCouponCampaignCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                      className="px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs font-mono bg-white focus:outline-none w-24"
                      placeholder="PROMO20"
                    />
                    <input
                      type="datetime-local"
                      value={couponCampaignExpiry}
                      onChange={e => setCouponCampaignExpiry(e.target.value)}
                      className="px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white focus:outline-none flex-1"
                    />
                    <button
                      onClick={() => setShowCouponForm(false)}
                      disabled={!couponCampaignCode || !couponCampaignExpiry}
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold disabled:opacity-40"
                    >
                      Listo
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
