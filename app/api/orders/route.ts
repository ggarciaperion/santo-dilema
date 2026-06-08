import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper para obtener timestamp actual en UTC
function getPeruTimestamp(): string {
  return new Date().toISOString();
}

// Productos FAT para referencia
const fatProducts = [
  {
    id: "pequeno-dilema",
    name: "Pequeño Dilema",
    price: 22.00,
    category: "fat",
  },
  {
    id: "chiguan-alitas",
    name: "4 Alitas · Chiguan",
    price: 12.00,
    category: "fat",
  },
  {
    id: "duo-dilema",
    name: "Dúo Dilema",
    price: 34.00,
    category: "fat",
  },
  {
    id: "santo-pecado",
    name: "Santo Pecado",
    price: 47.00,
    category: "fat",
  },
];

// Productos FIT para referencia
const fitProducts = [
  {
    id: "ensalada-clasica",
    name: "CLÁSICA FRESH BOWL",
    price: 18.50,
    category: "fit",
  },
  {
    id: "ensalada-proteica",
    name: "CÉSAR POWER BOWL",
    price: 20.00,
    category: "fit",
  },
  {
    id: "ensalada-caesar",
    name: "PROTEIN FIT BOWL",
    price: 20.00,
    category: "fit",
  },
  {
    id: "ensalada-mediterranea",
    name: "TUNA FRESH BOWL",
    price: 23.50,
    category: "fit",
  },
  {
    id: "cobb-supreme-bowl",
    name: "COBB SUPREME BOWL",
    price: 23.50,
    category: "fit",
  },
  {
    id: "crispy-chicken-bowl",
    name: "CRISPY CHICKEN BOWL",
    price: 22.50,
    category: "fit",
  },
  {
    id: "pasta-power-bowl",
    name: "PASTA POWER BOWL",
    price: 22.50,
    category: "fit",
  },
];

// Productos TACO para referencia
const tacoProducts = [
  {
    id: "taco-duo",
    name: "Dúo de Tacos",
    price: 24.90,
    category: "taco",
  },
];

const allProducts = [...fatProducts, ...fitProducts, ...tacoProducts];

// Forzar ejecución dinámica — desactiva cualquier caché de Next.js en este módulo
export const dynamic = "force-dynamic";

// GET - Obtener pedidos (soporta ?status=en-camino y ?today=true para reducir carga)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const todayOnly = searchParams.get("today") === "true";

    const orders = await storage.getOrders();

    let result = orders;

    if (statusFilter) {
      result = result.filter((o: any) => o.status === statusFilter);
    }

    if (todayOnly) {
      const nowPeru = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
      result = result.filter((o: any) => {
        const d = new Date(new Date(o.createdAt).toLocaleString("en-US", { timeZone: "America/Lima" }));
        return d.getDate() === nowPeru.getDate() &&
               d.getMonth() === nowPeru.getMonth() &&
               d.getFullYear() === nowPeru.getFullYear();
      });
    }

    return NextResponse.json(result);
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
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const cart = JSON.parse(formData.get('cart') as string || 'null');
    const completedOrders = JSON.parse(formData.get('completedOrders') as string || '[]');
    const totalItems = parseInt(formData.get('totalItems') as string);
    const totalPrice = parseFloat(formData.get('totalPrice') as string);
    const comboDiscount = parseFloat(formData.get('comboDiscount') as string) || 0;
    const couponDiscount = parseFloat(formData.get('couponDiscount') as string) || 0;
    const couponCode = formData.get('couponCode') as string || '';
    const deliveryOption = formData.get('deliveryOption') as string || '';
    const deliveryCost = parseFloat(formData.get('deliveryCost') as string) || 0;
    const deliveryCustomLocation = formData.get('deliveryCustomLocation') as string || '';
    const paymentMethod = formData.get('paymentMethod') as string;
    const cantoCancelo = formData.get('cantoCancelo') as string | null;
    const scheduledDate = formData.get('scheduledDate') as string | null;
    const scheduledTime = formData.get('scheduledTime') as string | null;
    const timestamp = formData.get('timestamp') as string;
    const paymentProof = formData.get('paymentProof') as File | null;

    let paymentProofPath = null;

    // Guardar comprobante de pago en Cloudinary si existe
    if (paymentProof) {
      try {
        const bytes = await paymentProof.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Convertir buffer a base64 para Cloudinary
        const base64 = buffer.toString('base64');
        const dataURI = `data:${paymentProof.type};base64,${base64}`;

        // Subir a Cloudinary
        const uploadResult = await cloudinary.uploader.upload(dataURI, {
          folder: 'santo-dilema/vouchers',
          public_id: `voucher-${Date.now()}`,
          resource_type: 'auto',
        });

        paymentProofPath = uploadResult.secure_url;
        console.log("☁️ Comprobante subido a Cloudinary:", paymentProofPath);
      } catch (error) {
        console.error("❌ Error al subir comprobante a Cloudinary:", error);
      }
    }

    // Determinar estado del pedido
    const isScheduled = !!(scheduledDate && scheduledTime);
    const status = isScheduled ? 'programado' : (paymentMethod === 'anticipado' ? 'pendiente-verificacion' : 'pending');

    // Generar ID con formato #DDMM-NN (en hora Peru)
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
    const day   = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year  = today.getFullYear().toString();

    // Leer pedidos UNA SOLA VEZ — este array se reutiliza en saveOrder
    // para evitar una segunda lectura a Redis (que podría devolver dato desactualizado)
    const existingOrders = await storage.getOrders();

    // Correlativo atómico usando redis.incr — garantiza unicidad aunque lleguen
    // múltiples requests simultáneas o la función tenga un cold start
    const correlativeNum = await storage.getNextDailyCorrelative(day, month, year);
    const correlative    = correlativeNum.toString().padStart(2, '0');

    // Formato: #DDMM-NN  (ej: #0406-01 = pedido 1 del 4 de junio)
    const orderId = `#${day}${month}-${correlative}`;

    // Expandir completedOrders con datos completos de productos
    const expandedOrders = completedOrders.map((order: any) => {
      const product = allProducts.find(p => p.id === order.productId);
      // Respetar finalPrice si viene del frontend (ej: promo teriyaki S/15)
      const effectivePrice = order.finalPrice ?? product?.price ?? 0;
      return {
        ...order,
        name: order.name || product?.name || 'Producto desconocido',
        price: effectivePrice,
        finalPrice: effectivePrice,
        originalPrice: order.originalPrice ?? product?.price ?? 0,
        category: product?.category || 'unknown',
        productId: order.productId
      };
    });

    // Crear nuevo pedido con ID único
    const peruNow = getPeruTimestamp();
    const newOrder = {
      id: orderId,
      name,
      phone,
      address,
      cart,
      completedOrders: expandedOrders,
      totalItems,
      totalPrice,
      comboDiscount: comboDiscount > 0 ? comboDiscount : undefined,
      couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
      deliveryOption: deliveryOption || undefined,
      deliveryCost: deliveryCost > 0 ? deliveryCost : undefined,
      deliveryCustomLocation: deliveryCustomLocation || undefined,
      couponCode: couponCode || undefined,
      paymentMethod,
      cantoCancelo: cantoCancelo || undefined,
      paymentProofPath,
      scheduledDate: scheduledDate || undefined,
      scheduledTime: scheduledTime || undefined,
      timestamp: peruNow,
      status,
      createdAt: peruNow,
    };

    console.log("✅ Pedido creado con ID:", newOrder.id, "| Método:", paymentMethod);

    // Guardar pasando el array ya leído — evita segunda lectura a Redis
    // y garantiza que el pedido se añade AL HISTORIAL COMPLETO
    await storage.saveOrder(newOrder, existingOrders);
    console.log("💾 Pedido guardado. ID:", newOrder.id, "| Total órdenes:", existingOrders.length + 1);

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

