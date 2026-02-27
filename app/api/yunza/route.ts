import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// Configuración de premios de la Yunza (12 regalos)
const PRIZES = [
  { id: 1, type: 'discount', value: 30, label: '30% OFF' },
  { id: 2, type: 'discount', value: 20, label: '20% OFF' },
  { id: 3, type: 'discount', value: 10, label: '10% OFF' },
  { id: 4, type: 'discount', value: 20, label: '20% OFF' },
  { id: 5, type: 'discount', value: 10, label: '10% OFF' },
  { id: 6, type: 'discount', value: 20, label: '20% OFF' },
  { id: 7, type: 'discount', value: 10, label: '10% OFF' },
  { id: 8, type: 'discount', value: 10, label: '10% OFF' },
  { id: 9, type: 'discount', value: 10, label: '10% OFF' },
  { id: 10, type: 'discount', value: 10, label: '10% OFF' },
  { id: 11, type: 'discount', value: 10, label: '10% OFF' },
  { id: 12, type: 'discount', value: 10, label: '10% OFF' },
];

// Fechas de vigencia de la promoción (Hora Perú UTC-5)
const PROMO_START_DATE = new Date('2026-02-26T18:00:00-05:00'); // 26 feb 6pm
const PROMO_END_DATE = new Date('2026-03-01T23:00:00-05:00');   // 1 marzo 11pm

// Límites diarios de premios
const DAILY_LIMITS = {
  'discount-30': { max: 1 },  // Solo 1 vez por día
  'discount-20': { max: 3 },  // 3 veces por día
  // discount-10: ILIMITADO (sin límite)
  // 2x1, 50%, 40%, delivery: NUNCA (no están en la lista de premios)
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
    'discount-30': 0,
    'discount-20': 0,
  };

  todayParticipations.forEach(p => {
    if (p.prizeType === 'discount') {
      if (p.prizeValue === 30) counts['discount-30']++;
      else if (p.prizeValue === 20) counts['discount-20']++;
      // 10% no se cuenta porque es ilimitado
    }
  });

  return counts;
}

// Función para verificar si estamos en el horario y fecha válida de la promoción
function isPromoActive(): { active: boolean; message?: string } {
  const now = new Date();

  // Verificar fecha
  if (now < PROMO_START_DATE) {
    return {
      active: false,
      message: 'La promoción inicia el 26 de febrero a las 6:00 PM'
    };
  }

  if (now > PROMO_END_DATE) {
    return {
      active: false,
      message: 'La promoción finalizó el 1 de marzo a las 11:00 PM'
    };
  }

  // Verificar horario (6pm - 11pm hora Perú)
  const peruTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  const hour = peruTime.getHours();

  if (hour < 18 || hour >= 23) {
    return {
      active: false,
      message: 'La promoción está activa de 6:00 PM a 11:00 PM'
    };
  }

  return { active: true };
}

async function selectRandomPrize() {
  const counts = await getTodayPrizeCounts();

  // Crear lista de premios disponibles según límites
  const availablePrizes = PRIZES.filter(prize => {
    // Descuento 30%: máximo 1 por día
    if (prize.type === 'discount' && prize.value === 30) {
      return counts['discount-30'] < DAILY_LIMITS['discount-30'].max;
    }

    // Descuento 20%: máximo 3 por día
    if (prize.type === 'discount' && prize.value === 20) {
      return counts['discount-20'] < DAILY_LIMITS['discount-20'].max;
    }

    // Descuento 10%: SIEMPRE disponible (ilimitado)
    if (prize.type === 'discount' && prize.value === 10) {
      return true;
    }

    return false;
  });

  // Si no hay premios disponibles (todos los límites alcanzados), dar 10%
  if (availablePrizes.length === 0) {
    return PRIZES.find(p => p.type === 'discount' && p.value === 10) || PRIZES[2];
  }

  // Seleccionar aleatoriamente entre los premios disponibles
  const randomIndex = Math.floor(Math.random() * availablePrizes.length);
  return availablePrizes[randomIndex];
}

function generateCouponCode(prizeType: string, value: number): string {
  const prefix = `YUNZA${value}`;
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

    // Verificar si la promoción está activa
    const promoStatus = isPromoActive();
    if (!promoStatus.active) {
      return NextResponse.json({
        canParticipate: false,
        message: promoStatus.message
      });
    }

    // MODO PRODUCCIÓN: Una participación por teléfono
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

    // Verificar si la promoción está activa
    const promoStatus = isPromoActive();
    if (!promoStatus.active) {
      return NextResponse.json({
        error: promoStatus.message,
        canParticipate: false
      }, { status: 400 });
    }

    // MODO PRODUCCIÓN: Una participación por teléfono
    const participations = await storage.getYunzaParticipations();
    const existingParticipation = participations.find(p => p.phone === phone);

    if (existingParticipation) {
      return NextResponse.json({
        error: "Este número ya participó en la promoción",
        canParticipate: false
      }, { status: 400 });
    }

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
      discount: prize.value, // Siempre es un descuento
      deliveryFree: false,
      is2x1: false,
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
