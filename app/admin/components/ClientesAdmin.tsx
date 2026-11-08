"use client";
import { useState, useMemo, useCallback } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function normPhone(raw: string): string {
  let p = String(raw).replace(/[\s\-().+]/g, "");
  if (/^51\d{9}$/.test(p)) p = p.slice(2);
  return p;
}

function pmDisplay(raw: string | undefined): string {
  if (!raw) return "—";
  if (raw === "anticipado") return "Yape";
  if (["contraentrega","contraentrega-efectivo-exacto","contraentrega-efectivo-cambio"].includes(raw)) return "Efectivo";
  if (raw === "tarjeta-mp") return "Tarjeta";
  return raw;
}

function getDatePE(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Lima" });
}

function todayPE(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
}

function fmtDate(d: string): string {
  if (!d || d.length < 10) return "—";
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${day}/${m}/${y}`;
}

function daysAgo(dateStr: string): number {
  const today = new Date(todayPE() + "T00:00:00");
  const other = new Date((dateStr || "").slice(0, 10) + "T00:00:00");
  return Math.floor((today.getTime() - other.getTime()) / 86400000);
}

const DELIVERED = new Set(["delivered", "Entregado", "entregado"]);
const isValidOrder = (o: any) => !o.isCanje && DELIVERED.has(o.status || "");

// ── Types ─────────────────────────────────────────────────────────────────────

interface CustomerRow {
  normPhone: string;
  rawPhone: string;
  name: string;
  address: string;
  validOrders: any[];
  totalOrders: number;
  totalSpent: number;
  avgTicket: number;
  lastOrderDate: string;
  firstOrderDate: string;
  lastPaymentMethod: string;
  addressHistory: string[];
  birthday?: string;
  tags?: string[];
  notes?: string;
}

type CardFilter = null | "sin15" | "cumple";

interface Props {
  orders: any[];
  customerProfiles: any[];
  customerSearchTerm: string;
  setCustomerSearchTerm: (s: string) => void;
  loading: boolean;
  // Legacy props kept for compatibility — not used by this component
  customers?: any[];
  allCustomers?: any[];
  customerSegment?: string;
  setCustomerSegment?: (s: string) => void;
  customerSegments?: Record<string, any[]>;
  onSelectCustomer?: (c: any | null) => void;
  getBirthdayBadge?: (bd: string | undefined) => null | "today" | "tomorrow" | "week" | "month";
  buildWhatsApp?: (phone: string, msg: string) => string;
  birthdayAlerts?: any;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClientesAdmin({
  orders, customerProfiles, customerSearchTerm, setCustomerSearchTerm, loading,
}: Props) {
  const now = new Date();
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [cardFilter, setCardFilter] = useState<CardFilter>(null);
  const [sel, setSel] = useState<CustomerRow | null>(null);
  const [sortKey, setSortKey]   = useState("lastOrderDate");
  const [sortDir, setSortDir]   = useState<"asc" | "desc">("desc");
  const [detailTab, setDetailTab] = useState<"info" | "pedidos">("info");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [crmOpen, setCrmOpen]   = useState(false);
  const [crmSaving, setCrmSaving] = useState(false);
  const [crmForm, setCrmForm]   = useState({ birthday: "", notes: "" });

  // ── Build all-time customer list from raw orders ──────────────────────────
  const allCustomers = useMemo((): CustomerRow[] => {
    const map = new Map<string, {
      normPhone: string; rawPhone: string; name: string;
      validOrders: any[]; addresses: Set<string>; addressList: string[];
    }>();

    orders.forEach(o => {
      const raw = (o.phone || "").trim();
      if (!raw) return;
      const key = normPhone(raw);
      if (!key) return;
      if (!isValidOrder(o)) return;

      if (!map.has(key)) {
        map.set(key, {
          normPhone: key, rawPhone: raw,
          name: o.name || "",
          validOrders: [], addresses: new Set(), addressList: [],
        });
      }
      const c = map.get(key)!;
      c.validOrders.push(o);
      if (o.name) c.name = o.name;
      if (o.address?.trim()) {
        const a = o.address.trim();
        if (!c.addresses.has(a)) { c.addresses.add(a); c.addressList.push(a); }
      }
    });

    return Array.from(map.values()).map(c => {
      const sorted = [...c.validOrders].sort((a, b) =>
        (b.createdAt || "") > (a.createdAt || "") ? 1 : -1
      );
      const last   = sorted[0];
      const first  = sorted[sorted.length - 1];
      const totalSpent  = sorted.reduce((s, o) => s + (o.totalPrice || 0), 0);
      const totalOrders = sorted.length;
      const profile     = customerProfiles.find(
        (p: any) => normPhone(p.phone || "") === c.normPhone || p.phone === c.rawPhone
      );
      const lastOrderDate  = last  ? getDatePE(last.createdAt)  : "";
      const firstOrderDate = first ? getDatePE(first.createdAt) : "";
      const address = last?.address?.trim() || c.addressList[0] || "";

      return {
        normPhone: c.normPhone, rawPhone: c.rawPhone,
        name: profile?.nameOverride || c.name,
        address,
        validOrders: sorted,
        totalOrders,
        totalSpent,
        avgTicket: totalOrders > 0 ? totalSpent / totalOrders : 0,
        lastOrderDate,
        firstOrderDate,
        lastPaymentMethod: pmDisplay(last?.paymentMethod),
        addressHistory: c.addressList,
        birthday: profile?.birthday,
        tags: profile?.tags || [],
        notes: profile?.notes,
      } as CustomerRow;
    });
  }, [orders, customerProfiles]);

  // ── Month helpers ─────────────────────────────────────────────────────────
  const monthFrom = `${selYear}-${String(selMonth).padStart(2, "0")}-01`;
  const monthTo   = (() => {
    const d = new Date(selYear, selMonth, 0);
    return `${selYear}-${String(selMonth).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  // ── 5 Cards (4 main + 1 birthday) ─────────────────────────────────────────
  const cards = useMemo(() => {
    const atendidos = allCustomers.filter(c =>
      c.validOrders.some(o => { const d = getDatePE(o.createdAt); return d >= monthFrom && d <= monthTo; })
    );
    const nuevos      = atendidos.filter(c => c.firstOrderDate >= monthFrom);
    const recurrentes = atendidos.filter(c => c.firstOrderDate <  monthFrom);
    // sin15: last order exactly 15–29 days ago
    const sin15    = allCustomers.filter(c => {
      if (!c.lastOrderDate) return false;
      const d = daysAgo(c.lastOrderDate);
      return d >= 15 && d < 30;
    });
    // inactivos: last order 30+ days ago
    const inactivos = allCustomers.filter(c => c.lastOrderDate && daysAgo(c.lastOrderDate) >= 30);

    // cumpleHoy: birthday == today MM-DD (America/Lima)
    // Feb 29 rule: on non-leap years, Feb 29 birthdays appear on Feb 28
    const todayStr = todayPE(); // YYYY-MM-DD
    const todayMD  = todayStr.slice(5); // MM-DD
    const curYear  = Number(todayStr.slice(0, 4));
    const isLeap   = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const feb28Today = todayMD === "02-28" && !isLeap(curYear);
    const cumpleHoy = allCustomers.filter(c => {
      const prof = customerProfiles.find(
        (p: any) => normPhone(p.phone || "") === c.normPhone || p.phone === c.rawPhone
      );
      if (!prof?.birthday) return false;
      const bd: string = prof.birthday; // MM-DD
      if (bd === todayMD) return true;
      if (bd === "02-29" && feb28Today) return true; // Feb 29 → shown on Feb 28 in non-leap years
      return false;
    });

    return { atendidos, nuevos, recurrentes, sin15, inactivos, cumpleHoy };
  }, [allCustomers, monthFrom, monthTo, customerProfiles]);

  // ── Table data ────────────────────────────────────────────────────────────
  const tableData = useMemo(() => {
    let base: CustomerRow[];
    if (cardFilter === "sin15")   base = cards.sin15;
    else if (cardFilter === "cumple") base = cards.cumpleHoy;
    else                           base = allCustomers;
    if (customerSearchTerm) {
      const q = customerSearchTerm.toLowerCase();
      base = base.filter(c =>
        c.name.toLowerCase().includes(q) || c.rawPhone.includes(q)
      );
    }
    return [...base].sort((a, b) => {
      let av: any = a[sortKey as keyof CustomerRow] ?? "";
      let bv: any = b[sortKey as keyof CustomerRow] ?? "";
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [allCustomers, cardFilter, customerSearchTerm, sortKey, sortDir, cards]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc"); }
  };

  const toggleCard = (key: CardFilter) => setCardFilter(cf => cf === key ? null : key);

  const saveCrm = async () => {
    if (!sel) return;
    setCrmSaving(true);
    try {
      const parts = (crmForm.birthday || "").trim().split("/");
      const [dd, mm] = parts;
      // Validate: DD/MM, day 1-31, month 1-12
      const bdValid = dd && mm && /^\d{1,2}$/.test(dd) && /^\d{1,2}$/.test(mm)
        && Number(dd) >= 1 && Number(dd) <= 31 && Number(mm) >= 1 && Number(mm) <= 12;
      const birthday = bdValid
        ? `${mm.padStart(2, "0")}-${dd.padStart(2, "0")}` // MM-DD
        : (crmForm.birthday.trim() === "" ? "" : undefined); // empty = clear; invalid = skip
      // Preserve existing tags — do not send tags field so upsert won't overwrite them
      const payload: Record<string, any> = { phone: sel.rawPhone, notes: crmForm.notes };
      if (birthday !== undefined) payload.birthday = birthday;
      await fetch("/api/customer-profiles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setCrmOpen(false);
    } finally { setCrmSaving(false); }
  };

  const openCustomer = useCallback((c: CustomerRow) => {
    setSel(c);
    setDetailTab("info");
    setExpandedOrder(null);
    setCrmOpen(false);
    setCrmForm({
      birthday: c.birthday ? `${c.birthday.split("-")[1]}/${c.birthday.split("-")[0]}` : "",
      notes: c.notes || "",
    });
  }, []);

  // ── Month selector options ────────────────────────────────────────────────
  const monthOptions = useMemo(() => {
    const opts: { year: number; month: number; label: string }[] = [];
    const cur = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(cur.getFullYear(), cur.getMonth() - i, 1);
      opts.push({ year: d.getFullYear(), month: d.getMonth() + 1,
        label: d.toLocaleDateString("es-PE", { month: "long", year: "numeric" }) });
    }
    return opts;
  }, []);

  // ── Detail view ───────────────────────────────────────────────────────────
  if (sel) {
    const c = sel;
    const d = c.lastOrderDate ? daysAgo(c.lastOrderDate) : null;
    const selProfile = customerProfiles.find(
      (p: any) => normPhone(p.phone || "") === c.normPhone || p.phone === c.rawPhone
    );
    const lastUsedAddr = selProfile?.lastUsedAddress?.trim() || "";
    // Build deduped address list: lastUsedAddress first, then historical in order
    const addrSet = new Set<string>();
    const addrList: string[] = [];
    const pushAddr = (a: string) => { const t = a.trim(); if (t && !addrSet.has(t)) { addrSet.add(t); addrList.push(t); } };
    if (lastUsedAddr) pushAddr(lastUsedAddr);
    c.addressHistory.forEach(pushAddr);
    return (
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50">
          <button onClick={() => setSel(null)}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
            ← Volver al listado
          </button>
          <span className="text-xs text-gray-400 font-mono">{c.rawPhone}</span>
          <button onClick={() => setCrmOpen(o => !o)}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-400 transition-all">
            {crmOpen ? "Cerrar edición" : "Editar perfil"}
          </button>
        </div>

        <div className="flex divide-x divide-gray-100">
          {/* Left: datos */}
          <div className="w-64 flex-shrink-0 px-5 py-5 space-y-5">
            <div>
              <p className="text-base font-black text-gray-900 leading-tight">{c.name || "Sin nombre"}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{c.rawPhone}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Métricas</p>
              {[
                { label: "Total pedidos",   val: String(c.totalOrders) },
                { label: "Total comprado",  val: `S/ ${c.totalSpent.toFixed(2)}` },
                { label: "Ticket promedio", val: `S/ ${c.avgTicket.toFixed(2)}` },
                { label: "Último pedido",   val: d === null ? "—" : d === 0 ? "Hoy" : `Hace ${d} días` },
                { label: "Último pago",     val: c.lastPaymentMethod },
              ].map(r => (
                <div key={r.label} className="flex justify-between items-baseline border-b border-gray-50 pb-1.5">
                  <span className="text-xs text-gray-500">{r.label}</span>
                  <span className="text-xs font-black text-gray-900">{r.val}</span>
                </div>
              ))}
            </div>
            {c.notes && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notas internas</p>
                <p className="text-xs text-gray-600 leading-relaxed bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{c.notes}</p>
              </div>
            )}
          </div>

          {/* Right: pedidos + edición */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* CRM edit */}
            {crmOpen && (
              <div className="border-b border-gray-100 px-6 py-4 bg-gray-50 space-y-3">
                <p className="text-xs font-black text-gray-700 uppercase tracking-widest">Editar perfil</p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { label: "Cumpleaños (DD/MM)", key: "birthday" as const, placeholder: "15/06" },
                    { label: "Nota interna",        key: "notes"    as const, placeholder: "Prefiere sin picante" },
                  ] as { label: string; key: "birthday" | "notes"; placeholder: string }[]).map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">{f.label}</label>
                      <input type="text" placeholder={f.placeholder} value={crmForm[f.key]}
                        onChange={e => setCrmForm(x => ({ ...x, [f.key]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gray-400" />
                    </div>
                  ))}
                </div>
                <button onClick={saveCrm} disabled={crmSaving}
                  className="px-5 py-2 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors">
                  {crmSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {(["info", "pedidos"] as const).map(t => (
                <button key={t} onClick={() => setDetailTab(t)}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wide transition-colors border-b-2 -mb-px ${
                    detailTab === t ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}>
                  {t === "info" ? "Información" : `Pedidos (${c.totalOrders})`}
                </button>
              ))}
            </div>

            {/* Tab: Info */}
            {detailTab === "info" && (
              <div className="px-6 py-5 space-y-3">
                {[
                  { k: "Primer pedido", v: fmtDate(c.firstOrderDate) },
                  { k: "Último pedido",  v: fmtDate(c.lastOrderDate) },
                  ...(c.birthday ? [{ k: "Cumpleaños", v: (() => { const [mm,dd]=c.birthday!.split("-"); return `${dd}/${mm}`; })() }] : []),
                ].map(r => (
                  <div key={r.k} className="flex justify-between gap-4 py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-500 flex-shrink-0">{r.k}</span>
                    <span className="text-xs font-semibold text-gray-900 text-right">{r.v}</span>
                  </div>
                ))}

                {/* Address history */}
                <div className="pt-1 space-y-1.5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Direcciones</p>
                  {addrList.length === 0 ? (
                    <p className="text-xs text-gray-400">Sin dirección registrada</p>
                  ) : addrList.map((a, i) => (
                    <div key={a} className="flex items-start gap-2">
                      <span className="text-[10px] font-bold mt-0.5 flex-shrink-0 w-16 text-right">
                        {i === 0 ? <span className="text-[#F58424]">Última usada</span> : <span className="text-gray-300">Anterior</span>}
                      </span>
                      <span className="text-xs text-gray-800 leading-snug">{a}</span>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {c.notes && (
                  <div className="pt-1 space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notas internas</p>
                    <p className="text-xs text-gray-600 leading-relaxed bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{c.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Pedidos */}
            {detailTab === "pedidos" && (
              <div className="flex-1 overflow-y-auto">
                {c.validOrders.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-12">Sin pedidos</p>
                ) : c.validOrders.map((order: any) => {
                  const isExp  = expandedOrder === order.id;
                  const items  = order.completedOrders || order.cart || [];
                  const deliv  = order.deliveryCost || 0;
                  return (
                    <div key={order.id} className="border-b border-gray-100 last:border-0">
                      <button className="w-full text-left px-6 py-3 hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedOrder(isExp ? null : order.id)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-gray-700">{order.id}</span>
                            <span className="text-[10px] text-gray-400">{pmDisplay(order.paymentMethod)}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-400">{fmtDate(getDatePE(order.createdAt))}</span>
                            <span className="text-sm font-black text-gray-900">S/ {(order.totalPrice || 0).toFixed(2)}</span>
                            <span className="text-gray-300 text-xs">{isExp ? "▲" : "▼"}</span>
                          </div>
                        </div>
                      </button>
                      {isExp && (
                        <div className="px-6 pb-4 space-y-2 bg-gray-50">
                          {items.map((it: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 py-1.5 border-b border-gray-100 last:border-0">
                              <span className="text-xs font-black text-gray-400 w-5 text-right flex-shrink-0">{it.quantity || 1}×</span>
                              <span className="text-sm font-semibold text-gray-900 flex-1">{it.name || "—"}</span>
                              <span className="text-xs font-black text-gray-900">S/ {((it.finalPrice ?? it.price ?? 0) * (it.quantity || 1)).toFixed(2)}</span>
                            </div>
                          ))}
                          {deliv > 0 && <p className="text-[11px] text-gray-400 text-right">+ Delivery S/ {deliv.toFixed(2)}</p>}
                          <p className="text-sm font-black text-gray-900 text-right">Total S/ {(order.totalPrice || 0).toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  const cardLabelMap: Record<NonNullable<CardFilter>, string> = {
    sin15:  "Sin pedir: 15–29 días",
    cumple: "Cumpleaños: hoy",
  };

  const thCls = "px-3 py-2.5 text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap";

  return (
    <div className="space-y-5">

      {/* Month selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mes</span>
        <select
          value={`${selYear}-${selMonth}`}
          onChange={e => { const [y, m] = e.target.value.split("-"); setSelYear(Number(y)); setSelMonth(Number(m)); }}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 bg-white focus:outline-none">
          {monthOptions.map(o => (
            <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* A: Clientes del mes — not clickable */}
        <div className="bg-white rounded-2xl border-2 border-[#F58424]/40 p-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Clientes</p>
          <p className="text-3xl font-black text-gray-900 tabular-nums">{cards.atendidos.length}</p>
          <div className="mt-2 space-y-0.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Nuevos</span>
              <span className="font-bold text-gray-700">{cards.nuevos.length}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Recurrentes</span>
              <span className="font-bold text-gray-700">{cards.recurrentes.length}</span>
            </div>
          </div>
        </div>

        {/* B: Sin pedir hace 15 días — ONLY clickable card */}
        <div onClick={() => toggleCard("sin15")}
          className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all ${cardFilter === "sin15" ? "border-[#F58424] shadow-md" : "border-[#F58424]/40 hover:border-[#F58424]"}`}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sin pedir hace 15 días</p>
          <p className="text-3xl font-black text-gray-900 tabular-nums">{cards.sin15.length}</p>
          <p className="text-[10px] text-gray-400 mt-2">Entre 15 y 29 días sin pedir</p>
        </div>

        {/* C: Clientes inactivos — not clickable */}
        <div className="bg-white rounded-2xl border-2 border-[#F58424]/40 p-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Clientes inactivos</p>
          <p className="text-3xl font-black text-gray-900 tabular-nums">{cards.inactivos.length}</p>
          <p className="text-[10px] text-gray-400 mt-2">30 días o más sin pedir</p>
        </div>

        {/* D: Total clientes (all-time, all valid orders) — not clickable */}
        <div className="bg-white rounded-2xl border-2 border-[#F58424]/40 p-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total clientes</p>
          <p className="text-3xl font-black text-gray-900 tabular-nums">{allCustomers.length}</p>
          <p className="text-[10px] text-gray-400 mt-2">Clientes únicos en el historial</p>
        </div>
      </div>

      {/* Birthday card — compact, own row */}
      <div
        onClick={() => toggleCard("cumple")}
        className={`bg-white rounded-2xl border-2 p-3 flex items-center gap-4 cursor-pointer transition-all w-full sm:w-auto sm:max-w-xs ${
          cardFilter === "cumple" ? "border-[#F58424] shadow-md" : "border-[#F58424]/40 hover:border-[#F58424]"
        }`}
      >
        <span className="text-2xl select-none">🎂</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cumpleaños de hoy</p>
          {cards.cumpleHoy.length > 0 ? (
            <p className="text-xl font-black text-gray-900 tabular-nums leading-tight">{cards.cumpleHoy.length}</p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">Sin cumpleaños hoy</p>
          )}
        </div>
      </div>

      {/* Search + active filter chip */}
      <div className="flex flex-wrap items-center gap-3">
        {cardFilter && (
          <div className="flex items-center gap-2 bg-orange-50 border border-[#F58424]/40 rounded-lg px-3 py-1.5">
            <span className="text-xs font-bold text-[#F58424]">{cardLabelMap[cardFilter]}</span>
            <button onClick={() => setCardFilter(null)} className="text-xs text-[#F58424] font-semibold hover:text-orange-700 ml-1 underline underline-offset-2">Mostrar todos</button>
          </div>
        )}
        <div className="relative ml-auto">
          <input type="text" value={customerSearchTerm} onChange={e => setCustomerSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="pl-7 pr-7 py-2 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 w-60 bg-white" />
          {customerSearchTerm && (
            <button onClick={() => setCustomerSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold">×</button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Cargando...</div>
      ) : tableData.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {customerSearchTerm
            ? `Sin resultados para "${customerSearchTerm}"`
            : cardFilter ? "Ningún cliente en este filtro" : "Sin clientes registrados"}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: "920px" }}>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th onClick={() => handleSort("name")} className={`${thCls} text-left cursor-pointer hover:text-gray-700 select-none`}>
                    Nombre {sortKey === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className={`${thCls} text-left`}>Teléfono</th>
                  <th className={`${thCls} text-left`} style={{ minWidth: 160 }}>Dirección</th>
                  <th onClick={() => handleSort("lastOrderDate")} className={`${thCls} text-left cursor-pointer hover:text-gray-700 select-none`}>
                    Último pedido {sortKey === "lastOrderDate" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th onClick={() => handleSort("totalOrders")} className={`${thCls} text-right cursor-pointer hover:text-gray-700 select-none`}>
                    Pedidos {sortKey === "totalOrders" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th onClick={() => handleSort("totalSpent")} className={`${thCls} text-right cursor-pointer hover:text-gray-700 select-none`}>
                    Total comprado {sortKey === "totalSpent" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th onClick={() => handleSort("avgTicket")} className={`${thCls} text-right cursor-pointer hover:text-gray-700 select-none`}>
                    Ticket prom. {sortKey === "avgTicket" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className={`${thCls} text-left`}>Último pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.map((c, idx) => {
                  const d = c.lastOrderDate ? daysAgo(c.lastOrderDate) : null;
                  return (
                    <tr key={c.normPhone} onClick={() => openCustomer(c)}
                      className={`cursor-pointer hover:bg-orange-50/40 transition-colors ${idx % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                      <td className="px-3 py-2.5">
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{c.name || "Sin nombre"}</p>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 font-mono whitespace-nowrap">{c.rawPhone}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-600" style={{ maxWidth: 180 }}>
                        {c.address || <span className="text-gray-300">Sin dirección</span>}
                      </td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                        {d !== null ? (
                          <>
                            <span className={`font-semibold ${d === 0 ? "text-green-600" : d <= 7 ? "text-green-600" : d <= 30 ? "text-amber-600" : "text-red-500"}`}>
                              {d === 0 ? "Hoy" : d === 1 ? "Ayer" : `Hace ${d}d`}
                            </span>
                            <span className="text-gray-400 ml-1">· {fmtDate(c.lastOrderDate)}</span>
                          </>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-sm font-bold text-gray-900 text-right tabular-nums">{c.totalOrders}</td>
                      <td className="px-3 py-2.5 text-sm font-bold text-gray-900 text-right tabular-nums whitespace-nowrap">S/ {c.totalSpent.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-sm font-bold text-gray-700 text-right tabular-nums whitespace-nowrap">
                        {c.totalOrders > 0 ? `S/ ${c.avgTicket.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{c.lastPaymentMethod}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-[11px] text-gray-400">
              {tableData.length} de {allCustomers.length} clientes · Acumulado histórico
            </p>
            {(cardFilter || customerSearchTerm) && (
              <button onClick={() => { setCardFilter(null); setCustomerSearchTerm(""); }}
                className="text-[11px] text-gray-500 hover:text-gray-900 underline">
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
