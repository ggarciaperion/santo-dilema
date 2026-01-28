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

// GET - Buscar cliente por DNI
export async function GET(request: Request) {
  try {
    ensureDataDirectory();
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get("dni");

    if (!dni) {
      return NextResponse.json(
        { error: "DNI es requerido" },
        { status: 400 }
      );
    }

    const ordersData = fs.readFileSync(ordersFilePath, "utf-8");
    const orders = JSON.parse(ordersData);

    // Buscar el pedido más reciente de este DNI
    const customerOrder = orders.find((order: any) => order.dni === dni);

    if (!customerOrder) {
      return NextResponse.json(
        { found: false },
        { status: 200 }
      );
    }

    // Retornar solo los datos del cliente
    return NextResponse.json({
      found: true,
      customer: {
        name: customerOrder.name,
        dni: customerOrder.dni,
        phone: customerOrder.phone,
        address: customerOrder.address,
        email: customerOrder.email || "",
      },
    });
  } catch (error) {
    console.error("Error al buscar cliente:", error);
    return NextResponse.json(
      { error: "Error al buscar cliente" },
      { status: 500 }
    );
  }
}
