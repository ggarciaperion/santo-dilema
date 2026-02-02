import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// Función para generar productId automático basado en categoría
async function generateProductId(category: string): Promise<string> {
  const products = await storage.getProducts();

  // Obtener prefijo de 3 letras de la categoría
  const prefix = category.substring(0, 3).toUpperCase();

  // Filtrar productos que empiezan con este prefijo
  const categoryProducts = products.filter(p => p.productId?.startsWith(prefix));

  // Encontrar el número más alto
  let maxNumber = 0;
  categoryProducts.forEach(p => {
    const match = p.productId?.match(/\d+$/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  });

  // Generar el siguiente número correlativo
  const nextNumber = maxNumber + 1;
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
}

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

    // Generar productId automáticamente si no se proporciona
    const productId = body.productId?.trim()
      ? body.productId.toUpperCase()
      : await generateProductId(body.category);

    const newProduct = {
      id: Date.now().toString(),
      productId,
      name: body.name.toUpperCase(),
      category: body.category || "",
      unit: body.unit || "unidad",
      price: body.price || 0,
      cost: body.cost || 0,
      active: body.active !== undefined ? body.active : true,
      stock: body.stock || 0,
      minStock: body.minStock || 10,
      maxStock: body.maxStock || 100,
      type: body.type || "inventory", // Por defecto es "inventory" para mantener compatibilidad
      createdAt: new Date().toISOString(),
    };

    const savedProduct = await storage.saveProduct(newProduct);

    return NextResponse.json(savedProduct, { status: 201 });
  } catch (error) {
    console.error("Error al registrar producto:", error);
    return NextResponse.json({ error: "Error al registrar producto", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// PATCH - Actualizar producto
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const body = await request.json();

    const updates = {
      productId: body.productId?.toUpperCase(),
      name: body.name?.toUpperCase(),
      category: body.category,
      unit: body.unit,
      price: body.price,
      cost: body.cost,
      active: body.active,
      stock: body.stock,
      minStock: body.minStock,
      maxStock: body.maxStock,
      type: body.type,
    };

    const updatedProduct = await storage.updateProduct(id, updates);

    if (!updatedProduct) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return NextResponse.json({ error: "Error al actualizar producto", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
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
