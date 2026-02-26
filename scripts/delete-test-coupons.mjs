// Script para eliminar cupones de prueba con teléfono "999999999"
import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Variables de entorno cargadas desde .env.local');
} else {
  console.log('⚠️  No se encontró .env.local, usando variables del sistema');
}

// Verificar que las credenciales de Upstash existan
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.error('❌ Error: Variables de entorno UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN no están configuradas');
  process.exit(1);
}

// Conectar a Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function deleteTestCoupons() {
  try {
    console.log('\n🔍 Buscando cupones con teléfono "999999999"...\n');

    // Obtener cupones
    const coupons = await redis.get('coupons') || [];
    console.log(`📊 Total de cupones en la base de datos: ${coupons.length}`);

    // Filtrar cupones de prueba
    const testCoupons = coupons.filter(c => c.phone === '999999999');
    console.log(`🎯 Cupones de prueba encontrados: ${testCoupons.length}\n`);

    if (testCoupons.length === 0) {
      console.log('✅ No hay cupones de prueba para eliminar');
      return;
    }

    // Mostrar cupones a eliminar
    console.log('📋 Cupones que serán eliminados:');
    testCoupons.forEach((coupon, index) => {
      console.log(`\n   ${index + 1}. Código: ${coupon.code}`);
      console.log(`      Teléfono: ${coupon.phone}`);
      console.log(`      Descuento: ${coupon.discount}%`);
      console.log(`      Estado: ${coupon.status}`);
      console.log(`      Creado: ${new Date(coupon.createdAt).toLocaleString('es-PE')}`);
    });

    console.log(`\n❓ ¿Deseas eliminar estos ${testCoupons.length} cupones? (y/n)`);

    // En modo script directo, proceder automáticamente
    const shouldDelete = true; // Cambiar a false para requerir confirmación manual

    if (shouldDelete) {
      // Filtrar cupones (mantener los que NO son de prueba)
      const filteredCoupons = coupons.filter(c => c.phone !== '999999999');

      // Guardar en Redis
      await redis.set('coupons', filteredCoupons);

      console.log(`\n✅ ${testCoupons.length} cupones de prueba eliminados exitosamente`);
      console.log(`📊 Cupones restantes: ${filteredCoupons.length}`);
    } else {
      console.log('\n❌ Operación cancelada');
    }

    // También verificar yunzaParticipations
    console.log('\n\n🔍 Verificando participaciones de Yunza con teléfono "999999999"...\n');

    const participations = await redis.get('yunzaParticipations') || [];
    console.log(`📊 Total de participaciones en la base de datos: ${participations.length}`);

    const testParticipations = participations.filter(p => p.phone === '999999999');
    console.log(`🎯 Participaciones de prueba encontradas: ${testParticipations.length}\n`);

    if (testParticipations.length > 0) {
      console.log('📋 Participaciones que serán eliminadas:');
      testParticipations.forEach((p, index) => {
        console.log(`\n   ${index + 1}. Código: ${p.couponCode}`);
        console.log(`      Premio: ${p.prize}`);
        console.log(`      Fecha: ${new Date(p.participationDate).toLocaleString('es-PE')}`);
      });

      if (shouldDelete) {
        const filteredParticipations = participations.filter(p => p.phone !== '999999999');
        await redis.set('yunzaParticipations', filteredParticipations);

        console.log(`\n✅ ${testParticipations.length} participaciones de prueba eliminadas exitosamente`);
        console.log(`📊 Participaciones restantes: ${filteredParticipations.length}`);
      }
    } else {
      console.log('✅ No hay participaciones de prueba para eliminar');
    }

  } catch (error) {
    console.error('\n❌ Error al eliminar cupones de prueba:', error);
    process.exit(1);
  }
}

// Ejecutar
deleteTestCoupons()
  .then(() => {
    console.log('\n✅ Proceso completado exitosamente\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error:', err);
    process.exit(1);
  });
