import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const inventoryFilePath = path.join(process.cwd(), "data", "inventory.json");

function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(inventoryFilePath)) {
    fs.writeFileSync(inventoryFilePath, JSON.stringify([], null, 2));
  }
}

// GET - Obtener todas las compras de inventario
export async function GET() {
  try {
    ensureDataDirectory();
    const inventoryData = fs.readFileSync(inventoryFilePath, "utf-8");
    const inventory = JSON.parse(inventoryData);
    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Error al leer inventario:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST - Registrar nueva compra de inventario
export async function POST(request: Request) {
  try {
    ensureDataDirectory();
    const body = await request.json();
    const inventoryData = fs.readFileSync(inventoryFilePath, "utf-8");
    const inventory = JSON.parse(inventoryData);

    const newPurchase = {
      id: Date.now().toString(),
      supplier: body.supplier,
      supplierRuc: body.supplierRuc || "",
      supplierPhone: body.supplierPhone || "",
      paymentMethod: body.paymentMethod || "efectivo",
      items: body.items, // Array de { productName, quantity, unit, unitCost, total }
      totalAmount: body.totalAmount,
      notes: body.notes || "",
      purchaseDate: body.purchaseDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    inventory.unshift(newPurchase);
    fs.writeFileSync(inventoryFilePath, JSON.stringify(inventory, null, 2));

    return NextResponse.json(newPurchase, { status: 201 });
  } catch (error) {
    console.error("Error al registrar compra:", error);
    return NextResponse.json({ error: "Error al registrar compra" }, { status: 500 });
  }
}

// DELETE - Eliminar registro de compra
export async function DELETE(request: Request) {
  try {
    ensureDataDirectory();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const inventoryData = fs.readFileSync(inventoryFilePath, "utf-8");
    let inventory = JSON.parse(inventoryData);

    inventory = inventory.filter((p: any) => p.id !== id);
    fs.writeFileSync(inventoryFilePath, JSON.stringify(inventory, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar compra:", error);
    return NextResponse.json({ error: "Error al eliminar compra" }, { status: 500 });
  }
}
