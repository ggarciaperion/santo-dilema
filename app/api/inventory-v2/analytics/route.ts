import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type {
  InventoryAnalytics,
  InventoryDashboardStats,
  ReorderSuggestion,
} from "@/types/inventory";

const dataDir = path.join(process.cwd(), "data");
const itemsFile = path.join(dataDir, "inventory-items.json");
const movementsFile = path.join(dataDir, "inventory-movements.json");
const purchasesFile = path.join(dataDir, "purchases.json");
const ordersFile = path.join(dataDir, "orders.json");
const suppliersFile = path.join(dataDir, "suppliers.json");

async function ensureDataFiles() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }

  const files = [itemsFile, movementsFile, purchasesFile, ordersFile, suppliersFile];
  for (const file of files) {
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, JSON.stringify([], null, 2));
    }
  }
}

// GET - Get analytics data
export async function GET(request: Request) {
  try {
    await ensureDataFiles();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "dashboard";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const periodStart = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const periodEnd = to || new Date().toISOString();

    switch (type) {
      case "dashboard":
        return NextResponse.json(await getDashboardStats());
      case "full":
        return NextResponse.json(await getFullAnalytics(periodStart, periodEnd));
      case "reorder":
        return NextResponse.json(await getReorderSuggestions());
      case "valuation":
        return NextResponse.json(await getStockValuation());
      case "turnover":
        return NextResponse.json(await getInventoryTurnover(periodStart, periodEnd));
      default:
        return NextResponse.json(await getDashboardStats());
    }
  } catch (error) {
    console.error("Error getting analytics:", error);
    return NextResponse.json(
      { error: "Error generating analytics" },
      { status: 500 }
    );
  }
}

// Dashboard stats
async function getDashboardStats(): Promise<InventoryDashboardStats> {
  const itemsData = await fs.readFile(itemsFile, "utf-8");
  const items = JSON.parse(itemsData);

  const movementsData = await fs.readFile(movementsFile, "utf-8");
  const movements = JSON.parse(movementsData);

  const purchasesData = await fs.readFile(purchasesFile, "utf-8");
  const purchases = JSON.parse(purchasesData);

  const suppliersData = await fs.readFile(suppliersFile, "utf-8");
  const suppliers = JSON.parse(suppliersData);

  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Calculate totals
  const totalItems = items.length;
  const activeItems = items.filter((i: any) => i.active).length;
  const lowStockItems = items.filter(
    (i: any) =>
      i.currentStock > i.minStock && i.currentStock <= i.reorderPoint
  ).length;
  const outOfStockItems = items.filter(
    (i: any) => i.currentStock === 0
  ).length;
  const criticalStockItems = items.filter(
    (i: any) => i.currentStock > 0 && i.currentStock <= i.minStock
  ).length;

  // Inventory value
  const totalInventoryValue = items.reduce(
    (sum: number, item: any) => sum + item.currentStock * item.averageCost,
    0
  );

  // Purchases this month
  const totalPurchasesThisMonth = purchases
    .filter((p: any) => new Date(p.purchaseDate) >= thisMonth)
    .reduce((sum: number, p: any) => sum + p.total, 0);

  // Waste this month
  const totalWasteThisMonth = movements
    .filter(
      (m: any) =>
        m.type === "waste" && new Date(m.createdAt) >= thisMonth
    )
    .reduce((sum: number, m: any) => sum + m.totalCost, 0);

  // Active suppliers
  const activeSuppliers = suppliers.filter((s: any) => s.active).length;

  // Expiring items
  const expiringItemsNext7Days = 0; // Would require batch tracking
  const expiringItemsNext30Days = 0;

  // Movements today and this week
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const movementsToday = movements.filter(
    (m: any) => new Date(m.createdAt) >= today
  ).length;
  const movementsThisWeek = movements.filter(
    (m: any) => new Date(m.createdAt) >= thisWeek
  ).length;

  // Pending purchase orders
  const pendingPurchaseOrders = purchases.filter(
    (p: any) => p.status === "ordered"
  ).length;
  const partialPurchaseOrders = purchases.filter(
    (p: any) => p.status === "partial"
  ).length;

  return {
    totalItems,
    activeItems,
    lowStockItems,
    outOfStockItems,
    criticalStockItems,
    totalInventoryValue,
    totalPurchasesThisMonth,
    totalWasteThisMonth,
    activeSuppliers,
    expiringItemsNext7Days,
    expiringItemsNext30Days,
    movementsToday,
    movementsThisWeek,
    pendingPurchaseOrders,
    partialPurchaseOrders,
  };
}

