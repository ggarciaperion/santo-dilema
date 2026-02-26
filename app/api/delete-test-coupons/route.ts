import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// API temporal para eliminar cupones de prueba con teléfono "999999999"
export async function POST(request: Request) {
  try {
    console.log('🔍 Buscando cupones con teléfono "999999999"...');

    // Obtener todos los cupones
    const coupons = await storage.getCoupons();
    console.log(`📊 Total de cupones: ${coupons.length}`);

    // Filtrar cupones de prueba
    const testCoupons = coupons.filter(c => c.phone === '999999999');
    console.log(`🎯 Cupones de prueba encontrados: ${testCoupons.length}`);

    if (testCoupons.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay cupones de prueba para eliminar',
        deleted: 0,
        remaining: coupons.length
      });
    }

    // Mantener solo los cupones que NO son de prueba
    const filteredCoupons = coupons.filter(c => c.phone !== '999999999');

    // Actualizar en la base de datos
    await storage.updateCoupons(filteredCoupons);

    console.log(`✅ ${testCoupons.length} cupones eliminados`);
    console.log(`📊 Cupones restantes: ${filteredCoupons.length}`);

    // También eliminar participaciones de yunza con teléfono de prueba
    const participations = await storage.getYunzaParticipations();
    const testParticipations = participations.filter(p => p.phone === '999999999');

    let deletedParticipations = 0;
    if (testParticipations.length > 0) {
      const filteredParticipations = participations.filter(p => p.phone !== '999999999');

      // Guardar participaciones filtradas
      // Necesitamos actualizar directamente porque no hay método updateYunzaParticipations
      const redis = process.env.UPSTASH_REDIS_REST_URL ?
        await import('@upstash/redis').then(mod => new mod.Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        })) : null;

      if (redis) {
        await redis.set('yunzaParticipations', filteredParticipations);
        deletedParticipations = testParticipations.length;
        console.log(`✅ ${deletedParticipations} participaciones de Yunza eliminadas`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cupones de prueba eliminados exitosamente`,
      deletedCoupons: testCoupons.length,
      deletedParticipations,
      remainingCoupons: filteredCoupons.length,
      testCouponsDeleted: testCoupons.map(c => ({
        code: c.code,
        discount: c.discount,
        deliveryFree: c.deliveryFree,
        is2x1: c.is2x1,
        status: c.status,
        createdAt: c.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Error al eliminar cupones de prueba:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cupones de prueba', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET para ver estadísticas sin eliminar
export async function GET() {
  try {
    const coupons = await storage.getCoupons();
    const testCoupons = coupons.filter(c => c.phone === '999999999');

    const participations = await storage.getYunzaParticipations();
    const testParticipations = participations.filter(p => p.phone === '999999999');

    return NextResponse.json({
      totalCoupons: coupons.length,
      testCoupons: testCoupons.length,
      totalParticipations: participations.length,
      testParticipations: testParticipations.length,
      testCouponsList: testCoupons.map(c => ({
        code: c.code,
        discount: c.discount,
        deliveryFree: c.deliveryFree,
        is2x1: c.is2x1,
        status: c.status,
        createdAt: c.createdAt
      })),
      testParticipationsList: testParticipations.map(p => ({
        couponCode: p.couponCode,
        prize: p.prize,
        participationDate: p.participationDate
      }))
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
