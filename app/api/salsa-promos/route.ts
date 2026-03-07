import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    return NextResponse.json(await storage.getSalsaPromos());
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.productId || !body.salsas?.length || !body.promoPrice) {
      return NextResponse.json({ error: "productId, salsas y promoPrice son requeridos" }, { status: 400 });
    }
    const promo = await storage.saveSalsaPromo({
      productId: body.productId,
      salsas: body.salsas,
      promoPrice: Number(body.promoPrice),
      active: body.active !== undefined ? body.active : true,
    });
    return NextResponse.json(promo, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    const body = await request.json();
    const updates: any = {};
    if (body.productId !== undefined) updates.productId = body.productId;
    if (body.salsas !== undefined) updates.salsas = body.salsas;
    if (body.promoPrice !== undefined) updates.promoPrice = Number(body.promoPrice);
    if (body.active !== undefined) updates.active = body.active;
    const updated = await storage.updateSalsaPromo(id, updates);
    if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    const deleted = await storage.deleteSalsaPromo(id);
    if (!deleted) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
