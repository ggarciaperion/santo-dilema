"use client";

import { useEffect, useState, useMemo } from "react";

interface Comprobante {
  id: string;
  tipo: "boleta" | "factura";
  serie: string;
  correlativo: number;
  orderId: string;
  clienteNombre: string;
  clienteDocTipo: string;
  clienteDocNum: string;
  clienteDireccion?: string;
  items: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    total: number;
  }>;
  subtotal: number;
  igv: number;
  total: number;
  estado: "emitido" | "anulado";
  fechaEmision: string;
  createdAt: string;
  motivoAnulacion?: string;
}

function fmt(n: number) {
  return n.toFixed(2);
}

export default function ComprobantesTab() {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState<"all" | "boleta" | "factura">("all");
  const [filterEstado, setFilterEstado] = useState<"all" | "emitido" | "anulado">("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [search, setSearch] = useState("");
  const [anularModal, setAnularModal] = useState<Comprobante | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/comprobantes");
      const data = await res.json();
      setComprobantes(Array.isArray(data) ? data : []);
    } catch {
      setComprobantes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = [...comprobantes];
    if (filterTipo !== "all") list = list.filter((c) => c.tipo === filterTipo);
    if (filterEstado !== "all") list = list.filter((c) => c.estado === filterEstado);
    if (filterFrom) list = list.filter((c) => c.fechaEmision >= filterFrom);
    if (filterTo) list = list.filter((c) => c.fechaEmision <= filterTo);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.clienteNombre.toLowerCase().includes(q) ||
          c.clienteDocNum.includes(q) ||
          c.orderId.toLowerCase().includes(q)
      );
    }
    return list;
  }, [comprobantes, filterTipo, filterEstado, filterFrom, filterTo, search]);

  const stats = useMemo(() => {
    const emitidos = comprobantes.filter((c) => c.estado === "emitido");
    const boletas = emitidos.filter((c) => c.tipo === "boleta");
    const facturas = emitidos.filter((c) => c.tipo === "factura");
    const totalVentas = emitidos.reduce((s, c) => s + c.total, 0);
    const totalIgv = emitidos.reduce((s, c) => s + c.igv, 0);
    return { totalEmitidos: emitidos.length, boletas: boletas.length, facturas: facturas.length, totalVentas, totalIgv };
  }, [comprobantes]);

  const handleAnular = async () => {
    if (!anularModal) return;
    setSaving(true);
    try {
      await fetch("/api/comprobantes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: anularModal.id, motivoAnulacion }),
      });
      await load();
      setAnularModal(null);
      setMotivoAnulacion("");
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const rows = [
      ["Serie-Correlativo", "Tipo", "Fecha", "Cliente", "Documento", "N° Doc", "Pedido Ref", "Op. Gravada", "IGV", "Total", "Estado"],
      ...filtered.map((c) => [
        c.id,
        c.tipo === "boleta" ? "Boleta" : "Factura",
        c.fechaEmision,
        c.clienteNombre,
        c.clienteDocTipo,
        c.clienteDocNum,
        c.orderId,
        fmt(c.subtotal),
        fmt(c.igv),
        fmt(c.total),
        c.estado,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fecha = new Date().toISOString().split("T")[0];
    a.download = `comprobantes_${fecha}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-black text-gray-800">Comprobantes</h2>
          <p className="text-gray-400 text-sm mt-1">Boletas y facturas emitidas — para consolidar ante SUNAT</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-700 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total emitidos", value: stats.totalEmitidos, sub: "comprobantes", color: "text-gray-900" },
          { label: "Boletas", value: stats.boletas, sub: "emitidas", color: "text-blue-700" },
          { label: "Facturas", value: stats.facturas, sub: "emitidas", color: "text-purple-700" },
          { label: "Total ventas", value: `S/ ${fmt(stats.totalVentas)}`, sub: `IGV: S/ ${fmt(stats.totalIgv)}`, color: "text-emerald-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-1 font-semibold uppercase tracking-wide">{s.label}</div>
            <div className="text-xs text-gray-300 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-end shadow-sm">
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Tipo</label>
          <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value as any)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400">
            <option value="all">Todos</option>
            <option value="boleta">Boleta</option>
            <option value="factura">Factura</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Estado</label>
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value as any)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400">
            <option value="all">Todos</option>
            <option value="emitido">Emitido</option>
            <option value="anulado">Anulado</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Desde</label>
          <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Hasta</label>
          <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400" />
        </div>
        <div className="flex-1 min-w-48">
          <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Buscar</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre, N° doc, ID, pedido..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400"
          />
        </div>
        {(filterTipo !== "all" || filterEstado !== "all" || filterFrom || filterTo || search) && (
          <button
            onClick={() => { setFilterTipo("all"); setFilterEstado("all"); setFilterFrom(""); setFilterTo(""); setSearch(""); }}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg transition"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No hay comprobantes{search || filterTipo !== "all" ? " con esos filtros" : " emitidos aún"}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Comprobante", "Fecha", "Cliente", "Documento", "Pedido", "Subtotal", "IGV", "Total", "Estado", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => (
                  <tr key={c.id} className={`hover:bg-gray-50 transition ${c.estado === "anulado" ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-gray-900">{c.id}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{c.tipo === "boleta" ? "Boleta" : "Factura"}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.fechaEmision}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 max-w-[140px] truncate">{c.clienteNombre}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-gray-400 text-xs">{c.clienteDocTipo}</span>{" "}
                      <span className="text-gray-700 font-mono text-xs">{c.clienteDocNum}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono whitespace-nowrap">{c.orderId}</td>
                    <td className="px-4 py-3 text-right text-gray-600 font-mono whitespace-nowrap">S/ {fmt(c.subtotal)}</td>
                    <td className="px-4 py-3 text-right text-gray-600 font-mono whitespace-nowrap">S/ {fmt(c.igv)}</td>
                    <td className="px-4 py-3 text-right font-black text-gray-900 font-mono whitespace-nowrap">S/ {fmt(c.total)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.estado === "emitido" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                      }`}>
                        {c.estado === "emitido" ? "Emitido" : "Anulado"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => window.open(`/comprobante/${encodeURIComponent(c.id)}`, "_blank")}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition"
                          title="Ver / Imprimir"
                        >
                          Ver
                        </button>
                        {c.estado === "emitido" && (
                          <button
                            onClick={() => { setAnularModal(c); setMotivoAnulacion(""); }}
                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition"
                            title="Anular comprobante"
                          >
                            Anular
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal anular */}
      {anularModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setAnularModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-gray-900 mb-1">Anular Comprobante</h3>
            <p className="text-sm text-gray-500 mb-4">{anularModal.id} — {anularModal.clienteNombre}</p>
            <div className="mb-4">
              <label className="text-xs text-gray-500 font-semibold block mb-1.5">Motivo de anulación</label>
              <textarea
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Ej: Error en el monto, cliente solicitó cancelación..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAnular}
                disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold text-sm transition"
              >
                {saving ? "Anulando..." : "Confirmar anulación"}
              </button>
              <button
                onClick={() => setAnularModal(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
