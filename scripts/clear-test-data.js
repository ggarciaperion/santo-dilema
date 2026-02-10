#!/usr/bin/env node

/**
 * Script para limpiar datos de prueba antes de producción
 * Limpia SOLO pedidos y clientes
 * NO toca: compras, gastos, productos de venta
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🚨 SCRIPT DE LIMPIEZA DE DATOS DE PRUEBA 🚨\n');
console.log('Este script eliminará TODOS los pedidos y clientes de la base de datos.');
console.log('NO afectará: compras, gastos, productos de venta, deducciones.\n');

rl.question('¿Deseas continuar? (escribe "SI" para confirmar): ', async (answer) => {
  if (answer.trim().toUpperCase() !== 'SI') {
    console.log('❌ Operación cancelada.');
    rl.close();
    return;
  }

  console.log('\n🔄 Ejecutando limpieza...\n');

  // Determinar URL según entorno
  const isLocal = process.argv.includes('--local');
  const baseUrl = isLocal
    ? 'http://localhost:3000'
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://santo-dilema.vercel.app';

  console.log(`📡 Conectando a: ${baseUrl}`);

  try {
    const response = await fetch(`${baseUrl}/api/clear-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        confirmationKey: 'LIMPIAR-PRODUCCION-2026'
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('\n✅ LIMPIEZA EXITOSA\n');
      console.log(`🗑️  Pedidos eliminados: ${result.details.ordersDeleted}`);
      console.log(`✅ Compras/Gastos preservados: ${result.details.inventoryPreserved}`);
      console.log(`✅ Productos de Venta preservados: ${result.details.productsPreserved}`);
      console.log(`✅ Deducciones preservadas: ${result.details.deductionsPreserved}`);
      console.log('\n💡 IMPORTANTE: Ahora elimina el archivo app/api/clear-orders/route.ts');
      console.log('   Este endpoint de limpieza no debe existir en producción.\n');
    } else {
      console.error('❌ Error:', result.error);
      console.error('Detalles:', result.details);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n💡 Si estás en desarrollo local:');
    console.log('   1. Asegúrate de que el servidor esté corriendo (npm run dev)');
    console.log('   2. Ejecuta: node scripts/clear-test-data.js --local');
  }

  rl.close();
});
