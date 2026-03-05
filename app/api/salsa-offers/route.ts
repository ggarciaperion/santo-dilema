import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const data = await storage.getSalsaOffers();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ 'pequeno-dilema': [], 'duo-dilema': [], 'santo-pecado': [] });
  }
}

// PATCH: { menuId, offers: [{ salsaId, price }] }
export async function PATCH(request: Request) {
  try {
    const { menuId, offers } = await request.json();
    const current = await storage.getSalsaOffers();
    current[menuId] = offers;
    await storage.saveSalsaOffers(current);
    return NextResponse.json({ success: true, data: current });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
