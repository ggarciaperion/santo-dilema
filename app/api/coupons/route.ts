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
  // "INTERNO" = reutilizable por todos | "MULTI" = un uso por teléfono, múltiples teléfonos
  phone: string;
  customerName: string;
  discount: number;       // porcentaje (0 si es monto fijo)
  fixedAmount?: number;   // descuento en soles (S/), 0 si es porcentaje
  usedBy?: string[];      // solo para cupones MULTI: teléfonos que ya lo usaron
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
      // Buscar por código + teléfono (soporta INTERNO, MULTI y cupones personales)
      const coupon = coupons.find((c: Coupon) =>
        c.code === code && (c.phone === phone || c.phone === "INTERNO" || c.phone === "MULTI")
      );

      if (!coupon) {
        // Distinguir entre "código no existe" y "código de otro teléfono"
        const codeExists = coupons.some((c: Coupon) => c.code === code);
        return NextResponse.json(
          { error: codeExists ? "Este cupón no pertenece a tu teléfono" : "Cupón no existe" },
          { status: codeExists ? 403 : 404 }
        );
      }

      // Para cupones MULTI: verificar que este teléfono no lo haya usado ya
      if (coupon.phone === "MULTI") {
        if (coupon.usedBy?.includes(phone)) {
          return NextResponse.json(
            { error: "Ya usaste este cupón con este número" },
            { status: 400 }
          );
        }
      } else if (coupon.status === "used") {
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
        fixedAmount: coupon.fixedAmount || 0,
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
      // Buscar cupón por código
      const couponIndex = coupons.findIndex((c: Coupon) =>
        c.code === code && (c.phone === phone || c.phone === "INTERNO" || c.phone === "MULTI")
      );

      if (couponIndex === -1) {
        return NextResponse.json(
          { error: "Cupón no encontrado" },
          { status: 404 }
        );
      }

      const couponPhone = coupons[couponIndex].phone;

      if (couponPhone === "INTERNO") {
        // Cupones internos: nunca se marcan como usados (reutilizables)
      } else if (couponPhone === "MULTI") {
        // Cupones MULTI: registrar el teléfono en usedBy
        if (!coupons[couponIndex].usedBy) coupons[couponIndex].usedBy = [];
        if (!coupons[couponIndex].usedBy!.includes(phone)) {
          coupons[couponIndex].usedBy!.push(phone);
          coupons[couponIndex].usedAt = new Date().toISOString();
          await storage.updateCoupons(coupons);
        }
      } else {
        // Cupones personales: marcar como usados
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

    // Crear cupón de campaña para un teléfono específico
    if (action === "create-campaign-single") {
      const { code, discount, expiresAt, phone, customerName } = body;
      if (!code || !discount || !expiresAt || !phone) {
        return NextResponse.json({ error: "code, discount, expiresAt y phone requeridos" }, { status: 400 });
      }

      const existingCoupons = await storage.getCoupons();
      const alreadyHas = existingCoupons.find((c: Coupon) => c.code === code && c.phone === phone);
      if (alreadyHas) {
        return NextResponse.json({ error: "Este cliente ya tiene un cupón con ese código", alreadyHas: true }, { status: 409 });
      }

      await storage.saveCoupon({
        id: `campaign-${code}-${phone}-${Date.now()}`,
        code,
        phone,
        customerName: customerName || 'Cliente',
        discount,
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt,
        orderId: 'CAMPAIGN',
      });

      return NextResponse.json({ success: true, code, phone });
    }

    // Crear cupón MULTI (un código, 1 uso por teléfono, múltiples teléfonos)
    if (action === "create-multi") {
      const { code, fixedAmount, discount, expiresAt, customerName } = body;

      if (!code || !expiresAt) {
        return NextResponse.json({ error: "code y expiresAt requeridos" }, { status: 400 });
      }

      const existingCoupons = await storage.getCoupons();
      const alreadyExists = existingCoupons.find((c: Coupon) => c.code === code && c.phone === "MULTI");
      if (alreadyExists) {
        return NextResponse.json({ error: "Ya existe un cupón MULTI con ese código", alreadyHas: true }, { status: 409 });
      }

      const newCoupon: Coupon = {
        id: `multi-${code}-${Date.now()}`,
        code,
        phone: "MULTI",
        customerName: customerName || "Cupón Campaña",
        discount: discount || 0,
        fixedAmount: fixedAmount || 0,
        usedBy: [],
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt,
        orderId: "CAMPAIGN",
      };

      await storage.saveCoupon(newCoupon);
      return NextResponse.json({ success: true, code: newCoupon.code, fixedAmount: newCoupon.fixedAmount });
    }

    // Eliminar todos los cupones de una campaña por código
    if (action === "delete-by-code") {
      const { code } = body;
      if (!code) {
        return NextResponse.json({ error: "code requerido" }, { status: 400 });
      }
      const existingCoupons = await storage.getCoupons();
      const filtered = existingCoupons.filter((c: Coupon) => c.code !== code);
      const deleted = existingCoupons.length - filtered.length;
      await storage.updateCoupons(filtered);
      return NextResponse.json({ success: true, deleted });
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
