"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// ─── DATOS ────────────────────────────────────────────────────────────────────

const WA_LINK = "https://wa.me/51910677186?text=Hola%20%F0%9F%91%8B%20quiero%20hacer%20un%20pedido";

const SALSAS = [
  "BBQ ahumada", "Santo Picante", "Acevichada Imperial",
  "Crispy Celestial", "Parrillera", "Honey Mustard", "Oriental Teriyaki", "Sweet & Sour",
];

const ALITAS = [
  {
    id: "pequeno-dilema",
    name: "Pequeño Dilema",
    desc: "8 alitas crujientes con papas francesas y tu salsa elegida. El primer bocado es una trampa, no vas a querer quedarte en solo 8.",
    price: 22.00,
    image: "/pequeno-dilema.png",
    badge: null,
  },
  {
    id: "duo-dilema",
    name: "Dúo Dilema",
    desc: "14 alitas con papas francesas y 2 salsas para hacer lo que se te antoje. Spoiler: el arrepentimiento llega después, no durante.",
    price: 34.00,
    image: "/duo-dilema.png",
    badge: "MÁS PEDIDO",
  },
  {
    id: "santo-pecado",
    name: "Santo Pecado",
    desc: "20 alitas, papas francesas y 3 salsas para combinar sin culpa. Para los que no entienden el concepto de 'suficiente'.",
    price: 47.00,
    image: "/todos-pecan.png",
    badge: "PARA COMPARTIR",
  },
];

const ENSALADAS = [
  {
    id: "ensalada-clasica",
    name: "Clásica Fresh Bowl",
    desc: "Lechuga bogi, tomate cherry, pepino, zanahoria, maíz americano, palta y huevo. Con vinagreta clásica de la casa.",
    price: 18.50,
    image: "/clasica-fresh-bowl.png",
    badge: null,
  },
  {
    id: "ensalada-proteica",
    name: "César Power Bowl",
    desc: "Lechuga romana, pollo grillado, tomate cherry, crutones y parmesano. Con salsa César cremosa de la casa.",
    price: 22.50,
    image: "/cesar-power-bowl.png",
    badge: null,
  },
  {
    id: "ensalada-caesar",
    name: "Protein Fit Bowl",
    desc: "Mix de hojas verdes, quinua, palta, tomate cherry, semillas y pollo grillado. Con aderezo de yogurt griego.",
    price: 23.50,
    image: "/protein-fit-bowl.png",
    badge: null,
  },
  {
    id: "ensalada-mediterranea",
    name: "Tuna Fresh Bowl",
    desc: "Lechuga romana, atún en trozos, tomate cherry, pepino, choclo, palta y huevo. Aderezo a elección.",
    price: 23.50,
    image: "/4.png",
    badge: null,
  },
  {
    id: "cobb-supreme-bowl",
    name: "Cobb Supreme Bowl",
    desc: "Lechuga fresca con pollo grillado, tocino ahumado crocante, queso fresco, tomate en dados, huevo cocido y palta en cubos. Vinagreta de la casa.",
    price: 23.50,
    image: "/cobb.png",
    badge: null,
  },
  {
    id: "crispy-chicken-bowl",
    name: "Crispy Chicken Bowl",
    desc: "Mix de hojas verdes con pollo crispy dorado, maíz americano, queso mozzarella, tomate cherry y palta. Aderezo honey mustard.",
    price: 22.50,
    image: "/crispy.png",
    badge: "FAVORITA",
  },
  {
    id: "pasta-power-bowl",
    name: "Pasta Power Bowl",
    desc: "Fideos tornillo con zanahoria, maíz, arvejitas, jamón, brócoli y pollo grillado en dados. Bañados con nuestro aderezo especial.",
    price: 22.50,
    image: "/pasta.png",
    badge: null,
  },
];

