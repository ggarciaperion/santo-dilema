"use client";

import { useState, useEffect, useRef } from "react";

interface BannerSlide {
  movil?: string;
  web?: string;
}

interface BannerCarouselProps {
  slides: BannerSlide[];
  intervalMs?: number;
}

function isVideo(src: string) {
  const clean = src.split("?")[0];
  return clean.endsWith(".mp4") || clean.endsWith(".webm") || clean.endsWith(".ogg");
}

export default function BannerCarousel({ slides, intervalMs = 6000 }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const movilRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const webRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const goTo = (index: number) => {
    movilRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === index) { v.currentTime = 0; v.play().catch(() => {}); }
      else v.pause();
    });
    webRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === index) { v.currentTime = 0; v.play().catch(() => {}); }
      else v.pause();
    });
    setCurrent(index);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % slides.length;
        movilRefs.current.forEach((v, i) => {
          if (!v) return;
          if (i === next) { v.currentTime = 0; v.play().catch(() => {}); }
          else v.pause();
        });
        webRefs.current.forEach((v, i) => {
          if (!v) return;
          if (i === next) { v.currentTime = 0; v.play().catch(() => {}); }
          else v.pause();
        });
        return next;
      });
    }, intervalMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slides.length, intervalMs]);

  if (slides.length === 0) return null;

  const hasMovil = slides.some((s) => s.movil);
  const hasWeb = slides.some((s) => s.web);

  return (
    <section className={`relative w-full bg-black overflow-hidden ${!hasMovil ? "hidden md:block" : ""}`}>
      <div className="relative w-full">
        {slides.map((slide, index) => {
          const active = index === current;
          return (
            <div
              key={index}
              style={{
                position: index === 0 ? "relative" : "absolute",
                inset: 0,
                opacity: active ? 1 : 0,
                transition: "opacity 0.5s ease",
                zIndex: active ? 1 : 0,
                pointerEvents: active ? "auto" : "none",
              }}
            >
              {/* Móvil */}
              {slide.movil && (
                isVideo(slide.movil) ? (
                  <video
                    ref={(el) => { movilRefs.current[index] = el; }}
                    src={slide.movil}
                    autoPlay={index === 0}
                    loop muted playsInline preload="auto"
                    className="block md:hidden w-full h-auto object-cover"
                  />
                ) : (
                  <img
                    src={slide.movil}
                    alt={`Banner móvil ${index + 1}`}
                    className="block md:hidden w-full h-auto object-cover"
                  />
                )
              )}
              {/* Web */}
              {slide.web && (
                isVideo(slide.web) ? (
                  <video
                    ref={(el) => { webRefs.current[index] = el; }}
                    src={slide.web}
                    autoPlay={index === 0}
                    loop muted playsInline preload="auto"
                    className={`${slide.movil ? "hidden md:block" : "w-full"} h-auto object-contain`}
                    style={{ maxHeight: "140px", objectPosition: "center" }}
                  />
                ) : (
                  <img
                    src={slide.web}
                    alt={`Banner web ${index + 1}`}
                    className={`${slide.movil ? "hidden md:block" : "w-full"} h-auto object-contain`}
                    style={{ maxHeight: "140px", objectPosition: "center" }}
                  />
                )
              )}
            </div>
          );
        })}

        {/* Indicadores */}
        {slides.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  goTo(index);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === current ? "bg-white scale-125" : "bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
