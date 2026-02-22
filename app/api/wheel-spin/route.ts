import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// Configuración de premios de la ruleta
const PRIZES = [
  { id: 'discount-20', type: 'discount', value: 20, label: '20% OFF', probability: 0.25 },
  { id: 'discount-30', type: 'discount', value: 30, label: '30% OFF', probability: 0.20 },
  { id: 'discount-40', type: 'discount', value: 40, label: '40% OFF', probability: 0.15 },
  { id: '2x1-all', type: '2x1', value: 0, label: '2x1 en toda la carta', probability: 0.15 },
  { id: 'delivery-free', type: 'delivery', value: 0, label: 'Delivery Gratis', probability: 0.25 },
];

function selectRandomPrize() {
  const random = Math.random();
  let cumulative = 0;

  for (const prize of PRIZES) {
    cumulative += prize.probability;
    if (random <= cumulative) {
      return prize;
    }
  }

  return PRIZES[0]; // Fallback
}

function generateCouponCode(prizeType: string, value: number): string {
  const prefix = prizeType === 'discount' ? `SANTO${value}` :
                 prizeType === 'delivery' ? 'DELIVERY' :
                 'SANTO2X1';
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

// GET - Verificar si un teléfono ya giró
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json({ error: "Teléfono requerido" }, { status: 400 });
    }

    const spins = await storage.getWheelSpins();
    const existingSpin = spins.find(s => s.phone === phone);

    if (existingSpin) {
      return NextResponse.json({
        canSpin: false,
        message: "Este número ya giró la ruleta",
        existingSpin: {
          phone: existingSpin.phone,
          prize: existingSpin.prize,
          couponCode: existingSpin.couponCode.slice(-2), // Solo últimos 2 dígitos
          spinDate: existingSpin.spinDate
        }
      });
    }

    return NextResponse.json({ canSpin: true });
  } catch (error) {
    console.error("Error al verificar teléfono:", error);
    return NextResponse.json({ error: "Error al verificar teléfono" }, { status: 500 });
  }
}

// POST - Registrar un nuevo giro
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: "Teléfono requerido" }, { status: 400 });
    }

    // Verificar que no haya girado antes
    const spins = await storage.getWheelSpins();
    const existingSpin = spins.find(s => s.phone === phone);

    if (existingSpin) {
      return NextResponse.json({
        error: "Este número ya giró la ruleta",
        canSpin: false
      }, { status: 400 });
    }

    // Seleccionar premio aleatorio
    const prize = selectRandomPrize();
    const couponCode = generateCouponCode(prize.type, prize.value);

    // Guardar el giro
    const newSpin = {
      id: Date.now().toString(),
      phone,
      prize: prize.label,
      prizeType: prize.type,
      prizeValue: prize.value,
      couponCode,
      spinDate: new Date().toISOString(),
      used: false,
    };

    await storage.saveWheelSpin(newSpin);

    // También crear el cupón en el sistema de cupones
    const coupon = {
      id: Date.now().toString() + '-coupon',
      code: couponCode,
      phone,
      customerName: '',
      discount: prize.type === 'discount' ? prize.value : 0,
      deliveryFree: prize.type === 'delivery',
      is2x1: prize.type === '2x1',
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
    };

    await storage.saveCoupon(coupon);

    // Devolver resultado (solo últimos 2 dígitos del cupón)
    return NextResponse.json({
      success: true,
      prize: {
        label: prize.label,
        type: prize.type,
        value: prize.value,
      },
      couponPreview: couponCode.slice(-2), // Solo últimos 2 dígitos
      message: `¡El código completo se envió a tu WhatsApp: ${phone}!`
    });

  } catch (error) {
    console.error("Error al procesar giro:", error);
    return NextResponse.json({ error: "Error al procesar giro" }, { status: 500 });
  }
}