const TACOS_SABORES = [
  {
    id: "crunch",
    name: "Crunch Supreme Taco",
    tagline: "Crujiente y tentador",
    desc: "Pollo crispy dorado, lechuga fresca, pico de gallo, aros de cebolla crunchy, aioli y salsa BBQ cremosa. Tortilla soft.",
    image: "/crunch.png",
  },
  {
    id: "tex",
    name: "Tex Supreme Taco",
    tagline: "Con ese toque tex-mex",
    desc: "Pollo crispy, lechuga fresca, guacamole cremoso, pico de gallo, aros de cebolla crunchy y cilantro dressing. Tortilla soft.",
    image: "/tex.png",
  },
  {
    id: "bacon",
    name: "Bacon Deluxe Taco",
    tagline: "El que lo prueba, repite",
    desc: "Pollo crispy, bacon crocante, cheddar fundido, pimientos y cebolla salteados, lechuga fresca, pico de gallo y salsa especial. Tortilla soft.",
    image: "/bacon.png",
  },
];

const COMBOS = [
  {
    id: "combo-chiguan",
    name: "Combo Chiguan",
    emoji: "🔥",
    desc: "4 Alitas de pollo con tu salsa + Crunch Supreme Taco. Alitas meets street food.",
    items: ["4 alitas · salsa a elección", "Crunch Supreme Taco + nachos"],
    price: 20.00,
    badge: "ENTRY LEVEL",
    color: "#f97316",
    glow: "rgba(249,115,22,0.5)",
  },
  {
    id: "combo-perfecto",
    name: "Combo Perfecto",
    emoji: "🥗",
    desc: "Pequeño Dilema + Ensalada FIT a elección. Balance que no miente.",
    items: ["Pequeño Dilema · 8 alitas + papas", "Ensalada FIT a elección"],
    price: 40.00,
    badge: "POPULAR",
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.5)",
  },
  {
    id: "combo-especial",
    name: "Combo Especial",
    emoji: "🌮",
    desc: "Pequeño Dilema + Dúo de Tacos. La combinación que nadie esperaba pero todos necesitaban.",
    items: ["Pequeño Dilema · 8 alitas + papas", "Dúo de Tacos · 2 sabores"],
    price: 42.00,
    badge: null,
    color: "#34d399",
    glow: "rgba(52,211,153,0.5)",
  },
  {
    id: "combo-santo",
    name: "Combo Santo Dilema",
    emoji: "🍗",
    desc: "Dúo Dilema + Ensalada FIT + Dúo de Tacos. Cuando no puedes decidir, la respuesta siempre es las tres.",
    items: ["Dúo Dilema · 14 alitas + papas", "Ensalada FIT a elección", "Dúo de Tacos · 2 sabores"],
    price: 76.00,
    badge: "PARA COMPARTIR",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.5)",
  },
];

const EXTRAS = [
  { name: "Extra papas fritas", price: 5.00, emoji: "🍟" },
  { name: "Extra salsa para alitas", price: 3.00, emoji: "🥫" },
  { name: "Extra aderezo para ensaladas", price: 3.00, emoji: "🥗" },
];

const BEBIDAS = [
  { name: "Inka Cola 500ml", price: 4.00, emoji: "🟡" },
  { name: "Coca Cola 500ml", price: 4.00, emoji: "🔴" },
  { name: "Fanta 500ml", price: 4.00, emoji: "🟠" },
  { name: "Sprite 500ml", price: 4.00, emoji: "🟢" },
  { name: "Agua mineral", price: 3.00, emoji: "💧" },
];

// ─── SECCIONES NAV ────────────────────────────────────────────────────────────

