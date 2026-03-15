import { NextResponse } from 'next/server';

// Hora Loca — Dúo Dilema promo: 7:00 PM – 8:00 PM (Lima time)
const PRODUCT_ID    = 'duo-dilema';
const PROMO_PRICE   = 30;
const NORMAL_PRICE  = 36;
const PROMO_START_H = 19; // 7 PM
const PROMO_END_H   = 20; // 8 PM (exclusive)

function getPeruHour(): number {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Lima' })
  ).getHours();
}

export async function GET() {
  const hour   = getPeruHour();
  const active = hour >= PROMO_START_H && hour < PROMO_END_H;

  return NextResponse.json({
    active,
    productId:   PRODUCT_ID,
    promoName:   'Hora Loca',
    normalPrice: NORMAL_PRICE,
    promoPrice:  active ? PROMO_PRICE : NORMAL_PRICE,
  });
}
