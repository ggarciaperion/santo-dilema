import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// Fecha de corte para cupones de la campaña de febrero (ya expirados)
// Los cupones creados DESPUÉS de esta fecha usan solo su propio expiresAt
const COUPON_GLOBAL_EXPIRY = new Date("2026-03-01T00:00:00-05:00"); // Hora Perú (UTC-5)

// IDs de salsas promocionales (Promoción 13%)
const PROMO_SAUCE_IDS = [
  "barbecue",        // BBQ Ahumada
  "buffalo-picante", // Santo Picante
  "ahumada",         // Acevichada Imperial
  "parmesano-ajo"    // Crispy Celestial
];

interface Coupon {
  id: string;
  code: string;
  phone: string;
  customerName: string;
  discount: number;
  deliveryFree?: boolean;
  is2x1?: boolean;
  status: "pending" | "used";
  createdAt: string;
  usedAt?: string;
  expiresAt: string;
  orderId?: string;
}

// Helper para generar código de cupón
function generateCouponCode(): string {
  const prefix = "SANTO13";
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

// Helper para verificar si una orden califica
export function orderQualifiesForCoupon(salsas: string[]): boolean {
  if (!salsas || salsas.length === 0) return false;
  return salsas.every(salsaId => PROMO_SAUCE_IDS.includes(salsaId));
}

// GET - Obtener todos los cupones o verificar elegibilidad
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const phone = searchParams.get("phone");

    // Verificar elegibilidad para un teléfono
    if (action === "check-eligibility" && phone) {
      const coupons = await storage.getCoupons();
      const totalCoupons = coupons.length;
      const userCoupon = coupons.find((c: Coupon) => c.phone === phone);
      const hasPromo = !!userCoupon;

      return NextResponse.json({
        eligible: totalCoupons < 13 && !hasPromo,
        hasPromo,
        couponStatus: userCoupon?.status || null, // "pending" | "used" | null
        remainingSlots: Math.max(0, 13 - totalCoupons),
      });
    }

    // Listar todos los cupones (para admin)
    const coupons = await storage.getCoupons();
    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Error al obtener cupones:", error);
    return NextResponse.json({ error: "Error al obtener cupones" }, { status: 500 });
  }
}

