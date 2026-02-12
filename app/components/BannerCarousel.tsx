"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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

export default function BannerCarousel({ slides, intervalMs = 6000 }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const movilRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const webRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const playSlide = useCallback((index: number) => {
    slides.forEach((_, i) => {
      const mv = movilRefs.current[i];
      const wb = webRefs.current[i];
      if (i === index) {
        mv?.play().catch(() => {});
        wb?.play().catch(() => {});
      } else {
        mv?.pause();
        wb?.pause();
      }
    });
  }, [slides]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slides.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((prev) => {
          const next = (prev + 1) % slides.length;
          playSlide(next);
          return next;
        });
      }, intervalMs);
    }
  }, [slides.length, intervalMs, playSlide]);

  useEffect(() => {
    // Reproducir primer slide al montar
    playSlide(0);
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const goTo = (index: number) => {
    setCurrent(index);
    playSlide(index);
    startTimer();
  };

  if (slides.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-black">
      <div className="relative w-full bg-black">
        {slides.map((slide, index) => (
          <div
            key={index}
            className="w-full"
            style={{
              position: index === 0 ? "relative" : "absolute",
              top: 0,
              left: 0,
              opacity: index === current ? 1 : 0,
              transition: "opacity 0.4s ease",
              pointerEvents: index === current ? "auto" : "none",
            }}
          >
            {/* Móvil */}
            {isVideo(slide.movil) ? (
              <video
                ref={(el) => { movilRefs.current[index] = el; }}
                src={slide.movil}
                autoPlay={index === 0}
                loop
                muted
                playsInline
                preload={index === 0 ? "auto" : "metadata"}
                className="block md:hidden w-full h-auto object-cover"
              />
            ) : (
              <img
                src={slide.movil}
                alt={`Banner móvil ${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
                className="block md:hidden w-full h-auto object-cover"
              />
            )}
            {/* Web */}
            {isVideo(slide.web) ? (
              <video
                ref={(el) => { webRefs.current[index] = el; }}
                src={slide.web}
                autoPlay={index === 0}
                loop
                muted
                playsInline
                preload={index === 0 ? "auto" : "metadata"}
                className="hidden md:block w-full h-auto object-contain"
                style={{ maxHeight: "140px", objectPosition: "center" }}
              />
            ) : (
              <img
                src={slide.web}
                alt={`Banner web ${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
                className="hidden md:block w-full h-auto object-contain"
                style={{ maxHeight: "140px", objectPosition: "center" }}
              />
            )}
          </div>
        ))}

        {/* Indicadores */}
        {slides.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
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
