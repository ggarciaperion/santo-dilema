"use client";

import { useState, useEffect, useRef } from "react";

interface BannerSlide {
  movil: string;
  web: string;
}

interface BannerCarouselProps {
  slides: BannerSlide[];
  intervalMs?: number;
}

function isVideo(src: string) {
  return src.endsWith(".mp4") || src.endsWith(".webm") || src.endsWith(".ogg");
}

export default function BannerCarousel({ slides, intervalMs = 5000 }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = (index: number) => {
    setCurrent(index);
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slides.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
      }, intervalMs);
    }
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, intervalMs]);

  if (slides.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-black">
      <div className="relative w-full bg-black">
        {slides.map((slide, index) => {
          const active = index === current;
          return (
            <div
              key={index}
              className="w-full"
              style={{ display: active ? "block" : "none" }}
            >
              {/* Móvil */}
              {isVideo(slide.movil) ? (
                <video
                  key={`movil-${index}-${active}`}
                  src={slide.movil}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="block md:hidden w-full h-auto object-cover"
                />
              ) : (
                <img
                  src={slide.movil}
                  alt={`Banner móvil ${index + 1}`}
                  className="block md:hidden w-full h-auto object-cover"
                />
              )}
              {/* Web */}
              {isVideo(slide.web) ? (
                <video
                  key={`web-${index}-${active}`}
                  src={slide.web}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="hidden md:block w-full h-auto object-contain"
                  style={{ maxHeight: "140px", objectPosition: "center" }}
                />
              ) : (
                <img
                  src={slide.web}
                  alt={`Banner web ${index + 1}`}
                  className="hidden md:block w-full h-auto object-contain"
                  style={{ maxHeight: "140px", objectPosition: "center" }}
                />
              )}
            </div>
          );
        })}

        {/* Indicadores (solo si hay más de 1 slide) */}
        {slides.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => { goTo(index); resetTimer(); }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === current
                    ? "bg-white scale-125"
                    : "bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
