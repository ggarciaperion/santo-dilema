"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { isBusinessOpen, getNextOpenMessage } from "../utils/businessHours";
import PageMotionWrapper from "../components/PageMotionWrapper";
import MpCardModal from "../components/MpCardModal";

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
  { id: "ensalada-clasica",     name: "CLÁSICA FRESH BOWL",  description: "Lechuga bogi, palta, huevo, tomate cherry, zanahoria, pepino y maíz. Vinagreta clásica.", price: 18.50, image: "/1.png",      category: "fit" as const },
  { id: "cobb-supreme-bowl",    name: "COBB SUPREME BOWL",   description: "Pollo grillado, tocino ahumado crocante, queso fresco, tomate, huevo y palta. Vinagreta de la casa.", price: 23.50, image: "/cobb.png",   category: "fit" as const },
  { id: "crispy-chicken-bowl",  name: "CRISPY CHICKEN BOWL", description: "Pollo crispy, maíz americano, mozzarella, tomate cherry y palta. Aderezo honey mustard.", price: 22.50, image: "/crispy.png", category: "fit" as const },
  { id: "pasta-power-bowl",     name: "PASTA POWER BOWL",    description: "Fideos, zanahoria, maíz, arvejitas, jamón, brócoli y pollo grillado. Aderezo especial.", price: 22.50, image: "/pasta.png",  category: "fit" as const },
  { id: "ensalada-proteica",    name: "CÉSAR POWER BOWL",    description: "Lechuga romana, pollo grillado, tomate cherry, crutones y parmesano. César cremosa de la casa.", price: 22.50, image: "/2.png",      category: "fit" as const },
  { id: "ensalada-caesar",      name: "PROTEIN FIT BOWL",    description: "Mix de hojas verdes, quinua, palta, tomate cherry, semillas y pollo grillado. Aderezo yogurt griego.", price: 23.50, image: "/3.png",      category: "fit" as const },
  { id: "ensalada-mediterranea",name: "TUNA FRESH BOWL",     description: "Atún, lechuga romana, tomate cherry, pepino, maíz americano, palta y huevo. Aderezo especial.", price: 23.50, image: "/4.png",      category: "fit" as const },
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
  ...Object.fromEntries(SALSAS.filter(s => s.id !== 'anticuchos').map(s => [`burger-salsa-${s.id}`, { name: s.name, price: 0 }])),
};

// ─── Tacos data ───────────────────────────────────────────────────────────────
const TACO_FLAVORS = [
  { id: "santo-crujiente", name: "CRUNCH SUPREME TACO", tagline: "Crujiente y tentador",    description: "Pollo crispy dorado, lechuga, pico de gallo, aros de cebolla y aioli.", image: "/crunch.png" },
  { id: "tex-dilema",      name: "TEX SUPREME TACO",    tagline: "Toque tex-mex",           description: "Pollo crispy, guacamole cremoso, pico de gallo y cilantro dressing.",   image: "/tex.png"    },
  { id: "santo-bacon",     name: "BACON DELUXE TACO",   tagline: "El que lo prueba, repite",description: "Pollo crispy, bacon crocante, cheddar fundido, pimientos y salsa.",      image: "/bacon.png"  },
];

