import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Supplier } from "@/types/inventory";

const dataDir = path.join(process.cwd(), "data");
const suppliersFile = path.join(dataDir, "suppliers.json");
const purchasesFile = path.join(dataDir, "purchases.json");

async function ensureDataFiles() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }

  for (const file of [suppliersFile, purchasesFile]) {
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, JSON.stringify([], null, 2));
    }
  }
}

// GET - Get all suppliers with stats
export async function GET(request: Request) {
  try {
    await ensureDataFiles();
    const data = await fs.readFile(suppliersFile, "utf-8");
    let suppliers: Supplier[] = JSON.parse(data);

    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");
    const category = searchParams.get("category");
    const withStats = searchParams.get("withStats");

    let filtered = suppliers;

    // Filter by active status
    if (active === "true") {
      filtered = filtered.filter((s) => s.active);
    } else if (active === "false") {
      filtered = filtered.filter((s) => !s.active);
    }

    // Filter by category
    if (category && category !== "all") {
      filtered = filtered.filter((s) => s.category.includes(category as any));
    }

    // Enrich with purchase statistics
    if (withStats === "true") {
      const purchasesData = await fs.readFile(purchasesFile, "utf-8");
      const purchases = JSON.parse(purchasesData);

      filtered = filtered.map((supplier) => {
        const supplierPurchases = purchases.filter(
          (p: any) => p.supplier.id === supplier.id
        );

        const totalPurchases = supplierPurchases.reduce(
          (sum: number, p: any) => sum + p.total,
          0
        );

        const lastPurchase = supplierPurchases[0];

        return {
          ...supplier,
          totalPurchases,
          lastPurchaseDate: lastPurchase?.purchaseDate,
        };
      });
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error reading suppliers:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST - Create new supplier
export async function POST(request: Request) {
  try {
    await ensureDataFiles();

    const body = await request.json();
    const data = await fs.readFile(suppliersFile, "utf-8");
    const suppliers: Supplier[] = JSON.parse(data);

    const newSupplier: Supplier = {
      id: Date.now().toString(),
      name: body.name,
      ruc: body.ruc,
      contactName: body.contactName,
      phone: body.phone,
      email: body.email,
      address: body.address,
      category: body.category || [],
      paymentTerms: body.paymentTerms,
      bankAccount: body.bankAccount,
      notes: body.notes,
      active: body.active !== false,
      rating: body.rating || 3,
      totalPurchases: 0,
      createdAt: new Date().toISOString(),
    };

    suppliers.push(newSupplier);
    await fs.writeFile(suppliersFile, JSON.stringify(suppliers, null, 2));

    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Error creating supplier" },
      { status: 500 }
    );
  }
}

// PATCH - Update supplier
export async function PATCH(request: Request) {
  try {
    await ensureDataFiles();

    const body = await request.json();
    const { id, ...updates } = body;

    const data = await fs.readFile(suppliersFile, "utf-8");
    const suppliers: Supplier[] = JSON.parse(data);

    const index = suppliers.findIndex((s) => s.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    suppliers[index] = {
      ...suppliers[index],
      ...updates,
    };

    await fs.writeFile(suppliersFile, JSON.stringify(suppliers, null, 2));

    return NextResponse.json(suppliers[index]);
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { error: "Error updating supplier" },
      { status: 500 }
    );
  }
}

// DELETE - Delete supplier
export async function DELETE(request: Request) {
  try {
    await ensureDataFiles();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Supplier ID required" },
        { status: 400 }
      );
    }

    const data = await fs.readFile(suppliersFile, "utf-8");
    const suppliers: Supplier[] = JSON.parse(data);

    const filtered = suppliers.filter((s) => s.id !== id);

    if (filtered.length === suppliers.length) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    await fs.writeFile(suppliersFile, JSON.stringify(filtered, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { error: "Error deleting supplier" },
      { status: 500 }
    );
  }
}
