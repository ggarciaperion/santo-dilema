"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import YunzaModal from "@/components/YunzaModal";
import SorteoMundialModal from "@/app/components/SorteoMundialModal";

const LAUNCH_DATE = new Date('2026-02-13T23:30:00Z');

const SECTIONS = [
  {
    id: "fit",
    href: "/fit",
    label: "ENSALADAS",
    sub: "Premium Salads",
    images: ["/gh.jpeg"],
    emoji: "🥗",
    textColor: "#06b6d4",
    borderColor: "rgba(6,182,212,0.7)",
    glowRgb: "6,182,212",
    gradientColor: "rgba(6,182,212,0.25)",
    neonClass: "neon-glow-fit",
  },
  {
    id: "fat",
    href: "/fat",
    label: "ALITAS",
    sub: "Premium Wings",
    images: ["/jh.jpeg"],
    emoji: "🍗",
    textColor: "#f87171",
    borderColor: "rgba(248,113,113,0.7)",
    glowRgb: "239,68,68",
    gradientColor: "rgba(239,68,68,0.25)",
    neonClass: "neon-glow-fat",
  },
  {
    id: "taco",
    href: "/tacos",
    label: "TACOS",
    sub: "Authentic Tacos",
    images: ["/bl.jpeg"],
    emoji: "🌮",
    textColor: "#34d399",
    borderColor: "rgba(52,211,153,0.7)",
    glowRgb: "16,185,129",
    gradientColor: "rgba(16,185,129,0.25)",
    neonClass: "neon-glow-taco",
  },
  {
    id: "combos",
    href: "/combos",
    label: "COMBOS",
    sub: "Best Value Deals",
    images: ["/yy.jpeg"],
    emoji: "🔥",
    textColor: "#fbbf24",
    borderColor: "rgba(251,191,36,0.7)",
    glowRgb: "245,158,11",
    gradientColor: "rgba(245,158,11,0.25)",
    neonClass: "gold-glow",
  },
];

const BURGER_SECTION = {
  id: "burgers",
  href: "/burgers",
  label: "MINI BURGERS",
  sub: "Smash Burgers · 6 Tentaciones",
  images: ["/burger-hero.jpeg"],
  emoji: "🍔",
  textColor: "#fb923c",
  borderColor: "rgba(251,146,60,0.7)",
  glowRgb: "251,146,60",
  gradientColor: "rgba(251,146,60,0.2)",
  badge: "NUEVO",
};

