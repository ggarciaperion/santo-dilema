"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { isBusinessOpen, getNextOpenMessage } from "../utils/businessHours";
import { detectCombos } from "../../lib/combos";
import WhatsAppButton from "../components/WhatsAppButton";
import BannerCarousel from "../components/BannerCarousel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompletedOrder {
  productId: string;
  quantity: number;
  salsas: string[];
  complementIds: string[];
  finalPrice?: number;
  originalPrice?: number;
  discountApplied?: boolean;
  category?: string;
  comboGroupId?: string;
  comboName?: string;
  comboPrice?: number;
  comboOriginalTotal?: number;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const flavors = [
  {
    id: "santo-crujiente",
    name: "CRUNCH SUPREME TACO",
    tagline: "Crujiente y tentador",
    description:
      "Pollo crispy dorado, lechuga fresca, pico de gallo, aros de cebolla crunchy, acompañado de aioli y salsa BBQ cremosa, todo envuelto en tortilla soft.",
    image: "/crunch.png",
  },
  {
    id: "tex-dilema",
    name: "TEX SUPREME TACO",
    tagline: "Con ese toque tex-mex",
    description:
      "Pollo crispy, lechuga fresca, guacamole cremoso, pico de gallo, aros de cebolla crunchy y un toque de cilantro dressing, servido en tortilla soft.",
    image: "/tex.png",
  },
  {
    id: "santo-bacon",
    name: "BACON DELUXE TACO",
    tagline: "El que lo prueba, repite",
    description:
      "Pollo crispy, bacon crocante, queso cheddar fundido, pimientos y cebolla salteados, lechuga fresca, pico de gallo y salsa cremosa especial, envuelto en tortilla soft.",
    image: "/bacon.png",
  },
];

const TACO_DUO_PRODUCT = {
  id: "taco-duo",
  name: "Dúo de Tacos",
  description: "Dúo de Tacos",
  price: 24.9,
  image: "/tacoinicio.png",
  category: "fat" as const,
};

const complementos = [
  { id: "nachos", name: "Nachos", emoji: "🌽" },
  { id: "chifles", name: "Chifles", emoji: "🍌" },
  { id: "papas-fritas", name: "Papas fritas", emoji: "🍟" },
];

const bebidas = [
  { id: "coca-cola", name: "Coca Cola 500ml", emoji: "🥤", price: 4.00 },
  { id: "inka-cola", name: "Inka Cola 500ml", emoji: "🥤", price: 4.00 },
  { id: "sprite", name: "Sprite 500ml", emoji: "🥤", price: 4.00 },
  { id: "fanta", name: "Fanta 500ml", emoji: "🥤", price: 4.00 },
  { id: "agua-mineral", name: "Agua mineral", emoji: "💧", price: 4.00 },
];

const SESSION_KEY = "santo-dilema-orders";
const BEBIDAS_KEY = "santo-dilema-tacos-bebidas";

// Lookup de productos de otras páginas para mostrar en "Tu orden"
const CROSS_PRODUCTS: Record<string, { name: string; image: string; price: number }> = {
  "pequeno-dilema":      { name: "Pequeño Dilema",       image: "/pequeno-dilema.png?v=3",    price: 22.00 },
  "duo-dilema":          { name: "Dúo Dilema",            image: "/duo-dilema.png?v=3",        price: 34.00 },
  "santo-pecado":        { name: "Santo Pecado",          image: "/todos-pecan.png?v=3",       price: 47.00 },
  "ensalada-clasica":    { name: "Clásica Fresh Bowl",    image: "/clasica-fresh-bowl.png",    price: 18.50 },
  "ensalada-proteica":   { name: "César Power Bowl",      image: "/cesar-power-bowl.png",      price: 22.50 },
  "ensalada-caesar":     { name: "Protein Fit Bowl",      image: "/protein-fit-bowl.png",      price: 23.50 },
  "ensalada-mediterranea":{ name: "Tuna Fresh Bowl",      image: "/4.png",                     price: 23.50 },
  "cobb-supreme-bowl":   { name: "Cobb Supreme Bowl",     image: "/cobb.png",                  price: 23.50 },
  "crispy-chicken-bowl": { name: "Crispy Chicken Bowl",   image: "/crispy.png",                price: 22.50 },
  "pasta-power-bowl":    { name: "Pasta Power Bowl",      image: "/pasta.png",                 price: 22.50 },
};

const SALSAS_NAMES: Record<string, string> = {
  "barbecue":       "BBQ ahumada",
  "buffalo-picante":"Santo Picante",
  "ahumada":        "Acevichada Imperial",
  "parmesano-ajo":  "Crispy Celestial",
  "anticuchos":     "Parrillera",
  "honey-mustard":  "Honey mustard",
  "teriyaki":       "Oriental Teriyaki",
  "macerichada":    "Sweet & Sour",
};

function getFlavorName(id: string): string {
  return flavors.find((f) => f.id === id)?.name ?? id;
}

function getComplementoName(id: string): string {
  return complementos.find((c) => c.id === id)?.name ?? id;
}