// DELETE - Eliminar un pedido
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    const deleted = await storage.deleteOrder(id);
    if (!deleted) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    return NextResponse.json({ error: 'Error al eliminar el pedido' }, { status: 500 });
  }
}

// PATCH - Actualizar estado de un pedido (o marcar como canje)
export async function PATCH(request: Request) {
  try {
    const { id, status, isCanje, canjeNote } = await request.json();

    const now = getPeruTimestamp();
    const updates: Record<string, any> = { updatedAt: now };

    if (status !== undefined) {
      updates.status = status;
      if (status === 'confirmed') updates.confirmedAt = now;
      else if (status === 'en-camino') updates.enCaminoAt = now;
      else if (status === 'delivered') updates.deliveredAt = now;
    }

    if (isCanje !== undefined) {
      updates.isCanje = isCanje;
      updates.canjeNote = canjeNote ?? "";
    }

    const updatedOrder = await storage.updateOrder(id, updates);

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Si el pedido se marca como entregado, descontar automáticamente del stock
    if (status === "delivered") {
      try {
        console.log("📦 Pedido marcado como Entregado. Iniciando descuento automático de stock...");

        const cart = updatedOrder.cart;
        if (!Array.isArray(cart) || cart.length === 0) {
          console.log("⚠️ El pedido no tiene cart válido, omitiendo descuento de stock");
        } else {
          // Obtener todos los productos para acceder a sus componentes
          const products = await storage.getProducts();

          // Calcular los componentes totales necesarios
          const deductionItems: Array<{ productName: string; quantity: number; unit: string }> = [];

          cart.forEach((cartItem: any) => {
            const product = products.find((p: any) => p.name === cartItem.name);

            if (product && product.components && product.components.length > 0) {
              console.log(`✅ Producto "${product.name}" tiene ${product.components.length} componentes`);

              product.components.forEach((component: any) => {
                const totalQuantity = cartItem.quantity * component.quantity;
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

          if (deductionItems.length > 0) {
            const deductionTime = getPeruTimestamp();
            const deduction = {
              id: Date.now().toString(),
              orderId: updatedOrder.id,
              orderName: `Pedido #${updatedOrder.id} - ${updatedOrder.name}`,
              items: deductionItems,
              deductionDate: deductionTime,
              createdAt: deductionTime,
            };
            await storage.saveDeduction(deduction);
            console.log(`✅ Deducción guardada: ${deductionItems.length} items descontados del stock`);
          } else {
            console.log("⚠️ No hay componentes para descontar del stock");
          }
        }
      } catch (stockError) {
        // El descuento de stock falla silenciosamente — el pedido YA está marcado como entregado
        console.error("⚠️ Error al descontar stock (no afecta el estado del pedido):", stockError);
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
