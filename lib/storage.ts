import { Redis } from '@upstash/redis';

// Detectar si estamos en producción (Vercel)
const isProduction = process.env.VERCEL === '1';

// Configuración de Redis para producción (Upstash)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Variables para desarrollo local (solo se importan en desarrollo)
let fs: any = null;
let path: any = null;
let dataDir: string = '';
let ordersFilePath: string = '';
let inventoryFilePath: string = '';
let productsFilePath: string = '';
let deductionsFilePath: string = '';
let dailyClosesFilePath: string = '';
let couponsFilePath: string = '';
let promo30FilePath: string = '';
let promoFit30FilePath: string = '';

// Solo inicializar filesystem en desarrollo
if (!isProduction) {
  fs = require('fs');
  path = require('path');
  dataDir = path.join(process.cwd(), 'data');
  ordersFilePath = path.join(dataDir, 'orders.json');
  inventoryFilePath = path.join(dataDir, 'inventory.json');
  productsFilePath = path.join(dataDir, 'products.json');
  deductionsFilePath = path.join(dataDir, 'deductions.json');
  dailyClosesFilePath = path.join(dataDir, 'daily-closes.json');
  couponsFilePath = path.join(dataDir, 'coupons.json');
  promo30FilePath = path.join(dataDir, 'promo30.json');
  promoFit30FilePath = path.join(dataDir, 'promofit30.json');
}

