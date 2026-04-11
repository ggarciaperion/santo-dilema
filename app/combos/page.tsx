"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { isBusinessOpen, getNextOpenMessage } from "../utils/businessHours";

// ──────────────────────────────────────────────────────────────────
//  DATA
// ──────────────────────────────────────────────────────────────────

const SALSAS = [
  { id: "barbecue",       name: "BBQ ahumada"         },
  { id: "buffalo-picante",name: "Santo Picante"        },
  { id: "ahumada",        name: "Acevichada Imperial"  },
  { id: "parmesano-ajo",  name: "Crispy Celestial"     },
  { id: "anticuchos",     name: "Parrillera"           },
  { id: "honey-mustard",  name: "Honey Mustard"        },
  { id: "teriyaki",       name: "Oriental Teriyaki"    },
  { id: "macerichada",    name: "Sweet & Sour"         },
];

const FIT_OPTIONS = [
  { id: "ensalada-clasica",    name: "Clásica Fresh Bowl",  price: 18.50, image: "/clasica-fresh-bowl.png" },
  { id: "ensalada-proteica",   name: "César Power Bowl",    price: 20.00, image: "/cesar-power-bowl.png"   },
  { id: "ensalada-caesar",     name: "Protein Fit Bowl",    price: 20.00, image: "/protein-fit-bowl.png"   },
  { id: "ensalada-mediterranea",name:"Tuna Fresh Bowl",     price: 23.50, image: "/4.png"                  },
  { id: "cobb-supreme-bowl",   name: "Cobb Supreme Bowl",   price: 23.50, image: "/cobb.png"               },
  { id: "crispy-chicken-bowl", name: "Crispy Chicken Bowl", price: 22.50, image: "/crispy.png"             },
  { id: "pasta-power-bowl",    name: "Pasta Power Bowl",    price: 22.50, image: "/pasta.png"              },
];

const TACO_OPTIONS = [
  { id: "santo-crujiente", name: "Crunch Supreme Taco", image: "/crunch.png" },
  { id: "tex-dilema",      name: "Tex Supreme Taco",    image: "/tex.png"    },
  { id: "santo-bacon",     name: "Bacon Deluxe Taco",   image: "/bacon.png"  },
];

const REF_PRICES: Record<string, number> = {
  "pequeno-dilema": 22, "duo-dilema": 34, "taco-duo": 24.90,
  "ensalada-clasica": 18.50, "ensalada-proteica": 20, "ensalada-caesar": 20,
  "ensalada-mediterranea": 23.50, "cobb-supreme-bowl": 23.50,
  "crispy-chicken-bowl": 22.50, "pasta-power-bowl": 22.50,
};

// ──────────────────────────────────────────────────────────────────
//  TIPOS
// ──────────────────────────────────────────────────────────────────

type ComboStep =
  | { type: "sauces"; productId: string; productName: string; count: number; label: string }
  | { type: "salad"; label: string }
  | { type: "tacos"; label: string };

interface ComboColors {
  text: string;
  border: string;
  badge: string;
  btn: string;
  stepDot: string;
  glow: string;
  rgb: string; // raw "R,G,B" para efectos neón
}

interface ComboConfig {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  price: number;
  maxSavings: number;
  includes: string[];
  steps: ComboStep[];
  images: string[];
  colors: ComboColors;
}

interface Selections {
  sauces: Record<string, string[]>;
  salad: string;
  tacos: string[];
}

type ModalPhase = "selecting" | "confirming" | null;

const emptySelections = (): Selections => ({ sauces: {}, salad: "", tacos: [] });

// ──────────────────────────────────────────────────────────────────
//  COMBOS
// ──────────────────────────────────────────────────────────────────

