"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { isBusinessOpen, getNextOpenMessage } from "../utils/businessHours";
import WhatsAppButton from "../components/WhatsAppButton";
import BannerCarousel from "../components/BannerCarousel";
import PageMotionWrapper from "../components/PageMotionWrapper";
import HalloweenAtmosphere from "../components/HalloweenAtmosphere";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Burger {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number | null; // null = precio pendiente
  image: string | null; // null = sin foto aún
  protein: "carne" | "pollo" | "pescado" | "vegetal";
  cream: string;
}

interface Cream {
  id: string;
  name: string;
  description: string;
  ideal: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const burgers: Burger[] = [
  {
    id: "la-basica",
    name: "LA BÁSICA",
    tagline: "Clásica, pero irresistible",
    description:
      "Carne smash, cheddar, lechuga, tomate y nuestra crema pickle. El equilibrio perfecto entre lo simple y lo adictivo.",
    price: null,
    image: null,
    protein: "carne",
    cream: "Crema Pickle",
  },
  {
    id: "la-pecadora",
    name: "LA PECADORA",
    tagline: "Dulce, ahumada y crocante",
    description:
      "Carne smash, cheddar, bacon crocante, cebolla crispy y crema de cebolla dorada. Cada bocado es un pecado que vale la pena.",
    price: null,
    image: null,
    protein: "carne",
    cream: "Crema de Cebolla Dorada",
  },
  {
    id: "la-leve",
    name: "LA LEVE",
    tagline: "Ligera y llena de sabor",
    description:
      "Pollo a la plancha, queso, lechuga, tomate y crema de ajo & hierbas. La opción más fresca del menú, sin sacrificar el sabor.",
    price: null,
    image: null,
    protein: "pollo",
    cream: "Crema de Ajo & Hierbas",
  },
  {
    id: "la-vegetal",
    name: "LA VEGETAL",
    tagline: "Naturalmente deliciosa",
    description:
      "Tortilla de avena con verduras, queso, lechuga, tomate y crema de ajo & hierbas. La tentación que no necesita carne para conquistarte.",
    price: null,
    image: null,
    protein: "vegetal",
    cream: "Crema de Ajo & Hierbas",
  },
  {
    id: "la-marina",
    name: "LA MARINA",
    tagline: "Fresca, crocante y diferente",
    description:
      "Pescado crispy, lechuga, cebolla morada y nuestra crema pickle. El mar y la parrilla en un solo bocado.",
    price: null,
    image: null,
    protein: "pescado",
    cream: "Crema Pickle",
  },
  {
    id: "la-intensa",
    name: "LA INTENSA",
    tagline: "Potente y adictiva",
    description:
      "Carne smash, cheddar, piña a la parrilla, cebolla crispy y crema de cebolla dorada. Dulce, potente, y completamente irresistible.",
    price: null,
    image: null,
    protein: "carne",
    cream: "Crema de Cebolla Dorada",
  },
];

const creams: Cream[] = [
  {
    id: "crema-pickle",
    name: "Crema Pickle",
    description: "Cremosa, fresca y ligeramente ácida.",
    ideal: "La Básica · La Marina · y como extra",
  },
  {
    id: "crema-ajo-hierbas",
    name: "Crema de Ajo & Hierbas",
    description: "Suave, aromática y fresca.",
    ideal: "La Leve · La Vegetal",
  },
  {
    id: "crema-cebolla-dorada",
    name: "Crema de Cebolla Dorada",
    description: "Cremosa, ligeramente dulce y tostada.",
    ideal: "La Pecadora · La Intensa · y como extra",
  },
];

const PROTEIN_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  carne:   { bg: "rgba(239,68,68,0.15)",   text: "#f87171", label: "Carne Smash" },
  pollo:   { bg: "rgba(251,191,36,0.15)",  text: "#fbbf24", label: "Pollo" },
  pescado: { bg: "rgba(6,182,212,0.15)",   text: "#06b6d4", label: "Pescado" },
  vegetal: { bg: "rgba(52,211,153,0.15)",  text: "#34d399", label: "Vegetal" },
};

const ORANGE = "#fb923c";
const ORANGE_RGB = "251,146,60";
const ORANGE_DIM = "rgba(251,146,60,0.15)";

// ─── Placeholder imagen de producto ──────────────────────────────────────────

