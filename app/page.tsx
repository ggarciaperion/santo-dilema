"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import YunzaModal from "@/components/YunzaModal";

// Fecha de lanzamiento: 13 Feb 2026 a las 18:30 hora Perú (UTC-5)
const LAUNCH_DATE = new Date('2026-02-13T23:30:00Z');

export default function Home() {
  const [hoveredSide, setHoveredSide] = useState<"fit" | "fat" | "taco" | null>(null);
  const [showYunzaModal, setShowYunzaModal] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isPreLaunch, setIsPreLaunch] = useState(false);
  const [showTarjetaBanner, setShowTarjetaBanner] = useState(false);
  const [showComunicado, setShowComunicado] = useState(false);

  useEffect(() => {
    // YUNZA DESACTIVADA - Promoción finalizada
    /*
    const timer = setTimeout(() => {
      setShowYunzaModal(true);
    }, 800);
    return () => clearTimeout(timer);
    */
  }, []);

  useEffect(() => {
    // Comunicado activo hasta el 3 de abril 2026 a las 12:00 hora Perú (UTC-5 = 17:00 UTC)
    const DEADLINE = new Date('2026-04-03T17:00:00Z');
    if (new Date() < DEADLINE) {
      setShowComunicado(true);
    }
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem("sd-tarjeta-banner-seen");
    if (!seen) {
      const timer = setTimeout(() => setShowTarjetaBanner(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const update = () => {
      const diff = LAUNCH_DATE.getTime() - Date.now();
      if (diff > 0) {
        setIsPreLaunch(true);
        setCountdown({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      } else {
        setIsPreLaunch(false);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="h-[100dvh] w-screen flex flex-col md:flex-row overflow-x-hidden bg-black relative">

      {/* Contenido principal */}
      {/* Fondo con textura oscura */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black opacity-90 z-0" />

      {/* Título principal dividido con neón - SANTO | DILEMA */}
      <div className={`absolute top-2 md:top-6 z-20 flex flex-col items-center justify-center transition-all duration-700 ease-out ${
        hoveredSide === "fit" ? "md:left-[22%]" : hoveredSide === "fat" ? "md:left-1/2" : hoveredSide === "taco" ? "md:left-[78%]" : "md:left-1/2"
      } left-1/2 transform -translate-x-1/2`}>
        <h1 className="flex items-center gap-2 md:gap-4 text-2xl md:text-4xl lg:text-6xl font-black tracking-tight">
          <span className="text-amber-400 gold-glow inline-flex items-center">
            <span className="relative inline-block">
              S
              <svg
                className="absolute -top-2 md:-top-4 lg:-top-6 left-1/2 transform -translate-x-1/2 w-5 h-5 md:w-9 md:h-9 lg:w-12 lg:h-12 halo-glow"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <ellipse cx="12" cy="12" rx="10" ry="3" />
              </svg>
            </span>
            <span className="relative inline-block">
              A
            </span>
            <span className="relative inline-block">
              N
            </span>
            <span className="relative inline-block">
              T
            </span>
            <span className="relative inline-block">
              O
            </span>
          </span>
          <div className={`w-0.5 h-6 md:h-12 lg:h-16 bg-gradient-to-b from-transparent to-transparent shadow-lg transition-all duration-700 ${
            hoveredSide === "fit" ? "via-cyan-400 shadow-cyan-400/50" : hoveredSide === "fat" ? "via-red-400 shadow-red-400/50" : hoveredSide === "taco" ? "via-emerald-500 shadow-emerald-500/50" : "via-fuchsia-500 shadow-fuchsia-500/50"
          }`}></div>
          <span className={`transition-all duration-700 ${
            hoveredSide === "fit" ? "text-cyan-400 neon-glow-fit" : hoveredSide === "fat" ? "text-red-400 neon-glow-fat" : hoveredSide === "taco" ? "text-emerald-500 neon-glow-taco" : "text-fuchsia-500 neon-glow-purple"
          }`}>DILEMA</span>
        </h1>

        {/* Taglines debajo - solo visibles en desktop */}
        <div className="hidden md:flex items-center gap-2 md:gap-4 lg:gap-6 mt-1 md:mt-2 overflow-hidden">
          <p className={`text-cyan-400/80 text-[8px] md:text-xs lg:text-sm font-bold tracking-wider neon-glow-fit whitespace-nowrap md:transition-all md:duration-500 ${
            hoveredSide === "fat" || hoveredSide === "taco" ? "md:opacity-0 md:-translate-x-8" : "opacity-100 translate-x-0"
          }`}>
            PREMIUM SALADS
          </p>
          <div className={`w-0.5 h-2 md:h-3 bg-transparent md:transition-all md:duration-500 ${
            hoveredSide === null ? "opacity-100" : "md:opacity-0"
          }`}></div>
          <p className={`text-red-400/80 text-[8px] md:text-xs lg:text-sm font-bold tracking-wider neon-glow-fat whitespace-nowrap md:transition-all md:duration-500 ${
            hoveredSide === "fit" || hoveredSide === "taco" ? "md:opacity-0" : "opacity-100 translate-x-0"
          }`}>
            PREMIUM WINGS
          </p>
          <div className={`w-0.5 h-2 md:h-3 bg-transparent md:transition-all md:duration-500 ${
            hoveredSide === null ? "opacity-100" : "md:opacity-0"
          }`}></div>
          <p className={`text-emerald-500/80 text-[8px] md:text-xs lg:text-sm font-bold tracking-wider neon-glow-taco whitespace-nowrap md:transition-all md:duration-500 ${
            hoveredSide === "fit" || hoveredSide === "fat" ? "md:opacity-0 md:translate-x-8" : "opacity-100 translate-x-0"
          }`}>
            AUTHENTIC TACOS
          </p>
        </div>
      </div>

      {/* Lado FIT - Ensaladas */}
      <Link
        href="/fit"
        className={`relative flex-1 flex items-center justify-center transition-all duration-500 h-[33.33dvh] md:min-h-screen ${
          hoveredSide === "fat" || hoveredSide === "taco" ? "md:flex-[0.2]" : hoveredSide === "fit" ? "md:flex-[1.6]" : "flex-1"
        }`}
        onMouseEnter={() => setHoveredSide("fit")}
        onMouseLeave={() => setHoveredSide(null)}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br from-cyan-500/30 via-teal-600/15 to-black transition-all duration-500 ${
            hoveredSide === "fit" ? "opacity-100" : "opacity-80 md:opacity-60"
          }`}
        />
        {/* Acento neon izquierdo - solo mobile */}
        <div className="md:hidden absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-cyan-400 to-transparent shadow-sm shadow-cyan-400/50" />

        {/* Iconos mobile ensaladas - distribuidos en sección */}
        <div className="md:hidden absolute inset-0 pointer-events-none overflow-hidden">
          {/* Bowl grande centro-derecha */}
          <svg viewBox="0 0 120 120" className="absolute right-2 top-1/2 -translate-y-1/2 w-36 h-36 text-cyan-400 opacity-[0.13]" fill="none" stroke="currentColor" strokeWidth="1.8">
            <ellipse cx="60" cy="68" rx="48" ry="12"/>
            <path d="M12 68 Q12 102 60 110 Q108 102 108 68"/>
            <path d="M30 64 Q22 48 32 35 Q42 28 50 44 Q57 28 66 35 Q76 48 66 64" strokeWidth="1.5"/>
            <path d="M56 61 Q50 46 57 34 Q66 26 74 42 Q80 26 88 34 Q96 47 88 61" strokeWidth="1.5"/>
            <circle cx="46" cy="52" r="7" fill="currentColor" opacity="0.3"/>
            <circle cx="80" cy="49" r="5" fill="currentColor" opacity="0.25"/>
            <line x1="18" y1="16" x2="18" y2="65" strokeWidth="2.5"/>
            <line x1="14" y1="16" x2="14" y2="30" strokeWidth="2"/>
            <line x1="18" y1="16" x2="18" y2="30" strokeWidth="2"/>
            <line x1="22" y1="16" x2="22" y2="30" strokeWidth="2"/>
          </svg>
          {/* Aguacate esquina superior izq */}
          <svg viewBox="0 0 100 100" className="absolute top-1 left-2 w-14 h-14 text-teal-400 opacity-[0.15]" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="50" cy="55" rx="28" ry="35"/>
            <ellipse cx="50" cy="55" rx="14" ry="17"/>
            <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.3"/>
            <path d="M48 22 Q50 17 52 22" strokeWidth="2.5"/>
          </svg>
          {/* Tomate cherry esquina inf izq */}
          <svg viewBox="0 0 100 100" className="absolute bottom-2 left-4 w-12 h-12 text-red-300 opacity-[0.15]" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="50" cy="58" r="24"/>
            <path d="M38 34 Q44 28 50 28 Q56 28 62 34" strokeWidth="2.5"/>
            <path d="M44 33 L44 39 M50 30 L50 36 M56 33 L56 39"/>
          </svg>
          {/* Hoja superior derecha */}
          <svg viewBox="0 0 100 100" className="absolute top-1 right-2 w-12 h-12 text-emerald-400 opacity-[0.15]" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M20 80 Q30 40 50 20 Q70 40 80 80"/>
            <path d="M50 20 L50 80 M50 40 Q35 50 30 65 M50 40 Q65 50 70 65"/>
          </svg>
          {/* Zanahoria inf derecha */}
          <svg viewBox="0 0 100 100" className="absolute bottom-1 right-3 w-11 h-11 text-orange-300 opacity-[0.15]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M50 28 L44 82 L56 82 Z"/>
            <line x1="41" y1="42" x2="37" y2="42"/>
            <line x1="59" y1="42" x2="63" y2="42"/>
            <path d="M45 26 L40 20 M50 23 L50 16 M55 26 L60 20"/>
          </svg>
        </div>

        {/* Iconos decorativos FIT - Vegetales en líneas neón */}
        <div className="absolute inset-0 overflow-hidden opacity-[0.12] md:opacity-[0.15]">
          {/* Aguacates */}
          <svg className="absolute top-16 left-8 w-24 h-24 text-cyan-400 float-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="50" cy="55" rx="28" ry="35" />
            <ellipse cx="50" cy="55" rx="15" ry="18" />
            <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.3"/>
            <path d="M48 25 Q50 20, 52 25" strokeWidth="3"/>
          </svg>

          <svg className="absolute bottom-32 right-12 w-20 h-20 text-teal-400 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="50" cy="55" rx="25" ry="32" />
            <ellipse cx="50" cy="55" rx="13" ry="16" />
            <circle cx="50" cy="50" r="7" fill="currentColor" opacity="0.3"/>
          </svg>

          {/* Lechugas */}
          <svg className="absolute top-1/3 right-20 w-28 h-28 text-emerald-400 sway-right" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M50 20 Q35 25, 30 40 Q28 55, 35 65 Q45 75, 50 80"/>
            <path d="M50 20 Q65 25, 70 40 Q72 55, 65 65 Q55 75, 50 80"/>
            <path d="M50 25 Q40 30, 38 45 Q37 60, 42 70"/>
            <path d="M50 25 Q60 30, 62 45 Q63 60, 58 70"/>
            <path d="M45 35 Q42 45, 43 55 Q44 65, 48 72"/>
            <path d="M55 35 Q58 45, 57 55 Q56 65, 52 72"/>
          </svg>

          <svg className="absolute top-1/2 left-16 w-26 h-26 text-teal-300 opacity-60 sway-left" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M50 25 Q38 28, 35 42 Q34 56, 40 68"/>
            <path d="M50 25 Q62 28, 65 42 Q66 56, 60 68"/>
            <path d="M48 32 Q42 38, 42 50 Q42 62, 47 70"/>
            <path d="M52 32 Q58 38, 58 50 Q58 62, 53 70"/>
          </svg>

          {/* Tomates */}
          <svg className="absolute bottom-24 left-24 w-22 h-22 text-red-300 float-medium" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="50" cy="55" r="22"/>
            <path d="M40 33 Q45 28, 50 28 Q55 28, 60 33" strokeWidth="2.5"/>
            <path d="M45 33 L45 38 M50 30 L50 35 M55 33 L55 38"/>
            <circle cx="48" cy="52" r="1.5" fill="currentColor"/>
          </svg>

          <svg className="absolute top-24 right-32 w-18 h-18 text-red-400 pulse-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="50" cy="55" r="20"/>
            <path d="M42 35 Q47 30, 52 30 Q57 30, 58 35"/>
            <path d="M47 35 L47 38 M52 32 L52 36"/>
          </svg>

          {/* Hojas */}
          <svg className="absolute top-40 left-28 w-20 h-20 text-green-400 sway-left" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 80 Q30 40, 50 20 Q70 40, 80 80" />
            <path d="M50 20 L50 80 M50 35 Q35 45, 30 60 M50 35 Q65 45, 70 60 M50 50 Q38 58, 35 70 M50 50 Q62 58, 65 70"/>
          </svg>

          <svg className="absolute bottom-40 right-40 w-16 h-16 text-emerald-300 opacity-70 sway-right" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M25 75 Q35 45, 50 25 Q65 45, 75 75" />
            <path d="M50 25 L50 75 M50 38 Q38 48, 33 63 M50 38 Q62 48, 67 63"/>
          </svg>

          {/* Pepinos */}
          <svg className="absolute top-2/3 right-16 w-24 h-24 text-cyan-500 float-slower" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="50" cy="50" rx="12" ry="30" />
            <line x1="45" y1="30" x2="45" y2="35"/>
            <line x1="55" y1="33" x2="55" y2="38"/>
            <line x1="45" y1="45" x2="45" y2="50"/>
            <line x1="55" y1="48" x2="55" y2="53"/>
            <line x1="45" y1="60" x2="45" y2="65"/>
            <line x1="55" y1="63" x2="55" y2="68"/>
          </svg>

          {/* Zanahorias */}
          <svg className="absolute bottom-1/3 left-40 w-20 h-20 text-orange-400 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M50 25 L45 80 L55 80 Z"/>
            <line x1="42" y1="40" x2="38" y2="40"/>
            <line x1="58" y1="40" x2="62" y2="40"/>
            <line x1="43" y1="55" x2="39" y2="57"/>
            <line x1="57" y1="55" x2="61" y2="57"/>
            <path d="M45 23 L40 18 M50 20 L50 14 M55 23 L60 18"/>
            <path d="M42 25 L37 22 M48 22 L45 16 M58 25 L63 22"/>
          </svg>

          {/* Pimientos */}
          <svg className="absolute top-1/4 left-1/3 w-22 h-22 text-lime-400 opacity-50 rotate-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M40 35 Q35 45, 35 60 Q38 75, 50 78 Q62 75, 65 60 Q65 45, 60 35"/>
            <path d="M45 30 Q48 25, 52 25 Q55 25, 55 30"/>
            <rect x="47" y="22" width="6" height="8" rx="1"/>
          </svg>

          {/* Brócoli */}
          <svg className="absolute bottom-1/4 right-1/3 w-26 h-26 text-green-500 pulse-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="45" cy="40" r="12"/>
            <circle cx="55" cy="40" r="12"/>
            <circle cx="50" cy="50" r="13"/>
            <circle cx="40" cy="50" r="10"/>
            <circle cx="60" cy="50" r="10"/>
            <path d="M42 60 L42 75 Q42 78, 45 78 L55 78 Q58 78, 58 75 L58 60" strokeWidth="3"/>
          </svg>
        </div>

        {/* Efecto de brillo neón en hover */}
        {hoveredSide === "fit" && (
          <div className="absolute inset-0 bg-cyan-500/10 animate-pulse" />
        )}

        <div className="relative z-10 text-center text-white px-4 md:px-6 flex flex-col items-center justify-center h-full md:h-auto pt-10 md:pt-12 md:pb-6 lg:pt-16 lg:pb-8">
          <div className="hidden md:block mb-1 md:mb-2 filter drop-shadow-lg">
            <Image
              src="/balance.png?v=1"
              alt="Ensalada Premium"
              width={120}
              height={120}
              className="mx-auto md:w-44 md:h-44 lg:w-56 lg:h-56"
            />
          </div>
          <h2
            className="mb-3 md:mb-2 text-cyan-400 neon-glow-fit tracking-[0.12em] leading-none"
            style={{ fontFamily: 'var(--font-graffiti)', fontSize: 'clamp(3rem, 12vw, 3.4rem)' }}
          >
            ENSALADAS
          </h2>
          <p className="hidden md:block text-sm md:text-lg lg:text-xl font-light mb-1.5 md:mb-3 text-cyan-200">
            Ensaladas Saludables
          </p>
          <div className={`transition-all duration-300 md:opacity-0 md:translate-y-4 ${
            hoveredSide === "fit" ? "md:opacity-100 md:translate-y-0" : ""
          }`}>
            <div className="inline-flex items-center gap-2 px-5 py-2 md:px-5 md:py-2 border-2 border-cyan-400 rounded-full neon-border-fit">
              <span className="text-cyan-400 font-bold text-sm md:text-sm">VER MENÚ</span>
              <span className="text-cyan-400 text-sm">→</span>
            </div>
          </div>
        </div>

        {/* Línea decorativa con efecto neón */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent neon-glow-fit" />
      </Link>

      {/* Línea divisoria central con efecto neón púrpura */}
      <div className="h-[2px] md:h-auto md:w-1 bg-gradient-to-r md:bg-gradient-to-b from-transparent via-fuchsia-400 to-transparent z-10 shadow-md shadow-fuchsia-500/60" />

      {/* Lado FAT - Alitas */}
      <Link
        href="/fat"
        className={`relative flex-1 flex items-center justify-center transition-all duration-500 h-[33.33dvh] md:min-h-screen ${
          hoveredSide === "fit" || hoveredSide === "taco" ? "md:flex-[0.2]" : hoveredSide === "fat" ? "md:flex-[1.6]" : "flex-1"
        }`}
        onMouseEnter={() => setHoveredSide("fat")}
        onMouseLeave={() => setHoveredSide(null)}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br from-red-500/30 via-orange-600/15 to-black transition-all duration-500 ${
            hoveredSide === "fat" ? "opacity-100" : "opacity-80 md:opacity-60"
          }`}
        />
        {/* Acento neon izquierdo - solo mobile */}
        <div className="md:hidden absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-red-400 to-transparent shadow-sm shadow-red-400/50" />

        {/* Iconos mobile alitas - distribuidos en sección */}
        <div className="md:hidden absolute inset-0 pointer-events-none overflow-hidden">
          {/* Pierna de pollo grande centro-derecha */}
          <svg viewBox="0 0 100 140" className="absolute right-2 top-1/2 -translate-y-[55%] w-28 h-40 text-red-400 opacity-[0.13]" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="50" cy="45" rx="30" ry="34" fill="currentColor" fillOpacity="0.1"/>
            <ellipse cx="50" cy="45" rx="30" ry="34"/>
            <path d="M34 34 Q44 26 52 36 Q60 26 68 34 Q76 26 80 40" strokeWidth="1.5"/>
            <path d="M32 50 Q42 42 52 50 Q62 42 70 50 Q78 42 82 54" strokeWidth="1.5"/>
            <rect x="43" y="76" width="14" height="44" rx="7" fill="currentColor" fillOpacity="0.08"/>
            <rect x="43" y="76" width="14" height="44" rx="7"/>
            <ellipse cx="50" cy="120" rx="15" ry="9" fill="currentColor" fillOpacity="0.1"/>
            <ellipse cx="50" cy="120" rx="15" ry="9"/>
          </svg>
          {/* Alita sup izq */}
          <svg viewBox="0 0 100 100" className="absolute top-1 left-2 w-16 h-16 text-orange-400 opacity-[0.15]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 52 Q28 40 40 38 L52 37 Q63 38 68 44 L76 48 Q82 52 82 58 Q82 64 76 67 L68 70 Q62 72 52 72 L40 71 Q28 68 22 60 Q18 56 22 52Z"/>
            <circle cx="34" cy="57" r="2.5" fill="currentColor" opacity="0.4"/>
            <circle cx="56" cy="59" r="2.5" fill="currentColor" opacity="0.4"/>
            <path d="M40 38 Q38 34 38 30 M52 37 Q52 33 52 29 M62 39 Q64 34 64 30"/>
          </svg>
          {/* Fuego inf izq */}
          <svg viewBox="0 0 100 100" className="absolute bottom-1 left-3 w-12 h-12 text-orange-500 opacity-[0.15]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M50 18 Q44 30 42 42 Q40 54 44 64 Q47 72 50 74 Q53 72 56 64 Q60 54 58 42 Q56 30 50 18Z"/>
            <path d="M50 36 Q48 44 47 50 Q46 56 48 60 Q50 62 52 60 Q54 56 53 50 Q52 44 50 36Z"/>
          </svg>
          {/* Segunda pierna sup derecha */}
          <svg viewBox="0 0 100 140" className="absolute top-0 right-1 w-10 h-14 text-red-300 opacity-[0.12]" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="50" cy="42" rx="26" ry="30"/>
            <rect x="44" y="70" width="12" height="38" rx="6"/>
            <ellipse cx="50" cy="108" rx="13" ry="8"/>
          </svg>
          {/* Papas fritas inf derecha */}
          <svg viewBox="0 0 100 100" className="absolute bottom-1 right-2 w-13 h-13 text-amber-400 opacity-[0.15]" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M32 32 L30 76 L37 78 L39 35 Z"/>
            <path d="M42 26 L40 76 L47 78 L49 29 Z"/>
            <path d="M52 29 L50 76 L57 78 L59 32 Z"/>
            <path d="M27 30 L62 34 L60 27 L25 23 Z" fill="currentColor" opacity="0.2"/>
          </svg>
        </div>

        {/* Iconos decorativos FAT - Comida indulgente en líneas neón */}
        <div className="absolute inset-0 overflow-hidden opacity-[0.12] md:opacity-[0.15]">
          {/* Alitas de pollo detalladas */}
          <svg className="absolute top-20 right-16 w-28 h-28 text-red-400 float-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M25 50 Q30 40, 40 38 L50 37 Q60 38, 65 42 L75 45 Q82 48, 82 55 Q82 62, 75 65 L65 68 Q60 70, 50 70 L40 69 Q30 67, 25 60 Q20 55, 25 50Z"/>
            <circle cx="35" cy="55" r="2.5" fill="currentColor" opacity="0.4"/>
            <circle cx="55" cy="57" r="2.5" fill="currentColor" opacity="0.4"/>
            <circle cx="45" cy="60" r="2" fill="currentColor" opacity="0.4"/>
            <path d="M40 38 Q38 35, 38 32 M50 37 Q50 34, 50 30 M60 38 Q62 35, 62 32"/>
          </svg>

          <svg className="absolute bottom-28 left-20 w-24 h-24 text-orange-400 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M28 50 Q32 42, 42 40 L52 39 Q62 40, 67 45 L72 48 Q77 52, 77 57 Q77 63, 72 66 L67 69 Q62 72, 52 72 L42 71 Q32 69, 28 62 Q24 57, 28 50Z"/>
            <circle cx="38" cy="56" r="2" fill="currentColor" opacity="0.4"/>
            <circle cx="56" cy="58" r="2" fill="currentColor" opacity="0.4"/>
          </svg>

          {/* Fuegos detallados */}
          <svg className="absolute top-1/3 left-12 w-26 h-26 text-orange-500 sway-left" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M50 20 Q45 30, 42 40 Q40 50, 42 60 Q45 68, 50 70 Q55 68, 58 60 Q60 50, 58 40 Q55 30, 50 20Z"/>
            <path d="M50 35 Q48 42, 47 48 Q46 54, 48 58 Q50 60, 52 58 Q54 54, 53 48 Q52 42, 50 35Z"/>
            <path d="M50 70 Q48 75, 47 80 Q46 84, 48 86 Q50 88, 52 86 Q54 84, 53 80 Q52 75, 50 70Z"/>
          </svg>

          <svg className="absolute bottom-1/3 right-24 w-22 h-22 text-red-500 pulse-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M50 25 Q47 32, 45 40 Q44 48, 46 55 Q49 62, 50 65 Q51 62, 54 55 Q56 48, 55 40 Q53 32, 50 25Z"/>
            <path d="M50 40 Q49 45, 49 50 Q49 54, 51 54 Q53 54, 53 50 Q53 45, 50 40Z"/>
          </svg>

          {/* Papas fritas detalladas */}
          <svg className="absolute bottom-24 left-32 w-26 h-26 text-amber-400 float-medium" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M30 30 L28 75 L35 78 L37 33 Z"/>
            <path d="M40 25 L38 75 L45 78 L47 28 Z"/>
            <path d="M50 28 L48 75 L55 78 L57 31 Z"/>
            <path d="M60 32 L58 75 L65 78 L67 35 Z"/>
            <path d="M70 35 L68 75 L75 78 L77 38 Z"/>
            <path d="M25 28 L80 32 L78 26 L23 22 Z" fill="currentColor" opacity="0.2"/>
          </svg>

          {/* Hamburguesas detalladas */}
          <svg className="absolute top-1/2 right-32 w-28 h-28 text-orange-400 float-slower" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M25 35 Q25 30, 30 28 L70 28 Q75 30, 75 35" strokeWidth="2.5"/>
            <rect x="22" y="35" width="56" height="8" rx="2"/>
            <rect x="22" y="43" width="56" height="6" rx="1" fill="currentColor" opacity="0.3"/>
            <rect x="22" y="49" width="56" height="4" rx="1"/>
            <rect x="22" y="53" width="56" height="6" rx="1" fill="currentColor" opacity="0.2"/>
            <path d="M25 65 Q25 70, 30 72 L70 72 Q75 70, 75 65" strokeWidth="2.5"/>
            <circle cx="35" cy="46" r="2" fill="currentColor" opacity="0.5"/>
            <circle cx="50" cy="46" r="2" fill="currentColor" opacity="0.5"/>
            <circle cx="65" cy="46" r="2" fill="currentColor" opacity="0.5"/>
          </svg>

          <svg className="absolute top-24 left-28 w-24 h-24 text-red-400 pulse-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M28 38 Q28 34, 32 32 L68 32 Q72 34, 72 38"/>
            <rect x="26" y="38" width="48" height="7" rx="2"/>
            <rect x="26" y="45" width="48" height="5" rx="1" fill="currentColor" opacity="0.3"/>
            <path d="M28 55 Q28 58, 32 60 L68 60 Q72 58, 72 55"/>
            <circle cx="38" cy="48" r="1.5" fill="currentColor" opacity="0.5"/>
            <circle cx="62" cy="48" r="1.5" fill="currentColor" opacity="0.5"/>
          </svg>

          {/* Pizzas */}
          <svg className="absolute top-40 left-16 w-24 h-24 text-orange-400 float-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M50 15 L25 80 L75 80 Z"/>
            <circle cx="42" cy="50" r="4" fill="currentColor" opacity="0.4"/>
            <circle cx="58" cy="55" r="4" fill="currentColor" opacity="0.4"/>
            <circle cx="50" cy="65" r="4" fill="currentColor" opacity="0.4"/>
            <circle cx="48" cy="38" r="3" fill="currentColor" opacity="0.4"/>
            <path d="M50 15 Q52 18, 54 22" strokeWidth="1.5"/>
          </svg>

          {/* Chiles picantes */}
          <svg className="absolute bottom-20 right-20 w-20 h-20 text-red-500 sway-right" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M50 25 Q48 32, 46 42 Q44 52, 44 62 Q44 72, 48 78 Q52 78, 56 72 Q56 62, 56 52 Q54 42, 52 32 Q50 25, 50 25Z"/>
            <path d="M50 22 Q52 18, 55 18 Q58 18, 60 20" strokeWidth="2"/>
            <path d="M48 24 L45 22 M52 24 L55 22"/>
          </svg>

          {/* Hot dogs */}
          <svg className="absolute top-2/3 left-24 w-26 h-26 text-amber-500 opacity-60 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="50" cy="50" rx="35" ry="12" />
            <ellipse cx="50" cy="50" rx="30" ry="8" fill="currentColor" opacity="0.2"/>
            <path d="M20 48 Q25 40, 35 40 L65 40 Q75 40, 80 48" strokeWidth="2.5"/>
            <path d="M30 48 Q32 52, 38 52 M50 48 Q50 52, 50 52 M70 48 Q68 52, 62 52" strokeWidth="1.5"/>
          </svg>

          {/* Donas */}
          <svg className="absolute bottom-1/2 right-1/3 w-22 h-22 text-pink-400 opacity-50 rotate-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="50" cy="50" r="25"/>
            <circle cx="50" cy="50" r="12"/>
            <path d="M40 30 L42 28 M50 28 L52 26 M60 30 L62 28 M68 40 L70 38 M70 50 L72 50 M68 60 L70 62"/>
          </svg>

          {/* Nuggets */}
          <svg className="absolute top-1/4 right-1/4 w-20 h-20 text-orange-300 opacity-70 float-medium" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M30 40 Q28 35, 32 32 L68 32 Q72 35, 70 40 L68 60 Q70 65, 66 68 L34 68 Q30 65, 32 60 Z"/>
            <circle cx="42" cy="45" r="1.5" fill="currentColor" opacity="0.4"/>
            <circle cx="58" cy="48" r="1.5" fill="currentColor" opacity="0.4"/>
            <circle cx="50" cy="55" r="1.5" fill="currentColor" opacity="0.4"/>
          </svg>
        </div>

        {/* Efecto de brillo neón en hover */}
        {hoveredSide === "fat" && (
          <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
        )}

        <div className="relative z-10 text-center text-white px-4 md:px-6 flex flex-col items-center justify-center h-full md:h-auto md:pt-12 md:pb-6 lg:pt-16 lg:pb-8">
          <div className="hidden md:block mb-0 md:mb-1 filter drop-shadow-lg">
            <Image
              src="/placer.png?v=4"
              alt="Alitas Premium"
              width={140}
              height={140}
              className="mx-auto md:w-44 md:h-44 lg:w-56 lg:h-56"
            />
          </div>
          <h2
            className="mb-3 md:mb-1 text-red-400 neon-glow-fat tracking-[0.14em] leading-none"
            style={{ fontFamily: 'var(--font-graffiti)', fontSize: 'clamp(3.6rem, 16vw, 4.5rem)' }}
          >
            ALITAS
          </h2>
          <p className="hidden md:block text-sm md:text-lg lg:text-xl font-light mb-1.5 md:mb-3 text-orange-200">
            Alitas Irresistibles
          </p>
          <div className={`transition-all duration-300 md:opacity-0 md:translate-y-4 ${
            hoveredSide === "fat" ? "md:opacity-100 md:translate-y-0" : ""
          }`}>
            <div className="inline-flex items-center gap-2 px-5 py-2 md:px-5 md:py-2 border-2 border-red-400 rounded-full neon-border-fat">
              <span className="text-red-400 font-bold text-sm md:text-sm">VER MENÚ</span>
              <span className="text-red-400 text-sm">→</span>
            </div>
          </div>
        </div>

        {/* Línea decorativa con efecto neón */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent neon-glow-fat" />
      </Link>

      {/* Línea divisoria con efecto neón */}
      <div className="h-[2px] md:h-auto md:w-1 bg-gradient-to-r md:bg-gradient-to-b from-transparent via-fuchsia-400 to-transparent z-10 shadow-md shadow-fuchsia-500/60" />

      {/* Lado TACO - Tacos Mexicanos */}
      <Link
        href="/tacos"
        className={`relative flex-1 flex items-center justify-center transition-all duration-500 h-[33.33dvh] md:min-h-screen cursor-pointer ${
          hoveredSide === "fit" || hoveredSide === "fat" ? "md:flex-[0.2]" : hoveredSide === "taco" ? "md:flex-[1.6]" : "flex-1"
        }`}
        onMouseEnter={() => setHoveredSide("taco")}
        onMouseLeave={() => setHoveredSide(null)}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br from-emerald-600/30 via-green-700/15 to-black transition-all duration-500 ${
            hoveredSide === "taco" ? "opacity-100" : "opacity-80 md:opacity-60"
          }`}
        />
        {/* Acento neon izquierdo - solo mobile */}
        <div className="md:hidden absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-emerald-400 to-transparent shadow-sm shadow-emerald-400/50" />

        {/* Iconos mobile tacos - distribuidos en sección */}
        <div className="md:hidden absolute inset-0 pointer-events-none overflow-hidden">
          {/* Taco grande centro-derecha */}
          <svg viewBox="0 0 140 100" className="absolute right-0 top-1/2 -translate-y-1/2 w-44 h-32 text-emerald-400 opacity-[0.13]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 78 Q8 22 70 10 Q132 22 132 78" strokeWidth="3"/>
            <line x1="8" y1="78" x2="132" y2="78" strokeWidth="3"/>
            <path d="M18 75 Q32 60 46 67 Q60 56 70 63 Q82 52 95 60 Q108 56 122 75" strokeWidth="1.8"/>
            <circle cx="44" cy="63" r="8" fill="currentColor" opacity="0.28"/>
            <circle cx="70" cy="57" r="8" fill="currentColor" opacity="0.28"/>
            <circle cx="96" cy="62" r="8" fill="currentColor" opacity="0.28"/>
            <path d="M14 76 Q35 66 55 70 Q75 66 95 70 Q115 66 126 76" strokeWidth="1.5"/>
          </svg>
          {/* Aguacate sup izq */}
          <svg viewBox="0 0 100 100" className="absolute top-1 left-2 w-13 h-13 text-lime-400 opacity-[0.15]" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="50" cy="55" rx="27" ry="34"/>
            <ellipse cx="50" cy="55" rx="14" ry="17"/>
            <circle cx="50" cy="50" r="7" fill="currentColor" opacity="0.3"/>
            <path d="M48 23 Q50 18 52 23" strokeWidth="2.5"/>
          </svg>
          {/* Chile inf izq */}
          <svg viewBox="0 0 100 100" className="absolute bottom-1 left-3 w-11 h-11 text-red-500 opacity-[0.15]" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M50 24 Q48 32 46 44 Q44 56 44 66 Q44 76 48 82 Q52 82 56 76 Q56 66 56 56 Q54 44 52 32 Q50 24 50 24Z"/>
            <path d="M50 21 Q52 17 56 17 Q59 17 60 20" strokeWidth="2"/>
          </svg>
          {/* Taco pequeño sup derecha */}
          <svg viewBox="0 0 100 72" className="absolute top-1 right-2 w-16 h-11 text-green-400 opacity-[0.14]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 58 Q5 16 50 7 Q95 16 95 58" strokeWidth="2.5"/>
            <line x1="5" y1="58" x2="95" y2="58" strokeWidth="2.5"/>
            <circle cx="30" cy="47" r="6" fill="currentColor" opacity="0.25"/>
            <circle cx="50" cy="42" r="6" fill="currentColor" opacity="0.25"/>
            <circle cx="70" cy="47" r="6" fill="currentColor" opacity="0.25"/>
          </svg>
          {/* Limón inf derecha */}
          <svg viewBox="0 0 100 100" className="absolute bottom-1 right-3 w-11 h-11 text-lime-300 opacity-[0.15]" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="50" cy="50" r="22"/>
            <path d="M50 28 L50 72 M28 50 L72 50" strokeWidth="1" opacity="0.6"/>
            <circle cx="50" cy="50" r="14" opacity="0.3"/>
          </svg>
        </div>

        {/* Iconos decorativos TACO - Elementos mexicanos */}
        <div className="absolute inset-0 overflow-hidden opacity-[0.12] md:opacity-[0.15]">
          {/* Tacos */}
          <svg className="absolute top-20 left-16 w-28 h-28 text-emerald-400 float-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 60 Q25 30, 50 20 Q75 30, 80 60 L70 80 Q50 70, 30 80 Z"/>
            <circle cx="40" cy="50" r="3" fill="currentColor" opacity="0.4"/>
            <circle cx="60" cy="48" r="3" fill="currentColor" opacity="0.4"/>
            <path d="M35 55 L65 55" strokeWidth="1.5"/>
          </svg>

          <svg className="absolute bottom-28 right-20 w-24 h-24 text-green-400 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M25 55 Q30 35, 50 28 Q70 35, 75 55 L68 75 Q50 68, 32 75 Z"/>
            <circle cx="42" cy="48" r="2.5" fill="currentColor" opacity="0.4"/>
            <circle cx="58" cy="46" r="2.5" fill="currentColor" opacity="0.4"/>
          </svg>

          {/* Chiles picantes */}
          <svg className="absolute top-1/3 right-12 w-20 h-20 text-red-500 sway-right" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M50 25 Q48 32, 46 42 Q44 52, 44 62 Q44 72, 48 78 Q52 78, 56 72 Q56 62, 56 52 Q54 42, 52 32 Q50 25, 50 25Z"/>
            <path d="M50 22 Q52 18, 55 18 Q58 18, 60 20" strokeWidth="2"/>
          </svg>

          <svg className="absolute bottom-1/3 left-24 w-18 h-18 text-red-400 pulse-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M50 30 Q48 36, 46 44 Q44 54, 44 64 Q44 74, 48 80 Q52 80, 56 74 Q56 64, 56 54 Q54 44, 52 36 Q50 30, 50 30Z"/>
          </svg>

          {/* Aguacates */}
          <svg className="absolute top-1/2 left-16 w-24 h-24 text-lime-400 float-medium" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="50" cy="55" rx="28" ry="35" />
            <ellipse cx="50" cy="55" rx="15" ry="18" />
            <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.3"/>
            <path d="M48 25 Q50 20, 52 25" strokeWidth="3"/>
          </svg>

          {/* Tortillas */}
          <svg className="absolute bottom-24 left-32 w-26 h-26 text-amber-300 rotate-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="50" cy="50" r="30"/>
            <circle cx="50" cy="50" r="25" opacity="0.5"/>
            <circle cx="45" cy="45" r="2" fill="currentColor" opacity="0.3"/>
            <circle cx="58" cy="52" r="2" fill="currentColor" opacity="0.3"/>
          </svg>

          {/* Cilantro / Hierbas */}
          <svg className="absolute top-40 right-28 w-20 h-20 text-green-400 sway-left" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M50 20 L50 80 M50 30 Q35 35, 30 45 M50 30 Q65 35, 70 45 M50 50 Q38 55, 33 65 M50 50 Q62 55, 67 65"/>
          </svg>

          {/* Limones */}
          <svg className="absolute top-24 left-28 w-18 h-18 text-lime-300 pulse-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="50" cy="50" r="20"/>
            <path d="M50 30 L50 70 M30 50 L70 50" strokeWidth="1" opacity="0.5"/>
          </svg>

          {/* Cebollas */}
          <svg className="absolute bottom-40 right-16 w-22 h-22 text-purple-300 opacity-60 float-slower" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8">
            <ellipse cx="50" cy="50" rx="18" ry="22"/>
            <ellipse cx="50" cy="50" rx="12" ry="16" opacity="0.5"/>
            <path d="M48 28 Q50 22, 52 28" strokeWidth="2.5"/>
          </svg>
        </div>

        {/* Efecto de brillo neón en hover */}
        {hoveredSide === "taco" && (
          <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />
        )}


        <div className="relative z-10 text-center text-white px-4 md:px-6 flex flex-col items-center justify-center h-full md:h-auto md:pt-12 md:pb-6 lg:pt-16 lg:pb-8">
          <div className="hidden md:block mb-0 md:mb-1 filter drop-shadow-lg">
            <Image
              src="/tacoinicio.png"
              alt="Tacos Auténticos"
              width={140}
              height={140}
              className="mx-auto md:w-44 md:h-44 lg:w-56 lg:h-56"
            />
          </div>
          <h2
            className="mb-3 md:mb-1 text-emerald-400 neon-glow-taco tracking-[0.14em] leading-none"
            style={{ fontFamily: 'var(--font-graffiti)', fontSize: 'clamp(3.6rem, 16vw, 4.5rem)' }}
          >
            TACOS
          </h2>
          <p className="hidden md:block text-sm md:text-lg lg:text-xl font-light mb-1.5 md:mb-3 text-green-200">
            Tacos Auténticos
          </p>
        </div>

        {/* Línea decorativa con efecto neón */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent neon-glow-taco" />
      </Link>

      {/* Dark Kitchen Label - Parte inferior */}
      <div className={`absolute bottom-1 md:bottom-3 z-20 transform -translate-x-1/2 transition-all duration-700 ease-out px-4 ${
        hoveredSide === "fit" ? "md:left-[16.5%]" : hoveredSide === "fat" ? "md:left-1/2" : hoveredSide === "taco" ? "md:left-[83.5%]" : "md:left-1/2"
      } left-1/2`}>
        <div className="flex items-center gap-1.5 md:gap-2 text-center">
          <div className={`w-3 md:w-6 h-px bg-gradient-to-r from-transparent transition-all duration-700 ${
            hoveredSide === "fit" ? "to-cyan-400" : hoveredSide === "fat" ? "to-red-400" : hoveredSide === "taco" ? "to-emerald-500" : "to-fuchsia-500"
          }`}></div>
          <p className={`text-[8px] md:text-xs font-bold tracking-widest transition-all duration-700 whitespace-nowrap ${
            hoveredSide === "fit" ? "text-cyan-400 neon-glow-fit" : hoveredSide === "fat" ? "text-red-400 neon-glow-fat" : hoveredSide === "taco" ? "text-emerald-400 neon-glow-taco" : "text-fuchsia-400 neon-glow-purple"
          }`}>
            PREMIUM DARK KITCHEN · DELIVERY ONLY
          </p>
          <div className={`w-3 md:w-6 h-px bg-gradient-to-l from-transparent transition-all duration-700 ${
            hoveredSide === "fit" ? "to-cyan-400" : hoveredSide === "fat" ? "to-red-400" : hoveredSide === "taco" ? "to-emerald-500" : "to-fuchsia-500"
          }`}></div>
        </div>
      </div>

      {/* Modal de Ruleta */}
      <YunzaModal isOpen={showYunzaModal} onClose={() => setShowYunzaModal(false)} />

      {/* Comunicado urgente - activo hasta 3 abril 2026 12pm Perú */}
      {showComunicado && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setShowComunicado(false)}
        >
          <div
            className="relative max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* Banner tarjeta - primera visita */}
      {showTarjetaBanner && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => {
            setShowTarjetaBanner(false);
            localStorage.setItem("sd-tarjeta-banner-seen", "1");
          }}
        >
          <div
            className="relative max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src="/tarjeta.png"
              alt="Paga con tarjeta"
              width={500}
              height={500}
              className="w-full h-auto rounded-2xl shadow-2xl"
              priority
            />
            <button
              onClick={() => {
                setShowTarjetaBanner(false);
                localStorage.setItem("sd-tarjeta-banner-seen", "1");
              }}
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
