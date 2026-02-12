"use client";

import { useState, useEffect, useRef } from "react";

interface BannerSlide {
  movil?: string;
  web?: string;
}

interface BannerCarouselProps {
  slides: BannerSlide[];
  intervalMs?: number;
  webHeight?: number;
  movilHeight?: number;
}

function isVideo(src: string) {
  const clean = src.split("?")[0];
  return clean.endsWith(".mp4") || clean.endsWith(".webm") || clean.endsWith(".ogg");
}

export default function BannerCarousel({
  slides,
  intervalMs = 6000,
  webHeight = 140,
  movilHeight = 200,
}: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const movilRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const webRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const hasMovil = slides.some((s) => s.movil);
  const hasWeb = slides.some((s) => s.web);

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

  return (
    <section className={`relative w-full bg-black overflow-hidden ${!hasMovil ? "hidden md:block" : ""}`}>
      {/* Contenedor móvil */}
      {hasMovil && (
        <div
          className="relative block md:hidden w-full overflow-hidden"
          style={movilHeight ? { height: movilHeight } : {}}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              style={{
                position: movilHeight ? "absolute" : (index === 0 ? "relative" : "absolute"),
                inset: 0,
                opacity: index === current ? 1 : 0,
                transition: "opacity 0.5s ease",
                zIndex: index === current ? 1 : 0,
              }}
            >
              {slide.movil && (
                isVideo(slide.movil) ? (
                  <video
                    ref={(el) => { movilRefs.current[index] = el; }}
                    src={slide.movil}
                    autoPlay={index === 0}
                    loop muted playsInline preload="auto"
                    className={`w-full block ${movilHeight ? "h-full object-cover" : "h-auto"}`}
                  />
                ) : (
                  <img
                    src={slide.movil}
                    alt=""
                    className={`w-full block ${movilHeight ? "h-full object-cover" : "h-auto"}`}
                  />
                )
              )}
            </div>
          ))}
          {slides.length > 1 && <Dots slides={slides} current={current} onGoTo={(i) => { if (timerRef.current) clearInterval(timerRef.current); goTo(i); }} />}
        </div>
      )}

      {/* Contenedor web */}
      {hasWeb && (
        <div className={`relative ${hasMovil ? "hidden md:block" : "block"} w-full overflow-hidden rounded-lg`}>
          {/* Slide 0 visible define la altura natural */}
          {slides.map((slide, index) => (
            <div
              key={index}
              style={{
                position: index === 0 ? "relative" : "absolute",
                inset: 0,
                opacity: index === current ? 1 : 0,
                transition: "opacity 0.5s ease",
                zIndex: index === current ? 1 : 0,
              }}
            >
              {slide.web && (
                isVideo(slide.web) ? (
                  <video
                    ref={(el) => { webRefs.current[index] = el; }}
                    src={slide.web}
                    autoPlay={index === 0}
                    loop muted playsInline preload="auto"
                    className="w-full h-auto block"
                  />
                ) : (
                  <img src={slide.web} alt="" className="w-full h-auto block" />
                )
              )}
            </div>
          ))}
          {slides.length > 1 && <Dots slides={slides} current={current} onGoTo={(i) => { if (timerRef.current) clearInterval(timerRef.current); goTo(i); }} />}
        </div>
      )}
    </section>
  );
}

function Dots({ slides, current, onGoTo }: { slides: BannerSlide[]; current: number; onGoTo: (i: number) => void }) {
  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
      {slides.map((_, index) => (
        <button
          key={index}
          onClick={() => onGoTo(index)}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            index === current ? "bg-white scale-125" : "bg-white/40 hover:bg-white/70"
          }`}
        />
      ))}
    </div>
  );
}
