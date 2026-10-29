"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { isBusinessOpen, getNextOpenMessage } from "../utils/businessHours";
import PageMotionWrapper from "../components/PageMotionWrapper";

// ─── Section IDs ─────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: "alitas",    label: "Alitas",       emoji: "🍗" },
  { id: "ensaladas", label: "Ensaladas",    emoji: "🥗" },
  { id: "tacos",     label: "Tacos",        emoji: "🌮" },
  { id: "burgers",   label: "Mini Burgers", emoji: "🍔" },
  { id: "combos",    label: "Combos",       emoji: "🔥" },
];

// ─── Alitas data ─────────────────────────────────────────────────────────────
const ALITAS_PRODUCTS = [
  { id: "pequeno-dilema", name: "Pequeño Dilema", description: "8 alitas crujientes con papas francesas y tu salsa elegida.", price: 22.00, image: "/cv.jpeg",  baseSalsas: 1 },
  { id: "duo-dilema",     name: "Dúo Dilema",     description: "14 alitas con papas francesas y 2 salsas a elección.",        price: 34.00, image: "/vv.jpeg",  baseSalsas: 2 },
  { id: "santo-pecado",   name: "Santo Pecado",   description: "20 alitas, papas francesas y 3 salsas para combinar.",        price: 47.00, image: "/ss.jpeg",  baseSalsas: 3 },
];

const SALSAS = [
  { id: "barbecue",       name: "BBQ ahumada",         description: "Dulce y ahumada, perfecta para sabores clásicos" },
  { id: "buffalo-picante",name: "Santo Picante",       description: "Buffalo con picante equilibrado. Intensidad justa" },
  { id: "ahumada",        name: "Acevichada Imperial", description: "Fresco, cítrico y con suave picor al estilo peruano" },
  { id: "parmesano-ajo",  name: "Crispy Celestial",    description: "Ultra crujiente por fuera y jugosa por dentro" },
  { id: "anticuchos",     name: "Parrillera",           description: "Con especias aromáticas al estilo anticuchero" },
  { id: "honey-mustard",  name: "Honey mustard",        description: "Equilibrio perfecto entre dulce miel y mostaza" },
  { id: "teriyaki",       name: "Oriental Teriyaki",    description: "Salsa asiática, dulce y salado con notas ahumadas" },
  { id: "macerichada",    name: "Sweet & Sour",         description: "Contraste vibrante entre lo dulce y ácido" },
];

// Static promo map (productId → {salsas, price})
const SALSA_OFFERS: Record<string, { salsas: string[]; price: number }> = {
  "pequeno-dilema": { salsas: ["teriyaki"], price: 18 },
  "duo-dilema":     { salsas: ["barbecue","ahumada"], price: 32 },
  "santo-pecado":   { salsas: ["barbecue","buffalo-picante","parmesano-ajo"], price: 44 },
};

// ─── Ensaladas data ───────────────────────────────────────────────────────────
const FIT_PRODUCTS = [
  { id: "ensalada-proteica",    name: "CÉSAR POWER BOWL",    description: "Lechuga romana, pollo grillado, tomate cherry, crutones y parmesano. César cremosa de la casa.", price: 22.50, image: "/2.png",      category: "fit" as const },
  { id: "ensalada-caesar",      name: "PROTEIN FIT BOWL",    description: "Mix de hojas verdes, quinua, palta, tomate cherry, semillas y pollo grillado. Aderezo yogurt griego.", price: 23.50, image: "/3.png",      category: "fit" as const },
  { id: "cobb-supreme-bowl",    name: "COBB SUPREME BOWL",   description: "Pollo grillado, tocino ahumado crocante, queso fresco, tomate, huevo y palta. Vinagreta de la casa.", price: 23.50, image: "/cobb.png",   category: "fit" as const },
  { id: "ensalada-mediterranea",name: "TUNA FRESH BOWL",     description: "Atún, lechuga romana, tomate cherry, pepino, maíz americano, palta y huevo. Aderezo especial.", price: 23.50, image: "/4.png",      category: "fit" as const },
  { id: "crispy-chicken-bowl",  name: "CRISPY CHICKEN BOWL", description: "Pollo crispy, maíz americano, mozzarella, tomate cherry y palta. Aderezo honey mustard.", price: 22.50, image: "/crispy.png", category: "fit" as const },
  { id: "pasta-power-bowl",     name: "PASTA POWER BOWL",    description: "Fideos, zanahoria, maíz, arvejitas, jamón, brócoli y pollo grillado. Aderezo especial.", price: 22.50, image: "/pasta.png",  category: "fit" as const },
  { id: "ensalada-clasica",     name: "CLÁSICA FRESH BOWL",  description: "Lechuga bogi, palta, huevo, tomate cherry, zanahoria, pepino y maíz. Vinagreta clásica.", price: 18.50, image: "/1.png",      category: "fit" as const },
];

// ─── Shared complements ───────────────────────────────────────────────────────
const COMPLEMENTS: Record<string, { name: string; price: number }> = {
  "agua-mineral": { name: "Agua mineral",    price: 4 },
  "coca-cola":    { name: "Coca Cola 500ml", price: 4 },
  "inka-cola":    { name: "Inka Cola 500ml", price: 4 },
  "sprite":       { name: "Sprite 500ml",    price: 4 },
  "fanta":        { name: "Fanta 500ml",     price: 4 },
  "extra-aderezo":  { name: "Extra aderezo",   price: 3 },
  "extra-papas":    { name: "Extra papas",     price: 5 },
  "extra-nachos":   { name: "Extra nachos",    price: 5 },
  "pollo-grillado": { name: "Pollo grillado",  price: 5 },
  "nachos":         { name: "Nachos",          price: 0 },
  "chifles":      { name: "Chifles",         price: 0 },
  "papas-fritas": { name: "Papas fritas",    price: 0 },
  ...Object.fromEntries(SALSAS.map(s => [`extra-salsa-${s.id}`, { name: `Extra salsa — ${s.name}`, price: 3 }])),
};

// ─── Tacos data ───────────────────────────────────────────────────────────────
const TACO_FLAVORS = [
  { id: "santo-crujiente", name: "CRUNCH SUPREME TACO", tagline: "Crujiente y tentador",    description: "Pollo crispy dorado, lechuga, pico de gallo, aros de cebolla y aioli.", image: "/crunch.png" },
  { id: "tex-dilema",      name: "TEX SUPREME TACO",    tagline: "Toque tex-mex",           description: "Pollo crispy, guacamole cremoso, pico de gallo y cilantro dressing.",   image: "/tex.png"    },
  { id: "santo-bacon",     name: "BACON DELUXE TACO",   tagline: "El que lo prueba, repite",description: "Pollo crispy, bacon crocante, cheddar fundido, pimientos y salsa.",      image: "/bacon.png"  },
];

const TACO_COMPLEMENTS = [
  { id: "nachos",       name: "Nachos",       emoji: "🌽" },
  { id: "chifles",      name: "Chifles",      emoji: "🍌" },
  { id: "papas-fritas", name: "Papas fritas", emoji: "🍟" },
];

const BEBIDAS = [
  { id: "coca-cola",    name: "Coca Cola 500ml", emoji: "🥤", price: 4 },
  { id: "inka-cola",    name: "Inka Cola 500ml", emoji: "🥤", price: 4 },
  { id: "sprite",       name: "Sprite 500ml",    emoji: "🥤", price: 4 },
  { id: "fanta",        name: "Fanta 500ml",     emoji: "🥤", price: 4 },
  { id: "agua-mineral", name: "Agua mineral",    emoji: "💧", price: 4 },
];

const BEBIDAS_KEY = "santo-dilema-tacos-bebidas";

// ─── Burgers data ─────────────────────────────────────────────────────────────
const DUO_BASE_PRICE  = 19.90;
const TRIO_BASE_PRICE = 23.50;

const BURGER_FLAVORS = [
  { id: "santo-smash",        name: "Santo Smash",        description: "Carne smash doradita, cheddar fundido, lechuga y tomate con salsa pickle.",           image: "/burgers/santo-smash.webp"        },
  { id: "bacon-pecado",       name: "Bacon Pecado",       description: "Carne smash, cheddar fundido, bacon crocante y cebolla crispy.",                      image: "/burgers/bacon-pecado.webp"       },
  { id: "chicken-grill",      name: "Chicken Grill",      description: "Pollo a la plancha, queso, lechuga y tomate con crema de ajo y hierbas.",             image: "/burgers/chicken-grill.webp"      },
  { id: "dilema-veggie",      name: "Dilema Veggie",      description: "Tortilla de avena con verduras, queso, lechuga y tomate.",                            image: "/burgers/dilema-veggie.webp"      },
  { id: "marina-crunch",      name: "Marina Crunch",      description: "Pescado crispy, lechuga fresca y cebolla morada con crema pickle.",                   image: "/burgers/marina-crunch.webp"      },
  { id: "tentacion-tropical", name: "Tentación Tropical", description: "Carne smash, cheddar fundido, piña a la parrilla y cebolla crispy.",                  image: "/burgers/tentacion-tropical.webp" },
];

const BURGER_HALO: Record<string, string> = {
  "santo-smash": "rgba(251,146,60,.45)", "bacon-pecado": "rgba(200,60,30,.44)",
  "chicken-grill": "rgba(251,191,36,.42)", "dilema-veggie": "rgba(101,163,90,.40)",
  "marina-crunch": "rgba(30,100,165,.42)", "tentacion-tropical": "rgba(234,179,8,.44)",
};

// ─── Combos data ─────────────────────────────────────────────────────────────
const REF_PRICES: Record<string, number> = {
  "pequeno-dilema": 22, "duo-dilema": 34, "taco-duo": 24.90, "chiguan-alitas": 12,
  "ensalada-clasica": 18.50, "ensalada-proteica": 22.50, "ensalada-caesar": 23.50,
  "ensalada-mediterranea": 23.50, "cobb-supreme-bowl": 23.50,
  "crispy-chicken-bowl": 22.50, "pasta-power-bowl": 22.50,
};

type ComboStep =
  | { type: "sauces"; productId: string; productName: string; count: number; label: string; excludeSauceIds?: string[] }
  | { type: "salad"; label: string }
  | { type: "tacos"; label: string };

interface ComboColors { text: string; border: string; badge: string; btn: string; stepDot: string; rgb: string; }
interface ComboFixed { productId: string; cartSalsas: string[]; cartComplementIds: string[]; cartOriginalPrice: number; summaryLabel: string; summaryImage: string; summaryDetails: string[]; }

interface ComboConfig {
  id: string; name: string; emoji: string; tagline: string; description: string;
  price: number; maxSavings: number; includes: string[];
  steps: ComboStep[]; fixedItems?: ComboFixed[];
  images: string[]; colors: ComboColors;
}

interface ComboSelections { sauces: Record<string, string[]>; salad: string; tacos: string[]; tacoComplement: string; }
type ComboPhase = "selecting" | "confirming" | null;

const emptyComboSel = (): ComboSelections => ({ sauces: {}, salad: "", tacos: [], tacoComplement: "" });

const COMBO_PRODUCT_IMAGES: Record<string, string> = {
  "pequeno-dilema": "/pequeno-dilema.png", "duo-dilema": "/duo-dilema.png",
  "chiguan-alitas": "/pequeno-dilema.png",
  "ensalada-clasica":"/1.png","ensalada-proteica":"/2.png","ensalada-caesar":"/3.png",
  "ensalada-mediterranea":"/4.png","cobb-supreme-bowl":"/cobb.png","crispy-chicken-bowl":"/crispy.png","pasta-power-bowl":"/pasta.png",
  "taco-duo":"/tacoinicio.png",
};

