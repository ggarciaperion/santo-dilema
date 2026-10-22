// Central Halloween configuration — all pages read from here.
// Toggle halloweenMode = false to revert to normal theme globally.

export const halloweenMode = true;

export const hw = {
  fat: {
    neon: "#ef4444",
    rgb: "239,68,68",
    glow: "rgba(239,68,68,0.4)",
    accent: "red" as const,
  },
  fit: {
    neon: "#06b6d4",
    rgb: "6,182,212",
    glow: "rgba(6,182,212,0.35)",
    accent: "cyan" as const,
  },
  tacos: {
    neon: "#10b981",
    rgb: "16,185,129",
    glow: "rgba(16,185,129,0.35)",
    accent: "green" as const,
  },
  combos: {
    neon: "#f59e0b",
    rgb: "245,158,11",
    glow: "rgba(245,158,11,0.4)",
    accent: "amber" as const,
  },
  burgers: {
    neon: "#fb923c",
    rgb: "251,146,60",
    glow: "rgba(251,146,60,0.4)",
    accent: "orange" as const,
  },
  carta: {
    neon: "#a855f7",
    rgb: "168,85,247",
    glow: "rgba(168,85,247,0.35)",
    accent: "purple" as const,
  },
  global: {
    neon: "#a855f7",
    rgb: "168,85,247",
    glow: "rgba(168,85,247,0.35)",
    accent: "purple" as const,
  },
} as const;

export type HwAccent = "red" | "cyan" | "green" | "amber" | "orange" | "purple";
