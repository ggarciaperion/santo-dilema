"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  InventoryItem,
  Supplier,
  PurchaseOrder,
  InventoryMovement,
  InventoryDashboardStats,
  ReorderSuggestion,
  UnitOfMeasure,
  ItemCategory,
  PurchaseStatus,
  PaymentStatus,
  PaymentMethod,
  MovementType,
  PurchaseItem,
} from "@/types/inventory";

type Section =
  | "dashboard"
  | "items"
  | "purchases"
  | "suppliers"
  | "movements"
  | "analytics"
  | "reorder";

export default function InventoryAdminPage() {
  // State
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [loading, setLoading] = useState(true);

  // Data
  const [dashboardStats, setDashboardStats] = useState<InventoryDashboardStats | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);

  // Editing
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseOrder | null>(null);

  // Filters
  const [itemFilter, setItemFilter] = useState({
    category: "all",
    active: "all",
    lowStock: false,
    search: "",
  });
  const [purchaseFilter, setPurchaseFilter] = useState({
    status: "all",
    supplierId: "all",
    from: "",
    to: "",
  });

  // Forms
  const [itemForm, setItemForm] = useState<Partial<InventoryItem>>({
    name: "",
    category: "proteinas",
    unit: "unidad",
    currentStock: 0,
    minStock: 10,
    maxStock: 100,
    reorderPoint: 15,
    lastCost: 0,
    averageCost: 0,
    isPerishable: false,
    active: true,
  });

  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
    name: "",
    phone: "",
    email: "",
    category: [],
    active: true,
    rating: 3,
  });

  const [purchaseForm, setpurchaseForm] = useState<Partial<PurchaseOrder>>({
    supplier: { id: "", name: "" },
    purchaseDate: new Date().toISOString().split("T")[0],
    items: [],
    subtotal: 0,
    taxRate: 18,
    taxAmount: 0,
    discount: 0,
    shipping: 0,
    otherCharges: 0,
    total: 0,
    status: "draft",
    paymentStatus: "pending",
    paidAmount: 0,
    pendingAmount: 0,
  });

  const [movementForm, setMovementForm] = useState({
    inventoryItemId: "",
    itemName: "",
    type: "adjustment" as MovementType,
    quantity: 0,
    unit: "unidad" as UnitOfMeasure,
    isEntry: true,
    reason: "",
  });

  // Load data
  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      loadDashboardStats(),
      loadItems(),
      loadSuppliers(),
      loadPurchases(),
      loadMovements(),
      loadReorderSuggestions(),
    ]);
    setLoading(false);
  };

  const loadDashboardStats = async () => {
    try {
      const response = await fetch("/api/inventory-v2/analytics?type=dashboard");
      const data = await response.json();
      setDashboardStats(data);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }
  };

  const loadItems = async () => {
    try {
      const params = new URLSearchParams();
      if (itemFilter.category !== "all") params.append("category", itemFilter.category);
      if (itemFilter.active !== "all") params.append("active", itemFilter.active);
      if (itemFilter.lowStock) params.append("lowStock", "true");
      if (itemFilter.search) params.append("search", itemFilter.search);

      const response = await fetch(`/api/inventory-v2/items?${params}`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error loading items:", error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await fetch("/api/inventory-v2/suppliers?withStats=true");
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  };

  const loadPurchases = async () => {
    try {
      const params = new URLSearchParams();
      if (purchaseFilter.status !== "all") params.append("status", purchaseFilter.status);
      if (purchaseFilter.supplierId !== "all") params.append("supplierId", purchaseFilter.supplierId);
      if (purchaseFilter.from) params.append("from", purchaseFilter.from);
      if (purchaseFilter.to) params.append("to", purchaseFilter.to);

      const response = await fetch(`/api/inventory-v2/purchases?${params}`);
      const data = await response.json();
      setPurchases(data);
    } catch (error) {
      console.error("Error loading purchases:", error);
    }
  };

  const loadMovements = async () => {
    try {
      const response = await fetch("/api/inventory-v2/movements?limit=100");
      const data = await response.json();
      setMovements(data);
    } catch (error) {
      console.error("Error loading movements:", error);
    }
  };

  const loadReorderSuggestions = async () => {
    try {
      const response = await fetch("/api/inventory-v2/analytics?type=reorder");
      const data = await response.json();
      setReorderSuggestions(data);
    } catch (error) {
      console.error("Error loading reorder suggestions:", error);
    }
  };

  // CRUD Operations - Items
  const handleSaveItem = async () => {
    try {
      const url = "/api/inventory-v2/items";
      const method = editingItem ? "PATCH" : "POST";
      const body = editingItem
        ? { ...itemForm, id: editingItem.id }
        : itemForm;

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      loadItems();
      loadDashboardStats();
      setShowItemModal(false);
      resetItemForm();
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("¿Eliminar este artículo?")) return;
    try {
      await fetch(`/api/inventory-v2/items?id=${id}`, { method: "DELETE" });
      loadItems();
      loadDashboardStats();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  // CRUD Operations - Suppliers
  const handleSaveSupplier = async () => {
    try {
      const url = "/api/inventory-v2/suppliers";
      const method = editingSupplier ? "PATCH" : "POST";
      const body = editingSupplier
        ? { ...supplierForm, id: editingSupplier.id }
        : supplierForm;

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      loadSuppliers();
      setShowSupplierModal(false);
      resetSupplierForm();
    } catch (error) {
      console.error("Error saving supplier:", error);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm("¿Eliminar este proveedor?")) return;
    try {
      await fetch(`/api/inventory-v2/suppliers?id=${id}`, { method: "DELETE" });
      loadSuppliers();
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  // CRUD Operations - Purchases
  const handleSavePurchase = async () => {
    try {
      const url = "/api/inventory-v2/purchases";
      const method = editingPurchase ? "PATCH" : "POST";
      const body = editingPurchase
        ? { ...purchaseForm, id: editingPurchase.id }
        : purchaseForm;

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      loadPurchases();
      loadDashboardStats();
      setShowPurchaseModal(false);
      resetPurchaseForm();
    } catch (error) {
      console.error("Error saving purchase:", error);
    }
  };

  // CRUD Operations - Movements
  const handleSaveMovement = async () => {
    try {
      await fetch("/api/inventory-v2/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movementForm),
      });

      loadMovements();
      loadItems();
      loadDashboardStats();
      setShowMovementModal(false);
      resetMovementForm();
    } catch (error) {
      console.error("Error saving movement:", error);
    }
  };

  // Reset forms
  const resetItemForm = () => {
    setEditingItem(null);
    setItemForm({
      name: "",
      category: "proteinas",
      unit: "unidad",
      currentStock: 0,
      minStock: 10,
      maxStock: 100,
      reorderPoint: 15,
      lastCost: 0,
      averageCost: 0,
      isPerishable: false,
      active: true,
    });
  };

  const resetSupplierForm = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: "",
      phone: "",
      email: "",
      category: [],
      active: true,
      rating: 3,
    });
  };

  const resetPurchaseForm = () => {
    setEditingPurchase(null);
    setpurchaseForm({
      supplier: { id: "", name: "" },
      purchaseDate: new Date().toISOString().split("T")[0],
      items: [],
      subtotal: 0,
      taxRate: 18,
      taxAmount: 0,
      discount: 0,
      shipping: 0,
      otherCharges: 0,
      total: 0,
      status: "draft",
      paymentStatus: "pending",
      paidAmount: 0,
      pendingAmount: 0,
    });
  };

  const resetMovementForm = () => {
    setMovementForm({
      inventoryItemId: "",
      itemName: "",
      type: "adjustment",
      quantity: 0,
      unit: "unidad",
      isEntry: true,
      reason: "",
    });
  };

  // Purchase form helpers
  const addPurchaseItem = () => {
    const newItems = [...(purchaseForm.items || [])];
    newItems.push({
      inventoryItemId: "",
      itemName: "",
      category: "proteinas",
      quantity: 0,
      unit: "unidad",
      unitCost: 0,
      subtotal: 0,
      discount: 0,
      total: 0,
    } as PurchaseItem);
    setpurchaseForm({ ...purchaseForm, items: newItems });
  };

  const removePurchaseItem = (index: number) => {
    const newItems = (purchaseForm.items || []).filter((_, i) => i !== index);
    setpurchaseForm({ ...purchaseForm, items: newItems });
    recalculatePurchaseTotals(newItems);
  };

  const updatePurchaseItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...(purchaseForm.items || [])];
    (newItems[index] as any)[field] = value;

    // Auto-calculate item totals
    if (field === "quantity" || field === "unitCost" || field === "discount") {
      const item = newItems[index];
      item.subtotal = item.quantity * item.unitCost;
      item.total = item.subtotal - (item.discount || 0);
    }

    // If item selected, populate name
    if (field === "inventoryItemId") {
      const selectedItem = items.find((i) => i.id === value);
      if (selectedItem) {
        newItems[index].itemName = selectedItem.name;
        newItems[index].unit = selectedItem.unit;
        newItems[index].unitCost = selectedItem.lastCost || 0;
        newItems[index].category = selectedItem.category;
      }
    }

    setpurchaseForm({ ...purchaseForm, items: newItems });
    recalculatePurchaseTotals(newItems);
  };

  const recalculatePurchaseTotals = (items: PurchaseItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * ((purchaseForm.taxRate || 0) / 100);
    const total =
      subtotal +
      taxAmount -
      (purchaseForm.discount || 0) +
      (purchaseForm.shipping || 0) +
      (purchaseForm.otherCharges || 0);

    setpurchaseForm({
      ...purchaseForm,
      items,
      subtotal,
      taxAmount,
      total,
      pendingAmount: total - (purchaseForm.paidAmount || 0),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-2xl text-fuchsia-400 animate-pulse">Cargando sistema de inventario...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-black border-b-2 border-fuchsia-500/30 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-fuchsia-400 neon-glow-purple mb-2">
                🏭 Sistema de Inventario Avanzado
              </h1>
              <p className="text-gray-400">Santo Dilema - Control Total de Inventario y Compras</p>
            </div>
            <Link
              href="/admin"
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold transition-all border-2 border-gray-700"
            >
              ← Volver al Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <nav className="bg-gray-900 border-b-2 border-fuchsia-500/20 sticky top-[88px] z-30">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { key: "dashboard", label: "📊 Dashboard", icon: "📊" },
              { key: "items", label: "📦 Artículos", icon: "📦" },
              { key: "purchases", label: "🛒 Compras", icon: "🛒" },
              { key: "suppliers", label: "🏢 Proveedores", icon: "🏢" },
              { key: "movements", label: "📋 Movimientos", icon: "📋" },
              { key: "analytics", label: "📈 Analytics", icon: "📈" },
              { key: "reorder", label: "🔔 Reorden", icon: "🔔" },
            ].map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key as Section)}
                className={`px-6 py-4 font-bold transition-all whitespace-nowrap ${
                  activeSection === section.key
                    ? "text-fuchsia-400 border-b-4 border-fuchsia-500 bg-fuchsia-500/10"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {activeSection === "dashboard" && (
          <DashboardSection stats={dashboardStats} reorderSuggestions={reorderSuggestions} />
        )}

        {activeSection === "items" && (
          <ItemsSection
            items={items}
            filter={itemFilter}
            setFilter={setItemFilter}
            onAddNew={() => {
              resetItemForm();
              setShowItemModal(true);
            }}
            onEdit={(item) => {
              setEditingItem(item);
              setItemForm(item);
              setShowItemModal(true);
            }}
            onDelete={handleDeleteItem}
            loadItems={loadItems}
          />
        )}

        {activeSection === "purchases" && (
          <PurchasesSection
            purchases={purchases}
            suppliers={suppliers}
            filter={purchaseFilter}
            setFilter={setPurchaseFilter}
            onAddNew={() => {
              resetPurchaseForm();
              setShowPurchaseModal(true);
            }}
            onEdit={(purchase) => {
              setEditingPurchase(purchase);
              setpurchaseForm(purchase);
              setShowPurchaseModal(true);
            }}
            loadPurchases={loadPurchases}
          />
        )}

        {activeSection === "suppliers" && (
          <SuppliersSection
            suppliers={suppliers}
            onAddNew={() => {
              resetSupplierForm();
              setShowSupplierModal(true);
            }}
            onEdit={(supplier) => {
              setEditingSupplier(supplier);
              setSupplierForm(supplier);
              setShowSupplierModal(true);
            }}
            onDelete={handleDeleteSupplier}
          />
        )}

        {activeSection === "movements" && (
          <MovementsSection
            movements={movements}
            items={items}
            onAddNew={() => {
              resetMovementForm();
              setShowMovementModal(true);
            }}
          />
        )}

        {activeSection === "analytics" && <AnalyticsSection />}

        {activeSection === "reorder" && (
          <ReorderSection suggestions={reorderSuggestions} suppliers={suppliers} />
        )}
      </main>

      {/* Modals */}
      {showItemModal && (
        <ItemModal
          item={editingItem}
          form={itemForm}
          setForm={setItemForm}
          onSave={handleSaveItem}
          onClose={() => {
            setShowItemModal(false);
            resetItemForm();
          }}
        />
      )}

      {showSupplierModal && (
        <SupplierModal
          supplier={editingSupplier}
          form={supplierForm}
          setForm={setSupplierForm}
          onSave={handleSaveSupplier}
          onClose={() => {
            setShowSupplierModal(false);
            resetSupplierForm();
          }}
        />
      )}

      {showPurchaseModal && (
        <PurchaseModal
          purchase={editingPurchase}
          form={purchaseForm}
          setForm={setpurchaseForm}
          suppliers={suppliers}
          items={items}
          onSave={handleSavePurchase}
          onClose={() => {
            setShowPurchaseModal(false);
            resetPurchaseForm();
          }}
          addItem={addPurchaseItem}
          removeItem={removePurchaseItem}
          updateItem={updatePurchaseItem}
        />
      )}

      {showMovementModal && (
        <MovementModal
          form={movementForm}
          setForm={setMovementForm}
          items={items}
          onSave={handleSaveMovement}
          onClose={() => {
            setShowMovementModal(false);
            resetMovementForm();
          }}
        />
      )}
    </div>
  );
}

// ============================================
// SECTION COMPONENTS
// ============================================

function DashboardSection({
  stats,
  reorderSuggestions,
}: {
  stats: InventoryDashboardStats | null;
  reorderSuggestions: ReorderSuggestion[];
}) {
  if (!stats) return <div>Cargando...</div>;

  const criticalSuggestions = reorderSuggestions.filter((s) => s.urgencyLevel === "critical");

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black text-white">Dashboard General</h2>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Artículos"
          value={stats.totalItems}
          subtitle={`${stats.activeItems} activos`}
          icon="📦"
          color="fuchsia"
        />
        <StatCard
          title="Valor Inventario"
          value={`S/ ${stats.totalInventoryValue.toFixed(2)}`}
          subtitle="Valorización total"
          icon="💰"
          color="green"
        />
        <StatCard
          title="Stock Crítico"
          value={stats.criticalStockItems}
          subtitle={`${stats.lowStockItems} stock bajo`}
          icon="⚠️"
          color="red"
          alert={stats.criticalStockItems > 0}
        />
        <StatCard
          title="Compras Este Mes"
          value={`S/ ${stats.totalPurchasesThisMonth.toFixed(2)}`}
          subtitle={`${stats.pendingPurchaseOrders} pendientes`}
          icon="🛒"
          color="cyan"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Mermas del Mes"
          value={`S/ ${stats.totalWasteThisMonth.toFixed(2)}`}
          subtitle="Pérdidas y desperdicios"
          icon="🗑️"
          color="orange"
        />
        <StatCard
          title="Proveedores Activos"
          value={stats.activeSuppliers}
          subtitle="Con compras recientes"
          icon="🏢"
          color="purple"
        />
        <StatCard
          title="Movimientos Hoy"
          value={stats.movementsToday}
          subtitle={`${stats.movementsThisWeek} esta semana`}
          icon="📋"
          color="blue"
        />
      </div>

      {/* Critical Alerts */}
      {criticalSuggestions.length > 0 && (
        <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🚨</span>
            <div>
              <h3 className="text-2xl font-black text-red-400">¡ALERTAS CRÍTICAS!</h3>
              <p className="text-red-300">
                {criticalSuggestions.length} artículos SIN STOCK necesitan reposición URGENTE
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticalSuggestions.slice(0, 4).map((suggestion) => (
              <div
                key={suggestion.inventoryItemId}
                className="bg-gray-900/50 rounded-lg p-4 border border-red-500/30"
              >
                <h4 className="font-bold text-white text-lg">{suggestion.itemName}</h4>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <span className="text-gray-400">Stock actual:</span>
                  <span className="text-red-400 font-bold">{suggestion.currentStock} {suggestion.unit}</span>
                  <span className="text-gray-400">Ordenar:</span>
                  <span className="text-green-400 font-bold">
                    {suggestion.suggestedOrderQuantity} {suggestion.unit}
                  </span>
                  <span className="text-gray-400">Costo estimado:</span>
                  <span className="text-amber-400 font-bold">S/ {suggestion.estimatedCost.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  alert,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: string;
  alert?: boolean;
}) {
  const colorClasses = {
    fuchsia: "border-fuchsia-500/50 bg-fuchsia-500/5",
    green: "border-green-500/50 bg-green-500/5",
    red: "border-red-500/50 bg-red-500/5",
    cyan: "border-cyan-500/50 bg-cyan-500/5",
    orange: "border-orange-500/50 bg-orange-500/5",
    purple: "border-purple-500/50 bg-purple-500/5",
    blue: "border-blue-500/50 bg-blue-500/5",
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${colorClasses[color as keyof typeof colorClasses]} ${alert ? "animate-pulse" : ""}`}>
      <div className="flex items-center gap-4 mb-3">
        <span className="text-4xl">{icon}</span>
        <div>
          <p className="text-gray-400 text-sm font-semibold">{title}</p>
        </div>
      </div>
      <p className="text-4xl font-black text-white mb-2">{value}</p>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}

