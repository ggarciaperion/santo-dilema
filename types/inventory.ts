// ============================================
// SANTO DILEMA - SOPHISTICATED INVENTORY SYSTEM
// Complete Type Definitions
// ============================================

// ========== ENUMS & CONSTANTS ==========

export type UnitOfMeasure =
  | 'kg'           // Kilogramos
  | 'g'            // Gramos
  | 'l'            // Litros
  | 'ml'           // Mililitros
  | 'unidad'       // Unidades individuales
  | 'paquete'      // Paquetes
  | 'caja'         // Cajas
  | 'bolsa'        // Bolsas
  | 'docena'       // Docenas
  | 'lata'         // Latas
  | 'frasco'       // Frascos
  | 'sobre'        // Sobres
  | 'bandeja'      // Bandejas
  | 'atado'        // Atados (vegetales)
  | 'porcion';     // Porciones

export type ItemCategory =
  | 'proteinas'           // Pollo, carne, pescado
  | 'vegetales'           // Verduras y hortalizas
  | 'frutas'              // Frutas
  | 'lacteos'             // Leche, queso, yogurt
  | 'abarrotes'           // Arroz, aceite, condimentos
  | 'salsas-aderezos'     // Salsas preparadas, aderezos
  | 'bebidas'             // Bebidas envasadas
  | 'empaques'            // Envases, bolsas, cajas
  | 'desechables'         // Cubiertos, servilletas
  | 'limpieza'            // Productos de limpieza
  | 'gas-servicios'       // Gas, agua, luz
  | 'equipamiento'        // Utensilios, equipos
  | 'otros';              // Otros gastos

export type PurchaseStatus =
  | 'draft'               // Borrador
  | 'ordered'             // Pedido realizado
  | 'received'            // Mercancía recibida
  | 'partial'             // Recepción parcial
  | 'cancelled';          // Cancelado

export type PaymentStatus =
  | 'pending'             // Pendiente
  | 'partial'             // Pago parcial
  | 'paid'                // Pagado completo
  | 'overdue';            // Vencido

export type PaymentMethod =
  | 'efectivo'
  | 'transferencia'
  | 'yape'
  | 'plin'
  | 'tarjeta'
  | 'credito';            // Crédito del proveedor

export type MovementType =
  | 'purchase'            // Compra
  | 'sale'                // Venta
  | 'adjustment'          // Ajuste de inventario
  | 'waste'               // Merma/desperdicio
  | 'return'              // Devolución
  | 'transfer'            // Transferencia
  | 'production';         // Uso en producción

export type StockValuationMethod =
  | 'fifo'                // First In First Out
  | 'average';            // Costo Promedio

// ========== SUPPLIER MANAGEMENT ==========

export interface Supplier {
  id: string;
  name: string;
  ruc?: string;
  contactName?: string;
  phone: string;
  email?: string;
  address?: string;
  category: ItemCategory[];
  paymentTerms?: string;          // "15 días", "30 días", "Contado"
  bankAccount?: string;
  notes?: string;
  active: boolean;
  rating?: number;                 // 1-5 stars
  totalPurchases: number;          // Monto total comprado
  lastPurchaseDate?: string;
  createdAt: string;
}

// ========== INVENTORY ITEMS (RAW MATERIALS & SUPPLIES) ==========

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;                    // Código interno
  category: ItemCategory;
  unit: UnitOfMeasure;

  // Conversiones de unidades
  unitConversions?: UnitConversion[];

  // Stock
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;            // Punto de reorden

  // Costos
  lastCost: number;                // Último costo de compra
  averageCost: number;             // Costo promedio

  // Proveedores
  preferredSupplier?: string;      // ID del proveedor preferido
  alternativeSuppliers?: string[]; // IDs de proveedores alternativos

  // Perecibilidad
  isPerishable: boolean;
  shelfLifeDays?: number;          // Vida útil en días

  // Ubicación
  storageLocation?: string;        // "Refrigerador A", "Almacén seco", etc.

  // Metadata
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UnitConversion {
  fromUnit: UnitOfMeasure;
  toUnit: UnitOfMeasure;
  factor: number;                  // Ej: 1 paquete = 10 unidades
}

