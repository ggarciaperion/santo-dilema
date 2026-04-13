// Motor de detección de combos — Santo Dilema
// Detecta automáticamente combinaciones de productos y calcula descuentos

export const FIT_PRODUCT_IDS = [
  'ensalada-clasica',
  'ensalada-proteica',
  'ensalada-caesar',
  'ensalada-mediterranea',
  'cobb-supreme-bowl',
  'crispy-chicken-bowl',
  'pasta-power-bowl',
];

export interface ComboRule {
  id: string;
  name: string;
  emoji: string;
  description: string;
  // Cada string es un product ID o 'ANY_FIT' (cualquier ensalada)
  requiredProducts: string[];
  price: number;    // precio final del combo
  priority: number; // mayor = se evalúa primero (evita conflictos)
}

export const COMBO_RULES: ComboRule[] = [
  {
    id: 'combo-4',
    name: 'Combo Santo Dilema',
    emoji: '🔥',
    description: 'Dúo Dilema + Ensalada + Dúo de Tacos',
    requiredProducts: ['duo-dilema', 'ANY_FIT', 'taco-duo'],
    price: 76,
    priority: 4,
  },
  {
    id: 'combo-3',
    name: 'Combo Alitas',
    emoji: '🍗',
    description: 'Pequeño Dilema + Dúo Dilema',
    requiredProducts: ['pequeno-dilema', 'duo-dilema'],
    price: 52,
    priority: 3,
  },
  {
    id: 'combo-2',
    name: 'Combo Especial',
    emoji: '🌮',
    description: 'Pequeño Dilema + Dúo de Tacos',
    requiredProducts: ['pequeno-dilema', 'taco-duo'],
    price: 42,
    priority: 2,
  },
  {
    id: 'combo-1',
    name: 'Combo Perfecto',
    emoji: '🥗',
    description: 'Pequeño Dilema + Ensalada',
    requiredProducts: ['pequeno-dilema', 'ANY_FIT'],
    price: 40,
    priority: 1,
  },
  {
    id: 'combo-chiguan',
    name: 'Combo Chiguan',
    emoji: '🔥',
    description: '4 Alitas + Crunch Supreme Taco',
    requiredProducts: ['chiguan-alitas', 'taco-duo'],
    price: 20,
    priority: 2,
  },
];

export interface AppliedCombo {
  rule: ComboRule;
  resolvedProducts: string[]; // IDs reales usados (ANY_FIT resuelto a producto específico)
  originalTotal: number;      // suma de precios originales de los productos del combo
  comboPrice: number;         // precio final del combo
  savings: number;            // ahorro = originalTotal - comboPrice
}

export interface ComboResult {
  appliedCombos: AppliedCombo[];
  totalSavings: number;
}

interface OrderItem {
  productId: string;
  quantity: number;
  originalPrice?: number; // precio antes de promos individuales
  finalPrice?: number;
}

// Precios de referencia para el cálculo de ahorro
const REFERENCE_PRICES: Record<string, number> = {
  'pequeno-dilema': 22,
  'duo-dilema': 34,
  'santo-pecado': 47,
  'taco-duo': 24.90,
  'chiguan-alitas': 12,
  'ensalada-clasica': 18.50,
  'ensalada-proteica': 20,
  'ensalada-caesar': 20,
  'ensalada-mediterranea': 23.50,
  'cobb-supreme-bowl': 23.50,
  'crispy-chicken-bowl': 22.50,
  'pasta-power-bowl': 22.50,
};

function resolveFromPool(
  required: string,
  pool: Map<string, number>,
  tentative: Map<string, number>
): string | null {
  const candidates = required === 'ANY_FIT' ? FIT_PRODUCT_IDS : [required];
  for (const id of candidates) {
    const available = (pool.get(id) ?? 0) - (tentative.get(id) ?? 0);
    if (available > 0) return id;
  }
  return null;
}

/**
 * Detecta combos en una lista de órdenes usando un algoritmo greedy por prioridad.
 * Los combos de mayor prioridad se evalúan primero para evitar conflictos.
 * Cada producto solo puede pertenecer a un combo a la vez.
 */
export function detectCombos(orders: OrderItem[]): ComboResult {
  if (orders.length === 0) return { appliedCombos: [], totalSavings: 0 };

  // Pool de disponibilidad: productId → cantidad
  const pool = new Map<string, number>();
  const unitPrices = new Map<string, number>();

  for (const order of orders) {
    pool.set(order.productId, (pool.get(order.productId) ?? 0) + order.quantity);
    // Precio base (antes de promos individuales) para calcular ahorro real
    const price =
      order.originalPrice ??
      order.finalPrice ??
      REFERENCE_PRICES[order.productId] ??
      0;
    unitPrices.set(order.productId, price);
  }

  const appliedCombos: AppliedCombo[] = [];

  // Evaluar reglas de mayor a menor prioridad
  const sortedRules = [...COMBO_RULES].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    // Aplicar esta regla tantas veces como sea posible (ej: 2x combo-1)
    while (true) {
      const tentative = new Map<string, number>();
      const resolved: string[] = [];
      let canApply = true;

      for (const required of rule.requiredProducts) {
        const id = resolveFromPool(required, pool, tentative);
        if (!id) { canApply = false; break; }
        resolved.push(id);
        tentative.set(id, (tentative.get(id) ?? 0) + 1);
      }

      if (!canApply) break;

      // Confirmar: consumir del pool
      for (const [id, count] of tentative) {
        pool.set(id, (pool.get(id) ?? 0) - count);
      }

      const originalTotal = resolved.reduce(
        (sum, id) => sum + (unitPrices.get(id) ?? REFERENCE_PRICES[id] ?? 0),
        0
      );

      appliedCombos.push({
        rule,
        resolvedProducts: resolved,
        originalTotal,
        comboPrice: rule.price,
        savings: originalTotal - rule.price,
      });
    }
  }

  const totalSavings = appliedCombos.reduce((sum, c) => sum + c.savings, 0);

  return { appliedCombos, totalSavings };
}
