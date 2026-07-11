"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const WA_LINK = "https://wa.me/51910677186?text=Hola%20%F0%9F%91%8B%20quiero%20hacer%20un%20pedido";

const SECCIONES = [
  { id: "alitas",    label: "Alitas",    emoji: "🍗", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  { id: "ensaladas", label: "Ensaladas", emoji: "🥗", color: "#06b6d4", bg: "rgba(6,182,212,0.15)" },
  { id: "tacos",     label: "Tacos",     emoji: "🌮", color: "#34d399", bg: "rgba(52,211,153,0.15)" },
  { id: "combos",    label: "Combos",    emoji: "🔥", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
];

const IMAGENES = [
  { id: "alitas",    src: "/carta-alitas.jpeg",    alt: "Carta de Alitas",    color: "#ef4444", glow: "rgba(239,68,68,0.3)",    label: "Pedir Alitas 🍗",    emoji: "🍗", title: "Alitas",    sub: "Premium Wings" },
  { id: "ensaladas", src: "/carta-ensaladas.jpeg", alt: "Carta de Ensaladas", color: "#06b6d4", glow: "rgba(6,182,212,0.3)",    label: "Pedir Ensalada 🥗", emoji: "🥗", title: "Ensaladas", sub: "Premium Salads · Bowls Saludables" },
  { id: "tacos",     src: "/carta-tacos.jpeg",     alt: "Carta de Tacos",     color: "#34d399", glow: "rgba(52,211,153,0.3)",   label: "Pedir Tacos 🌮",    emoji: "🌮", title: "Tacos",     sub: "Authentic Street Tacos" },
  { id: "combos",    src: "/carta-combos.jpeg",    alt: "Carta de Combos",    color: "#f59e0b", glow: "rgba(245,158,11,0.3)",   label: "Pedir Combo 🔥",    emoji: "🔥", title: "Combos",    sub: "Best Value Deals · Ahorra más" },
];

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

export default function CartaPage() {
  const navRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("alitas");

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
    const top = el.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <main style={{ background: "#0a0a0a", minHeight: "100vh", overflowX: "hidden" }}>

      {/* HEADER */}
      <header
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #111 0%, #0a0a0a 100%)",
          borderBottom: "1px solid rgba(245,158,11,0.2)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245,158,11,0.12), transparent)" }}
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

      {/* NAV STICKY */}
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

      {/* SECCIONES */}
      <div className="max-w-xl mx-auto">
        {IMAGENES.map((sec, i) => (
          <section
            key={sec.id}
            style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined }}
          >
            {/* Título */}
            <div id={sec.id} className="pt-6 pb-4 px-4">
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-1.5 h-10 rounded-full flex-shrink-0"
                  style={{ background: sec.color, boxShadow: `0 0 12px ${sec.glow}` }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{sec.emoji}</span>
                    <h2
                      className="text-3xl leading-none"
                      style={{
                        fontFamily: "var(--font-graffiti, 'Lilita One', sans-serif)",
                        color: sec.color,
                        textShadow: `0 0 20px ${sec.glow}, 0 0 40px ${sec.glow}`,
                      }}
                    >
                      {sec.title}
                    </h2>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em" }}>
                    {sec.sub}
                  </p>
                </div>
              </div>
            </div>

            {/* Imagen carta */}
            <div className="px-4 mb-6">
              <div
                className="rounded-2xl overflow-hidden relative"
                style={{ border: `1px solid ${sec.color}50`, boxShadow: `0 0 20px ${sec.glow}` }}
              >
                <Image
                  src={sec.src}
                  alt={sec.alt}
                  width={600}
                  height={800}
                  className="w-full h-auto object-cover"
                  priority={i === 0}
                />
              </div>
            </div>

            {/* WA button */}
            <div className="px-4 pb-8">
              <WaButton label={sec.label} full />
            </div>
          </section>
        ))}

        {/* FOOTER CTA */}
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
