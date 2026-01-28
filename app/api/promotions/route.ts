import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const promotionsFilePath = path.join(process.cwd(), "data", "promotions.json");

function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(promotionsFilePath)) {
    fs.writeFileSync(promotionsFilePath, JSON.stringify([], null, 2));
  }
}

// GET - Obtener todas las promociones
export async function GET() {
  try {
    ensureDataDirectory();
    const promotionsData = fs.readFileSync(promotionsFilePath, "utf-8");
    const promotions = JSON.parse(promotionsData);
    return NextResponse.json(promotions);
  } catch (error) {
    console.error("Error al leer promociones:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST - Crear nueva promoción
export async function POST(request: Request) {
  try {
    ensureDataDirectory();
    const body = await request.json();
    const promotionsData = fs.readFileSync(promotionsFilePath, "utf-8");
    const promotions = JSON.parse(promotionsData);

    const newPromotion = {
      id: Date.now().toString(),
      name: body.name,
      description: body.description,
      type: body.type, // "percentage" | "fixed" | "combo" | "shipping"
      value: body.value,
      minAmount: body.minAmount || 0,
      applicableProducts: body.applicableProducts || [],
      applicableCategories: body.applicableCategories || [],
      startDate: body.startDate,
      endDate: body.endDate,
      active: body.active !== undefined ? body.active : true,
      code: body.code || "",
      usageLimit: body.usageLimit || 0,
      targetSegment: body.targetSegment || "all",
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };

    promotions.unshift(newPromotion);
    fs.writeFileSync(promotionsFilePath, JSON.stringify(promotions, null, 2));

    return NextResponse.json(newPromotion, { status: 201 });
  } catch (error) {
    console.error("Error al crear promoción:", error);
    return NextResponse.json({ error: "Error al crear promoción" }, { status: 500 });
  }
}

// PATCH - Actualizar promoción
export async function PATCH(request: Request) {
  try {
    ensureDataDirectory();
    const body = await request.json();
    const promotionsData = fs.readFileSync(promotionsFilePath, "utf-8");
    const promotions = JSON.parse(promotionsData);

    const promotionIndex = promotions.findIndex((p: any) => p.id === body.id);
    if (promotionIndex === -1) {
      return NextResponse.json({ error: "Promoción no encontrada" }, { status: 404 });
    }

    promotions[promotionIndex] = {
      ...promotions[promotionIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(promotionsFilePath, JSON.stringify(promotions, null, 2));
    return NextResponse.json(promotions[promotionIndex]);
  } catch (error) {
    console.error("Error al actualizar promoción:", error);
    return NextResponse.json({ error: "Error al actualizar promoción" }, { status: 500 });
  }
}

// DELETE - Eliminar promoción
export async function DELETE(request: Request) {
  try {
    ensureDataDirectory();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const promotionsData = fs.readFileSync(promotionsFilePath, "utf-8");
    let promotions = JSON.parse(promotionsData);

    promotions = promotions.filter((p: any) => p.id !== id);
    fs.writeFileSync(promotionsFilePath, JSON.stringify(promotions, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar promoción:", error);
    return NextResponse.json({ error: "Error al eliminar promoción" }, { status: 500 });
  }
}
