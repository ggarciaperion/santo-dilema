import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { v2 as cloudinary } from 'cloudinary';
import { orderQualifiesForCoupon } from "../coupons/route";

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Productos FAT para referencia
const fatProducts = [
  {
    id: "pequeno-dilema",
    name: "Pequeño Dilema",
    price: 18.50,
    category: "fat",
  },
  {
    id: "duo-dilema",
    name: "Dúo Dilema",
    price: 33.50,
    category: "fat",
  },
  {
    id: "santo-pecado",
    name: "Santo Pecado",
    price: 45.00,
    category: "fat",
  },
];

// Productos FIT para referencia
const fitProducts = [
  {
    id: "ensalada-clasica",
    name: "CLÁSICA FRESH BOWL",
    price: 18.90,
    category: "fit",
  },
  {
    id: "ensalada-proteica",
    name: "CÉSAR POWER BOWL",
    price: 24.90,
    category: "fit",
  },
  {
    id: "ensalada-caesar",
    name: "PROTEIN FIT BOWL",
    price: 22.90,
    category: "fit",
  },
  {
    id: "ensalada-mediterranea",
    name: "TUNA FRESH BOWL",
    price: 21.90,
    category: "fit",
  },
];

const allProducts = [...fatProducts, ...fitProducts];

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
    const cantoCancelo = formData.get('cantoCancelo') as string | null;
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

    // Expandir completedOrders con datos completos de productos
    const expandedOrders = completedOrders.map((order: any) => {
      const product = allProducts.find(p => p.id === order.productId);
      return {
        ...order,
        name: product?.name || 'Producto desconocido',
        price: product?.price || 0,
        category: product?.category || 'unknown',
        productId: order.productId
      };
    });

    // Crear nuevo pedido con ID único
    const newOrder = {
      id: orderId,
      name,
      dni,
      phone,
      address,
      email,
      cart,
      completedOrders: expandedOrders,
      totalItems,
      totalPrice,
      paymentMethod,
      cantoCancelo: cantoCancelo || undefined,
      paymentProofPath,
      timestamp,
      status,
      createdAt: timestamp || new Date().toISOString(),
    };

    console.log("✅ Pedido creado con ID:", newOrder.id, "| Método:", paymentMethod);

    // Guardar usando la utilidad de storage
    await storage.saveOrder(newOrder);
    console.log("💾 Pedido guardado");

    // Generar cupón si califica (Promoción 13%)
    let generatedCoupon = null;

    // Verificar si alguna orden tiene salsas que califiquen
    const hasPromoSauces = completedOrders.some((order: any) => {
      if (!order.salsas || order.salsas.length === 0) return false;
      return orderQualifiesForCoupon(order.salsas);
    });

    console.log("🔍 Verificando elegibilidad para cupón:");
    console.log("  - hasPromoSauces:", hasPromoSauces);
    console.log("  - DNI:", dni);
    console.log("  - Salsas en orden:", completedOrders.map((o: any) => o.salsas));

    if (hasPromoSauces) {
      try {
        // Generar cupón directamente usando storage (sin fetch interno)
        const coupons = await storage.getCoupons();

        console.log("📊 Estado de cupones:");
        console.log("  - Total cupones existentes:", coupons.length);
        console.log("  - Cupones del DNI:", coupons.filter((c: any) => c.dni === dni).length);

        // Verificar límite de 13 cupones
        if (coupons.length >= 13) {
          console.log("⚠️ Límite de 13 cupones alcanzado");
        }
        // Verificar un cupón por DNI
        else if (coupons.some((c: any) => c.dni === dni)) {
          console.log("⚠️ DNI ya tiene un cupón:", dni);
        }
        // Generar cupón
        else {
          const couponCode = `SANTO13-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          const newCoupon = {
            id: `coupon-${Date.now()}`,
            code: couponCode,
            dni,
            customerName: name,
            discount: 13,
            status: "pending",
            createdAt: new Date().toISOString(),
            expiresAt: new Date("2026-02-28T23:59:59").toISOString(),
            orderId: newOrder.id,
          };

          await storage.saveCoupon(newCoupon);

          generatedCoupon = {
            code: newCoupon.code,
            discount: newCoupon.discount,
            expiresAt: newCoupon.expiresAt,
          };

          console.log("✅ Cupón generado exitosamente:", generatedCoupon.code);
        }
      } catch (error) {
        console.error("❌ Error al generar cupón:", error);
        // No fallar el pedido si falla la generación del cupón
      }
    }

    return NextResponse.json({ ...newOrder, coupon: generatedCoupon }, { status: 201 });
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

    const now = new Date().toISOString();
    const timestampField: Record<string, string> = {};
    if (status === 'confirmed') timestampField.confirmedAt = now;
    else if (status === 'en-camino') timestampField.enCaminoAt = now;
    else if (status === 'delivered') timestampField.deliveredAt = now;

    const updatedOrder = await storage.updateOrder(id, {
      status,
      updatedAt: now,
      ...timestampField,
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
