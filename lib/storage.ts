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

// Solo inicializar filesystem en desarrollo
if (!isProduction) {
  fs = require('fs');
  path = require('path');
  dataDir = path.join(process.cwd(), 'data');
  ordersFilePath = path.join(dataDir, 'orders.json');
  inventoryFilePath = path.join(dataDir, 'inventory.json');
  productsFilePath = path.join(dataDir, 'products.json');
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
    unitCost: number;
    total: number;
  }>;
  totalAmount: number;
  notes?: string;
  purchaseDate: string;
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
};