const COMBOS: ComboConfig[] = [
  {
    id: "combo-perfecto",
    name: "Combo Perfecto",
    emoji: "🥗",
    tagline: "Balance que no miente",
    description: "Lo justo para cuando el cuerpo pide alitas pero la cabeza dice ensalada. Spoiler: las dos cosas.",
    price: 40,
    maxSavings: 5.50,
    includes: ["Pequeño Dilema · 8 alitas + papas", "Ensalada FIT a elección"],
    steps: [
      { type: "sauces", productId: "pequeno-dilema", productName: "Pequeño Dilema", count: 1, label: "Elige tu salsa para las alitas" },
      { type: "salad", label: "Elige tu ensalada" },
    ],
    images: ["/pequeno-dilema.png", "/cobb.png"],
    colors: {
      text:    "text-emerald-400",
      border:  "border-emerald-500/30",
      badge:   "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
      btn:     "bg-emerald-600 hover:bg-emerald-500 text-white",
      stepDot: "bg-emerald-500",
      glow:    "0 0 35px rgba(16,185,129,0.18)",
      rgb:     "16,185,129",
    },
  },
  {
    id: "combo-especial",
    name: "Combo Especial",
    emoji: "🌮",
    tagline: "Alitas meets street food",
    description: "La combinación que nadie esperaba pero todos necesitaban. Crujiente, sabroso, sin complicaciones.",
    price: 42,
    maxSavings: 4.90,
    includes: ["Pequeño Dilema · 8 alitas + papas", "Dúo de Tacos · 2 sabores"],
    steps: [
      { type: "sauces", productId: "pequeno-dilema", productName: "Pequeño Dilema", count: 1, label: "Elige tu salsa para las alitas" },
      { type: "tacos", label: "Elige los 2 sabores de tus tacos" },
    ],
    images: ["/pequeno-dilema.png", "/tacoinicio.png"],
    colors: {
      text:    "text-orange-400",
      border:  "border-orange-500/30",
      badge:   "bg-orange-500/15 text-orange-300 border border-orange-500/30",
      btn:     "bg-orange-600 hover:bg-orange-500 text-white",
      stepDot: "bg-orange-500",
      glow:    "0 0 35px rgba(249,115,22,0.18)",
      rgb:     "249,115,22",
    },
  },
  {
    id: "combo-alitas",
    name: "Combo Alitas",
    emoji: "🍗",
    tagline: "Doble dosis de pecado",
    description: "Para los que entienden que una porción nunca fue suficiente. El doble de alitas, el doble de crisis.",
    price: 52,
    maxSavings: 4.00,
    includes: ["Pequeño Dilema · 8 alitas + papas", "Dúo Dilema · 14 alitas + papas"],
    steps: [
      { type: "sauces", productId: "pequeno-dilema", productName: "Pequeño Dilema", count: 1, label: "Salsa del Pequeño Dilema" },
      { type: "sauces", productId: "duo-dilema",     productName: "Dúo Dilema",     count: 2, label: "2 salsas para el Dúo Dilema" },
    ],
    images: ["/pequeno-dilema.png", "/duo-dilema.png"],
    colors: {
      text:    "text-fuchsia-400",
      border:  "border-fuchsia-500/30",
      badge:   "bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30",
      btn:     "bg-fuchsia-600 hover:bg-fuchsia-500 text-white",
      stepDot: "bg-fuchsia-500",
      glow:    "0 0 35px rgba(217,70,239,0.18)",
      rgb:     "217,70,239",
    },
  },
  {
    id: "combo-santo-dilema",
    name: "Combo Santo Dilema",
    emoji: "🔥",
    tagline: "El combo sin excusas",
    description: "Cuando no puedes decidir entre alitas, ensalada y tacos, la respuesta correcta siempre es las tres.",
    price: 76,
    maxSavings: 6.40,
    includes: ["Dúo Dilema · 14 alitas + papas", "Ensalada FIT a elección", "Dúo de Tacos · 2 sabores"],
    steps: [
      { type: "sauces", productId: "duo-dilema", productName: "Dúo Dilema", count: 2, label: "2 salsas para el Dúo Dilema" },
      { type: "salad", label: "Elige tu ensalada" },
      { type: "tacos", label: "Elige los 2 sabores de tus tacos" },
    ],
    images: ["/duo-dilema.png", "/cobb.png", "/tacoinicio.png"],
    colors: {
      text:    "text-red-400",
      border:  "border-red-500/30",
      badge:   "bg-red-500/15 text-red-300 border border-red-500/30",
      btn:     "bg-red-600 hover:bg-red-500 text-white",
      stepDot: "bg-red-500",
      glow:    "0 0 35px rgba(239,68,68,0.18)",
      rgb:     "239,68,68",
    },
  },
];

// ──────────────────────────────────────────────────────────────────
//  HELPER: construir resumen de selecciones
// ──────────────────────────────────────────────────────────────────

interface SummaryItem {
  label: string;
  image?: string;
  details: string[];
}

const PRODUCT_IMAGES: Record<string, string> = {
  "pequeno-dilema": "/pequeno-dilema.png",
  "duo-dilema":     "/duo-dilema.png",
};

// Lookup global para mostrar nombre e imagen en Tu orden
const ALL_PRODUCTS: Record<string, { name: string; image: string }> = {
  "pequeno-dilema":       { name: "Pequeño Dilema",     image: "/pequeno-dilema.png" },
  "duo-dilema":           { name: "Dúo Dilema",          image: "/duo-dilema.png" },
  "taco-duo":             { name: "Dúo de Tacos",        image: "/tacoinicio.png" },
  "ensalada-clasica":     { name: "Clásica Fresh Bowl",  image: "/clasica-fresh-bowl.png" },
  "ensalada-proteica":    { name: "César Power Bowl",    image: "/cesar-power-bowl.png" },
  "ensalada-caesar":      { name: "Protein Fit Bowl",    image: "/protein-fit-bowl.png" },
  "ensalada-mediterranea":{ name: "Tuna Fresh Bowl",     image: "/4.png" },
  "cobb-supreme-bowl":    { name: "Cobb Supreme Bowl",   image: "/cobb.png" },
  "crispy-chicken-bowl":  { name: "Crispy Chicken Bowl", image: "/crispy.png" },
  "pasta-power-bowl":     { name: "Pasta Power Bowl",    image: "/pasta.png" },
};

interface SavedOrder {
  productId: string;
  quantity: number;
  salsas: string[];
  complementIds: string[];
  originalPrice?: number;
  comboGroupId?: string;
  comboName?: string;
  comboPrice?: number;
  comboOriginalTotal?: number;
  category?: string;
}

