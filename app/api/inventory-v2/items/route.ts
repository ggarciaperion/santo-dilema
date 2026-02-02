import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { InventoryItem } from "@/types/inventory";

const dataDir = path.join(process.cwd(), "data");
const itemsFile = path.join(dataDir, "inventory-items.json");

async function ensureDataFiles() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }

  try {
    await fs.access(itemsFile);
  } catch {
    await fs.writeFile(itemsFile, JSON.stringify([], null, 2));
  }
}

// GET - Get all inventory items
export async function GET(request: Request) {
  try {
    await ensureDataFiles();
    const data = await fs.readFile(itemsFile, "utf-8");
    const items: InventoryItem[] = JSON.parse(data);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const active = searchParams.get("active");
    const lowStock = searchParams.get("lowStock");
    const search = searchParams.get("search");

    let filtered = items;

    // Filter by category
    if (category && category !== "all") {
      filtered = filtered.filter((item) => item.category === category);
    }

    // Filter by active status
    if (active === "true") {
      filtered = filtered.filter((item) => item.active);
    } else if (active === "false") {
      filtered = filtered.filter((item) => !item.active);
    }

    // Filter by low stock
    if (lowStock === "true") {
      filtered = filtered.filter(
        (item) => item.currentStock <= item.reorderPoint
      );
    }

    // Search by name or SKU
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          (item.sku && item.sku.toLowerCase().includes(searchLower))
      );
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error reading inventory items:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST - Create new inventory item
export async function POST(request: Request) {
  try {
    await ensureDataFiles();

    const body = await request.json();
    const data = await fs.readFile(itemsFile, "utf-8");
    const items: InventoryItem[] = JSON.parse(data);

    // Auto-generate SKU if not provided
    const sku =
      body.sku ||
      `${body.category.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: body.name,
      sku,
      category: body.category,
      unit: body.unit,
      unitConversions: body.unitConversions || [],
      currentStock: body.currentStock || 0,
      minStock: body.minStock || 10,
      maxStock: body.maxStock || 100,
      reorderPoint: body.reorderPoint || body.minStock * 1.5 || 15,
      lastCost: body.lastCost || 0,
      averageCost: body.averageCost || body.lastCost || 0,
      preferredSupplier: body.preferredSupplier,
      alternativeSuppliers: body.alternativeSuppliers || [],
      isPerishable: body.isPerishable || false,
      shelfLifeDays: body.shelfLifeDays,
      storageLocation: body.storageLocation,
      active: body.active !== false,
      notes: body.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    items.push(newItem);
    await fs.writeFile(itemsFile, JSON.stringify(items, null, 2));

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Error creating inventory item" },
      { status: 500 }
    );
  }
}

// PATCH - Update inventory item
export async function PATCH(request: Request) {
  try {
    await ensureDataFiles();

    const body = await request.json();
    const { id, ...updates } = body;

    const data = await fs.readFile(itemsFile, "utf-8");
    const items: InventoryItem[] = JSON.parse(data);

    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(itemsFile, JSON.stringify(items, null, 2));

    return NextResponse.json(items[index]);
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Error updating inventory item" },
      { status: 500 }
    );
  }
}

// DELETE - Delete inventory item
export async function DELETE(request: Request) {
  try {
    await ensureDataFiles();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    const data = await fs.readFile(itemsFile, "utf-8");
    const items: InventoryItem[] = JSON.parse(data);

    const filtered = items.filter((item) => item.id !== id);

    if (filtered.length === items.length) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    await fs.writeFile(itemsFile, JSON.stringify(filtered, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      { error: "Error deleting inventory item" },
      { status: 500 }
    );
  }
}