// ========== PURCHASE ORDERS ==========

export interface PurchaseOrder {
  id: string;
  purchaseNumber: string;          // PO-2024-001
  supplier: {
    id: string;
    name: string;
    ruc?: string;
  };

  // Fechas
  purchaseDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;

  // Items
  items: PurchaseItem[];

  // Montos
  subtotal: number;
  taxRate: number;                 // % de IGV (18% en Perú)
  taxAmount: number;
  discount: number;
  shipping: number;
  otherCharges: number;
  total: number;

  // Estado
  status: PurchaseStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;

  // Pagos
  paidAmount: number;
  pendingAmount: number;
  paymentDueDate?: string;

  // Documentos
  invoiceNumber?: string;
  invoicePath?: string;            // Ruta al archivo de factura
  receiptPath?: string;            // Ruta al comprobante de pago

  // Notas
  notes?: string;
  internalNotes?: string;

  // Metadata
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
  receivedBy?: string;
  receivedAt?: string;
}

export interface PurchaseItem {
  inventoryItemId: string;
  itemName: string;
  category: ItemCategory;

  // Cantidad
  quantity: number;
  unit: UnitOfMeasure;

  // Precios
  unitCost: number;
  subtotal: number;
  discount: number;
  total: number;

  // Lote y vencimiento
  batchNumber?: string;
  expirationDate?: string;

  // Recepción
  receivedQuantity?: number;
  receivedDate?: string;

  notes?: string;
}

// ========== INVENTORY MOVEMENTS ==========

export interface InventoryMovement {
  id: string;
  movementNumber: string;          // MOV-2024-001

  type: MovementType;

  inventoryItemId: string;
  itemName: string;

  // Cantidad
  quantity: number;
  unit: UnitOfMeasure;

  // Entrada o Salida
  isEntry: boolean;                // true = entrada, false = salida

  // Lote (si aplica)
  batchNumber?: string;

  // Costo
  unitCost: number;
  totalCost: number;

  // Stock después del movimiento
  stockBefore: number;
  stockAfter: number;

  // Referencias
  referenceType?: 'purchase' | 'sale' | 'production' | 'adjustment';
  referenceId?: string;            // ID de la orden de compra, venta, etc.

  // Razón (para ajustes y mermas)
  reason?: string;

  // Metadata
  performedBy?: string;
  notes?: string;
  createdAt: string;
}

// ========== RECIPES / BILL OF MATERIALS (BOM) ==========

export interface Recipe {
  id: string;
  productId: string;               // ID del producto terminado
  productName: string;

  // Rendimiento
  yieldQuantity: number;           // Cuántas porciones/unidades produce
  yieldUnit: UnitOfMeasure;

  // Ingredientes
  ingredients: RecipeIngredient[];

  // Costos
  totalCost: number;               // Costo total de ingredientes
  costPerUnit: number;             // Costo por porción/unidad

  // Metadata
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RecipeIngredient {
  inventoryItemId: string;
  itemName: string;
  quantity: number;
  unit: UnitOfMeasure;
  cost: number;                    // Costo de esta cantidad
  costPerUnit: number;             // Costo unitario del ingrediente
}

// ========== BATCH / LOT TRACKING ==========

export interface Batch {
  id: string;
  batchNumber: string;
  inventoryItemId: string;
  itemName: string;

  // Cantidades
  initialQuantity: number;
  currentQuantity: number;
  unit: UnitOfMeasure;

  // Costos
  unitCost: number;
  totalCost: number;

  // Fechas
  purchaseDate: string;
  expirationDate?: string;

  // Proveedor
  supplierId: string;
  supplierName: string;

  // Estado
  status: 'active' | 'depleted' | 'expired' | 'returned';

  // Metadata
  createdAt: string;
  updatedAt?: string;
}

// ========== STOCK VALUATION ==========

export interface StockValuation {
  inventoryItemId: string;
  itemName: string;

