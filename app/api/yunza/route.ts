import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// Configuración de premios de la Yunza (12 regalos)
const PRIZES = [
  { id: 1, type: 'discount', value: 20, label: '20% OFF' },
  { id: 2, type: 'discount', value: 30, label: '30% OFF' },
  { id: 3, type: 'delivery', value: 0, label: 'Delivery Gratis 🏍️' },
  { id: 4, type: 'discount', value: 40, label: '40% OFF' },
  { id: 5, type: '2x1', value: 0, label: '2x1 en toda la carta' },
  { id: 6, type: 'discount', value: 20, label: '20% OFF' },
  { id: 7, type: 'delivery', value: 0, label: 'Delivery Gratis 🏍️' },
  { id: 8, type: 'discount', value: 30, label: '30% OFF' },
  { id: 9, type: 'delivery', value: 0, label: 'Delivery Gratis 🏍️' },
  { id: 10, type: 'discount', value: 20, label: '20% OFF' },
  { id: 11, type: 'discount', value: 40, label: '40% OFF' },
  { id: 12, type: 'delivery', value: 0, label: 'Delivery Gratis 🏍️' },
];

// Límites diarios de premios
const DAILY_LIMITS = {
  '2x1': { max: 1, timeRange: { start: 20, end: 21 } }, // 8-9pm (solo 1 vez)
  'discount-40': { max: 2, timeRange: null }, // 6-11pm (2 veces)
  'discount-30': { max: 3, timeRange: null }, // 6-11pm (3 veces)
  'discount-20': { max: 6, timeRange: null }, // 6-11pm (6 veces)
  // delivery: ilimitado
};

// Función para contar premios otorgados hoy por tipo
async function getTodayPrizeCounts() {
  const participations = await storage.getYunzaParticipations();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const todayParticipations = participations.filter(p => {
    const pDate = new Date(p.participationDate).toISOString().split('T')[0];
    return pDate === today;
  });

  const counts = {
    '2x1': 0,
    'discount-40': 0,
    'discount-30': 0,
    'discount-20': 0,
  };

  todayParticipations.forEach(p => {
    if (p.prizeType === '2x1') {
      counts['2x1']++;
    } else if (p.prizeType === 'discount') {
      if (p.prizeValue === 40) counts['discount-40']++;
      else if (p.prizeValue === 30) counts['discount-30']++;
      else if (p.prizeValue === 20) counts['discount-20']++;
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

    // Descuento 30%: máximo 3 por día
    if (prize.type === 'discount' && prize.value === 30) {
      return counts['discount-30'] < DAILY_LIMITS['discount-30'].max;
    }

    // Descuento 20%: máximo 6 por día
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
    return PRIZES.find(p => p.type === 'delivery') || PRIZES[2];
  }

  // Seleccionar aleatoriamente entre los premios disponibles
  const randomIndex = Math.floor(Math.random() * availablePrizes.length);
  return availablePrizes[randomIndex];
}

function generateCouponCode(prizeType: string, value: number): string {
  const prefix = prizeType === 'discount' ? `YUNZA${value}` :
                 prizeType === 'delivery' ? 'YUNZADELI' :
                 'YUNZA2X1';
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

// GET - Verificar si un teléfono ya participó
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json({ error: "Teléfono requerido" }, { status: 400 });
    }

    // MODO PRUEBAS: Permitir múltiples participaciones
    // TODO: Descomentar en producción
    /*
    const participations = await storage.getYunzaParticipations();
    const existingParticipation = participations.find(p => p.phone === phone);

    if (existingParticipation) {
      return NextResponse.json({
        canParticipate: false,
        message: "Este número ya participó en la promoción",
        existingParticipation: {
          phone: existingParticipation.phone,
          prize: existingParticipation.prize,
          couponCode: existingParticipation.couponCode.slice(-2),
          participationDate: existingParticipation.participationDate
        }
      });
    }
    */

    return NextResponse.json({ canParticipate: true });
  } catch (error) {
    console.error("Error al verificar teléfono:", error);
    return NextResponse.json({ error: "Error al verificar teléfono" }, { status: 500 });
  }
}

// POST - Registrar una nueva participación
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, giftId } = body;

    if (!phone) {
      return NextResponse.json({ error: "Teléfono requerido" }, { status: 400 });
    }

    if (!giftId) {
      return NextResponse.json({ error: "Regalo no seleccionado" }, { status: 400 });
    }

    // MODO PRUEBAS: Permitir múltiples participaciones
    // TODO: Descomentar en producción
    /*
    const participations = await storage.getYunzaParticipations();
    const existingParticipation = participations.find(p => p.phone === phone);

    if (existingParticipation) {
      return NextResponse.json({
        error: "Este número ya participó en la promoción",
        canParticipate: false
      }, { status: 400 });
    }
    */

    // Seleccionar premio aleatorio
    const prize = await selectRandomPrize();
    const couponCode = generateCouponCode(prize.type, prize.value);

    // Guardar la participación
    const newParticipation = {
      id: Date.now().toString(),
      phone,
      giftId,
      prize: prize.label,
      prizeType: prize.type,
      prizeValue: prize.value,
      couponCode,
      participationDate: new Date().toISOString(),
      status: 'enviado',
    };

    await storage.saveYunzaParticipation(newParticipation);

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
      couponPreview: couponCode.slice(-2),
      message: `¡El código completo se envió a tu WhatsApp: ${phone}!`
    });

  } catch (error) {
    console.error("Error al procesar participación:", error);
    return NextResponse.json({ error: "Error al procesar participación" }, { status: 500 });
  }
}
