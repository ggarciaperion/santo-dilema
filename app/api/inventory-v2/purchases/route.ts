import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { PurchaseOrder, PurchaseItem } from "@/types/inventory";

const dataDir = path.join(process.cwd(), "data");
const purchasesFile = path.join(dataDir, "purchases.json");
const movementsFile = path.join(dataDir, "inventory-movements.json");
const itemsFile = path.join(dataDir, "inventory-items.json");

// Ensure data directory and files exist
async function ensureDataFiles() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }

  for (const file of [purchasesFile, movementsFile, itemsFile]) {
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, JSON.stringify([], null, 2));
    }
  }
}

// GET - Get all purchase orders
export async function GET(request: Request) {
  try {
    await ensureDataFiles();
    const data = await fs.readFile(purchasesFile, "utf-8");
    const purchases: PurchaseOrder[] = JSON.parse(data);

    // Parse query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let filtered = purchases;

    // Filter by status
    if (status && status !== "all") {
      filtered = filtered.filter((p) => p.status === status);
    }

    // Filter by supplier
    if (supplierId) {
      filtered = filtered.filter((p) => p.supplier.id === supplierId);
    }

    // Filter by date range
    if (from) {
      filtered = filtered.filter(
        (p) => new Date(p.purchaseDate) >= new Date(from)
      );
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (p) => new Date(p.purchaseDate) <= toDate
      );
    }

    // Sort by date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    );

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error reading purchases:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST - Create new purchase order
export async function POST(request: Request) {
  try {
    await ensureDataFiles();

    const body = await request.json();

    // Generate purchase number
    const purchasesData = await fs.readFile(purchasesFile, "utf-8");
    const purchases: PurchaseOrder[] = JSON.parse(purchasesData);
    const year = new Date().getFullYear();
    const purchaseNumber = `PO-${year}-${String(purchases.length + 1).padStart(4, "0")}`;

    // Calculate totals
    const subtotal = body.items.reduce(
      (sum: number, item: PurchaseItem) => sum + item.total,
      0
    );
    const taxAmount = subtotal * (body.taxRate / 100);
    const total =
      subtotal + taxAmount - body.discount + body.shipping + body.otherCharges;

    const newPurchase: PurchaseOrder = {
      id: Date.now().toString(),
      purchaseNumber,
      supplier: body.supplier,
      purchaseDate: body.purchaseDate,
      expectedDeliveryDate: body.expectedDeliveryDate,
      actualDeliveryDate: body.actualDeliveryDate,
      items: body.items,
      subtotal,
      taxRate: body.taxRate,
      taxAmount,
      discount: body.discount || 0,
      shipping: body.shipping || 0,
      otherCharges: body.otherCharges || 0,
      total,
      status: body.status || "draft",
      paymentStatus: body.paymentStatus || "pending",
      paymentMethod: body.paymentMethod,
      paidAmount: body.paidAmount || 0,
      pendingAmount: total - (body.paidAmount || 0),
      paymentDueDate: body.paymentDueDate,
      invoiceNumber: body.invoiceNumber,
      invoicePath: body.invoicePath,
      receiptPath: body.receiptPath,
      notes: body.notes,
      internalNotes: body.internalNotes,
      createdBy: body.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    purchases.unshift(newPurchase);
    await fs.writeFile(purchasesFile, JSON.stringify(purchases, null, 2));

    // If status is 'received', update inventory
    if (newPurchase.status === "received" || newPurchase.status === "partial") {
      await updateInventoryFromPurchase(newPurchase);
    }

    return NextResponse.json(newPurchase, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: "Error creating purchase order" },
      { status: 500 }
    );
  }
}

// PATCH - Update purchase order
export async function PATCH(request: Request) {
  try {
    await ensureDataFiles();

    const body = await request.json();
    const { id, ...updates } = body;

    const purchasesData = await fs.readFile(purchasesFile, "utf-8");
    const purchases: PurchaseOrder[] = JSON.parse(purchasesData);

    const index = purchases.findIndex((p) => p.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    const oldStatus = purchases[index].status;
    purchases[index] = {
      ...purchases[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate totals if items changed
    if (updates.items) {
      const subtotal = purchases[index].items.reduce(
        (sum, item) => sum + item.total,
        0
      );
      const taxAmount = subtotal * (purchases[index].taxRate / 100);
      const total =
        subtotal +
        taxAmount -
        purchases[index].discount +
        purchases[index].shipping +
        purchases[index].otherCharges;

      purchases[index].subtotal = subtotal;
      purchases[index].taxAmount = taxAmount;
      purchases[index].total = total;
      purchases[index].pendingAmount = total - purchases[index].paidAmount;
    }

    await fs.writeFile(purchasesFile, JSON.stringify(purchases, null, 2));

    // If status changed to 'received', update inventory
    if (
      (updates.status === "received" || updates.status === "partial") &&
      oldStatus !== "received"
    ) {
      await updateInventoryFromPurchase(purchases[index]);
    }

    return NextResponse.json(purchases[index]);
  } catch (error) {
    console.error("Error updating purchase:", error);
    return NextResponse.json(
      { error: "Error updating purchase order" },
      { status: 500 }
    );
  }
}

// DELETE - Delete purchase order
export async function DELETE(request: Request) {
  try {
    await ensureDataFiles();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Purchase ID required" },
        { status: 400 }
      );
    }

    const purchasesData = await fs.readFile(purchasesFile, "utf-8");
    const purchases: PurchaseOrder[] = JSON.parse(purchasesData);

    const filtered = purchases.filter((p) => p.id !== id);

    if (filtered.length === purchases.length) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    await fs.writeFile(purchasesFile, JSON.stringify(filtered, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    return NextResponse.json(
      { error: "Error deleting purchase order" },
      { status: 500 }
    );
  }
}

// Helper function to update inventory when purchase is received
async function updateInventoryFromPurchase(purchase: PurchaseOrder) {
  try {
    // Read current inventory items
    const itemsData = await fs.readFile(itemsFile, "utf-8");
    const inventoryItems = JSON.parse(itemsData);

    // Read movements
    const movementsData = await fs.readFile(movementsFile, "utf-8");
    const movements = JSON.parse(movementsData);

    for (const item of purchase.items) {
      // Find or create inventory item
      let inventoryItem = inventoryItems.find(
        (i: any) => i.id === item.inventoryItemId
      );

      if (inventoryItem) {
        // Update existing item
        const quantityToAdd = item.receivedQuantity || item.quantity;
        const oldStock = inventoryItem.currentStock;

        inventoryItem.currentStock += quantityToAdd;

        // Update average cost
        const totalCost =
          inventoryItem.averageCost * oldStock + item.unitCost * quantityToAdd;
        inventoryItem.averageCost = totalCost / inventoryItem.currentStock;
        inventoryItem.lastCost = item.unitCost;
        inventoryItem.updatedAt = new Date().toISOString();

        // Create movement
        const movement = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          movementNumber: `MOV-${new Date().getFullYear()}-${String(
            movements.length + 1
          ).padStart(6, "0")}`,
          type: "purchase",
          inventoryItemId: item.inventoryItemId,
          itemName: item.itemName,
          quantity: quantityToAdd,
          unit: item.unit,
          isEntry: true,
          batchNumber: item.batchNumber,
          unitCost: item.unitCost,
          totalCost: item.total,
          stockBefore: oldStock,
          stockAfter: inventoryItem.currentStock,
          referenceType: "purchase",
          referenceId: purchase.id,
          reason: `Purchase Order ${purchase.purchaseNumber}`,
          createdAt: new Date().toISOString(),
        };

        movements.unshift(movement);
      }
    }

    // Save updated inventory and movements
    await fs.writeFile(itemsFile, JSON.stringify(inventoryItems, null, 2));
    await fs.writeFile(movementsFile, JSON.stringify(movements, null, 2));
  } catch (error) {
    console.error("Error updating inventory from purchase:", error);
  }
}
