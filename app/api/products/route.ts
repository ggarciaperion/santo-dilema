import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const productsFilePath = path.join(process.cwd(), "data", "products.json");

function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(productsFilePath)) {
    // Productos iniciales con información de costos
    const initialProducts = [
      { id: "ensalada-clasica", name: "Ensalada Clásica", category: "fit", price: 18.90, cost: 8.50, active: true, stock: 50, minStock: 10, maxStock: 100 },
      { id: "ensalada-proteica", name: "Ensalada Proteica", category: "fit", price: 24.90, cost: 12.00, active: true, stock: 45, minStock: 10, maxStock: 100 },
      { id: "ensalada-caesar", name: "Caesar Fit", category: "fit", price: 22.90, cost: 10.50, active: true, stock: 40, minStock: 10, maxStock: 100 },
      { id: "ensalada-mediterranea", name: "Mediterránea", category: "fit", price: 21.90, cost: 10.00, active: true, stock: 35, minStock: 10, maxStock: 100 },
      { id: "alitas-bbq", name: "BBQ Clásicas", category: "fat", price: 28.90, cost: 14.00, active: true, stock: 60, minStock: 15, maxStock: 120 },
      { id: "alitas-buffalo", name: "Buffalo Picantes", category: "fat", price: 29.90, cost: 15.00, active: true, stock: 8, minStock: 15, maxStock: 120 },
      { id: "alitas-miel-mostaza", name: "Miel Mostaza", category: "fat", price: 28.90, cost: 14.00, active: true, stock: 55, minStock: 15, maxStock: 120 },
      { id: "alitas-teriyaki", name: "Teriyaki Supreme", category: "fat", price: 31.90, cost: 16.00, active: true, stock: 50, minStock: 15, maxStock: 120 },
      { id: "combo-extremo", name: "Combo Extremo", category: "fat", price: 49.90, cost: 25.00, active: true, stock: 30, minStock: 10, maxStock: 60 },
      { id: "alitas-parmesano", name: "Parmesano & Ajo", category: "fat", price: 32.90, cost: 16.50, active: true, stock: 45, minStock: 15, maxStock: 120 },
      { id: "agua-mineral", name: "Agua mineral", category: "bebida", price: 4.00, cost: 1.50, active: true, stock: 150, minStock: 30, maxStock: 300 },
      { id: "coca-cola", name: "Coca Cola 500ml", category: "bebida", price: 4.00, cost: 2.00, active: true, stock: 120, minStock: 30, maxStock: 300 },
      { id: "inka-cola", name: "Inka Cola 500ml", category: "bebida", price: 4.00, cost: 2.00, active: true, stock: 5, minStock: 30, maxStock: 300 },
      { id: "sprite", name: "Sprite 500ml", category: "bebida", price: 4.00, cost: 2.00, active: true, stock: 100, minStock: 30, maxStock: 300 },
      { id: "fanta", name: "Fanta 500ml", category: "bebida", price: 4.00, cost: 2.00, active: true, stock: 90, minStock: 30, maxStock: 300 },
      { id: "extra-papas", name: "Extra papas", category: "bebida", price: 4.00, cost: 1.80, active: true, stock: 80, minStock: 20, maxStock: 150 },
      { id: "extra-salsa", name: "Extra salsa", category: "bebida", price: 3.00, cost: 1.00, active: true, stock: 100, minStock: 25, maxStock: 200 },
    ];
    fs.writeFileSync(productsFilePath, JSON.stringify(initialProducts, null, 2));
  }
}

// GET - Obtener todos los productos
export async function GET() {
  try {
    ensureDataDirectory();
    const productsData = fs.readFileSync(productsFilePath, "utf-8");
    const products = JSON.parse(productsData);
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error al leer productos:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST - Crear nuevo producto
export async function POST(request: Request) {
  try {
    ensureDataDirectory();
    const body = await request.json();
    const productsData = fs.readFileSync(productsFilePath, "utf-8");
    const products = JSON.parse(productsData);

    const newProduct = {
      id: body.id || Date.now().toString(),
      name: body.name,
      category: body.category,
      price: body.price,
      cost: body.cost,
      active: body.active !== undefined ? body.active : true,
      createdAt: new Date().toISOString(),
    };

    products.push(newProduct);
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error al crear producto:", error);
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}

// PATCH - Actualizar producto
export async function PATCH(request: Request) {
  try {
    ensureDataDirectory();
    const body = await request.json();
    const productsData = fs.readFileSync(productsFilePath, "utf-8");
    const products = JSON.parse(productsData);

    const productIndex = products.findIndex((p: any) => p.id === body.id);
    if (productIndex === -1) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    products[productIndex] = {
      ...products[productIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
    return NextResponse.json(products[productIndex]);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}

// DELETE - Eliminar producto
export async function DELETE(request: Request) {
  try {
    ensureDataDirectory();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const productsData = fs.readFileSync(productsFilePath, "utf-8");
    let products = JSON.parse(productsData);

    products = products.filter((p: any) => p.id !== id);
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 });
  }
}
