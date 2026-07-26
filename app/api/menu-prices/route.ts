import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const prices = await storage.getMenuPrices();
    return NextResponse.json(prices, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch {
    return NextResponse.json({}, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const { productId, price } = await request.json();
    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
    const prices = await storage.getMenuPrices();
    if (!price || price <= 0) {
      delete prices[productId];
    } else {
      prices[productId] = price;
    }
    await storage.saveMenuPrices(prices);
    return NextResponse.json({ success: true, productId, price });
  } catch {
    return NextResponse.json({ error: "Error al guardar precio" }, { status: 500 });
  }
}
