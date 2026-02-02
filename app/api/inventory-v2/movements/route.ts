import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { InventoryMovement, MovementType } from "@/types/inventory";

const dataDir = path.join(process.cwd(), "data");
const movementsFile = path.join(dataDir, "inventory-movements.json");
const itemsFile = path.join(dataDir, "inventory-items.json");

async function ensureDataFiles() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }

  for (const file of [movementsFile, itemsFile]) {
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, JSON.stringify([], null, 2));
    }
  }
}

// GET - Get all inventory movements
export async function GET(request: Request) {
  try {
    await ensureDataFiles();
    const data = await fs.readFile(movementsFile, "utf-8");
    const movements: InventoryMovement[] = JSON.parse(data);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const itemId = searchParams.get("itemId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = searchParams.get("limit");

    let filtered = movements;

    // Filter by type
    if (type && type !== "all") {
      filtered = filtered.filter((m) => m.type === type);
    }

    // Filter by item
    if (itemId) {
      filtered = filtered.filter((m) => m.inventoryItemId === itemId);
    }

    // Filter by date range
    if (from) {
      filtered = filtered.filter(
        (m) => new Date(m.createdAt) >= new Date(from)
      );
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((m) => new Date(m.createdAt) <= toDate);
    }

    // Sort by date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Limit results
    if (limit) {
      filtered = filtered.slice(0, parseInt(limit));
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error reading movements:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST - Create new movement (manual adjustment, waste, etc.)
export async function POST(request: Request) {
  try {
    await ensureDataFiles();

    const body = await request.json();

    // Read current data
    const movementsData = await fs.readFile(movementsFile, "utf-8");
    const movements: InventoryMovement[] = JSON.parse(movementsData);

    const itemsData = await fs.readFile(itemsFile, "utf-8");
    const items = JSON.parse(itemsData);

    // Find the inventory item
    const itemIndex = items.findIndex((i: any) => i.id === body.inventoryItemId);
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    const item = items[itemIndex];
    const stockBefore = item.currentStock;

    // Calculate new stock
    let stockAfter: number;
    if (body.isEntry) {
      stockAfter = stockBefore + body.quantity;
    } else {
      stockAfter = stockBefore - body.quantity;
      if (stockAfter < 0) {
        return NextResponse.json(
          { error: "Insufficient stock" },
          { status: 400 }
        );
      }
    }

    // Generate movement number
    const year = new Date().getFullYear();
    const movementNumber = `MOV-${year}-${String(movements.length + 1).padStart(6, "0")}`;

    // Create movement
    const newMovement: InventoryMovement = {
      id: Date.now().toString(),
      movementNumber,
      type: body.type,
      inventoryItemId: body.inventoryItemId,
      itemName: body.itemName || item.name,
      quantity: body.quantity,
      unit: body.unit || item.unit,
      isEntry: body.isEntry,
      batchNumber: body.batchNumber,
      unitCost: body.unitCost || item.averageCost,
      totalCost: (body.unitCost || item.averageCost) * body.quantity,
      stockBefore,
      stockAfter,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
      reason: body.reason,
      performedBy: body.performedBy,
      notes: body.notes,
      createdAt: new Date().toISOString(),
    };

    movements.unshift(newMovement);

    // Update inventory item stock
    items[itemIndex].currentStock = stockAfter;
    items[itemIndex].updatedAt = new Date().toISOString();

    // Update average cost if entry
    if (body.isEntry && body.unitCost) {
      const totalCost =
        item.averageCost * stockBefore + body.unitCost * body.quantity;
      items[itemIndex].averageCost = totalCost / stockAfter;
      items[itemIndex].lastCost = body.unitCost;
    }

    // Save both files
    await fs.writeFile(movementsFile, JSON.stringify(movements, null, 2));
    await fs.writeFile(itemsFile, JSON.stringify(items, null, 2));

    return NextResponse.json(newMovement, { status: 201 });
  } catch (error) {
    console.error("Error creating movement:", error);
    return NextResponse.json(
      { error: "Error creating movement" },
      { status: 500 }
    );
  }
}

// DELETE - Delete movement (admin only, use carefully)
export async function DELETE(request: Request) {
  try {
    await ensureDataFiles();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Movement ID required" },
        { status: 400 }
      );
    }

    const data = await fs.readFile(movementsFile, "utf-8");
    const movements: InventoryMovement[] = JSON.parse(data);

    const filtered = movements.filter((m) => m.id !== id);

    if (filtered.length === movements.length) {
      return NextResponse.json({ error: "Movement not found" }, { status: 404 });
    }

    await fs.writeFile(movementsFile, JSON.stringify(filtered, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting movement:", error);
    return NextResponse.json(
      { error: "Error deleting movement" },
      { status: 500 }
    );
  }
}