// Asegurar que el directorio data existe en desarrollo
function ensureDataDirectory() {
  if (!isProduction && fs && path) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(ordersFilePath)) {
      fs.writeFileSync(ordersFilePath, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(inventoryFilePath)) {
      fs.writeFileSync(inventoryFilePath, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(productsFilePath)) {
      fs.writeFileSync(productsFilePath, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(deductionsFilePath)) {
      fs.writeFileSync(deductionsFilePath, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(dailyClosesFilePath)) {
      fs.writeFileSync(dailyClosesFilePath, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(couponsFilePath)) {
      fs.writeFileSync(couponsFilePath, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(promo30FilePath)) {
      fs.writeFileSync(promo30FilePath, JSON.stringify({ active: true, count: 0, limit: 30, orders: [] }, null, 2));
    }
    if (!fs.existsSync(promoFit30FilePath)) {
      fs.writeFileSync(promoFit30FilePath, JSON.stringify({ active: true, count: 0, limit: 30, orders: [] }, null, 2));
    }
  }
}

interface Order {
  id: string;
  name: string;
  dni: string;
  phone: string;
  address: string;
  email?: string;
  cart: any[];
  totalItems: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  timestamp?: string;
}

interface Product {
  id: string;
  productId: string;
  name: string;
  category?: string;
  unit: string; // kg, unidad
  price?: number;
  cost?: number;
  active?: boolean;
  stock?: number;
  minStock?: number;
  maxStock?: number;
  type?: string; // "inventory" para materias primas, "sale" para productos de venta
  components?: Array<{ // Componentes/receta para productos de venta (MANUAL)
    productName: string;
    unit: string;
    quantity: number;
    cost?: number; // Costo manual del ingrediente/empaque
  }>;
  createdAt: string;
}

interface InventoryPurchase {
  id: string;
  supplier: string;
  supplierRuc?: string;
  supplierPhone?: string;
  paymentMethod: string;
  items: Array<{
    productName: string;
    quantity: number;
    unit: string;
    volume: number;
    unitCost: number;
    total: number;
    category?: string; // INSUMO, EMPAQUE, SERVICIO, UTENCILIO
  }>;
  totalAmount: number;
  notes?: string;
  purchaseDate: string;
  createdAt: string;
}

interface StockDeduction {
  id: string;
  orderId: string;
  orderName: string;
  items: Array<{
    productName: string;
    quantity: number;
    unit: string;
  }>;
  deductionDate: string;
  createdAt: string;
}

interface DailyClose {
  id: string;
  date: string;
  sales: Array<{
    productName: string;
    quantity: number;
  }>;
  packagingUsed: Array<{
    packagingName: string;
    suggested: number;
    actual: number;
    difference: number;
  }>;
  totalDifference: number;
  notes?: string;
  createdAt: string;
}

export const storage = {
  // Obtener todas las órdenes
  async getOrders(): Promise<Order[]> {
    if (isProduction) {
      if (!redis) {
        console.error('⚠️ Redis no configurado en producción. Por favor configura UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN en Vercel.');
        throw new Error('Database not configured. Please contact support.');
      }
      // Producción: usar Redis
      const orders = await redis.get<Order[]>('orders');
      return orders || [];
    } else {
      // Desarrollo: usar archivo
      ensureDataDirectory();
      const data = fs.readFileSync(ordersFilePath, 'utf-8');
      return JSON.parse(data);
    }
  },

  // Guardar una nueva orden
  async saveOrder(order: Order): Promise<Order> {
    const orders = await this.getOrders();
    orders.unshift(order);

    if (isProduction) {
      if (!redis) {
        throw new Error('Database not configured. Please contact support.');
      }
      // Producción: guardar en Redis
      await redis.set('orders', orders);
      console.log('✅ Orden guardada en Redis');
    } else {
      // Desarrollo: guardar en archivo
      ensureDataDirectory();
      fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2));
      console.log('✅ Orden guardada en archivo local');
    }

    return order;
  },

  // Actualizar una orden existente
  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    const orders = await this.getOrders();
    const orderIndex = orders.findIndex((o) => o.id === id);

    if (orderIndex === -1) {
      return null;
    }

    orders[orderIndex] = { ...orders[orderIndex], ...updates };

    if (isProduction) {
      if (!redis) {
        throw new Error('Database not configured. Please contact support.');
      }
      await redis.set('orders', orders);
    } else {
      ensureDataDirectory();
      fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2));
    }

    return orders[orderIndex];
  },

  // Buscar cliente por DNI
  async findCustomerByDni(dni: string): Promise<{ found: boolean; customer?: any }> {
    const orders = await this.getOrders();
    const customerOrder = orders.find((order) => order.dni === dni);

    if (!customerOrder) {
      return { found: false };
    }

    return {
      found: true,
      customer: {
        name: customerOrder.name,
        dni: customerOrder.dni,
        phone: customerOrder.phone,
        address: customerOrder.address,
        email: customerOrder.email || '',
      },
    };
  },

  // ========== MÉTODOS DE INVENTARIO ==========

  // Obtener todas las compras de inventario
  async getInventory(): Promise<InventoryPurchase[]> {
    if (isProduction) {
      if (!redis) {
        console.error('⚠️ Redis no configurado en producción.');
        throw new Error('Database not configured. Please contact support.');
      }
      // Producción: usar Redis
      const inventory = await redis.get<InventoryPurchase[]>('inventory');
      return inventory || [];
    } else {
      // Desarrollo: usar archivo
      ensureDataDirectory();
      const data = fs.readFileSync(inventoryFilePath, 'utf-8');
      return JSON.parse(data);
    }
  },

  // Guardar una nueva compra de inventario
  async saveInventoryPurchase(purchase: InventoryPurchase): Promise<InventoryPurchase> {
    const inventory = await this.getInventory();
    inventory.unshift(purchase);

    if (isProduction) {
      if (!redis) {
        throw new Error('Database not configured. Please contact support.');
      }
      // Producción: guardar en Redis
      await redis.set('inventory', inventory);
      console.log('✅ Compra guardada en Redis');
    } else {
      // Desarrollo: guardar en archivo
      ensureDataDirectory();
      fs.writeFileSync(inventoryFilePath, JSON.stringify(inventory, null, 2));
      console.log('✅ Compra guardada en archivo local');
    }

    return purchase;
  },

  // Actualizar una compra de inventario
  async updateInventoryPurchase(updatedPurchase: InventoryPurchase): Promise<boolean> {
    const inventory = await this.getInventory();
    const purchaseIndex = inventory.findIndex((p) => p.id === updatedPurchase.id);

    if (purchaseIndex === -1) {
      return false; // No se encontró el registro
    }

    inventory[purchaseIndex] = updatedPurchase;

    if (isProduction) {
      if (!redis) {
        throw new Error('Database not configured. Please contact support.');
      }
      await redis.set('inventory', inventory);
      console.log('✅ Compra actualizada en Redis');
    } else {
      ensureDataDirectory();
      fs.writeFileSync(inventoryFilePath, JSON.stringify(inventory, null, 2));
      console.log('✅ Compra actualizada en archivo local');
    }

    return true;
  },

  // Eliminar una compra de inventario
  async deleteInventoryPurchase(id: string): Promise<boolean> {
    const inventory = await this.getInventory();
    const filteredInventory = inventory.filter((p) => p.id !== id);

    if (filteredInventory.length === inventory.length) {
      return false; // No se encontró el registro
    }

    if (isProduction) {
      if (!redis) {
        throw new Error('Database not configured. Please contact support.');
      }
      await redis.set('inventory', filteredInventory);
    } else {
      ensureDataDirectory();
      fs.writeFileSync(inventoryFilePath, JSON.stringify(filteredInventory, null, 2));
    }

    return true;
  },

  // Descontar stock del inventario
  async deductStock(productName: string, unit: string, quantityToDeduct: number): Promise<boolean> {
    const inventory = await this.getInventory();
    let remainingToDeduct = quantityToDeduct;

    // Recorrer las compras de más reciente a más antigua y descontar
    for (let i = 0; i < inventory.length && remainingToDeduct > 0; i++) {
      const purchase = inventory[i];

      for (let j = 0; j < purchase.items.length && remainingToDeduct > 0; j++) {
        const item = purchase.items[j];

        if (item.productName === productName && item.unit === unit) {
          const currentStock = (item.quantity || 0) * (item.volume || 1);

          if (currentStock > 0) {
            const deduction = Math.min(remainingToDeduct, currentStock);

            // Calcular nuevo quantity manteniendo el volume
            const newTotalStock = currentStock - deduction;
            item.quantity = Math.floor(newTotalStock / (item.volume || 1));

            remainingToDeduct -= deduction;
          }
        }
      }
    }

    // Guardar inventario actualizado
    if (isProduction) {
      if (!redis) {
        throw new Error('Database not configured. Please contact support.');
      }
      await redis.set('inventory', inventory);
    } else {
      ensureDataDirectory();
      fs.writeFileSync(inventoryFilePath, JSON.stringify(inventory, null, 2));
    }

    return remainingToDeduct === 0; // true si se pudo descontar todo
  },

  // ========== MÉTODOS DE PRODUCTOS ==========

  // Obtener todos los productos
  async getProducts(): Promise<Product[]> {
    if (isProduction) {
      if (!redis) {
        console.error('⚠️ Redis no configurado en producción.');
        throw new Error('Database not configured. Please contact support.');
      }
      // Producción: usar Redis
      const products = await redis.get<Product[]>('products');
      return products || [];
    } else {
      // Desarrollo: usar archivo
      ensureDataDirectory();
      const data = fs.readFileSync(productsFilePath, 'utf-8');
      return JSON.parse(data);
    }
  },

  // Guardar un nuevo producto
  async saveProduct(product: Product): Promise<Product> {
    const products = await this.getProducts();
    products.unshift(product);

    if (isProduction) {
      if (!redis) {
        throw new Error('Database not configured. Please contact support.');
      }
      // Producción: guardar en Redis
      await redis.set('products', products);
      console.log('✅ Producto guardado en Redis');
    } else {
      // Desarrollo: guardar en archivo
      ensureDataDirectory();
      fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
      console.log('✅ Producto guardado en archivo local');
    }

    return product;
  },

  // Actualizar un producto
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const products = await this.getProducts();
    const productIndex = products.findIndex((p) => p.id === id);

    if (productIndex === -1) {
      return null;
    }

    products[productIndex] = { ...products[productIndex], ...updates };

    if (isProduction) {
      if (!redis) {
        throw new Error('Database not configured. Please contact support.');
      }
      await redis.set('products', products);
    } else {
      ensureDataDirectory();
      fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
    }

    return products[productIndex];
  },

  // Eliminar un producto
  async deleteProduct(id: string): Promise<boolean> {
    const products = await this.getProducts();
    const filteredProducts = products.filter((p) => p.id !== id);

    if (filteredProducts.length === products.length) {
      return false; // No se encontró el producto
    }

    if (isProduction) {
      if (!redis) {
        throw new Error('Database not configured. Please contact support.');
      }
      await redis.set('products', filteredProducts);
    } else {
      ensureDataDirectory();
      fs.writeFileSync(productsFilePath, JSON.stringify(filteredProducts, null, 2));
    }

    return true;
  },

  // ========== MÉTODOS DE DEDUCCIONES DE STOCK ==========

  // Obtener todas las deducciones de stock
  async getDeductions(): Promise<StockDeduction[]> {
    if (isProduction) {
      if (!redis) {
        console.error('⚠️ Redis no configurado en producción.');
        throw new Error('Database not configured. Please contact support.');
      }
      // Producción: usar Redis
      const deductions = await redis.get<StockDeduction[]>('deductions');
      return deductions || [];
    } else {
      // Desarrollo: usar archivo
      ensureDataDirectory();
      const data = fs.readFileSync(deductionsFilePath, 'utf-8');
      return JSON.parse(data);
    }
  },

  // Guardar una nueva deducción de stock
  async saveDeduction(deduction: StockDeduction): Promise<StockDeduction> {
    const deductions = await this.getDeductions();
    deductions.unshift(deduction);

    if (isProduction) {
      if (!redis) {
        throw new Error('Database not configured. Please contact support.');
      }
      // Producción: guardar en Redis
      await redis.set('deductions', deductions);
      console.log('✅ Deducción guardada en Redis');
    } else {
      // Desarrollo: guardar en archivo
      ensureDataDirectory();
      fs.writeFileSync(deductionsFilePath, JSON.stringify(deductions, null, 2));
      console.log('✅ Deducción guardada en archivo local');
    }

    return deduction;
  },

  // ========== MÉTODOS DE CIERRE DIARIO ==========

  // Obtener todos los cierres diarios
  async getDailyCloses(): Promise<DailyClose[]> {
    if (isProduction) {
      if (!redis) {
        console.error('⚠️ Redis no configurado en producción.');
        throw new Error('Database not configured. Please contact support.');
      }
      // Producción: usar Redis
      const dailyCloses = await redis.get<DailyClose[]>('dailyCloses');
      return dailyCloses || [];
    } else {
      // Desarrollo: usar archivo
      ensureDataDirectory();
      const data = fs.readFileSync(dailyClosesFilePath, 'utf-8');
      return JSON.parse(data);
    }
  },

  // Guardar un nuevo cierre diario
  async saveDailyClose(dailyClose: DailyClose): Promise<DailyClose> {
    const dailyCloses = await this.getDailyCloses();
    dailyCloses.unshift(dailyClose);

    if (isProduction) {
      if (!redis) {
        throw new Error('Database not configured. Please contact support.');
      }
      // Producción: guardar en Redis
      await redis.set('dailyCloses', dailyCloses);
      console.log('✅ Cierre diario guardado en Redis');
    } else {
      // Desarrollo: guardar en archivo
      ensureDataDirectory();
      fs.writeFileSync(dailyClosesFilePath, JSON.stringify(dailyCloses, null, 2));
      console.log('✅ Cierre diario guardado en archivo local');
    }

    return dailyClose;
  },

  // Eliminar un cierre diario
  async deleteDailyClose(id: string): Promise<boolean> {
    const dailyCloses = await this.getDailyCloses();
    const filteredCloses = dailyCloses.filter((c) => c.id !== id);

    if (filteredCloses.length === dailyCloses.length) {
      return false; // No se encontró el cierre
    }

    if (isProduction) {
      if (!redis) {
        throw new Error('Database not configured. Please contact support.');
      }
      await redis.set('dailyCloses', filteredCloses);
    } else {
      ensureDataDirectory();
      fs.writeFileSync(dailyClosesFilePath, JSON.stringify(filteredCloses, null, 2));
    }

    return true;
  },

  // ========== CUPONES ==========

  // Obtener todos los cupones
  async getCoupons(): Promise<any[]> {
    if (isProduction) {
      if (!redis) {
        console.error('⚠️ Redis no configurado en producción');
        throw new Error('Database not configured. Please contact support.');
      }
      const coupons = await redis.get<any[]>('coupons');
      return coupons || [];
    } else {
      ensureDataDirectory();
      const data = fs.readFileSync(couponsFilePath, 'utf-8');
      return JSON.parse(data);
    }
  },

  // Guardar un nuevo cupón
  async saveCoupon(coupon: any): Promise<any> {
    const coupons = await this.getCoupons();
    coupons.unshift(coupon);

    if (isProduction) {
      if (!redis) {
        throw new Error('Database not configured. Please contact support.');
      }
      await redis.set('coupons', coupons);
    } else {
      ensureDataDirectory();
      fs.writeFileSync(couponsFilePath, JSON.stringify(coupons, null, 2));
    }

    return coupon;
  },

  // Actualizar todos los cupones (para marcar como usado)
  async updateCoupons(coupons: any[]): Promise<void> {
    if (isProduction) {
      if (!redis) {
        throw new Error('Database not configured. Please contact support.');
      }
      await redis.set('coupons', coupons);
    } else {
      ensureDataDirectory();
      fs.writeFileSync(couponsFilePath, JSON.stringify(coupons, null, 2));
    }
  },

  // ========== PROMO 30% ==========

  async getPromo30(): Promise<any> {
    const defaultData = { active: true, count: 0, limit: 30, orders: [] };
    if (isProduction) {
      if (!redis) throw new Error('Database not configured.');
      const data = await redis.get<any>('promo30');
      return data || defaultData;
    } else {
      ensureDataDirectory();
      const data = fs.readFileSync(promo30FilePath, 'utf-8');
      return JSON.parse(data);
    }
  },

  async savePromo30(data: any): Promise<void> {
    if (isProduction) {
      if (!redis) throw new Error('Database not configured.');
      await redis.set('promo30', data);
    } else {
      ensureDataDirectory();
      fs.writeFileSync(promo30FilePath, JSON.stringify(data, null, 2));
    }
  },

  async registerPromo30Order(orderInfo: { orderId: string; customerName: string; dni: string; sauces: string[] }): Promise<{ registered: boolean; newCount: number }> {
    const promo = await this.getPromo30();

    // Si ya está inactiva, no registrar
    if (!promo.active) return { registered: false, newCount: promo.count };

    // Agregar la orden
    promo.orders.push({
      ...orderInfo,
      registeredAt: new Date().toISOString(),
    });
    promo.count = promo.orders.length;

    // Desactivar si se alcanzó el límite
    if (promo.count >= promo.limit) {
      promo.active = false;
    }

    await this.savePromo30(promo);
    return { registered: true, newCount: promo.count };
  },

  // ========== PROMO FIT 30% ==========

  async getPromoFit30(): Promise<any> {
    const defaultData = { active: true, count: 0, limit: 30, orders: [] };
    if (isProduction) {
      if (!redis) throw new Error('Database not configured.');
      const data = await redis.get<any>('promoFit30');
      return data || defaultData;
    } else {
      ensureDataDirectory();
      const data = fs.readFileSync(promoFit30FilePath, 'utf-8');
      return JSON.parse(data);
    }
  },

  async savePromoFit30(data: any): Promise<void> {
    if (isProduction) {
      if (!redis) throw new Error('Database not configured.');
      await redis.set('promoFit30', data);
    } else {
      ensureDataDirectory();
      fs.writeFileSync(promoFit30FilePath, JSON.stringify(data, null, 2));
    }
  },

  async registerPromoFit30Order(orderInfo: { orderId: string; customerName: string; dni: string; productId: string }): Promise<{ registered: boolean; newCount: number }> {
    const promo = await this.getPromoFit30();

    if (!promo.active) return { registered: false, newCount: promo.count };

    promo.orders.push({
      ...orderInfo,
      registeredAt: new Date().toISOString(),
    });
    promo.count = promo.orders.length;

    if (promo.count >= promo.limit) {
      promo.active = false;
    }

    await this.savePromoFit30(promo);
    return { registered: true, newCount: promo.count };
  },
};