function BurgerPlaceholder({ name, protein }: { name: string; protein: string }) {
  const c = PROTEIN_COLORS[protein];
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2"
      style={{ background: `linear-gradient(135deg, #0a0a0a, #111)` }}
    >
      <span style={{ fontSize: "3rem", lineHeight: 1 }}>🍔</span>
      <span
        className="font-black text-center px-2 leading-tight"
        style={{ color: c.text, fontSize: "0.65rem", letterSpacing: "0.15em" }}
      >
        {name}
      </span>
      <span
        className="font-bold uppercase"
        style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.5rem", letterSpacing: "0.2em" }}
      >
        FOTO PRÓXIMAMENTE
      </span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function BurgersPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [businessOpen, setBusinessOpen] = useState(false);
  const [nextOpenMsg, setNextOpenMsg] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredCream, setHoveredCream] = useState<string | null>(null);

  useEffect(() => {
    setBusinessOpen(isBusinessOpen());
    setNextOpenMsg(getNextOpenMessage());
  }, []);

  return (
    <PageMotionWrapper color="orange" className="min-h-screen bg-black">
      {/* ── Banner carousel (sin slides por ahora — se activa al agregar imágenes) ── */}
      <BannerCarousel slides={[]} />

      {/* ── Header ── */}
      <div className="relative px-4 pt-6 pb-4 md:pt-10 md:pb-6 text-center">
        {/* Back arrow */}
        <button
          onClick={() => router.push("/")}
          className="absolute left-4 top-6 md:top-10 flex items-center gap-1.5 text-orange-400/70 hover:text-orange-400 transition-colors"
          aria-label="Volver al inicio"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-xs font-bold tracking-wider hidden sm:inline">INICIO</span>
        </button>

        {/* Title */}
        <div className="inline-flex items-center gap-2 mb-1">
          <h1
            className="font-black tracking-widest"
            style={{
              fontFamily: "var(--font-graffiti)",
              fontSize: "clamp(2rem, 6vw, 3.5rem)",
              color: ORANGE,
              textShadow: `0 0 20px rgba(${ORANGE_RGB},0.6), 0 0 50px rgba(${ORANGE_RGB},0.25)`,
            }}
          >
            MINI BURGERS
          </h1>
          {/* NUEVO badge */}
          <span
            className="font-black text-black uppercase self-start mt-1"
            style={{
              fontSize: "0.5rem",
              background: ORANGE,
              padding: "3px 8px",
              borderRadius: 999,
              letterSpacing: "0.12em",
            }}
          >
            NUEVO
          </span>
        </div>

        <p
          className="font-bold uppercase tracking-widest"
          style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.25em" }}
        >
          ¿Ángel o Diablo? Tú decides •&nbsp;6 tentaciones
        </p>

        {/* Separador */}
        <div
          className="mx-auto mt-4"
          style={{
            height: "1px",
            background: `linear-gradient(90deg, transparent, rgba(${ORANGE_RGB},0.5), transparent)`,
            maxWidth: "320px",
          }}
        />

        {/* Aviso precios pendientes */}
        <div
          className="mx-auto mt-4 px-4 py-3 rounded-xl max-w-sm text-center"
          style={{
            background: "rgba(251,146,60,0.08)",
            border: "1px solid rgba(251,146,60,0.25)",
          }}
        >
          <p className="text-orange-400 font-bold text-xs tracking-wide">
            🚀 Categoría en lanzamiento
          </p>
          <p className="text-white/50 text-xs mt-0.5 leading-relaxed">
            Precios y disponibilidad se confirman próximamente.
            <br />
            ¡Muy pronto podrás ordenar!
          </p>
        </div>
      </div>

      {/* ── Grid de burgers ── */}
      <div className="px-4 pb-6 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {burgers.map((burger) => {
            const proteinMeta = PROTEIN_COLORS[burger.protein];
            const isHovered = hoveredCard === burger.id;
            return (
              <div
                key={burger.id}
                className="relative rounded-2xl overflow-hidden flex flex-col"
                onMouseEnter={() => setHoveredCard(burger.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: "linear-gradient(145deg, #0d0d0d, #141414)",
                  border: `1.5px solid ${isHovered ? `rgba(${ORANGE_RGB},0.5)` : "rgba(255,255,255,0.07)"}`,
                  boxShadow: isHovered
                    ? `0 0 24px rgba(${ORANGE_RGB},0.15), 0 8px 32px rgba(0,0,0,0.6)`
                    : "0 4px 16px rgba(0,0,0,0.4)",
                  transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                }}
              >
                {/* Image area */}
                <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
                  {burger.image ? (
                    <Image
                      src={burger.image}
                      alt={burger.name}
                      fill
                      className="object-cover"
                      style={{
                        transform: isHovered ? "scale(1.05)" : "scale(1)",
                        transition: "transform 0.5s ease",
                      }}
                    />
                  ) : (
                    <BurgerPlaceholder name={burger.name} protein={burger.protein} />
                  )}

                  {/* Protein badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className="font-bold uppercase text-[10px] tracking-wider px-2.5 py-1 rounded-full"
                      style={{
                        background: proteinMeta.bg,
                        color: proteinMeta.text,
                        border: `1px solid ${proteinMeta.text}40`,
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      {proteinMeta.label}
                    </span>
                  </div>

                  {/* Precio pendiente badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className="font-bold text-[10px] tracking-wider px-2.5 py-1 rounded-full"
                      style={{
                        background: "rgba(0,0,0,0.7)",
                        color: "rgba(255,255,255,0.4)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      Precio por confirmar
                    </span>
                  </div>

                  {/* Bottom gradient */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
                    style={{ background: "linear-gradient(transparent, rgba(13,13,13,0.95))" }}
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 px-4 pb-4 pt-3">
                  {/* Name + tagline */}
                  <h2
                    className="font-black tracking-widest mb-0.5"
                    style={{
                      fontFamily: "var(--font-graffiti)",
                      fontSize: "clamp(1.15rem, 3vw, 1.4rem)",
                      color: ORANGE,
                      textShadow: isHovered
                        ? `0 0 12px rgba(${ORANGE_RGB},0.6)`
                        : `0 0 6px rgba(${ORANGE_RGB},0.3)`,
                      transition: "text-shadow 0.3s ease",
                    }}
                  >
                    {burger.name}
                  </h2>
                  <p
                    className="font-bold italic mb-2"
                    style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}
                  >
                    {burger.tagline}
                  </p>

                  {/* Description */}
                  <p
                    className="text-white/60 leading-relaxed flex-1 mb-3"
                    style={{ fontSize: "0.82rem" }}
                  >
                    {burger.description}
                  </p>

                  {/* Cream info */}
                  <div
                    className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg"
                    style={{ background: ORANGE_DIM, border: `1px solid rgba(${ORANGE_RGB},0.2)` }}
                  >
                    <span style={{ fontSize: "0.85rem" }}>🫙</span>
                    <div>
                      <p style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>
                        CREMA ESPECIAL
                      </p>
                      <p className="font-bold" style={{ fontSize: "0.75rem", color: ORANGE }}>
                        {burger.cream}
                      </p>
                    </div>
                  </div>

                  {/* CTA — desactivado hasta tener precio */}
                  <button
                    disabled
                    className="w-full py-3 rounded-xl font-black text-sm tracking-wider cursor-not-allowed"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.25)",
                      border: "1.5px solid rgba(255,255,255,0.08)",
                    }}
                    title="Precio pendiente — disponible próximamente"
                  >
                    🕐 Próximamente
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Nuestras Cremas Especiales ── */}
      <div className="px-4 pb-8 md:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Section title */}
          <div className="text-center mb-6">
            <div
              className="mx-auto mb-3"
              style={{
                height: "1px",
                background: `linear-gradient(90deg, transparent, rgba(${ORANGE_RGB},0.4), transparent)`,
                maxWidth: "280px",
              }}
            />
            <h2
              className="font-black tracking-widest"
              style={{
                fontFamily: "var(--font-graffiti)",
                fontSize: "clamp(1.2rem, 3.5vw, 1.8rem)",
                color: ORANGE,
                textShadow: `0 0 12px rgba(${ORANGE_RGB},0.4)`,
              }}
            >
              NUESTRAS CREMAS ESPECIALES
            </h2>
            <p
              className="font-bold uppercase tracking-widest mt-1"
              style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em" }}
            >
              Elaboradas en casa · sabores únicos
            </p>
          </div>

          {/* Cream cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {creams.map((cream) => {
              const isH = hoveredCream === cream.id;
              return (
                <div
                  key={cream.id}
                  className="rounded-xl px-4 py-4 text-center"
                  onMouseEnter={() => setHoveredCream(cream.id)}
                  onMouseLeave={() => setHoveredCream(null)}
                  style={{
                    background: isH ? "rgba(251,146,60,0.1)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isH ? `rgba(${ORANGE_RGB},0.4)` : "rgba(255,255,255,0.07)"}`,
                    transition: "background 0.3s ease, border-color 0.3s ease",
                  }}
                >
                  <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "8px" }}>🫙</span>
                  <h3 className="font-black text-white mb-1" style={{ fontSize: "0.9rem", letterSpacing: "0.05em" }}>
                    {cream.name}
                  </h3>
                  <p className="text-white/50 mb-2" style={{ fontSize: "0.78rem" }}>
                    {cream.description}
                  </p>
                  <p style={{ fontSize: "0.65rem", color: ORANGE, letterSpacing: "0.05em" }}>
                    <span className="opacity-60">Ideal para: </span>
                    <span className="font-bold">{cream.ideal}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom taglines ── */}
      <div
        className="px-4 pb-8 text-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-xl mx-auto pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: "🥩", text: "Ingredientes reales" },
            { icon: "🍔", text: "Sabores con personalidad" },
            { icon: "🚀", text: "Listas para tu antojo" },
            { icon: "❤️", text: "El equilibrio entre lo bendito y lo pecaminoso" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span style={{ fontSize: "1.4rem" }}>{item.icon}</span>
              <p
                className="font-bold text-center leading-tight"
                style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}
              >
                {item.text}
              </p>
            </div>
          ))}
        </div>

        {/* Back to menu */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-8 font-black uppercase tracking-wider transition-colors"
          style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em" }}
        >
          ← Volver al menú
        </Link>
      </div>

      {/* ── Business closed bar ── */}
      {!businessOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 text-center py-2"
          style={{
            background: "linear-gradient(90deg, rgba(20,10,0,0.97), rgba(30,15,0,0.97))",
            borderTop: `1px solid rgba(${ORANGE_RGB},0.3)`,
          }}
        >
          <p className="font-bold text-orange-400 text-xs tracking-wide">
            🕐 Cocina cerrada · {nextOpenMsg}
          </p>
        </div>
      )}

      <HalloweenAtmosphere accent="orange" />
      <WhatsAppButton lifted={!businessOpen} />
    </PageMotionWrapper>
  );
}