// TODO: Implement other sections (ItemsSection, PurchasesSection, SuppliersSection, MovementsSection, AnalyticsSection, ReorderSection)
// TODO: Implement modals (ItemModal, SupplierModal, PurchaseModal, MovementModal)

// Placeholder components - These will need to be implemented
function ItemsSection({ items, filter, setFilter, onAddNew, onEdit, onDelete, loadItems }: any) {
  return <div className="text-center py-20 text-gray-400">Items Section - Coming soon...</div>;
}

function PurchasesSection({ purchases, suppliers, filter, setFilter, onAddNew, onEdit, loadPurchases }: any) {
  return <div className="text-center py-20 text-gray-400">Purchases Section - Coming soon...</div>;
}

function SuppliersSection({ suppliers, onAddNew, onEdit, onDelete }: any) {
  return <div className="text-center py-20 text-gray-400">Suppliers Section - Coming soon...</div>;
}

function MovementsSection({ movements, items, onAddNew }: any) {
  return <div className="text-center py-20 text-gray-400">Movements Section - Coming soon...</div>;
}

function AnalyticsSection() {
  return <div className="text-center py-20 text-gray-400">Analytics Section - Coming soon...</div>;
}

function ReorderSection({ suggestions, suppliers }: any) {
  return <div className="text-center py-20 text-gray-400">Reorder Section - Coming soon...</div>;
}

function ItemModal({ item, form, setForm, onSave, onClose }: any) {
  return null; // Placeholder
}

function SupplierModal({ supplier, form, setForm, onSave, onClose }: any) {
  return null; // Placeholder
}

function PurchaseModal({ purchase, form, setForm, suppliers, items, onSave, onClose, addItem, removeItem, updateItem }: any) {
  return null; // Placeholder
}

function MovementModal({ form, setForm, items, onSave, onClose }: any) {
  return null; // Placeholder
}
