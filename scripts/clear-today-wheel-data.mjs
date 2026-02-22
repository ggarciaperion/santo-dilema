import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function clearTodayWheelData() {
  try {
    console.log('🔍 Obteniendo datos de la ruleta y cupones...');

    // Obtener datos actuales
    const wheelSpins = await redis.get('wheelSpins') || [];
    const coupons = await redis.get('coupons') || [];

    // Obtener fecha de hoy (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    console.log(`📅 Fecha de hoy: ${today}`);
    console.log(`📊 Total wheel spins antes: ${wheelSpins.length}`);
    console.log(`📊 Total cupones antes: ${coupons.length}`);

    // Filtrar wheel spins (eliminar los de hoy)
    const wheelSpinsBeforeToday = wheelSpins.filter(spin => {
      const spinDate = new Date(spin.spinDate).toISOString().split('T')[0];
      return spinDate !== today;
    });

    // Filtrar cupones (eliminar los de hoy)
    const couponsBeforeToday = coupons.filter(coupon => {
      const couponDate = new Date(coupon.createdAt).toISOString().split('T')[0];
      return couponDate !== today;
    });

    const wheelSpinsDeleted = wheelSpins.length - wheelSpinsBeforeToday.length;
    const couponsDeleted = coupons.length - couponsBeforeToday.length;

    console.log(`\n🗑️  Wheel spins de hoy a eliminar: ${wheelSpinsDeleted}`);
    console.log(`🗑️  Cupones de hoy a eliminar: ${couponsDeleted}`);

    if (wheelSpinsDeleted === 0 && couponsDeleted === 0) {
      console.log('✅ No hay datos de hoy para eliminar.');
      return;
    }

    // Mostrar datos que se eliminarán
    console.log('\n📋 Datos a eliminar:');

    const todayWheelSpins = wheelSpins.filter(spin => {
      const spinDate = new Date(spin.spinDate).toISOString().split('T')[0];
      return spinDate === today;
    });

    const todayCoupons = coupons.filter(coupon => {
      const couponDate = new Date(coupon.createdAt).toISOString().split('T')[0];
      return couponDate === today;
    });

    if (todayWheelSpins.length > 0) {
      console.log('\n🎰 Wheel Spins de hoy:');
      todayWheelSpins.forEach(spin => {
        console.log(`  - Teléfono: ${spin.phone}, Premio: ${spin.prize}, Cupón: ${spin.couponCode}`);
      });
    }

    if (todayCoupons.length > 0) {
      console.log('\n🎫 Cupones de hoy:');
      todayCoupons.forEach(coupon => {
        console.log(`  - Código: ${coupon.code}, Teléfono: ${coupon.phone}, Descuento: ${coupon.discount}%, Delivery Free: ${coupon.deliveryFree || false}`);
      });
    }

    // Guardar datos filtrados
    console.log('\n💾 Guardando datos actualizados en Redis...');
    await redis.set('wheelSpins', wheelSpinsBeforeToday);
    await redis.set('coupons', couponsBeforeToday);

    console.log(`\n✅ Datos de hoy eliminados exitosamente`);
    console.log(`📊 Total wheel spins después: ${wheelSpinsBeforeToday.length}`);
    console.log(`📊 Total cupones después: ${couponsBeforeToday.length}`);

  } catch (error) {
    console.error('❌ Error al limpiar datos:', error);
    throw error;
  }
}

// Ejecutar
clearTodayWheelData()
  .then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
