import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// GET - Obtener todos los productos
export async function GET() {
  try {
    const products = await storage.getProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error al leer productos:", error);
    return NextResponse.json({ error: "Error al leer productos" }, { status: 500 });
  }
}

// POST - Registrar nuevo producto
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newProduct = {
      id: Date.now().toString(),
      name: body.name.toUpperCase(),
      category: body.category || "",
      unit: body.unit || "unidad",
      createdAt: new Date().toISOString(),
    };

    const savedProduct = await storage.saveProduct(newProduct);

    return NextResponse.json(savedProduct, { status: 201 });
  } catch (error) {
    console.error("Error al registrar producto:", error);
    return NextResponse.json({ error: "Error al registrar producto", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// DELETE - Eliminar producto
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const deleted = await storage.deleteProduct(id);

    if (!deleted) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 });
  }
}
