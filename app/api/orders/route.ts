import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// GET - Obtener todos los pedidos
export async function GET() {
  try {
    const orders = await storage.getOrders();
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error al leer pedidos:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST - Crear un nuevo pedido
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📦 Recibiendo nuevo pedido:", body);

    // Crear nuevo pedido con ID único
    const newOrder = {
      id: Date.now().toString(),
      ...body,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    console.log("✅ Pedido creado con ID:", newOrder.id);

    // Guardar usando la utilidad de storage
    await storage.saveOrder(newOrder);
    console.log("💾 Pedido guardado");

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("❌ Error al crear pedido:", error);
    return NextResponse.json(
      {
        error: "Error al procesar el pedido",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar estado de un pedido
export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();

    const updatedOrder = await storage.updateOrder(id, {
      status,
      updatedAt: new Date().toISOString(),
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error al actualizar pedido:", error);
    return NextResponse.json(
      { error: "Error al actualizar el pedido" },
      { status: 500 }
    );
  }
}
