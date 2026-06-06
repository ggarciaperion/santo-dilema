"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── PRIZE CONFIG ─────────────────────────────────────────────────────────────
// weight = probabilidad relativa (mayor = más frecuente)
const PRIZES = [
  { id: 0,  label: "Alitas Gratis",         line1: "Alitas",    line2: "Gratis",      emoji: "🍗", color: "#ef4444", dark: false, weight: 3 },
  { id: 1,  label: "20% de Descuento",       line1: "20%",       line2: "Descuento",   emoji: "🏷️", color: "#f59e0b", dark: true,  weight: 3 },
  { id: 2,  label: "Dúo de Tacos",           line1: "Dúo de",    line2: "Tacos",       emoji: "🌮", color: "#059669", dark: false, weight: 2 },
  { id: 3,  label: "Tomatodo Santo Dilema",  line1: "Tomatodo",  line2: "SD",          emoji: "🧴", color: "#7c3aed", dark: false, weight: 1 },
  { id: 4,  label: "Alitas + Papas Fritas",  line1: "Alitas +",  line2: "Papas",       emoji: "🍟", color: "#f97316", dark: false, weight: 2 },
  { id: 5,  label: "20% de Descuento",       line1: "20%",       line2: "Descuento",   emoji: "🏷️", color: "#b45309", dark: false, weight: 3 },
  { id: 6,  label: "Llavero Santo Dilema",   line1: "Llavero",   line2: "SD",          emoji: "🗝️", color: "#0891b2", dark: false, weight: 2 },
  { id: 7,  label: "Alitas Gratis",          line1: "Alitas",    line2: "Gratis",      emoji: "🍗", color: "#dc2626", dark: false, weight: 3 },
  { id: 8,  label: "30% de Descuento",       line1: "30%",       line2: "Descuento",   emoji: "⭐", color: "#ec4899", dark: false, weight: 1 },
  { id: 9,  label: "Dúo de Tacos",           line1: "Dúo de",    line2: "Tacos",       emoji: "🌮", color: "#10b981", dark: false, weight: 2 },
  { id: 10, label: "Ensalada César",         line1: "Ensalada",  line2: "César",       emoji: "🥗", color: "#0d9488", dark: false, weight: 2 },
  { id: 11, label: "Taza Sublimada",         line1: "Taza",      line2: "Sublimada",   emoji: "☕", color: "#d946ef", dark: false, weight: 1 },
] as const;

type Prize = typeof PRIZES[number];
type Phase = "idle" | "spinning" | "result";

const N = PRIZES.length;
const SEG = (2 * Math.PI) / N;
const DURATION = 7000;

// Easing: rápida aceleración, larga y dramática desaceleración
function easeWheel(t: number): number {
  if (t < 0.12) return (t / 0.12) * (t / 0.12) * 0.08;
  const t2 = (t - 0.12) / 0.88;
  return 0.08 + 0.92 * (1 - Math.pow(1 - t2, 4));
}

function getWinner(rot: number): Prize {
  const angle = ((-Math.PI / 2 - rot) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  return PRIZES[Math.floor(angle / SEG) % N];
}

function pickWeightedSegment(): number {
  const total = PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < PRIZES.length; i++) {
    r -= PRIZES[i].weight;
    if (r <= 0) return i;
  }
  return N - 1;
}