const SECCIONES = [
  { id: "alitas",    label: "Alitas",    emoji: "🍗", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  { id: "ensaladas", label: "Ensaladas", emoji: "🥗", color: "#06b6d4", bg: "rgba(6,182,212,0.15)" },
  { id: "tacos",     label: "Tacos",     emoji: "🌮", color: "#34d399", bg: "rgba(52,211,153,0.15)" },
  { id: "combos",    label: "Combos",    emoji: "🔥", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  { id: "extras",    label: "Extras",    emoji: "🍟", color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
];

// ─── COMPONENTES ──────────────────────────────────────────────────────────────

function WaButton({ label = "Pedir por WhatsApp", full = false }: { label?: string; full?: boolean }) {
  return (
    <a
      href={WA_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2.5 font-black text-sm tracking-wide rounded-2xl px-6 py-3.5 transition-all active:scale-95 ${full ? "w-full" : ""}`}
      style={{
        background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
        color: "#fff",
        boxShadow: "0 4px 20px rgba(37,211,102,0.4)",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.528 5.845L0 24l6.334-1.508A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.002-1.367l-.358-.213-3.76.895.952-3.667-.234-.376A9.818 9.818 0 0 1 2.182 12c0-5.42 4.398-9.818 9.818-9.818 5.42 0 9.818 4.398 9.818 9.818 0 5.42-4.398 9.818-9.818 9.818z"/>
      </svg>
      {label}
    </a>
  );
}

function SectionHeader({ id, emoji, label, color, glow, sub }: {
  id: string; emoji: string; label: string; color: string; glow: string; sub: string;
}) {
  return (
    <div id={id} className="pt-6 pb-4 px-4">
      <div className="flex items-center gap-3 mb-1">
        <div
          className="w-1.5 h-10 rounded-full flex-shrink-0"
          style={{ background: color, boxShadow: `0 0 12px ${glow}` }}
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <h2
              className="text-3xl leading-none"
              style={{
                fontFamily: "var(--font-graffiti, 'Lilita One', sans-serif)",
                color,
                textShadow: `0 0 20px ${glow}, 0 0 40px ${glow}`,
              }}
            >
              {label}
            </h2>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em" }}>
            {sub}
          </p>
        </div>
      </div>
    </div>
  );
}

function PrecioTag({ price }: { price: number }) {
  return (
    <span
      className="text-xl font-black tabular-nums"
      style={{
        color: "#f59e0b",
        textShadow: "0 0 12px rgba(245,158,11,0.6)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      S/ {price.toFixed(2)}
    </span>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function CartaPage() {
  const navRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("alitas");

  // Scroll activo en sección
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const topEntry = visible.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          )[0];
          setActiveSection(topEntry.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    SECCIONES.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 110; // header + nav height
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <main style={{ background: "#0a0a0a", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ── HEADER ── */}
      <header
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #111 0%, #0a0a0a 100%)",
          borderBottom: "1px solid rgba(245,158,11,0.2)",
        }}
      >
        {/* Glow decorativo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245,158,11,0.12), transparent)",
          }}
        />
        <div className="relative z-10 max-w-xl mx-auto px-5 py-6 text-center">
          <Image
            src="/logoprincipal.png"
            alt="Santo Dilema"
            width={80}
            height={80}
            className="mx-auto mb-3 drop-shadow-lg"
            style={{ filter: "drop-shadow(0 0 16px rgba(245,158,11,0.5))" }}
          />
          <h1
            className="text-4xl mb-1"
            style={{
              fontFamily: "var(--font-graffiti, 'Lilita One', sans-serif)",
              color: "#f59e0b",
              textShadow: "0 0 24px rgba(245,158,11,0.7), 0 0 48px rgba(245,158,11,0.4)",
              letterSpacing: "-0.01em",
            }}
          >
            Nuestra Carta
          </h1>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.12em" }}>
            DARK KITCHEN · CHANCAY
          </p>
          <WaButton label="Pedir ahora por WhatsApp" />
        </div>
      </header>

      {/* ── NAV STICKY ── */}
      <div
        ref={navRef}
        className="sticky top-0 z-20 overflow-x-auto scrollbar-hide"
        style={{
          background: "rgba(10,10,10,0.97)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-1 px-3 py-2 min-w-max">
          {SECCIONES.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => scrollTo(sec.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all active:scale-95"
                style={{
                  color: isActive ? sec.color : "rgba(255,255,255,0.45)",
                  background: isActive ? sec.bg : "transparent",
                  border: `1px solid ${isActive ? sec.color + "60" : "transparent"}`,
                  boxShadow: isActive ? `0 0 12px ${sec.bg}` : "none",
                }}
              >
                <span>{sec.emoji}</span>
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-xl mx-auto">

        {/* ════════════ ALITAS ════════════ */}
        <section>
          <SectionHeader
            id="alitas"
            emoji="🍗"
            label="Alitas"
            color="#ef4444"
            glow="rgba(239,68,68,0.6)"
            sub="Premium Wings"
          />

          {/* Imagen carta */}
          <div className="px-4 mb-4">
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{ border: "1px solid rgba(239,68,68,0.3)", boxShadow: "0 0 20px rgba(239,68,68,0.15)" }}
            >
              <Image
                src="/carta-alitas.jpeg"
                alt="Carta de Alitas Santo Dilema"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
                priority
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(10,10,10,0.4) 0%, transparent 50%)" }}
              />
            </div>
          </div>

          {/* Salsas */}
          <div className="px-4 mb-4">
            <div
              className="rounded-2xl p-4"
              style={{ background: "#111", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <p className="text-xs font-black mb-3" style={{ color: "#ef4444", letterSpacing: "0.12em" }}>
                🌶 8 SALSAS A ELECCIÓN
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SALSAS.map((s) => (
                  <span
                    key={s}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      color: "rgba(255,255,255,0.7)",
                      border: "1px solid rgba(239,68,68,0.25)",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="px-4 space-y-3 mb-6">
            {ALITAS.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl overflow-hidden flex gap-0"
                style={{
                  background: "#141414",
                  border: "1px solid rgba(239,68,68,0.2)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                }}
              >
                <div className="relative w-[110px] flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="110px"
                  />
                </div>
                <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-black text-white leading-tight">{item.name}</h3>
                      {item.badge && (
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                          style={{
                            background: "rgba(239,68,68,0.2)",
                            color: "#f87171",
                            border: "1px solid rgba(239,68,68,0.4)",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {item.desc}
                    </p>
                  </div>
                  <PrecioTag price={item.price} />
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 pb-8">
            <WaButton label="Pedir Alitas 🍗" full />
          </div>
        </section>

        {/* ════════════ ENSALADAS ════════════ */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <SectionHeader
            id="ensaladas"
            emoji="🥗"
            label="Ensaladas"
            color="#06b6d4"
            glow="rgba(6,182,212,0.6)"
            sub="Premium Salads · Bowls Saludables"
          />

          <div className="px-4 mb-4">
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{ border: "1px solid rgba(6,182,212,0.3)", boxShadow: "0 0 20px rgba(6,182,212,0.15)" }}
            >
              <Image
                src="/carta-ensaladas.jpeg"
                alt="Carta de Ensaladas Santo Dilema"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(10,10,10,0.4) 0%, transparent 50%)" }}
              />
            </div>
          </div>

          <div className="px-4 space-y-3 mb-6">
            {ENSALADAS.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl overflow-hidden flex"
                style={{
                  background: "#141414",
                  border: "1px solid rgba(6,182,212,0.2)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                }}
              >
                <div className="relative w-[110px] flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="110px"
                  />
                </div>
                <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-black text-white leading-tight">{item.name}</h3>
                      {item.badge && (
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                          style={{
                            background: "rgba(6,182,212,0.2)",
                            color: "#22d3ee",
                            border: "1px solid rgba(6,182,212,0.4)",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {item.desc}
                    </p>
                  </div>
                  <PrecioTag price={item.price} />
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 pb-8">
            <WaButton label="Pedir Ensalada 🥗" full />
          </div>
        </section>

        {/* ════════════ TACOS ════════════ */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <SectionHeader
            id="tacos"
            emoji="🌮"
            label="Tacos"
            color="#34d399"
            glow="rgba(52,211,153,0.6)"
            sub="Authentic Street Tacos"
          />

          <div className="px-4 mb-4">
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{ border: "1px solid rgba(52,211,153,0.3)", boxShadow: "0 0 20px rgba(52,211,153,0.15)" }}
            >
              <Image
                src="/carta-tacos.jpeg"
                alt="Carta de Tacos Santo Dilema"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(10,10,10,0.4) 0%, transparent 50%)" }}
              />
            </div>
          </div>

          {/* Formato único */}
          <div className="px-4 mb-4">
            <div
              className="rounded-2xl p-4 flex items-center justify-between"
              style={{ background: "#111", border: "1px solid rgba(52,211,153,0.25)" }}
            >
              <div>
                <p className="text-base font-black text-white leading-none">Dúo de Tacos</p>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Elige 2 sabores · incluye complemento
                </p>
              </div>
              <PrecioTag price={24.90} />
            </div>
          </div>

          {/* Sabores */}
          <div className="px-4 mb-3">
            <p className="text-xs font-black mb-3" style={{ color: "#34d399", letterSpacing: "0.1em" }}>
              🌮 ELIGE TUS 2 SABORES
            </p>
            <div className="space-y-3">
              {TACOS_SABORES.map((taco) => (
                <div
                  key={taco.id}
                  className="rounded-2xl overflow-hidden flex"
                  style={{
                    background: "#141414",
                    border: "1px solid rgba(52,211,153,0.2)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                  }}
                >
                  <div className="relative w-[100px] flex-shrink-0">
                    <Image
                      src={`/${taco.id}.png`}
                      alt={taco.name}
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  </div>
                  <div className="flex-1 p-3.5">
                    <p className="text-sm font-black text-white leading-tight mb-0.5">{taco.name}</p>
                    <p className="text-[10px] font-semibold mb-1.5" style={{ color: "#34d399" }}>
                      {taco.tagline}
                    </p>
                    <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {taco.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complemento */}
          <div className="px-4 mb-6">
            <div
              className="rounded-2xl p-3.5"
              style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}
            >
              <p className="text-[11px] font-black mb-2" style={{ color: "#34d399", letterSpacing: "0.08em" }}>
                🌽 INCLUYE COMPLEMENTO A ELECCIÓN
              </p>
              <div className="flex gap-2 flex-wrap">
                {["Nachos 🌽", "Chifles 🍌", "Papas fritas 🍟"].map((c) => (
                  <span
                    key={c}
                    className="text-xs px-3 py-1 rounded-full font-semibold"
                    style={{ background: "rgba(52,211,153,0.1)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(52,211,153,0.2)" }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 pb-8">
            <WaButton label="Pedir Tacos 🌮" full />
          </div>
        </section>

        {/* ════════════ COMBOS ════════════ */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <SectionHeader
            id="combos"
            emoji="🔥"
            label="Combos"
            color="#f59e0b"
            glow="rgba(245,158,11,0.6)"
            sub="Best Value Deals · Ahorra más"
          />

          <div className="px-4 mb-4">
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{ border: "1px solid rgba(245,158,11,0.3)", boxShadow: "0 0 20px rgba(245,158,11,0.15)" }}
            >
              <Image
                src="/carta-combos.jpeg"
                alt="Carta de Combos Santo Dilema"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(10,10,10,0.4) 0%, transparent 50%)" }}
              />
            </div>
          </div>

          <div className="px-4 space-y-3 mb-6">
            {COMBOS.map((combo) => (
              <div
                key={combo.id}
                className="rounded-2xl p-4"
                style={{
                  background: "#141414",
                  border: `1px solid ${combo.color}40`,
                  boxShadow: `0 2px 16px rgba(0,0,0,0.4), 0 0 0 1px ${combo.color}10 inset`,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{combo.emoji}</span>
                    <div>
                      <h3 className="text-base font-black text-white leading-tight">{combo.name}</h3>
                      {combo.badge && (
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full mt-0.5 inline-block"
                          style={{
                            background: `${combo.color}25`,
                            color: combo.color,
                            border: `1px solid ${combo.color}50`,
                          }}
                        >
                          {combo.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  <PrecioTag price={combo.price} />
                </div>
                <p className="text-[11px] mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {combo.desc}
                </p>
                <div className="space-y-1">
                  {combo.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{ background: combo.color }}
                      />
                      <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 pb-8">
            <WaButton label="Pedir Combo 🔥" full />
          </div>
        </section>

        {/* ════════════ EXTRAS Y BEBIDAS ════════════ */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <SectionHeader
            id="extras"
            emoji="🍟"
            label="Extras & Bebidas"
            color="#a78bfa"
            glow="rgba(167,139,250,0.6)"
            sub="Para completar tu pedido"
          />

          <div className="px-4 space-y-3 mb-6">
            {/* Extras */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "#141414", border: "1px solid rgba(167,139,250,0.2)" }}
            >
              <div
                className="px-4 py-2.5"
                style={{ background: "rgba(167,139,250,0.08)", borderBottom: "1px solid rgba(167,139,250,0.15)" }}
              >
                <p className="text-xs font-black" style={{ color: "#a78bfa", letterSpacing: "0.1em" }}>
                  🍟 EXTRAS
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                {EXTRAS.map((item) => (
                  <div key={item.name} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{item.emoji}</span>
                      <span className="text-sm font-semibold text-white">{item.name}</span>
                    </div>
                    <PrecioTag price={item.price} />
                  </div>
                ))}
              </div>
            </div>

            {/* Bebidas */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "#141414", border: "1px solid rgba(167,139,250,0.2)" }}
            >
              <div
                className="px-4 py-2.5"
                style={{ background: "rgba(167,139,250,0.08)", borderBottom: "1px solid rgba(167,139,250,0.15)" }}
              >
                <p className="text-xs font-black" style={{ color: "#a78bfa", letterSpacing: "0.1em" }}>
                  🥤 BEBIDAS
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                {BEBIDAS.map((item) => (
                  <div key={item.name} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{item.emoji}</span>
                      <span className="text-sm font-semibold text-white">{item.name}</span>
                    </div>
                    <PrecioTag price={item.price} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER CTA ── */}
        <div
          className="px-4 pb-12 pt-2"
          style={{ background: "linear-gradient(180deg, transparent 0%, rgba(245,158,11,0.04) 100%)" }}
        >
          <div
            className="rounded-3xl p-6 text-center"
            style={{
              background: "linear-gradient(135deg, #1a1a1a 0%, #111 100%)",
              border: "1px solid rgba(245,158,11,0.25)",
              boxShadow: "0 0 40px rgba(245,158,11,0.08)",
            }}
          >
            <Image
              src="/logoprincipal.png"
              alt="Santo Dilema"
              width={56}
              height={56}
              className="mx-auto mb-3"
              style={{ filter: "drop-shadow(0 0 10px rgba(245,158,11,0.5))" }}
            />
            <h3
              className="text-2xl mb-1"
              style={{
                fontFamily: "var(--font-graffiti, 'Lilita One', sans-serif)",
                color: "#f59e0b",
                textShadow: "0 0 16px rgba(245,158,11,0.5)",
              }}
            >
              ¿Listo para pedir?
            </h3>
            <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
              Escríbenos por WhatsApp y te atendemos al instante
            </p>
            <WaButton label="Hacer mi pedido ahora" full />
            <p className="text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>
              Delivery en Chancay · Jue – Dom · 6:30 PM – 11:00 PM
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
