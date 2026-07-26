import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const discounts = await storage.getMenuDiscounts();
    return NextResponse.json(discounts, {
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
    const discounts = await storage.getMenuDiscounts();
    if (!price || price <= 0) {
      delete discounts[productId];
    } else {
      discounts[productId] = price;
    }
    await storage.saveMenuDiscounts(discounts);
    return NextResponse.json({ success: true, productId, price });
  } catch {
    return NextResponse.json({ error: "Failed to update discount" }, { status: 500 });
  }
}
