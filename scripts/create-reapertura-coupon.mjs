/**
 * Crea el cupón REAPERTURA en producción (staging).
 * Ejecutar con: node scripts/create-reapertura-coupon.mjs [URL_BASE]
 *
 * Ejemplo:
 *   node scripts/create-reapertura-coupon.mjs https://santo-dilema-iota.vercel.app
 */

const BASE_URL = process.argv[2] || "https://santo-dilema-iota.vercel.app";

// Vence el Domingo 5 de Abril 2026 a las 11:00 PM hora Perú (UTC-5) = Lunes 6 abril 04:00 UTC
const EXPIRES_AT = "2026-04-06T04:00:00.000Z";

const payload = {
  action: "create-multi",
  code: "REAPERTURA",
  fixedAmount: 2.00,
  discount: 0,
  expiresAt: EXPIRES_AT,
  customerName: "Cupón Reapertura S/ 2.00",
};

console.log(`\n🎟  Creando cupón REAPERTURA en ${BASE_URL}...`);
console.log(`   Descuento : S/ 2.00 (monto fijo)`);
console.log(`   Uso       : 1 vez por número de teléfono`);
console.log(`   Vigencia  : hasta ${new Date(EXPIRES_AT).toLocaleString("es-PE", { timeZone: "America/Lima" })} hora Perú\n`);

const res = await fetch(`${BASE_URL}/api/coupons`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const data = await res.json();

if (res.ok && data.success) {
  console.log("✅ Cupón creado exitosamente:");
  console.log(`   Código : ${data.code}`);
  console.log(`   Descuento fijo : S/ ${data.fixedAmount}`);
} else {
  console.error("❌ Error al crear cupón:", data);
  process.exit(1);
}
