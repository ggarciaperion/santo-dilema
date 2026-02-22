import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// Configuración de premios de la ruleta (8 slices)
const PRIZES = [
  { id: 'delivery-free-1', type: 'delivery', value: 0, label: 'Delivery Gratis 🏍️', probability: 0.125 },
  { id: 'discount-20-1', type: 'discount', value: 20, label: '20% OFF', probability: 0.125 },
  { id: 'delivery-free-2', type: 'delivery', value: 0, label: 'Delivery Gratis 🏍️', probability: 0.125 },
  { id: 'discount-30', type: 'discount', value: 30, label: '30% OFF', probability: 0.125 },
  { id: 'delivery-free-3', type: 'delivery', value: 0, label: 'Delivery Gratis 🏍️', probability: 0.125 },
  { id: 'discount-20-2', type: 'discount', value: 20, label: '20% OFF', probability: 0.125 },
  { id: 'discount-40', type: 'discount', value: 40, label: '40% OFF', probability: 0.125 },
  { id: '2x1-all', type: '2x1', value: 0, label: '2x1 en toda la carta', probability: 0.125 },
];

// Límites diarios de premios
const DAILY_LIMITS = {
  '2x1': { max: 1, timeRange: { start: 20, end: 21 } }, // 8-9pm (solo 1 vez)
  'discount-40': { max: 2, timeRange: null }, // 6-11pm (2 veces)
  'discount-30': { max: 2, timeRange: null }, // 6-11pm (2 veces)
  'discount-20': { max: 5, timeRange: null }, // 6-11pm (5 veces)
  // delivery: ilimitado
};

// Función para contar premios otorgados hoy por tipo
async function getTodayPrizeCounts() {
  const spins = await storage.getWheelSpins();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const todaySpins = spins.filter(spin => {
    const spinDate = new Date(spin.spinDate).toISOString().split('T')[0];
    return spinDate === today;
  });

  const counts = {
    '2x1': 0,
    'discount-40': 0,
    'discount-30': 0,
    'discount-20': 0,
  };

  todaySpins.forEach(spin => {
    if (spin.prizeType === '2x1') {
      counts['2x1']++;
    } else if (spin.prizeType === 'discount') {
      if (spin.prizeValue === 40) counts['discount-40']++;
      else if (spin.prizeValue === 30) counts['discount-30']++;
      else if (spin.prizeValue === 20) counts['discount-20']++;
    }
  });

  return counts;
}

// Función para verificar si estamos en el rango de horario para 2x1
function isIn2x1TimeRange(): boolean {
  const now = new Date();
  // Convertir a hora de Perú (UTC-5)
  const peruTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  const hour = peruTime.getHours();

  return hour >= 20 && hour < 21; // 8pm - 9pm
}

async function selectRandomPrize() {
  const counts = await getTodayPrizeCounts();
  const is2x1Time = isIn2x1TimeRange();

  // Crear lista de premios disponibles según límites
  const availablePrizes = PRIZES.filter(prize => {
    // 2x1: solo en horario 8-9pm y si no se alcanzó el límite
    if (prize.type === '2x1') {
      return is2x1Time && counts['2x1'] < DAILY_LIMITS['2x1'].max;
    }

    // Descuento 40%: máximo 2 por día
    if (prize.type === 'discount' && prize.value === 40) {
      return counts['discount-40'] < DAILY_LIMITS['discount-40'].max;
    }

    // Descuento 30%: máximo 2 por día
    if (prize.type === 'discount' && prize.value === 30) {
      return counts['discount-30'] < DAILY_LIMITS['discount-30'].max;
    }

    // Descuento 20%: máximo 5 por día
    if (prize.type === 'discount' && prize.value === 20) {
      return counts['discount-20'] < DAILY_LIMITS['discount-20'].max;
    }

    // Delivery gratis: siempre disponible
    if (prize.type === 'delivery') {
      return true;
    }

    return false;
  });

  // Si no hay premios disponibles (todos los límites alcanzados), dar delivery gratis
  if (availablePrizes.length === 0) {
    return PRIZES.find(p => p.type === 'delivery') || PRIZES[0];
  }

  // Seleccionar aleatoriamente entre los premios disponibles
  const random = Math.random();
  const normalizedProbability = 1 / availablePrizes.length;
  let cumulative = 0;

  for (const prize of availablePrizes) {
    cumulative += normalizedProbability;
    if (random <= cumulative) {
      return prize;
    }
  }

  return availablePrizes[0]; // Fallback
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
    const prize = await selectRandomPrize();
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
