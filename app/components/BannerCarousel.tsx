"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface BannerSlide {
  /** Ruta de imagen para móvil (ej: /1920x300/1.png) */
  movil?: string;
  /** Ruta de imagen para desktop (ej: /1920x500/1.png) */
  web?: string;
  alt?: string;
}

interface BannerCarouselProps {
  slides: BannerSlide[];
  /** Intervalo autoplay en ms (default: 4000) */
  intervalMs?: number;
}

export default function BannerCarousel({
  slides,
  intervalMs = 4000,
}: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const count = slides.length;

  const go = useCallback(
    (idx: number) => setCurrent((idx + count) % count),
    [count]
  );
  const next = useCallback(() => go(current + 1), [current, go]);
  const prev = useCallback(() => go(current - 1), [current, go]);

  // Autoplay — se pausa en hover (desktop)
  useEffect(() => {
    if (paused || count <= 1) return;
    timerRef.current = setInterval(next, intervalMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, next, intervalMs, count]);

  // ── Swipe táctil ──────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (touchDeltaX.current < -40) next();
    else if (touchDeltaX.current > 40) prev();
  };

  if (count === 0) return null;

  const hasMovil = slides.some((s) => s.movil);
  const hasWeb = slides.some((s) => s.web);

  return (
    <div
      className="relative w-full overflow-hidden bg-black select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Track deslizante ─────────────────────────────────────── */}
      <div
        className="flex transition-transform duration-500 ease-in-out will-change-transform"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="relative w-full flex-shrink-0">

            {/* Móvil: 1920×500 */}
            {hasMovil && slide.movil && (
              <div
                className="block md:hidden w-full"
                style={{ aspectRatio: "1920/500" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.movil}
                  alt={slide.alt ?? `Banner ${i + 1}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            )}

            {/* Desktop: 1920×300 */}
            {hasWeb && slide.web && (
              <div
                className={`w-full ${hasMovil ? "hidden md:block" : "block"}`}
                style={{ aspectRatio: "1920/300" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.web}
                  alt={slide.alt ?? `Banner ${i + 1}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Flechas (solo desktop, solo si hay más de 1 slide) ───── */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Banner anterior"
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-black/50 hover:bg-black/75 text-white transition-all backdrop-blur-sm border border-white/10 hover:scale-110 active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Siguiente banner"
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-black/50 hover:bg-black/75 text-white transition-all backdrop-blur-sm border border-white/10 hover:scale-110 active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
        </>
      )}

      {/* ── Dots ─────────────────────────────────────────────────── */}
      {count > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Ir al banner ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-5 h-1.5 bg-white"
                  : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
