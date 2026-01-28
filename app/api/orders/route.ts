import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ordersFilePath = path.join(process.cwd(), "data", "orders.json");

// Asegurar que el directorio data existe
function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(ordersFilePath)) {
    fs.writeFileSync(ordersFilePath, JSON.stringify([], null, 2));
  }
}

// GET - Obtener todos los pedidos
export async function GET() {
  try {
    ensureDataDirectory();
    const ordersData = fs.readFileSync(ordersFilePath, "utf-8");
    const orders = JSON.parse(ordersData);
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error al leer pedidos:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST - Crear un nuevo pedido
export async function POST(request: Request) {
  try {
    ensureDataDirectory();
    const body = await request.json();

    // Leer pedidos existentes
    const ordersData = fs.readFileSync(ordersFilePath, "utf-8");
    const orders = JSON.parse(ordersData);

    // Crear nuevo pedido con ID único
    const newOrder = {
      id: Date.now().toString(),
      ...body,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Agregar al inicio del array
    orders.unshift(newOrder);

    // Guardar
    fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2));

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Error al crear pedido:", error);
    return NextResponse.json(
      { error: "Error al procesar el pedido" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar estado de un pedido
export async function PATCH(request: Request) {
  try {
    ensureDataDirectory();
    const { id, status } = await request.json();

    const ordersData = fs.readFileSync(ordersFilePath, "utf-8");
    const orders = JSON.parse(ordersData);

    const orderIndex = orders.findIndex((order: any) => order.id === id);
    if (orderIndex === -1) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();

    fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2));

    return NextResponse.json(orders[orderIndex]);
  } catch (error) {
    console.error("Error al actualizar pedido:", error);
    return NextResponse.json(
      { error: "Error al actualizar el pedido" },
      { status: 500 }
    );
  }
}
