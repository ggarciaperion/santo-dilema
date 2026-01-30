import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { writeFile } from "fs/promises";
import path from "path";

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
    const formData = await request.formData();
    console.log("📦 Recibiendo nuevo pedido");

    // Extraer campos del FormData
    const name = formData.get('name') as string;
    const dni = formData.get('dni') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const email = formData.get('email') as string;
    const cart = JSON.parse(formData.get('cart') as string);
    const completedOrders = JSON.parse(formData.get('completedOrders') as string || '[]');
    const totalItems = parseInt(formData.get('totalItems') as string);
    const totalPrice = parseFloat(formData.get('totalPrice') as string);
    const paymentMethod = formData.get('paymentMethod') as string;
    const timestamp = formData.get('timestamp') as string;
    const paymentProof = formData.get('paymentProof') as File | null;

    let paymentProofPath = null;

    // Guardar comprobante de pago si existe
    if (paymentProof) {
      const bytes = await paymentProof.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Crear nombre único para el archivo
      const fileName = `voucher-${Date.now()}-${paymentProof.name}`;
      const filePath = path.join(process.cwd(), 'public', 'vouchers', fileName);

      try {
        await writeFile(filePath, buffer);
        paymentProofPath = `/vouchers/${fileName}`;
        console.log("💾 Comprobante guardado:", paymentProofPath);
      } catch (error) {
        console.error("Error al guardar comprobante:", error);
      }
    }

    // Determinar estado del pedido según método de pago
    const status = paymentMethod === 'anticipado' ? 'pendiente-verificacion' : 'pending';

    // Crear nuevo pedido con ID único
    const newOrder = {
      id: Date.now().toString(),
      name,
      dni,
      phone,
      address,
      email,
      cart,
      completedOrders,
      totalItems,
      totalPrice,
      paymentMethod,
      paymentProofPath,
      timestamp,
      status,
      createdAt: new Date().toISOString(),
    };

    console.log("✅ Pedido creado con ID:", newOrder.id, "| Método:", paymentMethod);

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
