"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

const EMISOR = {
  razonSocial: "SANTO DILEMA",
  ruc: "20000000000",
  direccion: "Lima, Peru",
  telefono: "",
};

function fmt(n: number) {
  return n.toFixed(2);
}

export default function ComprobantePage() {
  const { id } = useParams<{ id: string }>();
  const [comp, setComp] = useState<Comprobante | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/comprobantes?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setComp(data);
      })
      .catch(() => setError("Error al cargar el comprobante"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Cargando comprobante...</p>
      </div>
    );
  }

  if (error || !comp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500 text-sm">{error || "Comprobante no encontrado"}</p>
      </div>
    );
  }

  const tipoLabel = comp.tipo === "boleta" ? "BOLETA DE VENTA" : "FACTURA";
  const docLabel = comp.clienteDocTipo === "RUC" ? "RUC" : comp.clienteDocTipo === "CE" ? "CE" : "DNI";

  // Fecha formateada en español
  const [y, m, d] = comp.fechaEmision.split("-");
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const fechaLegible = `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .print-page { box-shadow: none !important; border: none !important; }
        }
        @page { size: A5; margin: 10mm; }
      `}</style>

      {/* Barra de herramientas (no imprime) */}
      <div className="no-print bg-gray-900 text-white px-6 py-3 flex items-center justify-between print:hidden">
        <span className="text-sm font-bold">Vista previa: {comp.id}</span>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="bg-white text-gray-900 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-100 transition"
          >
            Imprimir / Guardar PDF
          </button>
          <button
            onClick={() => window.close()}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Documento imprimible */}
      <div className="min-h-screen bg-gray-100 flex items-start justify-center py-8 px-4">
        <div
          className="print-page bg-white w-full max-w-[148mm] shadow-xl rounded-lg overflow-hidden"
          style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: "11px" }}
        >
          {/* Banda superior si está anulado */}
          {comp.estado === "anulado" && (
            <div className="bg-red-600 text-white text-center py-1 text-xs font-black tracking-widest uppercase">
              ANULADO
            </div>
          )}

          {/* Encabezado */}
          <div className="bg-gray-900 text-white px-6 py-5 flex items-start justify-between gap-4">
            <div>
              <div className="text-xl font-black tracking-tight">{EMISOR.razonSocial}</div>
              <div className="text-gray-400 text-xs mt-1">RUC: {EMISOR.ruc}</div>
              <div className="text-gray-400 text-xs">{EMISOR.direccion}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-gray-300 uppercase tracking-widest">{tipoLabel}</div>
              <div className="text-2xl font-black text-white mt-1 tracking-tight">{comp.id}</div>
              <div className="text-gray-400 text-xs mt-1">{fechaLegible}</div>
            </div>
          </div>

          {/* Datos del cliente */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              <div>
                <span className="text-gray-400 uppercase tracking-wide font-semibold text-[10px]">Cliente</span>
                <div className="font-bold text-gray-900 mt-0.5">{comp.clienteNombre}</div>
              </div>
              <div>
                <span className="text-gray-400 uppercase tracking-wide font-semibold text-[10px]">{docLabel}</span>
                <div className="font-bold text-gray-900 mt-0.5">{comp.clienteDocNum}</div>
              </div>
              {comp.clienteDireccion && (
                <div className="col-span-2">
                  <span className="text-gray-400 uppercase tracking-wide font-semibold text-[10px]">Dirección</span>
                  <div className="text-gray-700 mt-0.5">{comp.clienteDireccion}</div>
                </div>
              )}
              <div>
                <span className="text-gray-400 uppercase tracking-wide font-semibold text-[10px]">Pedido ref.</span>
                <div className="text-gray-700 mt-0.5">{comp.orderId}</div>
              </div>
            </div>
          </div>

          {/* Tabla de items */}
          <div className="px-6 pt-4 pb-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-2 font-semibold text-gray-400 uppercase tracking-wide text-[10px] w-6">Ctd.</th>
                  <th className="text-left pb-2 font-semibold text-gray-400 uppercase tracking-wide text-[10px] pl-2">Descripción</th>
                  <th className="text-right pb-2 font-semibold text-gray-400 uppercase tracking-wide text-[10px]">P. Unit.</th>
                  <th className="text-right pb-2 font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {comp.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-gray-700">{item.cantidad}</td>
                    <td className="py-2 pl-2 text-gray-900 font-medium">{item.descripcion}</td>
                    <td className="py-2 text-right text-gray-700">S/ {fmt(item.precioUnitario)}</td>
                    <td className="py-2 text-right text-gray-900 font-semibold">S/ {fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex justify-end">
              <div className="w-48 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Op. Gravada</span>
                  <span>S/ {fmt(comp.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>IGV (18%)</span>
                  <span>S/ {fmt(comp.igv)}</span>
                </div>
                <div className="flex justify-between font-black text-gray-900 text-sm border-t border-gray-200 pt-2 mt-2">
                  <span>TOTAL</span>
                  <span>S/ {fmt(comp.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Motivo anulación */}
          {comp.estado === "anulado" && comp.motivoAnulacion && (
            <div className="px-6 pb-4">
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-2 text-xs text-red-700">
                <span className="font-bold">Motivo de anulación:</span> {comp.motivoAnulacion}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center text-[10px] text-gray-400">
            Representación impresa de {tipoLabel} — Documento interno. RUC: {EMISOR.ruc}
          </div>
        </div>
      </div>
    </>
  );
}
