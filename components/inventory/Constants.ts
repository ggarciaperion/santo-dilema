// ============================================
// INVENTORY SYSTEM - CONSTANTS & LABELS
// ============================================

import type { UnitOfMeasure, ItemCategory, PurchaseStatus, PaymentStatus, PaymentMethod, MovementType } from "@/types/inventory";

export const UNIT_LABELS: Record<UnitOfMeasure, string> = {
  kg: "Kilogramos",
  g: "Gramos",
  l: "Litros",
  ml: "Mililitros",
  unidad: "Unidades",
  paquete: "Paquetes",
  caja: "Cajas",
  bolsa: "Bolsas",
  docena: "Docenas",
  lata: "Latas",
  frasco: "Frascos",
  sobre: "Sobres",
  bandeja: "Bandejas",
  atado: "Atados",
  porcion: "Porciones",
};

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  proteinas: "🍗 Proteínas",
  vegetales: "🥬 Vegetales",
  frutas: "🍎 Frutas",
  lacteos: "🥛 Lácteos",
  abarrotes: "🛒 Abarrotes",
  "salsas-aderezos": "🍯 Salsas y Aderezos",
  bebidas: "🥤 Bebidas",
  empaques: "📦 Empaques",
  desechables: "🥤 Desechables",
  limpieza: "🧹 Limpieza",
  "gas-servicios": "⚡ Gas y Servicios",
  equipamiento: "🔧 Equipamiento",
  otros: "📋 Otros",
};

export const CATEGORY_COLORS: Record<ItemCategory, string> = {
  proteinas: "bg-orange-500/10 border-orange-500/50 text-orange-400",
  vegetales: "bg-green-500/10 border-green-500/50 text-green-400",
  frutas: "bg-pink-500/10 border-pink-500/50 text-pink-400",
  lacteos: "bg-blue-500/10 border-blue-500/50 text-blue-400",
  abarrotes: "bg-amber-500/10 border-amber-500/50 text-amber-400",
  "salsas-aderezos": "bg-yellow-500/10 border-yellow-500/50 text-yellow-400",
  bebidas: "bg-cyan-500/10 border-cyan-500/50 text-cyan-400",
  empaques: "bg-gray-500/10 border-gray-500/50 text-gray-400",
  desechables: "bg-gray-500/10 border-gray-500/50 text-gray-400",
  limpieza: "bg-purple-500/10 border-purple-500/50 text-purple-400",
  "gas-servicios": "bg-red-500/10 border-red-500/50 text-red-400",
  equipamiento: "bg-indigo-500/10 border-indigo-500/50 text-indigo-400",
  otros: "bg-gray-500/10 border-gray-500/50 text-gray-400",
};

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  draft: "Borrador",
  ordered: "Pedido",
  received: "Recibido",
  partial: "Parcial",
  cancelled: "Cancelado",
};

export const PURCHASE_STATUS_COLORS: Record<PurchaseStatus, string> = {
  draft: "bg-gray-500/20 border-gray-500 text-gray-400",
  ordered: "bg-blue-500/20 border-blue-500 text-blue-400",
  received: "bg-green-500/20 border-green-500 text-green-400",
  partial: "bg-yellow-500/20 border-yellow-500 text-yellow-400",
  cancelled: "bg-red-500/20 border-red-500 text-red-400",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  partial: "Parcial",
  paid: "Pagado",
  overdue: "Vencido",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: "bg-yellow-500/20 border-yellow-500 text-yellow-400",
  partial: "bg-orange-500/20 border-orange-500 text-orange-400",
  paid: "bg-green-500/20 border-green-500 text-green-400",
  overdue: "bg-red-500/20 border-red-500 text-red-400",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  yape: "Yape",
  plin: "Plin",
  tarjeta: "Tarjeta",
  credito: "Crédito",
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  purchase: "Compra",
  sale: "Venta",
  adjustment: "Ajuste",
  waste: "Merma",
  return: "Devolución",
  transfer: "Transferencia",
  production: "Producción",
};

export const MOVEMENT_TYPE_COLORS: Record<MovementType, string> = {
  purchase: "bg-green-500/20 border-green-500 text-green-400",
  sale: "bg-blue-500/20 border-blue-500 text-blue-400",
  adjustment: "bg-purple-500/20 border-purple-500 text-purple-400",
  waste: "bg-red-500/20 border-red-500 text-red-400",
  return: "bg-orange-500/20 border-orange-500 text-orange-400",
  transfer: "bg-cyan-500/20 border-cyan-500 text-cyan-400",
  production: "bg-indigo-500/20 border-indigo-500 text-indigo-400",
};
