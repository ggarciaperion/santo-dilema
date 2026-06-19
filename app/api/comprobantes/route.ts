import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

// GET — listar comprobantes (con filtros opcionales ?tipo=boleta&estado=emitido&from=&to=)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const estado = searchParams.get("estado");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const orderId = searchParams.get("orderId");
    const id = searchParams.get("id");

    let comprobantes = await storage.getComprobantes();

    if (id) {
      const found = comprobantes.find((c) => c.id === id);
      if (!found) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      return NextResponse.json(found);
    }
    if (orderId) comprobantes = comprobantes.filter((c) => c.orderId === orderId);
    if (tipo) comprobantes = comprobantes.filter((c) => c.tipo === tipo);
    if (estado) comprobantes = comprobantes.filter((c) => c.estado === estado);
    if (from) comprobantes = comprobantes.filter((c) => c.fechaEmision >= from);
    if (to) comprobantes = comprobantes.filter((c) => c.fechaEmision <= to);

    return NextResponse.json(comprobantes);
  } catch (error) {
    console.error("Error al obtener comprobantes:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST — emitir nuevo comprobante
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipo, orderId, clienteNombre, clienteDocTipo, clienteDocNum, clienteDireccion, items } = body;

    if (!tipo || !orderId || !clienteNombre || !clienteDocTipo || !clienteDocNum || !items?.length) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Calcular totales
    const totalConIgv: number = items.reduce((s: number, i: any) => s + i.total, 0);
    const subtotal = Math.round((totalConIgv / 1.18) * 100) / 100;
    const igv = Math.round((totalConIgv - subtotal) * 100) / 100;
    const total = totalConIgv;

    // Correlativo y serie
    const correlativo = await storage.getNextComprobCorrelativo(tipo);
    const serie = tipo === "boleta" ? "B001" : "F001";
    const num = correlativo.toString().padStart(5, "0");
    const id = `${serie}-${num}`;

    // Fecha en Lima
    const now = new Date();
    const limaStr = now.toLocaleString("en-US", { timeZone: "America/Lima" });
    const limaDate = new Date(limaStr);
    const fechaEmision = limaDate.toISOString().split("T")[0];

    const comprobante = {
      id,
      tipo,
      serie,
      correlativo,
      orderId,
      clienteNombre: clienteNombre.trim().toUpperCase(),
      clienteDocTipo,
      clienteDocNum: clienteDocNum.trim(),
      clienteDireccion: clienteDireccion?.trim() || undefined,
      items: items.map((i: any) => ({
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precioUnitario: Math.round((i.total / i.cantidad / 1.18) * 100) / 100,
        total: Math.round((i.total / 1.18) * 100) / 100,
      })),
      subtotal,
      igv,
      total,
      estado: "emitido" as const,
      fechaEmision,
      createdAt: now.toISOString(),
    };

    const saved = await storage.saveComprobante(comprobante);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Error al emitir comprobante:", error);
    return NextResponse.json({ error: "Error al emitir comprobante" }, { status: 500 });
  }
}

// PATCH — anular comprobante
export async function PATCH(request: Request) {
  try {
    const { id, motivoAnulacion } = await request.json();
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const updated = await storage.updateComprobante(id, {
      estado: "anulado",
      motivoAnulacion: motivoAnulacion || "Anulado por administrador",
      updatedAt: new Date().toISOString(),
    });

    if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al anular comprobante:", error);
    return NextResponse.json({ error: "Error al anular" }, { status: 500 });
  }
}
