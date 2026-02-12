import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

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
  dni: string;
  customerName: string;
  discount: number;
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
    const dni = searchParams.get("dni");

    // Verificar elegibilidad para un DNI
    if (action === "check-eligibility" && dni) {
      const coupons = await storage.getCoupons();
      const totalCoupons = coupons.length;
      const userCoupon = coupons.find((c: Coupon) => c.dni === dni);
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
      const { code, dni } = body;

      if (!code || !dni) {
        return NextResponse.json(
          { error: "Código y DNI requeridos" },
          { status: 400 }
        );
      }

      const coupons = await storage.getCoupons();
      const coupon = coupons.find((c: Coupon) => c.code === code);

      if (!coupon) {
        return NextResponse.json(
          { error: "Cupón no existe" },
          { status: 404 }
        );
      }

      if (coupon.dni !== dni) {
        return NextResponse.json(
          { error: "Este cupón no pertenece a tu DNI" },
          { status: 403 }
        );
      }

      if (coupon.status === "used") {
        return NextResponse.json(
          { error: "Cupón ya utilizado" },
          { status: 400 }
        );
      }

      const expiresAt = new Date(coupon.expiresAt);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: "Cupón expirado" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        valid: true,
        discount: coupon.discount,
        code: coupon.code,
      });
    }

    // Generar cupón
    if (action === "generate") {
      const { dni, customerName, orderId, salsas } = body;

      if (!dni || !customerName || !orderId || !salsas) {
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

      // Verificar un cupón por DNI
      if (coupons.some((c: Coupon) => c.dni === dni)) {
        return NextResponse.json(
          { error: "Ya existe un cupón para este DNI" },
          { status: 400 }
        );
      }

      // Crear cupón
      const coupon: Coupon = {
        id: `coupon-${Date.now()}`,
        code: generateCouponCode(),
        dni,
        customerName,
        discount: 13,
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt: new Date("2026-02-28T23:59:59").toISOString(),
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

    // Marcar cupón como usado
    if (action === "mark-used") {
      const { code, dni } = body;

      if (!code || !dni) {
        return NextResponse.json(
          { error: "Código y DNI requeridos" },
          { status: 400 }
        );
      }

      const coupons = await storage.getCoupons();
      const couponIndex = coupons.findIndex((c: Coupon) => c.code === code && c.dni === dni);

      if (couponIndex === -1) {
        return NextResponse.json(
          { error: "Cupón no encontrado" },
          { status: 404 }
        );
      }

      coupons[couponIndex].status = "used";
      coupons[couponIndex].usedAt = new Date().toISOString();

      await storage.updateCoupons(coupons);

      return NextResponse.json({ success: true });
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
