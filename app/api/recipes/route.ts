import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    return NextResponse.json(await storage.getRecipes());
  } catch (e) {
    return NextResponse.json({ error: "Error al leer recetas" }, { status: 500 });
  }
}

// PUT - create or replace recipe for a productId
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.productId) return NextResponse.json({ error: "productId requerido" }, { status: 400 });
    const recipe = {
      productId: body.productId,
      items: body.items || [],
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(await storage.saveOrUpdateRecipe(recipe));
  } catch (e) {
    return NextResponse.json({ error: "Error al guardar receta" }, { status: 500 });
  }
}