// Full analytics
async function getFullAnalytics(periodStart: string, periodEnd: string): Promise<InventoryAnalytics> {
  const itemsData = await fs.readFile(itemsFile, "utf-8");
  const items = JSON.parse(itemsData);

  const movementsData = await fs.readFile(movementsFile, "utf-8");
  const movements = JSON.parse(movementsData);

  const purchasesData = await fs.readFile(purchasesFile, "utf-8");
  const purchases = JSON.parse(purchasesData);

  const ordersData = await fs.readFile(ordersFile, "utf-8");
  const orders = JSON.parse(ordersData);

  const suppliersData = await fs.readFile(suppliersFile, "utf-8");
  const suppliers = JSON.parse(suppliersData);

  // Filter by period
  const periodPurchases = purchases.filter((p: any) => {
    const date = new Date(p.purchaseDate);
    return date >= new Date(periodStart) && date <= new Date(periodEnd);
  });

  const periodMovements = movements.filter((m: any) => {
    const date = new Date(m.createdAt);
    return date >= new Date(periodStart) && date <= new Date(periodEnd);
  });

  // Calculate totals
  const totalInventoryValue = items.reduce(
    (sum: number, item: any) => sum + item.currentStock * item.averageCost,
    0
  );

  const totalPurchases = periodPurchases.reduce(
    (sum: number, p: any) => sum + p.total,
    0
  );

  const totalWaste = periodMovements
    .filter((m: any) => m.type === "waste")
    .reduce((sum: number, m: any) => sum + m.totalCost, 0);

  // Calculate inventory turnover
  const totalUsed = periodMovements
    .filter((m: any) => !m.isEntry)
    .reduce((sum: number, m: any) => sum + m.totalCost, 0);

  const inventoryTurnover = totalInventoryValue > 0 ? totalUsed / totalInventoryValue : 0;
  const daysInventoryOutstanding = inventoryTurnover > 0 ? 365 / inventoryTurnover : 0;

  // Top selling items (from sales movements)
  const itemSales = new Map();
  periodMovements
    .filter((m: any) => m.type === "sale")
    .forEach((m: any) => {
      if (itemSales.has(m.inventoryItemId)) {
        const existing = itemSales.get(m.inventoryItemId);
        existing.quantitySold += m.quantity;
        existing.cost += m.totalCost;
      } else {
        itemSales.set(m.inventoryItemId, {
          itemId: m.inventoryItemId,
          itemName: m.itemName,
          quantitySold: m.quantity,
          unit: m.unit,
          revenue: 0, // Would need product prices
          cost: m.totalCost,
          profit: 0,
          margin: 0,
        });
      }
    });

  const topSellingItems = Array.from(itemSales.values())
    .sort((a: any, b: any) => b.quantitySold - a.quantitySold)
    .slice(0, 10);

  // Slow moving items (items with low movement)
  const itemMovementCount = new Map();
  periodMovements.forEach((m: any) => {
    const count = itemMovementCount.get(m.inventoryItemId) || 0;
    itemMovementCount.set(m.inventoryItemId, count + 1);
  });

  const slowMovingItems = items
    .filter((item: any) => {
      const movements = itemMovementCount.get(item.id) || 0;
      return movements <= 2 && item.currentStock > 0;
    })
    .map((item: any) => ({
      itemId: item.id,
      itemName: item.name,
      quantitySold: 0,
      unit: item.unit,
      revenue: 0,
      cost: item.currentStock * item.averageCost,
      profit: 0,
      margin: 0,
    }))
    .slice(0, 10);

  // Low stock items
  const lowStockItems = items
    .filter((i: any) => i.currentStock <= i.reorderPoint && i.active)
    .map((item: any) => {
      const suggestedQty = Math.max(
        item.maxStock - item.currentStock,
        item.reorderPoint * 2
      );
      return {
        itemId: item.id,
        itemName: item.name,
        currentStock: item.currentStock,
        minStock: item.minStock,
        reorderPoint: item.reorderPoint,
        unit: item.unit,
        suggestedOrderQuantity: suggestedQty,
        preferredSupplier: item.preferredSupplier,
      };
    });

  // Out of stock items
  const outOfStockItems = items
    .filter((i: any) => i.currentStock === 0 && i.active)
    .map((i: any) => i.name);

  // Expiring soon (placeholder)
  const expiringSoonItems: any[] = [];

  // Top suppliers
  const supplierPurchases = new Map();
  periodPurchases.forEach((p: any) => {
    if (supplierPurchases.has(p.supplier.id)) {
      const existing = supplierPurchases.get(p.supplier.id);
      existing.totalPurchases += p.total;
      existing.purchaseCount += 1;
    } else {
      supplierPurchases.set(p.supplier.id, {
        supplierId: p.supplier.id,
        supplierName: p.supplier.name,
        totalPurchases: p.total,
        purchaseCount: 1,
        averageOrderValue: 0,
        onTimeDeliveryRate: 0,
        qualityRating: 0,
      });
    }
  });

  const topSuppliers = Array.from(supplierPurchases.values())
    .map((s: any) => ({
      ...s,
      averageOrderValue: s.totalPurchases / s.purchaseCount,
    }))
    .sort((a: any, b: any) => b.totalPurchases - a.totalPurchases)
    .slice(0, 5);

  // ABC Analysis (simplified)
  const itemValues = items
    .map((item: any) => ({
      id: item.id,
      name: item.name,
      value: item.currentStock * item.averageCost,
    }))
    .sort((a: any, b: any) => b.value - a.value);

  const totalValue = itemValues.reduce((sum: number, i: any) => sum + i.value, 0);
  let cumValue = 0;
  const categoryA: any[] = [];
  const categoryB: any[] = [];
  const categoryC: any[] = [];

  itemValues.forEach((item: any) => {
    cumValue += item.value;
    const percentOfTotal = (cumValue / totalValue) * 100;

    if (percentOfTotal <= 80) {
      categoryA.push(item.id);
    } else if (percentOfTotal <= 95) {
      categoryB.push(item.id);
    } else {
      categoryC.push(item.id);
    }
  });

  const abcAnalysis = {
    categoryA: {
      items: categoryA,
      itemCount: categoryA.length,
      totalValue: itemValues
        .filter((i: any) => categoryA.includes(i.id))
        .reduce((sum: number, i: any) => sum + i.value, 0),
      percentageOfValue: 80,
    },
    categoryB: {
      items: categoryB,
      itemCount: categoryB.length,
      totalValue: itemValues
        .filter((i: any) => categoryB.includes(i.id))
        .reduce((sum: number, i: any) => sum + i.value, 0),
      percentageOfValue: 15,
    },
    categoryC: {
      items: categoryC,
      itemCount: categoryC.length,
      totalValue: itemValues
        .filter((i: any) => categoryC.includes(i.id))
        .reduce((sum: number, i: any) => sum + i.value, 0),
      percentageOfValue: 5,
    },
  };

  // Cost trends (last 6 purchases per item)
  const costTrends: any[] = [];

  return {
    periodStart,
    periodEnd,
    totalInventoryValue,
    totalPurchases,
    totalWaste,
    inventoryTurnover,
    daysInventoryOutstanding,
    topSellingItems,
    slowMovingItems,
    expiringSoonItems,
    outOfStockItems,
    lowStockItems,
    topSuppliers,
    abcAnalysis,
    costTrends,
  };
}

