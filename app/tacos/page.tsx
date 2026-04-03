"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { isBusinessOpen, getNextOpenMessage } from "../utils/businessHours";
import WhatsAppButton from "../components/WhatsAppButton";

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
  price: 24.9,
  image: "/tacoinicio.png",
  category: "fat" as const,
};

const SESSION_KEY = "santo-dilema-orders";

function getFlavorName(id: string): string {
  return flavors.find((f) => f.id === id)?.name ?? id;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TacosPage() {
  const router = useRouter();
  const { addToCart, clearCart } = useCart();

  const [isOpen, setIsOpen] = useState(isBusinessOpen());
  const [menuStock, setMenuStock] = useState<Record<string, boolean>>({});

  // Orders that belong to other categories (fit/fat from other pages)
  const [crossCategoryOrders, setCrossCategoryOrders] = useState<CompletedOrder[]>([]);
  // Taco orders managed on this page
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [taco1, setTaco1] = useState<string | null>(null);
  const [taco2, setTaco2] = useState<string | null>(null);

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
  const openModal = useCallback(() => {
    setTaco1(null);
    setTaco2(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setTaco1(null);
    setTaco2(null);
  }, []);

  const handleFlavorClick = useCallback(
    (id: string) => {
      if (taco1 === null) {
        setTaco1(id);
        return;
      }
      if (taco1 === id) {
        setTaco1(null);
        return;
      }
      if (taco2 === null) {
        setTaco2(id);
        return;
      }
      if (taco2 === id) {
        setTaco2(null);
        return;
      }
      // Both slots filled and a different card tapped — replace taco2
      setTaco2(id);
    },
    [taco1, taco2]
  );

  const handleAddOrder = useCallback(() => {
    if (!taco1 || !taco2) return;
    const newOrder: CompletedOrder = {
      productId: "taco-duo",
      quantity: 1,
      salsas: [taco1, taco2],
      complementIds: [],
      finalPrice: 24.9,
      originalPrice: 24.9,
      category: "taco",
    };
    setCompletedOrders((prev) => [...prev, newOrder]);
    closeModal();
  }, [taco1, taco2, closeModal]);

  const handleDeleteOrder = useCallback((index: number) => {
    setDeleteOrderIndex(index);
    setShowDeleteModal(true);
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
      addToCart(TACO_DUO_PRODUCT, order.quantity);
    });
    router.push("/checkout");
  }, [crossCategoryOrders, completedOrders, clearCart, addToCart, router]);

  // ── Derived values ────────────────────────────────────────────────────────
  const total = completedOrders.length * 24.9;
  const duoCount = completedOrders.length;

  // ── Step indicator for modal ──────────────────────────────────────────────
  const step1Done = taco1 !== null;
  const step2Active = step1Done && taco2 === null;
  const step2Done = taco2 !== null;
  const bothSelected = step1Done && step2Done;

  return (
    <div className="min-h-screen bg-black md:bg-transparent relative overflow-visible">

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
      <header className="bg-gray-900 border-b-2 border-emerald-500 sticky top-0 z-30 overflow-visible neon-border-taco">
        <div className="container mx-auto px-3 md:px-4 py-2 md:py-1.5 flex justify-between items-center overflow-visible">
          <Link href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity relative z-10">
            <Image
              src="/logoprincipal.png"
              alt="Santo Dilema"
              width={300}
              height={75}
              className="h-10 md:h-9 w-auto"
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
              Ver menú Alitas
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
              Ver menú Ensaladas
            </Link>
          </div>
        </div>
      </header>

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
      <section className={`container mx-auto px-2 md:px-4 py-3 md:py-5 transition-all duration-300 overflow-visible ${completedOrders.length > 0 ? "pb-20 md:pb-16" : "pb-3 md:pb-3"}`}>

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
              <span className="text-emerald-300 font-black text-base md:text-lg" style={{ textShadow: "0 0 10px rgba(52,211,153,0.8)" }}>S/ 24.90</span>
            </p>
          </div>
        </div>

        {/* ── Flavor cards grid ─────────────────────────────────────────────── */}
        <div
          className="grid grid-cols-2 md:flex md:flex-wrap md:justify-center items-center gap-x-3 gap-y-12 md:gap-6 lg:gap-8 px-3 md:px-4 pt-10 pb-8 md:py-8 lg:py-10"
          style={{ overflow: "visible" }}
        >
          {flavors.map((flavor, index) => {
            const isSoldOut = !!menuStock[flavor.id];
            const isLastOdd = index === flavors.length - 1 && flavors.length % 2 !== 0;

            return (
              <div
                key={flavor.id}
                className={isLastOdd ? "col-span-2 md:contents flex justify-center" : "contents"}
              >
                <div
                  className={`bg-gray-900 flex-shrink-0 md:flex-shrink shadow-xl border-2 md:border-2 border-emerald-400 ${isSoldOut ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
                    ${isLastOdd ? "w-[calc(50%-0.375rem)] md:w-[240px] lg:w-[260px]" : "w-full md:w-[240px] lg:w-[260px]"}
                  `}
                  style={{
                    boxShadow: "0 0 10px rgba(52,211,153,0.4), 0 0 20px rgba(52,211,153,0.2)",
                    borderRadius: 0,
                    overflow: "hidden",
                    position: "relative",
                    zIndex: index + 1,
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                  onClick={() => {
                    if (!isSoldOut) openModal();
                  }}
                >
                  {/* Image area */}
                  <div
                    className="relative flex items-center justify-center bg-black h-44 md:h-48 overflow-hidden"
                  >
                    <Image
                      src={flavor.image}
                      alt={flavor.name}
                      fill
                      className="object-cover"
                    />
                    {isSoldOut && (
                      <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: "rgba(0,0,0,0.45)" }}>
                        <div
                          className="border-4 border-red-500 rounded-sm px-3 py-1 select-none"
                          style={{ transform: "rotate(-20deg)", boxShadow: "0 0 12px rgba(239,68,68,0.7)" }}
                        >
                          <span className="text-red-500 font-black text-xl md:text-2xl tracking-widest uppercase" style={{ textShadow: "0 0 8px rgba(239,68,68,0.8)" }}>
                            AGOTADO
                          </span>
                        </div>
                      </div>
                    )}
                    {!isSoldOut && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal();
                        }}
                        className="absolute top-2 right-2 z-10 w-7 h-7 text-white rounded-full text-base font-bold transition-all flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 shadow-lg"
                        style={{ boxShadow: "0 0 8px rgba(52,211,153,0.6)" }}
                      >
                        +
                      </button>
                    )}
                  </div>

                  {/* Info area */}
                  <div className="p-3 md:p-2.5">
                    <h4 className="text-xs md:text-sm font-bold text-white mb-1.5 md:mb-1 truncate">
                      {flavor.name}
                    </h4>
                    <p className="text-emerald-200/70 text-[10px] md:text-[11px]">
                      {flavor.description}
                    </p>
                  </div>
                </div>
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
        {completedOrders.length > 0 && (
          <div className="h-24 md:h-28" />
        )}
      </section>

      {/* ── Orders list (injected above the bottom bar) ────────────────────── */}
      {completedOrders.length > 0 && (
        <div className="container mx-auto px-3 md:px-4 pb-4">
          <div
            className="bg-gray-900 border-2 border-emerald-500/40 rounded-lg p-4 md:p-5"
            style={{ boxShadow: "0 0 10px rgba(52,211,153,0.2)" }}
          >
            <h3 className="text-white font-bold uppercase tracking-wide text-sm mb-3 border-b border-emerald-500/20 pb-2">
              Tu pedido
            </h3>
            <div className="space-y-2">
              {completedOrders.map((order, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 border border-emerald-500/20 rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-wide">
                      Dúo #{index + 1}
                    </p>
                    <p className="text-white text-sm font-medium mt-0.5">
                      {getFlavorName(order.salsas[0])} + {getFlavorName(order.salsas[1])}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">S/ 24.90</p>
                  </div>
                  <button
                    onClick={() => handleDeleteOrder(index)}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
                    aria-label="Eliminar dúo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Running total */}
            <div className="mt-3 flex justify-between items-center px-1 border-t border-emerald-500/20 pt-3">
              <span className="text-gray-400 text-sm font-bold">Total</span>
              <span className="text-emerald-400 font-black text-xl" style={{ textShadow: "0 0 8px rgba(52,211,153,0.5)" }}>
                S/ {total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky bottom bar ──────────────────────────────────────────────── */}
      {completedOrders.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t-4 border-emerald-500/50 shadow-2xl z-50"
          style={{ boxShadow: "0 0 20px rgba(52,211,153,0.3)" }}
        >
          <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 lg:py-5">
            <div className="flex justify-between items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm md:text-lg">Total</span>
                <span className="text-emerald-400 font-black text-xl md:text-3xl" style={{ textShadow: "0 0 8px rgba(52,211,153,0.5)" }}>
                  S/ {total.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openModal}
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
      {completedOrders.length === 0 && isOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t-4 border-emerald-500/50 shadow-2xl z-50"
          style={{ boxShadow: "0 0 20px rgba(52,211,153,0.3)" }}
        >
          <div className="container mx-auto px-4 py-3">
            <button
              onClick={openModal}
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-black text-base uppercase tracking-widest rounded-lg py-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] neon-border-taco"
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
                Elige 2 sabores · S/ 24.90
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

          {/* Duo preview */}
          {bothSelected && (
            <div className="mt-5 bg-gray-900 border border-emerald-500/30 rounded-2xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">
                Tu dúo
              </p>
              <p className="text-white font-bold text-sm">
                {getFlavorName(taco1!)} + {getFlavorName(taco2!)}
              </p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleAddOrder}
            disabled={!bothSelected}
            className={`mt-4 w-full font-black text-base uppercase tracking-widest rounded-2xl py-4 transition-all duration-200 ${
              bothSelected
                ? "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black hover:scale-[1.02] active:scale-[0.98]"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
            style={
              bothSelected
                ? { boxShadow: "0 0 20px rgba(52,211,153,0.4)" }
                : {}
            }
          >
            {bothSelected ? "Agregar al pedido ✓" : "Elige 2 sabores"}
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
      <WhatsAppButton />
    </div>
  );
}
