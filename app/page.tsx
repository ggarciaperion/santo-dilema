"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";


export default function Home() {
  const router = useRouter();
  const [showIntro, setShowIntro]       = useState(true);
  const [introExiting, setIntroExiting] = useState(false);

  // Intro timing: fade out at 2.1s, redirect to /menu at 2.6s
  useEffect(() => {
    const t1 = setTimeout(() => setIntroExiting(true), 2100);
    const t2 = setTimeout(() => { setShowIntro(false); router.replace("/menu"); }, 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [router]);


  return (
    <main className="h-[100dvh] w-screen bg-black overflow-hidden relative flex items-center justify-center">

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

    </main>
  );
}