// Reorder suggestions
async function getReorderSuggestions(): Promise<ReorderSuggestion[]> {
  const itemsData = await fs.readFile(itemsFile, "utf-8");
  const items = JSON.parse(itemsData);

  const movementsData = await fs.readFile(movementsFile, "utf-8");
  const movements = JSON.parse(movementsData);

  const suppliersData = await fs.readFile(suppliersFile, "utf-8");
  const suppliers = JSON.parse(suppliersData);

  const suggestions: ReorderSuggestion[] = [];

  // Get last 30 days of movements
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  items
    .filter((item: any) => item.active && item.currentStock <= item.reorderPoint)
    .forEach((item: any) => {
      // Calculate average daily usage
      const recentMovements = movements.filter(
        (m: any) =>
          m.inventoryItemId === item.id &&
          !m.isEntry &&
          new Date(m.createdAt) >= thirtyDaysAgo
      );

      const totalUsed = recentMovements.reduce(
        (sum: number, m: any) => sum + m.quantity,
        0
      );
      const averageDailyUsage = totalUsed / 30;

      // Estimate lead time (default 7 days)
      const leadTimeDays = 7;

      // Calculate safety stock (7 days of usage)
      const safetyStock = averageDailyUsage * 7;

      // Suggested order quantity
      const suggestedQty = Math.max(
        item.maxStock - item.currentStock,
        leadTimeDays * averageDailyUsage + safetyStock
      );

      // Urgency level
      let urgencyLevel: "critical" | "high" | "medium" | "low";
      if (item.currentStock === 0) {
        urgencyLevel = "critical";
      } else if (item.currentStock <= item.minStock) {
        urgencyLevel = "high";
      } else if (item.currentStock <= item.reorderPoint) {
        urgencyLevel = "medium";
      } else {
        urgencyLevel = "low";
      }

      // Find preferred supplier
      const supplier = suppliers.find((s: any) => s.id === item.preferredSupplier);

      suggestions.push({
        inventoryItemId: item.id,
        itemName: item.name,
        currentStock: item.currentStock,
        minStock: item.minStock,
        reorderPoint: item.reorderPoint,
        averageDailyUsage,
        leadTimeDays,
        safetyStock,
        suggestedOrderQuantity: Math.ceil(suggestedQty),
        unit: item.unit,
        estimatedCost: Math.ceil(suggestedQty) * item.lastCost,
        preferredSupplier: supplier
          ? { id: supplier.id, name: supplier.name }
          : undefined,
        urgencyLevel,
        calculatedAt: new Date().toISOString(),
      });
    });

  // Sort by urgency
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  suggestions.sort(
    (a, b) =>
      urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel]
  );

  return suggestions;
}