// POST - Crear o validar cupón
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Validar cupón para usar
    if (action === "validate") {
      const { code, phone } = body;

      if (!code || !phone) {
        return NextResponse.json(
          { error: "Código y teléfono requeridos" },
          { status: 400 }
        );
      }

      const coupons = await storage.getCoupons();
      // Buscar por código + teléfono (soporta campaña multi-teléfono con código compartido)
      const coupon = coupons.find((c: Coupon) =>
        c.code === code && (c.phone === phone || c.phone === "INTERNO")
      );

      if (!coupon) {
        // Distinguir entre "código no existe" y "código de otro teléfono"
        const codeExists = coupons.some((c: Coupon) => c.code === code);
        return NextResponse.json(
          { error: codeExists ? "Este cupón no pertenece a tu teléfono" : "Cupón no existe" },
          { status: codeExists ? 403 : 404 }
        );
      }

      if (coupon.status === "used") {
        return NextResponse.json(
          { error: "Cupón ya utilizado" },
          { status: 400 }
        );
      }

      // Aplicar fecha de corte global solo a cupones viejos (creados antes del 1 de marzo)
      const couponCreatedAt = new Date(coupon.createdAt);
      if (couponCreatedAt < COUPON_GLOBAL_EXPIRY && new Date() > COUPON_GLOBAL_EXPIRY) {
        return NextResponse.json(
          { error: "Los cupones promocionales vencieron el 1 de marzo" },
          { status: 400 }
        );
      }

      // Verificar expiresAt individual
      if (new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json(
          { error: "Cupón expirado" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        valid: true,
        discount: coupon.discount,
        deliveryFree: coupon.deliveryFree || false,
        is2x1: coupon.is2x1 || false,
        code: coupon.code,
      });
    }

    // Generar cupón
    if (action === "generate") {
      const { phone, customerName, orderId, salsas } = body;

      if (!phone || !customerName || !orderId || !salsas) {
        return NextResponse.json(
          { error: "Datos incompletos" },
          { status: 400 }
        );
      }

      // Verificar que las salsas califiquen
      if (!orderQualifiesForCoupon(salsas)) {
        return NextResponse.json(
          { error: "La orden no califica para cupón" },
          { status: 400 }
        );
      }

      const coupons = await storage.getCoupons();

      // Verificar límite de 13 cupones
      if (coupons.length >= 13) {
        return NextResponse.json(
          { error: "Se alcanzó el límite de cupones promocionales" },
          { status: 400 }
        );
      }

      // Verificar un cupón por teléfono
      if (coupons.some((c: Coupon) => c.phone === phone)) {
        return NextResponse.json(
          { error: "Ya existe un cupón para este teléfono" },
          { status: 400 }
        );
      }

      // Crear cupón
      const coupon: Coupon = {
        id: `coupon-${Date.now()}`,
        code: generateCouponCode(),
        phone,
        customerName,
        discount: 13,
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt: new Date("2026-03-01T23:59:59").toISOString(),
        orderId,
      };

      await storage.saveCoupon(coupon);

      return NextResponse.json({
        success: true,
        coupon: {
          code: coupon.code,
          discount: coupon.discount,
          expiresAt: coupon.expiresAt,
        },
      });
    }

    // Crear cupón manual (para uso interno)
    if (action === "create-manual") {
      const { phone, customerName, discount, deliveryFree, is2x1, expiresAt } = body;

      if (!phone) {
        return NextResponse.json(
          { error: "Teléfono requerido" },
          { status: 400 }
        );
      }

      // Generar código personalizado
      const prefix = deliveryFree ? 'DELIVERY' : is2x1 ? 'SANTO2X1' : `SANTO${discount || 0}`;
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `${prefix}-${random}`;

      // Crear cupón manual
      const coupon: Coupon = {
        id: `manual-${Date.now()}`,
        code,
        phone,
        customerName: customerName || 'Cupón Interno',
        discount: discount || 0,
        deliveryFree: deliveryFree || false,
        is2x1: is2x1 || false,
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        orderId: 'MANUAL',
      };

      await storage.saveCoupon(coupon);

      return NextResponse.json({
        success: true,
        coupon: {
          code: coupon.code,
          phone: coupon.phone,
          discount: coupon.discount,
          deliveryFree: coupon.deliveryFree,
          is2x1: coupon.is2x1,
          expiresAt: coupon.expiresAt,
        },
      });
    }

    // Marcar cupón como usado
    if (action === "mark-used") {
      const { code, phone } = body;

      if (!code || !phone) {
        return NextResponse.json(
          { error: "Código y teléfono requeridos" },
          { status: 400 }
        );
      }

      const coupons = await storage.getCoupons();
      // Buscar cupón por código, y verificar que sea del teléfono correcto o sea cupón interno
      const couponIndex = coupons.findIndex((c: Coupon) =>
        c.code === code && (c.phone === phone || c.phone === "INTERNO")
      );

      if (couponIndex === -1) {
        return NextResponse.json(
          { error: "Cupón no encontrado" },
          { status: 404 }
        );
      }

      // Los cupones internos no se marcan como usados (son reutilizables)
      if (coupons[couponIndex].phone !== "INTERNO") {
        coupons[couponIndex].status = "used";
        coupons[couponIndex].usedAt = new Date().toISOString();
        await storage.updateCoupons(coupons);
      }

      return NextResponse.json({ success: true });
    }

    // Resetear cupón interno (volver a estado pending)
    if (action === "reset-internal") {
      const { code } = body;

      if (!code) {
        return NextResponse.json(
          { error: "Código requerido" },
          { status: 400 }
        );
      }

      const coupons = await storage.getCoupons();
      const couponIndex = coupons.findIndex((c: Coupon) => c.code === code && c.phone === "INTERNO");

      if (couponIndex === -1) {
        return NextResponse.json(
          { error: "Cupón interno no encontrado" },
          { status: 404 }
        );
      }

      // Resetear estado a pending
      coupons[couponIndex].status = "pending";
      delete coupons[couponIndex].usedAt;

      await storage.updateCoupons(coupons);

      return NextResponse.json({
        success: true,
        message: "Cupón interno reseteado",
        coupon: {
          code: coupons[couponIndex].code,
          status: coupons[couponIndex].status
        }
      });
    }

    // Crear campaña con código compartido para todos los teléfonos registrados
    if (action === "create-birthday-campaign") {
      const { code, discount, expiresAt } = body;
      if (!code || !discount || !expiresAt) {
        return NextResponse.json({ error: "code, discount y expiresAt requeridos" }, { status: 400 });
      }

      // Obtener todos los teléfonos únicos de pedidos entregados
      const orders = await storage.getOrders();
      const uniquePhones = [...new Set(
        orders
          .filter((o: any) =>
            o.status === "delivered" || o.status === "Entregado" || o.status?.toLowerCase() === "entregado"
          )
          .map((o: any) => o.phone)
          .filter(Boolean)
      )] as string[];

      // Verificar cuáles ya tienen cupón con este código
      const existingCoupons = await storage.getCoupons();
      const alreadyHas = new Set(
        existingCoupons.filter((c: Coupon) => c.code === code).map((c: Coupon) => c.phone)
      );

      const toCreate = uniquePhones.filter(p => !alreadyHas.has(p));
      const nameMap: Record<string, string> = {};
      orders.forEach((o: any) => { if (o.phone && o.name) nameMap[o.phone] = o.name; });

      for (const phone of toCreate) {
        await storage.saveCoupon({
          id: `campaign-${code}-${phone}-${Date.now()}`,
          code,
          phone,
          customerName: nameMap[phone] || 'Cliente',
          discount,
          status: "pending",
          createdAt: new Date().toISOString(),
          expiresAt,
          orderId: 'CAMPAIGN',
        });
      }

      return NextResponse.json({
        success: true,
        code,
        created: toCreate.length,
        skipped: alreadyHas.size,
        total: uniquePhones.length,
      });
    }

    return NextResponse.json(
      { error: "Acción no válida" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error en operación de cupón:", error);
    return NextResponse.json(
      { error: "Error al procesar cupón" },
      { status: 500 }
    );
  }
}
