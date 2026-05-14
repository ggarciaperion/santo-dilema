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

const TACO_COMPLEMENTS = [
  { id: "nachos",       name: "Nachos",        emoji: "🌽" },
  { id: "chifles",      name: "Chifles",       emoji: "🍌" },
  { id: "papas-fritas", name: "Papas fritas",  emoji: "🍟" },
];

const REF_PRICES: Record<string, number> = {
  "pequeno-dilema": 22, "duo-dilema": 34, "taco-duo": 24.90, "chiguan-alitas": 12,
  "ensalada-clasica": 18.50, "ensalada-proteica": 20, "ensalada-caesar": 20,
  "ensalada-mediterranea": 23.50, "cobb-supreme-bowl": 23.50,
  "crispy-chicken-bowl": 22.50, "pasta-power-bowl": 22.50,
};

// ──────────────────────────────────────────────────────────────────
//  TIPOS
// ──────────────────────────────────────────────────────────────────

type ComboStep =
  | { type: "sauces"; productId: string; productName: string; count: number; label: string; excludeSauceIds?: string[] }
  | { type: "salad"; label: string }
  | { type: "tacos"; label: string };

interface FixedComboItem {
  productId: string;
  cartSalsas: string[];
  cartComplementIds: string[];
  cartOriginalPrice: number;
  summaryLabel: string;
  summaryImage: string;
  summaryDetails: string[];
}

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
  fixedItems?: FixedComboItem[];
  images: string[];
  colors: ComboColors;
}

interface Selections {
  sauces: Record<string, string[]>;
  salad: string;
  tacos: string[];
  tacoComplement: string;
}

type ModalPhase = "selecting" | "confirming" | null;

const emptySelections = (): Selections => ({ sauces: {}, salad: "", tacos: [], tacoComplement: "" });

// ──────────────────────────────────────────────────────────────────
//  COMBOS
// ──────────────────────────────────────────────────────────────────

