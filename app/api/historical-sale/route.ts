import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// Endpoint para agregar venta histórica del 13 de febrero (apertura)
// Este endpoint solo debe ejecutarse una vez para registrar la venta perdida
export async function POST(req: Request) {
  try {
    // Verificar si ya existe una venta histórica del 13 de febrero
    const orders = await storage.getOrders();
    const historicalSaleExists = orders.some(
      (order) => order.id === "historical-opening-sale-2026-02-13"
    );

    if (historicalSaleExists) {
      return NextResponse.json(
        { error: "La venta histórica ya fue registrada" },
        { status: 400 }
      );
    }

    // Crear pedido histórico del 13 de febrero
    const historicalOrder = {
      id: "historical-opening-sale-2026-02-13",
      name: "VENTA HISTÓRICA - DÍA DE APERTURA",
      dni: "00000000",
      phone: "000000000",
      address: "Venta del 13 de febrero 2026 (recuperada)",
      email: "",
      cart: [
        {
          id: "historical-item",
          name: "Ventas del día de apertura",
          quantity: 1,
          price: 250.0,
          finalPrice: 250.0,
          category: "fat",
        },
      ],
      totalItems: 1,
      totalPrice: 250.0,
      status: "delivered",
      // Fecha: 13 de febrero 2026, 20:00 hora de Perú (UTC-5)
      createdAt: "2026-02-13T20:00:00.000-05:00",
      timestamp: "2026-02-13T20:00:00.000-05:00",
      deliveredAt: "2026-02-13T22:00:00.000-05:00",
      notes: "⚠️ VENTA HISTÓRICA: Esta venta corresponde al día de apertura del negocio (13 de febrero 2026). Los datos del pedido se perdieron por un error del sistema y fueron recuperados manualmente. Solo se registró el monto total de S/ 250.00.",
    };

    // Guardar el pedido histórico
    await storage.saveOrder(historicalOrder);

    return NextResponse.json({
      success: true,
      message: "Venta histórica del 13 de febrero registrada exitosamente",
      order: historicalOrder,
    });
  } catch (error) {
    console.error("Error al registrar venta histórica:", error);
    return NextResponse.json(
      { error: "Error al registrar la venta histórica" },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar si ya existe
export async function GET() {
  try {
    const orders = await storage.getOrders();
    const historicalSale = orders.find(
      (order) => order.id === "historical-opening-sale-2026-02-13"
    );

    if (historicalSale) {
      return NextResponse.json({
        exists: true,
        sale: historicalSale,
      });
    } else {
      return NextResponse.json({
        exists: false,
        message: "La venta histórica aún no ha sido registrada",
      });
    }
  } catch (error) {
    console.error("Error al verificar venta histórica:", error);
    return NextResponse.json(
      { error: "Error al verificar la venta histórica" },
      { status: 500 }
    );
  }
}