function playTick(ctx: AudioContext, vol = 0.25) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 900;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  } catch {}
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function RuletaPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [winner, setWinner] = useState<Prize | null>(null);

  const wheelRef  = useRef<HTMLCanvasElement>(null);
  const confRef   = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const rotRef    = useRef(0);
  const animRef   = useRef(0);
  const audioRef  = useRef<AudioContext | null>(null);
  const lastSegRef = useRef(-1);
  const startTRef = useRef(0);
  const startRotRef = useRef(0);
  const deltaRef  = useRef(0);

  // ── DRAW ────────────────────────────────────────────────────────────────────
  const draw = useCallback((rot: number) => {
    const canvas = wheelRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const S = canvas.width;
    const cx = S / 2, cy = S / 2;
    const R = S / 2 - 6;

    ctx.clearRect(0, 0, S, S);

    // Outer glow
    const og = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R + 10);
    og.addColorStop(0, "rgba(245,158,11,0)");
    og.addColorStop(1, "rgba(245,158,11,0.35)");
    ctx.beginPath();
    ctx.arc(cx, cy, R + 10, 0, 2 * Math.PI);
    ctx.fillStyle = og;
    ctx.fill();

    // Segments
    for (let i = 0; i < N; i++) {
      const p = PRIZES[i];
      const a0 = rot + i * SEG;
      const a1 = rot + (i + 1) * SEG;
      const am = rot + (i + 0.5) * SEG;

      // Base fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, a0, a1);
      ctx.closePath();
      ctx.fillStyle = p.color;
      ctx.fill();

      // Sheen overlay
      const sh = ctx.createLinearGradient(
        cx + Math.cos(am) * R * 0.2, cy + Math.sin(am) * R * 0.2,
        cx + Math.cos(am) * R,       cy + Math.sin(am) * R
      );
      sh.addColorStop(0, "rgba(255,255,255,0.18)");
      sh.addColorStop(1, "rgba(0,0,0,0.18)");
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, a0, a1);
      ctx.closePath();
      ctx.fillStyle = sh;
      ctx.fill();

      // Divider
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R);
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(am);
      const tc = p.dark ? "#000" : "#fff";
      const fs = S * 0.038;

      // Emoji
      ctx.font = `${S * 0.052}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = tc;
      ctx.fillText(p.emoji, R * 0.83, 0);

      // Label lines
      ctx.font = `900 ${fs}px system-ui,-apple-system,sans-serif`;
      ctx.fillStyle = tc;
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 4;
      ctx.fillText(p.line1, R * 0.5, -fs * 0.7);
      ctx.fillText(p.line2, R * 0.5,  fs * 0.7);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Outer border
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 5;
    ctx.stroke();

    // Gold dots at segment boundaries
    for (let i = 0; i < N; i++) {
      const a = rot + i * SEG;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
    }

    // Hub
    const hub = ctx.createRadialGradient(cx - 8, cy - 8, 0, cx, cy, R * 0.13);
    hub.addColorStop(0, "#fcd34d");
    hub.addColorStop(1, "#78350f");
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.13, 0, 2 * Math.PI);
    ctx.fillStyle = hub;
    ctx.fill();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    ctx.stroke();

    // SD in hub
    ctx.fillStyle = "#fff";
    ctx.font = `900 ${R * 0.08}px system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SD", cx, cy);
  }, []);

  // ── RESIZE ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const canvas = wheelRef.current;
      const wrap   = wrapRef.current;
      if (!canvas || !wrap) return;
      const size = Math.min(wrap.clientWidth, wrap.clientHeight, 720);
      canvas.width  = size;
      canvas.height = size;
      draw(rotRef.current);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  // ── CONFETTI ────────────────────────────────────────────────────────────────
  const launchConfetti = useCallback(() => {
    const canvas = confRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cols = ["#ef4444","#f59e0b","#d946ef","#06b6d4","#10b981","#ec4899","#f97316","#fff"];
    const pcs  = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: -30 - Math.random() * 200,
      w: 6 + Math.random() * 8,
      h: 3 + Math.random() * 5,
      col: cols[Math.floor(Math.random() * cols.length)],
      vx: (Math.random() - 0.5) * 7,
      vy: 4 + Math.random() * 5,
      vr: (Math.random() - 0.5) * 12,
      r: Math.random() * 360,
    }));

    let frame = 0;
    function loop() {
      if (frame > 220) { ctx!.clearRect(0, 0, canvas!.width, canvas!.height); return; }
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const p of pcs) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.r += p.vr;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.r * Math.PI) / 180);
        ctx!.fillStyle = p.col;
        ctx!.globalAlpha = Math.max(0, 1 - frame / 180);
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx!.restore();
      }
      frame++;
      requestAnimationFrame(loop);
    }
    loop();
  }, []);

  // ── SPIN ────────────────────────────────────────────────────────────────────
  const spin = useCallback(() => {
    if (phase !== "idle") return;

    if (!audioRef.current) {
      try { audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch {}
    }

    setPhase("spinning");
    startRotRef.current  = rotRef.current;
    const target         = pickWeightedSegment();
    // Aim pointer at center of target segment, slightly randomised
    const targetAngle    = -(target + 0.5 + (Math.random() - 0.5) * 0.7) * SEG - Math.PI / 2;
    const fullSpins      = (10 + Math.floor(Math.random() * 6)) * 2 * Math.PI;
    // Ensure we always spin clockwise (positive delta)
    let delta = (targetAngle - startRotRef.current + fullSpins) % (2 * Math.PI);
    if (delta <= 0) delta += 2 * Math.PI;
    delta += Math.floor(10 + Math.random() * 5) * 2 * Math.PI;
    deltaRef.current = delta;
    startTRef.current = 0;
    lastSegRef.current = -1;

    function frame(ts: number) {
      if (!startTRef.current) startTRef.current = ts;
      const t  = Math.min((ts - startTRef.current) / DURATION, 1);
      const et = easeWheel(t);
      const rot = startRotRef.current + et * deltaRef.current;
      rotRef.current = rot;
      draw(rot);

      // Tick
      const seg = Math.floor(
        (((-Math.PI / 2 - rot) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) / SEG
      ) % N;
      if (seg !== lastSegRef.current && audioRef.current) {
        const vol = t > 0.75 ? 0.15 : t > 0.5 ? 0.22 : 0.28;
        playTick(audioRef.current, vol);
        lastSegRef.current = seg;
      }

      if (t < 1) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        const won = getWinner(rotRef.current);
        setWinner(won);
        setPhase("result");
        launchConfetti();
        try {
          const a = new Audio("/sonido.mp3");
          a.volume = 0.65;
          a.play().catch(() => {});
        } catch {}
      }
    }

    animRef.current = requestAnimationFrame(frame);
  }, [phase, draw, launchConfetti]);

  const reset = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    setWinner(null);
    setPhase("idle");
  }, []);

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg,#0a0a0a 0%,#120800 45%,#0a001a 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
      padding: "12px 16px",
      touchAction: "manipulation",
      userSelect: "none",
      WebkitUserSelect: "none",
    }}>

      {/* Ambient background glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background:
          "radial-gradient(ellipse at 25% 35%, rgba(217,70,239,0.12) 0%, transparent 55%)," +
          "radial-gradient(ellipse at 75% 65%, rgba(245,158,11,0.1) 0%, transparent 55%)," +
          "radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.06) 0%, transparent 60%)",
      }} />

      {/* Confetti canvas (fixed overlay) */}
      <canvas ref={confRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:300 }} />

      {/* Logo */}
      <img
        src="/logoprincipal.png"
        alt="Santo Dilema"
        style={{ height: "clamp(44px,7vw,72px)", objectFit:"contain", marginBottom:8, zIndex:1, filter:"drop-shadow(0 0 12px rgba(245,158,11,0.5))" }}
      />

      {/* Title */}
      <h1 style={{
        fontFamily: "var(--font-graffiti), system-ui, sans-serif",
        color: "#f59e0b",
        fontSize: "clamp(1.35rem,4.5vw,2.8rem)",
        margin: "0 0 2px",
        textAlign: "center",
        letterSpacing: 3,
        textShadow: "0 0 20px rgba(245,158,11,0.9),0 0 50px rgba(245,158,11,0.4)",
        zIndex: 1,
      }}>
        ¡LA RULETA DE LA SUERTE!
      </h1>
      <p style={{
        fontFamily: "var(--font-graffiti), system-ui, sans-serif",
        color: "#d97706", fontSize: "clamp(0.7rem,2vw,1rem)",
        margin: "0 0 16px", letterSpacing:2, zIndex:1,
      }}>
        TODOS GANAN — GIRA Y DESCUBRE TU PREMIO
      </p>

      {/* Wheel area */}
      <div ref={wrapRef} style={{
        position: "relative",
        width: "min(82vw, 82vh, 700px)",
        height: "min(82vw, 82vh, 700px)",
        zIndex: 1,
        flexShrink: 0,
      }}>

        {/* Pointer arrow */}
        <div style={{
          position: "absolute", top: -22, left: "50%",
          transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "20px solid transparent",
          borderRight: "20px solid transparent",
          borderTop: "42px solid #f59e0b",
          filter: "drop-shadow(0 0 10px rgba(245,158,11,1)) drop-shadow(0 0 24px rgba(245,158,11,0.6))",
          zIndex: 10,
        }} />

        {/* Decorative outer ring glow */}
        <div style={{
          position:"absolute", inset:-8, borderRadius:"50%",
          boxShadow: phase === "spinning"
            ? "0 0 50px rgba(245,158,11,0.8), 0 0 100px rgba(245,158,11,0.4), 0 0 160px rgba(217,70,239,0.2)"
            : "0 0 30px rgba(245,158,11,0.5), 0 0 60px rgba(245,158,11,0.2)",
          transition: "box-shadow 0.5s ease",
          pointerEvents: "none",
        }} />

        <canvas ref={wheelRef} style={{
          width:"100%", height:"100%",
          borderRadius:"50%",
          display:"block",
        }} />
      </div>

      {/* Spin button */}
      {phase === "idle" && (
        <button
          onClick={spin}
          style={{
            marginTop: 28,
            padding: "clamp(14px,3vw,22px) clamp(32px,8vw,64px)",
            fontSize: "clamp(1.1rem,3.5vw,1.75rem)",
            fontFamily: "var(--font-graffiti), system-ui, sans-serif",
            fontWeight: 900,
            background: "linear-gradient(135deg,#f59e0b 0%,#d97706 50%,#f59e0b 100%)",
            backgroundSize: "200% 200%",
            color: "#000",
            border: "none",
            borderRadius: 16,
            cursor: "pointer",
            letterSpacing: 3,
            boxShadow: "0 0 35px rgba(245,158,11,0.8),0 4px 24px rgba(0,0,0,0.6)",
            animation: "sdPulse 1.8s ease-in-out infinite",
            touchAction: "manipulation",
            zIndex: 1,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          GIRAR LA RULETA
        </button>
      )}

      {phase === "spinning" && (
        <div style={{
          marginTop: 28,
          fontFamily: "var(--font-graffiti), system-ui, sans-serif",
          color: "#f59e0b",
          fontSize: "clamp(1rem,3vw,1.5rem)",
          letterSpacing: 4,
          animation: "sdBlink 0.6s step-end infinite",
          zIndex: 1,
        }}>
          GIRANDO...
        </div>
      )}

      {/* Winner modal */}
      {phase === "result" && winner && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.88)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          animation: "sdFadeIn 0.35s ease",
        }}>
          <div style={{
            background: "linear-gradient(160deg,#1c1c1c,#0a0a0a)",
            border: `3px solid ${winner.color}`,
            borderRadius: 28,
            padding: "clamp(28px,5vw,48px) clamp(24px,6vw,56px)",
            maxWidth: "min(92vw,520px)",
            width: "100%",
            textAlign: "center",
            boxShadow: `0 0 70px ${winner.color}99, 0 0 140px ${winner.color}44, 0 24px 80px rgba(0,0,0,0.7)`,
            animation: "sdPopIn 0.55s cubic-bezier(0.34,1.56,0.64,1)",
          }}>

            <div style={{ fontSize:"clamp(2rem,8vw,3.5rem)", marginBottom:4, lineHeight:1 }}>
              🎉🎊🎉
            </div>

            <h2 style={{
              fontFamily: "var(--font-graffiti), system-ui, sans-serif",
              color: "#f59e0b",
              fontSize: "clamp(1.8rem,6vw,3.2rem)",
              margin: "8px 0 6px",
              letterSpacing: 3,
              textShadow: "0 0 24px rgba(245,158,11,0.9)",
            }}>
              ¡FELICIDADES!
            </h2>

            <p style={{
              color: "#9ca3af",
              fontSize: "clamp(0.85rem,2.5vw,1.1rem)",
              margin: "0 0 20px",
              letterSpacing: 2,
            }}>
              HAS GANADO:
            </p>

            {/* Prize card */}
            <div style={{
              background: winner.color,
              borderRadius: 20,
              padding: "clamp(20px,4vw,32px) clamp(16px,4vw,32px)",
              marginBottom: 28,
              boxShadow: `0 0 50px ${winner.color}99, inset 0 1px 0 rgba(255,255,255,0.2)`,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Shimmer overlay */}
              <div style={{
                position:"absolute", inset:0,
                background:"linear-gradient(105deg,rgba(255,255,255,0) 40%,rgba(255,255,255,0.15) 50%,rgba(255,255,255,0) 60%)",
                animation:"sdShimmer 2s ease-in-out infinite",
              }} />
              <div style={{ fontSize:"clamp(3rem,10vw,5rem)", lineHeight:1.1, position:"relative" }}>
                {winner.emoji}
              </div>
              <div style={{
                color: winner.dark ? "#000" : "#fff",
                fontFamily: "var(--font-graffiti), system-ui, sans-serif",
                fontSize: "clamp(1.4rem,5vw,2.4rem)",
                fontWeight: 900,
                marginTop: 10,
                letterSpacing: 2,
                textShadow: winner.dark ? "none" : "0 2px 8px rgba(0,0,0,0.4)",
                position: "relative",
              }}>
                {winner.label}
              </div>
            </div>

            <button
              onClick={reset}
              style={{
                padding: "clamp(14px,3vw,20px) clamp(28px,6vw,48px)",
                fontSize: "clamp(0.95rem,3vw,1.2rem)",
                fontFamily: "var(--font-graffiti), system-ui, sans-serif",
                fontWeight: 700,
                background: "linear-gradient(135deg,#374151,#1f2937)",
                color: "#fff",
                border: "2px solid #4b5563",
                borderRadius: 14,
                cursor: "pointer",
                letterSpacing: 2,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                transition: "all 0.2s",
              }}
              onTouchStart={e => (e.currentTarget.style.background = "linear-gradient(135deg,#4b5563,#374151)")}
              onTouchEnd={e => (e.currentTarget.style.background = "linear-gradient(135deg,#374151,#1f2937)")}
            >
              Siguiente participante
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <p style={{
        position:"absolute", bottom:10,
        color:"#374151", fontSize:"0.65rem",
        letterSpacing:2, margin:0, zIndex:1,
      }}>
        SANTO DILEMA · DARK KITCHEN · CHANCAY
      </p>

      <style>{`
        @keyframes sdPulse {
          0%,100% { transform:scale(1);     box-shadow:0 0 35px rgba(245,158,11,0.8),0 4px 24px rgba(0,0,0,0.6); }
          50%     { transform:scale(1.05);  box-shadow:0 0 55px rgba(245,158,11,1),  0 4px 24px rgba(0,0,0,0.6); }
        }
        @keyframes sdBlink {
          0%,100% { opacity:1; }
          50%     { opacity:0.2; }
        }
        @keyframes sdFadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes sdPopIn {
          from { opacity:0; transform:scale(0.4) rotate(-8deg); }
          to   { opacity:1; transform:scale(1)   rotate(0deg);  }
        }
        @keyframes sdShimmer {
          0%   { transform:translateX(-100%); }
          50%,100% { transform:translateX(200%); }
        }
      `}</style>
    </div>
  );
}
