"use client";

import Link from "next/link";

export default function CombosButton() {
  return (
    <Link
      href="/combos"
      className="fixed bottom-4 right-3 md:bottom-6 md:right-4 z-40 flex items-center gap-2 bg-gray-900/90 border border-emerald-500/50 rounded-full pl-2.5 pr-3.5 py-2 transition-all duration-300 hover:border-emerald-400 hover:scale-105 group"
      style={{ boxShadow: "0 0 10px rgba(16,185,94,0.3), 0 0 20px rgba(16,185,94,0.1)" }}
    >
      <span className="text-base leading-none select-none">🔥</span>
      <span className="text-emerald-400 text-[11px] md:text-xs font-bold whitespace-nowrap leading-none">
        Ver Combos
      </span>
    </Link>
  );
}
