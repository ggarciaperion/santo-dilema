import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    console.log('🔍 Obteniendo datos de la ruleta y cupones...');

    // Obtener datos actuales
    const wheelSpins = await storage.getWheelSpins();
    const coupons = await storage.getCoupons();

    // Obtener fecha de hoy (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    console.log(`📅 Fecha de hoy: ${today}`);
    console.log(`📊 Total wheel spins antes: ${wheelSpins.length}`);
    console.log(`📊 Total cupones antes: ${coupons.length}`);

    // Filtrar wheel spins (eliminar los de hoy)
    const wheelSpinsBeforeToday = wheelSpins.filter((spin: any) => {
      const spinDate = new Date(spin.spinDate).toISOString().split('T')[0];
      return spinDate !== today;
    });

    // Filtrar cupones (eliminar los de hoy)
    const couponsBeforeToday = coupons.filter((coupon: any) => {
      const couponDate = new Date(coupon.createdAt).toISOString().split('T')[0];
      return couponDate !== today;
    });

    const wheelSpinsDeleted = wheelSpins.length - wheelSpinsBeforeToday.length;
    const couponsDeleted = coupons.length - couponsBeforeToday.length;

    console.log(`\n🗑️  Wheel spins de hoy a eliminar: ${wheelSpinsDeleted}`);
    console.log(`🗑️  Cupones de hoy a eliminar: ${couponsDeleted}`);

    if (wheelSpinsDeleted === 0 && couponsDeleted === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay datos de hoy para eliminar',
        deleted: { wheelSpins: 0, coupons: 0 }
      });
    }

    // Obtener datos que se eliminarán para el reporte
    const todayWheelSpins = wheelSpins.filter((spin: any) => {
      const spinDate = new Date(spin.spinDate).toISOString().split('T')[0];
      return spinDate === today;
    });

    const todayCoupons = coupons.filter((coupon: any) => {
      const couponDate = new Date(coupon.createdAt).toISOString().split('T')[0];
      return couponDate === today;
    });

    // Guardar datos filtrados usando updateCoupons (que sobrescribe todo el array)
    await storage.updateCoupons(couponsBeforeToday);

    // Para wheel spins necesitamos hacerlo directamente en storage
    // Como no hay un método updateWheelSpins, vamos a usar el mismo patrón que updateCoupons
    const { Redis } = require('@upstash/redis');
    const isProduction = process.env.VERCEL === '1';

    if (isProduction && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      await redis.set('wheelSpins', wheelSpinsBeforeToday);
    } else {
      // Desarrollo local
      const fs = require('fs');
      const path = require('path');
      const wheelSpinsFilePath = path.join(process.cwd(), 'data', 'wheel-spins.json');
      fs.writeFileSync(wheelSpinsFilePath, JSON.stringify(wheelSpinsBeforeToday, null, 2));
    }

    console.log(`\n✅ Datos de hoy eliminados exitosamente`);
    console.log(`📊 Total wheel spins después: ${wheelSpinsBeforeToday.length}`);
    console.log(`📊 Total cupones después: ${couponsBeforeToday.length}`);

    return NextResponse.json({
      success: true,
      message: 'Datos de hoy eliminados exitosamente',
      deleted: {
        wheelSpins: wheelSpinsDeleted,
        coupons: couponsDeleted
      },
      deletedData: {
        wheelSpins: todayWheelSpins.map((s: any) => ({
          phone: s.phone,
          prize: s.prize,
          couponCode: s.couponCode
        })),
        coupons: todayCoupons.map((c: any) => ({
          code: c.code,
          phone: c.phone,
          discount: c.discount,
          deliveryFree: c.deliveryFree || false
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error al limpiar datos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al limpiar datos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