const TACO_COMPLEMENTS = [
  { id: "nachos",       name: "Nachos",       emoji: "🌽" },
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
    includes: ["4 alitas de pollo · salsa a elección (excepto parrillera)", "Crunch Supreme Taco · Nachos incluidos"],
    steps: [{ type: "sauces", productId: "chiguan-alitas", productName: "4 Alitas", count: 1, label: "Elige tu salsa para las alitas", excludeSauceIds: ["anticuchos"] }],
    fixedItems: [{ productId: "taco-duo", cartSalsas: ["santo-crujiente"], cartComplementIds: ["nachos"], cartOriginalPrice: REF_PRICES["taco-duo"] ?? 0, summaryLabel: "Crunch Supreme Taco", summaryImage: "/crunch.png", summaryDetails: ["Sabor fijo · Nachos incluidos"] }],
    images: ["/bn.jpeg"],
    colors: { text:"text-violet-400", border:"border-violet-500/30", badge:"", btn:"bg-violet-600 hover:bg-violet-500 text-white", stepDot:"bg-violet-500", rgb:"139,92,246" },
  },
  {
    id: "combo-perfecto", name: "Combo Perfecto", emoji: "🥗", tagline: "Balance que no miente",
    description: "Pequeño Dilema + Ensalada FIT a elección. Lo justo para cuando el cuerpo pide alitas pero la cabeza dice ensalada.",
    price: 40, maxSavings: 5.50,
    includes: ["Pequeño Dilema · 8 alitas + papas + 1 salsa a elección", "Ensalada FIT a elección"],
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
    includes: ["Pequeño Dilema · 8 alitas + papas + 1 salsa a elección", "Dúo de Tacos · 2 sabores a elección"],
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
    includes: ["Pequeño Dilema · 8 alitas + papas + 1 salsa a elección", "Dúo Dilema · 14 alitas + papas + 2 salsas a elección"],
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
    includes: ["Dúo Dilema · 14 alitas + papas + 2 salsas a elección", "Ensalada a elección", "Dúo de Tacos · 2 sabores a elección"],
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
  const [navOpen, setNavOpen]         = useState(false);
  const navRef                        = useRef<HTMLDivElement>(null);
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
  const navScrollRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll the active nav tab into view on mobile
  useEffect(() => {
    const nav = navScrollRef.current;
    if (!nav) return;
    const btn = nav.querySelector(`[data-section="${activeSection}"]`) as HTMLElement | null;
    if (btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeSection]);

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
  const [tacoClosing,        setTacoClosing]        = useState(false);
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
  const [trioClosing,      setTrioClosing]       = useState(false);
  const [burgerToast,      setBurgerToast]       = useState(false);
  const [burgerTrioComps,  setBurgerTrioComps]   = useState<string[]>([]);
  const [burgerShowBebidas,setBurgerShowBebidas] = useState(false);
  const [burgerRecentComp, setBurgerRecentComp]  = useState<string | null>(null);
  const [burgerSalsa,      setBurgerSalsa]        = useState<string | null>(null);

  // ── Combos state ──────────────────────────────────────────────────────────
  const [activeCombo,      setActiveCombo]      = useState<ComboConfig | null>(null);
  const [comboStep,        setComboStep]        = useState(0);
  const [comboSelections,  setComboSelections]  = useState<ComboSelections>(emptyComboSel());
  const [comboPhase,       setComboPhase]       = useState<ComboPhase>(null);
  const [comboSheetVisible,setComboSheetVisible]= useState(false);
  const [comboClosing,     setComboClosing]     = useState(false);
  const [comboExtras,      setComboExtras]      = useState<string[]>([]);
  const [comboShowBebidas, setComboShowBebidas] = useState(false);
  const [comboShowExtras,  setComboShowExtras]  = useState(false);
  const [comboRecentExtra, setComboRecentExtra] = useState<string | null>(null);
  const [comboExpandedStep, setComboExpandedStep] = useState<number>(0);
  const [comboItems,       setComboItems]       = useState<any[]>([]);  // saved in sessionStorage

  // ── Cart state ────────────────────────────────────────────────────────────
  const [cartOpen,         setCartOpen]         = useState(false);
  const [cartClosing,      setCartClosing]       = useState(false);
  const [removeConfirm,    setRemoveConfirm]    = useState<null | {
    type: 'alitas' | 'fit' | 'taco' | 'trio' | 'bebida' | 'combo';
    idx: number;
    id?: string;
    name: string;
    qty: number;
  }>(null);
  const removeConfirmTriggerRef = useRef<HTMLButtonElement | null>(null);

  // ── Inline checkout flow ───────────────────────────────────────────────────
  const [checkoutStep,     setCheckoutStep]     = useState<'cart'|'delivery'|'review'|'payment'|'yape'|'efectivo'>('cart');
  const [ckForm,           setCkForm]           = useState({ phone: '', name: '', address: '' });
  const [ckDeliveryZone,   setCkDeliveryZone]   = useState<''|'centro'|'alrededores'>('');
  const [ckCustomerStatus, setCkCustomerStatus] = useState<'idle'|'searching'|'found'>('idle');
  const [ckCustomerAddresses, setCkCustomerAddresses] = useState<string[]>([]);
  const [ckIsSubmitting,   setCkIsSubmitting]   = useState(false);
  const [ckOrderPlaced,    setCkOrderPlaced]    = useState(false);
  const [ckAutoClosing,    setCkAutoClosing]    = useState(false);
  const [ckCompletedOrders, setCkCompletedOrders] = useState<any[]>([]);
  const [ckSelectedEfectivo, setCkSelectedEfectivo] = useState<null|'exacto'|'cambio'>(null);
  const [ckCantoCancelo,   setCkCantoCancelo]   = useState('');
  const [ckPaymentProof,   setCkPaymentProof]   = useState<File|null>(null);
  const [ckCopied,         setCkCopied]         = useState(false);
  const ckFileInputRef = useRef<HTMLInputElement>(null);
  const [showMpCardModal,  setShowMpCardModal]  = useState(false);
  const ckSubmitOrderRef = useRef<null | ((method: string) => Promise<void>)>(null);

  // ── Modal accordion auto-scroll ──────────────────────────────────────────
  // Scroll container refs
  const alitasScrollRef  = useRef<HTMLDivElement>(null);
  const fitScrollRef     = useRef<HTMLDivElement>(null);
  const tacoScrollRef    = useRef<HTMLDivElement>(null);
  const burgerScrollRef  = useRef<HTMLDivElement>(null);
  const comboScrollRef   = useRef<HTMLDivElement>(null);
  // Section button refs
  const alitasBebidasBtnRef = useRef<HTMLButtonElement>(null);
  const alitasExtrasBtnRef  = useRef<HTMLButtonElement>(null);
  const fitBebidasBtnRef    = useRef<HTMLButtonElement>(null);
  const tacoBebidasBtnRef        = useRef<HTMLButtonElement>(null);
  const tacoExtrasBtnRef         = useRef<HTMLButtonElement>(null);
  const tacoComplementSectionRef = useRef<HTMLDivElement>(null);
  const burgerBebidasBtnRef = useRef<HTMLButtonElement>(null);
  const comboBebidasBtnRef  = useRef<HTMLButtonElement>(null);
  const comboExtrasBtnRef   = useRef<HTMLButtonElement>(null);
  const comboExpandedStepRef = useRef<number>(0);
  // Pending scroll cancellation ref (last action wins)
  const scrollPendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Utility: scroll the modal's internal container so the section header + content are visible.
  // Waits for the .sd-acc transition (280 ms) before measuring — otherwise the content
  // height is still 0 and the button position is wrong.
  const scrollModalSection = (
    scrollEl: HTMLDivElement | null,
    btn: HTMLButtonElement | null,
    opening: boolean
  ) => {
    if (!opening || !scrollEl || !btn) return;
    if (scrollPendingRef.current) clearTimeout(scrollPendingRef.current);
    scrollPendingRef.current = setTimeout(() => {
      if (!scrollEl || !btn) return;
      const cr = scrollEl.getBoundingClientRect();
      const br = btn.getBoundingClientRect();
      const relTop = br.top - cr.top; // button top relative to scroll container top
      // Skip only if button is already in the top 30 % of the visible area
      // (content expanding downward will fit without scrolling)
      if (relTop >= 0 && relTop < cr.height * 0.30) return;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const target = scrollEl.scrollTop + relTop - 16;
      scrollEl.scrollTo({ top: Math.max(0, target), behavior: reduced ? 'instant' : 'smooth' });
    }, 290); // 290 ms: just after the 280 ms .sd-acc grid-template-rows transition
  };

  // ── Restore combo items from sessionStorage on mount ────────────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("santo-dilema-orders");
      if (raw) {
        const parsed = JSON.parse(raw);
        const combos = parsed.filter((o: any) => o.comboGroupId);
        if (combos.length > 0) setComboItems(combos);
      }
    } catch {}
  }, []);

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
    const top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: "smooth" });
  }

  // ── Nav dropdown: Escape + click-outside ─────────────────────────────────
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setNavOpen(false); };
    const onOutside = (e: MouseEvent) => { if (navRef.current && !navRef.current.contains(e.target as Node)) setNavOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onOutside);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onOutside); };
  }, [navOpen]);

  // ── Cart Escape + scroll lock ────────────────────────────────────────────────
  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeCart(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartOpen]);

  // ── Auto-close success panel: 4 s visible after animations complete ─────────
  // Animations finish at ~0.9 s (arc 0.6 s + check 0.5 s delay + 0.4 s draw).
  // Fade starts at 4.9 s (0.9 s + 4 s visible), close executes at 5.3 s (+ 0.4 s fade).
  useEffect(() => {
    if (!ckOrderPlaced) {
      setCkAutoClosing(false);
      return;
    }
    const fadeTimer  = setTimeout(() => setCkAutoClosing(true), 4900);
    const closeTimer = setTimeout(() => {
      setCheckoutStep('cart');
      setCkForm({ phone: '', name: '', address: '' });
      setCkDeliveryZone('');
      setCkCustomerStatus('idle');
      setCkCustomerAddresses([]);
      setCkPaymentProof(null);
      setCkSelectedEfectivo(null);
      setCkCantoCancelo('');
      setCkOrderPlaced(false);
      setCkIsSubmitting(false);
      setCartOpen(false);
      setAlitasOrders([]);
      setFitOrders([]);
      setTacoOrders([]);
      setTrioOrders([]);
      setBebidaQty({});
      setComboItems([]);
      sessionStorage.removeItem('santo-dilema-orders');
      sessionStorage.removeItem('santo-dilema-cart');
    }, 5300);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [ckOrderPlaced]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: any product modal is open ───────────────────────────────────
  const anyModalOpen = !!(alitasModal || fitModal || tacoModalOpen || confirmTrio || comboPhase);

  // ── Combo auto-advance: when the expanded step is completed, open next ───
  useEffect(() => {
    comboExpandedStepRef.current = comboExpandedStep;
  }, [comboExpandedStep]);

  useEffect(() => {
    if (!activeCombo || comboPhase !== "selecting") return;
    const si = comboExpandedStepRef.current;
    if (si < 0 || si >= activeCombo.steps.length) return;
    if (!isComboStepDone(si)) return;
    const next = si + 1;
    const t = setTimeout(() => {
      setComboExpandedStep(next < activeCombo.steps.length ? next : -1);
    }, 350);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comboSelections]);

  // ── Body scroll lock when any product modal is open ───────────────────────
  useEffect(() => {
    if (!anyModalOpen) return;
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior });
    };
  }, [anyModalOpen]);

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
      setAlitasQty(p => ({ ...p, [productId]: 1 }));
      setAlitasSalsas(p => ({ ...p, [productId]: [] }));
      setAlitasComplements(p => ({ ...p, [productId]: [] }));
      setAlitasShowBebidas(p => ({ ...p, [productId]: false }));
      setAlitasShowExtras(p => ({ ...p, [productId]: false }));
      setAlitasEditIdx(null);
    }
    setAlitasShowSalsas(p => ({ ...p, [productId]: true }));
    setCartOpen(false);
    setCartClosing(false);
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
    setBurgerSalsa(null);
    setCartOpen(false);
    setCartClosing(false);
    setConfirmTrio(trio);
  }

  function closeTrioModal() {
    setTrioClosing(true);
    setTimeout(() => { setConfirmTrio(null); setTrioClosing(false); }, 320);
  }

  function confirmAndAddTrio() {
    if (!confirmTrio) return;
    const trioWithComps = { ...confirmTrio, complementIds: [...(burgerSalsa ? [`burger-salsa-${burgerSalsa}`] : []), ...burgerTrioComps] };
    setTrioOrders(p => [...p, trioWithComps]);
    setBurgerSelections({});
    setBurgerTrioComps([]);
    setBurgerShowBebidas(false);
    setBurgerSalsa(null);
    closeTrioModal();
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
    setCartOpen(false);
    setCartClosing(false);
    setTacoClosing(false);
    setTacoModalOpen(true);
  }

  function closeTacoModal() {
    setTacoClosing(true);
    setTimeout(() => { setTacoModalOpen(false); setTacoClosing(false); }, 350);
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
    closeTacoModal();
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
    setCartOpen(false);
    setCartClosing(false);
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
    setCartOpen(false);
    setCartClosing(false);
    setComboPhase("selecting");
    setComboExtras([]);
    setComboShowBebidas(false);
    setComboShowExtras(false);
    setComboExpandedStep(0);
    comboExpandedStepRef.current = 0;
    setComboRecentExtra(null);
    setTimeout(() => setComboSheetVisible(true), 10);
  }

  function closeCombo() {
    setComboClosing(true);
    setComboSheetVisible(false);
    setTimeout(() => { setActiveCombo(null); setComboPhase(null); setComboClosing(false); }, 320);
  }

  function isComboStepValid(): boolean {
    if (!activeCombo) return false;
    const step = activeCombo.steps[comboStep];
    if (step.type === "sauces") return (comboSelections.sauces[step.productId]?.length ?? 0) === step.count;
    if (step.type === "salad")  return !!comboSelections.salad;
    if (step.type === "tacos")  return comboSelections.tacos.length === 2 && !!comboSelections.tacoComplement;
    return false;
  }

  // ── New progressive-disclosure helpers ───────────────────────────────────
  function isComboStepDone(si: number): boolean {
    if (!activeCombo) return false;
    const step = activeCombo.steps[si];
    if (!step) return false;
    if (step.type === "sauces") return (comboSelections.sauces[step.productId]?.length ?? 0) === step.count;
    if (step.type === "salad")  return !!comboSelections.salad;
    if (step.type === "tacos")  return comboSelections.tacos.length === 2 && !!comboSelections.tacoComplement;
    return false;
  }

  function areAllComboStepsValid(): boolean {
    if (!activeCombo) return false;
    return activeCombo.steps.every((_, si) => isComboStepDone(si));
  }

  function getComboStepSummary(si: number): string {
    if (!activeCombo) return "";
    const step = activeCombo.steps[si];
    if (step.type === "sauces") {
      const ids = comboSelections.sauces[step.productId] ?? [];
      const groups: Record<string, number> = {};
      for (const id of ids) groups[id] = (groups[id] ?? 0) + 1;
      return Object.entries(groups).map(([id, qty]) => {
        const name = SALSAS.find(s => s.id === id)?.name ?? id;
        return qty > 1 ? `${qty}× ${name}` : name;
      }).join(", ");
    }
    if (step.type === "salad") return FIT_PRODUCTS.find(p => p.id === comboSelections.salad)?.name ?? "";
    if (step.type === "tacos") {
      const groups: Record<string, number> = {};
      for (const tid of comboSelections.tacos) groups[tid] = (groups[tid] ?? 0) + 1;
      const parts = Object.entries(groups).map(([tid, qty]) => {
        const name = TACO_FLAVORS.find(f => f.id === tid)?.name ?? tid;
        return qty > 1 ? `${qty}× ${name}` : name;
      });
      const comp = TACO_COMPLEMENTS.find(c => c.id === comboSelections.tacoComplement);
      if (comp) parts.push(`+ ${comp.emoji} ${comp.name}`);
      return parts.join(" · ");
    }
    return "";
  }

  function comboToggleSauce(productId: string, sauceId: string, max: number) {
    setComboSelections(prev => {
      const cur = prev.sauces[productId] ?? [];
      if (cur.includes(sauceId)) return { ...prev, sauces: { ...prev.sauces, [productId]: cur.filter(s => s !== sauceId) } };
      const next = cur.length >= max ? [...cur.slice(1), sauceId] : [...cur, sauceId];
      return { ...prev, sauces: { ...prev.sauces, [productId]: next } };
    });
  }

  function comboAddSauce(productId: string, sauceId: string, max: number) {
    setComboSelections(prev => {
      const cur = prev.sauces[productId] ?? [];
      if (cur.length >= max) return prev;
      return { ...prev, sauces: { ...prev.sauces, [productId]: [...cur, sauceId] } };
    });
  }

  function comboRemoveSauce(productId: string, sauceId: string) {
    setComboSelections(prev => {
      const cur = prev.sauces[productId] ?? [];
      const idx = cur.lastIndexOf(sauceId);
      if (idx === -1) return prev;
      return { ...prev, sauces: { ...prev.sauces, [productId]: [...cur.slice(0, idx), ...cur.slice(idx + 1)] } };
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

  function closeCart() {
    setCartOpen(false);
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
  // Available outside the IIFE for MpCardModal amount
  const ckDeliveryCostOuter = ckDeliveryZone === 'alrededores' ? 5.00 : 0;
  const ckRealTotalOuter = grandTotal + ckDeliveryCostOuter;

  // True when the sticky cart bar is rendered at the bottom
  const cartBarVisible = alitasOrders.length > 0 || fitOrders.length > 0 || tacoOrders.length > 0 || trioOrders.length > 0 || comboItems.length > 0 || Object.values(bebidaQty).some(v => v > 0);
  // px offsets for modal positioning (header=88, cart bar≈72)
  const modalMaxH = cartBarVisible ? "calc(100dvh - 168px)" : "calc(100dvh - 96px)";
  const modalMB   = cartBarVisible ? 72 : 0;

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PageMotionWrapper color="red" className="min-h-screen bg-[#F6F1F1] text-[#1A1206]">
      <style>{`
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
        @media (prefers-reduced-motion: reduce) {
          #nav-dropdown { transition: opacity 200ms ease !important; transform: translateY(0) !important; }
          #cart-detail  { animation: none !important; }
          @keyframes slideUp   { from{transform:none;opacity:1} to{transform:none;opacity:1} }
          @keyframes slideDown { from{transform:none;opacity:0} to{transform:none;opacity:0} }
          @keyframes fadeInOv  { from{opacity:1} to{opacity:1} }
          @keyframes fadeOutOv { from{opacity:0} to{opacity:0} }
        }
        /* Accordion expand/collapse */
        .sd-acc { display:grid; overflow:hidden; transition:grid-template-rows 280ms ease; }
        .sd-acc-body { min-height:0; }
        .sd-acc-content { transition:opacity 150ms ease; }
        .sd-acc-content-open { transition:opacity 200ms ease 80ms; }
        /* Burger progress bar fill */
        .sd-bar-fill { transition:transform 300ms cubic-bezier(0.25,0.46,0.45,0.94); }
        /* ── Checkout processing & success ─────────────────────────────── */
        @keyframes sd-spin { to { transform:rotate(360deg); } }
        @keyframes sd-complete-arc { from{stroke-dashoffset:578} to{stroke-dashoffset:0} }
        @keyframes sd-draw-check   { to  {stroke-dashoffset:0} }
        .sd-spin       { animation:sd-spin 1.2s linear infinite; transform-origin:center; }
        .sd-arc-complete { stroke-dasharray:578; stroke-dashoffset:578;
                           animation:sd-complete-arc .6s cubic-bezier(.4,0,.2,1) forwards; }
        .sd-check-path { stroke-dasharray:115; stroke-dashoffset:115;
                         animation:sd-draw-check .4s .5s cubic-bezier(.4,0,.2,1) forwards; }
        @media (prefers-reduced-motion:reduce) {
          .sd-acc { transition:none !important; }
          .sd-acc-content,.sd-acc-content-open { transition:none !important; }
          .sd-bar-fill { transition:none !important; }
          .sd-spin { animation:none !important; }
          .sd-arc-complete { animation:none !important; stroke-dashoffset:0 !important; }
          .sd-check-path  { animation:none !important; stroke-dashoffset:0 !important; }
        }
      `}</style>


      {/* ── Header + nav en una sola fila ────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-30"
        style={{ background: "#FFFFFF", borderBottom: "1px solid rgba(0,0,0,.08)" }}>
        {/* 3 columnas sobre el ancho completo del header */}
        <div className="flex items-center px-4" style={{ height: 88 }}>
          {/* Columna izquierda — hamburger + desplegable */}
          <div className="flex-1 flex items-center" ref={navRef}>
            <button
              onClick={() => setNavOpen(v => !v)}
              aria-label="Abrir menú"
              aria-expanded={navOpen}
              aria-controls="nav-dropdown"
              className="flex flex-col justify-center gap-[5px] p-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F58424] focus-visible:ring-offset-2"
            >
              <span className={`block h-[3px] w-6 bg-[#F58424] rounded transition-all duration-200 ${navOpen ? "translate-y-[8px] rotate-45" : ""}`} />
              <span className={`block h-[3px] w-6 bg-[#F58424] rounded transition-all duration-200 ${navOpen ? "opacity-0" : ""}`} />
              <span className={`block h-[3px] w-6 bg-[#F58424] rounded transition-all duration-200 ${navOpen ? "-translate-y-[8px] -rotate-45" : ""}`} />
            </button>

            {/* Dropdown panel */}
            <div
              id="nav-dropdown"
              role="menu"
              style={{
                position: "absolute", top: 88, left: 0,
                pointerEvents: navOpen ? "auto" : "none",
                opacity: navOpen ? 1 : 0,
                transform: navOpen ? "translateY(0)" : "translateY(-6px)",
                transition: "opacity 200ms ease, transform 200ms ease",
              }}
              className="bg-white border-b border-[rgba(0,0,0,0.08)] shadow-sm w-56 z-40"
            >
              {[
                { id: "alitas",    label: "Alitas" },
                { id: "ensaladas", label: "Ensaladas" },
                { id: "tacos",     label: "Tacos" },
                { id: "burgers",   label: "Mini Burgers" },
                { id: "combos",    label: "Combos" },
              ].map(item => (
                <button
                  key={item.id}
                  role="menuitem"
                  tabIndex={navOpen ? 0 : -1}
                  onClick={() => { setNavOpen(false); scrollToSection(item.id); }}
                  className="w-full text-left px-5 py-3 text-[#F58424] font-bold text-sm hover:bg-[rgba(245,132,36,0.06)] transition-colors focus-visible:outline-none focus-visible:bg-[rgba(245,132,36,0.08)]"
                >
                  {item.label}
                </button>
              ))}
              <a
                href="https://wa.me/51910677186"
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                tabIndex={navOpen ? 0 : -1}
                onClick={() => setNavOpen(false)}
                className="flex items-center gap-2 px-5 py-3 text-[#F58424] font-bold text-sm hover:bg-[rgba(245,132,36,0.06)] transition-colors focus-visible:outline-none focus-visible:bg-[rgba(245,132,36,0.08)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F58424" className="w-4 h-4 flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Escríbenos
              </a>
            </div>
          </div>

          {/* Columna central — logo centrado en el viewport */}
          <Link href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
            <Image src="/logo-santo-dilema-cropped.png" alt="Santo Dilema" width={961} height={372} className="h-12 sm:h-16 w-auto" priority />
          </Link>

          {/* Columna derecha — WhatsApp pegado al extremo derecho */}
          <div className="flex-1 flex justify-end">
            <a
              href="https://wa.me/51910677186"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ordena por WhatsApp al 910 677 186"
              className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F58424] focus-visible:ring-offset-2 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F58424" className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <div className="sm:hidden flex flex-col leading-none">
                <span className="text-[#F58424] font-semibold text-[10px] leading-tight">Pide por</span>
                <span className="text-[#F58424] font-semibold text-[10px] leading-tight">WhatsApp</span>
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-[#F58424] font-bold text-[10px] sm:text-xs uppercase tracking-wide">Ordena por WhatsApp</span>
                <span className="text-[#F58424] font-black text-xs sm:text-sm">910 677 186</span>
              </div>
            </a>
          </div>
        </div>
      </header>
      <div className="h-[88px]" />

      {/* ── Closed banner ────────────────────────────────────────────────── */}
      {!isOpen && (
        <div className="bg-[#F58424] px-4 py-3 text-center relative z-10">
          <p className="text-white text-sm font-bold">⏰ Estamos cerrados</p>
          <p className="text-white/90 text-xs mt-0.5">{getNextOpenMessage()}</p>
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
            <h2 className="text-[28px] md:text-[44px] font-extrabold leading-tight tracking-tight font-[family-name:var(--font-bricolage)]"
              style={{ color: '#F58424' }}>
              Alitas
            </h2>
            <p className="text-sm md:text-base text-black mt-1.5 font-[family-name:var(--font-poppins)]">
              Tu salsa favorita, tu próximo antojo.
            </p>
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
                  className={`relative bg-white rounded-2xl overflow-hidden transition-all
                    ${carousel ? "flex-shrink-0 w-[76vw] snap-center" : ""}
                    ${soldOut ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:-translate-y-1"}`}>
                  {soldOut && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50"><span className="border-4 border-red-500 text-red-500 font-black text-sm px-2 py-0.5 rotate-[-15deg]">AGOTADO</span></div>}
                  {inOrder && <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ En orden</div>}
                  <div className="relative h-44 bg-black overflow-hidden">
                    <Image src={product.image} alt={product.name} fill className="object-cover" sizes="340px" />
                    {discount && <div className="absolute top-2 left-2 bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full">OFERTA</div>}
                  </div>
                  <div className="p-3 bg-white">
                    <h3 className="font-bold text-black text-sm mb-1">{product.name}</h3>
                    <p className="text-black text-xs mb-3 font-[family-name:var(--font-poppins)] leading-[1.5]">{product.description}</p>
                    <div className="flex items-center justify-between">
                      {discount ? (<div><span className="text-[10px] text-gray-400 line-through block">S/ {basePrice.toFixed(2)}</span><span className="text-lg font-black text-black">S/ {discount.toFixed(2)}</span></div>)
                        : <span className="text-lg font-black text-black">S/ {basePrice.toFixed(2)}</span>}
                      {!soldOut && <button onClick={e => { e.stopPropagation(); openAlitasModal(product.id); }} aria-label={`Agregar ${product.name}`} className="w-9 h-9 bg-[#F58424] hover:bg-[#F58424] hover:shadow-[0_0_8px_rgba(245,132,36,0.6)] text-white rounded-full font-bold text-xl flex items-center justify-center transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-[#F58424] focus-visible:ring-offset-1">+</button>}
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
                <div className="md:hidden flex justify-center items-center gap-1.5 mt-2 mb-1">
                  {ALITAS_PRODUCTS.map((_, i) => (
                    <div key={i} onClick={() => { setAlitasIdx(i); pauseCarousel(); }}
                      className={`rounded-full transition-all cursor-pointer ${i === alitasIdx ? "w-4 h-1.5 bg-[#F58424]" : "w-1.5 h-1.5 bg-[rgba(26,18,6,0.2)]"}`} />
                  ))}
                </div>
                {/* Desktop: breakout 3 columnas full-width */}
                <div className="hidden md:block" style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}>
                  <div className="max-w-[1000px] mx-auto px-4">
                    <div className="grid grid-cols-3 gap-5">
                      {ALITAS_PRODUCTS.map(p => renderAlitasCard(p, false))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

        </section>

        {/* ═══ ENSALADAS ════════════════════════════════════════════════════ */}
        <section id="ensaladas" ref={el => { sectionRefs.current.ensaladas = el; }} className="pt-8 pb-10 border-t border-[rgba(26,18,6,0.08)]">
          <div className="mb-6 text-center">
            <h2 className="text-[28px] md:text-[44px] font-extrabold leading-tight tracking-tight font-[family-name:var(--font-bricolage)]"
              style={{ color: '#F58424' }}>
              Ensaladas &amp; Bowls
            </h2>
            <p className="text-sm md:text-base text-black mt-1.5 font-[family-name:var(--font-poppins)]">
              Comer saludable también es comer rico.
            </p>
          </div>

          {(() => {
            const renderFitCard = (product: typeof FIT_PRODUCTS[0], carousel: boolean, wide = false) => {
              const soldOut   = !!menuStock[product.id];
              const basePrice = menuPrices[product.id] || product.price;
              const discount  = menuDiscounts[product.id];
              const inOrder   = fitOrders.some(o => o.productId === product.id);
              return (
                <div key={product.id}
                  onClick={() => { if (!soldOut) openFitModal(product.id); }}
                  className={`relative bg-white rounded-2xl overflow-hidden transition-all flex flex-col
                    ${carousel ? "flex-shrink-0 w-[76vw] snap-center" : wide ? "w-full" : "w-56 flex-shrink-0"}
                    ${soldOut ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:-translate-y-1"}`}>
                  {soldOut && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50"><span className="border-4 border-red-500 text-red-500 font-black text-sm px-2 py-0.5 rotate-[-15deg]">AGOTADO</span></div>}
                  {inOrder && <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ En orden</div>}
                  <div className="relative h-44 bg-black overflow-hidden">
                    <Image src={product.image} alt={product.name} fill className="object-cover" sizes={wide ? "340px" : "224px"} />
                    {discount && <div className="absolute top-2 left-2 bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full">OFERTA</div>}
                  </div>
                  <div className="p-3 bg-white flex flex-col flex-1">
                    <h3 className="font-bold text-black text-sm mb-1">{product.name}</h3>
                    <p className="text-black text-xs mb-3 font-[family-name:var(--font-poppins)] leading-[1.5] flex-1">{product.description}</p>
                    <div className="flex items-center justify-between">
                      {discount ? (<div><span className="text-xs text-gray-400 line-through block">S/ {basePrice.toFixed(2)}</span><span className="text-lg font-black text-black">S/ {discount.toFixed(2)}</span></div>)
                        : <span className="text-lg font-black text-black">S/ {basePrice.toFixed(2)}</span>}
                      {!soldOut && <button onClick={e => { e.stopPropagation(); openFitModal(product.id); }} aria-label={`Agregar ${product.name}`} className="w-9 h-9 bg-[#F58424] hover:bg-[#F58424] hover:shadow-[0_0_8px_rgba(245,132,36,0.6)] text-white rounded-full font-bold text-xl flex items-center justify-center transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-[#F58424] focus-visible:ring-offset-1">+</button>}
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
                <div className="md:hidden flex justify-center items-center gap-1.5 mt-2 mb-1">
                  {FIT_PRODUCTS.map((_, i) => (
                    <div key={i} onClick={() => { setFitIdx(i); pauseCarousel(); }}
                      className={`rounded-full transition-all cursor-pointer ${i === fitIdx ? "w-4 h-1.5 bg-[#F58424]" : "w-1.5 h-1.5 bg-[rgba(26,18,6,0.2)]"}`} />
                  ))}
                </div>
                {/* Desktop: breakout con filas de w-56 */}
                <div className="hidden md:block" style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}>
                  <div className="max-w-[1000px] mx-auto px-4">
                    <div className="flex justify-center gap-4 mb-4">{FIT_PRODUCTS.slice(0, 4).map(p => renderFitCard(p, false))}</div>
                    <div className="grid grid-cols-3 gap-5">{FIT_PRODUCTS.slice(4).map(p => renderFitCard(p, false, true))}</div>
                  </div>
                </div>
              </>
            );
          })()}

        </section>

        {/* ═══ TACOS ════════════════════════════════════════════════════════ */}
        <section id="tacos" ref={el => { sectionRefs.current.tacos = el; }} className="pt-8 pb-10 border-t border-[rgba(26,18,6,0.08)]">
          <div className="mb-6 text-center">
            <h2 className="text-[28px] md:text-[44px] font-extrabold leading-tight tracking-tight font-[family-name:var(--font-bricolage)]"
              style={{ color: '#F58424' }}>
              Tacos
            </h2>
            <p className="text-sm md:text-base text-black mt-1.5 font-[family-name:var(--font-poppins)]">
              Arma tu dúo con tus sabores favoritos.
            </p>
          </div>


          {(() => {
            const renderTacoCard = (flavor: typeof TACO_FLAVORS[0], carousel: boolean) => {
              const soldOut = !!menuStock[flavor.id];
              const chosen  = tacoOrders.some(o => o.salsas.includes(flavor.id));
              return (
                <div key={flavor.id}
                  onClick={() => { if (!soldOut) openTacoModal(flavor.id); }}
                  className={`relative bg-white rounded-2xl overflow-hidden transition-all
                    ${carousel ? "flex-shrink-0 w-[76vw] snap-center" : ""}
                    ${soldOut ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:-translate-y-1"}`}>
                  {soldOut && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50"><span className="border-4 border-red-500 text-red-500 font-black text-sm px-2 py-0.5 rotate-[-15deg]">AGOTADO</span></div>}
                  {chosen && <div className="absolute top-2 right-2 z-10 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Elegido</div>}
                  <div className="relative h-44 bg-black overflow-hidden">
                    <Image src={flavor.image} alt={flavor.name} fill className="object-cover" sizes="340px" />
                  </div>
                  <div className="p-3 bg-white">
                    <h3 className="font-bold text-black text-sm mb-1">{flavor.name}</h3>
                    <p className="text-black text-xs font-[family-name:var(--font-poppins)] leading-[1.5]">{flavor.description}</p>
                    {!soldOut && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-black font-black text-sm">2 x S/ {(menuPrices["taco-duo"] || 24.90).toFixed(2)}</span>
                        <button onClick={e => { e.stopPropagation(); openTacoModal(flavor.id); }} aria-label={`Agregar ${flavor.name}`} className="w-9 h-9 bg-[#F58424] hover:bg-[#F58424] hover:shadow-[0_0_8px_rgba(245,132,36,0.6)] text-white rounded-full font-bold text-xl flex items-center justify-center transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-[#F58424] focus-visible:ring-offset-1">+</button>
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
                <div className="md:hidden flex justify-center items-center gap-1.5 mt-2 mb-1">
                  {TACO_FLAVORS.map((_, i) => (
                    <div key={i} onClick={() => { setTacoIdx(i); pauseCarousel(); }}
                      className={`rounded-full transition-all cursor-pointer ${i === tacoIdx ? "w-4 h-1.5 bg-[#F58424]" : "w-1.5 h-1.5 bg-[rgba(26,18,6,0.2)]"}`} />
                  ))}
                </div>
                {/* Desktop: breakout 3 columnas full-width */}
                <div className="hidden md:block" style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}>
                  <div className="max-w-[1000px] mx-auto px-4">
                    <div className="grid grid-cols-3 gap-5">
                      {TACO_FLAVORS.map(f => renderTacoCard(f, false))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

        </section>

        {/* ═══ MINI BURGERS ════════════════════════════════════════════════ */}
        <section id="burgers" ref={el => { sectionRefs.current.burgers = el; }} className="pt-8 pb-10 border-t border-[rgba(26,18,6,0.08)]">
          <div className="mb-6 text-center">
            <h2 className="text-[28px] md:text-[44px] font-extrabold leading-tight tracking-tight font-[family-name:var(--font-bricolage)]"
              style={{ color: '#F58424' }}>
              Mini Burgers
            </h2>
            <p className="text-sm md:text-base text-black mt-1.5 font-[family-name:var(--font-poppins)]">
              Arma tu dúo o trío. Todas incluyen papas.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 max-w-xs mx-auto mb-5">
            <button
              onClick={() => { setBurgerMode("duo"); setBurgerSelections({}); }}
              className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F58424] focus-visible:ring-offset-2
                ${burgerMode === "duo"
                  ? "bg-[#F58424] border-[#F58424] text-white"
                  : "bg-white border-gray-200 text-black hover:border-[#F58424]/60"}`}>
              Dúo · S/ {DUO_BASE_PRICE.toFixed(2)}
              <span className="block text-[10px] font-normal opacity-70">2 miniburgers</span>
            </button>
            <button
              onClick={() => { setBurgerMode("trio"); setBurgerSelections({}); }}
              className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F58424] focus-visible:ring-offset-2
                ${burgerMode === "trio"
                  ? "bg-[#F58424] border-[#F58424] text-white"
                  : "bg-white border-gray-200 text-black hover:border-[#F58424]/60"}`}>
              Trío · S/ {TRIO_BASE_PRICE.toFixed(2)}
              <span className="block text-[10px] font-normal opacity-70">3 miniburgers</span>
            </button>
          </div>

          {/* Progress bar — relleno animado con scaleX */}
          <div className="flex gap-2 mb-3 max-w-xs mx-auto">
            {Array.from({ length: activeSize }).map((_, i) => (
              <div key={`${burgerMode}-${i}`} className="flex-1 h-2 rounded-full overflow-hidden bg-white border border-gray-200">
                <div
                  className="sd-bar-fill h-full rounded-full bg-[#F58424]"
                  style={{ transformOrigin: "left", transform: `scaleX(${i < burgerTotal ? 1 : 0})` }}
                />
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mb-5">
            {burgerTotal === 0
              ? `Elige ${activeSize} sabores`
              : burgerTotal < activeSize
                ? `Te ${activeSize - burgerTotal === 1 ? "falta 1 más" : `faltan ${activeSize - burgerTotal} más`}`
                : burgerMode === "duo" ? "¡Dúo listo!" : "¡Trío listo!"}
          </p>

          {(() => {
            const renderBurgerCard = (flavor: typeof BURGER_FLAVORS[0], mobile: boolean) => {
              const soldOut = !!menuStock[flavor.id];
              const qty = burgerSelections[flavor.id] || 0;
              return (
                <div key={flavor.id}
                  className={`relative bg-white rounded-2xl overflow-hidden transition-all
                    ${soldOut ? "opacity-60" : qty > 0 ? "" : "hover:-translate-y-1"}`}>
                  {soldOut && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                      <span className="text-red-500 font-black text-xs border-2 border-red-500 px-2 py-0.5 rotate-[-12deg]">AGOTADO</span>
                    </div>
                  )}
                  {qty > 0 && (
                    <div className="absolute top-2 left-2 z-10 w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-black">{qty}</div>
                  )}
                  <div className={`relative ${mobile ? "h-32" : "h-44"} bg-white overflow-hidden`}>
                    <Image src={flavor.image} alt={flavor.name} fill className="object-contain" sizes={mobile ? "200px" : "340px"} />
                  </div>
                  <div className={`${mobile ? "p-2.5" : "p-3"} bg-white`}>
                    <p className={`text-black ${mobile ? "text-xs" : "text-sm"} font-bold mb-0.5 leading-tight`}>{flavor.name}</p>
                    <p className="text-black text-[10px] mb-2 font-[family-name:var(--font-poppins)] leading-[1.5]">{flavor.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-black font-black ${mobile ? "text-xs" : "text-sm"}`}>{activeSize}×S/{activeBurgerPrice.toFixed(2)}</span>
                      <div className="flex items-center gap-1">
                        {qty > 0 && (
                          <button onClick={() => removeBurgerFlavor(flavor.id)}
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-red-600/80 hover:bg-red-500 text-white font-bold text-lg flex items-center justify-center rounded-full transition-all active:scale-95">−</button>
                        )}
                        <button onClick={() => { if (!soldOut) addBurgerFlavor(flavor.id); }}
                          disabled={soldOut || (!burgerCanAdd && qty === 0)}
                          aria-label={`Agregar ${flavor.name}`}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full font-bold text-lg flex items-center justify-center transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-[#F58424] focus-visible:ring-offset-1
                            ${soldOut || (!burgerCanAdd && qty === 0) ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-[#F58424] hover:bg-[#F58424] hover:shadow-[0_0_8px_rgba(245,132,36,0.6)] text-white"}`}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            };
            return (
              <>
                {/* Mobile: 2-column grid */}
                <div className="md:hidden grid grid-cols-2 gap-3">
                  {BURGER_FLAVORS.map(f => renderBurgerCard(f, true))}
                </div>
                {/* Desktop: breakout 3 columnas full-width */}
                <div className="hidden md:block" style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}>
                  <div className="max-w-[1000px] mx-auto px-4">
                    <div className="grid grid-cols-3 gap-5">
                      {BURGER_FLAVORS.map(f => renderBurgerCard(f, false))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Add order button */}
          {burgerTotal === activeSize && (
            <button onClick={handleAddTrio}
              className="mt-5 w-full py-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-base transition-all active:scale-[.98]"
              style={{ boxShadow: "0 0 16px rgba(251,146,60,.3)" }}>
              Confirmar {burgerMode === "duo" ? "dúo" : "trío"} — S/ {activeBurgerPrice.toFixed(2)}
            </button>
          )}

        </section>

        {/* ═══ COMBOS ══════════════════════════════════════════════════════ */}
        <section id="combos" ref={el => { sectionRefs.current.combos = el; }} className="pt-8 pb-10 border-t border-[rgba(26,18,6,0.08)]">
          <div className="mb-6 text-center">
            <h2 className="text-[28px] md:text-[44px] font-extrabold leading-tight tracking-tight font-[family-name:var(--font-bricolage)]"
              style={{ color: '#F58424' }}>
              Combos
            </h2>
            <p className="text-sm md:text-base text-black mt-1.5 font-[family-name:var(--font-poppins)]">
              Tus favoritos, mejor juntos.
            </p>
          </div>

          {(() => {
            const renderCard = (combo: (typeof COMBOS)[0], carousel = false, desktop = false) => {
              const baseP = menuPrices[combo.id] ?? combo.price;
              const discP = menuDiscounts[combo.id];
              const eff   = discP ?? baseP;
              const { rgb } = combo.colors;
              return (
                <div key={combo.id}
                  onClick={() => { openCombo(combo); }}
                  className={`relative flex-shrink-0 ${carousel ? 'w-[76vw] snap-center' : desktop ? 'w-full' : 'w-[200px] sm:w-[240px] snap-start'} bg-white rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1`}>
                  <div className="h-0.5" style={{ background: `linear-gradient(90deg,transparent,rgba(${rgb},.8),transparent)` }} />
                  <div className={`relative ${desktop ? 'h-44' : 'h-40'} bg-black overflow-hidden`}>
                    <Image src={combo.images[0]} alt={combo.name} fill className="object-cover" sizes="400px" />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(12,12,12,.95) 0%, transparent 60%)` }} />
                    {combo.maxSavings > 0 && (
                      <span className="absolute top-2 left-2 text-[10px] font-black rounded-full px-2.5 py-1" style={{ background: "#F6F1F1", color: "#F58424" }}>
                        Ahorra S/ {combo.maxSavings.toFixed(2)}
                      </span>
                    )}
                    <span className="absolute top-2 right-2 text-xl">{combo.emoji}</span>
                  </div>
                  <div className="px-4 pt-3 pb-4 bg-white">
                    <h3 className="font-black text-base leading-tight mb-2 text-black">{combo.name}</h3>
                    <ul className="space-y-1 mb-3">
                      {combo.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-black font-[family-name:var(--font-poppins)]">
                          <span className={`mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] flex-shrink-0 ${combo.colors.stepDot}`} style={{ color: "#fff" }}>✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        {(discP || combo.maxSavings > 0) && (
                          <span className="text-xs text-gray-400 line-through block">
                            S/ {(discP ? baseP : eff + combo.maxSavings).toFixed(2)}
                          </span>
                        )}
                        <span className="text-xl font-black text-black">S/ {eff.toFixed(2)}</span>
                      </div>
                      <button
                        type="button"
                        aria-label={`Elegir opciones de ${combo.name}`}
                        className="w-9 h-9 bg-[#F58424] hover:bg-[#F58424] hover:shadow-[0_0_8px_rgba(245,132,36,0.6)] text-white rounded-full font-bold text-xl flex items-center justify-center transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-[#F58424] focus-visible:ring-offset-1">
                        +
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
                <div className="md:hidden flex justify-center items-center gap-1.5 mt-2 mb-1">
                  {COMBOS.map((_, i) => (
                    <div key={i} onClick={() => { setCombosIdx(i); pauseCarousel(); }}
                      className={`rounded-full transition-all cursor-pointer ${i === combosIdx ? "w-4 h-1.5 bg-[#F58424]" : "w-1.5 h-1.5 bg-[rgba(26,18,6,0.2)]"}`} />
                  ))}
                </div>
                {/* Desktop: breakout 3 columnas full-width */}
                <div className="hidden md:block" style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}>
                  <div className="max-w-[1000px] mx-auto px-4">
                    <div className="grid grid-cols-3 gap-5 mb-5">
                      {COMBOS.slice(0, 3).map(c => renderCard(c, false, true))}
                    </div>
                    {COMBOS.slice(3).length > 0 && (
                      <div className="flex justify-center gap-5">
                        {COMBOS.slice(3).map(c => (
                          <div key={c.id} style={{ width: "calc((min(1000px, 100vw) - 2rem - 2.5rem) / 3)" }}>
                            {renderCard(c, false, true)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}

        </section>

      </main>

      {/* ── Cart Bar ───────────────────────────────────────────────────────── */}
      {(alitasOrders.length > 0 || fitOrders.length > 0 || tacoOrders.length > 0 || trioOrders.length > 0 || comboItems.length > 0 || Object.values(bebidaQty).some(v => v > 0)) && (() => {
        const comboSeen2 = new Set<string>();
        comboItems.forEach((o: any) => { if (o.comboGroupId && !comboSeen2.has(o.comboGroupId)) comboSeen2.add(o.comboGroupId); });
        const totalCount = alitasOrders.reduce((s,o) => s + o.quantity, 0) + fitOrders.reduce((s,o) => s + o.quantity, 0) + tacoOrders.length + trioOrders.length + comboSeen2.size + BEBIDAS.reduce((s,b) => s + (bebidaQty[b.id] || 0), 0);
        const ordersLabel = `${totalCount} orden${totalCount !== 1 ? "es" : ""} agregada${totalCount !== 1 ? "s" : ""}`;
        const buildCompletedOrders = () => {
          const existingComboOrders: any[] = JSON.parse(sessionStorage.getItem("santo-dilema-orders") ?? "[]").filter((o: any) => o.comboGroupId);
          const regularOrders: any[] = [];
          alitasOrders.forEach(o => { regularOrders.push({ productId: o.productId, quantity: o.quantity, salsas: o.salsas, complementIds: o.complementIds, originalPrice: o.originalPrice, finalPrice: o.finalPrice, discountApplied: o.discountApplied }); });
          fitOrders.forEach(o => { regularOrders.push({ productId: o.productId, quantity: o.quantity, salsas: [], complementIds: o.complementIds, originalPrice: o.originalPrice, finalPrice: o.finalPrice, discountApplied: o.discountApplied }); });
          tacoOrders.forEach(o => { regularOrders.push({ productId: o.productId, quantity: o.quantity, salsas: o.salsas, complementIds: o.complementIds, finalPrice: o.finalPrice, originalPrice: o.originalPrice }); });
          BEBIDAS.forEach(b => { const q = bebidaQty[b.id] || 0; if (q > 0) regularOrders.push({ productId: b.id, quantity: q, salsas: [], complementIds: [], finalPrice: b.price, originalPrice: b.price }); });
          trioOrders.forEach(trio => { regularOrders.push({ productId: trio.trioName === "Dúo Mini Burgers" ? "burger-duo" : "burger-trio", quantity: trio.trioQuantity, salsas: trio.trioFlavors.map(f => `${f.qty > 1 ? f.qty + "× " : ""}${f.name}`), complementIds: trio.complementIds, finalPrice: trio.trioPrice, originalPrice: trio.trioPrice }); });
          return [...existingComboOrders, ...regularOrders];
        };
        const goToDelivery = () => {
          if (anyModalOpen) return;
          setCkCompletedOrders(buildCompletedOrders());
          setCheckoutStep('delivery');
          setCartOpen(true);
        };
        const ckDeliveryCost = ckDeliveryZone === 'alrededores' ? 5.00 : 0;
        const ckRealTotal = grandTotal + ckDeliveryCost;
        const ckHandlePhone = (value: string) => {
          const nums = value.replace(/\D/g, '');
          setCkForm(prev => ({ ...prev, phone: nums }));
          if (nums.length === 9) {
            setCkCustomerStatus('searching');
            fetch(`/api/customers?phone=${nums}`)
              .then(r => r.json())
              .then(data => {
                if (data.found) {
                  setCkCustomerStatus('found');
                  setCkCustomerAddresses(data.addresses || []);
                  setCkForm(prev => ({ ...prev, name: prev.name || data.name, address: prev.address || (data.addresses?.[0] ?? '') }));
                } else {
                  setCkCustomerStatus('idle');
                  setCkCustomerAddresses([]);
                }
              })
              .catch(() => { setCkCustomerStatus('idle'); setCkCustomerAddresses([]); });
          } else {
            setCkCustomerStatus('idle');
          }
        };
        const ckDeliveryValid = ckForm.phone.length === 9 && ckForm.name.trim() !== '' && ckForm.address.trim() !== '' && ckDeliveryZone !== '';
        const ckSubmitOrder = async (paymentMethod: string) => {
          setCkIsSubmitting(true);
          try {
            const fd = new FormData();
            fd.append('name', ckForm.name);
            fd.append('phone', ckForm.phone);
            fd.append('address', ckForm.address);
            fd.append('completedOrders', JSON.stringify(ckCompletedOrders));
            fd.append('totalItems', ckCompletedOrders.length.toString());
            fd.append('totalPrice', ckRealTotal.toString());
            fd.append('couponDiscount', '0');
            fd.append('couponCode', '');
            fd.append('paymentMethod', paymentMethod);
            fd.append('deliveryOption', ckDeliveryZone || 'centro');
            fd.append('deliveryCost', ckDeliveryCost.toString());
            fd.append('timestamp', new Date().toISOString());
            if (ckPaymentProof) fd.append('paymentProof', ckPaymentProof);
            if (ckCantoCancelo) fd.append('cantoCancelo', ckCantoCancelo);
            const res = await fetch('/api/orders', { method: 'POST', body: fd });
            if (res.ok) {
              sessionStorage.removeItem('santo-dilema-orders');
              sessionStorage.removeItem('santo-dilema-cart');
              setCkOrderPlaced(true);
            } else {
              alert('Hubo un error al procesar tu pedido. Intenta nuevamente.');
            }
          } catch {
            alert('Error de conexi\u00f3n. Verifica tu internet e intenta nuevamente.');
          } finally {
            setCkIsSubmitting(false);
          }
        };
        ckSubmitOrderRef.current = ckSubmitOrder;
        const ckReset = () => {
          setCheckoutStep('cart');
          setCkForm({ phone: '', name: '', address: '' });
          setCkDeliveryZone('');
          setCkCustomerStatus('idle');
          setCkCustomerAddresses([]);
          setCkPaymentProof(null);
          setCkSelectedEfectivo(null);
          setCkCantoCancelo('');
          setCkOrderPlaced(false);
          setCkIsSubmitting(false);
        };
        const toggleCart = () => {
          if (anyModalOpen) return;
          if (cartOpen) closeCart(); else setCartOpen(true);
        };
        // Sequential row number offsets (one badge per order line)
        const rFit   = alitasOrders.length;
        const rTaco  = rFit   + fitOrders.length;
        const rTrio  = rTaco  + tacoOrders.length;
        const rBev   = rTrio  + trioOrders.length;
        const rCombo = rBev   + BEBIDAS.filter(b => (bebidaQty[b.id] || 0) > 0).length;
        const badge = (n: number) => (
          <span className="w-6 h-6 rounded-full bg-[#F58424] text-white text-[10px] font-black flex-shrink-0 flex items-center justify-center mt-0.5">
            {String(n).padStart(2, "0")}
          </span>
        );
        return (
          <div
            role="region"
            aria-label="Carrito de compras"
            className="fixed bottom-0 left-0 right-0 z-[150] bg-white border-t border-black/10 shadow-[0_-2px_20px_rgba(0,0,0,.12)]"
          >
            {/* ── Expandable detail panel (CSS grid animation) ─────────────────── */}
            <div
              id="cart-bar-detail"
              style={{
                display: "grid",
                gridTemplateRows: cartOpen ? "1fr" : "0fr",
                transition: "grid-template-rows 320ms cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <div style={{ overflow: "hidden", minHeight: 0 }}>
                <div className="overflow-y-auto border-b border-black/8" style={{ maxHeight: "calc(100dvh - 160px)" }}>
                  {checkoutStep === 'cart' && <div className="max-w-3xl mx-auto px-4 pt-3 pb-2">

                    {/* Alitas */}
                    {alitasOrders.map((order, idx) => {
                      const p = ALITAS_PRODUCTS.find(x => x.id === order.productId)!;
                      const basePrice = order.finalPrice ?? order.originalPrice ?? p.price;
                      const paidExtras = order.complementIds.filter(c => (COMPLEMENTS[c]?.price ?? 0) > 0).map(c => COMPLEMENTS[c]);
                      const freeExtras = order.complementIds.filter(c => (COMPLEMENTS[c]?.price ?? 0) === 0).map(c => COMPLEMENTS[c]).filter(Boolean);
                      const lineTotal = basePrice * order.quantity + paidExtras.reduce((s, c) => s + (c?.price ?? 0), 0);
                      return (
                        <div key={`a-${idx}`} className="flex items-start gap-2.5 py-2.5 border-b border-black/6 last:border-0">
                          {badge(idx + 1)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-sm font-bold text-black leading-tight">{order.quantity > 1 ? `${order.quantity}× ` : ""}{p.name}</p>
                              <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-2">
                                <p className="text-sm font-black text-[#F58424]">S/ {lineTotal.toFixed(2)}</p>
                                <button ref={el => { if (el) removeConfirmTriggerRef.current = el; }} onClick={(e) => { e.stopPropagation(); setRemoveConfirm({ type: 'alitas', idx, name: p.name, qty: order.quantity }); }} className="text-[11px] font-semibold text-black/40 hover:text-red-500 leading-none">Quitar</button>
                              </div>
                            </div>
                            {order.salsas.length > 0 && <p className="text-xs text-black/45 mt-0.5 leading-snug">{order.salsas.map(id => SALSAS.find(s => s.id === id)?.name ?? id).join(" · ")}</p>}
                            {paidExtras.length > 0 && (
                              <div className="mt-0.5">
                                <p className="text-xs text-black/40">Base: S/ {(basePrice * order.quantity).toFixed(2)}</p>
                                {paidExtras.map((c, ci) => <p key={ci} className="text-xs text-black/45">+ {c?.name} <span className="text-[#F58424]">S/ {(c?.price ?? 0).toFixed(2)}</span></p>)}
                              </div>
                            )}
                            {freeExtras.length > 0 && <p className="text-xs text-black/35 mt-0.5">{freeExtras.map((c: any) => c?.name).join(" · ")}</p>}
                          </div>
                        </div>
                      );
                    })}

                    {/* Ensaladas */}
                    {fitOrders.map((order, idx) => {
                      const p = FIT_PRODUCTS.find(x => x.id === order.productId)!;
                      const basePrice = order.finalPrice ?? order.originalPrice ?? p.price;
                      const paidExtras = order.complementIds.filter(c => (COMPLEMENTS[c]?.price ?? 0) > 0).map(c => COMPLEMENTS[c]);
                      const freeExtras = order.complementIds.filter(c => (COMPLEMENTS[c]?.price ?? 0) === 0).map(c => COMPLEMENTS[c]).filter(Boolean);
                      const lineTotal = basePrice * order.quantity + paidExtras.reduce((s, c) => s + (c?.price ?? 0), 0);
                      return (
                        <div key={`f-${idx}`} className="flex items-start gap-2.5 py-2.5 border-b border-black/6 last:border-0">
                          {badge(rFit + idx + 1)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-sm font-bold text-black leading-tight">{order.quantity > 1 ? `${order.quantity}× ` : ""}{p.name}</p>
                              <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-2">
                                <p className="text-sm font-black text-[#F58424]">S/ {lineTotal.toFixed(2)}</p>
                                <button ref={el => { if (el) removeConfirmTriggerRef.current = el; }} onClick={(e) => { e.stopPropagation(); setRemoveConfirm({ type: 'fit', idx, name: p.name, qty: order.quantity }); }} className="text-[11px] font-semibold text-black/40 hover:text-red-500 leading-none">Quitar</button>
                              </div>
                            </div>
                            {paidExtras.length > 0 && (
                              <div className="mt-0.5">
                                <p className="text-xs text-black/40">Base: S/ {(basePrice * order.quantity).toFixed(2)}</p>
                                {paidExtras.map((c, ci) => <p key={ci} className="text-xs text-black/45">+ {c?.name} <span className="text-[#F58424]">S/ {(c?.price ?? 0).toFixed(2)}</span></p>)}
                              </div>
                            )}
                            {freeExtras.length > 0 && <p className="text-xs text-black/35 mt-0.5">{freeExtras.map((c: any) => c?.name).join(" · ")}</p>}
                          </div>
                        </div>
                      );
                    })}

                    {/* Tacos */}
                    {tacoOrders.map((order, idx) => {
                      const tacoFlavGrps: { name: string; qty: number }[] = [];
                      for (const tid of order.salsas) {
                        const n = TACO_FLAVORS.find(f => f.id === tid)?.name ?? tid;
                        const eg = tacoFlavGrps.find(g => g.name === n);
                        if (eg) eg.qty++; else tacoFlavGrps.push({ name: n, qty: 1 });
                      }
                      const tacoComp = TACO_COMPLEMENTS.find(tc => order.complementIds.includes(tc.id));
                      const paidExtras = order.complementIds.filter(c => (COMPLEMENTS[c]?.price ?? 0) > 0).map(c => COMPLEMENTS[c]);
                      const lineTotal = (order.finalPrice ?? 24.90) + paidExtras.reduce((s, c) => s + (c?.price ?? 0), 0);
                      return (
                        <div key={`t-${idx}`} className="flex items-start gap-2.5 py-2.5 border-b border-black/6 last:border-0">
                          {badge(rTaco + idx + 1)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-sm font-bold text-black leading-tight">🌮 Dúo de Tacos</p>
                              <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-2">
                                <p className="text-sm font-black text-[#F58424]">S/ {lineTotal.toFixed(2)}</p>
                                <button ref={el => { if (el) removeConfirmTriggerRef.current = el; }} onClick={(e) => { e.stopPropagation(); setRemoveConfirm({ type: 'taco', idx, name: 'Dúo de Tacos', qty: 1 }); }} className="text-[11px] font-semibold text-black/40 hover:text-red-500 leading-none">Quitar</button>
                              </div>
                            </div>
                            <p className="text-xs text-black/45 mt-0.5">{tacoFlavGrps.map(g => g.qty > 1 ? `${g.qty} × ${g.name}` : g.name).join(" · ")}</p>
                            {tacoComp && <p className="text-xs text-black/40 mt-0.5">Complemento: {tacoComp.name}</p>}
                            {paidExtras.map((c, ci) => <p key={ci} className="text-xs text-black/45">+ {c?.name} <span className="text-[#F58424]">S/ {(c?.price ?? 0).toFixed(2)}</span></p>)}
                          </div>
                        </div>
                      );
                    })}

                    {/* Burgers */}
                    {trioOrders.map((trio, idx) => {
                      const DRINK_IDS_SET = new Set(["coca-cola","inka-cola","sprite","fanta","agua-mineral"]);
                      const bebidaIds = trio.complementIds.filter(c => DRINK_IDS_SET.has(c));
                      const bebidas = bebidaIds.map(c => COMPLEMENTS[c]);
                      const salsaLibre = trio.complementIds.find(c => c.startsWith("burger-salsa-"));
                      const salsaLibreNombre = salsaLibre ? COMPLEMENTS[salsaLibre]?.name : null;
                      const paidExtras = trio.complementIds.filter(c => (COMPLEMENTS[c]?.price ?? 0) > 0).map(c => COMPLEMENTS[c]);
                      const lineTotal = trio.trioPrice + paidExtras.reduce((s, c) => s + (c?.price ?? 0), 0);
                      // Exclude drinks from + extras display: drinks already shown in bebidas line with price
                      const paidNonDrinks = trio.complementIds
                        .filter(c => !DRINK_IDS_SET.has(c) && (COMPLEMENTS[c]?.price ?? 0) > 0)
                        .map(c => COMPLEMENTS[c]);
                      return (
                        <div key={`b-${trio.trioGroupId}`} className="flex items-start gap-2.5 py-2.5 border-b border-black/6 last:border-0">
                          {badge(rTrio + idx + 1)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-sm font-bold text-black leading-tight">🍔 {trio.trioName}</p>
                              <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-2">
                                <p className="text-sm font-black text-[#F58424]">S/ {lineTotal.toFixed(2)}</p>
                                <button ref={el => { if (el) removeConfirmTriggerRef.current = el; }} onClick={(e) => { e.stopPropagation(); setRemoveConfirm({ type: 'trio', idx, name: trio.trioName, qty: 1 }); }} className="text-[11px] font-semibold text-black/40 hover:text-red-500 leading-none">Quitar</button>
                              </div>
                            </div>
                            <p className="text-xs text-black/45 mt-0.5">{trio.trioFlavors.map(f => `${f.qty > 1 ? f.qty + "× " : ""}${f.name}`).join(" · ")}</p>
                            {salsaLibreNombre && <p className="text-xs text-black/35 mt-0.5">Salsa: {salsaLibreNombre}</p>}
                            {bebidas.map((c, bi) => (
                              <p key={bi} className="text-xs text-black/45 mt-0.5">
                                🥤 {c?.name} <span className="text-[#F58424]">S/ {(c?.price ?? 0).toFixed(2)}</span>
                              </p>
                            ))}
                            {paidNonDrinks.map((c, ci) => <p key={ci} className="text-xs text-black/45">+ {c?.name} <span className="text-[#F58424]">S/ {(c?.price ?? 0).toFixed(2)}</span></p>)}
                          </div>
                        </div>
                      );
                    })}

                    {/* Bebidas standalone */}
                    {BEBIDAS.filter(b => (bebidaQty[b.id] || 0) > 0).map((b, idx) => (
                      <div key={`bev-${b.id}`} className="flex items-center gap-2.5 py-2.5 border-b border-black/6 last:border-0">
                        {badge(rBev + idx + 1)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-sm font-bold text-black">{bebidaQty[b.id] > 1 ? `${bebidaQty[b.id]}× ` : ""}🥤 {b.name}</p>
                            <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-2">
                              <p className="text-sm font-black text-[#F58424]">S/ {((bebidaQty[b.id] || 0) * b.price).toFixed(2)}</p>
                              <button ref={el => { if (el) removeConfirmTriggerRef.current = el; }} onClick={(e) => { e.stopPropagation(); setRemoveConfirm({ type: 'bebida', idx: 0, id: b.id, name: b.name, qty: bebidaQty[b.id] || 0 }); }} className="text-[11px] font-semibold text-black/40 hover:text-red-500 leading-none">Quitar</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Combos */}
                    {(() => {
                      const seen = new Set<string>();
                      const groups: any[] = [];
                      comboItems.forEach((o: any) => { if (!o.comboGroupId || seen.has(o.comboGroupId)) return; seen.add(o.comboGroupId); groups.push({ meta: o, items: comboItems.filter((x: any) => x.comboGroupId === o.comboGroupId) }); });
                      return groups.map(({ meta, items }, idx) => (
                        <div key={`c-${meta.comboGroupId}`} className="flex items-start gap-2.5 py-2.5 border-b border-black/6 last:border-0">
                          {badge(rCombo + idx + 1)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-[#F58424]/70 font-bold uppercase tracking-wide">🔥 Combo</p>
                                <p className="text-sm font-bold text-black leading-tight">{meta.comboName}</p>
                              </div>
                              <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-2">
                                <p className="text-sm font-black text-[#F58424]">S/ {meta.comboPrice?.toFixed(2)}</p>
                                <button ref={el => { if (el) removeConfirmTriggerRef.current = el; }} onClick={(e) => { e.stopPropagation(); setRemoveConfirm({ type: 'combo', idx: 0, id: meta.comboGroupId, name: meta.comboName, qty: 1 }); }} className="text-[11px] font-semibold text-black/40 hover:text-red-500 leading-none">Quitar</button>
                              </div>
                            </div>
                            <div className="mt-0.5 space-y-0.5">
                              {items.map((item: any, j: number) => {
                                if (item.productId === "taco-duo") {
                                  const tGroups: { name: string; qty: number }[] = [];
                                  for (const tid of (item.salsas ?? [])) {
                                    const fname = TACO_FLAVORS.find(f => f.id === tid)?.name ?? tid;
                                    const eg = tGroups.find(g => g.name === fname);
                                    if (eg) eg.qty++; else tGroups.push({ name: fname, qty: 1 });
                                  }
                                  const tcId = (item.complementIds ?? []).find((c: string) => TACO_COMPLEMENTS.some(tc => tc.id === c));
                                  const tcName = TACO_COMPLEMENTS.find(tc => tc.id === tcId)?.name;
                                  return (
                                    <div key={j}>
                                      <p className="text-xs text-black/45">🌮 {tGroups.map(g => g.qty > 1 ? `${g.qty} × ${g.name}` : g.name).join(" · ")}</p>
                                      {tcName && <p className="text-xs text-black/40">Complemento: {tcName}</p>}
                                    </div>
                                  );
                                }
                                const fitProd = FIT_PRODUCTS.find(p => p.id === item.productId);
                                if (fitProd) return <p key={j} className="text-xs text-black/45">🥗 {fitProd.name}</p>;
                                const alitasProd = ALITAS_PRODUCTS.find(p => p.id === item.productId);
                                const alitasDisplayName = alitasProd?.name ?? (item.productId === "chiguan-alitas" ? "4 alitas" : item.productId);
                                const salsaIds = item.salsas as string[] ?? [];
                                const salsaDisplay = salsaIds.map((id: string) => SALSAS.find(x => x.id === id)?.name ?? id).join(" · ");
                                const salsaLabel = salsaIds.length > 1 ? "Salsas" : "Salsa";
                                return <p key={j} className="text-xs text-black/45">🍗 {alitasDisplayName}{salsaDisplay ? ` · ${salsaLabel}: ${salsaDisplay}` : ""}</p>;
                              })}
                            </div>
                          </div>
                        </div>
                      ));
                    })()}

                    {/* Total + Continuar at bottom of cart */}
                    <div className="flex items-center justify-between pt-3 mt-1 border-t border-black/8">
                      <span className="text-sm font-bold text-black/50">Total</span>
                      <span className="text-xl font-black text-black">S/ {grandTotal.toFixed(2)}</span>
                    </div>
                    <button onClick={goToDelivery}
                      className="w-full py-3.5 rounded-xl text-white font-black text-base transition-all active:scale-[.98] mb-1 mt-2"
                      style={{ background: '#F58424', boxShadow: '0 4px 16px rgba(245,132,36,.4)' }}>
                      Continuar →
                    </button>

                  </div>}

                  {/* ══ DELIVERY ══════════════════════════════════════════════ */}
                  {checkoutStep === 'delivery' && (
                  <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
                    <p className="text-xs font-bold text-black/40 uppercase tracking-wide">Paso 1 — Datos de entrega</p>

                    <div>
                      <label className="block text-xs font-bold text-black/60 mb-1">Teléfono *</label>
                      <div className="relative">
                        <input type="tel" inputMode="numeric" maxLength={9} value={ckForm.phone}
                          onChange={e => ckHandlePhone(e.target.value)} placeholder="987 654 321"
                          className="w-full px-4 py-3 rounded-xl border-2 text-black font-semibold text-base outline-none"
                          style={{ borderColor: ckForm.phone.length === 9 ? '#F58424' : 'rgba(0,0,0,.12)', background: '#fff' }} />
                        {ckCustomerStatus === 'searching' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black/40">Buscando…</span>}
                        {ckCustomerStatus === 'found' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#F58424' }}>✓ Cliente conocido</span>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black/60 mb-1">Nombre *</label>
                      <input type="text" value={ckForm.name}
                        onChange={e => setCkForm(prev => ({ ...prev, name: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase() }))}
                        placeholder="TU NOMBRE"
                        className="w-full px-4 py-3 rounded-xl border-2 text-black font-semibold text-base outline-none"
                        style={{ borderColor: ckForm.name.trim() ? '#F58424' : 'rgba(0,0,0,.12)', background: '#fff' }} />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black/60 mb-1">Dirección *</label>
                      <input type="text" value={ckForm.address}
                        onChange={e => setCkForm(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Av. Principal 123, Ref: frente al parque"
                        className="w-full px-4 py-3 rounded-xl border-2 text-black font-semibold text-base outline-none"
                        style={{ borderColor: ckForm.address.trim() ? '#F58424' : 'rgba(0,0,0,.12)', background: '#fff' }} />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black/60 mb-1">¿A qué zona corresponde tu dirección? *</label>
                      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Zona de entrega">
                        {([
                          { value: 'centro' as const, label: 'Chancay centro', sub: '', delivery: 'Delivery gratis', deliveryClass: 'text-green-600' },
                          { value: 'alrededores' as const, label: 'Chancay alrededores', sub: 'Puerto, Peralvillo, La Balanza y otros', delivery: 'Delivery S/ 5.00', deliveryClass: 'text-sky-600' },
                        ]).map(opt => {
                          const selected = ckDeliveryZone === opt.value;
                          return (
                            <button key={opt.value}
                              role="radio"
                              aria-checked={selected}
                              onClick={() => setCkDeliveryZone(opt.value)}
                              className="p-3 rounded-xl border-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F58424] focus-visible:ring-offset-1"
                              style={{ borderColor: selected ? '#F58424' : 'rgba(0,0,0,.12)', background: selected ? 'rgba(245,132,36,.07)' : '#fff' }}>
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors"
                                  style={{ borderColor: selected ? '#F58424' : 'rgba(0,0,0,.3)' }}>
                                  {selected && <span className="w-2 h-2 rounded-full" style={{ background: '#F58424' }} />}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-black leading-tight">{opt.label}</p>
                                  {opt.sub && <p className="text-[10px] text-black/40 mt-0.5 leading-snug">{opt.sub}</p>}
                                  <p className={`text-xs font-bold mt-1 ${opt.deliveryClass}`}>{opt.delivery}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {!ckDeliveryZone && <p className="text-xs text-black/40 mt-1.5">Selecciona tu zona de entrega para continuar</p>}
                    </div>

                    <button disabled={!ckDeliveryValid}
                      onClick={() => { setCkCompletedOrders(buildCompletedOrders()); setCheckoutStep('review'); }}
                      className="w-full py-3.5 rounded-xl text-white font-black text-base transition-all active:scale-[.98] mb-2 disabled:opacity-40"
                      style={{ background: '#F58424', boxShadow: ckDeliveryValid ? '0 4px 16px rgba(245,132,36,.4)' : 'none' }}>
                      Continuar →
                    </button>
                  </div>
                  )}

                  {/* ══ REVIEW ════════════════════════════════════════════════ */}
                  {checkoutStep === 'review' && (
                  <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
                    <p className="text-xs font-bold text-black/40 uppercase tracking-wide">Paso 2 — Revisión del pedido</p>

                    <div className="rounded-xl border border-black/10 p-3 space-y-1" style={{ background: 'rgba(0,0,0,.02)' }}>
                      <p className="text-xs font-bold text-black/40 uppercase tracking-wide mb-1">Entrega</p>
                      <p className="text-sm font-black text-black">{ckForm.name}</p>
                      <p className="text-xs text-black/55">📱 {ckForm.phone}</p>
                      <p className="text-xs text-black/55">📍 {ckForm.address}</p>
                      <p className="text-xs text-black/55">🛵 {ckDeliveryZone === 'centro' ? 'Chancay centro — Gratis' : 'Chancay alrededores — S/ 5.00'}</p>
                    </div>

                    <div className="space-y-2">
                      {ckCompletedOrders.map((order: any, i: number) => {
                        if (order.comboGroupId) return null;
                        const ap = ALITAS_PRODUCTS.find(p => p.id === order.productId);
                        const fp = FIT_PRODUCTS.find(p => p.id === order.productId);
                        const bp = BEBIDAS.find(b => b.id === order.productId);
                        const isTaco = order.productId === 'taco-duo';
                        const isBurgerDuo = order.productId === 'burger-duo';
                        const isBurgerTrio = order.productId === 'burger-trio';
                        const name = ap?.name ?? fp?.name ?? bp?.name
                          ?? (isTaco ? 'Dúo de Tacos' : isBurgerDuo ? 'Dúo Mini Burgers' : isBurgerTrio ? 'Trío Mini Burgers' : order.productId);
                        const qty = order.quantity ?? 1;
                        const basePrice = order.finalPrice ?? order.originalPrice ?? 0;
                        const paidExtras = (order.complementIds ?? [])
                          .filter((c: string) => (COMPLEMENTS[c]?.price ?? 0) > 0)
                          .map((c: string) => COMPLEMENTS[c]);
                        const freeExtras = (order.complementIds ?? [])
                          .filter((c: string) => (COMPLEMENTS[c]?.price ?? 0) === 0)
                          .map((c: string) => COMPLEMENTS[c])
                          .filter(Boolean);
                        const extrasTotal = paidExtras.reduce((s: number, c: any) => s + (c?.price ?? 0), 0);
                        const lineTotal = basePrice * qty + extrasTotal;
                        return (
                          <div key={i} className="border-b border-black/6 pb-1.5 last:border-0">
                            <div className="flex items-start justify-between gap-2 text-sm">
                              <span className="text-black font-semibold">{qty > 1 ? `${qty}× ` : ''}{name}</span>
                              <span className="font-black flex-shrink-0" style={{ color: '#F58424' }}>S/ {lineTotal.toFixed(2)}</span>
                            </div>
                            {order.salsas?.length > 0 && (() => {
                              if (isTaco) {
                                const flavGrps: { name: string; qty: number }[] = [];
                                for (const tid of order.salsas) {
                                  const n = TACO_FLAVORS.find((f: any) => f.id === tid)?.name ?? tid;
                                  const eg = flavGrps.find(g => g.name === n);
                                  if (eg) eg.qty++; else flavGrps.push({ name: n, qty: 1 });
                                }
                                const cId = (order.complementIds ?? []).find((c: string) => TACO_COMPLEMENTS.some((tc: any) => tc.id === c));
                                const cName = TACO_COMPLEMENTS.find((tc: any) => tc.id === cId)?.name;
                                return (
                                  <>
                                    <p className="text-xs text-black/45 mt-0.5">{flavGrps.map(g => g.qty > 1 ? `${g.qty} × ${g.name}` : g.name).join(' · ')}</p>
                                    {cName && <p className="text-xs text-black/40 mt-0.5">Complemento: {cName}</p>}
                                  </>
                                );
                              }
                              if (isBurgerDuo || isBurgerTrio) {
                                const burgSalsaId = (order.complementIds ?? []).find((c: string) => c.startsWith('burger-salsa-'));
                                const burgSalsaName = burgSalsaId ? COMPLEMENTS[burgSalsaId]?.name : null;
                                return (
                                  <>
                                    <p className="text-xs text-black/45 mt-0.5">{order.salsas.join(' · ')}</p>
                                    {burgSalsaName && <p className="text-xs text-black/40 mt-0.5">Salsa: {burgSalsaName}</p>}
                                  </>
                                );
                              }
                              return <p className="text-xs text-black/45 mt-0.5">{order.salsas.map((id: string) => SALSAS.find(s => s.id === id)?.name ?? id).join(' · ')}</p>;
                            })()}
                            {extrasTotal > 0 && (
                              <p className="text-xs text-black/40">Base: S/ {(basePrice * qty).toFixed(2)}</p>
                            )}
                            {paidExtras.map((c: any, ci: number) => (
                              <p key={ci} className="text-xs text-black/45">+ {c?.name} <span style={{ color: '#F58424' }}>S/ {(c?.price ?? 0).toFixed(2)}</span></p>
                            ))}
                            {freeExtras.length > 0 && (
                              <p className="text-xs text-black/35">{freeExtras.map((c: any) => c?.name).join(' · ')}</p>
                            )}
                          </div>
                        );
                      })}
                      {(() => {
                        const seen = new Set<string>();
                        const cGroups: { meta: any; items: any[] }[] = [];
                        for (const o of ckCompletedOrders) {
                          if (!o.comboGroupId || seen.has(o.comboGroupId)) continue;
                          seen.add(o.comboGroupId);
                          cGroups.push({ meta: o, items: ckCompletedOrders.filter((x: any) => x.comboGroupId === o.comboGroupId && !x.comboExtraItem) });
                        }
                        return cGroups.map(({ meta, items }, i) => (
                          <div key={`rc-${i}`} className="border-b border-black/6 pb-1.5 last:border-0">
                            <div className="flex items-start justify-between gap-2 text-sm">
                              <span className="text-black font-semibold">🔥 {meta.comboName}</span>
                              <span className="font-black flex-shrink-0" style={{ color: '#F58424' }}>S/ {meta.comboPrice?.toFixed(2)}</span>
                            </div>
                            <div className="mt-0.5 space-y-0.5">
                              {items.map((item: any, j: number) => {
                                if (item.productId === "taco-duo") {
                                  const tGrps: { name: string; qty: number }[] = [];
                                  for (const tid of (item.salsas ?? [])) {
                                    const n = TACO_FLAVORS.find((f: any) => f.id === tid)?.name ?? tid;
                                    const eg = tGrps.find(g => g.name === n);
                                    if (eg) eg.qty++; else tGrps.push({ name: n, qty: 1 });
                                  }
                                  const cId = (item.complementIds ?? []).find((c: string) => TACO_COMPLEMENTS.some((tc: any) => tc.id === c));
                                  const cName = TACO_COMPLEMENTS.find((tc: any) => tc.id === cId)?.name;
                                  return (
                                    <div key={j}>
                                      <p className="text-xs text-black/45">🌮 {tGrps.map(g => g.qty > 1 ? `${g.qty} × ${g.name}` : g.name).join(' · ')}</p>
                                      {cName && <p className="text-xs text-black/40">Complemento: {cName}</p>}
                                    </div>
                                  );
                                }
                                const fitProd = FIT_PRODUCTS.find((p: any) => p.id === item.productId);
                                if (fitProd) return <p key={j} className="text-xs text-black/45">🥗 {fitProd.name}</p>;
                                const alitasProd = ALITAS_PRODUCTS.find((p: any) => p.id === item.productId);
                                const sIds = (item.salsas ?? []) as string[];
                                const sSummary = sIds.map((id: string) => SALSAS.find(x => x.id === id)?.name ?? id).join(' · ');
                                const sLabel = sIds.length > 1 ? 'Salsas' : 'Salsa';
                                return <p key={j} className="text-xs text-black/45">🍗 {alitasProd?.name ?? item.productId}{sSummary ? ` · ${sLabel}: ${sSummary}` : ''}</p>;
                              })}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>

                    <div className="border-t border-black/8 pt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-black/50">Subtotal</span>
                        <span className="font-bold text-black">S/ {grandTotal.toFixed(2)}</span>
                      </div>
                      {ckDeliveryCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-black/50">Delivery</span>
                          <span className="font-bold text-black">S/ {ckDeliveryCost.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="font-black text-black">Total</span>
                        <span className="font-black text-xl" style={{ color: '#F58424' }}>S/ {ckRealTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-2">
                      <button onClick={() => setCheckoutStep('delivery')}
                        className="flex-shrink-0 px-4 py-3.5 rounded-xl border-2 text-black font-black text-sm"
                        style={{ borderColor: 'rgba(0,0,0,.12)' }}>
                        ← Atrás
                      </button>
                      <button onClick={() => setCheckoutStep('payment')}
                        className="flex-1 py-3.5 rounded-xl text-white font-black text-base transition-all active:scale-[.98]"
                        style={{ background: '#F58424', boxShadow: '0 4px 16px rgba(245,132,36,.4)' }}>
                        Ir a pagar →
                      </button>
                    </div>
                  </div>
                  )}

                  {/* ══ PAYMENT ═══════════════════════════════════════════════ */}
                  {checkoutStep === 'payment' && !ckOrderPlaced && !ckIsSubmitting && (
                  <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
                    <p className="text-xs font-bold text-black/40 uppercase tracking-wide">Paso 3 — Método de pago</p>
                    <p className="text-sm font-black text-black">Total: <span style={{ color: '#F58424' }}>S/ {ckRealTotal.toFixed(2)}</span></p>

                    <button onClick={() => setCheckoutStep('yape')}
                      className="w-full p-4 rounded-xl border-2 text-left transition-all active:scale-[.98]"
                      style={{ borderColor: 'rgba(0,0,0,.12)', background: '#fff' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(245,132,36,.1)' }}>📱</div>
                        <div>
                          <p className="font-black text-black">Yape / Plin</p>
                          <p className="text-xs text-black/50">Pago digital — sube tu voucher</p>
                        </div>
                      </div>
                    </button>

                    <button onClick={() => setCheckoutStep('efectivo')}
                      className="w-full p-4 rounded-xl border-2 text-left transition-all active:scale-[.98]"
                      style={{ borderColor: 'rgba(0,0,0,.12)', background: '#fff' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(245,132,36,.1)' }}>💵</div>
                        <div>
                          <p className="font-black text-black">Contra Entrega</p>
                          <p className="text-xs text-black/50">Paga en efectivo al recibir</p>
                        </div>
                      </div>
                    </button>

                    <button onClick={() => setShowMpCardModal(true)}
                      className="w-full p-4 rounded-xl border-2 text-left transition-all active:scale-[.98]"
                      style={{ borderColor: 'rgba(0,0,0,.12)', background: '#fff' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(59,130,246,.1)' }}>💳</div>
                        <div>
                          <p className="font-black text-black">Pagar con tarjeta</p>
                          <p className="text-xs text-black/50">Visa, Mastercard · Mercado Pago</p>
                        </div>
                      </div>
                    </button>

                    <button onClick={() => setCheckoutStep('review')}
                      className="w-full px-4 py-3 rounded-xl border-2 text-black font-black text-sm mb-2"
                      style={{ borderColor: 'rgba(0,0,0,.12)' }}>
                      ← Atrás
                    </button>
                  </div>
                  )}

                  {/* ══ YAPE ══════════════════════════════════════════════════ */}
                  {checkoutStep === 'yape' && !ckOrderPlaced && !ckIsSubmitting && (
                  <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
                    <p className="text-xs font-bold text-black/40 uppercase tracking-wide">Yape / Plin</p>
                    <p className="text-sm text-black/70">Yapea o Plínea <span className="font-black text-black">S/ {ckRealTotal.toFixed(2)}</span> al número:</p>

                    <div className="rounded-xl border-2 p-4 text-center" style={{ borderColor: 'rgba(245,132,36,.3)', background: 'rgba(245,132,36,.04)' }}>
                      <p className="text-3xl font-black text-black tracking-wider">910 677 186</p>
                      <p className="text-xs text-black/40 mt-1">Santo Dilema</p>
                      <button onClick={() => { navigator.clipboard.writeText('910677186'); setCkCopied(true); setTimeout(() => setCkCopied(false), 2000); }}
                        className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors"
                        style={{ borderColor: '#F58424', color: '#F58424' }}>
                        {ckCopied ? '✓ Copiado' : 'Copiar número'}
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black/60 mb-1">Sube tu voucher *</label>
                      <input ref={ckFileInputRef} type="file" accept="image/*" className="hidden"
                        onChange={e => setCkPaymentProof(e.target.files?.[0] ?? null)} />
                      <button onClick={() => ckFileInputRef.current?.click()}
                        className="w-full py-3 rounded-xl border-2 font-bold text-sm transition-all"
                        style={{ borderColor: ckPaymentProof ? '#F58424' : 'rgba(0,0,0,.12)', color: ckPaymentProof ? '#F58424' : '#000', background: '#fff' }}>
                        {ckPaymentProof ? `✓ ${ckPaymentProof.name.slice(0, 30)}` : '📎 Adjuntar captura de pago'}
                      </button>
                    </div>

                    <button disabled={!ckPaymentProof || ckIsSubmitting}
                      onClick={() => ckSubmitOrder('yape')}
                      className="w-full py-3.5 rounded-xl text-white font-black text-base transition-all active:scale-[.98] mb-1 disabled:opacity-40"
                      style={{ background: '#F58424', boxShadow: ckPaymentProof && !ckIsSubmitting ? '0 4px 16px rgba(245,132,36,.4)' : 'none' }}>
                      {ckIsSubmitting ? 'Enviando pedido…' : 'Confirmar pedido →'}
                    </button>
                    <button onClick={() => setCheckoutStep('payment')}
                      className="w-full px-4 py-2.5 rounded-xl border-2 text-black font-bold text-sm mb-2"
                      style={{ borderColor: 'rgba(0,0,0,.12)' }}>
                      ← Atrás
                    </button>
                  </div>
                  )}

                  {/* ══ EFECTIVO ══════════════════════════════════════════════ */}
                  {checkoutStep === 'efectivo' && !ckOrderPlaced && !ckIsSubmitting && (
                  <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
                    <p className="text-xs font-bold text-black/40 uppercase tracking-wide">Contra Entrega</p>
                    <p className="text-sm text-black/70">Total a pagar: <span className="font-black text-black">S/ {ckRealTotal.toFixed(2)}</span></p>

                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { value: 'exacto' as const, label: 'Pago exacto', sub: 'No necesito cambio', emoji: '✅' },
                        { value: 'cambio' as const, label: 'Necesito cambio', sub: 'Dime con cuánto pagas', emoji: '💸' },
                      ]).map(opt => (
                        <button key={opt.value} onClick={() => setCkSelectedEfectivo(opt.value)}
                          className="p-3 rounded-xl border-2 text-left transition-all"
                          style={{ borderColor: ckSelectedEfectivo === opt.value ? '#F58424' : 'rgba(0,0,0,.12)', background: ckSelectedEfectivo === opt.value ? 'rgba(245,132,36,.07)' : '#fff' }}>
                          <p className="text-lg mb-1">{opt.emoji}</p>
                          <p className="text-sm font-black text-black leading-tight">{opt.label}</p>
                          <p className="text-[10px] text-black/40 mt-0.5">{opt.sub}</p>
                        </button>
                      ))}
                    </div>

                    {ckSelectedEfectivo === 'cambio' && (
                      <input type="number" inputMode="numeric" value={ckCantoCancelo}
                        onChange={e => setCkCantoCancelo(e.target.value)}
                        placeholder={`Ej: ${Math.ceil(ckRealTotal / 10) * 10}`}
                        className="w-full px-4 py-3 rounded-xl border-2 text-black font-semibold text-base outline-none"
                        style={{ borderColor: ckCantoCancelo ? '#F58424' : 'rgba(0,0,0,.12)', background: '#fff' }} />
                    )}

                    <button
                      disabled={!ckSelectedEfectivo || (ckSelectedEfectivo === 'cambio' && !ckCantoCancelo) || ckIsSubmitting}
                      onClick={() => ckSubmitOrder('contraentrega')}
                      className="w-full py-3.5 rounded-xl text-white font-black text-base transition-all active:scale-[.98] mb-1 disabled:opacity-40"
                      style={{ background: '#F58424', boxShadow: '0 4px 16px rgba(245,132,36,.4)' }}>
                      {ckIsSubmitting ? 'Enviando pedido…' : 'Confirmar pedido →'}
                    </button>
                    <button onClick={() => setCheckoutStep('payment')}
                      className="w-full px-4 py-2.5 rounded-xl border-2 text-black font-bold text-sm mb-2"
                      style={{ borderColor: 'rgba(0,0,0,.12)' }}>
                      ← Atrás
                    </button>
                  </div>
                  )}

                  {/* ══ PROCESSING ════════════════════════════════════════════ */}
                  {ckIsSubmitting && !ckOrderPlaced && (
                  <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col items-center bg-white"
                    role="status" aria-live="polite" aria-label="Procesando tu pedido">
                    <div className="relative w-48 h-48 mx-auto mb-4">
                      <svg className="absolute inset-0 w-full h-full sd-spin" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r="92" fill="none" stroke="#F58424" strokeWidth="2.5"
                          strokeDasharray="578" strokeDashoffset="434" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image src="/logo-santo-dilema-cropped.png" alt="Santo Dilema" width={961} height={372}
                          className="w-36 h-auto" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-black/45">Procesando tu pedido…</p>
                  </div>
                  )}

                  {/* ══ SUCCESS ═══════════════════════════════════════════════ */}
                  {ckOrderPlaced && (
                  <div className="max-w-3xl mx-auto px-4 py-8 text-center bg-white"
                    style={{ opacity: ckAutoClosing ? 0 : 1, transition: 'opacity 0.4s ease' }}>
                    <div className="relative w-48 h-48 mx-auto mb-5">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r="92" fill="none" stroke="#F58424" strokeWidth="2.5"
                          strokeLinecap="round" className="sd-arc-complete" />
                        <path d="M62 100 L88 126 L140 70" fill="none" stroke="#F58424" strokeWidth="3.5"
                          strokeLinecap="round" strokeLinejoin="round" className="sd-check-path" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-black text-black mb-2">¡Pedido confirmado!</h2>
                    <p className="text-sm text-black/55">Tu pedido está siendo preparado.</p>
                    <p className="text-sm text-black/55 mb-5">Te contactaremos por WhatsApp cuando esté en camino.</p>
                    <button onClick={() => {
                      ckReset(); closeCart();
                      setAlitasOrders([]); setFitOrders([]); setTacoOrders([]); setTrioOrders([]); setBebidaQty({}); setComboItems([]);
                      sessionStorage.removeItem('santo-dilema-orders'); sessionStorage.removeItem('santo-dilema-cart');
                    }}
                      className="w-full py-3.5 rounded-xl text-white font-black text-base mb-2"
                      style={{ background: '#F58424', boxShadow: '0 4px 16px rgba(245,132,36,.4)' }}>
                      Volver al menú
                    </button>
                  </div>
                  )}

                </div>
              </div>
            </div>

            {/* ── Always-visible strip ───────────────────────────────────────────── */}
            <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
              <button type="button" onClick={toggleCart}
                aria-expanded={cartOpen} aria-controls="cart-bar-detail"
                className="flex-1 min-w-0 text-left">
                <p className="text-sm font-black text-black leading-tight">
                  {checkoutStep === 'delivery' ? 'Datos de entrega' : checkoutStep === 'review' ? 'Revisión del pedido' : (checkoutStep === 'payment' || checkoutStep === 'yape' || checkoutStep === 'efectivo') ? 'Método de pago' : ordersLabel}
                </p>
                <p className="text-xl font-black leading-tight" style={{ color: '#F58424' }}>
                  S/ {(checkoutStep !== 'cart' ? ckRealTotal : grandTotal).toFixed(2)}
                </p>
              </button>

              {checkoutStep === 'cart' && !ckOrderPlaced && (
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleCart(); }} aria-expanded={cartOpen}
                  className="flex-shrink-0 text-xs font-semibold px-3 rounded-lg border-2 transition-colors whitespace-nowrap min-h-[44px]"
                  style={{ color: '#F58424', borderColor: '#F58424', background: '#FFFFFF' }}>
                  {cartOpen ? 'Ocultar ▾' : 'Ver ▴'}
                </button>
              )}

              {checkoutStep === 'cart' && !ckOrderPlaced && !cartOpen && (
                <button type="button" onClick={goToDelivery}
                  className="flex-shrink-0 px-4 py-3 rounded-xl text-white font-black text-sm transition-all active:scale-95 min-h-[48px]"
                  style={{ background: '#F58424', boxShadow: '0 4px 14px rgba(245,132,36,.35)' }}>
                  Continuar →
                </button>
              )}

              {checkoutStep !== 'cart' && !ckOrderPlaced && (
                <button type="button" onClick={ckReset}
                  className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors whitespace-nowrap"
                  style={{ borderColor: 'rgba(0,0,0,.15)', color: '#000' }}>
                  × Cancelar
                </button>
              )}
            </div>

          </div>
        );
      })()}

      {/* ── MpCardModal (tarjeta) ─────────────────────────────────────────────── */}
      <MpCardModal
        isOpen={showMpCardModal}
        amount={ckRealTotalOuter}
        payerPhone={ckForm.phone}
        onClose={() => setShowMpCardModal(false)}
        onSuccess={() => { setShowMpCardModal(false); ckSubmitOrderRef.current?.('tarjeta-mp'); }}
        onPaymentError={(detail) => { setShowMpCardModal(false); alert(`Pago rechazado: ${detail}`); }}
      />

      {/* ════      {/* ════════════════════════════════════════════════════════════════════
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
        const extrasPrice = comps.reduce((s: number, cid: string) => s + (COMPLEMENTS[cid]?.price ?? 0), 0);

        return (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center"
            style={{ animation: alitasClosing ? "fadeOutOv .35s ease forwards" : "fadeInOv .25s ease" }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeAlitasModal} />
            <div className="relative bg-[#F6F1F1] w-full md:max-w-lg md:mx-auto md:rounded-2xl rounded-t-3xl flex flex-col shadow-sm"
              style={{ maxHeight: modalMaxH, marginBottom: modalMB, animation: alitasClosing ? "slideDown .35s ease forwards" : "slideUp .4s cubic-bezier(.22,1,.36,1)" }}>

              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0 md:hidden">
                <div className="w-10 h-1 bg-[rgba(26,18,6,0.2)] rounded-full" />
              </div>
              <button onClick={closeAlitasModal}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-[rgba(26,18,6,0.1)] hover:bg-[rgba(26,18,6,0.18)] text-[#1A1206] rounded-full flex items-center justify-center text-sm font-bold">✕</button>

              {/* Scroll area */}
              <div ref={alitasScrollRef} className="flex-1 overflow-y-auto">
                {/* Image */}
                <div className="relative h-56 bg-black overflow-hidden">
                  <Image src={mp.image} alt={mp.name} fill className="object-cover" sizes="100vw" />
                  {disc && <div className="absolute top-3 left-3 bg-amber-400 text-black text-xs font-black px-2 py-0.5 rounded-full">OFERTA</div>}
                </div>

                <div className="px-4 pt-4 pb-2">
                  <h3 className="text-xl font-black text-[#1A1206] mb-1">{mp.name}</h3>
                  <p className="text-[rgba(26,18,6,0.5)] text-sm mb-4">{mp.description}</p>

                  {/* Price + qty */}
                  <div className="flex items-center justify-between mb-5 pb-4 border-b border-[rgba(26,18,6,0.1)]">
                    <div>
                      {promo ? (
                        <><span className="text-sm text-[rgba(26,18,6,0.4)] line-through block">S/ {(eff * qty + extrasPrice).toFixed(2)}</span>
                          <span className="text-2xl font-black text-green-400">S/ {(promo.promoPrice * qty + extrasPrice).toFixed(2)}</span></>
                      ) : disc ? (
                        <><span className="text-sm text-[rgba(26,18,6,0.4)] line-through block">S/ {(baseP * qty + extrasPrice).toFixed(2)}</span>
                          <span className="text-2xl font-black" style={{ color: '#F58424' }}>S/ {(disc * qty + extrasPrice).toFixed(2)}</span></>
                      ) : (
                        <span className="text-2xl font-black" style={{ color: '#F58424' }}>S/ {(baseP * qty + extrasPrice).toFixed(2)}</span>
                      )}
                      {qty > 1
                        ? <p className="text-xs text-[rgba(26,18,6,0.4)] mt-0.5">{qty} × S/ {showPrice.toFixed(2)} c/u{extrasPrice > 0 ? ` + S/ ${extrasPrice.toFixed(2)} extras` : ''}</p>
                        : <p className="text-xs text-[rgba(26,18,6,0.4)] mt-0.5">precio unitario</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => { const q = alitasQty[alitasModal] || 1; if (q > 1) setAlitasQty(p => ({ ...p, [alitasModal]: q - 1 })); }}
                        disabled={qty <= 1}
                        className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[rgba(26,18,6,0.2)] bg-[rgba(26,18,6,0.07)] hover:bg-[rgba(26,18,6,0.12)] disabled:opacity-40 text-[#1A1206] font-bold text-xl transition-all">−</button>
                      <span className="text-[#1A1206] font-black text-xl w-8 text-center">{qty}</span>
                      <button onClick={() => setAlitasQty(p => ({ ...p, [alitasModal]: (p[alitasModal] || 1) + 1 }))}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F58424] hover:bg-[#e07820] text-white font-bold text-xl transition-all">+</button>
                    </div>
                  </div>

                  {/* Salsas */}
                  <div className="mb-4">
                    <button onClick={() => setAlitasShowSalsas(p => ({ ...p, [alitasModal]: !p[alitasModal] }))}
                      className={`w-full flex items-center justify-between rounded-xl p-3 border mb-1 transition-all ${canConf ? "bg-green-600/20 border-green-500/40" : "bg-amber-600/20 border-amber-500/40"}`}>
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{canConf ? "✅" : "🌶️"}</span>
                        <div className="text-left">
                          <p className={`text-sm font-bold ${canConf ? "text-green-600" : "text-[#1A1206]"}`}>
                            {canConf ? "Salsas listas" : required === 1 ? "Elige tu salsa" : `Elige ${required} salsas`}
                          </p>
                          <p className="text-xs text-[rgba(26,18,6,0.5)]">{chosen.length} / {required} elegidas</p>
                        </div>
                      </div>
                      <span className="text-sm text-[rgba(26,18,6,0.5)] inline-block transition-transform duration-200" style={{ transform: alitasShowSalsas[alitasModal] ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
                    </button>

                    <div className="sd-acc" style={{ gridTemplateRows: alitasShowSalsas[alitasModal] ? '1fr' : '0fr' }}>
                      <div className="sd-acc-body">
                        <div className={`space-y-1.5 mt-2 ${alitasShowSalsas[alitasModal] ? "sd-acc-content-open" : "sd-acc-content"}`} style={{ opacity: alitasShowSalsas[alitasModal] ? 1 : 0 }}>
                        {effectiveSalsas.map(salsa => {
                          const cnt = chosen.filter(s => s === salsa.id).length;
                          const canAdd = chosen.length < required || cnt > 0;
                          const canMore = cnt < required && canAdd && !salsa.soldOut;
                          const recent = alitasRecentSalsa === `${alitasModal}-${salsa.id}`;
                          return (
                            <div key={salsa.id}
                              className={`rounded-xl p-3 border transition-all ${salsa.soldOut ? "opacity-60 border-[rgba(26,18,6,0.1)] bg-[rgba(26,18,6,0.07)]" : cnt > 0 ? "border-amber-500/50 bg-amber-500/10" : "border-[rgba(26,18,6,0.1)] bg-[rgba(26,18,6,0.05)]"}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex-1 mr-3">
                                  <p className={`text-sm font-bold ${cnt > 0 ? "text-amber-600" : salsa.soldOut ? "text-[rgba(26,18,6,0.4)]" : "text-[#1A1206]"}`}>
                                    {salsa.name}
                                    {salsa.soldOut && <span className="ml-2 text-[10px] bg-[rgba(26,18,6,0.1)] text-[rgba(26,18,6,0.4)] px-1.5 py-0.5 rounded">AGOTADO</span>}
                                  </p>
                                  <p className="text-xs text-[rgba(26,18,6,0.5)] mt-0.5">{salsa.description}</p>
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
                      </div>
                    </div>
                  </div>

                  {/* Bebidas */}
                  <div className="mb-4">
                    <button ref={alitasBebidasBtnRef} onClick={() => { const next = !alitasShowBebidas[alitasModal]; setAlitasShowBebidas(p => ({ ...p, [alitasModal]: next })); scrollModalSection(alitasScrollRef.current, alitasBebidasBtnRef.current, next); }}
                      className="w-full flex items-center justify-between bg-[rgba(26,18,6,0.05)] border border-[rgba(26,18,6,0.1)] rounded-xl p-3 transition-all hover:bg-[rgba(26,18,6,0.1)] mb-1">
                      <div className="flex items-center gap-2"><span>🥤</span><span className="text-[#1A1206] text-sm font-bold">Bebidas</span></div>
                      <span className="text-[rgba(26,18,6,0.5)] text-sm inline-block transition-transform duration-200" style={{ transform: alitasShowBebidas[alitasModal] ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
                    </button>
                    <div className="sd-acc" style={{ gridTemplateRows: alitasShowBebidas[alitasModal] ? '1fr' : '0fr' }}>
                      <div className="sd-acc-body">
                        <div className={`space-y-1.5 mt-1 ${alitasShowBebidas[alitasModal] ? "sd-acc-content-open" : "sd-acc-content"}`} style={{ opacity: alitasShowBebidas[alitasModal] ? 1 : 0 }}>
                        {(["agua-mineral","coca-cola","inka-cola","sprite","fanta"] as const).map(bid => {
                          const c = COMPLEMENTS[bid];
                          const cnt = comps.filter(x => x === bid).length;
                          const recent = alitasRecentComp === `${alitasModal}-${bid}`;
                          return (
                            <div key={bid} className="flex items-center justify-between bg-[rgba(26,18,6,0.05)] rounded-xl p-3 border border-[rgba(26,18,6,0.08)]">
                              <div className="flex items-center gap-2">
                                <span>{bid === "agua-mineral" ? "💧" : "🥤"}</span>
                                <span className="text-[#1A1206] text-sm">{c.name}</span>
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
                      </div>
                    </div>
                  </div>

                  {/* Extras */}
                  <div className="mb-4">
                    <button ref={alitasExtrasBtnRef} onClick={() => { const next = !alitasShowExtras[alitasModal]; setAlitasShowExtras(p => ({ ...p, [alitasModal]: next })); scrollModalSection(alitasScrollRef.current, alitasExtrasBtnRef.current, next); }}
                      className="w-full flex items-center justify-between bg-[rgba(26,18,6,0.05)] border border-[rgba(26,18,6,0.1)] rounded-xl p-3 transition-all hover:bg-[rgba(26,18,6,0.1)] mb-1">
                      <div className="flex items-center gap-2"><span>➕</span><span className="text-[#1A1206] text-sm font-bold">Extras</span></div>
                      <span className="text-[rgba(26,18,6,0.5)] text-sm inline-block transition-transform duration-200" style={{ transform: alitasShowExtras[alitasModal] ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
                    </button>
                    <div className="sd-acc" style={{ gridTemplateRows: alitasShowExtras[alitasModal] ? '1fr' : '0fr' }}>
                      <div className="sd-acc-body">
                        <div className={`space-y-1.5 mt-1 ${alitasShowExtras[alitasModal] ? "sd-acc-content-open" : "sd-acc-content"}`} style={{ opacity: alitasShowExtras[alitasModal] ? 1 : 0 }}>
                        {/* Extra papas */}
                        {(() => {
                          const bid = "extra-papas"; const c = COMPLEMENTS[bid];
                          const cnt = comps.filter(x => x === bid).length;
                          const recent = alitasRecentComp === `${alitasModal}-${bid}`;
                          return (
                            <div key={bid} className="flex items-center justify-between bg-[rgba(26,18,6,0.05)] rounded-xl p-3 border border-[rgba(26,18,6,0.08)]">
                              <div className="flex items-center gap-2"><span>🍟</span><span className="text-[#1A1206] text-sm">{c.name}</span></div>
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
                        {/* Extra salsa — todas las salsas disponibles */}
                        {effectiveSalsas.filter(s => !s.soldOut && s.id !== 'anticuchos').map(salsa => {
                          const bid = `extra-salsa-${salsa.id}`; const c = COMPLEMENTS[bid];
                          if (!c) return null;
                          const cnt = comps.filter(x => x === bid).length;
                          const recent = alitasRecentComp === `${alitasModal}-${bid}`;
                          return (
                            <div key={bid} className="flex items-center justify-between bg-[rgba(26,18,6,0.05)] rounded-xl p-3 border border-[rgba(26,18,6,0.08)]">
                              <div className="flex items-center gap-2"><span>🥫</span><span className="text-[#1A1206] text-sm">{c.name}</span></div>
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm button */}
              <div className="flex-shrink-0 px-4 pt-3 pb-6 bg-[#F6F1F1] border-t border-[rgba(26,18,6,0.1)]">
                <button
                  onClick={() => { if (canConf) completeAlitasOrder(alitasModal); }}
                  disabled={!canConf}
                  className={`w-full py-4 rounded-xl font-black text-base transition-all ${canConf ? "bg-[#F58424] hover:bg-[#e07820] text-white active:scale-[.98] focus-visible:ring-2 focus-visible:ring-[#F58424] focus-visible:ring-offset-2" : "bg-[rgba(26,18,6,0.08)] text-[rgba(26,18,6,0.3)] cursor-not-allowed"}`}>
                  {!canConf
                    ? `Selecciona ${required} salsa${required > 1 ? "s" : ""}`
                    : alitasEditIdx !== null
                    ? `Confirmar cambios — S/ ${(showPrice * qty + extrasPrice).toFixed(2)}`
                    : `Agregar orden — S/ ${(showPrice * qty + extrasPrice).toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════════
           COMBO MODAL — progressive single-phase configurator
      ════════════════════════════════════════════════════════════════════ */}
      {activeCombo && comboPhase === "selecting" && (() => {
        const comboBasePrice   = menuDiscounts[activeCombo.id] ?? menuPrices[activeCombo.id] ?? activeCombo.price;
        const comboExtrasTotal = comboExtras.reduce((s, id) => s + (COMPLEMENTS[id]?.price ?? 0), 0);
        const comboFinalPrice  = comboBasePrice + comboExtrasTotal;
        const comboBevIds      = ["coca-cola","inka-cola","sprite","fanta","agua-mineral"] as const;
        const comboXtraIds     = ["extra-papas","extra-nachos"] as const;
        const comboBevCount    = comboExtras.filter(id => (comboBevIds as readonly string[]).includes(id)).length;
        const comboXtrCount    = comboExtras.filter(id => (comboXtraIds as readonly string[]).includes(id)).length;
        const allDone          = areAllComboStepsValid();
        const pendingCount     = activeCombo.steps.filter((_, i) => !isComboStepDone(i)).length;
        return (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center"
            style={{ animation: comboClosing ? "fadeOutOv .32s ease forwards" : "fadeInOv .25s ease" }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeCombo} />
            <div className="relative bg-[#F6F1F1] w-full md:max-w-lg md:mx-auto md:rounded-2xl rounded-t-3xl flex flex-col shadow-sm"
              style={{ maxHeight: modalMaxH, marginBottom: modalMB, animation: comboClosing ? "slideDown .32s ease forwards" : "slideUp .4s cubic-bezier(.22,1,.36,1)" }}>

              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0 md:hidden">
                <div className="w-10 h-1 bg-[rgba(26,18,6,0.2)] rounded-full" />
              </div>
              <button onClick={closeCombo}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-[rgba(26,18,6,0.1)] hover:bg-[rgba(26,18,6,0.18)] text-[#1A1206] rounded-full flex items-center justify-center text-sm font-bold">✕</button>

              {/* Header */}
              <div className="px-5 pb-3 border-b border-[rgba(26,18,6,0.1)] shrink-0">
                <h3 className="font-black text-[#1A1206] text-lg leading-none pr-10">{activeCombo.emoji} {activeCombo.name}</h3>
                <p className="text-xs mt-1 text-[rgba(26,18,6,0.45)] font-medium">
                  S/ {comboBasePrice.toFixed(2)}
                  {activeCombo.maxSavings > 0 && <span className="ml-1.5 text-[#F58424] font-bold">· Ahorra S/ {activeCombo.maxSavings.toFixed(2)}</span>}
                </p>
              </div>

              {/* Scrollable body */}
              <div ref={comboScrollRef} className="flex-1 overflow-y-auto px-5 pb-4">

                {/* ── Step accordions ── */}
                <div className="mt-3 space-y-2">
                  {activeCombo.steps.map((step, si) => {
                    const isOpen  = comboExpandedStep === si;
                    const isDone  = isComboStepDone(si);
                    const summary = getComboStepSummary(si);
                    return (
                      <div key={si} className="bg-white rounded-2xl border border-[rgba(26,18,6,0.09)] overflow-hidden">
                        {/* Step header button */}
                        <button
                          onClick={() => {
                            const next = isOpen ? -1 : si;
                            setComboExpandedStep(next);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[rgba(26,18,6,0.03)] transition-colors">
                          {/* Circle indicator */}
                          <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black transition-colors ${isDone ? "bg-[#F58424] text-white" : isOpen ? "bg-[rgba(245,132,36,0.12)] text-[#F58424] border-2 border-[#F58424]" : "bg-[rgba(26,18,6,0.1)] text-[rgba(26,18,6,0.4)]"}`}>
                            {isDone ? "✓" : si + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold leading-tight ${isOpen || isDone ? "text-[#1A1206]" : "text-[rgba(26,18,6,0.5)]"}`}>{step.label}</p>
                            {isDone && !isOpen && (
                              <p className="text-xs text-[rgba(26,18,6,0.45)] truncate mt-0.5">{summary}</p>
                            )}
                            {!isDone && !isOpen && (
                              <p className="text-xs text-[rgba(26,18,6,0.35)] mt-0.5">
                                {step.type === "sauces" ? `Elige ${step.count} salsa${step.count > 1 ? "s" : ""}` : step.type === "salad" ? "Elige 1 bowl" : "Elige 2 tacos"}
                              </p>
                            )}
                          </div>
                          <span className="text-[rgba(26,18,6,0.35)] text-sm transition-transform duration-200 inline-block"
                            style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}>▼</span>
                        </button>

                        {/* Step content — sd-acc */}
                        <div className="sd-acc" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                          <div className="sd-acc-body">
                            <div className={`px-4 pb-4 ${isOpen ? "sd-acc-content-open" : "sd-acc-content"}`}
                              style={{ opacity: isOpen ? 1 : 0 }}>

                              {step.type === "sauces" && (() => {
                                const selected = comboSelections.sauces[step.productId] ?? [];
                                const total    = selected.length;
                                const visible  = SALSAS.filter(s => !step.excludeSauceIds?.includes(s.id));
                                return (
                                  <div className="space-y-1.5">
                                    <p className="text-xs text-[rgba(26,18,6,0.45)] mb-2 font-medium">
                                      {step.count === 1 ? "Elige 1 salsa" : `Elige ${step.count} salsas`} ·{" "}
                                      <span className={total === step.count ? "text-[#F58424] font-bold" : ""}>{total}/{step.count}</span>
                                    </p>
                                    {visible.map(salsa => {
                                      const qty    = selected.filter(s => s === salsa.id).length;
                                      const canAdd = total < step.count;
                                      if (step.count === 1) {
                                        // Simple toggle for single-selection steps
                                        return (
                                          <button key={salsa.id} onClick={() => comboToggleSauce(step.productId, salsa.id, step.count)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${qty > 0 ? "border-[#F58424] bg-[rgba(245,132,36,0.06)]" : "border-[rgba(26,18,6,0.1)] hover:border-[rgba(26,18,6,0.22)] bg-white"}`}>
                                            <span className="text-xl flex-shrink-0">🫙</span>
                                            <div className="flex-1 min-w-0">
                                              <p className={`text-sm font-bold leading-tight ${qty > 0 ? "text-[#F58424]" : "text-[#1A1206]"}`}>{salsa.name}</p>
                                              <p className="text-[11px] text-[rgba(26,18,6,0.4)] leading-snug mt-0.5">{salsa.description}</p>
                                            </div>
                                            {qty > 0 && <div className="w-5 h-5 rounded-full bg-[#F58424] flex items-center justify-center flex-shrink-0"><span className="text-white text-[10px] font-black">✓</span></div>}
                                          </button>
                                        );
                                      }
                                      // Stepper for multi-selection steps (duplicates allowed)
                                      return (
                                        <div key={salsa.id}
                                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${qty > 0 ? "border-[#F58424] bg-[rgba(245,132,36,0.06)]" : "border-[rgba(26,18,6,0.1)] bg-white"}`}>
                                          <span className="text-xl flex-shrink-0">🫙</span>
                                          <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold leading-tight ${qty > 0 ? "text-[#F58424]" : "text-[#1A1206]"}`}>{salsa.name}</p>
                                            <p className="text-[11px] text-[rgba(26,18,6,0.4)] leading-snug mt-0.5">{salsa.description}</p>
                                          </div>
                                          <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {qty > 0 && (
                                              <button onClick={() => comboRemoveSauce(step.productId, salsa.id)}
                                                className="w-7 h-7 flex items-center justify-center rounded-full border border-[rgba(26,18,6,0.15)] bg-white hover:bg-[rgba(26,18,6,0.07)] text-[#1A1206] font-bold text-lg transition-all active:scale-95">−</button>
                                            )}
                                            {qty > 0 && <span className="text-[#1A1206] font-black w-5 text-center text-sm">{qty}</span>}
                                            <button onClick={() => comboAddSauce(step.productId, salsa.id, step.count)} disabled={!canAdd}
                                              className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white transition-all active:scale-95 ${canAdd ? "bg-[#F58424] hover:bg-[#e07820]" : "bg-[rgba(26,18,6,0.1)] text-[rgba(26,18,6,0.3)] cursor-not-allowed"}`}>+</button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}

                              {step.type === "salad" && (
                                <div className="space-y-1.5">
                                  <p className="text-xs text-[rgba(26,18,6,0.45)] mb-2 font-medium">Selecciona 1 bowl</p>
                                  {FIT_PRODUCTS.map(fit => {
                                    const isSel = comboSelections.salad === fit.id;
                                    return (
                                      <button key={fit.id} onClick={() => setComboSelections(p => ({ ...p, salad: fit.id }))}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSel ? "border-[#F58424] bg-[rgba(245,132,36,0.06)]" : "border-[rgba(26,18,6,0.1)] hover:border-[rgba(26,18,6,0.22)] bg-white"}`}>
                                        <div className="relative w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-[rgba(26,18,6,0.07)]">
                                          <Image src={fit.image} alt={fit.name} fill className="object-contain p-1" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-sm font-bold ${isSel ? "text-[#F58424]" : "text-[#1A1206]"}`}>{fit.name}</p>
                                          <p className="text-xs text-[rgba(26,18,6,0.4)]">S/ {fit.price.toFixed(2)}</p>
                                        </div>
                                        {isSel && <div className="w-5 h-5 rounded-full bg-[#F58424] flex items-center justify-center flex-shrink-0"><span className="text-white text-[10px] font-black">✓</span></div>}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {step.type === "tacos" && (() => {
                                const tacoTotal = comboSelections.tacos.length;
                                return (
                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-xs text-[rgba(26,18,6,0.45)] mb-2 font-medium">
                                        Elige 2 tacos ·{" "}
                                        <span className={tacoTotal === 2 ? "text-[#F58424] font-bold" : ""}>{tacoTotal}/2</span>
                                      </p>
                                      <div className="space-y-1.5">
                                        {TACO_FLAVORS.map(taco => {
                                          const qty = comboSelections.tacos.filter(t => t === taco.id).length;
                                          const isActive = qty > 0;
                                          return (
                                            <div key={taco.id}
                                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isActive ? "border-[#F58424] bg-[rgba(245,132,36,0.06)]" : "border-[rgba(26,18,6,0.1)] bg-white"}`}>
                                              <div className="relative w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-[rgba(26,18,6,0.07)]">
                                                <Image src={taco.image} alt={taco.name} fill className="object-contain p-1" />
                                              </div>
                                              <p className={`text-sm font-bold flex-1 ${isActive ? "text-[#F58424]" : "text-[#1A1206]"}`}>
                                                {qty > 0 ? `${qty} × ` : ""}{taco.name}
                                              </p>
                                              <div className="flex items-center gap-2">
                                                {qty > 0 && (
                                                  <button onClick={() => setComboSelections(p => { const a = [...p.tacos]; const idx = a.lastIndexOf(taco.id); if (idx !== -1) a.splice(idx, 1); return { ...p, tacos: a }; })}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full border border-[rgba(26,18,6,0.15)] bg-white hover:bg-[rgba(26,18,6,0.07)] text-[#1A1206] font-bold text-lg transition-all active:scale-95">−</button>
                                                )}
                                                {qty > 0 && <span className="text-[#1A1206] font-black w-5 text-center text-sm">{qty}</span>}
                                                <button
                                                  disabled={tacoTotal >= 2}
                                                  onClick={() => setComboSelections(p => ({ ...p, tacos: [...p.tacos, taco.id] }))}
                                                  className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-bold text-lg transition-all ${tacoTotal >= 2 ? "bg-[rgba(26,18,6,0.12)] cursor-not-allowed" : "bg-[#F58424] hover:bg-[#e07820] active:scale-95"}`}>+</button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-xs text-[rgba(26,18,6,0.45)] mb-2 font-medium">Complemento incluido</p>
                                      <div className="grid grid-cols-3 gap-2">
                                        {TACO_COMPLEMENTS.map(c => {
                                          const isSel = comboSelections.tacoComplement === c.id;
                                          return (
                                            <button key={c.id} onClick={() => setComboSelections(p => ({ ...p, tacoComplement: c.id }))}
                                              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${isSel ? "border-[#F58424] bg-[rgba(245,132,36,0.06)]" : "border-[rgba(26,18,6,0.1)] bg-white hover:border-[rgba(26,18,6,0.22)]"}`}>
                                              <span className="text-2xl">{c.emoji}</span>
                                              <span className={`text-xs font-semibold ${isSel ? "text-[#F58424]" : "text-[rgba(26,18,6,0.55)]"}`}>{c.name}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Bebidas (opcional) ── */}
                <div className="mt-3">
                  <button ref={comboBebidasBtnRef}
                    onClick={() => { const next = !comboShowBebidas; setComboShowBebidas(next); scrollModalSection(comboScrollRef.current, comboBebidasBtnRef.current, next); }}
                    className="w-full flex items-center justify-between bg-white border border-[rgba(26,18,6,0.09)] rounded-2xl px-4 py-3 hover:bg-[rgba(26,18,6,0.03)] transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">🥤</span>
                      <div>
                        <span className="text-[#1A1206] text-sm font-bold">Bebidas</span>
                        <span className="text-xs text-[rgba(26,18,6,0.4)] ml-1.5">Opcional</span>
                      </div>
                      {comboBevCount > 0 && <span className="text-xs bg-[#F58424] text-white px-1.5 py-0.5 rounded-full font-bold">{comboBevCount}</span>}
                    </div>
                    <span className="text-[rgba(26,18,6,0.35)] text-sm transition-transform duration-200 inline-block"
                      style={{ transform: comboShowBebidas ? "rotate(0deg)" : "rotate(-90deg)" }}>▼</span>
                  </button>
                  <div className="sd-acc" style={{ gridTemplateRows: comboShowBebidas ? "1fr" : "0fr" }}>
                    <div className="sd-acc-body">
                      <div className={`space-y-1.5 mt-2 ${comboShowBebidas ? "sd-acc-content-open" : "sd-acc-content"}`}
                        style={{ opacity: comboShowBebidas ? 1 : 0 }}>
                        {comboBevIds.map(bid => {
                          const c = COMPLEMENTS[bid];
                          const cnt = comboExtras.filter(x => x === bid).length;
                          const recent = comboRecentExtra === bid;
                          return (
                            <div key={bid} className="flex items-center justify-between bg-white rounded-xl p-3 border border-[rgba(26,18,6,0.09)]">
                              <div className="flex items-center gap-2">
                                <span>{bid === "agua-mineral" ? "💧" : "🥤"}</span>
                                <span className="text-[#1A1206] text-sm font-medium">{c.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[#F58424] text-sm font-bold">S/ {c.price.toFixed(2)}</span>
                                {cnt > 0 && (
                                  <><button onClick={() => setComboExtras(p => { const a = [...p]; a.splice(a.lastIndexOf(bid), 1); return a; })}
                                    className="w-7 h-7 flex items-center justify-center rounded-full border border-[rgba(26,18,6,0.15)] bg-white text-[#1A1206] hover:bg-[rgba(26,18,6,0.07)] font-bold">−</button>
                                    <span className="text-sm bg-[#F58424] text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                                )}
                                <button onClick={() => { setComboExtras(p => [...p, bid]); setComboRecentExtra(bid); setTimeout(() => setComboRecentExtra(null), 1200); }}
                                  className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${recent ? "bg-green-500" : "bg-[#F58424] hover:bg-[#e07820]"}`}>
                                  {recent ? "✓" : "+"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Extras (opcional) ── */}
                <div className="mt-2">
                  <button ref={comboExtrasBtnRef}
                    onClick={() => { const next = !comboShowExtras; setComboShowExtras(next); scrollModalSection(comboScrollRef.current, comboExtrasBtnRef.current, next); }}
                    className="w-full flex items-center justify-between bg-white border border-[rgba(26,18,6,0.09)] rounded-2xl px-4 py-3 hover:bg-[rgba(26,18,6,0.03)] transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">🍟</span>
                      <div>
                        <span className="text-[#1A1206] text-sm font-bold">Extras</span>
                        <span className="text-xs text-[rgba(26,18,6,0.4)] ml-1.5">Opcional</span>
                      </div>
                      {comboXtrCount > 0 && <span className="text-xs bg-[#F58424] text-white px-1.5 py-0.5 rounded-full font-bold">{comboXtrCount}</span>}
                    </div>
                    <span className="text-[rgba(26,18,6,0.35)] text-sm transition-transform duration-200 inline-block"
                      style={{ transform: comboShowExtras ? "rotate(0deg)" : "rotate(-90deg)" }}>▼</span>
                  </button>
                  <div className="sd-acc" style={{ gridTemplateRows: comboShowExtras ? "1fr" : "0fr" }}>
                    <div className="sd-acc-body">
                      <div className={`space-y-1.5 mt-2 ${comboShowExtras ? "sd-acc-content-open" : "sd-acc-content"}`}
                        style={{ opacity: comboShowExtras ? 1 : 0 }}>
                        {comboXtraIds.map(bid => {
                          const c = COMPLEMENTS[bid];
                          const cnt = comboExtras.filter(x => x === bid).length;
                          const recent = comboRecentExtra === bid;
                          return (
                            <div key={bid} className="flex items-center justify-between bg-white rounded-xl p-3 border border-[rgba(26,18,6,0.09)]">
                              <div className="flex items-center gap-2">
                                <span>{bid === "extra-papas" ? "🍟" : "🌽"}</span>
                                <span className="text-[#1A1206] text-sm font-medium">{c.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[#F58424] text-sm font-bold">S/ {c.price.toFixed(2)}</span>
                                {cnt > 0 && (
                                  <><button onClick={() => setComboExtras(p => { const a = [...p]; a.splice(a.lastIndexOf(bid), 1); return a; })}
                                    className="w-7 h-7 flex items-center justify-center rounded-full border border-[rgba(26,18,6,0.15)] bg-white text-[#1A1206] hover:bg-[rgba(26,18,6,0.07)] font-bold">−</button>
                                    <span className="text-sm bg-[#F58424] text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                                )}
                                <button onClick={() => { setComboExtras(p => [...p, bid]); setComboRecentExtra(bid); setTimeout(() => setComboRecentExtra(null), 1200); }}
                                  className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${recent ? "bg-green-500" : "bg-[#F58424] hover:bg-[#e07820]"}`}>
                                  {recent ? "✓" : "+"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-2" />
              </div>

              {/* Footer */}
              <div className="shrink-0 px-5 py-4 border-t border-[rgba(26,18,6,0.1)] bg-[#F6F1F1]">
                {comboExtrasTotal > 0 && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-[rgba(26,18,6,0.5)] font-medium">Total con extras</span>
                    <span className="text-[#1A1206] font-black">S/ {comboFinalPrice.toFixed(2)}</span>
                  </div>
                )}
                <button
                  onClick={() => { comboSaveToCart(comboExtras); closeCombo(); }}
                  disabled={!allDone}
                  className={`w-full py-3.5 rounded-xl text-sm font-black transition-all active:scale-95 ${allDone ? "bg-[#F58424] hover:bg-[#e07820] text-white" : "bg-[rgba(26,18,6,0.09)] text-[rgba(26,18,6,0.4)] cursor-not-allowed"}`}>
                  {allDone ? "Agregar al pedido →" : `Faltan ${pendingCount} selección${pendingCount > 1 ? "es" : ""}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════════
           BURGER TRIO CONFIRM SHEET
      ════════════════════════════════════════════════════════════════════ */}
      {confirmTrio && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center" style={{ animation: trioClosing ? "fadeOutOv .32s ease forwards" : "fadeInOv .25s ease" }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeTrioModal} />
          <div ref={burgerScrollRef} className="relative bg-[#F6F1F1] w-full md:max-w-lg md:mx-auto md:rounded-2xl rounded-t-3xl flex flex-col shadow-sm"
            style={{ maxHeight: modalMaxH, marginBottom: modalMB, overflowY: "auto", animation: trioClosing ? "slideDown .32s ease forwards" : "slideUp .4s cubic-bezier(.22,1,.36,1)" }}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-[rgba(26,18,6,0.2)] rounded-full" /></div>
            <div className="px-5 pt-3 pb-4 border-b border-[rgba(26,18,6,0.1)]">
              <p className="text-[#1A1206] font-black text-lg">🍔 {confirmTrio.trioName}</p>
              <p className="text-xs text-[rgba(26,18,6,0.5)] mt-1">Confirma tu selección</p>
            </div>
            <div className="px-5 py-4 space-y-2">
              {confirmTrio.trioFlavors.map(f => (
                <div key={f.id} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[rgba(26,18,6,0.07)]">
                    <Image src={BURGER_FLAVORS.find(b => b.id === f.id)?.image || ""} alt={f.name} fill className="object-cover" />
                  </div>
                  <p className="text-[#1A1206] text-sm font-semibold flex-1">{f.qty > 1 ? `${f.qty}× ` : ""}{f.name}</p>
                </div>
              ))}

              {/* Salsa gratis */}
              <div className="mt-1">
                <p className="text-[10px] font-black text-[#F58424] uppercase tracking-widest mb-2">🧡 Elige tu salsa gratis</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {SALSAS.filter(s => s.id !== 'anticuchos').map(s => (
                    <button
                      key={s.id}
                      onClick={() => setBurgerSalsa(prev => prev === s.id ? null : s.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        burgerSalsa === s.id
                          ? 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-[rgba(26,18,6,0.05)] border-[rgba(26,18,6,0.1)] text-[rgba(26,18,6,0.7)] hover:border-[#F58424]/50'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bebidas accordion */}
              <button ref={burgerBebidasBtnRef} onClick={() => { const next = !burgerShowBebidas; setBurgerShowBebidas(next); scrollModalSection(burgerScrollRef.current, burgerBebidasBtnRef.current, next); }}
                className="w-full flex items-center justify-between bg-[rgba(26,18,6,0.05)] border border-[rgba(26,18,6,0.1)] rounded-xl p-3 transition-all hover:bg-[rgba(26,18,6,0.1)] mt-1">
                <div className="flex items-center gap-2">
                  <span>🥤</span>
                  <span className="text-[#1A1206] text-sm font-bold">Bebidas</span>
                  {burgerTrioComps.length > 0 && (
                    <span className="text-xs bg-amber-600 text-white px-1.5 py-0.5 rounded-full font-bold">{burgerTrioComps.length}</span>
                  )}
                </div>
                <span className="text-[rgba(26,18,6,0.5)] text-sm inline-block transition-transform duration-200" style={{ transform: burgerShowBebidas ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
              </button>
              <div className="sd-acc" style={{ gridTemplateRows: burgerShowBebidas ? '1fr' : '0fr' }}>
                <div className="sd-acc-body">
                  <div className={`space-y-1.5 mt-1 ${burgerShowBebidas ? "sd-acc-content-open" : "sd-acc-content"}`} style={{ opacity: burgerShowBebidas ? 1 : 0 }}>
                  {(["coca-cola","inka-cola","sprite","fanta","agua-mineral"] as const).map(bid => {
                    const c = COMPLEMENTS[bid];
                    const cnt = burgerTrioComps.filter(x => x === bid).length;
                    const recent = burgerRecentComp === bid;
                    return (
                      <div key={bid} className="flex items-center justify-between bg-[rgba(26,18,6,0.05)] rounded-xl p-3 border border-[rgba(26,18,6,0.08)]">
                        <div className="flex items-center gap-2">
                          <span>{bid === "agua-mineral" ? "💧" : "🥤"}</span>
                          <span className="text-[#1A1206] text-sm">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 text-sm font-bold">S/ {c.price.toFixed(2)}</span>
                          {cnt > 0 && (
                            <><button onClick={() => setBurgerTrioComps(p => { const a = [...p]; a.splice(a.lastIndexOf(bid), 1); return a; })}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button>
                              <span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                          )}
                          <button onClick={() => { setBurgerTrioComps(p => [...p, bid]); setBurgerRecentComp(bid); setTimeout(() => setBurgerRecentComp(null), 1200); }}
                            className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${recent ? "bg-green-500" : "bg-amber-600 hover:bg-amber-500"}`}>
                            {recent ? "✓" : "+"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[rgba(26,18,6,0.1)] mt-1">
                <span className="text-[rgba(26,18,6,0.5)] text-sm">Total</span>
                <span className="text-[#1A1206] font-black text-xl">
                  S/ {(confirmTrio.trioPrice + burgerTrioComps.reduce((s, id) => s + (COMPLEMENTS[id]?.price ?? 0), 0)).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="px-5 pb-6 flex flex-col gap-2">
              <button onClick={confirmAndAddTrio}
                className="w-full py-3.5 rounded-xl bg-[#F58424] hover:bg-[#e07820] text-white font-black text-sm transition-all active:scale-95">
                Agregar al pedido →
              </button>
              <button onClick={closeTrioModal}
                className="w-full py-3 rounded-xl border border-[rgba(26,18,6,0.15)] text-[rgba(26,18,6,0.5)] text-sm hover:bg-[rgba(26,18,6,0.07)] transition-all">
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
        const tacoCount = (taco1 ? 1 : 0) + (taco2 ? 1 : 0);
        const flavorsDone = tacoCount === 2;
        return (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center" style={{ animation: tacoClosing ? "fadeOutOv .35s ease forwards" : "fadeInOv .25s ease" }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeTacoModal} />
            <div className="relative bg-[#F6F1F1] w-full md:max-w-lg md:mx-auto md:rounded-2xl rounded-t-3xl flex flex-col shadow-sm"
              style={{ maxHeight: modalMaxH, marginBottom: modalMB, animation: tacoClosing ? "slideDown .35s ease forwards" : "slideUp .4s cubic-bezier(.22,1,.36,1)" }}>

              {/* Drag handle (mobile) */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0 md:hidden">
                <div className="w-10 h-1 bg-[rgba(26,18,6,0.2)] rounded-full" />
              </div>

              {/* Header — X in its own column, title never overlaps */}
              <div className="flex-shrink-0 flex items-start justify-between px-4 pt-1 pb-3 border-b border-[rgba(26,18,6,0.08)]">
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="text-base font-black text-[#1A1206] leading-tight">Arma tu Dúo de Tacos</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex gap-1 flex-1 max-w-[80px]">
                      {[0,1].map(i => (
                        <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i < tacoCount ? "bg-[#F58424]" : "bg-[rgba(26,18,6,0.15)]"}`} />
                      ))}
                    </div>
                    <span className={`text-xs font-semibold transition-colors duration-200 ${flavorsDone ? "text-green-600" : "text-[rgba(26,18,6,0.5)]"}`}>
                      {flavorsDone ? "✓ Sabores listos" : `${tacoCount} de 2 elegidos`}
                    </span>
                  </div>
                </div>
                <button onClick={closeTacoModal} aria-label="Cerrar"
                  className="flex-shrink-0 w-9 h-9 bg-[rgba(26,18,6,0.1)] hover:bg-[rgba(26,18,6,0.18)] text-[#1A1206] rounded-full flex items-center justify-center text-sm font-bold transition-all active:scale-90">
                  ✕
                </button>
              </div>

              {/* Scrollable content — all sections inside */}
              <div ref={tacoScrollRef} className="flex-1 overflow-y-auto px-4 pt-3 pb-4">

                {/* A: Sabores */}
                <p className="text-[rgba(26,18,6,0.45)] font-bold text-[11px] uppercase tracking-widest mb-2">Elige tus 2 tacos</p>
                <div className="space-y-1.5 mb-4">
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
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl border transition-all duration-200
                          ${soldOut ? "opacity-50 border-[rgba(26,18,6,0.08)]" : count > 0 ? "border-[#F58424]/40 bg-[#F58424]/8" : "border-[rgba(26,18,6,0.1)] bg-white/40"}`}>
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[rgba(26,18,6,0.07)]">
                          <Image src={f.image} alt={f.name} fill className="object-cover" />
                        </div>
                        <p className={`flex-1 text-sm font-semibold truncate ${count > 0 ? "text-[#F58424]" : "text-[#1A1206]"}`}>{f.name}</p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {count > 0 && (
                            <button onClick={removeOne}
                              className="w-7 h-7 rounded-full bg-[rgba(26,18,6,0.1)] hover:bg-[rgba(26,18,6,0.18)] text-[#1A1206] font-black text-base flex items-center justify-center active:scale-90 transition-all">
                              −
                            </button>
                          )}
                          {count > 0 && (
                            <span className="text-[#1A1206] font-black text-sm w-4 text-center">{count}</span>
                          )}
                          <button onClick={addOne} disabled={!canAdd}
                            className={`w-7 h-7 rounded-full font-black text-base flex items-center justify-center active:scale-90 transition-all
                              ${canAdd ? "bg-[#F58424] hover:bg-[#e07820] text-white" : count > 0 ? "bg-[rgba(26,18,6,0.1)] text-[rgba(26,18,6,0.3)] cursor-not-allowed" : "bg-[rgba(26,18,6,0.07)] text-[rgba(26,18,6,0.3)] cursor-not-allowed"}`}>
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* B: Complemento incluido */}
                <div ref={tacoComplementSectionRef}>
                <p className="text-[rgba(26,18,6,0.45)] font-bold text-[11px] uppercase tracking-widest mb-1.5">
                  Elige tu complemento · <span style={{ color: '#F58424' }}>Totalmente gratis</span>
                </p>
                <div className="flex gap-2 mb-4">
                  {TACO_COMPLEMENTS.map(c => (
                    <button key={c.id} onClick={() => setTacoComplement(c.id)}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border transition-all active:scale-95
                        ${tacoComplement === c.id ? "border-[#F58424]/50 bg-[#F58424]/10" : "border-[rgba(26,18,6,0.1)] bg-white/40 hover:border-[rgba(26,18,6,0.2)]"}`}>
                      <span className="text-xl">{c.emoji}</span>
                      <span className={`text-xs font-semibold ${tacoComplement === c.id ? "text-[#F58424]" : "text-[rgba(26,18,6,0.6)]"}`}>{c.name}</span>
                    </button>
                  ))}
                </div>
                </div>{/* /tacoComplementSectionRef */}

                {/* C: Bebidas · Opcional */}
                <div className="mb-2">
                  <button ref={tacoBebidasBtnRef} onClick={() => { const next = !tacoShowBebidas; setTacoShowBebidas(next); scrollModalSection(tacoScrollRef.current, tacoBebidasBtnRef.current, next); }}
                    className="w-full flex items-center justify-between bg-[rgba(26,18,6,0.05)] border border-[rgba(26,18,6,0.1)] rounded-xl p-3 transition-all hover:bg-[rgba(26,18,6,0.1)] mb-1">
                    <div className="flex items-center gap-2">
                      <span>🥤</span>
                      <span className="text-[#1A1206] text-sm font-bold">Bebidas</span>
                      <span className="text-[rgba(26,18,6,0.4)] text-xs">Opcional</span>
                      {tacoModalComps.filter(c => ["coca-cola","inka-cola","sprite","fanta","agua-mineral"].includes(c)).length > 0 && (
                        <span className="text-xs bg-[#F58424] text-white px-1.5 py-0.5 rounded-full font-bold">
                          {tacoModalComps.filter(c => ["coca-cola","inka-cola","sprite","fanta","agua-mineral"].includes(c)).length}
                        </span>
                      )}
                    </div>
                    <span className="text-[rgba(26,18,6,0.5)] text-sm inline-block transition-transform duration-200" style={{ transform: tacoShowBebidas ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
                  </button>
                  <div className="sd-acc" style={{ gridTemplateRows: tacoShowBebidas ? '1fr' : '0fr' }}>
                    <div className="sd-acc-body">
                      <div className={`space-y-1.5 mt-1 ${tacoShowBebidas ? "sd-acc-content-open" : "sd-acc-content"}`} style={{ opacity: tacoShowBebidas ? 1 : 0 }}>
                        {(["coca-cola","inka-cola","sprite","fanta","agua-mineral"] as const).map(bid => {
                          const c = COMPLEMENTS[bid];
                          const cnt = tacoModalComps.filter(x => x === bid).length;
                          const recent = tacoRecentComp === bid;
                          return (
                            <div key={bid} className="flex items-center justify-between bg-white/50 rounded-xl p-3 border border-[rgba(26,18,6,0.08)]">
                              <div className="flex items-center gap-2">
                                <span>{bid === "agua-mineral" ? "💧" : "🥤"}</span>
                                <span className="text-[#1A1206] text-sm">{c.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[#F58424] text-sm font-bold">S/ {c.price.toFixed(2)}</span>
                                {cnt > 0 && (
                                  <><button onClick={() => setTacoModalComps(p => { const a = [...p]; a.splice(a.lastIndexOf(bid), 1); return a; })}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500/80 hover:bg-red-500 text-white font-bold">−</button>
                                    <span className="text-sm bg-[#F58424] text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                                )}
                                <button onClick={() => { setTacoModalComps(p => [...p, bid]); setTacoRecentComp(bid); setTimeout(() => setTacoRecentComp(null), 1200); }}
                                  className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white transition-all ${recent ? "bg-green-500 scale-110" : "bg-[#F58424] hover:bg-[#e07820]"}`}>
                                  {recent ? "✓" : "+"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* D: Extras · Opcional */}
                <div className="mb-2">
                  <button ref={tacoExtrasBtnRef} onClick={() => { const next = !tacoShowExtras; setTacoShowExtras(next); scrollModalSection(tacoScrollRef.current, tacoExtrasBtnRef.current, next); }}
                    className="w-full flex items-center justify-between bg-[rgba(26,18,6,0.05)] border border-[rgba(26,18,6,0.1)] rounded-xl p-3 transition-all hover:bg-[rgba(26,18,6,0.1)] mb-1">
                    <div className="flex items-center gap-2">
                      <span>🍟</span>
                      <span className="text-[#1A1206] text-sm font-bold">Extras</span>
                      <span className="text-[rgba(26,18,6,0.4)] text-xs">Opcional</span>
                      {tacoModalComps.filter(c => ["extra-papas","extra-nachos"].includes(c)).length > 0 && (
                        <span className="text-xs bg-[#F58424] text-white px-1.5 py-0.5 rounded-full font-bold">
                          {tacoModalComps.filter(c => ["extra-papas","extra-nachos"].includes(c)).length}
                        </span>
                      )}
                    </div>
                    <span className="text-[rgba(26,18,6,0.5)] text-sm inline-block transition-transform duration-200" style={{ transform: tacoShowExtras ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
                  </button>
                  <div className="sd-acc" style={{ gridTemplateRows: tacoShowExtras ? '1fr' : '0fr' }}>
                    <div className="sd-acc-body">
                      <div className={`space-y-1.5 mt-1 ${tacoShowExtras ? "sd-acc-content-open" : "sd-acc-content"}`} style={{ opacity: tacoShowExtras ? 1 : 0 }}>
                        {(["extra-papas","extra-nachos"] as const).map(bid => {
                          const c = COMPLEMENTS[bid];
                          const cnt = tacoModalComps.filter(x => x === bid).length;
                          const recent = tacoRecentComp === bid;
                          return (
                            <div key={bid} className="flex items-center justify-between bg-white/50 rounded-xl p-3 border border-[rgba(26,18,6,0.08)]">
                              <div className="flex items-center gap-2">
                                <span>{bid === "extra-papas" ? "🍟" : "🌽"}</span>
                                <span className="text-[#1A1206] text-sm">{c.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[#F58424] text-sm font-bold">S/ {c.price.toFixed(2)}</span>
                                {cnt > 0 && (
                                  <><button onClick={() => setTacoModalComps(p => { const a = [...p]; a.splice(a.lastIndexOf(bid), 1); return a; })}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500/80 hover:bg-red-500 text-white font-bold">−</button>
                                    <span className="text-sm bg-[#F58424] text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                                )}
                                <button onClick={() => { setTacoModalComps(p => [...p, bid]); setTacoRecentComp(bid); setTimeout(() => setTacoRecentComp(null), 1200); }}
                                  className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white transition-all ${recent ? "bg-green-500 scale-110" : "bg-[#F58424] hover:bg-[#e07820]"}`}>
                                  {recent ? "✓" : "+"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer CTA */}
              <div className="flex-shrink-0 px-4 pt-2 pb-6 bg-[#F6F1F1] border-t border-[rgba(26,18,6,0.1)]">
                {/* Hint message — visible when any required selection is missing */}
                {!allSet && (() => {
                  const hintMsg =
                    tacoCount === 0 ? "Elige tus 2 tacos para continuar." :
                    tacoCount === 1 ? "Te falta elegir 1 taco." :
                    "Solo falta elegir tu complemento gratis: papas o nachos.";
                  const showScrollBtn = flavorsDone && !tacoComplement;
                  return (
                    <div className="flex items-center justify-between gap-2 py-2 mb-1" aria-live="polite">
                      <p className="text-sm text-[#1A1206] leading-snug">{hintMsg}</p>
                      {showScrollBtn && (
                        <button
                          onClick={() => {
                            const el = tacoComplementSectionRef.current;
                            const sc = tacoScrollRef.current;
                            if (!el || !sc) return;
                            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                            const cr = sc.getBoundingClientRect();
                            const er = el.getBoundingClientRect();
                            const target = sc.scrollTop + (er.top - cr.top) - 12;
                            sc.scrollTo({ top: Math.max(0, target), behavior: reduced ? 'instant' : 'smooth' });
                          }}
                          className="flex-shrink-0 text-xs font-bold whitespace-nowrap underline underline-offset-2 active:opacity-60"
                          style={{ color: '#F58424' }}>
                          Elegir complemento
                        </button>
                      )}
                    </div>
                  );
                })()}
                {(() => {
                  const extrasTotal = tacoModalComps.reduce((s, id) => s + (COMPLEMENTS[id]?.price ?? 0), 0);
                  const total = eff + extrasTotal;
                  return (
                    <button onClick={addTacoOrder} disabled={!allSet}
                      className={`w-full py-4 rounded-xl font-black text-base transition-all ${allSet ? "bg-[#F58424] hover:bg-[#e07820] text-white active:scale-[.98]" : "bg-[rgba(26,18,6,0.1)] text-[rgba(26,18,6,0.3)] cursor-not-allowed"}`}>
                      {allSet ? `Agregar dúo — S/ ${total.toFixed(2)}` : "Agregar dúo"}
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
        const extrasPrice = comps.reduce((s: number, cid: string) => s + (COMPLEMENTS[cid]?.price ?? 0), 0);

        return (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center"
            style={{ animation: fitClosing ? "fadeOutOv .35s ease forwards" : "fadeInOv .25s ease" }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeFitModal} />
            <div className="relative bg-[#F6F1F1] w-full md:max-w-lg md:mx-auto md:rounded-2xl rounded-t-3xl flex flex-col shadow-sm"
              style={{ maxHeight: modalMaxH, marginBottom: modalMB, animation: fitClosing ? "slideDown .35s ease forwards" : "slideUp .4s cubic-bezier(.22,1,.36,1)" }}>
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0 md:hidden"><div className="w-10 h-1 bg-[rgba(26,18,6,0.2)] rounded-full" /></div>
              <button onClick={closeFitModal}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-[rgba(26,18,6,0.1)] hover:bg-[rgba(26,18,6,0.18)] text-[#1A1206] rounded-full flex items-center justify-center text-sm font-bold">✕</button>

              <div ref={fitScrollRef} className="flex-1 overflow-y-auto">
                <div className="relative h-56 bg-black overflow-hidden">
                  <Image src={mp.image} alt={mp.name} fill className="object-cover" sizes="100vw" />
                  {disc && <div className="absolute top-3 left-3 bg-amber-400 text-black text-xs font-black px-2 py-0.5 rounded-full">OFERTA</div>}
                </div>

                <div className="px-4 pt-4 pb-2">
                  <h3 className="text-xl font-black text-[#1A1206] mb-1">{mp.name}</h3>
                  <p className="text-[rgba(26,18,6,0.5)] text-sm mb-4">{mp.description}</p>

                  {/* Price + qty */}
                  <div className="flex items-center justify-between mb-5 pb-4 border-b border-[rgba(26,18,6,0.1)]">
                    <div>
                      {disc ? (
                        <><span className="text-sm text-[rgba(26,18,6,0.4)] line-through block">S/ {(base * qty + extrasPrice).toFixed(2)}</span>
                          <span className="text-2xl font-black" style={{ color: '#F58424' }}>S/ {(disc * qty + extrasPrice).toFixed(2)}</span></>
                      ) : (
                        <span className="text-2xl font-black" style={{ color: '#F58424' }}>S/ {(base * qty + extrasPrice).toFixed(2)}</span>
                      )}
                      {qty > 1
                        ? <p className="text-xs text-[rgba(26,18,6,0.4)] mt-0.5">{qty} × S/ {final.toFixed(2)} c/u{extrasPrice > 0 ? ` + S/ ${extrasPrice.toFixed(2)} extras` : ''}</p>
                        : <p className="text-xs text-[rgba(26,18,6,0.4)] mt-0.5">precio unitario</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => { const q = fitQty[fitModal] || 1; if (q > 1) setFitQty(p => ({ ...p, [fitModal]: q - 1 })); }}
                        disabled={qty <= 1}
                        className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[rgba(26,18,6,0.2)] bg-[rgba(26,18,6,0.07)] hover:bg-[rgba(26,18,6,0.12)] disabled:opacity-40 text-[#1A1206] font-bold text-xl transition-all">−</button>
                      <span className="text-[#1A1206] font-black text-xl w-8 text-center">{qty}</span>
                      <button onClick={() => setFitQty(p => ({ ...p, [fitModal]: (p[fitModal] || 1) + 1 }))}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F58424] hover:bg-[#e07820] text-white font-bold text-xl transition-all">+</button>
                    </div>
                  </div>

                  {/* Extras */}
                  <div className="mb-4">
                    <h5 className="text-sm font-bold text-[#1A1206] mb-2">Extras</h5>
                    {[
                      { id: "extra-aderezo", name: "Extra aderezo", emoji: "🥗", price: 3 },
                      { id: "extra-papas",   name: "Extra papas",   emoji: "🍟", price: 5 },
                      ...(fitModal === "ensalada-clasica" ? [{ id: "pollo-grillado", name: "Pollo grillado", emoji: "🍗", price: 5 }] : []),
                    ].map(extra => {
                      const cnt = comps.filter(x => x === extra.id).length;
                      const recent = fitRecentComp === `${fitModal}-${extra.id}`;
                      return (
                        <div key={extra.id} className="flex items-center justify-between bg-[rgba(26,18,6,0.05)] rounded-xl p-3 border border-[rgba(26,18,6,0.08)] mb-2">
                          <div className="flex items-center gap-2">
                            <span>{extra.emoji}</span>
                            <span className="text-[#1A1206] text-sm">{extra.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 text-sm font-bold">+S/ {extra.price.toFixed(2)}</span>
                            {cnt > 0 && (
                              <><button onClick={() => removeFitComplement(fitModal, extra.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button>
                                <span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                            )}
                            <button onClick={() => addFitComplement(fitModal, extra.id)}
                              className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${recent ? "bg-green-500" : "bg-amber-600 hover:bg-amber-500"}`}>
                              {recent ? "✓" : "+"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bebidas */}
                  <div className="mb-4">
                    <button ref={fitBebidasBtnRef} onClick={() => { const next = !fitShowBebidas[fitModal]; setFitShowBebidas(p => ({ ...p, [fitModal]: next })); scrollModalSection(fitScrollRef.current, fitBebidasBtnRef.current, next); }}
                      className="w-full flex items-center justify-between bg-[rgba(26,18,6,0.05)] border border-[rgba(26,18,6,0.1)] rounded-xl p-3 hover:bg-[rgba(26,18,6,0.1)] mb-1 transition-all">
                      <div className="flex items-center gap-2"><span>🥤</span><span className="text-[#1A1206] text-sm font-bold">Bebidas</span></div>
                      <span className="text-[rgba(26,18,6,0.5)] text-sm inline-block transition-transform duration-200"
                        style={{ transform: fitShowBebidas[fitModal] ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
                    </button>
                    <div className="sd-acc" style={{ gridTemplateRows: fitShowBebidas[fitModal] ? '1fr' : '0fr' }}>
                      <div className="sd-acc-body">
                        <div className={`space-y-1.5 mt-1 ${fitShowBebidas[fitModal] ? "sd-acc-content-open" : "sd-acc-content"}`}
                          style={{ opacity: fitShowBebidas[fitModal] ? 1 : 0 }}>
                          {(["agua-mineral","coca-cola","inka-cola","sprite","fanta"] as const).map(bid => {
                            const c = COMPLEMENTS[bid];
                            const cnt = comps.filter(x => x === bid).length;
                            const recent = fitRecentComp === `${fitModal}-${bid}`;
                            return (
                              <div key={bid} className="flex items-center justify-between bg-[rgba(26,18,6,0.05)] rounded-xl p-3 border border-[rgba(26,18,6,0.08)]">
                                <div className="flex items-center gap-2">
                                  <span>{bid === "agua-mineral" ? "💧" : "🥤"}</span>
                                  <span className="text-[#1A1206] text-sm">{c.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-amber-400 text-sm font-bold">S/ {c.price.toFixed(2)}</span>
                                  {cnt > 0 && (
                                    <><button onClick={() => removeFitComplement(fitModal, bid)}
                                      className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button>
                                      <span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">{cnt}</span></>
                                  )}
                                  <button onClick={() => addFitComplement(fitModal, bid)}
                                    className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${recent ? "bg-green-500" : "bg-amber-600 hover:bg-amber-500"}`}>
                                    {recent ? "✓" : "+"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 px-4 pt-3 pb-6 bg-[#F6F1F1] border-t border-[rgba(26,18,6,0.1)]">
                <button onClick={() => completeFitOrder(fitModal)}
                  className="w-full py-4 rounded-xl font-black text-base bg-[#F58424] hover:bg-[#e07820] text-white active:scale-[.98] transition-all">
                  {fitEditIdx !== null
                    ? `Confirmar cambios — S/ ${(final * qty + extrasPrice).toFixed(2)}`
                    : `Agregar orden — S/ ${(final * qty + extrasPrice).toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Remove confirmation modal ─────────────────────────────────────── */}
      {removeConfirm && (() => {
        const closeModal = () => {
          setRemoveConfirm(null);
          setTimeout(() => removeConfirmTriggerRef.current?.focus(), 50);
        };
        const confirmRemove = () => {
          const { type, idx, id } = removeConfirm;
          if (type === 'alitas') setAlitasOrders(prev => prev.filter((_, i) => i !== idx));
          else if (type === 'fit') setFitOrders(prev => prev.filter((_, i) => i !== idx));
          else if (type === 'taco') setTacoOrders(prev => prev.filter((_, i) => i !== idx));
          else if (type === 'trio') setTrioOrders(prev => prev.filter((_, i) => i !== idx));
          else if (type === 'bebida' && id) setBebidaQty(prev => ({ ...prev, [id]: 0 }));
          else if (type === 'combo' && id) deleteComboGroup(id);
          setRemoveConfirm(null);
        };
        const handleKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === 'Escape') { closeModal(); return; }
          if (e.key === 'Tab') {
            const focusable = Array.from((e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button'));
            if (!focusable.length) return;
            const first = focusable[0]; const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
          }
        };
        const qtyNote = removeConfirm.qty > 1 ? ` (${removeConfirm.qty} unidades)` : '';
        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-confirm-title"
            className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            onKeyDown={handleKeyDown}
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
            <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <button
                onClick={closeModal}
                aria-label="Cerrar"
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/8 hover:bg-black/14 text-black/60 text-sm font-bold">
                ✕
              </button>
              <h2 id="remove-confirm-title" className="text-base font-black text-black mb-2 pr-8">¿Quitar esta orden?</h2>
              <p className="text-sm text-black/65 mb-5">
                ¿Seguro que deseas quitar «{removeConfirm.name}»{qtyNote} de tu carrito?
              </p>
              <div className="flex gap-2">
                <button
                  autoFocus
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl border-2 font-semibold text-sm text-black min-h-[44px]"
                  style={{ borderColor: '#F58424', background: '#fff' }}>
                  Cancelar
                </button>
                <button
                  onClick={confirmRemove}
                  className="flex-1 py-3 rounded-xl font-black text-sm text-white min-h-[44px]"
                  style={{ background: '#F58424' }}>
                  Sí, quitar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </PageMotionWrapper>
  );
}
