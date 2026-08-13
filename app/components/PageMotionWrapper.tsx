"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

type PageColor = "cyan" | "red" | "green" | "gold";

const COLOR_MAP: Record<PageColor, { rgb: string; hex: string }> = {
  cyan:  { rgb: "6,182,212",   hex: "#06b6d4" },
  red:   { rgb: "239,68,68",   hex: "#ef4444" },
  green: { rgb: "16,185,129",  hex: "#10b981" },
  gold:  { rgb: "245,158,11",  hex: "#f59e0b" },
};

/* Partículas flotantes tipo brasa por color */
function AmbientParticle({
  x, delay, duration, color,
}: { x: number; delay: number; duration: number; color: string }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, bottom: -6 }}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: [0, 0.5, 0.4, 0], y: [0, -100, -180, -250], x: [0, 12, -8, 15] }}
      transition={{ duration, delay, repeat: Infinity, repeatDelay: Math.random() * 4 + 1, ease: "easeOut" }}
    >
      <div
        className="rounded-full"
        style={{ width: "3px", height: "3px", background: color, boxShadow: `0 0 5px ${color}` }}
      />
    </motion.div>
  );
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: 4 + (i * 5.3) % 92,
  delay: (i * 0.31) % 4,
  duration: 3 + (i * 0.4) % 3,
}));

export default function PageMotionWrapper({
  children,
  color = "cyan",
  className = "",
}: {
  children: React.ReactNode;
  color?: PageColor;
  className?: string;
}) {
  const { rgb, hex } = COLOR_MAP[color];

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Ambient particles */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {PARTICLES.map((p) => (
          <AmbientParticle key={p.id} x={p.x} delay={p.delay} duration={p.duration} color={hex} />
        ))}

        {/* Top gradient glow */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, transparent, rgba(${rgb},0.9), transparent)` }}
          animate={{ opacity: [0.5, 1, 0.5], scaleX: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Side glows */}
        <motion.div
          className="absolute left-0 top-1/4 w-px h-1/2 pointer-events-none"
          style={{ background: `linear-gradient(180deg, transparent, rgba(${rgb},0.4), transparent)` }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-0 top-1/4 w-px h-1/2 pointer-events-none"
          style={{ background: `linear-gradient(180deg, transparent, rgba(${rgb},0.4), transparent)` }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* Page content */}
      {children}
    </motion.div>
  );
}
