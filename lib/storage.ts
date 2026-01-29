import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';

// Configuración de Redis para producción (Upstash)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Rutas de archivos para desarrollo local
const dataDir = path.join(process.cwd(), 'data');
const ordersFilePath = path.join(dataDir, 'orders.json');

// Asegurar que el directorio data existe en desarrollo
function ensureDataDirectory() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(ordersFilePath)) {
    fs.writeFileSync(ordersFilePath, JSON.stringify([], null, 2));
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

export const storage = {
  // Obtener todas las órdenes
  async getOrders(): Promise<Order[]> {
    if (redis) {
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

    if (redis) {
      // Producción: guardar en Redis
      await redis.set('orders', orders);
    } else {
      // Desarrollo: guardar en archivo
      ensureDataDirectory();
      fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2));
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

    if (redis) {
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
};
