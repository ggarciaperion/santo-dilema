import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// GET - Obtener todas las deducciones de stock
export async function GET() {
  try {
    const deductions = await storage.getDeductions();
    return NextResponse.json(deductions);
  } catch (error) {
    console.error("Error al leer deducciones:", error);
    return NextResponse.json({ error: "Error al leer deducciones" }, { status: 500 });
  }
}

// POST - Registrar nueva deducción de stock
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("🔥 Deducción recibida:", body);

    const newDeduction = {
      id: Date.now().toString(),
      orderId: body.orderId || "MANUAL",
      orderName: body.orderName || "Consumo Manual",
      items: body.items || [], // Array de { productName, quantity, unit }
      deductionDate: body.deductionDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    console.log("🔥 Deducción a guardar:", newDeduction);

    // Descontar stock del inventario para cada item
    for (const item of newDeduction.items) {
      const success = await storage.deductStock(item.productName, item.unit, item.quantity);
      if (!success) {
        console.warn(`⚠️ No se pudo descontar completamente ${item.quantity} ${item.unit} de ${item.productName}`);
      }
    }

    // Guardar el registro de la deducción
    const savedDeduction = await storage.saveDeduction(newDeduction);

    return NextResponse.json(savedDeduction, { status: 201 });
  } catch (error) {
    console.error("Error al registrar deducción:", error);
    return NextResponse.json({ error: "Error al registrar deducción", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