function getComplementoEmoji(id: string): string {
  return complementos.find((c) => c.id === id)?.emoji ?? "";
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TacosPage() {
  const router = useRouter();
  const { addToCart, clearCart } = useCart();

  const [isOpen, setIsOpen] = useState(isBusinessOpen());
  const [menuStock, setMenuStock] = useState<Record<string, boolean>>({});
  const [menuPrices, setMenuPrices] = useState<Record<string, number>>({});
  const [menuDiscounts, setMenuDiscounts] = useState<Record<string, number>>({});

  // Orders that belong to other categories (fit/fat from other pages)
  const [crossCategoryOrders, setCrossCategoryOrders] = useState<CompletedOrder[]>([]);
  // Taco orders managed on this page
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Bebidas
  const [bebidaQty, setBebidaQty] = useState<Record<string, number>>({});

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [taco1, setTaco1] = useState<string | null>(null);
  const [taco2, setTaco2] = useState<string | null>(null);
  const [selectedComplemento, setSelectedComplemento] = useState<string | null>(null);
  const [showBebidasModal, setShowBebidasModal] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOrderIndex, setDeleteOrderIndex] = useState<number | null>(null);

  // ── On mount: check hours + load sessionStorage ──────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setIsOpen(isBusinessOpen()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/menu-stock")
      .then((r) => r.json())
      .then((data) => setMenuStock(data))
      .catch(() => {});
    fetch("/api/menu-prices")
      .then((r) => r.json())
      .then((data) => setMenuPrices(data))
      .catch(() => {});
    fetch("/api/menu-discounts")
      .then((r) => r.json())
      .then((data) => setMenuDiscounts(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const all: CompletedOrder[] = JSON.parse(raw);
        const cross = all.filter((o) => o.category !== "taco");
        const tacos = all.filter((o) => o.category === "taco");
        setCrossCategoryOrders(cross);
        setCompletedOrders(tacos);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BEBIDAS_KEY);
      if (raw) setBebidaQty(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(BEBIDAS_KEY, JSON.stringify(bebidaQty));
    } catch { /* ignore */ }
  }, [bebidaQty]);

  // ── Persist orders to sessionStorage when they change ────────────────────
  useEffect(() => {
    try {
      const all = [...crossCategoryOrders, ...completedOrders];
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(all));
    } catch {
      // ignore
    }
  }, [crossCategoryOrders, completedOrders]);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openModal = useCallback((flavorId?: string) => {
    setTaco1(flavorId ?? null);
    setTaco2(null);
    setSelectedComplemento(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setTaco1(null);
    setTaco2(null);
    setSelectedComplemento(null);
    setShowBebidasModal(false);
  }, []);

  const handleFlavorClick = useCallback(
    (id: string) => {
      if (taco1 === null) {
        setTaco1(id);
        return;
      }
      if (taco2 === null) {
        setTaco2(id);
        return;
      }
      // Both slots filled — replace taco2
      setTaco2(id);
    },
    [taco1, taco2]
  );

  const handleAddOrder = useCallback(() => {
    if (!taco1 || !taco2 || !selectedComplemento) return;
    const realPrice = menuPrices["taco-duo"] || TACO_DUO_PRODUCT.price;
    const effectivePrice = menuDiscounts["taco-duo"] || realPrice;
    const newOrder: CompletedOrder = {
      productId: "taco-duo",
      quantity: 1,
      salsas: [taco1, taco2],
      complementIds: [selectedComplemento],
      finalPrice: effectivePrice,
      originalPrice: realPrice,
      category: "taco",
    };
    setCompletedOrders((prev) => [...prev, newOrder]);
    closeModal();
    setTimeout(() => {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3200);
    }, 450);
    setTimeout(() => {
      document.getElementById('tu-orden-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 750);
  }, [taco1, taco2, selectedComplemento, menuPrices, menuDiscounts, closeModal]);

  const handleDeleteOrder = useCallback((index: number) => {
    setDeleteOrderIndex(index);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteCrossOrder = useCallback((index: number) => {
    setCrossCategoryOrders((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDeleteComboGroup = useCallback((groupId: string) => {
    setCrossCategoryOrders((prev) => prev.filter((o) => o.comboGroupId !== groupId));
    setCompletedOrders((prev) => prev.filter((o) => o.comboGroupId !== groupId));
  }, []);

  const confirmDeleteOrder = useCallback(() => {
    if (deleteOrderIndex === null) return;
    setCompletedOrders((prev) => prev.filter((_, i) => i !== deleteOrderIndex));
    setShowDeleteModal(false);
    setDeleteOrderIndex(null);
  }, [deleteOrderIndex]);

  const cancelDeleteOrder = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteOrderIndex(null);
  }, []);

  const handleCheckout = useCallback(() => {
    const all = [...crossCategoryOrders, ...completedOrders];
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(all));
    clearCart();
    completedOrders.forEach((order) => {
      const effectivePrice = menuDiscounts["taco-duo"] || menuPrices["taco-duo"] || TACO_DUO_PRODUCT.price;
      addToCart({ ...TACO_DUO_PRODUCT, price: effectivePrice }, order.quantity);
    });
    bebidas.forEach((b) => {
      const qty = bebidaQty[b.id] || 0;
      if (qty > 0) {
        addToCart({ id: b.id, name: b.name, description: b.name, price: b.price, image: b.emoji, category: "bebida" as const }, qty);
      }
    });
    router.push("/checkout");
  }, [crossCategoryOrders, completedOrders, bebidaQty, menuPrices, menuDiscounts, clearCart, addToCart, router]);

  // ── Derived values ────────────────────────────────────────────────────────
  const duoBasePrice = TACO_DUO_PRODUCT.price; // 24.90 default
  const duoRealPrice = menuPrices["taco-duo"] || duoBasePrice;
  const duoOfferPrice = menuDiscounts["taco-duo"] || null;
  const duoEffectivePrice = duoOfferPrice ?? duoRealPrice;

  const bebidasTotal = bebidas.reduce((acc, b) => acc + (bebidaQty[b.id] || 0) * b.price, 0);

  // Detección de combos: combinar órdenes de otras páginas + tacos actuales
  const allOrders = useMemo(
    () => [...crossCategoryOrders, ...completedOrders],
    [crossCategoryOrders, completedOrders]
  );
  const comboResult = useMemo(() => detectCombos(allOrders), [allOrders]);
  const hasComboDiscount = comboResult.appliedCombos.length > 0;
  const comboDiscountAmount = comboResult.totalSavings;

  const baseTotal = completedOrders.length * duoEffectivePrice + bebidasTotal +
    crossCategoryOrders.reduce((sum, o) => sum + (o.finalPrice ?? o.originalPrice ?? 0) * o.quantity, 0);
  const total = hasComboDiscount ? baseTotal - comboDiscountAmount : baseTotal;
  const duoCount = completedOrders.length;
  const hasAnyOrder = completedOrders.length > 0 || crossCategoryOrders.length > 0 || bebidasTotal > 0;

  // ── Step indicator for modal ──────────────────────────────────────────────
  const step1Done = taco1 !== null;
  const step2Active = step1Done && taco2 === null;
  const step2Done = taco2 !== null;
  const bothSelected = step1Done && step2Done;
  const allSelected = bothSelected && selectedComplemento !== null;

  return (
    <div className="min-h-screen bg-black md:bg-transparent relative overflow-visible">

      {/* Toast de orden agregada */}
      {showSuccessToast && (
        <div
          className="fixed bottom-24 left-1/2 z-[400] pointer-events-none"
          style={{ animation: 'toastLifecycle 3.2s ease forwards' }}
        >
          <div className="bg-gray-900/95 border border-emerald-400/60 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-2xl shadow-emerald-500/20 backdrop-blur-sm">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm whitespace-nowrap">¡Orden agregada!</p>
              <p className="text-emerald-300/70 text-xs whitespace-nowrap">Dúo de Tacos</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Iconos decorativos de fondo - México/Tacos ──────────────────────── */}
      <div className="fixed inset-0 overflow-hidden opacity-15 pointer-events-none z-0">

        {/* === TACOS === */}
        {/* Taco XL izquierda arriba */}
        <svg className="absolute top-16 left-8 w-28 h-28 text-emerald-400 float-slow" viewBox="0 0 100 72" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 58 Q5 16 50 7 Q95 16 95 58" strokeWidth="2.5"/><line x1="5" y1="58" x2="95" y2="58" strokeWidth="2.5"/>
          <path d="M15 55 Q28 44 42 50 Q56 42 68 50 Q80 44 85 55" strokeWidth="1.8"/>
          <circle cx="35" cy="46" r="6" fill="currentColor" opacity="0.3"/><circle cx="55" cy="42" r="6" fill="currentColor" opacity="0.3"/><circle cx="72" cy="47" r="5" fill="currentColor" opacity="0.3"/>
        </svg>

        {/* Taco mediano centro-arriba */}
        <svg className="absolute top-28 left-1/3 w-20 h-20 text-teal-400 sway-right" viewBox="0 0 100 72" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 58 Q8 20 50 10 Q92 20 92 58" strokeWidth="2.5"/><line x1="8" y1="58" x2="92" y2="58" strokeWidth="2.5"/>
          <circle cx="38" cy="47" r="5" fill="currentColor" opacity="0.3"/><circle cx="58" cy="43" r="5" fill="currentColor" opacity="0.3"/><circle cx="72" cy="48" r="4" fill="currentColor" opacity="0.3"/>
        </svg>

        {/* Taco pequeño derecha tercio */}
        <svg className="absolute top-1/3 right-24 w-14 h-14 text-emerald-300 bounce-subtle" viewBox="0 0 100 72" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M8 58 Q8 20 50 10 Q92 20 92 58" strokeWidth="2.5"/><line x1="8" y1="58" x2="92" y2="58" strokeWidth="2.5"/>
          <circle cx="40" cy="46" r="5" fill="currentColor" opacity="0.3"/>
        </svg>

        {/* Taco XL abajo derecha */}
        <svg className="absolute bottom-16 right-8 w-32 h-32 text-emerald-400 sway-left" viewBox="0 0 100 72" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 58 Q5 16 50 7 Q95 16 95 58" strokeWidth="2.5"/><line x1="5" y1="58" x2="95" y2="58" strokeWidth="2.5"/>
          <circle cx="30" cy="48" r="7" fill="currentColor" opacity="0.25"/><circle cx="52" cy="43" r="7" fill="currentColor" opacity="0.25"/><circle cx="72" cy="48" r="6" fill="currentColor" opacity="0.25"/>
        </svg>

        {/* Taco mediano centro izquierda */}
        <svg className="absolute top-1/2 left-4 w-18 h-18 text-emerald-500 float-medium" viewBox="0 0 100 72" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 58 Q8 20 50 10 Q92 20 92 58" strokeWidth="2.5"/><line x1="8" y1="58" x2="92" y2="58" strokeWidth="2.5"/>
          <circle cx="38" cy="47" r="6" fill="currentColor" opacity="0.3"/><circle cx="62" cy="43" r="5" fill="currentColor" opacity="0.3"/>
        </svg>

        {/* Taco chico centro derecha */}
        <svg className="absolute top-2/3 right-16 w-12 h-12 text-teal-300 pulse-slow" viewBox="0 0 100 72" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M8 58 Q8 20 50 10 Q92 20 92 58" strokeWidth="2.5"/><line x1="8" y1="58" x2="92" y2="58" strokeWidth="2.5"/>
        </svg>

        {/* Taco grande abajo centro */}
        <svg className="absolute bottom-24 left-1/4 w-24 h-24 text-emerald-300 float-slow" viewBox="0 0 100 72" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 58 Q5 16 50 7 Q95 16 95 58" strokeWidth="2.5"/><line x1="5" y1="58" x2="95" y2="58" strokeWidth="2.5"/>
          <path d="M15 55 Q30 45 45 51 Q60 43 75 51 Q85 45 88 55" strokeWidth="1.8"/>
          <circle cx="42" cy="45" r="6" fill="currentColor" opacity="0.25"/><circle cx="62" cy="41" r="5" fill="currentColor" opacity="0.25"/>
        </svg>

        {/* Taco tiny top center */}
        <svg className="absolute top-10 left-1/2 w-10 h-10 text-emerald-400 bounce-subtle" viewBox="0 0 100 72" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M8 58 Q8 20 50 10 Q92 20 92 58" strokeWidth="3"/><line x1="8" y1="58" x2="92" y2="58" strokeWidth="3"/>
        </svg>

        {/* === CHILES === */}
        {/* Chile XL derecha arriba */}
        <svg className="absolute top-20 right-16 w-24 h-24 text-emerald-500 sway-right" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M50 24 Q48 32 46 44 Q44 56 44 66 Q44 76 48 82 Q52 82 56 76 Q56 66 56 56 Q54 44 52 32 Q50 24 50 24Z"/>
          <path d="M50 21 Q52 17 56 17 Q59 17 60 20" strokeWidth="2"/>
        </svg>

        {/* Chile mediano izquierda centro */}
        <svg className="absolute top-2/5 left-24 w-16 h-16 text-teal-400 sway-left" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M50 28 Q48 35 46 46 Q44 58 44 68 Q44 78 48 82 Q52 82 56 78 Q56 68 56 58 Q54 46 52 35 Q50 28 50 28Z"/>
          <path d="M50 25 Q53 20 57 20" strokeWidth="2"/>
        </svg>

        {/* Chile chico top derecha */}
        <svg className="absolute top-2/3 right-1/3 w-12 h-12 text-emerald-300 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M50 28 Q48 35 46 46 Q44 58 44 68 Q44 78 48 82 Q52 82 56 78 Q56 68 56 58 Q54 46 52 35 Q50 28 50 28Z"/>
          <path d="M50 25 Q53 20 57 20" strokeWidth="2"/>
        </svg>

        {/* Chile grande abajo izquierda */}
        <svg className="absolute bottom-28 left-8 w-20 h-20 text-emerald-400 float-medium" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M50 24 Q48 32 46 44 Q44 56 44 66 Q44 76 48 82 Q52 82 56 76 Q56 66 56 56 Q54 44 52 32 Q50 24 50 24Z"/>
          <path d="M50 21 Q52 17 56 17 Q59 17 60 20" strokeWidth="2"/>
        </svg>

        {/* Chile tiny centro abajo */}
        <svg className="absolute bottom-1/3 right-1/4 w-8 h-8 text-teal-500 pulse-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M50 28 Q47 38 45 52 Q44 65 44 74 Q44 80 48 83 Q52 83 56 80 Q56 74 56 65 Q55 52 53 38 Q50 28 50 28Z"/>
        </svg>

        {/* === AGUACATES === */}
        {/* Aguacate XL centro izquierda */}
        <svg className="absolute top-1/2 left-12 w-24 h-24 text-emerald-400 float-medium" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="50" cy="55" rx="28" ry="35"/><ellipse cx="50" cy="55" rx="14" ry="17"/>
          <circle cx="50" cy="50" r="7" fill="currentColor" opacity="0.3"/>
          <path d="M48 23 Q50 18 52 23" strokeWidth="2.5"/>
        </svg>

        {/* Aguacate mediano arriba centro */}
        <svg className="absolute top-24 right-1/3 w-16 h-16 text-teal-300 sway-left" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="50" cy="55" rx="28" ry="35"/><ellipse cx="50" cy="55" rx="12" ry="15"/>
          <circle cx="50" cy="50" r="6" fill="currentColor" opacity="0.3"/>
        </svg>

        {/* Aguacate chico abajo derecha */}
        <svg className="absolute bottom-36 right-28 w-12 h-12 text-emerald-300 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <ellipse cx="50" cy="55" rx="28" ry="35"/><circle cx="50" cy="52" r="8" fill="currentColor" opacity="0.3"/>
        </svg>

        {/* === LIMAS / LIMONES === */}
        {/* Lima XL izquierda abajo */}
        <svg className="absolute bottom-32 left-20 w-20 h-20 text-lime-400 sway-left" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="50" cy="50" r="24"/><path d="M50 26 L50 74 M26 50 L74 50" strokeWidth="1" opacity="0.6"/>
          <circle cx="50" cy="50" r="14" opacity="0.3"/>
          <path d="M46 24 Q50 18 54 24" strokeWidth="2"/>
        </svg>

        {/* Lima mediana arriba izquierda */}
        <svg className="absolute top-36 left-1/4 w-14 h-14 text-lime-300 float-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="50" cy="50" r="24"/><path d="M50 26 L50 74 M26 50 L74 50" strokeWidth="1" opacity="0.5"/>
          <path d="M46 24 Q50 18 54 24" strokeWidth="2"/>
        </svg>

        {/* Lima chica centro */}
        <svg className="absolute top-3/5 left-2/5 w-10 h-10 text-lime-400 pulse-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="50" cy="50" r="24"/><path d="M50 26 L50 74 M26 50 L74 50" strokeWidth="1" opacity="0.5"/>
        </svg>

        {/* Lima tiny top right */}
        <svg className="absolute top-8 right-8 w-8 h-8 text-lime-300 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="50" cy="50" r="24"/><path d="M50 26 L50 74 M26 50 L74 50" strokeWidth="1.5" opacity="0.5"/>
        </svg>

        {/* === CACTUS === */}
        {/* Cactus XL derecha abajo */}
        <svg className="absolute bottom-40 right-14 w-24 h-24 text-emerald-500 pulse-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="50" y1="80" x2="50" y2="20"/>
          <path d="M50 45 Q35 45 35 35 Q35 25 40 25"/>
          <path d="M50 55 Q65 55 65 43 Q65 32 60 32"/>
        </svg>

        {/* Cactus mediano izquierda */}
        <svg className="absolute top-1/4 left-6 w-16 h-16 text-emerald-400 sway-right" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="50" y1="82" x2="50" y2="22"/><path d="M50 48 Q38 48 38 38 Q38 28 42 28"/>
          <path d="M50 58 Q62 58 62 46 Q62 34 58 34"/>
        </svg>

        {/* Cactus chico centro alto */}
        <svg className="absolute top-1/3 left-1/2 w-12 h-12 text-teal-400 float-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
          <line x1="50" y1="80" x2="50" y2="24"/><path d="M50 50 Q38 50 38 40 Q38 30 43 30"/>
          <path d="M50 60 Q62 60 62 48 Q62 36 57 36"/>
        </svg>

        {/* Cactus tiny abajo centro */}
        <svg className="absolute bottom-16 left-1/2 w-8 h-8 text-emerald-300 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
          <line x1="50" y1="80" x2="50" y2="24"/><path d="M50 50 Q38 50 38 40 Q38 30 42 30"/>
        </svg>

        {/* === SOMBREROS === */}
        {/* Sombrero XL centro */}
        <svg className="absolute bottom-1/4 left-1/3 w-28 h-28 text-emerald-300 float-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="50" cy="65" rx="40" ry="10"/>
          <path d="M25 65 Q30 35 50 28 Q70 35 75 65"/>
          <ellipse cx="50" cy="65" rx="20" ry="5"/>
          <path d="M30 63 Q40 56 50 58 Q60 56 70 63" strokeWidth="1.5" opacity="0.5"/>
        </svg>

        {/* Sombrero mediano arriba derecha */}
        <svg className="absolute top-12 right-1/4 w-18 h-18 text-teal-300 sway-left" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="50" cy="65" rx="40" ry="10"/><path d="M25 65 Q30 35 50 28 Q70 35 75 65"/>
          <ellipse cx="50" cy="65" rx="20" ry="5"/>
        </svg>

        {/* Sombrero chico bottom right */}
        <svg className="absolute bottom-8 right-1/3 w-14 h-14 text-emerald-400 pulse-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <ellipse cx="50" cy="65" rx="40" ry="10"/><path d="M25 65 Q30 35 50 28 Q70 35 75 65"/>
          <ellipse cx="50" cy="65" rx="20" ry="5"/>
        </svg>

        {/* Sombrero tiny top left */}
        <svg className="absolute top-6 left-1/4 w-10 h-10 text-teal-400 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
          <ellipse cx="50" cy="65" rx="40" ry="10"/><path d="M25 65 Q30 35 50 28 Q70 35 75 65"/>
        </svg>

        {/* === ESTRELLAS / STARS === */}
        {/* Estrella XL */}
        <svg className="absolute top-1/4 right-6 w-16 h-16 text-emerald-400 float-medium" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="50,8 61,35 90,35 68,57 76,85 50,68 24,85 32,57 10,35 39,35"/>
        </svg>

        {/* Estrella mediana */}
        <svg className="absolute bottom-1/2 left-8 w-12 h-12 text-teal-300 pulse-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="50,10 61,37 90,37 68,57 76,84 50,68 24,84 32,57 10,37 39,37"/>
        </svg>

        {/* Estrella chica centro abajo */}
        <svg className="absolute bottom-20 left-2/5 w-8 h-8 text-emerald-300 sway-right" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
          <polygon points="50,10 61,37 90,37 68,57 76,84 50,68 24,84 32,57 10,37 39,37"/>
        </svg>

        {/* Estrella tiny scattered */}
        <svg className="absolute top-3/4 right-2 w-6 h-6 text-lime-300 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
          <polygon points="50,10 61,37 90,37 68,57 76,84 50,68 24,84 32,57 10,37 39,37"/>
        </svg>
        <svg className="absolute top-1/4 left-2 w-6 h-6 text-teal-400 float-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
          <polygon points="50,10 61,37 90,37 68,57 76,84 50,68 24,84 32,57 10,37 39,37"/>
        </svg>

        {/* === MAÍZ / CORN === */}
        {/* Maíz grande arriba */}
        <svg className="absolute top-32 right-6 w-20 h-20 text-emerald-400 float-medium" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="50" cy="56" rx="18" ry="28"/>
          <line x1="50" y1="28" x2="50" y2="84"/><line x1="34" y1="40" x2="66" y2="40"/>
          <line x1="33" y1="50" x2="67" y2="50"/><line x1="33" y1="60" x2="67" y2="60"/>
          <line x1="34" y1="70" x2="66" y2="70"/>
          <path d="M50 28 Q62 20 68 24" strokeWidth="2"/><path d="M50 28 Q38 18 32 22" strokeWidth="2"/>
        </svg>

        {/* Maíz chico abajo */}
        <svg className="absolute bottom-12 right-1/2 w-12 h-12 text-lime-400 sway-right" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <ellipse cx="50" cy="56" rx="18" ry="28"/>
          <line x1="50" y1="28" x2="50" y2="84"/><line x1="34" y1="48" x2="66" y2="48"/>
          <line x1="33" y1="60" x2="67" y2="60"/>
          <path d="M50 28 Q62 20 68 24" strokeWidth="2"/>
        </svg>

        {/* === LLAMAS / FUEGO === */}
        {/* Llama grande centro */}
        <svg className="absolute top-2/5 right-8 w-16 h-16 text-emerald-300 float-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M50 90 Q30 75 28 58 Q26 44 36 38 Q32 52 40 55 Q36 40 44 28 Q42 42 52 46 Q48 34 55 22 Q60 36 58 50 Q66 44 64 36 Q72 46 70 60 Q68 75 50 90Z"/>
        </svg>

        {/* Llama chica top */}
        <svg className="absolute top-16 left-2/3 w-10 h-10 text-teal-400 pulse-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M50 90 Q30 75 28 58 Q26 44 36 38 Q32 52 40 55 Q36 40 44 28 Q42 42 52 46 Q48 34 55 22 Q60 36 58 50 Q66 44 64 36 Q72 46 70 60 Q68 75 50 90Z"/>
        </svg>

        {/* Llama tiny scattered */}
        <svg className="absolute bottom-1/3 left-1/3 w-8 h-8 text-emerald-400 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M50 90 Q30 75 28 58 Q26 44 36 38 Q32 52 40 55 Q44 38 54 26 Q52 42 60 48 Q64 36 72 46 Q70 60 68 72 Q60 82 50 90Z"/>
        </svg>

        {/* === TORTILLAS === */}
        {/* Tortilla grande */}
        <svg className="absolute top-3/4 left-16 w-18 h-18 text-emerald-300 sway-left" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="50" cy="50" rx="38" ry="12"/>
          <path d="M12 50 Q15 44 22 44 Q26 50 30 44 Q34 50 38 44 Q42 50 46 44 Q50 50 54 44 Q58 50 62 44 Q66 50 70 44 Q74 50 78 44 Q85 44 88 50" strokeWidth="1.5"/>
        </svg>

        {/* Tortilla chica */}
        <svg className="absolute bottom-48 right-4 w-12 h-12 text-teal-400 float-medium" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <ellipse cx="50" cy="50" rx="38" ry="12"/>
        </svg>

        {/* === MARACAS === */}
        {/* Maraca grande */}
        <svg className="absolute top-1/2 right-4 w-16 h-16 text-emerald-400 sway-right" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="50" cy="30" r="18"/><line x1="50" y1="48" x2="50" y2="82"/>
          <ellipse cx="50" cy="82" rx="8" ry="4"/>
          <circle cx="44" cy="26" r="2" fill="currentColor"/><circle cx="56" cy="26" r="2" fill="currentColor"/>
          <circle cx="50" cy="34" r="2" fill="currentColor"/>
        </svg>

        {/* Maraca chica */}
        <svg className="absolute top-5/6 left-1/4 w-10 h-10 text-lime-400 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="50" cy="30" r="18"/><line x1="50" y1="48" x2="50" y2="80"/>
          <ellipse cx="50" cy="80" rx="7" ry="3.5"/>
        </svg>

        {/* === CALAVERA MEXICANA === */}
        {/* Calavera mediana */}
        <svg className="absolute top-56 left-1/2 w-14 h-14 text-teal-300 float-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M25 60 Q22 38 35 26 Q50 14 65 26 Q78 38 75 60 Q75 70 70 74 L70 82 L30 82 L30 74 Q25 70 25 60Z"/>
          <circle cx="38" cy="54" r="9"/><circle cx="62" cy="54" r="9"/>
          <line x1="50" y1="63" x2="50" y2="70"/>
          <line x1="36" y1="82" x2="36" y2="74"/><line x1="50" y1="82" x2="50" y2="74"/><line x1="64" y1="82" x2="64" y2="74"/>
        </svg>

        {/* Calavera chica */}
        <svg className="absolute bottom-64 right-1/3 w-10 h-10 text-emerald-400 pulse-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M25 60 Q22 38 35 26 Q50 14 65 26 Q78 38 75 60 Q75 70 70 74 L70 82 L30 82 L30 74 Q25 70 25 60Z"/>
          <circle cx="38" cy="54" r="9"/><circle cx="62" cy="54" r="9"/>
        </svg>

      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-gray-900 border-b-2 border-emerald-500 fixed top-0 left-0 right-0 md:sticky md:left-auto md:right-auto z-30 overflow-visible neon-border-taco">
        <div className="container mx-auto px-3 md:px-4 py-2 md:py-1.5 flex justify-between items-center overflow-visible">
          <Link href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity relative z-10">
            <Image
              src="/logoprincipal.png"
              alt="Santo Dilema"
              width={300}
              height={75}
              className="h-8 md:h-9 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/fat"
              className="text-xs md:text-sm font-bold text-red-400 hover:text-red-300 transition-colors px-2 md:px-3 py-1 md:py-1.5 rounded border border-red-500/30 hover:border-red-400 hidden sm:block"
              style={{ textShadow: "0 0 8px rgba(239,68,68,0.5)" }}
            >
              Ver menú Alitas →
            </Link>
            <Link
              href="/fat"
              className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded border border-red-500/30 hover:border-red-400 sm:hidden"
            >
              Alitas
            </Link>
            <Link
              href="/fit"
              className="text-xs md:text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors px-2 md:px-3 py-1 md:py-1.5 rounded border border-cyan-500/30 hover:border-cyan-400 hidden sm:block"
              style={{ textShadow: "0 0 8px rgba(34,211,238,0.5)" }}
            >
              Ver menú Ensaladas →
            </Link>
            <Link
              href="/fit"
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors px-2 py-1 rounded border border-cyan-500/30 hover:border-cyan-400 sm:hidden"
            >
              Ensaladas
            </Link>
            <Link
              href="/combos"
              className="text-xs md:text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors gold-glow px-2 md:px-3 py-1 md:py-1.5 rounded border border-amber-500/30 hover:border-amber-400 hidden sm:block"
            >
              Ver Combos →
            </Link>
            <Link
              href="/combos"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors gold-glow px-2 py-1 rounded border border-amber-500/30 hover:border-amber-400 sm:hidden"
            >
              Combos
            </Link>
          </div>
        </div>
      </header>
      {/* Spacer for fixed header on mobile */}
      <div className="h-14 md:hidden" />


      {/* ── Business closed banner ─────────────────────────────────────────── */}
      {!isOpen && (
        <div className="bg-gray-900 border-b-2 border-emerald-500/30 px-4 py-3 text-center">
          <p className="text-emerald-400 text-sm font-bold">
            ⏰ Estamos cerrados por ahora
          </p>
          <p className="text-gray-400 text-xs mt-0.5">{getNextOpenMessage()}</p>
        </div>
      )}

      {/* ── Products grid section ─────────────────────────────────────────── */}
      <section className={`container mx-auto px-2 md:px-4 py-2 md:py-3 transition-all duration-300 overflow-visible ${hasAnyOrder ? "pb-4 md:pb-6" : "pb-2 md:pb-2"}`}>

        {/* Page title */}
        <div className="px-3 pt-4 pb-2 text-center">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
            Tacos
          </h1>
          <div
            className="inline-block mt-3 px-5 py-3 rounded-xl border border-emerald-500/60 bg-emerald-950/40"
            style={{ boxShadow: "0 0 16px rgba(52,211,153,0.25), inset 0 0 12px rgba(52,211,153,0.06)" }}
          >
            <p className="text-white text-sm md:text-base font-bold">
              🌮 Elige tus{" "}
              <span className="text-emerald-400" style={{ textShadow: "0 0 8px rgba(52,211,153,0.7)" }}>2 sabores</span>
              {" "}y arma tu dúo por{" "}
              {duoOfferPrice ? (
                <>
                  <span className="text-gray-500 line-through text-sm">S/ {duoRealPrice.toFixed(2)}</span>
                  {" "}
                  <span className="text-emerald-300 font-black text-base md:text-lg" style={{ textShadow: "0 0 10px rgba(52,211,153,0.8)" }}>S/ {duoOfferPrice.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-emerald-300 font-black text-base md:text-lg" style={{ textShadow: "0 0 10px rgba(52,211,153,0.8)" }}>S/ {duoRealPrice.toFixed(2)}</span>
              )}
            </p>
          </div>
        </div>

        {/* ── Flavor cards grid ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:flex-wrap md:justify-center items-center gap-5 md:gap-6 lg:gap-8 px-3 md:px-4 pt-6 pb-8 md:py-8 lg:py-10">
          {flavors.map((flavor) => {
            const isSoldOut = !!menuStock[flavor.id];
            const isChosen = completedOrders.some(o => o.salsas.includes(flavor.id));

            return (
              <div
                key={flavor.id}
                onClick={() => { if (!isSoldOut) openModal(flavor.id); }}
                className={`bg-gray-900 w-full md:w-[280px] lg:w-[300px] relative neon-border-taco shadow-xl shadow-emerald-500/30 border-2 border-emerald-400/40
                  ${isSoldOut ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
                `}
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
              >
                {/* Image */}
                <div className="relative aspect-video md:aspect-auto md:h-52 bg-black overflow-hidden">
                  {isSoldOut && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
                      <div className="border-4 border-red-500 rounded px-3 py-1 select-none" style={{ transform: "rotate(-15deg)" }}>
                        <span className="text-red-500 font-black text-xl tracking-widest uppercase">AGOTADO</span>
                      </div>
                    </div>
                  )}
                  <Image
                    src={flavor.image}
                    alt={flavor.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="p-2.5 md:p-3.5">
                  <h4 className="text-sm md:text-base font-bold text-white mb-1 truncate">{flavor.name}</h4>
                  <p className="text-emerald-200/60 text-xs md:text-sm mb-2 md:mb-3 line-clamp-2">{flavor.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      {duoOfferPrice ? (
                        <>
                          <span className="text-xs text-gray-500 line-through">S/ {duoRealPrice.toFixed(2)}</span>
                          <span className="text-sm md:text-lg font-black text-emerald-400">S/ {duoOfferPrice.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-sm md:text-lg font-black text-amber-400 gold-glow">S/ {duoRealPrice.toFixed(2)}</span>
                      )}
                      <span className="text-[10px] text-gray-500">el dúo</span>
                    </div>
                    {!isSoldOut && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openModal(flavor.id); }}
                        className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold text-xl md:text-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-emerald-500/40"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>

                {/* Chosen badge */}
                {isChosen && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full z-20 shadow">
                    ✓ Elegido
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Duo count hint ─────────────────────────────────────────────────── */}
        {completedOrders.length > 0 && (
          <div className="container mx-auto px-3 md:px-4 mt-4 mb-2">
            <p className="text-center text-xs text-emerald-200/70 italic">
              Puedes agregar más dúos a tu pedido antes de continuar
            </p>
          </div>
        )}

        {/* ── Spacer for fixed bottom bar ─────────────────────────────────── */}
        {hasAnyOrder && (
          <div className="h-3 md:h-4" />
        )}
      </section>

      {/* ── Orders list ─────────────────────────────────────────────────────── */}
      {hasAnyOrder && (
        <div id="tu-orden-section" className="container mx-auto px-3 md:px-4 pb-28 mt-0">
          <h3 className="text-base md:text-lg lg:text-xl font-black text-emerald-400 mb-2 md:mb-3 neon-glow-taco">
            Tu orden
          </h3>
          <div className="space-y-2 md:space-y-3">
            {/* Órdenes de otras páginas (alitas / ensaladas) — con agrupación de combos */}
            {(() => {
              const _seenCombos = new Set<string>();
              return crossCategoryOrders.map((order, index) => {
                // ── Combo group card ──────────────────────────────────────
                if (order.comboGroupId) {
                  if (_seenCombos.has(order.comboGroupId)) return null;
                  _seenCombos.add(order.comboGroupId);
                  const _crossItems = crossCategoryOrders.filter(o => o.comboGroupId === order.comboGroupId);
                  const _tacoItems  = completedOrders.filter(o => o.comboGroupId === order.comboGroupId);
                  const _allItems   = [..._crossItems, ..._tacoItems];
                  return (
                    <div key={`cg-${order.comboGroupId}`} className="bg-gray-900/80 rounded-xl border-2 border-amber-400/40 p-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
                      <div className="flex items-start justify-between mb-2.5">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70">🔥 Combo especial</span>
                          <h4 className="text-sm font-black text-white mt-0.5">{order.comboName}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            {order.comboOriginalTotal && (
                              <div className="text-[11px] text-gray-500 line-through">S/ {order.comboOriginalTotal.toFixed(2)}</div>
                            )}
                            <div className="text-amber-400 font-black text-lg gold-glow">S/ {order.comboPrice?.toFixed(2)}</div>
                          </div>
                          <button onClick={() => handleDeleteComboGroup(order.comboGroupId!)} className="text-emerald-500 hover:text-red-400 text-xl font-bold transition-all opacity-70 hover:opacity-100 leading-none ml-1">✕</button>
                        </div>
                      </div>
                      <div className="space-y-1.5 border-t border-white/5 pt-2">
                        {_allItems.map((item, i) => {
                          const cProd = CROSS_PRODUCTS[item.productId];
                          const cName = cProd?.name ?? (item.productId === "taco-duo" ? "Dúo de Tacos" : item.productId);
                          const cImg  = cProd?.image ?? "/tacoinicio.png";
                          const isTacoItem = item.productId === "taco-duo";
                          return (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 bg-black/40 relative">
                                <Image src={cImg} alt={cName} fill className="object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white font-semibold truncate">{cName}</p>
                                {!isTacoItem && item.salsas && item.salsas.length > 0 && (
                                  <p className="text-[10px] text-amber-300/70 truncate">🌶️ {item.salsas.map(s => SALSAS_NAMES[s] ?? s).join(", ")}</p>
                                )}
                                {isTacoItem && item.salsas && item.salsas.length > 0 && (
                                  <p className="text-[10px] text-emerald-300/70 truncate">🌮 {item.salsas.map(id => getFlavorName(id)).join(" + ")}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                // ── Individual cross-category order ───────────────────────
                const prod = CROSS_PRODUCTS[order.productId];
                if (!prod) return null;
                const unitPrice = order.finalPrice ?? order.originalPrice ?? prod.price;
                return (
                  <div
                    key={`cross-${index}`}
                    className="bg-gray-900 rounded-lg border-2 border-emerald-400/20 p-2 md:p-3 relative"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border border-emerald-400/20 flex-shrink-0 relative">
                          <Image src={prod.image} alt={prod.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{prod.name}</p>
                          {order.salsas && order.salsas.length > 0 && (
                            <p className="text-[11px] text-red-300/80 truncate">
                              🌶️ {order.salsas.map(s => SALSAS_NAMES[s] ?? s).join(", ")}
                            </p>
                          )}
                          <p className="text-amber-400 font-bold text-xs mt-0.5">
                            S/ {(unitPrice * order.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCrossOrder(index)}
                        className="text-emerald-500 hover:text-red-400 text-xl font-bold transition-all opacity-70 hover:opacity-100 flex-shrink-0"
                        title="Eliminar"
                      >✕</button>
                    </div>
                  </div>
                );
              });
            })()}

            {completedOrders.map((order, index) => {
              // Skip taco orders already shown inside a combo group card
              if (order.comboGroupId && crossCategoryOrders.some(o => o.comboGroupId === order.comboGroupId)) return null;
              const f1 = flavors.find(f => f.id === order.salsas[0]);
              const f2 = flavors.find(f => f.id === order.salsas[1]);
              return (
                <div
                  key={index}
                  className="bg-gray-900 rounded-lg border-2 border-emerald-400/30 p-2 md:p-3 relative"
                >
                  <div className="flex items-start justify-between mb-1 md:mb-2">
                    <div className="flex items-start gap-2 flex-1">
                      {/* Duo thumbnails */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {f1 && (
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border border-emerald-400/30 relative">
                            <Image src={f1.image} alt={f1.name} fill className="object-cover" />
                          </div>
                        )}
                        <span className="text-emerald-500 font-black text-[10px]">+</span>
                        {f2 && (
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border border-emerald-400/30 relative">
                            <Image src={f2.image} alt={f2.name} fill className="object-cover" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white mb-1">
                          Dúo de Tacos
                        </h4>
                        <div className="text-[11px] space-y-0.5">
                          <div className="text-emerald-300/80">
                            <span>🌮 {getFlavorName(order.salsas[0])} + {getFlavorName(order.salsas[1])}</span>
                          </div>
                          {order.complementIds?.[0] && (
                            <div className="text-gray-400 flex items-center gap-1">
                              {order.complementIds[0] === "nachos" && (
                                <svg viewBox="0 0 48 42" className="w-4 h-3.5 inline-block flex-shrink-0" fill="none">
                                  <polygon points="24,3 45,39 3,39" fill="#F5C842" stroke="#C99B20" strokeWidth="1.5" strokeLinejoin="round"/>
                                  <circle cx="18" cy="30" r="2.5" fill="#C99B20" opacity="0.55"/>
                                  <circle cx="27" cy="24" r="2" fill="#C99B20" opacity="0.5"/>
                                  <circle cx="32" cy="32" r="2" fill="#C99B20" opacity="0.5"/>
                                </svg>
                              )}
                              {order.complementIds[0] === "chifles" && (
                                <svg viewBox="0 0 52 32" className="w-4 h-3 inline-block flex-shrink-0" fill="none">
                                  <ellipse cx="26" cy="16" rx="23" ry="12" fill="#E8C43A" stroke="#B8910A" strokeWidth="1.5"/>
                                  <ellipse cx="20" cy="13" rx="6" ry="3" fill="#B8910A" opacity="0.35" transform="rotate(-12 20 13)"/>
                                  <ellipse cx="33" cy="18" rx="5" ry="2.5" fill="#B8910A" opacity="0.3" transform="rotate(8 33 18)"/>
                                </svg>
                              )}
                              {order.complementIds[0] === "papas-fritas" && <span className="text-xs">🍟</span>}
                              <span>{getComplementoName(order.complementIds[0])}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2 ml-2">
                      <button
                        onClick={() => handleDeleteOrder(index)}
                        className="text-emerald-500 hover:text-red-400 text-xl font-bold transition-all opacity-70 hover:opacity-100"
                        title="Eliminar orden"
                      >
                        ✕
                      </button>
                      {duoOfferPrice ? (
                        <span className="text-amber-400 font-bold text-sm gold-glow">
                          <span className="text-gray-500 line-through text-xs mr-1">S/ {duoRealPrice.toFixed(2)}</span>
                          S/ {duoOfferPrice.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-amber-400 font-bold text-sm gold-glow">S/ {duoRealPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bebidas en la orden */}
          {bebidasTotal > 0 && (
            <div className="mt-3">
              {bebidas.filter(b => (bebidaQty[b.id] || 0) > 0).map(b => (
                <div key={b.id} className="flex items-center justify-between bg-gray-900 rounded-lg border border-emerald-400/20 px-3 py-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{b.emoji}</span>
                    <span className="text-white text-xs font-bold">{b.name}</span>
                    <span className="text-gray-500 text-xs">×{bebidaQty[b.id]}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-bold text-xs">S/ {((bebidaQty[b.id] || 0) * b.price).toFixed(2)}</span>
                    <button
                      onClick={() => setBebidaQty(prev => ({ ...prev, [b.id]: 0 }))}
                      className="text-gray-600 hover:text-red-400 text-sm font-bold transition-all"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Sticky bottom bar ──────────────────────────────────────────────── */}
      {hasAnyOrder && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t-4 border-emerald-500/50 shadow-2xl z-50"
          style={{ boxShadow: "0 0 20px rgba(52,211,153,0.3)" }}
        >
          <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 lg:py-5">
            <div className="flex justify-between items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm md:text-lg">Total</span>
                {hasComboDiscount ? (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 line-through text-sm">
                        S/ {baseTotal.toFixed(2)}
                      </span>
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                        🎉 {comboResult.appliedCombos.length === 1 ? comboResult.appliedCombos[0].rule.name : `${comboResult.appliedCombos.length} Combos`}
                      </span>
                    </div>
                    <span className="text-emerald-400 font-black text-xl md:text-3xl" style={{ textShadow: "0 0 8px rgba(52,211,153,0.5)" }}>
                      S/ {total.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <span className="text-emerald-400 font-black text-xl md:text-3xl" style={{ textShadow: "0 0 8px rgba(52,211,153,0.5)" }}>
                    S/ {total.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal()}
                  className="bg-gray-800 hover:bg-gray-700 text-emerald-400 font-bold text-sm rounded-lg px-4 py-2.5 md:py-3 transition-all border border-emerald-500/30"
                >
                  + Otro
                </button>
                {isOpen ? (
                  <button
                    onClick={handleCheckout}
                    className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black px-5 md:px-7 py-2.5 md:py-3 rounded-lg font-black text-sm md:text-lg transition-all neon-border-taco"
                  >
                    Continuar<span className="hidden sm:inline"> Pedido</span> →
                  </button>
                ) : (
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="bg-gray-700 text-gray-400 px-4 md:px-7 py-2 md:py-3 rounded-lg font-black text-xs md:text-base cursor-not-allowed border-2 border-gray-600 text-center">
                      🔒 Cerrado
                    </div>
                    <span className="text-gray-500 text-[10px] md:text-xs text-right">{getNextOpenMessage()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add first duo bottom bar (when no orders yet) ──────────────────── */}
      {!hasAnyOrder && isOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t-4 border-emerald-500/50 shadow-2xl z-50"
          style={{ boxShadow: "0 0 20px rgba(52,211,153,0.3)" }}
        >
          <div className="container mx-auto px-4 py-3 flex justify-center">
            <button
              onClick={() => openModal()}
              className="w-full md:w-72 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-black text-base uppercase tracking-widest rounded-lg py-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] neon-border-taco"
            >
              Armar mi dúo →
            </button>
          </div>
        </div>
      )}

      {/* ── Duo selector modal ─────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
          modalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeModal}
      />

      {/* Modal container */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-950 rounded-t-3xl border-t border-gray-800 transition-transform duration-[400ms] ease-out ${
          modalOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-700 rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Modal header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white font-black text-xl uppercase tracking-tight">
                Arma tu dúo
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">
                {duoOfferPrice
                  ? <>Elige 2 sabores · <span className="line-through">S/ {duoRealPrice.toFixed(2)}</span> <span className="text-emerald-400 font-bold">S/ {duoOfferPrice.toFixed(2)}</span></>
                  : `Elige 2 sabores · S/ ${duoRealPrice.toFixed(2)}`
                }
              </p>
              <p className="text-emerald-400/70 text-[10px] mt-0.5">
                ✦ Puedes repetir el mismo sabor dos veces
              </p>
            </div>
            <button
              onClick={closeModal}
              className="text-gray-600 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex gap-3 mb-5">
            {/* Step 1 */}
            <div
              className={`flex-1 rounded-xl px-3 py-2 border transition-all duration-200 ${
                step1Done
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                  : "bg-gray-900 border-gray-700 text-gray-500"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest">
                Taco 1
              </p>
              <p className="text-xs font-semibold mt-0.5 truncate">
                {taco1 ? getFlavorName(taco1) : "Elige un sabor"}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex items-center text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Step 2 */}
            <div
              className={`flex-1 rounded-xl px-3 py-2 border transition-all duration-200 ${
                step2Done
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                  : step2Active
                  ? "bg-gray-800 border-emerald-500/50 text-gray-300"
                  : "bg-gray-900 border-gray-700 text-gray-600"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest">
                Taco 2
              </p>
              <p className="text-xs font-semibold mt-0.5 truncate">
                {taco2
                  ? getFlavorName(taco2)
                  : step2Active
                  ? "¿Y el segundo?"
                  : "Elige un sabor"}
              </p>
            </div>
          </div>

          {/* Flavor selector cards */}
          <div className="space-y-3">
            {flavors.map((flavor) => {
              const isSelectedAsTaco1 = taco1 === flavor.id;
              const isSelectedAsTaco2 = taco2 === flavor.id;
              const isSelected = isSelectedAsTaco1 || isSelectedAsTaco2;

              return (
                <button
                  key={flavor.id}
                  onClick={() => handleFlavorClick(flavor.id)}
                  className={`w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-gray-800 bg-gray-900 hover:border-gray-600"
                  }`}
                  style={
                    isSelected
                      ? { boxShadow: "0 0 16px rgba(52,211,153,0.2)" }
                      : {}
                  }
                >
                  <div className="flex items-center gap-4 p-3">
                    {/* Image */}
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden">
                      <Image
                        src={flavor.image}
                        alt={flavor.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black uppercase text-sm leading-tight">
                        {flavor.name}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5 truncate">
                        {flavor.tagline}
                      </p>
                    </div>

                    {/* Selection badge */}
                    <div className="flex-shrink-0">
                      {isSelectedAsTaco1 && (
                        <div className="bg-emerald-500 text-black text-[10px] font-black rounded-full w-7 h-7 flex items-center justify-center">
                          T1
                        </div>
                      )}
                      {isSelectedAsTaco2 && (
                        <div className="bg-orange-500 text-black text-[10px] font-black rounded-full w-7 h-7 flex items-center justify-center">
                          T2
                        </div>
                      )}
                      {!isSelected && (
                        <div className="border-2 border-gray-700 rounded-full w-7 h-7 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-gray-700" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Complemento selector */}
          {bothSelected && (
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🍟</span>
                <p className="text-white font-black text-sm uppercase tracking-wide">Elige tu acompañante</p>
                <span className="text-emerald-400/60 text-[10px]">· incluido</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {complementos.map((c) => {
                  const isChosen = selectedComplemento === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedComplemento(c.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 border-2 transition-all duration-200 ${
                        isChosen
                          ? "border-emerald-500 bg-emerald-500/15"
                          : "border-gray-800 bg-gray-900 hover:border-gray-600"
                      }`}
                      style={isChosen ? { boxShadow: "0 0 12px rgba(52,211,153,0.2)" } : {}}
                    >
                      {/* Custom icons per complemento */}
                      {c.id === "nachos" && (
                        <svg viewBox="0 0 48 42" className="w-9 h-8" fill="none">
                          <polygon points="24,3 45,39 3,39" fill="#F5C842" stroke="#C99B20" strokeWidth="1.5" strokeLinejoin="round"/>
                          <circle cx="18" cy="30" r="2.5" fill="#C99B20" opacity="0.55"/>
                          <circle cx="27" cy="24" r="2" fill="#C99B20" opacity="0.5"/>
                          <circle cx="32" cy="32" r="2" fill="#C99B20" opacity="0.5"/>
                          <circle cx="21" cy="19" r="1.5" fill="#C99B20" opacity="0.4"/>
                        </svg>
                      )}
                      {c.id === "chifles" && (
                        <svg viewBox="0 0 52 32" className="w-10 h-7" fill="none">
                          <ellipse cx="26" cy="16" rx="23" ry="12" fill="#E8C43A" stroke="#B8910A" strokeWidth="1.5"/>
                          <ellipse cx="20" cy="13" rx="6" ry="3" fill="#B8910A" opacity="0.35" transform="rotate(-12 20 13)"/>
                          <ellipse cx="33" cy="18" rx="5" ry="2.5" fill="#B8910A" opacity="0.3" transform="rotate(8 33 18)"/>
                          <ellipse cx="26" cy="10" rx="3" ry="1.5" fill="#B8910A" opacity="0.25"/>
                        </svg>
                      )}
                      {c.id === "papas-fritas" && (
                        <span className="text-2xl">🍟</span>
                      )}
                      <span className={`text-xs font-bold ${isChosen ? "text-emerald-400" : "text-gray-400"}`}>{c.name}</span>
                      {isChosen && <span className="text-emerald-500 text-[10px] font-black">✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Bebidas accordion */}
              <div className="mt-4">
                <button
                  onClick={() => setShowBebidasModal(prev => !prev)}
                  className="w-full flex items-center justify-between bg-gray-900 border border-gray-700 hover:border-emerald-500/40 rounded-xl px-4 py-3 transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🥤</span>
                    <span className="text-white font-bold text-sm">Bebidas</span>
                    <span className="text-gray-500 text-xs">· opcionales</span>
                    {bebidasTotal > 0 && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/40">
                        S/ {bebidasTotal.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <span className="text-emerald-400 text-sm">{showBebidasModal ? "▲" : "▼"}</span>
                </button>
                {showBebidasModal && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {bebidas.map((b) => {
                      const qty = bebidaQty[b.id] || 0;
                      return (
                        <div
                          key={b.id}
                          className={`bg-gray-900 rounded-xl border px-3 py-2.5 flex items-center justify-between transition-all duration-150 ${
                            qty > 0 ? "border-emerald-500/50" : "border-gray-800"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base flex-shrink-0">{b.emoji}</span>
                            <div className="min-w-0">
                              <p className="text-white text-[10px] font-bold leading-tight truncate">{b.name}</p>
                              <p className="text-amber-400 text-[10px] font-black">S/ {b.price.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            <button
                              onClick={() => setBebidaQty(prev => ({ ...prev, [b.id]: Math.max(0, (prev[b.id] || 0) - 1) }))}
                              className="w-5 h-5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold flex items-center justify-center"
                            >−</button>
                            <span className="text-white font-bold text-xs w-4 text-center">{qty}</span>
                            <button
                              onClick={() => setBebidaQty(prev => ({ ...prev, [b.id]: (prev[b.id] || 0) + 1 }))}
                              className="w-5 h-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center justify-center"
                            >+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Duo preview */}
          {bothSelected && (
            <div className="mt-5 bg-gray-900 border border-emerald-500/30 rounded-2xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">
                Tu dúo
              </p>
              {/* Mobile: thumbnails centered */}
              <div className="flex flex-col gap-2 sm:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-emerald-500/40 relative">
                      <Image src={flavors.find(f => f.id === taco1!)!.image} alt={getFlavorName(taco1!)} fill className="object-cover" />
                    </div>
                    <p className="text-emerald-400 text-[10px] font-bold text-center leading-tight">{getFlavorName(taco1!)}</p>
                  </div>
                  <span className="text-emerald-500 font-black text-xl">+</span>
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-emerald-500/40 relative">
                      <Image src={flavors.find(f => f.id === taco2!)!.image} alt={getFlavorName(taco2!)} fill className="object-cover" />
                    </div>
                    <p className="text-emerald-400 text-[10px] font-bold text-center leading-tight">{getFlavorName(taco2!)}</p>
                  </div>
                </div>
              </div>

              {/* Tablet + Desktop: thumbnail + description side by side */}
              <div className="hidden sm:flex flex-col gap-3">
                {[taco1!, taco2!].map((id, i) => {
                  const flavor = flavors.find(f => f.id === id)!;
                  return (
                    <div key={i} className="flex items-center gap-3 bg-black/30 rounded-xl p-2">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-emerald-500/40 relative flex-shrink-0">
                        <Image src={flavor.image} alt={flavor.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-emerald-400 text-xs font-black uppercase leading-tight mb-1">{flavor.name}</p>
                        <p className="text-gray-400 text-[11px] leading-snug">{flavor.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Acompañante seleccionado — mobile y desktop */}
              {selectedComplemento && (
                <div className="mt-3 flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-2">
                  <span className="text-gray-400 text-[10px] uppercase tracking-widest flex-shrink-0">Acompañante:</span>
                  {selectedComplemento === "nachos" && (
                    <svg viewBox="0 0 48 42" className="w-5 h-4 flex-shrink-0" fill="none">
                      <polygon points="24,3 45,39 3,39" fill="#F5C842" stroke="#C99B20" strokeWidth="1.5" strokeLinejoin="round"/>
                      <circle cx="18" cy="30" r="2.5" fill="#C99B20" opacity="0.55"/>
                      <circle cx="27" cy="24" r="2" fill="#C99B20" opacity="0.5"/>
                      <circle cx="32" cy="32" r="2" fill="#C99B20" opacity="0.5"/>
                    </svg>
                  )}
                  {selectedComplemento === "chifles" && (
                    <svg viewBox="0 0 52 32" className="w-5 h-3.5 flex-shrink-0" fill="none">
                      <ellipse cx="26" cy="16" rx="23" ry="12" fill="#E8C43A" stroke="#B8910A" strokeWidth="1.5"/>
                      <ellipse cx="20" cy="13" rx="6" ry="3" fill="#B8910A" opacity="0.35" transform="rotate(-12 20 13)"/>
                      <ellipse cx="33" cy="18" rx="5" ry="2.5" fill="#B8910A" opacity="0.3" transform="rotate(8 33 18)"/>
                    </svg>
                  )}
                  {selectedComplemento === "papas-fritas" && <span className="text-sm flex-shrink-0">🍟</span>}
                  <span className="text-emerald-400 text-xs font-bold">{getComplementoName(selectedComplemento)}</span>
                  <span className="text-emerald-600 text-[10px] ml-auto">incluido</span>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleAddOrder}
            disabled={!allSelected}
            className={`mt-4 w-full font-black text-base uppercase tracking-widest rounded-2xl py-4 transition-all duration-200 ${
              allSelected
                ? "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black hover:scale-[1.02] active:scale-[0.98]"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
            style={allSelected ? { boxShadow: "0 0 20px rgba(52,211,153,0.4)" } : {}}
          >
            {!bothSelected ? "Elige 2 sabores" : !selectedComplemento ? "Elige tu acompañante" : "Agregar al pedido ✓"}
          </button>
        </div>
      </div>

      {/* ── Delete confirmation modal ──────────────────────────────────────── */}
      {showDeleteModal && deleteOrderIndex !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div
            className="bg-gray-900 border-2 border-emerald-500 rounded-lg p-6 max-w-md w-full"
            style={{ boxShadow: "0 0 10px rgba(52,211,153,0.4), 0 0 20px rgba(52,211,153,0.2)" }}
          >
            <h3 className="text-xl font-black text-emerald-400 mb-4 text-center"
              style={{ textShadow: "0 0 8px rgba(52,211,153,0.5)" }}
            >
              ¡Qué dilema!
            </h3>
            <div className="mb-6 text-sm">
              <p className="text-white mb-3 text-center">
                ¿Estás seguro que deseas quitar este dúo de tu pedido?
              </p>
              <div className="bg-gray-800/50 border border-emerald-400/30 rounded-lg p-4">
                <p className="text-emerald-400 font-bold text-base mb-1">
                  Dúo #{deleteOrderIndex + 1}
                </p>
                <p className="text-white text-sm">
                  {getFlavorName(completedOrders[deleteOrderIndex]?.salsas[0])} +{" "}
                  {getFlavorName(completedOrders[deleteOrderIndex]?.salsas[1])}
                </p>
                <p className="text-emerald-400 font-bold mt-1">S/ 24.90</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelDeleteOrder}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-bold transition-all border border-gray-500"
              >
                Volver
              </button>
              <button
                onClick={confirmDeleteOrder}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-3 rounded-lg font-bold transition-all"
                style={{ boxShadow: "0 0 8px rgba(52,211,153,0.4)" }}
              >
                Quitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WhatsApp button ────────────────────────────────────────────────── */}
      <WhatsAppButton lifted={isOpen || hasAnyOrder} />
    </div>
  );
}