const COMBOS: ComboConfig[] = [
  {
    id: "combo-chiguan",
    name: "Combo Chiguan",
    emoji: "🔥",
    tagline: "Alitas, taco y punto",
    description: "El combo que no necesita justificación. 4 alitas con tu salsa, un Crunch Supreme Taco con nachos. Todo en uno, sin complicaciones.",
    price: 20,
    maxSavings: 0,
    includes: [
      "4 alitas de pollo · salsa a elección",
      "Crunch Supreme Taco · Nachos incluidos",
    ],
    steps: [
      {
        type: "sauces",
        productId: "chiguan-alitas",
        productName: "4 Alitas",
        count: 1,
        label: "Elige tu salsa para las alitas",
        excludeSauceIds: ["anticuchos"],
      },
    ],
    fixedItems: [
      {
        productId: "taco-duo",
        cartSalsas: ["santo-crujiente"],
        cartComplementIds: ["nachos"],
        cartOriginalPrice: REF_PRICES["taco-duo"] ?? 0,
        summaryLabel: "Crunch Supreme Taco",
        summaryImage: "/crunch.png",
        summaryDetails: ["Sabor fijo · Nachos incluidos"],
      },
    ],
    images: ["/pequeno-dilema.png", "/crunch.png"],
    colors: {
      text:    "text-violet-400",
      border:  "border-violet-500/30",
      badge:   "bg-violet-500/15 text-violet-300 border border-violet-500/30",
      btn:     "bg-violet-600 hover:bg-violet-500 text-white",
      stepDot: "bg-violet-500",
      glow:    "0 0 35px rgba(139,92,246,0.18)",
      rgb:     "139,92,246",
    },
  },
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
  "chiguan-alitas":       { name: "4 Alitas · Chiguan",  image: "/pequeno-dilema.png" },
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
        image: PRODUCT_IMAGES[step.productId] ?? ALL_PRODUCTS[step.productId]?.image,
        details: names.length ? [`Salsa: ${names.join(", ")}`] : [],
      });
    } else if (step.type === "salad") {
      const salad = FIT_OPTIONS.find(p => p.id === sel.salad);
      if (salad) items.push({ label: salad.name, image: salad.image, details: [`S/ ${salad.price.toFixed(2)}`] });
    } else if (step.type === "tacos") {
      const names = sel.tacos.map(id => TACO_OPTIONS.find(t => t.id === id)?.name ?? id);
      const complement = TACO_COMPLEMENTS.find(c => c.id === sel.tacoComplement);
      items.push({ label: "Dúo de Tacos", image: "/tacoinicio.png", details: complement ? [...names, `Complemento: ${complement.name}`] : names });
    }
  }
  // Agregar items fijos del combo (no seleccionables por el usuario)
  for (const fi of combo.fixedItems ?? []) {
    items.push({ label: fi.summaryLabel, image: fi.summaryImage, details: fi.summaryDetails });
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
    if (step.type === "tacos")  return selections.tacos.length === 2 && !!selections.tacoComplement;
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

  const selectTacoComplement = (id: string) => setSelections(prev => ({ ...prev, tacoComplement: id }));

  // ── Guardar en sessionStorage ──────────────────────────────────
  const saveToCart = () => {
    if (!activeCombo) return;
    const comboGroupId = `cg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const comboOriginalTotal = activeCombo.maxSavings > 0
      ? parseFloat((activeCombo.price + activeCombo.maxSavings).toFixed(2))
      : undefined;
    const comboMeta = { comboGroupId, comboName: activeCombo.name, comboPrice: activeCombo.price, comboOriginalTotal };
    const items: any[] = [];
    for (const step of activeCombo.steps) {
      if (step.type === "sauces") {
        items.push({ productId: step.productId, quantity: 1, salsas: selections.sauces[step.productId] ?? [], complementIds: [], originalPrice: REF_PRICES[step.productId] ?? 0, finalPrice: REF_PRICES[step.productId] ?? 0, ...comboMeta });
      } else if (step.type === "salad") {
        const salad = FIT_OPTIONS.find(p => p.id === selections.salad);
        if (salad) items.push({ productId: salad.id, quantity: 1, salsas: [], complementIds: [], originalPrice: salad.price, finalPrice: salad.price, ...comboMeta });
      } else if (step.type === "tacos") {
        items.push({ productId: "taco-duo", quantity: 1, salsas: selections.tacos, complementIds: selections.tacoComplement ? [selections.tacoComplement] : [], category: "taco", originalPrice: REF_PRICES["taco-duo"], finalPrice: REF_PRICES["taco-duo"], ...comboMeta });
      }
    }
    // Agregar items fijos del combo (taco/complemento predefinidos)
    for (const fi of activeCombo.fixedItems ?? []) {
      items.push({ productId: fi.productId, name: fi.summaryLabel, quantity: 1, salsas: fi.cartSalsas, complementIds: fi.cartComplementIds, category: "taco", originalPrice: fi.cartOriginalPrice, finalPrice: fi.cartOriginalPrice, ...comboMeta });
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
    <div className="min-h-screen bg-[#080808] text-white">

      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes combosCardIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes combosPulse {
          0%, 100% { opacity: 0.04; }
          50%       { opacity: 0.09; }
        }
      `}</style>

      {/* ── FONDO con textura ── */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(245,158,11,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.07) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          animation: "combosPulse 4s ease-in-out infinite",
        }}
      />
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 70%)" }}
      />

      {/* ── ICONOS DECORATIVOS DE FONDO ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" style={{ opacity: 0.14 }}>

        {/* Llama grande izquierda */}
        <svg className="absolute top-20 left-6 w-24 h-24 text-amber-400 float-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M50 90 Q20 75 22 50 Q24 35 35 25 Q30 40 40 42 Q32 28 42 15 Q44 30 52 33 Q48 20 58 10 Q65 28 60 42 Q72 35 68 50 Q75 65 50 90Z"/>
        </svg>

        {/* Llama pequeña derecha arriba */}
        <svg className="absolute top-32 right-10 w-16 h-16 text-orange-400 float-medium" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M50 88 Q25 72 27 50 Q29 36 40 26 Q36 40 44 43 Q38 30 46 18 Q52 32 58 35 Q54 22 63 14 Q68 30 64 44 Q74 36 70 52 Q74 68 50 88Z"/>
        </svg>

        {/* Alita izquierda centro */}
        <svg className="absolute top-1/2 left-8 w-28 h-28 text-amber-300 sway-left" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M20 70 Q15 50 25 35 Q35 22 55 20 Q70 20 78 30 Q85 40 80 55 Q75 68 60 72 Q45 76 20 70Z"/>
          <path d="M25 65 Q30 48 42 40 Q54 33 65 38"/>
          <path d="M30 60 Q38 47 50 43"/>
          <circle cx="60" cy="55" r="5" fill="currentColor" opacity="0.4"/>
        </svg>

        {/* Taco derecha centro */}
        <svg className="absolute top-1/2 right-6 w-24 h-24 text-amber-400 sway-right" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M15 65 Q50 20 85 65Z"/>
          <path d="M25 65 Q30 52 40 48"/>
          <path d="M60 65 Q65 50 75 47"/>
          <ellipse cx="50" cy="56" rx="12" ry="6"/>
          <path d="M38 65 Q42 58 50 56 Q58 54 62 65"/>
        </svg>

        {/* Bowl ensalada abajo izquierda */}
        <svg className="absolute bottom-28 left-12 w-20 h-20 text-amber-300 float-medium" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8">
          <ellipse cx="50" cy="65" rx="38" ry="10"/>
          <path d="M12 65 Q12 90 50 95 Q88 90 88 65"/>
          <path d="M30 60 Q25 48 32 38 Q40 30 48 44"/>
          <path d="M52 58 Q48 44 54 36 Q62 28 68 44"/>
          <circle cx="42" cy="50" r="5" fill="currentColor" opacity="0.3"/>
          <circle cx="62" cy="48" r="4" fill="currentColor" opacity="0.25"/>
        </svg>

        {/* Estrella/chispa arriba centro */}
        <svg className="absolute top-24 left-1/2 w-14 h-14 text-yellow-400 float-slow" style={{ marginLeft: -80 }} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M50 10 L54 40 L82 38 L60 58 L68 88 L50 70 L32 88 L40 58 L18 38 L46 40Z"/>
        </svg>

        {/* Chispa pequeña derecha abajo */}
        <svg className="absolute bottom-40 right-14 w-12 h-12 text-orange-300 float-medium" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M50 15 L53 43 L78 40 L60 58 L66 85 L50 68 L34 85 L40 58 L22 40 L47 43Z"/>
        </svg>

        {/* Plus neon pequeño */}
        <svg className="absolute top-1/3 right-24 w-10 h-10 text-amber-500 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round">
          <line x1="50" y1="15" x2="50" y2="85"/>
          <line x1="15" y1="50" x2="85" y2="50"/>
        </svg>

        {/* Plus neon pequeño 2 */}
        <svg className="absolute bottom-1/3 left-20 w-8 h-8 text-amber-400 bounce-subtle" style={{ animationDelay: "0.5s" }} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round">
          <line x1="50" y1="15" x2="50" y2="85"/>
          <line x1="15" y1="50" x2="85" y2="50"/>
        </svg>

        {/* Alita pequeña abajo derecha */}
        <svg className="absolute bottom-20 right-8 w-16 h-16 text-orange-300 sway-right" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M22 68 Q18 50 28 36 Q38 24 56 22 Q70 22 77 32 Q83 42 78 56 Q72 68 57 71 Q42 74 22 68Z"/>
          <path d="M28 63 Q34 48 45 41 Q56 34 66 40"/>
          <circle cx="58" cy="54" r="4" fill="currentColor" opacity="0.4"/>
        </svg>
      </div>

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 md:sticky md:left-auto md:right-auto z-30 backdrop-blur-md" style={{ background: "rgba(8,8,8,0.92)", borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)" }} />
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3 relative z-10">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/logoprincipal.png" alt="Santo Dilema" width={300} height={75} className="h-10 md:h-9 w-auto" priority />
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Link href="/fat" className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors neon-glow-fat px-2 py-1 rounded border border-red-500/30 hover:border-red-400 hidden sm:block">
              Ver menú Alitas →
            </Link>
            <Link href="/fat" className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors neon-glow-fat px-2 py-1 rounded border border-red-500/30 hover:border-red-400 sm:hidden">
              Alitas
            </Link>
            <Link href="/fit" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors neon-glow-fit px-2 py-1 rounded border border-cyan-500/30 hover:border-cyan-400 hidden sm:block">
              Ver menú Ensaladas →
            </Link>
            <Link href="/fit" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors neon-glow-fit px-2 py-1 rounded border border-cyan-500/30 hover:border-cyan-400 sm:hidden">
              Ensaladas
            </Link>
            <Link href="/tacos" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors neon-glow-taco px-2 py-1 rounded border border-emerald-500/30 hover:border-emerald-400 hidden sm:block">
              Ver menú Tacos →
            </Link>
            <Link href="/tacos" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors neon-glow-taco px-2 py-1 rounded border border-emerald-500/30 hover:border-emerald-400 sm:hidden">
              Tacos
            </Link>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header on mobile */}
      <div className="h-[56px] md:hidden" />

      {/* ── CLOSED BANNER ── */}
      {!isOpen && (
        <div className="relative z-10 bg-gray-900 border-b-2 border-amber-500/30 px-4 py-3 text-center">
          <p className="text-amber-400 text-sm font-bold">⏰ Estamos cerrados por ahora</p>
          <p className="text-gray-400 text-xs mt-0.5">{getNextOpenMessage()}</p>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-black uppercase tracking-widest rounded-full px-4 py-1.5 mb-5"
          style={{ boxShadow: "0 0 16px rgba(245,158,11,0.12)" }}>
          🔥 Precio especial · Descuento automático
        </div>
        <h2
          className="font-black text-white mb-3 leading-tight"
          style={{ fontFamily: "var(--font-graffiti)", fontSize: "clamp(2rem, 8vw, 3rem)", textShadow: "0 0 30px rgba(245,158,11,0.25)" }}
        >
          Combos para todos los <span style={{ color: "#fbbf24", textShadow: "0 0 20px rgba(245,158,11,0.7)" }}>pecados</span>
        </h2>
        <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
          Elige tu combo, personaliza y el descuento se aplica solo al pedir.
        </p>

        {/* Línea decorativa */}
        <div className="mt-6 mx-auto h-px w-32" style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)" }} />
      </section>


      {/* ── COMBO GRID ── */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {COMBOS.map((combo, i) => (
          <ComboCard key={combo.id} combo={combo} isOpen={isOpen} index={i} onSelect={() => openModal(combo)} />
        ))}
      </main>

      <p className="relative z-10 text-center text-[10px] text-gray-700 pb-8 px-4 tracking-wide">
        El descuento se calcula automáticamente en el checkout · No acumulable con cupones
      </p>

      {/* ── TU ORDEN ──────────────────────────────────────────────── */}
      {showTuOrden && savedOrders.length > 0 && (
        <section ref={tuOrdenRef} className="relative z-10 max-w-3xl mx-auto px-4 pb-36">
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
                                {isTaco && item.complementIds && item.complementIds.length > 0 && (
                                  <p className="text-[10px] text-green-300/70 truncate">
                                    + {TACO_COMPLEMENTS.find(c => c.id === item.complementIds[0])?.name ?? item.complementIds[0]}
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
          onSelectTacoComplement={selectTacoComplement}
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
                              {isTaco && item.complementIds && item.complementIds.length > 0 && (
                                <p className="text-[10px] text-green-300/70 mt-0.5">
                                  + {TACO_COMPLEMENTS.find(c => c.id === item.complementIds[0])?.name ?? item.complementIds[0]}
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

function ComboCard({ combo, isOpen, index, onSelect }: { combo: ComboConfig; isOpen: boolean; index: number; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const { rgb } = combo.colors;

  return (
    <article
      className="flex flex-col rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: "rgba(12,12,12,0.9)",
        border: `1.5px solid rgba(${rgb},${hovered ? 0.55 : 0.2})`,
        boxShadow: hovered
          ? `0 0 0 1px rgba(${rgb},0.15), 0 8px 32px rgba(${rgb},0.22), 0 2px 8px rgba(0,0,0,0.6)`
          : `0 0 20px rgba(${rgb},0.08), 0 2px 8px rgba(0,0,0,0.4)`,
        transform: hovered ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)",
        transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
        animation: `combosCardIn 0.5s ease ${index * 0.08}s both`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setTimeout(() => setHovered(false), 300)}
      onClick={isOpen ? onSelect : undefined}
    >
      {/* ── TOP NEON LINE ── */}
      <div className="h-0.5 shrink-0" style={{ background: `linear-gradient(90deg, transparent, rgba(${rgb},0.8), transparent)` }} />

      {/* ── IMAGE AREA ── */}
      <div className="relative bg-black overflow-hidden" style={{ height: 200 }}>
        {/* Product images */}
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
            <div className="w-1/2 relative h-full"
              style={{ transform: hovered ? "scale(1.06)" : "scale(1)", transition: "transform 0.4s ease" }}>
              <Image src={combo.images[0]} alt="" fill className="object-contain p-4" />
            </div>
            <PlusSeparator colors={combo.colors} />
            <div className="w-1/2 relative h-full"
              style={{ transform: hovered ? "scale(1.06)" : "scale(1)", transition: "transform 0.4s ease 0.04s" }}>
              <Image src={combo.images[1]} alt="" fill className="object-contain p-4" />
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(to top, rgba(12,12,12,0.95) 0%, rgba(12,12,12,0.2) 50%, transparent 100%)` }} />

        {/* Color tint on hover */}
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{ background: `radial-gradient(ellipse at center, rgba(${rgb},0.1) 0%, transparent 70%)`, opacity: hovered ? 1 : 0 }} />

        {/* Savings badge */}
        {combo.maxSavings > 0 && (
          <span
            className="absolute top-3 left-3 text-[10px] font-black rounded-full px-2.5 py-1 uppercase tracking-wider"
            style={{
              background: `rgba(${rgb},0.15)`,
              border: `1px solid rgba(${rgb},0.4)`,
              color: `rgb(${rgb})`,
              boxShadow: `0 0 8px rgba(${rgb},0.2)`,
            }}
          >
            Ahorra S/ {combo.maxSavings.toFixed(2)}
          </span>
        )}

        {/* Emoji badge */}
        <span className="absolute top-3 right-3 text-2xl select-none"
          style={{ filter: `drop-shadow(0 0 8px rgba(${rgb},0.6))`, transform: hovered ? "scale(1.15)" : "scale(1)", transition: "transform 0.3s ease" }}>
          {combo.emoji}
        </span>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-col flex-1 px-4 pt-3 pb-4 gap-3">
        {/* Title + tagline */}
        <div>
          <h3
            className="font-black leading-tight"
            style={{
              fontFamily: "var(--font-graffiti)",
              fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
              color: `rgb(${rgb})`,
              textShadow: hovered ? `0 0 16px rgba(${rgb},0.7), 0 0 32px rgba(${rgb},0.3)` : `0 0 8px rgba(${rgb},0.3)`,
              transition: "text-shadow 0.3s ease",
            }}
          >
            {combo.name}
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5 italic">{combo.tagline}</p>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">{combo.description}</p>
        </div>

        {/* Includes list */}
        <ul className="space-y-1.5">
          {combo.includes.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
              <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: `rgba(${rgb},0.15)`, border: `1px solid rgba(${rgb},0.4)`, color: `rgb(${rgb})`, fontSize: 8 }}>
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-3 pt-3 mt-auto"
          style={{ borderTop: `1px solid rgba(${rgb},0.12)` }}>
          <div className="leading-none">
            {combo.maxSavings > 0 && (
              <div className="text-[11px] text-gray-600 line-through mb-0.5">
                S/ {(combo.price + combo.maxSavings).toFixed(2)}
              </div>
            )}
            <div className="flex items-baseline gap-1">
              <span
                className="text-2xl font-black"
                style={{
                  color: "#fff",
                  textShadow: `0 0 12px rgba(${rgb},0.5)`,
                }}
              >
                S/ {combo.price.toFixed(2)}
              </span>
              <span className="text-xs font-bold" style={{ color: `rgb(${rgb})` }}>combo</span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); if (isOpen) onSelect(); }}
            disabled={!isOpen}
            className="flex-1 max-w-[160px] py-3 rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, rgba(${rgb},0.85), rgba(${rgb},0.65))`,
              boxShadow: isOpen ? `0 0 16px rgba(${rgb},0.3), 0 2px 8px rgba(0,0,0,0.4)` : "none",
              color: "#fff",
              border: `1px solid rgba(${rgb},0.4)`,
            }}
          >
            {isOpen ? "Elegir combo →" : "Cerrado"}
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
  onClose, onToggleSauce, onSelectSalad, onToggleTaco, onSelectTacoComplement, onNext, onBack,
}: {
  combo: ComboConfig; currentStep: number; selections: Selections;
  visible: boolean; isStepValid: boolean; isLastStep: boolean;
  onClose: () => void;
  onToggleSauce: (productId: string, sauceId: string, maxCount: number) => void;
  onSelectSalad: (id: string) => void;
  onToggleTaco: (id: string) => void;
  onSelectTacoComplement: (id: string) => void;
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
            <TacoStep selected={selections.tacos} tacoComplement={selections.tacoComplement} colors={combo.colors} onToggle={onToggleTaco} onSelectComplement={onSelectTacoComplement} />
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
  const visibleSalsas = SALSAS.filter(s => !step.excludeSauceIds?.includes(s.id));
  return (
    <div className="pt-2">
      <p className="text-white font-semibold mb-1">{step.label}</p>
      <p className="text-xs text-gray-500 mb-4">
        {step.count === 1 ? "Elige 1 salsa" : `Elige ${step.count} salsas`} · {selected.length}/{step.count} seleccionada{step.count > 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {visibleSalsas.map(salsa => {
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

function TacoStep({ selected, tacoComplement, colors, onToggle, onSelectComplement }: {
  selected: string[];
  tacoComplement: string;
  colors: ComboColors;
  onToggle: (id: string) => void;
  onSelectComplement: (id: string) => void;
}) {
  return (
    <div className="pt-2">
      <p className="text-white font-semibold mb-1">Elige tus tacos</p>
      <p className="text-xs text-gray-500 mb-4">Selecciona 2 sabores · {selected.length}/2 seleccionados</p>
      <div className="space-y-2 mb-6">
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

      <p className="text-white font-semibold mb-1">Elige tu complemento</p>
      <p className="text-xs text-gray-500 mb-3">Nachos, chifles o papas fritas · incluido</p>
      <div className="grid grid-cols-3 gap-2">
        {TACO_COMPLEMENTS.map(c => {
          const isSelected = tacoComplement === c.id;
          return (
            <button key={c.id} onClick={() => onSelectComplement(c.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95 ${isSelected ? `${colors.border} bg-white/5` : "border-white/8 hover:border-white/15"}`}>
              <span className="text-2xl">{c.emoji}</span>
              <span className={`text-xs font-semibold text-center leading-tight ${isSelected ? colors.text : "text-gray-300"}`}>{c.name}</span>
              {isSelected && (
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${colors.stepDot}`}>
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
