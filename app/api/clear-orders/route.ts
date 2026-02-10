import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

/**
 * API temporal para limpiar pedidos y clientes antes de producción
 * IMPORTANTE: Eliminar este archivo después de ejecutar la limpieza
 */
export async function POST(request: Request) {
  try {
    const { confirmationKey } = await request.json();

    // Seguridad: requiere clave de confirmación
    if (confirmationKey !== "LIMPIAR-PRODUCCION-2026") {
      return NextResponse.json(
        { error: "Clave de confirmación incorrecta" },
        { status: 403 }
      );
    }

    // Obtener datos actuales para verificar qué no tocaremos
    const currentOrders = await storage.getOrders();
    const currentInventory = await storage.getInventory();
    const currentProducts = await storage.getProducts();
    const currentDeductions = await storage.getDeductions();

    console.log("🗑️ Iniciando limpieza de datos de prueba...");
    console.log(`📦 Pedidos actuales: ${currentOrders.length}`);
    console.log(`🛒 Compras/Gastos (NO se tocarán): ${currentInventory.length}`);
    console.log(`🍗 Productos de Venta (NO se tocarán): ${currentProducts.length}`);
    console.log(`📊 Deducciones (NO se tocarán): ${currentDeductions.length}`);

    // LIMPIAR SOLO ORDERS (que es donde están los pedidos y clientes)
    // Usar método interno de storage para set directo
    const isProduction = process.env.VERCEL === '1';

    if (isProduction) {
      // En producción: usar Redis
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });

      await redis.set('orders', []);
      console.log('✅ Pedidos limpiados en Redis');
    } else {
      // En desarrollo: limpiar archivo
      const fs = require('fs');
      const path = require('path');
      const ordersFilePath = path.join(process.cwd(), 'data', 'orders.json');
      fs.writeFileSync(ordersFilePath, JSON.stringify([], null, 2));
      console.log('✅ Pedidos limpiados en archivo local');
    }

    return NextResponse.json({
      success: true,
      message: "Limpieza exitosa",
      details: {
        ordersDeleted: currentOrders.length,
        inventoryPreserved: currentInventory.length,
        productsPreserved: currentProducts.length,
        deductionsPreserved: currentDeductions.length,
      }
    });
  } catch (error) {
    console.error("❌ Error al limpiar datos:", error);
    return NextResponse.json(
      {
        error: "Error al limpiar datos",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