// Stock valuation
async function getStockValuation() {
  const itemsData = await fs.readFile(itemsFile, "utf-8");
  const items = JSON.parse(itemsData);

  const valuation = items.map((item: any) => ({
    inventoryItemId: item.id,
    itemName: item.name,
    currentStock: item.currentStock,
    unit: item.unit,
    method: "average",
    unitCost: item.averageCost,
    totalValue: item.currentStock * item.averageCost,
    calculatedAt: new Date().toISOString(),
  }));

  const totalValue = valuation.reduce(
    (sum: number, v: any) => sum + v.totalValue,
    0
  );

  return {
    items: valuation,
    totalValue,
    calculatedAt: new Date().toISOString(),
  };
}

// Inventory turnover
async function getInventoryTurnover(periodStart: string, periodEnd: string) {
  const itemsData = await fs.readFile(itemsFile, "utf-8");
  const items = JSON.parse(itemsData);

  const movementsData = await fs.readFile(movementsFile, "utf-8");
  const movements = JSON.parse(movementsData);

  const totalInventoryValue = items.reduce(
    (sum: number, item: any) => sum + item.currentStock * item.averageCost,
    0
  );

  const periodMovements = movements.filter((m: any) => {
    const date = new Date(m.createdAt);
    return (
      date >= new Date(periodStart) &&
      date <= new Date(periodEnd) &&
      !m.isEntry
    );
  });

  const totalCostOfGoodsSold = periodMovements.reduce(
    (sum: number, m: any) => sum + m.totalCost,
    0
  );

  const turnoverRatio =
    totalInventoryValue > 0 ? totalCostOfGoodsSold / totalInventoryValue : 0;
  const daysInventory = turnoverRatio > 0 ? 365 / turnoverRatio : 0;

  return {
    periodStart,
    periodEnd,
    totalInventoryValue,
    totalCostOfGoodsSold,
    turnoverRatio: turnoverRatio.toFixed(2),
    daysInventoryOutstanding: Math.round(daysInventory),
  };
}