function buildSummary(combo: ComboConfig, sel: Selections): SummaryItem[] {
  const items: SummaryItem[] = [];
  for (const step of combo.steps) {
    if (step.type === "sauces") {
      const names = (sel.sauces[step.productId] ?? [])
        .map(id => SALSAS.find(s => s.id === id)?.name ?? id);
      items.push({
        label: step.productName,
        image: PRODUCT_IMAGES[step.productId],
        details: names.length ? [`Salsa: ${names.join(", ")}`] : [],
      });
    } else if (step.type === "salad") {
      const salad = FIT_OPTIONS.find(p => p.id === sel.salad);
      if (salad) items.push({ label: salad.name, image: salad.image, details: [`S/ ${salad.price.toFixed(2)}`] });
    } else if (step.type === "tacos") {
      const names = sel.tacos.map(id => TACO_OPTIONS.find(t => t.id === id)?.name ?? id);
      items.push({ label: "Dúo de Tacos", image: "/tacoinicio.png", details: names });
    }
  }
  return items;
}

// ──────────────────────────────────────────────────────────────────
//  PÁGINA PRINCIPAL
// ──────────────────────────────────────────────────────────────────

export default function CombosPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [openMessage, setOpenMessage] = useState("");
  const [activeCombo, setActiveCombo] = useState<ComboConfig | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Selections>(emptySelections());
  const [modalPhase, setModalPhase] = useState<ModalPhase>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [showTuOrden, setShowTuOrden] = useState(false);
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([]);
  const [preCheckoutVisible, setPreCheckoutVisible] = useState(false);
  const tuOrdenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOpen(isBusinessOpen());
    setOpenMessage(getNextOpenMessage());
    const iv = setInterval(() => {
      setIsOpen(isBusinessOpen());
      setOpenMessage(getNextOpenMessage());
    }, 60_000);
    return () => clearInterval(iv);
  }, []);

  // Cargar órdenes existentes al montar (pueden venir de fat/fit/tacos)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("santo-dilema-orders");
      if (raw) {
        const orders = JSON.parse(raw);
        if (orders.length > 0) {
          setSavedOrders(orders);
          setShowTuOrden(true);
        }
      }
    } catch {}
  }, []);

  const openModal = (combo: ComboConfig) => {
    setActiveCombo(combo);
    setCurrentStep(0);
    setSelections(emptySelections());
    setModalPhase("selecting");
    setTimeout(() => setSheetVisible(true), 10);
  };

  const closeAll = () => {
    setSheetVisible(false);
    setTimeout(() => {
      setActiveCombo(null);
      setModalPhase(null);
    }, 320);
  };

  // ── Validación del paso actual ─────────────────────────────────
  const isStepValid = useCallback((): boolean => {
    if (!activeCombo) return false;
    const step = activeCombo.steps[currentStep];
    if (step.type === "sauces") return (selections.sauces[step.productId]?.length ?? 0) === step.count;
    if (step.type === "salad")  return !!selections.salad;
    if (step.type === "tacos")  return selections.tacos.length === 2;
    return false;
  }, [activeCombo, currentStep, selections]);

  const isLastStep = activeCombo ? currentStep === activeCombo.steps.length - 1 : false;

  // ── Selección de opciones ──────────────────────────────────────
  const toggleSauce = (productId: string, sauceId: string, maxCount: number) => {
    setSelections(prev => {
      const cur = prev.sauces[productId] ?? [];
      if (cur.includes(sauceId)) return { ...prev, sauces: { ...prev.sauces, [productId]: cur.filter(s => s !== sauceId) } };
      const next = cur.length >= maxCount ? [...cur.slice(1), sauceId] : [...cur, sauceId];
      return { ...prev, sauces: { ...prev.sauces, [productId]: next } };
    });
  };

  const selectSalad = (id: string) => setSelections(prev => ({ ...prev, salad: id }));

  const toggleTaco = (id: string) => {
    setSelections(prev => {
      const cur = prev.tacos;
      if (cur.includes(id)) return { ...prev, tacos: cur.filter(t => t !== id) };
      const next = cur.length >= 2 ? [...cur.slice(1), id] : [...cur, id];
      return { ...prev, tacos: next };
    });
  };

  // ── Guardar en sessionStorage ──────────────────────────────────
  const saveToCart = () => {
    if (!activeCombo) return;
    const comboGroupId = `cg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const comboOriginalTotal = parseFloat((activeCombo.price + activeCombo.maxSavings).toFixed(2));
    const comboMeta = { comboGroupId, comboName: activeCombo.name, comboPrice: activeCombo.price, comboOriginalTotal };
    const items: any[] = [];
    for (const step of activeCombo.steps) {
      if (step.type === "sauces") {
        items.push({ productId: step.productId, quantity: 1, salsas: selections.sauces[step.productId] ?? [], complementIds: [], originalPrice: REF_PRICES[step.productId] ?? 0, finalPrice: REF_PRICES[step.productId] ?? 0, ...comboMeta });
      } else if (step.type === "salad") {
        const salad = FIT_OPTIONS.find(p => p.id === selections.salad);
        if (salad) items.push({ productId: salad.id, quantity: 1, salsas: [], complementIds: [], originalPrice: salad.price, finalPrice: salad.price, ...comboMeta });
      } else if (step.type === "tacos") {
        items.push({ productId: "taco-duo", quantity: 1, salsas: selections.tacos, complementIds: [], category: "taco", originalPrice: REF_PRICES["taco-duo"], finalPrice: REF_PRICES["taco-duo"], ...comboMeta });
      }
    }
    try {
      const existing = JSON.parse(sessionStorage.getItem("santo-dilema-orders") ?? "[]");
      sessionStorage.setItem("santo-dilema-orders", JSON.stringify([...existing, ...items]));
    } catch {}
  };

  // ── Avanzar paso ──────────────────────────────────────────────
  const handleNext = () => {
    if (!isStepValid()) return;
    if (isLastStep) {
      // Guardar y mostrar confirmación
      saveToCart();
      setModalPhase("confirming");
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const loadOrders = useCallback(() => {
    try {
      const raw = sessionStorage.getItem("santo-dilema-orders");
      setSavedOrders(raw ? JSON.parse(raw) : []);
    } catch { setSavedOrders([]); }
  }, []);

  const handleKeepShopping = () => {
    closeAll();
    loadOrders();
    setShowTuOrden(true);
    setTimeout(() => tuOrdenRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
  };

  const handleGoToCheckout = () => {
    // Cerrar modal de selección y abrir pre-checkout review
    setModalPhase(null);
    setSheetVisible(false);
    loadOrders();
    setTimeout(() => {
      setPreCheckoutVisible(true);
      setActiveCombo(null);
    }, 200);
  };

  const handleDeleteComboGroupInPage = (groupId: string) => {
    const updated = savedOrders.filter(o => o.comboGroupId !== groupId);
    setSavedOrders(updated);
    try { sessionStorage.setItem("santo-dilema-orders", JSON.stringify(updated)); } catch {}
    if (updated.length === 0) setShowTuOrden(false);
  };

  const tuOrdenTotal = useMemo(() => {
    const seen = new Set<string>();
    return savedOrders.reduce((sum, o) => {
      if (o.comboGroupId) {
        if (seen.has(o.comboGroupId)) return sum;
        seen.add(o.comboGroupId);
        return sum + (o.comboPrice ?? 0);
      }
      return sum + ((o.originalPrice ?? 0) * o.quantity);
    }, 0);
  }, [savedOrders]);

  // ──────────────────────────────────────────────────────────────
  //  RENDER
  // ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="shrink-0">
            <Image src="/logoprincipal.png" alt="Santo Dilema" width={34} height={34} className="rounded-full" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white leading-none" style={{ fontFamily: "var(--font-graffiti)" }}>
              Combos
            </h1>
            <p className="text-xs text-gray-500 leading-none mt-0.5">Elige, personaliza y pide</p>
          </div>
          <Link href="/" className="shrink-0 p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>
      </header>

      {/* CLOSED BANNER */}
      {!isOpen && (
        <div className="border-b border-red-500/20 bg-red-950/30 px-4 py-3 text-center">
          <p className="text-sm text-red-300 font-medium">🔒 Estamos cerrados — <span className="text-red-200">{openMessage}</span></p>
        </div>
      )}

      {/* HERO */}
      <section className="max-w-3xl mx-auto px-4 pt-10 pb-4 text-center">
        <span className="inline-block bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-full px-4 py-1.5 mb-5">
          Precio especial · Descuento automático
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight" style={{ fontFamily: "var(--font-graffiti)" }}>
          Combos para todos los pecados
        </h2>
        <p className="text-gray-400 text-sm md:text-base max-w-sm mx-auto leading-relaxed">
          Elige tu combo, personaliza las opciones y el precio especial se aplica solo al hacer el pedido.
        </p>
      </section>

      {/* CATEGORY NAV */}
      <section className="max-w-3xl mx-auto px-4 pb-6">
        <div className="flex gap-2">
          <Link
            href="/fat"
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900/80 border border-red-500/30 rounded-xl px-2 py-3 text-[11px] md:text-xs font-bold text-red-400 hover:border-red-400 hover:bg-red-950/30 transition-all text-center leading-tight"
            style={{ boxShadow: "0 0 8px rgba(239,68,68,0.08)" }}
          >
            🍗 Ver menú alitas
          </Link>
          <Link
            href="/fit"
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900/80 border border-cyan-500/30 rounded-xl px-2 py-3 text-[11px] md:text-xs font-bold text-cyan-400 hover:border-cyan-400 hover:bg-cyan-950/30 transition-all text-center leading-tight"
            style={{ boxShadow: "0 0 8px rgba(6,182,212,0.08)" }}
          >
            🥗 Ver menú ensaladas
          </Link>
          <Link
            href="/tacos"
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900/80 border border-emerald-500/30 rounded-xl px-2 py-3 text-[11px] md:text-xs font-bold text-emerald-400 hover:border-emerald-400 hover:bg-emerald-950/30 transition-all text-center leading-tight"
            style={{ boxShadow: "0 0 8px rgba(16,185,129,0.08)" }}
          >
            🌮 Ver menú tacos
          </Link>
        </div>
      </section>

      {/* COMBO GRID */}
      <main className="max-w-3xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-5">
        {COMBOS.map(combo => (
          <ComboCard key={combo.id} combo={combo} isOpen={isOpen} onSelect={() => openModal(combo)} />
        ))}
      </main>

      <p className="text-center text-xs text-gray-700 pb-8 px-4">
        El descuento se calcula automáticamente en el checkout · No acumulable con cupones
      </p>

      {/* ── TU ORDEN ──────────────────────────────────────────────── */}
      {showTuOrden && savedOrders.length > 0 && (
        <section ref={tuOrdenRef} className="max-w-3xl mx-auto px-4 pb-36">
          <h3 className="text-xl font-black text-amber-400 mb-4" style={{ textShadow: "0 0 16px rgba(251,191,36,0.4)" }}>
            Tu orden
          </h3>
          <div className="space-y-3">
            {(() => {
              const seen = new Set<string>();
              return savedOrders.map((order, i) => {
                if (order.comboGroupId) {
                  if (seen.has(order.comboGroupId)) return null;
                  seen.add(order.comboGroupId);
                  const gi = savedOrders.filter(o => o.comboGroupId === order.comboGroupId);
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
                            <div className="text-amber-400 font-black text-lg" style={{ textShadow: "0 0 8px rgba(251,191,36,0.5)" }}>
                              S/ {order.comboPrice?.toFixed(2)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteComboGroupInPage(order.comboGroupId!)}
                            className="text-gray-500 hover:text-red-400 text-xl font-bold transition-all opacity-70 hover:opacity-100 leading-none ml-1"
                          >✕</button>
                        </div>
                      </div>
                      <div className="space-y-1.5 border-t border-white/5 pt-2">
                        {gi.map((item, j) => {
                          const prod = ALL_PRODUCTS[item.productId];
                          if (!prod) return null;
                          const isTaco = item.productId === "taco-duo";
                          return (
                            <div key={j} className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 bg-black/40 relative">
                                <Image src={prod.image} alt={prod.name} fill className="object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white font-semibold truncate">{prod.name}</p>
                                {!isTaco && item.salsas && item.salsas.length > 0 && (
                                  <p className="text-[10px] text-amber-300/70 truncate">
                                    🌶️ {item.salsas.map(s => SALSAS.find(sa => sa.id === s)?.name ?? s).join(", ")}
                                  </p>
                                )}
                                {isTaco && item.salsas && item.salsas.length > 0 && (
                                  <p className="text-[10px] text-emerald-300/70 truncate">
                                    🌮 {item.salsas.map(id => TACO_OPTIONS.find(t => t.id === id)?.name ?? id).join(" + ")}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                // Individual item (non-combo)
                const prod = ALL_PRODUCTS[order.productId];
                if (!prod) return null;
                return (
                  <div key={i} className="bg-gray-900 rounded-xl border border-white/8 p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-black/40 relative">
                      <Image src={prod.image} alt={prod.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{prod.name}</p>
                      <p className="text-amber-400 font-bold text-xs">S/ {((order.originalPrice ?? 0) * order.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          <p className="text-center text-xs text-gray-600 mt-4 italic">
            💡 Puedes agregar más combos o ir a pagar cuando estés listo
          </p>
        </section>
      )}

      {/* ── STICKY BAR cuando hay órdenes ───────────────────────── */}
      {showTuOrden && savedOrders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm border-t border-amber-400/20" style={{ boxShadow: "0 -4px 20px rgba(251,191,36,0.1)" }}>
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[11px] text-gray-500 leading-none">Total estimado</p>
              <p className="text-xl font-black text-amber-400" style={{ textShadow: "0 0 8px rgba(251,191,36,0.4)" }}>
                S/ {tuOrdenTotal.toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => { loadOrders(); setPreCheckoutVisible(true); }}
              className="flex-1 max-w-[200px] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all active:scale-95"
              style={{ boxShadow: "0 0 14px rgba(16,185,129,0.35)" }}
            >
              Ir a pagar →
            </button>
          </div>
        </div>
      )}

      {/* MODALES */}
      {activeCombo && modalPhase === "selecting" && (
        <SelectionModal
          combo={activeCombo}
          currentStep={currentStep}
          selections={selections}
          visible={sheetVisible}
          isStepValid={isStepValid()}
          isLastStep={isLastStep}
          onClose={closeAll}
          onToggleSauce={toggleSauce}
          onSelectSalad={selectSalad}
          onToggleTaco={toggleTaco}
          onNext={handleNext}
          onBack={() => setCurrentStep(prev => prev - 1)}
        />
      )}

      {activeCombo && modalPhase === "confirming" && (
        <ConfirmationModal
          combo={activeCombo}
          summary={buildSummary(activeCombo, selections)}
          visible={sheetVisible}
          onKeepShopping={handleKeepShopping}
          onCheckout={handleGoToCheckout}
        />
      )}

      {/* PRE-CHECKOUT REVIEW MODAL */}
      {preCheckoutVisible && (
        <PreCheckoutModal
          orders={savedOrders}
          total={tuOrdenTotal}
          onBack={() => setPreCheckoutVisible(false)}
          onConfirm={() => { setPreCheckoutVisible(false); router.push("/checkout"); }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
//  NEON PLUS SEPARATOR
// ──────────────────────────────────────────────────────────────────

function PlusSeparator({ colors }: { colors: ComboColors }) {
  const { rgb } = colors;
  return (
    <div className="relative z-10 shrink-0 flex items-center justify-center w-9">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center bg-black"
        style={{
          border: `1.5px solid rgba(${rgb},0.9)`,
          boxShadow: `0 0 4px rgba(${rgb},0.9), 0 0 10px rgba(${rgb},0.7), 0 0 20px rgba(${rgb},0.5), 0 0 35px rgba(${rgb},0.25), inset 0 0 8px rgba(${rgb},0.15)`,
        }}
      >
        <span
          className="text-xl font-black leading-none select-none"
          style={{
            color: `rgb(${rgb})`,
            textShadow: `0 0 6px rgba(${rgb},1), 0 0 14px rgba(${rgb},0.9), 0 0 28px rgba(${rgb},0.7)`,
          }}
        >
          +
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
//  PRE-CHECKOUT REVIEW MODAL
// ──────────────────────────────────────────────────────────────────

function PreCheckoutModal({
  orders, total, onBack, onConfirm,
}: {
  orders: SavedOrder[];
  total: number;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onBack} />

      {/* Sheet */}
      <div className="relative z-10 bg-[#111] rounded-t-3xl border-t border-white/10 max-h-[92vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 border-b border-white/5 shrink-0">
          <p className="text-white font-black text-lg leading-tight" style={{ fontFamily: "var(--font-graffiti)" }}>
            Confirma tu pedido
          </p>
          <p className="text-xs text-gray-500 mt-1">Revisa todo antes de continuar al pago</p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {(() => {
            const seen = new Set<string>();
            return orders.map((order, i) => {
              if (order.comboGroupId) {
                if (seen.has(order.comboGroupId)) return null;
                seen.add(order.comboGroupId);
                const gi = orders.filter(o => o.comboGroupId === order.comboGroupId);
                return (
                  <div key={`pc-cg-${order.comboGroupId}`} className="bg-white/3 rounded-xl border border-amber-400/25 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70 mb-0.5">🔥 Combo especial</p>
                        <p className="text-sm font-black text-white">{order.comboName}</p>
                      </div>
                      <div className="text-right">
                        {order.comboOriginalTotal && (
                          <p className="text-[11px] text-gray-500 line-through">S/ {order.comboOriginalTotal.toFixed(2)}</p>
                        )}
                        <p className="text-amber-400 font-black text-base" style={{ textShadow: "0 0 6px rgba(251,191,36,0.4)" }}>
                          S/ {order.comboPrice?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 border-t border-white/5 pt-3">
                      {gi.map((item, j) => {
                        const prod = ALL_PRODUCTS[item.productId];
                        if (!prod) return null;
                        const isTaco = item.productId === "taco-duo";
                        return (
                          <div key={j} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-black/40 relative">
                              <Image src={prod.image} alt={prod.name} fill className="object-contain p-1" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white font-semibold">{prod.name}</p>
                              {!isTaco && item.salsas && item.salsas.length > 0 && (
                                <p className="text-[10px] text-amber-300/70 mt-0.5">
                                  🌶️ {item.salsas.map(s => SALSAS.find(sa => sa.id === s)?.name ?? s).join(", ")}
                                </p>
                              )}
                              {isTaco && item.salsas && item.salsas.length > 0 && (
                                <p className="text-[10px] text-emerald-300/70 mt-0.5">
                                  🌮 {item.salsas.map(id => TACO_OPTIONS.find(t => t.id === id)?.name ?? id).join(" + ")}
                                </p>
                              )}
                            </div>
                            <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              // Individual
              const prod = ALL_PRODUCTS[order.productId];
              if (!prod) return null;
              return (
                <div key={i} className="bg-white/3 rounded-xl border border-white/8 p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-black/40 relative">
                    <Image src={prod.image} alt={prod.name} fill className="object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{prod.name}</p>
                    <p className="text-amber-400 font-bold text-xs">S/ {((order.originalPrice ?? 0) * order.quantity).toFixed(2)}</p>
                  </div>
                </div>
              );
            });
          })()}

          {/* Total */}
          <div className="flex items-center justify-between py-3 border-t border-white/10 mt-2">
            <span className="text-sm text-gray-400 font-semibold">Total estimado</span>
            <span className="text-2xl font-black text-white">S/ {total.toFixed(2)}</span>
          </div>

          <p className="text-[10px] text-gray-600 text-center pb-1">
            El descuento de combo se aplica automáticamente · No acumulable con cupones
          </p>
        </div>

        {/* Actions */}
        <div className="shrink-0 px-5 py-4 border-t border-white/5 flex flex-col gap-2.5">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all active:scale-95"
            style={{ boxShadow: "0 0 16px rgba(16,185,129,0.35)" }}
          >
            Confirmar pedido e ir a pagar →
          </button>
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/5 transition-all"
          >
            Volver y editar pedido
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
//  COMBO CARD
// ──────────────────────────────────────────────────────────────────

function ComboCard({ combo, isOpen, onSelect }: { combo: ComboConfig; isOpen: boolean; onSelect: () => void }) {
  return (
    <article
      className={`flex flex-col rounded-2xl border bg-gray-900/40 overflow-hidden ${combo.colors.border}`}
      style={{ boxShadow: combo.colors.glow }}
    >
      {/* Image area */}
      <div className="relative h-48 bg-black overflow-hidden">
        {combo.images.length === 3 ? (
          <div className="flex h-full items-center">
            <div className="w-1/3 relative h-full"><Image src={combo.images[0]} alt="" fill className="object-contain p-3" /></div>
            <PlusSeparator colors={combo.colors} />
            <div className="w-1/3 relative h-full"><Image src={combo.images[1]} alt="" fill className="object-contain p-3" /></div>
            <PlusSeparator colors={combo.colors} />
            <div className="w-1/3 relative h-full"><Image src={combo.images[2]} alt="" fill className="object-contain p-3" /></div>
          </div>
        ) : (
          <div className="flex h-full items-center">
            <div className="w-1/2 relative h-full"><Image src={combo.images[0]} alt="" fill className="object-contain p-4" /></div>
            <PlusSeparator colors={combo.colors} />
            <div className="w-1/2 relative h-full"><Image src={combo.images[1]} alt="" fill className="object-contain p-4" /></div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-transparent pointer-events-none" />
        {combo.maxSavings > 0 && (
          <span className={`absolute top-3 right-3 text-[11px] font-bold rounded-full px-2.5 py-1 ${combo.colors.badge}`}>
            Ahorra hasta S/ {combo.maxSavings.toFixed(2)}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className={`text-lg font-bold leading-tight ${combo.colors.text}`} style={{ fontFamily: "var(--font-graffiti)" }}>
            {combo.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">{combo.tagline}</p>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">{combo.description}</p>
        </div>
        <ul className="space-y-1">
          {combo.includes.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
              <span className={`mt-0.5 ${combo.colors.text} opacity-60`}>✓</span>
              {item}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 pt-3 mt-auto border-t border-white/5">
          <div className="leading-none">
            {combo.maxSavings > 0 && (
              <div className="text-xs text-gray-500 line-through mb-0.5">
                S/ {(combo.price + combo.maxSavings).toFixed(2)}
              </div>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">S/ {combo.price.toFixed(2)}</span>
              <span className={`text-xs font-bold ${combo.colors.text}`}>combo</span>
            </div>
          </div>
          <button
            onClick={onSelect}
            disabled={!isOpen}
            className={`flex-1 max-w-[150px] py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${combo.colors.btn}`}
          >
            {isOpen ? "Elegir combo" : "Cerrado"}
          </button>
        </div>
      </div>
    </article>
  );
}

// ──────────────────────────────────────────────────────────────────
//  MODAL DE SELECCIÓN PASO A PASO
// ──────────────────────────────────────────────────────────────────

function SelectionModal({
  combo, currentStep, selections, visible, isStepValid, isLastStep,
  onClose, onToggleSauce, onSelectSalad, onToggleTaco, onNext, onBack,
}: {
  combo: ComboConfig; currentStep: number; selections: Selections;
  visible: boolean; isStepValid: boolean; isLastStep: boolean;
  onClose: () => void;
  onToggleSauce: (productId: string, sauceId: string, maxCount: number) => void;
  onSelectSalad: (id: string) => void;
  onToggleTaco: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const step = combo.steps[currentStep];
  const totalSteps = combo.steps.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300" style={{ opacity: visible ? 1 : 0 }} />
      <div className="relative z-10 bg-[#111] rounded-t-3xl border-t border-white/10 max-h-[90vh] flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 shrink-0">
          <div>
            <h3 className="font-bold text-white text-lg leading-none" style={{ fontFamily: "var(--font-graffiti)" }}>
              {combo.emoji} {combo.name}
            </h3>
            <p className={`text-xs mt-1 font-medium ${combo.colors.text}`}>
              S/ {combo.price.toFixed(2)} · Paso {currentStep + 1} de {totalSteps}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 py-3 shrink-0">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
              i < currentStep  ? combo.colors.stepDot + " opacity-40 w-4" :
              i === currentStep ? combo.colors.stepDot + " w-6" : "bg-gray-700 w-4"
            }`} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {step.type === "sauces" ? (
            <SauceStep
              step={step as Extract<ComboStep, { type: "sauces" }>}
              selected={selections.sauces[(step as Extract<ComboStep, { type: "sauces" }>).productId] ?? []}
              colors={combo.colors}
              onToggle={sauceId => onToggleSauce(
                (step as Extract<ComboStep, { type: "sauces" }>).productId,
                sauceId,
                (step as Extract<ComboStep, { type: "sauces" }>).count,
              )}
            />
          ) : step.type === "salad" ? (
            <SaladStep selected={selections.salad} colors={combo.colors} onSelect={onSelectSalad} />
          ) : (
            <TacoStep selected={selections.tacos} colors={combo.colors} onToggle={onToggleTaco} />
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-white/5 flex gap-3">
          {currentStep > 0 && (
            <button onClick={onBack} className="px-5 py-3 rounded-xl border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/5 transition-all">
              Atrás
            </button>
          )}
          <button
            onClick={onNext}
            disabled={!isStepValid}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${combo.colors.btn}`}
          >
            {isLastStep ? "Revisar mi pedido →" : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
//  MODAL DE CONFIRMACIÓN
// ──────────────────────────────────────────────────────────────────

function ConfirmationModal({
  combo, summary, visible, onKeepShopping, onCheckout,
}: {
  combo: ComboConfig;
  summary: SummaryItem[];
  visible: boolean;
  onKeepShopping: () => void;
  onCheckout: () => void;
}) {
  const { rgb } = combo.colors;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300" style={{ opacity: visible ? 1 : 0 }} />
      <div
        className="relative z-10 bg-[#111] rounded-t-3xl border-t border-white/10 max-h-[90vh] flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header con check neón */}
        <div className="px-5 pt-3 pb-4 border-b border-white/5 shrink-0 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: `rgba(${rgb},0.12)`,
              border: `1.5px solid rgba(${rgb},0.7)`,
              boxShadow: `0 0 12px rgba(${rgb},0.5), 0 0 24px rgba(${rgb},0.3)`,
            }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              style={{ color: `rgb(${rgb})`, filter: `drop-shadow(0 0 4px rgba(${rgb},0.9))` }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight" style={{ fontFamily: "var(--font-graffiti)" }}>
              ¡Combo agregado!
            </p>
            <p className={`text-xs mt-0.5 font-medium ${combo.colors.text}`}>
              {combo.name} · S/ {combo.price.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Resumen detallado */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-3">Resumen de tu pedido</p>

          {summary.map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/6`}>
              {item.image && (
                <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-black/40">
                  <Image src={item.image} alt={item.label} fill className="object-contain p-1" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-tight">{item.label}</p>
                {item.details.map((d, j) => (
                  <p key={j} className={`text-xs mt-0.5 ${combo.colors.text}`}>{d}</p>
                ))}
              </div>
              <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${combo.colors.stepDot}`}>
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </div>
          ))}

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
            <span className="text-sm text-gray-400">Total combo</span>
            <span className="text-xl font-bold text-white">S/ {combo.price.toFixed(2)}</span>
          </div>

          {/* Navegación seguir comprando */}
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-2">Puedes agregar más órdenes a tu pedido</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { href: "/fat",   label: "Ver menú alitas" },
                { href: "/fit",   label: "Ver menú ensaladas" },
                { href: "/tacos", label: "Ver menú tacos" },
                { href: "/combos",label: "+ Otro combo" },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onKeepShopping}
                  className="text-xs border border-white/10 text-gray-300 hover:text-white hover:border-white/25 rounded-full px-3 py-1.5 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="shrink-0 px-5 py-4 border-t border-white/5 flex flex-col gap-2.5">
          <button
            onClick={onCheckout}
            className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${combo.colors.btn}`}
            style={{ boxShadow: `0 0 16px rgba(${rgb},0.35)` }}
          >
            Confirmar e ir a pagar →
          </button>
          <button
            onClick={onKeepShopping}
            className="w-full py-3 rounded-xl border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/5 transition-all"
          >
            Continuar agregando órdenes
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
//  STEP COMPONENTS
// ──────────────────────────────────────────────────────────────────

function SauceStep({ step, selected, colors, onToggle }: {
  step: Extract<ComboStep, { type: "sauces" }>; selected: string[];
  colors: ComboColors; onToggle: (id: string) => void;
}) {
  return (
    <div className="pt-2">
      <p className="text-white font-semibold mb-1">{step.label}</p>
      <p className="text-xs text-gray-500 mb-4">
        {step.count === 1 ? "Elige 1 salsa" : `Elige ${step.count} salsas`} · {selected.length}/{step.count} seleccionada{step.count > 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {SALSAS.map(salsa => {
          const isSelected = selected.includes(salsa.id);
          return (
            <button key={salsa.id} onClick={() => onToggle(salsa.id)}
              className={`relative flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all active:scale-95 ${isSelected ? `${colors.border} bg-white/5` : "border-white/8 hover:border-white/15"}`}>
              {isSelected && (
                <span className={`absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center ${colors.stepDot}`}>
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              <span className="text-lg select-none">🫙</span>
              <span className={`text-xs font-semibold leading-tight ${isSelected ? colors.text : "text-gray-300"}`}>{salsa.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SaladStep({ selected, colors, onSelect }: { selected: string; colors: ComboColors; onSelect: (id: string) => void }) {
  return (
    <div className="pt-2">
      <p className="text-white font-semibold mb-1">Elige tu ensalada</p>
      <p className="text-xs text-gray-500 mb-4">Selecciona 1 bowl</p>
      <div className="space-y-2">
        {FIT_OPTIONS.map(fit => {
          const isSelected = selected === fit.id;
          return (
            <button key={fit.id} onClick={() => onSelect(fit.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all active:scale-95 ${isSelected ? `${colors.border} bg-white/5` : "border-white/8 hover:border-white/15"}`}>
              <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-black/40">
                <Image src={fit.image} alt={fit.name} fill className="object-contain p-1" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight ${isSelected ? colors.text : "text-gray-200"}`}>{fit.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">S/ {fit.price.toFixed(2)}</p>
              </div>
              {isSelected && (
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${colors.stepDot}`}>
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TacoStep({ selected, colors, onToggle }: { selected: string[]; colors: ComboColors; onToggle: (id: string) => void }) {
  return (
    <div className="pt-2">
      <p className="text-white font-semibold mb-1">Elige tus tacos</p>
      <p className="text-xs text-gray-500 mb-4">Selecciona 2 sabores · {selected.length}/2 seleccionados</p>
      <div className="space-y-2">
        {TACO_OPTIONS.map(taco => {
          const isSelected = selected.includes(taco.id);
          return (
            <button key={taco.id} onClick={() => onToggle(taco.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all active:scale-95 ${isSelected ? `${colors.border} bg-white/5` : "border-white/8 hover:border-white/15"}`}>
              <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-black/40">
                <Image src={taco.image} alt={taco.name} fill className="object-contain p-1" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight ${isSelected ? colors.text : "text-gray-200"}`}>{taco.name}</p>
              </div>
              {isSelected && (
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${colors.stepDot}`}>
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