const COMBOS: ComboConfig[] = [
  {
    id: "combo-chiguan", name: "Combo Chiguan", emoji: "🔥", tagline: "Alitas, taco y punto",
    description: "4 alitas con tu salsa, un Crunch Supreme Taco con nachos. Todo en uno.",
    price: 20, maxSavings: 0,
    includes: ["4 alitas de pollo · salsa a elección", "Crunch Supreme Taco · Nachos incluidos"],
    steps: [{ type: "sauces", productId: "chiguan-alitas", productName: "4 Alitas", count: 1, label: "Elige tu salsa para las alitas", excludeSauceIds: ["anticuchos"] }],
    fixedItems: [{ productId: "taco-duo", cartSalsas: ["santo-crujiente"], cartComplementIds: ["nachos"], cartOriginalPrice: REF_PRICES["taco-duo"] ?? 0, summaryLabel: "Crunch Supreme Taco", summaryImage: "/crunch.png", summaryDetails: ["Sabor fijo · Nachos incluidos"] }],
    images: ["/bn.jpeg"],
    colors: { text:"text-violet-400", border:"border-violet-500/30", badge:"", btn:"bg-violet-600 hover:bg-violet-500 text-white", stepDot:"bg-violet-500", rgb:"139,92,246" },
  },
  {
    id: "combo-perfecto", name: "Combo Perfecto", emoji: "🥗", tagline: "Balance que no miente",
    description: "Pequeño Dilema + Ensalada FIT a elección. Lo justo para cuando el cuerpo pide alitas pero la cabeza dice ensalada.",
    price: 40, maxSavings: 5.50,
    includes: ["Pequeño Dilema · 8 alitas + papas", "Ensalada FIT a elección"],
    steps: [
      { type: "sauces", productId: "pequeno-dilema", productName: "Pequeño Dilema", count: 1, label: "Elige tu salsa para las alitas" },
      { type: "salad", label: "Elige tu ensalada" },
    ],
    images: ["/nb.jpeg"],
    colors: { text:"text-emerald-400", border:"border-emerald-500/30", badge:"", btn:"bg-emerald-600 hover:bg-emerald-500 text-white", stepDot:"bg-emerald-500", rgb:"16,185,129" },
  },
  {
    id: "combo-especial", name: "Combo Especial", emoji: "🌮", tagline: "Alitas meets street food",
    description: "Pequeño Dilema + Dúo de Tacos. Crujiente, sabroso, sin complicaciones.",
    price: 42, maxSavings: 4.90,
    includes: ["Pequeño Dilema · 8 alitas + papas", "Dúo de Tacos · 2 sabores"],
    steps: [
      { type: "sauces", productId: "pequeno-dilema", productName: "Pequeño Dilema", count: 1, label: "Elige tu salsa para las alitas" },
      { type: "tacos", label: "Elige los 2 sabores de tus tacos" },
    ],
    images: ["/rr.jpeg"],
    colors: { text:"text-orange-400", border:"border-orange-500/30", badge:"", btn:"bg-orange-600 hover:bg-orange-500 text-white", stepDot:"bg-orange-500", rgb:"249,115,22" },
  },
  {
    id: "combo-alitas", name: "Combo Alitas", emoji: "🍗", tagline: "Doble dosis de pecado",
    description: "Pequeño Dilema + Dúo Dilema. Para los que entienden que una porción nunca fue suficiente.",
    price: 52, maxSavings: 4.00,
    includes: ["Pequeño Dilema · 8 alitas + papas", "Dúo Dilema · 14 alitas + papas"],
    steps: [
      { type: "sauces", productId: "pequeno-dilema", productName: "Pequeño Dilema", count: 1, label: "Salsa del Pequeño Dilema" },
      { type: "sauces", productId: "duo-dilema",     productName: "Dúo Dilema",     count: 2, label: "2 salsas para el Dúo Dilema" },
    ],
    images: ["/lo.jpeg"],
    colors: { text:"text-fuchsia-400", border:"border-fuchsia-500/30", badge:"", btn:"bg-fuchsia-600 hover:bg-fuchsia-500 text-white", stepDot:"bg-fuchsia-500", rgb:"217,70,239" },
  },
  {
    id: "combo-santo-dilema", name: "Combo Santo Dilema", emoji: "🔥", tagline: "El combo sin excusas",
    description: "Dúo Dilema + Ensalada FIT + Dúo de Tacos. Cuando no puedes decidir, la respuesta es las tres.",
    price: 76, maxSavings: 6.40,
    includes: ["Dúo Dilema · 14 alitas + papas", "Ensalada FIT a elección", "Dúo de Tacos · 2 sabores"],
    steps: [
      { type: "sauces", productId: "duo-dilema", productName: "Dúo Dilema", count: 2, label: "2 salsas para el Dúo Dilema" },
      { type: "salad", label: "Elige tu ensalada" },
      { type: "tacos", label: "Elige los 2 sabores de tus tacos" },
    ],
    images: ["/bc.jpeg"],
    colors: { text:"text-red-400", border:"border-red-500/30", badge:"", btn:"bg-red-600 hover:bg-red-500 text-white", stepDot:"bg-red-500", rgb:"239,68,68" },
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface AlitasOrder {
  productId: string;
  quantity: number;
  salsas: string[];
  complementIds: string[];
  originalPrice?: number;
  finalPrice?: number;
  discountApplied?: boolean;
  category: "fat";
}

interface TrioFlavor { id: string; name: string; qty: number; }
interface TrioOrder {
  trioGroupId: string;
  trioName: string;
  trioPrice: number;
  trioQuantity: number;
  trioFlavors: TrioFlavor[];
  complementIds: string[];
  category: "burger-trio";
}

interface TacoOrder {
  productId: "taco-duo";
  quantity: 1;
  salsas: [string, string];   // [taco1, taco2]
  complementIds: string[];    // [complement, ...extras]
  finalPrice?: number;
  originalPrice?: number;
  category: "taco";
}

interface FitOrder {
  productId: string;
  quantity: number;
  complementIds: string[];
  originalPrice?: number;
  finalPrice?: number;
  discountApplied?: boolean;
  category: "fit";
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const router = useRouter();

  const [isOpen, setIsOpen]           = useState(isBusinessOpen());
  const [activeSection, setActiveSection] = useState("alitas");
  const sectionRefs    = useRef<Record<string, HTMLElement | null>>({});
  const comboCarouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, dir: "left" | "right") => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "right" ? 304 : -304, behavior: "smooth" });
  };

  // ── Carruseles móvil con auto-play ────────────────────────────────────────
  const alitasCarouselRef  = useRef<HTMLDivElement>(null);
  const fitCarouselRef     = useRef<HTMLDivElement>(null);
  const tacoCarouselRef    = useRef<HTMLDivElement>(null);
  const combosCarouselRef  = useRef<HTMLDivElement>(null);
  const [alitasIdx,  setAlitasIdx]  = useState(0);
  const [fitIdx,     setFitIdx]     = useState(0);
  const [tacoIdx,    setTacoIdx]    = useState(0);
  const [combosIdx,  setCombosIdx]  = useState(0);
  const carouselPausedRef = useRef(false);

  // Centra exactamente el card en índice i dentro del carrusel
  const scrollToCard = useCallback((ref: React.RefObject<HTMLDivElement | null>, index: number) => {
    const el = ref.current;
    if (!el || window.innerWidth >= 768) return;
    const gap = 16; // gap-4
    const cardWidth = 0.76 * window.innerWidth;
    el.scrollTo({ left: gap + index * (cardWidth + gap), behavior: 'smooth' });
  }, []);

  // Pausa el auto-play 5 s cuando el usuario interactúa
  const pauseCarousel = useCallback(() => {
    carouselPausedRef.current = true;
    setTimeout(() => { carouselPausedRef.current = false; }, 5000);
  }, []);

  // Centrar en card 0 al montar
  useEffect(() => {
    scrollToCard(alitasCarouselRef, 0);
    scrollToCard(fitCarouselRef, 0);
    scrollToCard(tacoCarouselRef, 0);
    scrollToCard(combosCarouselRef, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-play: avanza cada 3 s
  useEffect(() => {
    const t = setInterval(() => {
      if (carouselPausedRef.current) return;
      setAlitasIdx(i => (i + 1) % ALITAS_PRODUCTS.length);
      setFitIdx(i => (i + 1) % FIT_PRODUCTS.length);
      setTacoIdx(i => (i + 1) % TACO_FLAVORS.length);
      setCombosIdx(i => (i + 1) % COMBOS.length);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // Scroll al índice cuando cambia
  useEffect(() => { scrollToCard(alitasCarouselRef, alitasIdx); }, [alitasIdx, scrollToCard]);
  useEffect(() => { scrollToCard(fitCarouselRef, fitIdx); }, [fitIdx, scrollToCard]);
  useEffect(() => { scrollToCard(tacoCarouselRef, tacoIdx); }, [tacoIdx, scrollToCard]);
  useEffect(() => { scrollToCard(combosCarouselRef, combosIdx); }, [combosIdx, scrollToCard]);

  // API data
  const [menuStock,     setMenuStock]     = useState<Record<string, boolean>>({});
  const [menuPrices,    setMenuPrices]    = useState<Record<string, number>>({});
  const [menuDiscounts, setMenuDiscounts] = useState<Record<string, number>>({});
  const [salsaPromos,   setSalsaPromos]   = useState<any[]>([]);

  // ── Alitas state ──────────────────────────────────────────────────────────
  const [alitasModal,    setAlitasModal]    = useState<string | null>(null);  // productId
  const [alitasQty,      setAlitasQty]      = useState<Record<string, number>>({});
  const [alitasSalsas,   setAlitasSalsas]   = useState<Record<string, string[]>>({});
  const [alitasComplements, setAlitasComplements] = useState<Record<string, string[]>>({});
  const [alitasOrders,   setAlitasOrders]   = useState<AlitasOrder[]>([]);
  const [alitasShowSalsas,  setAlitasShowSalsas]  = useState<Record<string, boolean>>({});
  const [alitasShowBebidas, setAlitasShowBebidas] = useState<Record<string, boolean>>({});
  const [alitasShowExtras,  setAlitasShowExtras]  = useState<Record<string, boolean>>({});
  const [alitasEditIdx,  setAlitasEditIdx]  = useState<number | null>(null);
  const [alitasToast,    setAlitasToast]    = useState<string | null>(null);
  const [alitasClosing,  setAlitasClosing]  = useState(false);
  const [alitasRecentSalsa, setAlitasRecentSalsa] = useState<string | null>(null);
  const [alitasRecentComp,  setAlitasRecentComp]  = useState<string | null>(null);

  // ── Ensaladas state ───────────────────────────────────────────────────────
  const [fitModal,       setFitModal]       = useState<string | null>(null);
  const [fitQty,         setFitQty]         = useState<Record<string, number>>({});
  const [fitComplements, setFitComplements] = useState<Record<string, string[]>>({});
  const [fitOrders,      setFitOrders]      = useState<FitOrder[]>([]);
  const [fitShowBebidas, setFitShowBebidas] = useState<Record<string, boolean>>({});
  const [fitEditIdx,     setFitEditIdx]     = useState<number | null>(null);
  const [fitToast,       setFitToast]       = useState<string | null>(null);
  const [fitClosing,     setFitClosing]     = useState(false);
  const [fitRecentComp,  setFitRecentComp]  = useState<string | null>(null);

  // ── Tacos state ───────────────────────────────────────────────────────────
  const [tacoModalOpen,      setTacoModalOpen]      = useState(false);
  const [taco1,              setTaco1]              = useState<string | null>(null);
  const [taco2,              setTaco2]              = useState<string | null>(null);
  const [tacoComplement,     setTacoComplement]     = useState<string | null>(null);
  const [tacoOrders,         setTacoOrders]         = useState<TacoOrder[]>([]);
  const [bebidaQty,          setBebidaQty]          = useState<Record<string, number>>({});
  const [tacoToast,          setTacoToast]          = useState(false);
  const [tacoInitialized,    setTacoInitialized]    = useState(false);
  const [tacoModalComps,     setTacoModalComps]     = useState<string[]>([]);
  const [tacoShowBebidas,    setTacoShowBebidas]    = useState(false);
  const [tacoShowExtras,     setTacoShowExtras]     = useState(false);
  const [tacoRecentComp,     setTacoRecentComp]     = useState<string | null>(null);

  // ── Burgers state ─────────────────────────────────────────────────────────
  const [burgerSelections, setBurgerSelections] = useState<Record<string, number>>({});
  const [burgerMode,       setBurgerMode]       = useState<"duo" | "trio">("trio");
  const [trioOrders,       setTrioOrders]       = useState<TrioOrder[]>([]);
  const [confirmTrio,      setConfirmTrio]       = useState<TrioOrder | null>(null);
  const [burgerToast,      setBurgerToast]       = useState(false);
  const [burgerTrioComps,  setBurgerTrioComps]   = useState<string[]>([]);
  const [burgerShowBebidas,setBurgerShowBebidas] = useState(false);
  const [burgerRecentComp, setBurgerRecentComp]  = useState<string | null>(null);

  // ── Combos state ──────────────────────────────────────────────────────────
  const [activeCombo,      setActiveCombo]      = useState<ComboConfig | null>(null);
  const [comboStep,        setComboStep]        = useState(0);
  const [comboSelections,  setComboSelections]  = useState<ComboSelections>(emptyComboSel());
  const [comboPhase,       setComboPhase]       = useState<ComboPhase>(null);
  const [comboSheetVisible,setComboSheetVisible]= useState(false);
  const [comboExtras,      setComboExtras]      = useState<string[]>([]);
  const [comboShowBebidas, setComboShowBebidas] = useState(false);
  const [comboShowExtras,  setComboShowExtras]  = useState(false);
  const [comboRecentExtra, setComboRecentExtra] = useState<string | null>(null);
  const [comboItems,       setComboItems]       = useState<any[]>([]);  // saved in sessionStorage

  // ── Initialise ──────────────────────────────────────────────────────────
  useEffect(() => {
    setIsOpen(isBusinessOpen());
    const iv = setInterval(() => setIsOpen(isBusinessOpen()), 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    fetch("/api/menu-stock").then(r => r.json()).then(setMenuStock).catch(() => {});
    fetch("/api/menu-prices",    { cache: "no-store" }).then(r => r.json()).then(setMenuPrices).catch(() => {});
    fetch("/api/menu-discounts", { cache: "no-store" }).then(r => r.json()).then(setMenuDiscounts).catch(() => {});
    fetch("/api/salsa-promos").then(r => r.json()).then(d => setSalsaPromos(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // ── Section nav observer ─────────────────────────────────────────────────
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) setActiveSection(id); },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  function scrollToSection(id: string) {
    const el = sectionRefs.current[id];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top, behavior: "smooth" });
  }

  // ── Alitas helpers ────────────────────────────────────────────────────────
  const effectiveSalsas = useMemo(
    () => SALSAS.map(s => ({ ...s, soldOut: !!menuStock[`salsa-${s.id}`] })),
    [menuStock]
  );

  function findPromo(productId: string, chosen: string[]): any {
    if (!chosen.length) return null;
    return salsaPromos.find((p: any) =>
      p.active && p.productId === productId &&
      chosen.every((id: string) => p.salsas.includes(id))
    ) ?? null;
  }

  function alitasRequired(productId: string): number {
    const qty = alitasQty[productId] || 1;
    const base = ALITAS_PRODUCTS.find(p => p.id === productId)?.baseSalsas ?? 1;
    return base * qty;
  }

  function alitasCanAdd(productId: string): boolean {
    return (alitasSalsas[productId]?.length ?? 0) === alitasRequired(productId);
  }

  function openAlitasModal(productId: string, editIdx?: number) {
    if (editIdx !== undefined) {
      const o = alitasOrders[editIdx];
      setAlitasQty(p => ({ ...p, [productId]: o.quantity }));
      setAlitasSalsas(p => ({ ...p, [productId]: [...o.salsas] }));
      setAlitasComplements(p => ({ ...p, [productId]: [...o.complementIds] }));
      setAlitasEditIdx(editIdx);
    } else {
      if (!alitasQty[productId]) setAlitasQty(p => ({ ...p, [productId]: 1 }));
      if (!alitasSalsas[productId]) setAlitasSalsas(p => ({ ...p, [productId]: [] }));
      setAlitasEditIdx(null);
    }
    setAlitasShowSalsas(p => ({ ...p, [productId]: true }));
    setAlitasModal(productId);
    setAlitasClosing(false);
  }

  function closeAlitasModal() {
    setAlitasClosing(true);
    setTimeout(() => { setAlitasModal(null); setAlitasClosing(false); }, 350);
  }

  function toggleAlitasSalsa(productId: string, salsaId: string, action: "add" | "remove") {
    const req = alitasRequired(productId);
    const cur = alitasSalsas[productId] ?? [];
    if (action === "remove") {
      const idx = cur.indexOf(salsaId);
      if (idx === -1) return;
      const next = [...cur]; next.splice(idx, 1);
      setAlitasSalsas(p => ({ ...p, [productId]: next }));
    } else {
      if (cur.length >= req) return;
      const next = [...cur, salsaId];
      setAlitasSalsas(p => ({ ...p, [productId]: next }));
      setAlitasRecentSalsa(`${productId}-${salsaId}`);
      setTimeout(() => setAlitasRecentSalsa(null), 800);
      if (next.length === req) {
        setTimeout(() => setAlitasShowSalsas(p => ({ ...p, [productId]: false })), 1200);
      }
    }
  }

  function addAlitasComplement(productId: string, compId: string) {
    setAlitasComplements(p => ({ ...p, [productId]: [...(p[productId] ?? []), compId] }));
    setAlitasRecentComp(`${productId}-${compId}`);
    setTimeout(() => setAlitasRecentComp(null), 800);
  }

  function removeAlitasComplement(productId: string, compId: string) {
    setAlitasComplements(p => {
      const arr = [...(p[productId] ?? [])];
      const idx = arr.lastIndexOf(compId);
      if (idx !== -1) arr.splice(idx, 1);
      return { ...p, [productId]: arr };
    });
  }

  function completeAlitasOrder(productId: string) {
    const product = ALITAS_PRODUCTS.find(p => p.id === productId)!;
    const qty     = alitasQty[productId] || 1;
    const chosen  = alitasSalsas[productId] ?? [];
    const comps   = alitasComplements[productId] ?? [];
    const base    = menuPrices[productId] || product.price;
    const eff     = menuDiscounts[productId] || base;
    const promo   = findPromo(productId, chosen);
    const final   = promo ? promo.promoPrice : eff;

    const order: AlitasOrder = {
      productId, quantity: qty, salsas: chosen, complementIds: comps,
      originalPrice: eff, finalPrice: final,
      discountApplied: final < eff,
      category: "fat",
    };

    if (alitasEditIdx !== null) {
      setAlitasOrders(p => p.map((o, i) => i === alitasEditIdx ? order : o));
      setAlitasEditIdx(null);
    } else {
      setAlitasOrders(p => [...p, order]);
    }

    // Reset modal state for this product
    setAlitasSalsas(p => ({ ...p, [productId]: [] }));
    setAlitasComplements(p => ({ ...p, [productId]: [] }));
    setAlitasQty(p => { const n = { ...p }; delete n[productId]; return n; });

    setAlitasToast(product.name);
    closeAlitasModal();
    setTimeout(() => setAlitasToast(null), 3200);
  }

  // ── Burgers handlers ──────────────────────────────────────────────────────
  const burgerTotal  = Object.values(burgerSelections).reduce((a, b) => a + b, 0);
  const activeSize   = burgerMode === "duo" ? 2 : 3;
  const activeBurgerPrice = burgerMode === "duo"
    ? (menuPrices["burger-duo"]  || DUO_BASE_PRICE)
    : (menuPrices["burger-trio"] || TRIO_BASE_PRICE);
  const burgerCanAdd = burgerTotal < activeSize;

  function addBurgerFlavor(id: string) {
    if (!burgerCanAdd) return;
    setBurgerSelections(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
  }

  function removeBurgerFlavor(id: string) {
    setBurgerSelections(p => {
      const cur = p[id] || 0; if (cur <= 0) return p;
      const n = { ...p }; if (cur === 1) delete n[id]; else n[id] = cur - 1; return n;
    });
  }

  function buildTrio(): TrioOrder {
    const trioGroupId = `trio-${Date.now()}`;
    return {
      trioGroupId,
      trioName: burgerMode === "duo" ? "Dúo Mini Burgers" : "Trío Mini Burgers",
      trioPrice: activeBurgerPrice,
      trioQuantity: 1,
      trioFlavors: BURGER_FLAVORS
        .filter(f => (burgerSelections[f.id] || 0) > 0)
        .map(f => ({ id: f.id, name: f.name, qty: burgerSelections[f.id] })),
      complementIds: [],
      category: "burger-trio",
    };
  }

  function handleAddTrio() {
    if (burgerTotal !== activeSize) return;
    const trio = buildTrio();
    setBurgerTrioComps([]);
    setBurgerShowBebidas(false);
    setBurgerRecentComp(null);
    setConfirmTrio(trio);
  }

  function confirmAndAddTrio() {
    if (!confirmTrio) return;
    const trioWithComps = { ...confirmTrio, complementIds: burgerTrioComps };
    setTrioOrders(p => [...p, trioWithComps]);
    setBurgerSelections({});
    setBurgerTrioComps([]);
    setBurgerShowBebidas(false);
    setConfirmTrio(null);
    setBurgerToast(true);
    setTimeout(() => setBurgerToast(false), 3200);
  }

  // ── Tacos: load/persist bebidas ──────────────────────────────────────────
  useEffect(() => {
    try { const raw = sessionStorage.getItem(BEBIDAS_KEY); if (raw) setBebidaQty(JSON.parse(raw)); } catch {}
    setTacoInitialized(true);
  }, []);
  useEffect(() => {
    if (!tacoInitialized) return;
    try { sessionStorage.setItem(BEBIDAS_KEY, JSON.stringify(bebidaQty)); } catch {}
  }, [bebidaQty, tacoInitialized]);

  // ── Tacos handlers ────────────────────────────────────────────────────────
  function openTacoModal(preselect?: string) {
    setTaco1(preselect ?? null);
    setTaco2(null);
    setTacoComplement(null);
    setTacoModalComps([]);
    setTacoShowBebidas(false);
    setTacoShowExtras(false);
    setTacoRecentComp(null);
    setTacoModalOpen(true);
  }

  function handleTacoFlavorClick(id: string) {
    if (!taco1)          { setTaco1(id); return; }
    if (!taco2)          { setTaco2(id); return; }
    setTaco2(id);                             // replace taco2
  }

  function addTacoOrder() {
    if (!taco1 || !taco2 || !tacoComplement) return;
    const realP = menuPrices["taco-duo"]    || 24.90;
    const eff   = menuDiscounts["taco-duo"] || realP;
    const order: TacoOrder = {
      productId: "taco-duo", quantity: 1,
      salsas: [taco1, taco2], complementIds: [tacoComplement!, ...tacoModalComps],
      finalPrice: eff, originalPrice: realP, category: "taco",
    };
    setTacoOrders(p => [...p, order]);
    setTacoModalOpen(false);
    setTacoToast(true);
    setTimeout(() => setTacoToast(false), 3200);
  }

  // ── Ensaladas handlers ────────────────────────────────────────────────────
  function openFitModal(productId: string, editIdx?: number) {
    if (editIdx !== undefined) {
      const o = fitOrders[editIdx];
      setFitQty(p => ({ ...p, [productId]: o.quantity }));
      setFitComplements(p => ({ ...p, [productId]: [...o.complementIds] }));
      setFitEditIdx(editIdx);
    } else {
      if (!fitQty[productId]) setFitQty(p => ({ ...p, [productId]: 1 }));
      if (!fitComplements[productId]) setFitComplements(p => ({ ...p, [productId]: [] }));
      setFitEditIdx(null);
    }
    setFitModal(productId);
    setFitClosing(false);
  }

  function closeFitModal() {
    setFitClosing(true);
    setTimeout(() => { setFitModal(null); setFitClosing(false); }, 350);
  }

  function addFitComplement(productId: string, compId: string) {
    setFitComplements(p => ({ ...p, [productId]: [...(p[productId] ?? []), compId] }));
    setFitRecentComp(`${productId}-${compId}`);
    setTimeout(() => setFitRecentComp(null), 800);
  }

  function removeFitComplement(productId: string, compId: string) {
    setFitComplements(p => {
      const arr = [...(p[productId] ?? [])];
      const idx = arr.lastIndexOf(compId);
      if (idx !== -1) arr.splice(idx, 1);
      return { ...p, [productId]: arr };
    });
  }

  function completeFitOrder(productId: string) {
    const product = FIT_PRODUCTS.find(p => p.id === productId)!;
    const qty     = fitQty[productId] || 1;
    const comps   = fitComplements[productId] ?? [];
    const base    = menuPrices[productId]    || product.price;
    const disc    = menuDiscounts[productId];
    const final   = disc || base;

    const order: FitOrder = {
      productId, quantity: qty, complementIds: comps,
      originalPrice: base, finalPrice: final,
      discountApplied: !!disc,
      category: "fit",
    };

    if (fitEditIdx !== null) {
      setFitOrders(p => p.map((o, i) => i === fitEditIdx ? order : o));
      setFitEditIdx(null);
    } else {
      setFitOrders(p => [...p, order]);
    }

    setFitComplements(p => ({ ...p, [productId]: [] }));
    setFitQty(p => { const n = { ...p }; delete n[productId]; return n; });
    setFitToast(product.name);
    closeFitModal();
    setTimeout(() => setFitToast(null), 3200);
  }

  // ── Combos handlers ───────────────────────────────────────────────────────
  function openCombo(combo: ComboConfig) {
    setActiveCombo(combo);
    setComboStep(0);
    setComboSelections(emptyComboSel());
    setComboPhase("selecting");
    setComboExtras([]);
    setComboShowBebidas(false);
    setComboShowExtras(false);
    setComboRecentExtra(null);
    setTimeout(() => setComboSheetVisible(true), 10);
  }

  function closeCombo() {
    setComboSheetVisible(false);
    setTimeout(() => { setActiveCombo(null); setComboPhase(null); }, 320);
  }

  function isComboStepValid(): boolean {
    if (!activeCombo) return false;
    const step = activeCombo.steps[comboStep];
    if (step.type === "sauces") return (comboSelections.sauces[step.productId]?.length ?? 0) === step.count;
    if (step.type === "salad")  return !!comboSelections.salad;
    if (step.type === "tacos")  return comboSelections.tacos.length === 2 && !!comboSelections.tacoComplement;
    return false;
  }

  function comboToggleSauce(productId: string, sauceId: string, max: number) {
    setComboSelections(prev => {
      const cur = prev.sauces[productId] ?? [];
      if (cur.includes(sauceId)) return { ...prev, sauces: { ...prev.sauces, [productId]: cur.filter(s => s !== sauceId) } };
      const next = cur.length >= max ? [...cur.slice(1), sauceId] : [...cur, sauceId];
      return { ...prev, sauces: { ...prev.sauces, [productId]: next } };
    });
  }

  function comboSaveToCart(extras: string[] = []) {
    if (!activeCombo) return;
    const comboGroupId = `cg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
    const basePrice   = menuPrices[activeCombo.id]    ?? activeCombo.price;
    const comboPrice  = menuDiscounts[activeCombo.id] ?? basePrice;
    const extrasTotal = extras.reduce((s, id) => s + (COMPLEMENTS[id]?.price ?? 0), 0);
    const comboOriginalTotal = menuDiscounts[activeCombo.id]
      ? parseFloat(basePrice.toFixed(2))
      : activeCombo.maxSavings > 0 ? parseFloat((comboPrice + activeCombo.maxSavings).toFixed(2)) : undefined;
    const meta = { comboGroupId, comboName: activeCombo.name, comboPrice: comboPrice + extrasTotal, comboOriginalTotal };
    const items: any[] = [];
    for (const step of activeCombo.steps) {
      if (step.type === "sauces") {
        items.push({ productId: step.productId, quantity: 1, salsas: comboSelections.sauces[step.productId] ?? [], complementIds: [], originalPrice: REF_PRICES[step.productId] ?? 0, finalPrice: REF_PRICES[step.productId] ?? 0, ...meta });
      } else if (step.type === "salad") {
        const sal = FIT_PRODUCTS.find(p => p.id === comboSelections.salad);
        if (sal) items.push({ productId: sal.id, quantity: 1, salsas: [], complementIds: [], originalPrice: sal.price, finalPrice: sal.price, ...meta });
      } else if (step.type === "tacos") {
        items.push({ productId: "taco-duo", quantity: 1, salsas: comboSelections.tacos, complementIds: comboSelections.tacoComplement ? [comboSelections.tacoComplement] : [], category: "taco", originalPrice: REF_PRICES["taco-duo"], finalPrice: REF_PRICES["taco-duo"], ...meta });
      }
    }
    for (const fi of activeCombo.fixedItems ?? []) {
      items.push({ productId: fi.productId, quantity: 1, salsas: fi.cartSalsas, complementIds: fi.cartComplementIds, category: "taco", originalPrice: fi.cartOriginalPrice, finalPrice: fi.cartOriginalPrice, ...meta });
    }
    extras.forEach(eid => {
      const c = COMPLEMENTS[eid];
      if (c && c.price > 0) items.push({ productId: eid, quantity: 1, salsas: [], complementIds: [], originalPrice: c.price, finalPrice: c.price, comboExtraItem: true, ...meta });
    });
    try {
      const existing = JSON.parse(sessionStorage.getItem("santo-dilema-orders") ?? "[]");
      const updated = [...existing, ...items];
      sessionStorage.setItem("santo-dilema-orders", JSON.stringify(updated));
      setComboItems(updated.filter((o: any) => o.comboGroupId));
    } catch {}
  }

  function handleComboNext() {
    if (!activeCombo || !isComboStepValid()) return;
    if (comboStep === activeCombo.steps.length - 1) {
      setComboPhase("confirming");
    } else {
      setComboStep(p => p + 1);
    }
  }

  function deleteComboGroup(groupId: string) {
    try {
      const all = JSON.parse(sessionStorage.getItem("santo-dilema-orders") ?? "[]");
      const updated = all.filter((o: any) => o.comboGroupId !== groupId);
      sessionStorage.setItem("santo-dilema-orders", JSON.stringify(updated));
      setComboItems(updated.filter((o: any) => o.comboGroupId));
    } catch {}
  }

  const comboTotal = useMemo(() => {
    const seen = new Set<string>();
    return comboItems.reduce((sum: number, o: any) => {
      if (!o.comboGroupId || seen.has(o.comboGroupId)) return sum;
      seen.add(o.comboGroupId);
      return sum + (o.comboPrice ?? 0);
    }, 0);
  }, [comboItems]);

  // ─── Totals ─────────────────────────────────────────────────────────────
  const alitasTotal = alitasOrders.reduce((sum, o) => {
    const base = ALITAS_PRODUCTS.find(p => p.id === o.productId);
    const price = o.finalPrice ?? base?.price ?? 0;
    let t = price * o.quantity;
    o.complementIds.forEach(id => { t += COMPLEMENTS[id]?.price ?? 0; });
    return sum + t;
  }, 0);

  const fitTotal = fitOrders.reduce((sum, o) => {
    let t = (o.finalPrice ?? o.originalPrice ?? 0) * o.quantity;
    o.complementIds.forEach(id => { t += COMPLEMENTS[id]?.price ?? 0; });
    return sum + t;
  }, 0);

  const tacoTotal = tacoOrders.reduce((sum, o) => {
    const compsTotal = o.complementIds.reduce((s, cid) => s + (COMPLEMENTS[cid]?.price ?? 0), 0);
    return sum + (o.finalPrice ?? 24.90) + compsTotal;
  }, 0) + BEBIDAS.reduce((sum, b) => sum + (bebidaQty[b.id] || 0) * b.price, 0);

  const trioTotal = trioOrders.reduce((s, t) => s + (t.trioPrice + t.complementIds.reduce((cs, cid) => cs + (COMPLEMENTS[cid]?.price ?? 0), 0)) * t.trioQuantity, 0);

  const grandTotal = alitasTotal + fitTotal + tacoTotal + trioTotal + comboTotal;

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PageMotionWrapper color="red" className="min-h-screen bg-black text-white">
      <style>{`
        @keyframes menuGridPulse { 0%,100%{opacity:.04} 50%{opacity:.09} }
        @keyframes slideUp   { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes fadeInOv  { from{opacity:0} to{opacity:1} }
        @keyframes slideDown { from{transform:translateY(0)} to{transform:translateY(100%)} }
        @keyframes fadeOutOv { from{opacity:1} to{opacity:0} }
        @keyframes toastIn {
          0%  {opacity:0;transform:translateX(-50%) translateY(10px)}
          15% {opacity:1;transform:translateX(-50%) translateY(0)}
          80% {opacity:1;transform:translateX(-50%) translateY(0)}
          100%{opacity:0;transform:translateX(-50%) translateY(-8px)}
        }
      `}</style>

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse 120% 55% at 50% 0%,rgba(140,20,20,.45) 0%,transparent 60%)" }} />
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(239,68,68,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(239,68,68,.08) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
          animation: "menuGridPulse 4s ease-in-out infinite",
        }} />

      {/* ── Header + nav en una sola fila ────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-30 backdrop-blur-md"
        style={{ background: "rgba(0,0,0,.92)", borderBottom: "1px solid rgba(239,68,68,.15)" }}>
        <div className="max-w-3xl mx-auto px-4 flex items-center gap-3" style={{ height: 56 }}>
          <Link href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
            <Image src="/logoprincipal.png" alt="Santo Dilema" width={300} height={75} className="h-9 w-auto" priority />
          </Link>
          <div className="flex-1 flex justify-end overflow-x-auto scrollbar-hide">
            {SECTIONS.map(({ id, label, emoji }) => (
              <button key={id} onClick={() => scrollToSection(id)}
                className={`flex-shrink-0 px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
                  activeSection === id ? "border-red-400 text-red-400" : "border-transparent text-gray-500 hover:text-gray-300"
                }`}>
                {emoji} {label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="h-[56px]" />

      {/* ── Closed banner ────────────────────────────────────────────────── */}
      {!isOpen && (
        <div className="bg-gray-900 border-b border-red-500/30 px-4 py-3 text-center relative z-10">
          <p className="text-red-400 text-sm font-bold">⏰ Estamos cerrados</p>
          <p className="text-gray-400 text-xs mt-0.5">{getNextOpenMessage()}</p>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {(alitasToast || fitToast || tacoToast) && (
        <div className="fixed bottom-24 left-1/2 z-[400] pointer-events-none"
          style={{ animation: "toastIn 3.2s ease forwards" }}>
          <div className="bg-gray-900 border-2 border-red-400/80 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl">
            <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="text-white font-bold text-sm">¡Orden agregada! · {alitasToast || fitToast || (tacoToast ? "Dúo de Tacos" : "")}</p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
           SECTIONS
      ════════════════════════════════════════════════════════════════════ */}
      <main className="max-w-3xl mx-auto px-4 pb-40 relative z-10">

        {/* ═══ ALITAS ═══════════════════════════════════════════════════════ */}
        <section id="alitas" ref={el => { sectionRefs.current.alitas = el; }} className="pt-8 pb-10">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-black text-red-400 uppercase tracking-tight"
              style={{ textShadow: "0 0 12px rgba(239,68,68,.5)" }}>
              🍗 Alitas Premium
            </h2>
            <p className="text-gray-400 text-sm mt-1">Selecciona tus salsas y arma tu orden</p>
          </div>

          {(() => {
            const renderAlitasCard = (product: typeof ALITAS_PRODUCTS[0], carousel: boolean) => {
              const soldOut   = !!menuStock[product.id];
              const basePrice = menuPrices[product.id] || product.price;
              const discount  = menuDiscounts[product.id];
              const inOrder   = alitasOrders.some(o => o.productId === product.id);
              return (
                <div key={product.id}
                  onClick={() => { if (!soldOut) openAlitasModal(product.id); }}
                  className={`relative bg-gray-900 rounded-2xl border-2 overflow-hidden transition-all
                    ${carousel ? "flex-shrink-0 w-[76vw] snap-center" : ""}
                    ${soldOut ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-red-400/60 hover:-translate-y-1"}
                    ${discount ? "border-amber-400/70" : "border-red-400/30"}`}
                  style={{ boxShadow: discount ? "0 0 16px rgba(251,191,36,.2)" : "0 0 12px rgba(239,68,68,.1)" }}>
                  {soldOut && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50"><span className="border-4 border-red-500 text-red-500 font-black text-sm px-2 py-0.5 rotate-[-15deg]">AGOTADO</span></div>}
                  {inOrder && <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ En orden</div>}
                  <div className="relative h-44 bg-black overflow-hidden">
                    <Image src={product.image} alt={product.name} fill className="object-cover" sizes="340px" />
                    {discount && <div className="absolute top-2 left-2 bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full">OFERTA</div>}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-white text-sm mb-1">{product.name}</h3>
                    <p className="text-gray-400 text-xs mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      {discount ? (<div><span className="text-[10px] text-gray-500 line-through block">S/ {basePrice.toFixed(2)}</span><span className="text-lg font-black text-amber-400">S/ {discount.toFixed(2)}</span></div>)
                        : <span className="text-lg font-black text-amber-400">S/ {basePrice.toFixed(2)}</span>}
                      {!soldOut && <button onClick={e => { e.stopPropagation(); openAlitasModal(product.id); }} className="w-9 h-9 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold text-xl flex items-center justify-center transition-all active:scale-95">+</button>}
                    </div>
                  </div>
                </div>
              );
            };
            return (
              <>
                {/* Mobile: carrusel peek */}
                <div ref={alitasCarouselRef} onTouchStart={pauseCarousel} className="md:hidden -mx-4 overflow-x-auto snap-x snap-mandatory flex gap-4 scrollbar-hide pb-3" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="flex-shrink-0 w-[12vw]" aria-hidden="true" />
                  {ALITAS_PRODUCTS.map(p => renderAlitasCard(p, true))}
                  <div className="flex-shrink-0 w-[12vw]" aria-hidden="true" />
                </div>
                {/* Desktop: grid 3 columnas */}
                <div className="hidden md:grid md:grid-cols-3 gap-5">
                  {ALITAS_PRODUCTS.map(p => renderAlitasCard(p, false))}
                </div>
              </>
            );
          })()}

          {/* Alitas orders list */}
          {alitasOrders.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">📋 Agregado a tu pedido</h4>
              {alitasOrders.map((order, idx) => {
                const p = ALITAS_PRODUCTS.find(x => x.id === order.productId)!;
                const price = order.finalPrice ?? order.originalPrice ?? p.price;
                const extras = order.complementIds.filter(c => (COMPLEMENTS[c]?.price ?? 0) > 0).map(c => COMPLEMENTS[c]);
                return (
                  <div key={idx} className="bg-gray-900/80 rounded-2xl border border-white/8 overflow-hidden">
                    <div className="flex items-start gap-3 p-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black/40 flex-shrink-0">
                        <Image src={p.image} alt={p.name} fill className="object-contain p-1" sizes="56px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-black text-white leading-tight">{order.quantity > 1 ? `${order.quantity}× ` : ""}{p.name}</p>
                          <p className="text-amber-400 text-sm font-black flex-shrink-0">S/ {(price * order.quantity + order.complementIds.reduce((s, c) => s + (COMPLEMENTS[c]?.price ?? 0), 0)).toFixed(2)}</p>
                        </div>
                        {order.salsas.length > 0 && (
                          <div className="mt-1.5">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">Salsa{order.salsas.length > 1 ? "s" : ""}</p>
                            <p className="text-xs text-amber-300/80 leading-snug">{order.salsas.map(id => SALSAS.find(s => s.id === id)?.name ?? id).join(" · ")}</p>
                          </div>
                        )}
                        {extras.length > 0 && (
                          <p className="text-[11px] text-gray-400 mt-1">+ {extras.map(c => `${c.name} (S/ ${c.price.toFixed(2)})`).join(", ")}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex border-t border-white/5">
                      <button onClick={() => openAlitasModal(order.productId, idx)}
                        className="flex-1 py-2 text-xs font-semibold text-red-400/80 hover:bg-white/5 transition-all border-r border-white/5">
                        ✏️ Editar
                      </button>
                      <button onClick={() => setAlitasOrders(p => p.filter((_,i) => i !== idx))}
                        className="flex-1 py-2 text-xs font-semibold text-gray-500 hover:text-red-400 hover:bg-white/5 transition-all">
                        🗑 Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ ENSALADAS ════════════════════════════════════════════════════ */}
        <section id="ensaladas" ref={el => { sectionRefs.current.ensaladas = el; }} className="pt-8 pb-10 border-t border-white/5">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-black text-cyan-400 uppercase tracking-tight"
              style={{ textShadow: "0 0 12px rgba(6,182,212,.5)" }}>
              🥗 Ensaladas & Bowls
            </h2>
            <p className="text-gray-400 text-sm mt-1">Fresco, nutritivo y sin culpa</p>
          </div>

          {(() => {
            const renderFitCard = (product: typeof FIT_PRODUCTS[0], carousel: boolean) => {
              const soldOut   = !!menuStock[product.id];
              const basePrice = menuPrices[product.id] || product.price;
              const discount  = menuDiscounts[product.id];
              const inOrder   = fitOrders.some(o => o.productId === product.id);
              return (
                <div key={product.id}
                  onClick={() => { if (!soldOut) openFitModal(product.id); }}
                  className={`relative bg-gray-900 rounded-2xl border-2 overflow-hidden transition-all
                    ${carousel ? "flex-shrink-0 w-[76vw] snap-center" : "w-56 flex-shrink-0"}
                    ${soldOut ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-cyan-400/60 hover:-translate-y-1"}
                    ${discount ? "border-amber-400/70" : "border-cyan-400/30"}`}
                  style={{ boxShadow: discount ? "0 0 16px rgba(251,191,36,.2)" : "0 0 12px rgba(6,182,212,.1)" }}>
                  {soldOut && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50"><span className="border-4 border-red-500 text-red-500 font-black text-sm px-2 py-0.5 rotate-[-15deg]">AGOTADO</span></div>}
                  {inOrder && <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ En orden</div>}
                  <div className="relative h-44 bg-black overflow-hidden">
                    <Image src={product.image} alt={product.name} fill className="object-cover" sizes="224px" />
                    {discount && <div className="absolute top-2 left-2 bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full">OFERTA</div>}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-white text-sm mb-1">{product.name}</h3>
                    <p className="text-gray-400 text-xs mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      {discount ? (<div><span className="text-xs text-gray-500 line-through block">S/ {basePrice.toFixed(2)}</span><span className="text-lg font-black text-amber-400">S/ {discount.toFixed(2)}</span></div>)
                        : <span className="text-lg font-black text-amber-400">S/ {basePrice.toFixed(2)}</span>}
                      {!soldOut && <button onClick={e => { e.stopPropagation(); openFitModal(product.id); }} className="w-9 h-9 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold text-xl flex items-center justify-center transition-all active:scale-95">+</button>}
                    </div>
                  </div>
                </div>
              );
            };
            return (
              <>
                {/* Mobile: carrusel peek */}
                <div ref={fitCarouselRef} onTouchStart={pauseCarousel} className="md:hidden -mx-4 overflow-x-auto snap-x snap-mandatory flex gap-4 scrollbar-hide pb-3" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="flex-shrink-0 w-[12vw]" aria-hidden="true" />
                  {FIT_PRODUCTS.map(p => renderFitCard(p, true))}
                  <div className="flex-shrink-0 w-[12vw]" aria-hidden="true" />
                </div>
                {/* Desktop: breakout con filas de w-56 */}
                <div className="hidden md:block" style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}>
                  <div className="max-w-[1000px] mx-auto px-4">
                    <div className="flex justify-center gap-4 mb-4">{FIT_PRODUCTS.slice(0, 4).map(p => renderFitCard(p, false))}</div>
                    <div className="flex justify-center gap-4">{FIT_PRODUCTS.slice(4).map(p => renderFitCard(p, false))}</div>
                  </div>
                </div>
              </>
            );
          })()}

          {fitOrders.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">📋 Agregado a tu pedido</h4>
              {fitOrders.map((order, idx) => {
                const p = FIT_PRODUCTS.find(x => x.id === order.productId)!;
                const price = order.finalPrice ?? order.originalPrice ?? p.price;
                const extras = order.complementIds.filter(c => (COMPLEMENTS[c]?.price ?? 0) > 0).map(c => COMPLEMENTS[c]);
                return (
                  <div key={idx} className="bg-gray-900/80 rounded-2xl border border-white/8 overflow-hidden">
                    <div className="flex items-start gap-3 p-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black/40 flex-shrink-0">
                        <Image src={p.image} alt={p.name} fill className="object-contain p-1" sizes="56px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-black text-white leading-tight">{order.quantity > 1 ? `${order.quantity}× ` : ""}{p.name}</p>
                          <p className="text-amber-400 text-sm font-black flex-shrink-0">S/ {(price * order.quantity + order.complementIds.reduce((s, c) => s + (COMPLEMENTS[c]?.price ?? 0), 0)).toFixed(2)}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 leading-snug line-clamp-2">{p.description}</p>
                        {extras.length > 0 && (
                          <p className="text-[11px] text-gray-400 mt-1">+ {extras.map(c => `${c.name} (S/ ${c.price.toFixed(2)})`).join(", ")}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex border-t border-white/5">
                      <button onClick={() => openFitModal(order.productId, idx)}
                        className="flex-1 py-2 text-xs font-semibold text-cyan-400/80 hover:bg-white/5 transition-all border-r border-white/5">
                        ✏️ Editar
                      </button>
                      <button onClick={() => setFitOrders(p => p.filter((_,i) => i !== idx))}
                        className="flex-1 py-2 text-xs font-semibold text-gray-500 hover:text-red-400 hover:bg-white/5 transition-all">
                        🗑 Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ TACOS ════════════════════════════════════════════════════════ */}
        <section id="tacos" ref={el => { sectionRefs.current.tacos = el; }} className="pt-8 pb-10 border-t border-white/5">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-black text-emerald-400 uppercase tracking-tight"
              style={{ textShadow: "0 0 12px rgba(52,211,153,.5)" }}>🌮 Tacos</h2>
            {(() => {
              const realP = menuPrices["taco-duo"]    || 24.90;
              const offP  = menuDiscounts["taco-duo"] || null;
              return (
                <p className="text-gray-400 text-sm mt-1">
                  Arma tu duo de tacos por {offP
                    ? <><span className="line-through text-gray-500">S/ {realP.toFixed(2)}</span> <span className="text-emerald-400 font-bold">S/ {offP.toFixed(2)}</span></>
                    : <span className="text-emerald-400 font-bold">S/ {realP.toFixed(2)}</span>}
                </p>
              );
            })()}
          </div>


          {(() => {
            const renderTacoCard = (flavor: typeof TACO_FLAVORS[0], carousel: boolean) => {
              const soldOut = !!menuStock[flavor.id];
              const chosen  = tacoOrders.some(o => o.salsas.includes(flavor.id));
              return (
                <div key={flavor.id}
                  onClick={() => { if (!soldOut) openTacoModal(flavor.id); }}
                  className={`relative bg-gray-900 rounded-2xl border-2 border-emerald-400/30 overflow-hidden transition-all
                    ${carousel ? "flex-shrink-0 w-[76vw] snap-center" : ""}
                    ${soldOut ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-emerald-400/60 hover:-translate-y-1"}`}
                  style={{ boxShadow: "0 0 12px rgba(52,211,153,.08)" }}>
                  {soldOut && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50"><span className="border-4 border-red-500 text-red-500 font-black text-sm px-2 py-0.5 rotate-[-15deg]">AGOTADO</span></div>}
                  {chosen && <div className="absolute top-2 right-2 z-10 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Elegido</div>}
                  <div className="relative h-44 bg-black overflow-hidden">
                    <Image src={flavor.image} alt={flavor.name} fill className="object-cover" sizes="340px" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-white text-sm mb-1">{flavor.name}</h3>
                    <p className="text-gray-400 text-xs line-clamp-2">{flavor.description}</p>
                    {!soldOut && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-amber-400 font-black text-sm">2 x S/ {(menuPrices["taco-duo"] || 24.90).toFixed(2)}</span>
                        <button onClick={e => { e.stopPropagation(); openTacoModal(flavor.id); }} className="w-9 h-9 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold text-xl flex items-center justify-center transition-all active:scale-95">+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            };
            return (
              <>
                {/* Mobile: carrusel peek */}
                <div ref={tacoCarouselRef} onTouchStart={pauseCarousel} className="md:hidden -mx-4 overflow-x-auto snap-x snap-mandatory flex gap-4 scrollbar-hide pb-3" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="flex-shrink-0 w-[12vw]" aria-hidden="true" />
                  {TACO_FLAVORS.map(f => renderTacoCard(f, true))}
                  <div className="flex-shrink-0 w-[12vw]" aria-hidden="true" />
                </div>
                {/* Desktop: grid 3 columnas */}
                <div className="hidden md:grid md:grid-cols-3 gap-5">
                  {TACO_FLAVORS.map(f => renderTacoCard(f, false))}
                </div>
              </>
            );
          })()}

          {/* Taco orders list */}
          {tacoOrders.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">📋 Agregado a tu pedido</h4>
              {tacoOrders.map((order, idx) => {
                const f1 = TACO_FLAVORS.find(f => f.id === order.salsas[0]);
                const f2 = TACO_FLAVORS.find(f => f.id === order.salsas[1]);
                const comp = TACO_COMPLEMENTS.find(c => c.id === order.complementIds[0]);
                const extras = order.complementIds.slice(1).filter(c => (COMPLEMENTS[c]?.price ?? 0) > 0).map(c => COMPLEMENTS[c]);
                return (
                  <div key={idx} className="bg-gray-900/80 rounded-2xl border border-white/8 overflow-hidden">
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-black text-white">🌮 Dúo de Tacos</p>
                        <p className="text-amber-400 text-sm font-black flex-shrink-0">S/ {((order.finalPrice ?? 24.90) + order.complementIds.reduce((s, c) => s + (COMPLEMENTS[c]?.price ?? 0), 0)).toFixed(2)}</p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 uppercase font-bold w-14 flex-shrink-0">Taco 1</span>
                          <span className="text-xs text-white bg-white/5 rounded-lg px-2 py-0.5">{f1?.name ?? order.salsas[0]}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 uppercase font-bold w-14 flex-shrink-0">Taco 2</span>
                          <span className="text-xs text-white bg-white/5 rounded-lg px-2 py-0.5">{f2?.name ?? order.salsas[1]}</span>
                        </div>
                        {comp && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 uppercase font-bold w-14 flex-shrink-0">Gratis</span>
                            <span className="text-xs text-emerald-400 bg-emerald-900/30 rounded-lg px-2 py-0.5">{comp.emoji} {comp.name}</span>
                          </div>
                        )}
                        {extras.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 uppercase font-bold w-14 flex-shrink-0">Extras</span>
                            <span className="text-xs text-amber-300/80">{extras.map(c => `${c.name} (S/ ${c.price.toFixed(2)})`).join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex border-t border-white/5">
                      <button onClick={() => setTacoOrders(p => p.filter((_,i) => i !== idx))}
                        className="flex-1 py-2 text-xs font-semibold text-gray-500 hover:text-red-400 hover:bg-white/5 transition-all">
                        🗑 Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ MINI BURGERS ════════════════════════════════════════════════ */}
        <section id="burgers" ref={el => { sectionRefs.current.burgers = el; }} className="pt-8 pb-10 border-t border-white/5">
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-black text-orange-400 uppercase tracking-tight"
              style={{ textShadow: "0 0 12px rgba(251,146,60,.5)" }}>🍔 Mini Burgers</h2>
            <p className="text-orange-300/70 text-xs mt-1">🍟 Incluye papas francesas</p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 max-w-xs mx-auto mb-5">
            <button
              onClick={() => { setBurgerMode("duo"); setBurgerSelections({}); }}
              className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all border-2 ${burgerMode === "duo" ? "bg-orange-600 border-orange-500 text-white" : "bg-gray-900 border-gray-700 text-gray-400 hover:border-orange-500/50"}`}>
              Dúo · S/ {DUO_BASE_PRICE.toFixed(2)}
              <span className="block text-[10px] font-normal opacity-70">2 miniburgers</span>
            </button>
            <button
              onClick={() => { setBurgerMode("trio"); setBurgerSelections({}); }}
              className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all border-2 ${burgerMode === "trio" ? "bg-orange-600 border-orange-500 text-white" : "bg-gray-900 border-gray-700 text-gray-400 hover:border-orange-500/50"}`}>
              Trío · S/ {TRIO_BASE_PRICE.toFixed(2)}
              <span className="block text-[10px] font-normal opacity-70">3 miniburgers</span>
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2 mb-3 max-w-xs mx-auto">
            {Array.from({ length: activeSize }).map((_, i) => (
              <div key={i} className={`flex-1 h-2 rounded-full transition-all ${i < burgerTotal ? "bg-orange-500" : "bg-gray-700"}`} />
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mb-5">
            {burgerTotal === 0
              ? `Elige ${activeSize} sabores`
              : burgerTotal < activeSize
                ? `Te ${activeSize - burgerTotal === 1 ? "falta 1 más" : `faltan ${activeSize - burgerTotal} más`}`
                : burgerMode === "duo" ? "¡Dúo listo!" : "¡Trío listo!"}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {BURGER_FLAVORS.map(flavor => {
              const soldOut = !!menuStock[flavor.id];
              const qty = burgerSelections[flavor.id] || 0;
              return (
                <div key={flavor.id}
                  className={`relative bg-gray-900 rounded-2xl border-2 overflow-hidden transition-all
                    ${soldOut ? "opacity-60 border-gray-700/30" : qty > 0 ? "border-orange-400/70" : "border-orange-400/20 hover:-translate-y-1"}`}
                  style={{ boxShadow: qty > 0 ? `0 0 16px ${BURGER_HALO[flavor.id] || "rgba(251,146,60,.2)"}` : undefined }}>
                  {soldOut && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                      <span className="text-red-500 font-black text-xs border-2 border-red-500 px-2 py-0.5 rotate-[-12deg]">AGOTADO</span>
                    </div>
                  )}
                  {qty > 0 && (
                    <div className="absolute top-2 left-2 z-10 w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-black">{qty}</div>
                  )}
                  <div className="relative h-28 sm:h-44 bg-black overflow-hidden">
                    <Image src={flavor.image} alt={flavor.name} fill className="object-contain" sizes="200px" />
                  </div>
                  <div className="p-2 sm:p-2.5">
                    <p className="text-white text-[11px] sm:text-xs font-bold mb-1 leading-tight">{flavor.name}</p>
                    <p className="text-gray-400 text-[10px] leading-relaxed mb-2 line-clamp-2 hidden sm:block">{flavor.description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-amber-400 font-black text-[11px] sm:text-sm">{activeSize}×S/{activeBurgerPrice.toFixed(2)}</span>
                      <div className="flex items-center gap-1">
                        {qty > 0 && (
                          <button onClick={() => removeBurgerFlavor(flavor.id)}
                            className="w-7 h-7 sm:w-9 sm:h-9 bg-red-600/80 hover:bg-red-500 text-white font-bold text-lg flex items-center justify-center rounded-full transition-all active:scale-95">−</button>
                        )}
                        <button onClick={() => { if (!soldOut) addBurgerFlavor(flavor.id); }}
                          disabled={soldOut || (!burgerCanAdd && qty === 0)}
                          className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full font-bold text-lg flex items-center justify-center transition-all active:scale-95
                            ${soldOut || (!burgerCanAdd && qty === 0) ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-500 text-white"}`}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add order button */}
          {burgerTotal === activeSize && (
            <button onClick={handleAddTrio}
              className="mt-5 w-full py-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-base transition-all active:scale-[.98]"
              style={{ boxShadow: "0 0 16px rgba(251,146,60,.3)" }}>
              Confirmar {burgerMode === "duo" ? "dúo" : "trío"} — S/ {activeBurgerPrice.toFixed(2)}
            </button>
          )}

          {/* Trio orders */}
          {trioOrders.length > 0 && (
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">📋 Agregado a tu pedido</h4>
              {trioOrders.map((trio, idx) => {
                const bebidas = trio.complementIds.filter(c => COMPLEMENTS[c]).map(c => COMPLEMENTS[c]);
                const trioTotal = trio.trioPrice + trio.complementIds.reduce((s, c) => s + (COMPLEMENTS[c]?.price ?? 0), 0);
                return (
                  <div key={trio.trioGroupId} className="bg-gray-900/80 rounded-2xl border border-white/8 overflow-hidden">
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-black text-white">🍔 {trio.trioName}</p>
                        <p className="text-amber-400 text-sm font-black flex-shrink-0">S/ {trioTotal.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1.5">
                        {trio.trioFlavors.map((f, fi) => (
                          <div key={fi} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 uppercase font-bold w-14 flex-shrink-0">{f.qty > 1 ? `${f.qty}×` : `Burger ${fi + 1}`}</span>
                            <span className="text-xs text-white bg-white/5 rounded-lg px-2 py-0.5">{f.name}</span>
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 uppercase font-bold w-14 flex-shrink-0">Incluye</span>
                          <span className="text-xs text-orange-300/80 bg-orange-900/20 rounded-lg px-2 py-0.5">🍟 Papas francesas</span>
                        </div>
                        {bebidas.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 uppercase font-bold w-14 flex-shrink-0">Bebidas</span>
                            <span className="text-xs text-blue-300/80">🥤 {bebidas.map(c => c.name).join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex border-t border-white/5">
                      <button onClick={() => setTrioOrders(p => p.filter((_,i) => i !== idx))}
                        className="flex-1 py-2 text-xs font-semibold text-gray-500 hover:text-red-400 hover:bg-white/5 transition-all">
                        🗑 Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ COMBOS ══════════════════════════════════════════════════════ */}
        <section id="combos" ref={el => { sectionRefs.current.combos = el; }} className="pt-8 pb-10 border-t border-white/5">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-black uppercase tracking-widest rounded-full px-4 py-1.5 mb-4">
              🔥 Precio especial · Descuento automático
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight"
              style={{ textShadow: "0 0 12px rgba(245,158,11,.3)" }}>
              Combos
            </h2>
            <p className="text-gray-400 text-sm mt-1">El descuento se aplica solo al pedir</p>
          </div>

          {(() => {
            const renderCard = (combo: (typeof COMBOS)[0], carousel = false) => {
              const baseP = menuPrices[combo.id] ?? combo.price;
              const discP = menuDiscounts[combo.id];
              const eff   = discP ?? baseP;
              const { rgb } = combo.colors;
              return (
                <div key={combo.id}
                  onClick={() => { openCombo(combo); }}
                  className={`relative flex-shrink-0 ${carousel ? 'w-[76vw] snap-center' : 'w-[200px] sm:w-[240px] snap-start'} bg-gray-900/90 rounded-2xl border overflow-hidden cursor-pointer transition-all hover:-translate-y-1 ${combo.colors.border}`}
                  style={{ boxShadow: `0 0 20px rgba(${rgb},.08)` }}>
                  <div className="h-0.5" style={{ background: `linear-gradient(90deg,transparent,rgba(${rgb},.8),transparent)` }} />
                  <div className="relative h-40 bg-black overflow-hidden">
                    <Image src={combo.images[0]} alt={combo.name} fill className="object-cover" sizes="400px" />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(12,12,12,.95) 0%, transparent 60%)` }} />
                    {combo.maxSavings > 0 && (
                      <span className="absolute top-2 left-2 text-[10px] font-black rounded-full px-2.5 py-1 bg-white/20 border border-white/40 text-white backdrop-blur-sm">
                        Ahorra S/ {combo.maxSavings.toFixed(2)}
                      </span>
                    )}
                    <span className="absolute top-2 right-2 text-xl">{combo.emoji}</span>
                  </div>
                  <div className="px-4 pt-3 pb-4">
                    <h3 className={`font-black text-base leading-tight mb-1 ${combo.colors.text}`}>{combo.name}</h3>
                    <p className="text-xs text-gray-500 italic mb-2">{combo.tagline}</p>
                    <ul className="space-y-1 mb-3">
                      {combo.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                          <span className={`mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] flex-shrink-0 ${combo.colors.stepDot}`} style={{ color: "#fff" }}>✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div>
                        {(discP || combo.maxSavings > 0) && (
                          <span className="text-xs text-gray-600 line-through block">
                            S/ {(discP ? baseP : eff + combo.maxSavings).toFixed(2)}
                          </span>
                        )}
                        <span className="text-xl font-black text-white">S/ {eff.toFixed(2)}</span>
                      </div>
                      <button
                        className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95 ${combo.colors.btn}`}
                        style={{ boxShadow: `0 0 12px rgba(${rgb},.3)` }}>
                        Elegir →
                      </button>
                    </div>
                  </div>
                </div>
              );
            };
            return (
              <>
                {/* Mobile: carrusel peek */}
                <div ref={combosCarouselRef} onTouchStart={pauseCarousel} className="md:hidden -mx-4 overflow-x-auto snap-x snap-mandatory flex gap-4 scrollbar-hide pb-3" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="flex-shrink-0 w-[12vw]" aria-hidden="true" />
                  {COMBOS.map(c => renderCard(c, true))}
                  <div className="flex-shrink-0 w-[12vw]" aria-hidden="true" />
                </div>
                {/* Desktop: dos filas centradas */}
                <div className="hidden md:block -mx-4">
                  <div className="flex justify-center gap-4 mb-4">{COMBOS.slice(0, 3).map(c => renderCard(c, false))}</div>
                  <div className="flex justify-center gap-4">{COMBOS.slice(3).map(c => renderCard(c, false))}</div>
                </div>
              </>
            );
          })()}

          {/* Combos added */}
          {comboItems.length > 0 && (() => {
            const seen = new Set<string>();
            const groups: any[] = [];
            comboItems.forEach((o: any) => {
              if (!o.comboGroupId || seen.has(o.comboGroupId)) return;
              seen.add(o.comboGroupId);
              groups.push({ meta: o, items: comboItems.filter((x: any) => x.comboGroupId === o.comboGroupId) });
            });
            return (
              <div className="mt-5 space-y-3">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">📋 Agregado a tu pedido</h4>
                {groups.map(({ meta, items }) => (
                  <div key={meta.comboGroupId} className="bg-gray-900/80 rounded-2xl border border-white/8 overflow-hidden">
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="text-[10px] text-amber-400/60 font-bold uppercase tracking-wide">🔥 Combo</p>
                          <p className="text-sm font-black text-white">{meta.comboName}</p>
                        </div>
                        <p className="text-amber-400 font-black flex-shrink-0">S/ {meta.comboPrice?.toFixed(2)}</p>
                      </div>
                      <div className="space-y-2 border-t border-white/5 pt-2">
                        {items.map((item: any, j: number) => {
                          if (item.productId === "taco-duo") {
                            const f1 = TACO_FLAVORS.find(f => f.id === item.salsas?.[0]);
                            const f2 = TACO_FLAVORS.find(f => f.id === item.salsas?.[1]);
                            return (
                              <div key={j} className="flex gap-2">
                                <span className="text-[10px] text-gray-500 uppercase font-bold w-14 flex-shrink-0 pt-0.5">Tacos</span>
                                <div>
                                  <span className="text-xs text-white bg-white/5 rounded-lg px-2 py-0.5 mr-1">{f1?.name ?? item.salsas?.[0] ?? "—"}</span>
                                  <span className="text-xs text-white bg-white/5 rounded-lg px-2 py-0.5">{f2?.name ?? item.salsas?.[1] ?? "—"}</span>
                                </div>
                              </div>
                            );
                          }
                          const fitProd = FIT_PRODUCTS.find(p => p.id === item.productId);
                          if (fitProd) {
                            return (
                              <div key={j} className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 uppercase font-bold w-14 flex-shrink-0">Bowl</span>
                                <span className="text-xs text-white bg-white/5 rounded-lg px-2 py-0.5">{fitProd.name}</span>
                              </div>
                            );
                          }
                          const alitasProd = ALITAS_PRODUCTS.find(p => p.id === item.productId);
                          const salsaNames = (item.salsas as string[] ?? []).map((s: string) => SALSAS.find(x => x.id === s)?.name ?? s);
                          return (
                            <div key={j} className="flex gap-2">
                              <span className="text-[10px] text-gray-500 uppercase font-bold w-14 flex-shrink-0 pt-0.5">Alitas</span>
                              <div>
                                <p className="text-xs text-white">{alitasProd?.name ?? item.productId}</p>
                                {salsaNames.length > 0 && <p className="text-[11px] text-amber-300/70 mt-0.5">🌶️ {salsaNames.join(" · ")}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex border-t border-white/5">
                      <button onClick={() => deleteComboGroup(meta.comboGroupId)}
                        className="flex-1 py-2 text-xs font-semibold text-gray-500 hover:text-red-400 hover:bg-white/5 transition-all">
                        🗑 Eliminar combo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </section>

      </main>

      {/* ── Sticky bottom bar ────────────────────────────────────────────── */}
      {(alitasOrders.length > 0 || fitOrders.length > 0 || tacoOrders.length > 0 || trioOrders.length > 0 || comboItems.length > 0 || Object.values(bebidaQty).some(v => v > 0)) && (() => {
        // Build a compact item count + short label list
        const parts: string[] = [];
        alitasOrders.forEach(o => { const p = ALITAS_PRODUCTS.find(x => x.id === o.productId); parts.push(`${o.quantity > 1 ? o.quantity + "× " : ""}${p?.name ?? "Alitas"}`); });
        fitOrders.forEach(o => { const p = FIT_PRODUCTS.find(x => x.id === o.productId); parts.push(`${o.quantity > 1 ? o.quantity + "× " : ""}${p?.name ?? "Ensalada"}`); });
        tacoOrders.forEach(() => parts.push("Dúo de Tacos"));
        trioOrders.forEach(t => parts.push(t.trioName));
        const comboSeen = new Set<string>();
        comboItems.forEach((o: any) => { if (o.comboGroupId && !comboSeen.has(o.comboGroupId)) { comboSeen.add(o.comboGroupId); parts.push(o.comboName ?? "Combo"); } });
        BEBIDAS.forEach(b => { const q = bebidaQty[b.id] || 0; if (q > 0) parts.push(`${q > 1 ? q + "× " : ""}${b.name}`); });
        const totalCount = alitasOrders.reduce((s,o) => s + o.quantity, 0) + fitOrders.reduce((s,o) => s + o.quantity, 0) + tacoOrders.length + trioOrders.length + comboSeen.size + BEBIDAS.reduce((s,b) => s + (bebidaQty[b.id] || 0), 0);
        return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950 border-t border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,.6)]">
          <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">{totalCount}</span>
                <p className="text-[10px] sm:text-[11px] text-gray-400 truncate">{parts.join(" · ")}</p>
              </div>
              <p className="text-lg sm:text-xl font-black text-amber-400">S/ {grandTotal.toFixed(2)}</p>
            </div>
            <button
              onClick={() => {
                // Keep existing combo orders from sessionStorage, then append all regular orders
                const existingComboOrders: any[] = JSON.parse(sessionStorage.getItem("santo-dilema-orders") ?? "[]")
                  .filter((o: any) => o.comboGroupId);
                const regularOrders: any[] = [];

                alitasOrders.forEach(o => {
                  regularOrders.push({
                    productId: o.productId, quantity: o.quantity,
                    salsas: o.salsas, complementIds: o.complementIds,
                    originalPrice: o.originalPrice, finalPrice: o.finalPrice,
                    discountApplied: o.discountApplied,
                  });
                });

                fitOrders.forEach(o => {
                  regularOrders.push({
                    productId: o.productId, quantity: o.quantity,
                    salsas: [], complementIds: o.complementIds,
                    originalPrice: o.originalPrice, finalPrice: o.finalPrice,
                    discountApplied: o.discountApplied,
                  });
                });

                tacoOrders.forEach(o => {
                  regularOrders.push({
                    productId: o.productId, quantity: o.quantity,
                    salsas: o.salsas, complementIds: o.complementIds,
                    finalPrice: o.finalPrice, originalPrice: o.originalPrice,
                  });
                });

                BEBIDAS.forEach(b => {
                  const q = bebidaQty[b.id] || 0;
                  if (q > 0) regularOrders.push({
                    productId: b.id, quantity: q,
                    salsas: [], complementIds: [],
                    finalPrice: b.price, originalPrice: b.price,
                  });
                });

                trioOrders.forEach(trio => {
                  regularOrders.push({
                    productId: trio.trioName === "Dúo Mini Burgers" ? "burger-duo" : "burger-trio",
                    quantity: trio.trioQuantity,
                    salsas: trio.trioFlavors.map(f => `${f.qty > 1 ? f.qty + "× " : ""}${f.name}`),
                    complementIds: trio.complementIds,
                    finalPrice: trio.trioPrice, originalPrice: trio.trioPrice,
                  });
                });

                sessionStorage.setItem("santo-dilema-orders", JSON.stringify([...existingComboOrders, ...regularOrders]));
                router.push("/checkout");
              }}
              className="flex-shrink-0 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all active:scale-95"
              style={{ boxShadow: "0 0 20px rgba(16,185,129,.55)" }}>
              Ir a pagar →
            </button>
          </div>
        </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════════
           ALITAS MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {alitasModal && (() => {
        const mp       = ALITAS_PRODUCTS.find(p => p.id === alitasModal)!;
        const qty      = alitasQty[alitasModal] || 1;
        const chosen   = alitasSalsas[alitasModal] ?? [];
        const comps    = alitasComplements[alitasModal] ?? [];
        const required = alitasRequired(alitasModal);
        const canConf  = alitasCanAdd(alitasModal);
        const baseP    = menuPrices[alitasModal]    || mp.price;
        const disc     = menuDiscounts[alitasModal];
        const eff      = disc || baseP;
        const promo    = findPromo(alitasModal, chosen);
        const showPrice = promo ? promo.promoPrice : eff;

        return (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end"
            style={{ animation: alitasClosing ? "fadeOutOv .35s ease forwards" : "fadeInOv .25s ease" }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeAlitasModal} />
            <div className="relative bg-gray-900 w-full md:max-w-lg md:mx-auto md:rounded-2xl rounded-t-3xl flex flex-col shadow-2xl"
              style={{ maxHeight: "92vh", animation: alitasClosing ? "slideDown .35s ease forwards" : "slideUp .4s cubic-bezier(.22,1,.36,1)" }}>

              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0 md:hidden">
                <div className="w-10 h-1 bg-gray-600 rounded-full" />
              </div>
              <button onClick={closeAlitasModal}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-bold">✕</button>

              {/* Scroll area */}
              <div className="flex-1 overflow-y-auto">
                {/* Image */}
                <div className="relative h-56 bg-black overflow-hidden">
                  <Image src={mp.image} alt={mp.name} fill className="object-cover" sizes="100vw" />
                  {disc && <div className="absolute top-3 left-3 bg-amber-400 text-black text-xs font-black px-2 py-0.5 rounded-full">OFERTA</div>}
                </div>

                <div className="px-4 pt-4 pb-2">
                  <h3 className="text-xl font-black text-white mb-1">{mp.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{mp.description}</p>

                  {/* Price + qty */}
                  <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-800">
                    <div>
                      {promo ? (
                        <><span className="text-sm text-gray-500 line-through block">S/ {eff.toFixed(2)}</span>
                          <span className="text-2xl font-black text-green-400">S/ {promo.promoPrice.toFixed(2)}</span></>
                      ) : disc ? (
                        <><span className="text-sm text-gray-500 line-through block">S/ {baseP.toFixed(2)}</span>
                          <span className="text-2xl font-black text-amber-400">S/ {disc.toFixed(2)}</span></>
                      ) : (
                        <span className="text-2xl font-black text-amber-400">S/ {baseP.toFixed(2)}</span>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">precio unitario</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => { const q = alitasQty[alitasModal] || 1; if (q > 1) setAlitasQty(p => ({ ...p, [alitasModal]: q - 1 })); }}
                        disabled={qty <= 1}
                        className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-600 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white font-bold text-xl transition-all">−</button>
                      <span className="text-white font-black text-xl w-8 text-center">{qty}</span>
                      <button onClick={() => setAlitasQty(p => ({ ...p, [alitasModal]: (p[alitasModal] || 1) + 1 }))}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xl transition-all">+</button>
                    </div>
                  </div>

                  {/* Salsas */}
                  <div className="mb-4">
                    <button onClick={() => setAlitasShowSalsas(p => ({ ...p, [alitasModal]: !p[alitasModal] }))}
                      className={`w-full flex items-center justify-between rounded-xl p-3 border mb-1 transition-all ${canConf ? "bg-green-600/20 border-green-500/40" : "bg-amber-600/20 border-amber-500/40"}`}>
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{canConf ? "✅" : "🌶️"}</span>
                        <div className="text-left">
                          <p className={`text-sm font-bold ${canConf ? "text-green-400" : "text-white"}`}>
                            {canConf ? "Salsas listas" : required === 1 ? "Elige tu salsa" : `Elige ${required} salsas`}
                          </p>
                          <p className="text-xs text-gray-400">{chosen.length} / {required} elegidas</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-400">{alitasShowSalsas[alitasModal] ? "▼" : "▶"}</span>
                    </button>

                    {alitasShowSalsas[alitasModal] && (
                      <div className="space-y-1.5 mt-2">
                        {effectiveSalsas.map(salsa => {
                          const cnt = chosen.filter(s => s === salsa.id).length;
                          const canAdd = chosen.length < required || cnt > 0;
                          const canMore = cnt < required && canAdd && !salsa.soldOut;
                          const recent = alitasRecentSalsa === `${alitasModal}-${salsa.id}`;
                          return (
                            <div key={salsa.id}
                              className={`rounded-xl p-3 border transition-all ${salsa.soldOut ? "opacity-60 border-gray-700/30 bg-gray-800/50" : cnt > 0 ? "border-amber-500/50 bg-amber-900/20" : "border-gray-700/30 bg-gray-800/40"}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex-1 mr-3">
                                  <p className={`text-sm font-bold ${cnt > 0 ? "text-amber-400" : salsa.soldOut ? "text-gray-500" : "text-white"}`}>
                                    {salsa.name}
                                    {salsa.soldOut && <span className="ml-2 text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">AGOTADO</span>}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-0.5">{salsa.description}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {cnt > 0 && (
                                    <><span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">×{cnt}</span>
                                      <button onClick={() => toggleAlitasSalsa(alitasModal, salsa.id, "remove")}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button></>
                                  )}
                                  {canMore && (
                                    <button onClick={() => toggleAlitasSalsa(alitasModal, salsa.id, "add")}
                                      className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white ${recent ? "bg-green-500 scale-110" : "bg-amber-600 hover:bg-amber-500"}`}>
                                      {recent ? "✓" : "+"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Bebidas */}
                  <div className="mb-4">
                    <button onClick={() => setAlitasShowBebidas(p => ({ ...p, [alitasModal]: !p[alitasModal] }))}
                      className="w-full flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-xl p-3 transition-all hover:bg-gray-800 mb-1">
                      <div className="flex items-center gap-2"><span>🥤</span><span className="text-white text-sm font-bold">Bebidas</span></div>
                      <span className="text-gray-400 text-sm">{alitasShowBebidas[alitasModal] ? "▼" : "▶"}</span>
                    </button>
                    {alitasShowBebidas[alitasModal] && (
                      <div className="space-y-1.5 mt-1">
                        {(["agua-mineral","coca-cola","inka-cola","sprite","fanta"] as const).map(bid => {
                          const c = COMPLEMENTS[bid];
                          const cnt = comps.filter(x => x === bid).length;
                          const recent = alitasRecentComp === `${alitasModal}-${bid}`;
                          return (
                            <div key={bid} className="flex items-center justify-between bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
                              <div className="flex items-center gap-2">
                                <span>{bid === "agua-mineral" ? "💧" : "🥤"}</span>
                                <span className="text-white text-sm">{c.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-amber-400 text-sm font-bold">S/ {c.price.toFixed(2)}</span>
                                {cnt > 0 && (
                                  <><button onClick={() => removeAlitasComplement(alitasModal, bid)}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button>
                                    <span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                                )}
                                <button onClick={() => addAlitasComplement(alitasModal, bid)}
                                  className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${recent ? "bg-green-500" : "bg-red-600 hover:bg-red-500"}`}>
                                  {recent ? "✓" : "+"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Extras */}
                  <div className="mb-4">
                    <button onClick={() => setAlitasShowExtras(p => ({ ...p, [alitasModal]: !p[alitasModal] }))}
                      className="w-full flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-xl p-3 transition-all hover:bg-gray-800 mb-1">
                      <div className="flex items-center gap-2"><span>🍟</span><span className="text-white text-sm font-bold">Extras</span></div>
                      <span className="text-gray-400 text-sm">{alitasShowExtras[alitasModal] ? "▼" : "▶"}</span>
                    </button>
                    {alitasShowExtras[alitasModal] && (
                      <div className="space-y-1.5 mt-1">
                        {/* Extra papas */}
                        {(() => {
                          const bid = "extra-papas"; const c = COMPLEMENTS[bid];
                          const cnt = comps.filter(x => x === bid).length;
                          const recent = alitasRecentComp === `${alitasModal}-${bid}`;
                          return (
                            <div key={bid} className="flex items-center justify-between bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
                              <div className="flex items-center gap-2"><span>🍟</span><span className="text-white text-sm">{c.name}</span></div>
                              <div className="flex items-center gap-2">
                                <span className="text-amber-400 text-sm font-bold">S/ {c.price.toFixed(2)}</span>
                                {cnt > 0 && (
                                  <><button onClick={() => removeAlitasComplement(alitasModal, bid)}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button>
                                    <span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                                )}
                                <button onClick={() => addAlitasComplement(alitasModal, bid)}
                                  className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${recent ? "bg-green-500" : "bg-red-600 hover:bg-red-500"}`}>
                                  {recent ? "✓" : "+"}
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                        {/* Extra salsa por cada salsa elegida */}
                        {Array.from(new Set(chosen)).map(sId => {
                          const salsa = SALSAS.find(s => s.id === sId)!;
                          const bid = `extra-salsa-${sId}`; const c = COMPLEMENTS[bid];
                          if (!c) return null;
                          const cnt = comps.filter(x => x === bid).length;
                          const recent = alitasRecentComp === `${alitasModal}-${bid}`;
                          return (
                            <div key={bid} className="flex items-center justify-between bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
                              <div className="flex items-center gap-2"><span>🥫</span><span className="text-white text-sm">{c.name}</span></div>
                              <div className="flex items-center gap-2">
                                <span className="text-amber-400 text-sm font-bold">S/ {c.price.toFixed(2)}</span>
                                {cnt > 0 && (
                                  <><button onClick={() => removeAlitasComplement(alitasModal, bid)}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button>
                                    <span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                                )}
                                <button onClick={() => addAlitasComplement(alitasModal, bid)}
                                  className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${recent ? "bg-green-500" : "bg-red-600 hover:bg-red-500"}`}>
                                  {recent ? "✓" : "+"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Confirm button */}
              <div className="flex-shrink-0 px-4 pt-3 pb-6 bg-gray-900 border-t border-gray-800">
                <button
                  onClick={() => { if (canConf) completeAlitasOrder(alitasModal); }}
                  disabled={!canConf}
                  className={`w-full py-4 rounded-xl font-black text-base transition-all ${canConf ? "bg-red-500 hover:bg-red-400 text-white active:scale-[.98]" : "bg-gray-700 text-gray-500 cursor-not-allowed"}`}>
                  {!canConf
                    ? `Selecciona ${required} salsa${required > 1 ? "s" : ""}`
                    : alitasEditIdx !== null
                    ? `Confirmar cambios — S/ ${(showPrice * qty).toFixed(2)}`
                    : `Agregar orden — S/ ${(showPrice * qty).toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════════
           COMBO WIZARD MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {activeCombo && comboPhase === "selecting" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ animation: "fadeInOv .25s ease" }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeCombo} />
          <div className="relative z-10 bg-[#111] rounded-2xl border border-white/10 w-full max-w-md flex flex-col shadow-2xl"
            style={{ maxHeight: "90vh", animation: "slideUp .4s cubic-bezier(.22,1,.36,1)" }}>
            <div className="flex justify-end pt-3 pr-3 shrink-0">
              <button onClick={closeCombo} className="w-8 h-8 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-bold">✕</button>
            </div>
            <div className="px-5 pb-3 border-b border-white/5 shrink-0">
              <h3 className={`font-bold text-white text-lg leading-none`}>{activeCombo.emoji} {activeCombo.name}</h3>
              <p className={`text-xs mt-1 font-medium ${activeCombo.colors.text}`}>
                S/ {(menuDiscounts[activeCombo.id] ?? menuPrices[activeCombo.id] ?? activeCombo.price).toFixed(2)} · Paso {comboStep + 1} de {activeCombo.steps.length}
              </p>
            </div>
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 py-3 shrink-0">
              {activeCombo.steps.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i < comboStep ? activeCombo.colors.stepDot+" opacity-40 w-4" : i === comboStep ? activeCombo.colors.stepDot+" w-6" : "bg-gray-700 w-4"}`} />
              ))}
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {(() => {
                const step = activeCombo.steps[comboStep];
                if (step.type === "sauces") {
                  const selected = comboSelections.sauces[step.productId] ?? [];
                  const visible  = SALSAS.filter(s => !step.excludeSauceIds?.includes(s.id));
                  return (
                    <div className="pt-2">
                      <p className="text-white font-semibold mb-1">{step.label}</p>
                      <p className="text-xs text-gray-500 mb-4">{step.count === 1 ? "Elige 1 salsa" : `Elige ${step.count} salsas`} · {selected.length}/{step.count}</p>
                      <div className="space-y-2">
                        {visible.map(salsa => {
                          const isSel = selected.includes(salsa.id);
                          return (
                            <button key={salsa.id} onClick={() => comboToggleSauce(step.productId, salsa.id, step.count)}
                              className={`relative w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSel ? `${activeCombo.colors.border} bg-white/5` : "border-white/8 hover:border-white/15"}`}>
                              <span className="text-2xl flex-shrink-0">🫙</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold leading-tight ${isSel ? activeCombo.colors.text : "text-gray-200"}`}>{salsa.name}</p>
                                <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{salsa.description}</p>
                              </div>
                              {isSel && <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${activeCombo.colors.stepDot} text-white`}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                if (step.type === "salad") {
                  return (
                    <div className="pt-2">
                      <p className="text-white font-semibold mb-1">{step.label}</p>
                      <p className="text-xs text-gray-500 mb-4">Selecciona 1 bowl</p>
                      <div className="space-y-2">
                        {FIT_PRODUCTS.map(fit => {
                          const isSel = comboSelections.salad === fit.id;
                          return (
                            <button key={fit.id} onClick={() => setComboSelections(p => ({ ...p, salad: fit.id }))}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSel ? `${activeCombo.colors.border} bg-white/5` : "border-white/8 hover:border-white/15"}`}>
                              <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-black/40">
                                <Image src={fit.image} alt={fit.name} fill className="object-contain p-1" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold ${isSel ? activeCombo.colors.text : "text-gray-200"}`}>{fit.name}</p>
                                <p className="text-xs text-gray-500">S/ {fit.price.toFixed(2)}</p>
                              </div>
                              {isSel && <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${activeCombo.colors.stepDot}`}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                // tacos
                return (
                  <div className="pt-2">
                    <p className="text-white font-semibold mb-1">{step.label}</p>
                    <p className="text-xs text-gray-500 mb-4">2 sabores · {comboSelections.tacos.length}/2</p>
                    <div className="space-y-2 mb-5">
                      {TACO_FLAVORS.map(taco => {
                        const isSel = comboSelections.tacos.includes(taco.id);
                        return (
                          <button key={taco.id}
                            onClick={() => setComboSelections(p => {
                              const cur = p.tacos;
                              if (cur.includes(taco.id)) return { ...p, tacos: cur.filter(t => t !== taco.id) };
                              const next = cur.length >= 2 ? [...cur.slice(1), taco.id] : [...cur, taco.id];
                              return { ...p, tacos: next };
                            })}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSel ? `${activeCombo.colors.border} bg-white/5` : "border-white/8 hover:border-white/15"}`}>
                            <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-black/40">
                              <Image src={taco.image} alt={taco.name} fill className="object-contain p-1" />
                            </div>
                            <p className={`text-sm font-semibold flex-1 ${isSel ? activeCombo.colors.text : "text-gray-200"}`}>{taco.name}</p>
                            {isSel && <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${activeCombo.colors.stepDot}`}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-white font-semibold mb-2 text-sm">Complemento incluido</p>
                    <div className="grid grid-cols-3 gap-2">
                      {TACO_COMPLEMENTS.map(c => {
                        const isSel = comboSelections.tacoComplement === c.id;
                        return (
                          <button key={c.id} onClick={() => setComboSelections(p => ({ ...p, tacoComplement: c.id }))}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${isSel ? `${activeCombo.colors.border} bg-white/5` : "border-white/8 hover:border-white/15"}`}>
                            <span className="text-2xl">{c.emoji}</span>
                            <span className={`text-xs font-semibold ${isSel ? activeCombo.colors.text : "text-gray-300"}`}>{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="shrink-0 px-5 py-4 border-t border-white/5 flex gap-3">
              {comboStep > 0 && (
                <button onClick={() => setComboStep(p => p - 1)}
                  className="px-5 py-3 rounded-xl border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/5 transition-all">Atrás</button>
              )}
              <button onClick={handleComboNext} disabled={!isComboStepValid()}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${activeCombo.colors.btn}`}>
                {comboStep === activeCombo.steps.length - 1 ? "Revisar pedido →" : "Continuar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Combo confirmation */}
      {activeCombo && comboPhase === "confirming" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ animation: "fadeInOv .25s ease" }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeCombo} />
          <div className="relative z-10 bg-[#111] rounded-2xl border border-white/10 w-full max-w-md flex flex-col shadow-2xl"
            style={{ maxHeight: "90vh", animation: "slideUp .4s cubic-bezier(.22,1,.36,1)" }}>

            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-white/5 shrink-0">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide mb-0.5">Confirma tu combo</p>
                <h3 className={`font-black text-white text-lg leading-none`}>{activeCombo.emoji} {activeCombo.name}</h3>
              </div>
              <button onClick={closeCombo} className="w-8 h-8 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-bold ml-3 flex-shrink-0">✕</button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">

              {/* Selection summary */}
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide mb-2">Tu selección</p>
              <div className="space-y-2 bg-white/3 rounded-xl p-3 border border-white/8 mb-4">
                {activeCombo.steps.map((step, si) => {
                  if (step.type === "sauces") {
                    const prod = ALITAS_PRODUCTS.find(p => p.id === step.productId);
                    const salsaNames = (comboSelections.sauces[step.productId] ?? []).map(sid => SALSAS.find(s => s.id === sid)?.name ?? sid);
                    return (
                      <div key={si} className="flex gap-2 items-start">
                        <span className="text-[10px] text-gray-500 uppercase font-bold w-16 flex-shrink-0 pt-0.5">{prod?.name?.split(" ")[0] ?? "Alitas"}</span>
                        <div className="flex flex-wrap gap-1">
                          {salsaNames.map((n, ni) => <span key={ni} className="text-xs text-white bg-white/8 rounded-lg px-2 py-0.5">{n}</span>)}
                        </div>
                      </div>
                    );
                  }
                  if (step.type === "salad") {
                    const bowl = FIT_PRODUCTS.find(p => p.id === comboSelections.salad);
                    return (
                      <div key={si} className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 uppercase font-bold w-16 flex-shrink-0">Bowl</span>
                        <span className="text-xs text-white bg-white/8 rounded-lg px-2 py-0.5">{bowl?.name ?? "—"}</span>
                      </div>
                    );
                  }
                  if (step.type === "tacos") {
                    const f1 = TACO_FLAVORS.find(f => f.id === comboSelections.tacos[0]);
                    const f2 = TACO_FLAVORS.find(f => f.id === comboSelections.tacos[1]);
                    const comp = TACO_COMPLEMENTS.find(c => c.id === comboSelections.tacoComplement);
                    return (
                      <div key={si} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 uppercase font-bold w-16 flex-shrink-0">Taco 1</span>
                          <span className="text-xs text-white bg-white/8 rounded-lg px-2 py-0.5">{f1?.name ?? "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 uppercase font-bold w-16 flex-shrink-0">Taco 2</span>
                          <span className="text-xs text-white bg-white/8 rounded-lg px-2 py-0.5">{f2?.name ?? "—"}</span>
                        </div>
                        {comp && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 uppercase font-bold w-16 flex-shrink-0">Gratis</span>
                            <span className="text-xs text-emerald-400 bg-emerald-900/30 rounded-lg px-2 py-0.5">{comp.emoji} {comp.name}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Bebidas accordion */}
              <button onClick={() => setComboShowBebidas(p => !p)}
                className="w-full flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-xl p-3 hover:bg-gray-800 transition-all mb-2">
                <div className="flex items-center gap-2">
                  <span>🥤</span>
                  <span className="text-white text-sm font-bold">Bebidas</span>
                  {comboExtras.filter(c => ["coca-cola","inka-cola","sprite","fanta","agua-mineral"].includes(c)).length > 0 && (
                    <span className="text-xs bg-amber-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {comboExtras.filter(c => ["coca-cola","inka-cola","sprite","fanta","agua-mineral"].includes(c)).length}
                    </span>
                  )}
                </div>
                <span className="text-gray-400 text-sm">{comboShowBebidas ? "▼" : "▶"}</span>
              </button>
              {comboShowBebidas && (
                <div className="space-y-1.5 mb-2">
                  {(["coca-cola","inka-cola","sprite","fanta","agua-mineral"] as const).map(bid => {
                    const c = COMPLEMENTS[bid];
                    const cnt = comboExtras.filter(x => x === bid).length;
                    const recent = comboRecentExtra === bid;
                    return (
                      <div key={bid} className="flex items-center justify-between bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
                        <div className="flex items-center gap-2">
                          <span>{bid === "agua-mineral" ? "💧" : "🥤"}</span>
                          <span className="text-white text-sm">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 text-sm font-bold">S/ {c.price.toFixed(2)}</span>
                          {cnt > 0 && (
                            <><button onClick={() => setComboExtras(p => { const a = [...p]; a.splice(a.lastIndexOf(bid), 1); return a; })}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button>
                              <span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                          )}
                          <button onClick={() => { setComboExtras(p => [...p, bid]); setComboRecentExtra(bid); setTimeout(() => setComboRecentExtra(null), 1200); }}
                            className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${recent ? "bg-green-500" : "bg-amber-600 hover:bg-amber-500"}`}>
                            {recent ? "✓" : "+"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Extras accordion */}
              <button onClick={() => setComboShowExtras(p => !p)}
                className="w-full flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-xl p-3 hover:bg-gray-800 transition-all mb-2">
                <div className="flex items-center gap-2">
                  <span>🍟</span>
                  <span className="text-white text-sm font-bold">Extras</span>
                  {comboExtras.filter(c => ["extra-papas","extra-nachos"].includes(c)).length > 0 && (
                    <span className="text-xs bg-amber-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {comboExtras.filter(c => ["extra-papas","extra-nachos"].includes(c)).length}
                    </span>
                  )}
                </div>
                <span className="text-gray-400 text-sm">{comboShowExtras ? "▼" : "▶"}</span>
              </button>
              {comboShowExtras && (
                <div className="space-y-1.5 mb-2">
                  {(["extra-papas","extra-nachos"] as const).map(bid => {
                    const c = COMPLEMENTS[bid];
                    const cnt = comboExtras.filter(x => x === bid).length;
                    const recent = comboRecentExtra === bid;
                    return (
                      <div key={bid} className="flex items-center justify-between bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
                        <div className="flex items-center gap-2">
                          <span>{bid === "extra-papas" ? "🍟" : "🌽"}</span>
                          <span className="text-white text-sm">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 text-sm font-bold">S/ {c.price.toFixed(2)}</span>
                          {cnt > 0 && (
                            <><button onClick={() => setComboExtras(p => { const a = [...p]; a.splice(a.lastIndexOf(bid), 1); return a; })}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button>
                              <span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                          )}
                          <button onClick={() => { setComboExtras(p => [...p, bid]); setComboRecentExtra(bid); setTimeout(() => setComboRecentExtra(null), 1200); }}
                            className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${recent ? "bg-green-500" : "bg-amber-600 hover:bg-amber-500"}`}>
                            {recent ? "✓" : "+"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between pt-3 border-t border-white/8 mt-2">
                <span className="text-gray-400 text-sm">Total</span>
                <span className="text-white font-black text-xl">
                  S/ {((menuDiscounts[activeCombo.id] ?? menuPrices[activeCombo.id] ?? activeCombo.price) + comboExtras.reduce((s, id) => s + (COMPLEMENTS[id]?.price ?? 0), 0)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Confirm button */}
            <div className="shrink-0 px-5 py-4 border-t border-white/5">
              <button onClick={() => { comboSaveToCart(comboExtras); closeCombo(); }}
                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${activeCombo.colors.btn}`}>
                Agregar al pedido →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
           BURGER TRIO CONFIRM SHEET
      ════════════════════════════════════════════════════════════════════ */}
      {confirmTrio && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end" style={{ animation: "fadeInOv .25s ease" }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmTrio(null)} />
          <div className="relative bg-gray-900 w-full md:max-w-lg md:mx-auto md:rounded-2xl rounded-t-3xl flex flex-col shadow-2xl"
            style={{ animation: "slideUp .4s cubic-bezier(.22,1,.36,1)" }}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-600 rounded-full" /></div>
            <div className="px-5 pt-3 pb-4 border-b border-white/5">
              <p className="text-white font-black text-lg">🍔 {confirmTrio.trioName}</p>
              <p className="text-xs text-gray-500 mt-1">Confirma tu selección</p>
            </div>
            <div className="px-5 py-4 space-y-2">
              {confirmTrio.trioFlavors.map(f => (
                <div key={f.id} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-black/40">
                    <Image src={BURGER_FLAVORS.find(b => b.id === f.id)?.image || ""} alt={f.name} fill className="object-cover" />
                  </div>
                  <p className="text-white text-sm font-semibold flex-1">{f.qty > 1 ? `${f.qty}× ` : ""}{f.name}</p>
                </div>
              ))}

              {/* Bebidas accordion */}
              <button onClick={() => setBurgerShowBebidas(p => !p)}
                className="w-full flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-xl p-3 transition-all hover:bg-gray-800 mt-1">
                <div className="flex items-center gap-2">
                  <span>🥤</span>
                  <span className="text-white text-sm font-bold">Bebidas</span>
                  {burgerTrioComps.length > 0 && (
                    <span className="text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded-full font-bold">{burgerTrioComps.length}</span>
                  )}
                </div>
                <span className="text-gray-400 text-sm">{burgerShowBebidas ? "▼" : "▶"}</span>
              </button>
              {burgerShowBebidas && (
                <div className="space-y-1.5 mt-1">
                  {(["coca-cola","inka-cola","sprite","fanta","agua-mineral"] as const).map(bid => {
                    const c = COMPLEMENTS[bid];
                    const cnt = burgerTrioComps.filter(x => x === bid).length;
                    const recent = burgerRecentComp === bid;
                    return (
                      <div key={bid} className="flex items-center justify-between bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
                        <div className="flex items-center gap-2">
                          <span>{bid === "agua-mineral" ? "💧" : "🥤"}</span>
                          <span className="text-white text-sm">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 text-sm font-bold">S/ {c.price.toFixed(2)}</span>
                          {cnt > 0 && (
                            <><button onClick={() => setBurgerTrioComps(p => { const a = [...p]; a.splice(a.lastIndexOf(bid), 1); return a; })}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button>
                              <span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                          )}
                          <button onClick={() => { setBurgerTrioComps(p => [...p, bid]); setBurgerRecentComp(bid); setTimeout(() => setBurgerRecentComp(null), 1200); }}
                            className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${recent ? "bg-green-500" : "bg-orange-600 hover:bg-orange-500"}`}>
                            {recent ? "✓" : "+"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-white/5 mt-1">
                <span className="text-gray-400 text-sm">Total</span>
                <span className="text-white font-black text-xl">
                  S/ {(confirmTrio.trioPrice + burgerTrioComps.reduce((s, id) => s + (COMPLEMENTS[id]?.price ?? 0), 0)).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="px-5 pb-6 flex flex-col gap-2">
              <button onClick={confirmAndAddTrio}
                className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-sm transition-all active:scale-95">
                Agregar al pedido →
              </button>
              <button onClick={() => setConfirmTrio(null)}
                className="w-full py-3 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-all">
                Volver a editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
           TACOS MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {tacoModalOpen && (() => {
        const realP = menuPrices["taco-duo"]    || 24.90;
        const eff   = menuDiscounts["taco-duo"] || realP;
        const allSet = taco1 && taco2 && tacoComplement;
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ animation: "fadeInOv .25s ease" }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setTacoModalOpen(false)} />
            <div className="relative bg-gray-900 w-full max-w-md rounded-2xl flex flex-col shadow-2xl"
              style={{ maxHeight: "90vh", animation: "slideUp .4s cubic-bezier(.22,1,.36,1)" }}>
              <button onClick={() => setTacoModalOpen(false)}
                className="absolute top-3 right-3 z-10 w-8 h-8 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-bold">✕</button>

              <div className="flex-1 overflow-y-auto px-4 pt-10 pb-2">
                {/* Título + progress en una sola fila */}
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-base font-black text-white flex-shrink-0">Arma tu Dúo de Tacos</h3>
                  <div className="flex flex-1 gap-1.5 items-center">
                    {[taco1, taco2].map((v, i) => (
                      <div key={i} className={`flex-1 h-1.5 rounded-full ${v ? "bg-emerald-500" : "bg-gray-700"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-emerald-400 font-bold flex-shrink-0">
                    {(taco1 ? 1 : 0) + (taco2 ? 1 : 0)}/2
                  </span>
                </div>

                {/* Flavors */}
                <div className="space-y-1.5 mb-3">
                  {TACO_FLAVORS.map(f => {
                    const soldOut = !!menuStock[f.id];
                    const count = (taco1 === f.id ? 1 : 0) + (taco2 === f.id ? 1 : 0);
                    const total = (taco1 ? 1 : 0) + (taco2 ? 1 : 0);
                    const canAdd = total < 2 && !soldOut;
                    const canRemove = count > 0;
                    function addOne() {
                      if (!canAdd) return;
                      if (!taco1) { setTaco1(f.id); return; }
                      setTaco2(f.id);
                    }
                    function removeOne() {
                      if (!canRemove) return;
                      if (taco2 === f.id) { setTaco2(null); return; }
                      if (taco1 === f.id) { setTaco1(taco2); setTaco2(null); }
                    }
                    return (
                      <div key={f.id}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl border transition-all
                          ${soldOut ? "opacity-50 border-gray-700/30" : count > 0 ? "border-emerald-500/60 bg-emerald-900/20" : "border-white/8"}`}>
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-black/40">
                          <Image src={f.image} alt={f.name} fill className="object-cover" />
                        </div>
                        <p className={`flex-1 text-sm font-semibold truncate ${count > 0 ? "text-emerald-400" : "text-white"}`}>{f.name}</p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {count > 0 && (
                            <button onClick={removeOne}
                              className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-black text-base flex items-center justify-center active:scale-90 transition-all">
                              −
                            </button>
                          )}
                          {count > 0 && (
                            <span className="text-white font-black text-sm w-4 text-center">{count}</span>
                          )}
                          <button onClick={addOne} disabled={!canAdd}
                            className={`w-7 h-7 rounded-full font-black text-base flex items-center justify-center active:scale-90 transition-all
                              ${canAdd ? "bg-emerald-600 hover:bg-emerald-500 text-white" : count > 0 ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-700/50 text-gray-600 cursor-not-allowed"}`}>
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Complemento incluido */}
                <p className="text-white font-bold text-xs mb-1.5 uppercase tracking-wide text-gray-400">Elige tu complemento gratis</p>
                <div className="flex gap-2 mb-3">
                  {TACO_COMPLEMENTS.map(c => (
                    <button key={c.id} onClick={() => setTacoComplement(c.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border transition-all active:scale-95
                        ${tacoComplement === c.id ? "border-emerald-500/60 bg-emerald-900/20" : "border-white/8 hover:border-white/20"}`}>
                      <span className="text-lg">{c.emoji}</span>
                      <span className={`text-xs font-semibold ${tacoComplement === c.id ? "text-emerald-400" : "text-gray-300"}`}>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bebidas accordion */}
              <div className="px-4 pb-2">
                <button onClick={() => setTacoShowBebidas(p => !p)}
                  className="w-full flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-xl p-3 transition-all hover:bg-gray-800 mb-1">
                  <div className="flex items-center gap-2">
                    <span>🥤</span>
                    <span className="text-white text-sm font-bold">Bebidas</span>
                    {tacoModalComps.filter(c => ["coca-cola","inka-cola","sprite","fanta","agua-mineral"].includes(c)).length > 0 && (
                      <span className="text-xs bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                        {tacoModalComps.filter(c => ["coca-cola","inka-cola","sprite","fanta","agua-mineral"].includes(c)).length}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm">{tacoShowBebidas ? "▼" : "▶"}</span>
                </button>
                {tacoShowBebidas && (
                  <div className="space-y-1.5 mt-1 mb-2">
                    {(["coca-cola","inka-cola","sprite","fanta","agua-mineral"] as const).map(bid => {
                      const c = COMPLEMENTS[bid];
                      const cnt = tacoModalComps.filter(x => x === bid).length;
                      const recent = tacoRecentComp === bid;
                      return (
                        <div key={bid} className="flex items-center justify-between bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
                          <div className="flex items-center gap-2">
                            <span>{bid === "agua-mineral" ? "💧" : "🥤"}</span>
                            <span className="text-white text-sm">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 text-sm font-bold">S/ {c.price.toFixed(2)}</span>
                            {cnt > 0 && (
                              <><button onClick={() => setTacoModalComps(p => { const a = [...p]; a.splice(a.lastIndexOf(bid), 1); return a; })}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button>
                                <span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                            )}
                            <button onClick={() => { setTacoModalComps(p => [...p, bid]); setTacoRecentComp(bid); setTimeout(() => setTacoRecentComp(null), 1200); }}
                              className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${recent ? "bg-green-500" : "bg-emerald-600 hover:bg-emerald-500"}`}>
                              {recent ? "✓" : "+"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Extras accordion */}
                <button onClick={() => setTacoShowExtras(p => !p)}
                  className="w-full flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-xl p-3 transition-all hover:bg-gray-800 mb-1">
                  <div className="flex items-center gap-2">
                    <span>🍟</span>
                    <span className="text-white text-sm font-bold">Extras</span>
                    {tacoModalComps.filter(c => ["extra-papas","extra-nachos"].includes(c)).length > 0 && (
                      <span className="text-xs bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                        {tacoModalComps.filter(c => ["extra-papas","extra-nachos"].includes(c)).length}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm">{tacoShowExtras ? "▼" : "▶"}</span>
                </button>
                {tacoShowExtras && (
                  <div className="space-y-1.5 mt-1 mb-2">
                    {(["extra-papas","extra-nachos"] as const).map(bid => {
                      const c = COMPLEMENTS[bid];
                      const cnt = tacoModalComps.filter(x => x === bid).length;
                      const recent = tacoRecentComp === bid;
                      return (
                        <div key={bid} className="flex items-center justify-between bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
                          <div className="flex items-center gap-2">
                            <span>{bid === "extra-papas" ? "🍟" : "🌽"}</span>
                            <span className="text-white text-sm">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 text-sm font-bold">S/ {c.price.toFixed(2)}</span>
                            {cnt > 0 && (
                              <><button onClick={() => setTacoModalComps(p => { const a = [...p]; a.splice(a.lastIndexOf(bid), 1); return a; })}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button>
                                <span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                            )}
                            <button onClick={() => { setTacoModalComps(p => [...p, bid]); setTacoRecentComp(bid); setTimeout(() => setTacoRecentComp(null), 1200); }}
                              className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${recent ? "bg-green-500" : "bg-emerald-600 hover:bg-emerald-500"}`}>
                              {recent ? "✓" : "+"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 px-4 pt-3 pb-6 bg-gray-900 border-t border-gray-800">
                {(() => {
                  const extrasTotal = tacoModalComps.reduce((s, id) => s + (COMPLEMENTS[id]?.price ?? 0), 0);
                  const total = eff + extrasTotal;
                  return (
                    <button onClick={addTacoOrder} disabled={!allSet}
                      className={`w-full py-4 rounded-xl font-black text-base transition-all ${allSet ? "bg-emerald-600 hover:bg-emerald-500 text-white active:scale-[.98]" : "bg-gray-700 text-gray-500 cursor-not-allowed"}`}>
                      {!allSet ? "Completa tu dúo" : `Agregar dúo — S/ ${total.toFixed(2)}`}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════════
           ENSALADAS MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {fitModal && (() => {
        const mp    = FIT_PRODUCTS.find(p => p.id === fitModal)!;
        const qty   = fitQty[fitModal] || 1;
        const comps = fitComplements[fitModal] ?? [];
        const base  = menuPrices[fitModal]    || mp.price;
        const disc  = menuDiscounts[fitModal];
        const final = disc || base;

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ animation: fitClosing ? "fadeOutOv .35s ease forwards" : "fadeInOv .25s ease" }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeFitModal} />
            <div className="relative bg-gray-900 w-full max-w-md rounded-2xl flex flex-col shadow-2xl"
              style={{ maxHeight: "90vh", animation: fitClosing ? "slideDown .35s ease forwards" : "slideUp .4s cubic-bezier(.22,1,.36,1)" }}>
              <button onClick={closeFitModal}
                className="absolute top-3 right-3 z-10 w-8 h-8 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-bold">✕</button>

              <div className="flex-1 overflow-y-auto">
                <div className="relative h-56 bg-black overflow-hidden">
                  <Image src={mp.image} alt={mp.name} fill className="object-cover" sizes="100vw" />
                  {disc && <div className="absolute top-3 left-3 bg-amber-400 text-black text-xs font-black px-2 py-0.5 rounded-full">OFERTA</div>}
                </div>

                <div className="px-4 pt-4 pb-2">
                  <h3 className="text-xl font-black text-white mb-1">{mp.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{mp.description}</p>

                  {/* Price + qty */}
                  <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-800">
                    <div>
                      {disc ? (
                        <><span className="text-sm text-gray-500 line-through block">S/ {base.toFixed(2)}</span>
                          <span className="text-2xl font-black text-amber-400">S/ {disc.toFixed(2)}</span></>
                      ) : (
                        <span className="text-2xl font-black text-amber-400">S/ {base.toFixed(2)}</span>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">precio unitario</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => { const q = fitQty[fitModal] || 1; if (q > 1) setFitQty(p => ({ ...p, [fitModal]: q - 1 })); }}
                        disabled={qty <= 1}
                        className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-600 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white font-bold text-xl transition-all">−</button>
                      <span className="text-white font-black text-xl w-8 text-center">{qty}</span>
                      <button onClick={() => setFitQty(p => ({ ...p, [fitModal]: (p[fitModal] || 1) + 1 }))}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xl transition-all">+</button>
                    </div>
                  </div>

                  {/* Extras */}
                  <div className="mb-4">
                    <h5 className="text-sm font-bold text-white mb-2">Extras</h5>
                    {[
                      { id: "extra-aderezo", name: "Extra aderezo", emoji: "🥗", price: 3 },
                      ...(fitModal === "ensalada-clasica" ? [{ id: "pollo-grillado", name: "Pollo grillado", emoji: "🍗", price: 5 }] : []),
                    ].map(extra => {
                      const cnt = comps.filter(x => x === extra.id).length;
                      const recent = fitRecentComp === `${fitModal}-${extra.id}`;
                      return (
                        <div key={extra.id} className="flex items-center justify-between bg-gray-800/40 rounded-xl p-3 border border-cyan-500/10 mb-2">
                          <div className="flex items-center gap-2">
                            <span>{extra.emoji}</span>
                            <span className="text-white text-sm">{extra.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 text-sm font-bold">+S/ {extra.price.toFixed(2)}</span>
                            {cnt > 0 && (
                              <><button onClick={() => removeFitComplement(fitModal, extra.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button>
                                <span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                            )}
                            <button onClick={() => addFitComplement(fitModal, extra.id)}
                              className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${recent ? "bg-green-500" : "bg-cyan-600 hover:bg-cyan-500"}`}>
                              {recent ? "✓" : "+"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bebidas */}
                  <div className="mb-4">
                    <button onClick={() => setFitShowBebidas(p => ({ ...p, [fitModal]: !p[fitModal] }))}
                      className="w-full flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-xl p-3 hover:bg-gray-800 mb-1 transition-all">
                      <div className="flex items-center gap-2"><span>🥤</span><span className="text-white text-sm font-bold">Bebidas</span></div>
                      <span className="text-gray-400 text-sm">{fitShowBebidas[fitModal] ? "▼" : "▶"}</span>
                    </button>
                    {fitShowBebidas[fitModal] && (
                      <div className="space-y-1.5 mt-1">
                        {(["agua-mineral","coca-cola","inka-cola","sprite","fanta"] as const).map(bid => {
                          const c = COMPLEMENTS[bid];
                          const cnt = comps.filter(x => x === bid).length;
                          const recent = fitRecentComp === `${fitModal}-${bid}`;
                          return (
                            <div key={bid} className="flex items-center justify-between bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
                              <div className="flex items-center gap-2">
                                <span>{bid === "agua-mineral" ? "💧" : "🥤"}</span>
                                <span className="text-white text-sm">{c.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-amber-400 text-sm font-bold">S/ {c.price.toFixed(2)}</span>
                                {cnt > 0 && (
                                  <><button onClick={() => removeFitComplement(fitModal, bid)}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button>
                                    <span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                                )}
                                <button onClick={() => addFitComplement(fitModal, bid)}
                                  className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${recent ? "bg-green-500" : "bg-cyan-600 hover:bg-cyan-500"}`}>
                                  {recent ? "✓" : "+"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 px-4 pt-3 pb-6 bg-gray-900 border-t border-gray-800">
                <button onClick={() => completeFitOrder(fitModal)}
                  className="w-full py-4 rounded-xl font-black text-base bg-cyan-600 hover:bg-cyan-500 text-white active:scale-[.98] transition-all">
                  {fitEditIdx !== null
                    ? `Confirmar cambios — S/ ${(final * qty).toFixed(2)}`
                    : `Agregar orden — S/ ${(final * qty).toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </PageMotionWrapper>
  );
}
