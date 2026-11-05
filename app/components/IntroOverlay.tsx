"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function IntroOverlay() {
  const [phase, setPhase] = useState<"visible" | "fading" | "done">("visible");

  useEffect(() => {
    // Logo animation is 800ms; keep it settled for ~1 s before fading
    const t1 = setTimeout(() => setPhase("fading"), 2200);
    const t2 = setTimeout(() => setPhase("done"),   2650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white"
      style={{
        transition: "opacity 450ms ease-in-out",
        opacity: phase === "fading" ? 0 : 1,
        pointerEvents: phase === "fading" ? "none" : "auto",
      }}
    >
      <style>{`
        /* Logo: scale + translateY + opacity — el protagonista */
        @keyframes sdLogoIn {
          from { opacity: 0; transform: translateY(12px) scale(0.88); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes sdLineIn {
          from { width: 0;     opacity: 0; }
          to   { width: 180px; opacity: 1; }
        }
        @keyframes sdTagIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes sdLogoIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes sdLineIn { from { opacity: 0; } to { opacity: 1; } }
        }
      `}</style>

      <div className="flex flex-col items-center select-none">

        {/* ── LOGO — animación principal ── */}
        <div style={{ animation: "sdLogoIn 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both" }}>
          <Image
            src="/3334.png"
            alt="Santo Dilema"
            width={320}
            height={320}
            priority
            className="w-[clamp(160px,40vw,300px)] h-auto"
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* Divider — aparece tras el logo */}
        <div
          className="mx-auto h-px mt-4"
          style={{
            background: "linear-gradient(90deg, transparent, #fbbf24, transparent)",
            animation: "sdLineIn 0.6s ease-out 0.65s both",
            width: 0,
            opacity: 0,
          }}
        />

        {/* Tagline */}
        <p
          className="font-bold mt-3 uppercase"
          style={{
            color: "#F58424",
            fontSize: "0.72rem",
            letterSpacing: "0.35em",
            animation: "sdTagIn 0.7s ease-out 0.85s both",
            opacity: 0,
          }}
        >
          PREMIUM DARK KITCHEN
        </p>

      </div>
    </div>
  );
}
