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

    // Generar ID con formato SD + correlativo + día + mes
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');

    // Obtener pedidos existentes para calcular el correlativo
    const existingOrders = await storage.getOrders();

    // Filtrar pedidos del día actual que empiecen con "SD"
    const todayOrders = existingOrders.filter((order: any) => {
      if (!order.id.startsWith('SD')) return false;

      const orderDate = new Date(order.createdAt);
      return (
        orderDate.getDate() === today.getDate() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getFullYear() === today.getFullYear()
      );
    });

    // Calcular el siguiente número correlativo del día
    const nextCorrelative = (todayOrders.length + 1).toString().padStart(4, '0');

    // Formato: SD + correlativo (4 dígitos) + día (2 dígitos) + mes (2 dígitos)
    const orderId = `SD${nextCorrelative}${day}${month}`;

    // Crear nuevo pedido con ID único
    const newOrder = {
      id: orderId,
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

    // Si el pedido se marca como "Entregado", descontar automáticamente del stock
    if (status === "Entregado") {
      console.log("📦 Pedido marcado como Entregado. Iniciando descuento automático de stock...");

      // Obtener todos los productos para acceder a sus componentes
      const products = await storage.getProducts();

      // Calcular los componentes totales necesarios
      const deductionItems: Array<{ productName: string; quantity: number; unit: string }> = [];

      updatedOrder.cart.forEach((cartItem: any) => {
        const product = products.find((p: any) => p.name === cartItem.name);

        if (product && product.components && product.components.length > 0) {
          console.log(`✅ Producto "${product.name}" tiene ${product.components.length} componentes`);

          // Para cada componente del producto
          product.components.forEach((component: any) => {
            const totalQuantity = cartItem.quantity * component.quantity;

            // Buscar si ya existe este componente en la lista
            const existingItem = deductionItems.find(
              (item) => item.productName === component.productName && item.unit === component.unit
            );

            if (existingItem) {
              existingItem.quantity += totalQuantity;
            } else {
              deductionItems.push({
                productName: component.productName,
                quantity: totalQuantity,
                unit: component.unit,
              });
            }
          });
        } else {
          console.log(`⚠️ Producto "${cartItem.name}" no tiene componentes definidos`);
        }
      });

      // Guardar la deducción si hay items
      if (deductionItems.length > 0) {
        const deduction = {
          id: Date.now().toString(),
          orderId: updatedOrder.id,
          orderName: `Pedido #${updatedOrder.id} - ${updatedOrder.name}`,
          items: deductionItems,
          deductionDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        await storage.saveDeduction(deduction);
        console.log(`✅ Deducción guardada: ${deductionItems.length} items descontados del stock`);
      } else {
        console.log("⚠️ No hay componentes para descontar del stock");
      }
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