  currentStock: number;
  unit: UnitOfMeasure;

  // Valorización
  method: StockValuationMethod;
  unitCost: number;
  totalValue: number;

  // Batches (para FIFO)
  batches?: BatchValuation[];

  calculatedAt: string;
}

export interface BatchValuation {
  batchNumber: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  purchaseDate: string;
}

// ========== ANALYTICS & REPORTS ==========

export interface InventoryAnalytics {
  // Período
  periodStart: string;
  periodEnd: string;

  // Resumen general
  totalInventoryValue: number;
  totalPurchases: number;
  totalWaste: number;

  // Rotación de inventario
  inventoryTurnover: number;       // Veces que rota el inventario
  daysInventoryOutstanding: number; // Días de inventario

  // Top productos
  topSellingItems: ItemSalesData[];
  slowMovingItems: ItemSalesData[];
  expiringSoonItems: ExpiringItem[];
  outOfStockItems: string[];
  lowStockItems: LowStockItem[];

  // Proveedores
  topSuppliers: SupplierPerformance[];

  // Análisis ABC
  abcAnalysis: ABCAnalysis;

  // Costos
  costTrends: CostTrend[];
}

export interface ItemSalesData {
  itemId: string;
  itemName: string;
  quantitySold: number;
  unit: UnitOfMeasure;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

export interface ExpiringItem {
  itemId: string;
  itemName: string;
  batchNumber: string;
  quantity: number;
  unit: UnitOfMeasure;
  expirationDate: string;
  daysUntilExpiration: number;
  value: number;
}

export interface LowStockItem {
  itemId: string;
  itemName: string;
  currentStock: number;
  minStock: number;
  reorderPoint: number;
  unit: UnitOfMeasure;
  suggestedOrderQuantity: number;
  preferredSupplier?: string;
}

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  totalPurchases: number;
  purchaseCount: number;
  averageOrderValue: number;
  onTimeDeliveryRate: number;
  qualityRating: number;
}

export interface ABCAnalysis {
  categoryA: ABCCategory;  // 80% del valor, 20% de items
  categoryB: ABCCategory;  // 15% del valor, 30% de items
  categoryC: ABCCategory;  // 5% del valor, 50% de items
}

export interface ABCCategory {
  items: string[];
  itemCount: number;
  totalValue: number;
  percentageOfValue: number;
}

export interface CostTrend {
  itemId: string;
  itemName: string;
  date: string;
  cost: number;
  changePercent: number;
}

// ========== REORDER SUGGESTIONS ==========

export interface ReorderSuggestion {
  inventoryItemId: string;
  itemName: string;

  currentStock: number;
  minStock: number;
  reorderPoint: number;

  // Cálculos
  averageDailyUsage: number;
  leadTimeDays: number;
  safetyStock: number;

  // Sugerencia
  suggestedOrderQuantity: number;
  unit: UnitOfMeasure;

  estimatedCost: number;

  preferredSupplier?: {
    id: string;
    name: string;
  };

  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';

  calculatedAt: string;
}

// ========== WASTE TRACKING ==========

export interface WasteRecord {
  id: string;
  inventoryItemId: string;
  itemName: string;

  quantity: number;
  unit: UnitOfMeasure;

  reason: 'expired' | 'spoiled' | 'damaged' | 'overproduction' | 'other';
  reasonDetails?: string;

  cost: number;

  batchNumber?: string;

  reportedBy?: string;
  createdAt: string;
}

// ========== DASHBOARD STATS ==========

export interface InventoryDashboardStats {
  // Stock
  totalItems: number;
  activeItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  criticalStockItems: number;

  // Valorización
  totalInventoryValue: number;
  totalPurchasesThisMonth: number;
  totalWasteThisMonth: number;

  // Proveedores
  activeSuppliers: number;

  // Alertas
  expiringItemsNext7Days: number;
  expiringItemsNext30Days: number;

  // Movimientos
  movementsToday: number;
  movementsThisWeek: number;

  // Órdenes de compra
  pendingPurchaseOrders: number;
  partialPurchaseOrders: number;
}