export default function Home() {
  const [showIntro, setShowIntro]         = useState(true);
  const [introExiting, setIntroExiting]   = useState(false);
  const [cardsVisible, setCardsVisible]   = useState(false);
  const [hoveredCard, setHoveredCard]     = useState<string | null>(null);
  const [showYunzaModal, setShowYunzaModal]       = useState(false);
  const [showComunicado, setShowComunicado]       = useState(false);
  const [showDiaTrabajador, setShowDiaTrabajador] = useState(false);
  const [isMobile, setIsMobile]                   = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const MOBILE_IMAGES: Record<string, string> = {
    fit: "/gh.jpeg",
    fat: "/jh.jpeg",
    taco: "/bl.jpeg",
    combos: "/yy.jpeg",
    burgers: "/burger-hero.jpeg",
  };

  // Intro timing: fade out at 2.1s, unmount at 2.6s
  useEffect(() => {
    const t1 = setTimeout(() => setIntroExiting(true), 2100);
    const t2 = setTimeout(() => { setShowIntro(false); setCardsVisible(true); }, 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    // YUNZA DESACTIVADA - Promoción finalizada
  }, []);

  useEffect(() => {
    const DEADLINE = new Date('2026-04-04T04:59:00Z');
    if (new Date() < DEADLINE) setShowComunicado(true);
  }, []);

  useEffect(() => {
    const DEADLINE = new Date('2026-05-02T04:59:00Z');
    if (new Date() < DEADLINE) setShowDiaTrabajador(true);
  }, []);


  return (
    <main className="h-[100dvh] w-screen bg-black overflow-hidden relative">

      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes introLogoIn {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes introTaglineIn {
          from { opacity: 0; letter-spacing: 0.5em; }
          to   { opacity: 1; letter-spacing: 0.35em; }
        }
        @keyframes expandLine {
          from { width: 0; }
          to   { width: 180px; }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.06; }
          50%       { opacity: 0.12; }
        }
        @keyframes cardReveal {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes burgerCardReveal {
          from { opacity: 0; transform: scale(0.78); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes burgerGlow {
          0%, 100% { box-shadow: 0 0 18px rgba(251,146,60,0.35), inset 0 0 10px rgba(251,146,60,0.08); }
          50%       { box-shadow: 0 0 34px rgba(251,146,60,0.65), inset 0 0 16px rgba(251,146,60,0.18); }
        }
      `}</style>

      {/* ── INTRO OVERLAY ── */}
      {showIntro && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
          style={{ transition: "opacity 0.5s ease", opacity: introExiting ? 0 : 1 }}
        >
          {/* Animated grid background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(245,158,11,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.15) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              animation: "gridPulse 2s ease-in-out infinite",
            }}
          />

          {/* Radial glow behind logo */}
          <div
            className="absolute"
            style={{
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />

          {/* Logo */}
          <div
            className="relative z-10 text-center select-none flex flex-col items-center"
            style={{ animation: "introLogoIn 0.9s cubic-bezier(0.22,1,0.36,1) both" }}
          >
            <div
              style={{
                filter:
                  "drop-shadow(0 0 20px rgba(245,158,11,0.7)) drop-shadow(0 0 50px rgba(245,158,11,0.35)) drop-shadow(0 0 90px rgba(245,158,11,0.15))",
              }}
            >
              <Image
                src="/logoprincipal.png"
                alt="Santo Dilema"
                width={320}
                height={320}
                priority
                className="w-[clamp(160px,40vw,300px)] h-auto"
                style={{ objectFit: "contain" }}
              />
            </div>

            {/* Divider line */}
            <div
              className="mx-auto h-px mt-4"
              style={{
                background: "linear-gradient(90deg, transparent, #fbbf24, transparent)",
                animation: "expandLine 0.7s ease-out 0.5s both",
                width: 0,
              }}
            />

            {/* Tagline */}
            <p
              className="text-amber-400/70 font-bold mt-3 uppercase"
              style={{
                fontSize: "0.72rem",
                letterSpacing: "0.35em",
                animation: "introTaglineIn 0.8s ease-out 0.7s both",
                opacity: 0,
              }}
            >
              PREMIUM DARK KITCHEN
            </p>
          </div>
        </div>
      )}

      {/* ── LAYOUT: 5-card composition (4 corners + center burger) ── */}
      <div className="relative h-full w-full">

        {/* Corner cards: 2×2 grid */}
        <div className="grid grid-cols-2 grid-rows-2 h-full w-full">
          {SECTIONS.map((sec, i) => {
            const isRight  = sec.id === "fat"   || sec.id === "combos";
            const isBottom = sec.id === "taco"  || sec.id === "combos";
            return (
              <Link
                key={sec.id}
                href={sec.href}
                className="relative overflow-hidden group"
                onMouseEnter={() => setHoveredCard(sec.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onTouchStart={() => setHoveredCard(sec.id)}
                onTouchEnd={() => setTimeout(() => setHoveredCard(null), 200)}
                style={{
                  opacity: cardsVisible ? 1 : 0,
                  animation: cardsVisible
                    ? `cardReveal 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 0.08}s both`
                    : "none",
                  filter:
                    hoveredCard && hoveredCard !== sec.id
                      ? "brightness(0.45)"
                      : "brightness(1)",
                  transition: "filter 0.3s ease",
                }}
              >
                {/* Background image */}
                {sec.images.length > 1 ? (
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                    {sec.images.map((src, idx) => (
                      <div key={idx} className="relative overflow-hidden">
                        <Image
                          src={src}
                          alt=""
                          fill
                          className="object-cover"
                          style={{
                            filter: "brightness(0.38)",
                            transition: "transform 0.6s ease",
                            transform: hoveredCard === sec.id ? "scale(1.08)" : "scale(1)",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Image
                    src={isMobile && MOBILE_IMAGES[sec.id] ? MOBILE_IMAGES[sec.id] : sec.images[0]}
                    alt={sec.label}
                    fill
                    className="object-cover"
                    style={{
                      filter: "brightness(0.35)",
                      transition: "transform 0.6s ease",
                      transform: hoveredCard === sec.id ? "scale(1.08)" : "scale(1)",
                      objectPosition: sec.id === "fit" ? "65% center" : sec.id === "combos" ? "65% center" : "center",
                    }}
                  />
                )}

                {/* Color gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${sec.gradientColor} 0%, rgba(0,0,0,0.55) 100%)`,
                    opacity: hoveredCard === sec.id ? 1 : 0.6,
                    transition: "opacity 0.4s ease",
                  }}
                />

                {/* Neon border */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    border: `2px solid ${sec.borderColor}`,
                    boxShadow: hoveredCard === sec.id
                      ? `inset 0 0 40px rgba(${sec.glowRgb},0.25)`
                      : `inset 0 0 20px rgba(${sec.glowRgb},0.08)`,
                    opacity: hoveredCard === sec.id ? 1 : 0.45,
                    transition: "opacity 0.3s ease, box-shadow 0.3s ease",
                  }}
                />

                {/* Content — pushed to outer corner */}
                <div
                  className={`absolute inset-0 flex flex-col p-4 sm:p-5 ${
                    isRight ? "items-end" : "items-start"
                  } ${isBottom ? "justify-end" : "justify-start"}`}
                >
                  <span
                    className="select-none mb-1"
                    style={{
                      fontSize: "clamp(1.6rem, 3.8vw, 2.4rem)",
                      filter: hoveredCard === sec.id
                        ? `drop-shadow(0 0 12px rgba(${sec.glowRgb},0.8))`
                        : "none",
                      transform: hoveredCard === sec.id ? "scale(1.15)" : "scale(1)",
                      transition: "transform 0.3s ease, filter 0.3s ease",
                      display: "block",
                      transformOrigin: isRight ? "right center" : "left center",
                    }}
                  >
                    {sec.emoji}
                  </span>

                  <h2
                    className="font-black leading-none tracking-widest"
                    style={{
                      fontFamily: "var(--font-graffiti)",
                      fontSize: "clamp(1.6rem, 4vw, 2.8rem)",
                      color: sec.textColor,
                      textShadow: hoveredCard === sec.id
                        ? `0 0 15px rgba(${sec.glowRgb},0.9), 0 0 35px rgba(${sec.glowRgb},0.5), 0 0 60px rgba(${sec.glowRgb},0.25)`
                        : `0 0 10px rgba(${sec.glowRgb},0.5)`,
                      transition: "text-shadow 0.3s ease",
                    }}
                  >
                    {sec.label}
                  </h2>

                  <p
                    className={`font-bold uppercase tracking-widest mt-1 ${isRight ? "text-right" : ""}`}
                    style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.18em" }}
                  >
                    {sec.sub}
                  </p>

                  <div
                    style={{
                      marginTop: 8,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "5px 14px",
                      border: `1.5px solid ${sec.borderColor}`,
                      borderRadius: 999,
                      opacity: hoveredCard === sec.id ? 1 : 0.65,
                      transform: hoveredCard === sec.id ? "scale(1.04)" : "scale(1)",
                      transition: "opacity 0.3s ease, transform 0.3s ease",
                      boxShadow: hoveredCard === sec.id ? `0 0 14px rgba(${sec.glowRgb},0.4)` : "none",
                    }}
                  >
                    <span
                      className="font-black"
                      style={{ color: sec.textColor, fontSize: "0.6rem", letterSpacing: "0.15em" }}
                    >
                      VER MENÚ →
                    </span>
                  </div>
                </div>

                {/* Neon accent line — outer edge */}
                <div
                  className={`absolute ${isBottom ? "bottom-0" : "top-0"} left-0 right-0 h-px pointer-events-none`}
                  style={{
                    background: `linear-gradient(90deg, transparent, rgba(${sec.glowRgb},0.8), transparent)`,
                    opacity: hoveredCard === sec.id ? 1 : 0,
                    transition: "opacity 0.3s ease",
                  }}
                />
              </Link>
            );
          })}
        </div>

        {/* ── CENTER CARD: Mini Burgers ── */}
        <div
          className="absolute z-20"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }}
        >
          <Link
            href={BURGER_SECTION.href}
            className="relative block overflow-hidden active:opacity-75"
            onMouseEnter={() => setHoveredCard(BURGER_SECTION.id)}
            onMouseLeave={() => setHoveredCard(null)}
            onTouchStart={() => setHoveredCard(BURGER_SECTION.id)}
            onTouchEnd={() => setTimeout(() => setHoveredCard(null), 200)}
            style={{
              pointerEvents: "auto",
              width: "clamp(180px, 52vw, 320px)",
              aspectRatio: "1 / 1",
              borderRadius: "16px",
              display: "block",
              ...(cardsVisible ? {} : { opacity: 0 }),
              animation: cardsVisible
                ? "burgerCardReveal 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.35s both"
                : "none",
              filter:
                hoveredCard && hoveredCard !== BURGER_SECTION.id
                  ? "brightness(0.45)"
                  : "brightness(1)",
              transition: "filter 0.3s ease",
            }}
          >
            {/* Background image */}
            <Image
              src={BURGER_SECTION.images[0]}
              alt="Mini Burgers"
              fill
              className="object-cover"
              style={{
                filter: "brightness(0.32)",
                objectPosition: "center 35%",
                transition: "transform 0.6s ease",
                transform: hoveredCard === BURGER_SECTION.id ? "scale(1.1)" : "scale(1)",
              }}
            />

            {/* Radial gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at center, ${BURGER_SECTION.gradientColor} 0%, rgba(0,0,0,0.65) 100%)`,
                opacity: hoveredCard === BURGER_SECTION.id ? 1 : 0.75,
                transition: "opacity 0.4s ease",
              }}
            />

            {/* Animated glow border */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: "16px",
                border: `2px solid ${BURGER_SECTION.borderColor}`,
                opacity: hoveredCard === BURGER_SECTION.id ? 1 : 0.75,
                transition: "opacity 0.4s ease",
                ...(hoveredCard === BURGER_SECTION.id
                  ? { boxShadow: `0 0 30px rgba(${BURGER_SECTION.glowRgb},0.8), inset 0 0 20px rgba(${BURGER_SECTION.glowRgb},0.2)`, animation: "none" }
                  : { animation: "burgerGlow 2.8s ease-in-out infinite" }
                ),
              }}
            />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 py-3">
              {/* NUEVO badge */}
              <span
                className="font-black text-black uppercase mb-1.5"
                style={{
                  fontSize: "0.42rem",
                  background: BURGER_SECTION.textColor,
                  padding: "2px 7px",
                  borderRadius: 999,
                  letterSpacing: "0.14em",
                  boxShadow: `0 0 8px rgba(${BURGER_SECTION.glowRgb},0.6)`,
                }}
              >
                NUEVO
              </span>

              <span
                className="select-none mb-0.5"
                style={{
                  fontSize: "clamp(1.4rem, 3.5vw, 2rem)",
                  filter: hoveredCard === BURGER_SECTION.id
                    ? `drop-shadow(0 0 12px rgba(${BURGER_SECTION.glowRgb},0.9))`
                    : `drop-shadow(0 0 6px rgba(${BURGER_SECTION.glowRgb},0.5))`,
                  transform: hoveredCard === BURGER_SECTION.id ? "scale(1.2)" : "scale(1)",
                  transition: "transform 0.3s ease, filter 0.3s ease",
                  display: "block",
                }}
              >
                {BURGER_SECTION.emoji}
              </span>

              <h2
                className="font-black leading-none tracking-widest"
                style={{
                  fontFamily: "var(--font-graffiti)",
                  fontSize: "clamp(1rem, 3.2vw, 1.8rem)",
                  color: BURGER_SECTION.textColor,
                  textShadow: hoveredCard === BURGER_SECTION.id
                    ? `0 0 15px rgba(${BURGER_SECTION.glowRgb},0.9), 0 0 35px rgba(${BURGER_SECTION.glowRgb},0.5)`
                    : `0 0 10px rgba(${BURGER_SECTION.glowRgb},0.5)`,
                  transition: "text-shadow 0.3s ease",
                }}
              >
                {BURGER_SECTION.label}
              </h2>

              <p
                className="font-bold uppercase tracking-widest mt-0.5"
                style={{ fontSize: "0.46rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.14em", lineHeight: 1.5 }}
              >
                Smash Burgers
              </p>

              <div
                style={{
                  marginTop: 7,
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 12px",
                  border: `1.5px solid ${BURGER_SECTION.borderColor}`,
                  borderRadius: 999,
                  opacity: hoveredCard === BURGER_SECTION.id ? 1 : 0.7,
                  transition: "opacity 0.3s ease, box-shadow 0.3s ease",
                  boxShadow: hoveredCard === BURGER_SECTION.id
                    ? `0 0 16px rgba(${BURGER_SECTION.glowRgb},0.6)`
                    : "none",
                }}
              >
                <span
                  className="font-black"
                  style={{ color: BURGER_SECTION.textColor, fontSize: "0.55rem", letterSpacing: "0.12em" }}
                >
                  VER →
                </span>
              </div>
            </div>
          </Link>
        </div>

      </div>

      {/* ── LOGO + WHATSAPP (top center) ── */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none select-none">
        <Image
          src="/logoprincipal.png"
          alt="Santo Dilema"
          width={120}
          height={120}
          className="w-[80px] sm:w-[90px] h-auto"
          style={{ objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(245,158,11,0.4))" }}
        />
        <p
          className="font-bold tracking-widest"
          style={{
            fontSize: "0.65rem",
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.2em",
          }}
        >
          910 677 186
        </p>
        <p
          className="font-bold text-center"
          style={{
            fontSize: "0.7rem",
            color: "#ffffff",
            fontWeight: 800,
            letterSpacing: "0.12em",
            marginTop: "4px",
          }}
        >
          RESTAURANTE EN CHANCAY
        </p>
      </div>

      {/* ── DARK KITCHEN LABEL (bottom center) ── */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none">
        <p
          className="font-bold text-center"
          style={{
            fontSize: "0.55rem",
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.3em",
          }}
        >
          PREMIUM DARK KITCHEN · DELIVERY ONLY
        </p>
      </div>

      {/* ── MODALS / BANNERS ── */}
      <YunzaModal isOpen={showYunzaModal} onClose={() => setShowYunzaModal(false)} />
      <SorteoMundialModal />

      {showDiaTrabajador && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setShowDiaTrabajador(false)}
        >
          <div
            className="relative max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "linear-gradient(145deg, #1a0a00, #2d1200)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-2 w-full bg-gradient-to-r from-red-600 via-yellow-500 to-red-600" />
            <div className="px-7 py-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-black text-yellow-400 mb-1 tracking-tight">
                ¡Feliz Día del Trabajador!
              </h2>
              <p className="text-orange-300 text-sm font-semibold mb-6">
                1 de Mayo · Santo Dilema
              </p>
              <div
                className="rounded-xl px-5 py-4 mb-6"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,200,0,0.2)" }}
              >
                <p className="text-white text-base font-semibold mb-1">Hoy descansamos 🙌</p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  En este día especial no habrá atención.<br />
                  Volvemos <span className="text-yellow-400 font-bold">mañana</span> en el horario de siempre:
                </p>
                <p className="text-yellow-400 font-black text-lg mt-2">6:00 PM – 11:00 PM</p>
              </div>
              <button
                onClick={() => setShowDiaTrabajador(false)}
                className="w-full py-3 rounded-xl font-black text-base text-white transition-all hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(135deg, #c2410c, #ea580c)" }}
              >
                Entendido ✓
              </button>
            </div>
            <div className="h-2 w-full bg-gradient-to-r from-red-600 via-yellow-500 to-red-600" />
          </div>
        </div>
      )}

      {showComunicado && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setShowComunicado(false)}
        >
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src="/comunica.png"
              alt="Comunicado"
              width={500}
              height={500}
              className="w-full h-auto rounded-2xl shadow-2xl"
              priority
            />
            <button
              onClick={() => setShowComunicado(false)}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-lg font-black transition-all"
            >
              ×
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
