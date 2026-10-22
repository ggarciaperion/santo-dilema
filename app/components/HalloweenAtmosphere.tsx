"use client";

import { useEffect, useRef } from "react";
import { halloweenMode, type HwAccent } from "@/lib/halloween";

const ACCENT_COLORS: Record<HwAccent, { r: number; g: number; b: number }> = {
  red:    { r: 239, g: 68,  b: 68  },
  cyan:   { r: 6,   g: 182, b: 212 },
  green:  { r: 16,  g: 185, b: 129 },
  amber:  { r: 245, g: 158, b: 11  },
  orange: { r: 251, g: 146, b: 60  },
  purple: { r: 168, g: 85,  b: 247 },
};

interface Props {
  accent: HwAccent;
}

export default function HalloweenAtmosphere({ accent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!halloweenMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const color = ACCENT_COLORS[accent];

    // Resize canvas to match window
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Ember particles
    type Ember = {
      x: number;
      y: number;
      size: number;
      speed: number;
      drift: number;
      alpha: number;
      alphaSpeed: number;
      phase: number;
    };

    const EMBER_COUNT = 18;
    const embers: Ember[] = Array.from({ length: EMBER_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + Math.random() * 80,
      size: 1.2 + Math.random() * 2.2,
      speed: 0.3 + Math.random() * 0.7,
      drift: (Math.random() - 0.5) * 0.4,
      alpha: 0.4 + Math.random() * 0.5,
      alphaSpeed: 0.005 + Math.random() * 0.012,
      phase: Math.random() * Math.PI * 2,
    }));

    let animId: number;
    let t = 0;

    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Bottom fog gradient
      const fogH = Math.min(canvas.height * 0.28, 260);
      const fog = ctx.createLinearGradient(0, canvas.height - fogH, 0, canvas.height);
      fog.addColorStop(0, `rgba(${color.r},${color.g},${color.b},0)`);
      fog.addColorStop(0.5, `rgba(${color.r},${color.g},${color.b},0.04)`);
      fog.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0.11)`);
      ctx.fillStyle = fog;
      ctx.fillRect(0, canvas.height - fogH, canvas.width, fogH);

      // Animated fog band
      const bandY = canvas.height - fogH * 0.45 + Math.sin(t * 0.3) * 8;
      const band = ctx.createLinearGradient(0, bandY - 30, 0, bandY + 30);
      band.addColorStop(0, `rgba(${color.r},${color.g},${color.b},0)`);
      band.addColorStop(0.5, `rgba(${color.r},${color.g},${color.b},0.06)`);
      band.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`);
      ctx.fillStyle = band;
      ctx.fillRect(0, bandY - 30, canvas.width, 60);

      // Embers
      embers.forEach((e) => {
        e.y -= e.speed;
        e.x += e.drift + Math.sin(t * 1.1 + e.phase) * 0.3;
        e.alpha += Math.sin(t * 2.2 + e.phase) * e.alphaSpeed;
        e.alpha = Math.max(0.15, Math.min(0.85, e.alpha));

        if (e.y < -10) {
          e.y = canvas.height + 10;
          e.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.globalAlpha = e.alpha;
        ctx.shadowColor = `rgba(${color.r},${color.g},${color.b},0.9)`;
        ctx.shadowBlur = 6;
        ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},1)`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [accent]);

  if (!halloweenMode) return null;

  const color = ACCENT_COLORS[accent];
  const c = `${color.r},${color.g},${color.b}`;

  return (
    <>
      {/* Dark vignette overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          background: `radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.55) 100%)`,
        }}
      />

      {/* Top edge shadow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "120px",
          pointerEvents: "none",
          zIndex: 1,
          background: `linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)`,
        }}
      />

      {/* Side edge glows */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "80px",
          pointerEvents: "none",
          zIndex: 1,
          background: `linear-gradient(to right, rgba(${c},0.06), transparent)`,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "80px",
          pointerEvents: "none",
          zIndex: 1,
          background: `linear-gradient(to left, rgba(${c},0.06), transparent)`,
        }}
      />

      {/* Ember canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </>
  );
}
