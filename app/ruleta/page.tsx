"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── PRIZE CONFIG ─────────────────────────────────────────────────────────────
const PRIZES = [
  { id: 0,  label: "8 Alitas\n+ Papas",      line1: "8 Alitas",  line2: "+ Papas",     emoji: "🍗", color: "#ef4444", dark: false, weight: 3 },
  { id: 1,  label: "20%\nDescuento",          line1: "20%",       line2: "Descuento",   emoji: "🏷️", color: "#f59e0b", dark: true,  weight: 3 },
  { id: 2,  label: "Dúo de\nTacos",           line1: "Dúo de",    line2: "Tacos",       emoji: "🌮", color: "#059669", dark: false, weight: 2 },
  { id: 3,  label: "Ensalada\nCOBB",          line1: "Ensalada",  line2: "COBB",        emoji: "🥗", color: "#0d9488", dark: false, weight: 2 },
  { id: 4,  label: "8 Alitas\n+ Papas",       line1: "8 Alitas",  line2: "+ Papas",     emoji: "🍗", color: "#dc2626", dark: false, weight: 3 },
  { id: 5,  label: "20%\nDescuento",          line1: "20%",       line2: "Descuento",   emoji: "🏷️", color: "#b45309", dark: false, weight: 3 },
  { id: 6,  label: "Dúo de\nTacos",           line1: "Dúo de",    line2: "Tacos",       emoji: "🌮", color: "#10b981", dark: false, weight: 2 },
  { id: 7,  label: "Ensalada\nCryspi",        line1: "Ensalada",  line2: "Cryspi",      emoji: "🥙", color: "#65a30d", dark: false, weight: 2 },
  { id: 8,  label: "Llavero\nSD",             line1: "Llavero",   line2: "SD",          emoji: "🔑", color: "#0891b2", dark: false, weight: 2 },
  { id: 9,  label: "30%\nDescuento",          line1: "30%",       line2: "Descuento",   emoji: "⭐", color: "#ec4899", dark: false, weight: 1 },
  { id: 10, label: "Tomatodo\nSD",            line1: "Tomatodo",  line2: "SD",          emoji: "🧃", color: "#7c3aed", dark: false, weight: 1 },
  { id: 11, label: "Taza\nSD",               line1: "Taza",      line2: "SD",          emoji: "☕", color: "#d946ef", dark: false, weight: 1 },
] as const;

type Prize = typeof PRIZES[number];
type Phase = "idle" | "spinning" | "result";

const N = PRIZES.length;
const SEG = (2 * Math.PI) / N;
const DURATION = 7000;
// Hub radius as fraction of wheel radius — big enough for "GIRAR" + touch target
const HUB_R = 0.19;

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
    const now = ctx.currentTime;
    const dur = 0.055;

    // ── Noise body (snare wires) ──────────────────────────────
    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buf     = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data    = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++)
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.8);

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const hpf = ctx.createBiquadFilter();
    hpf.type = "highpass";
    hpf.frequency.value = 1600;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 1.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(hpf);
    hpf.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + dur);

    // ── Crack transient (pitched) ─────────────────────────────
    const osc     = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.018);
    oscGain.gain.setValueAtTime(vol * 0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.025);
  } catch {}
}

// ─── FANFARRIA DE PREMIO (Web Audio API) ──────────────────────────────────────
// Secuencia: golpe de tambor → arpeggio ascendente → nota larga + destellos
function playWinFanfare(ctx: AudioContext) {
  const now = ctx.currentTime;

  // Golpe de tambor / impacto inicial
  (() => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 180;
    src.connect(filt);
    filt.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    src.start(now);
  })();

  // Arpeggio ascendente — Do Mayor (C5-E5-G5-C6)
  const notes = [
    { freq: 523.25, t: 0.05,  dur: 0.35, vol: 0.32 },
    { freq: 659.25, t: 0.20,  dur: 0.35, vol: 0.32 },
    { freq: 783.99, t: 0.35,  dur: 0.35, vol: 0.32 },
    { freq: 1046.5, t: 0.50,  dur: 0.80, vol: 0.38 }, // nota larga final
  ];

  for (const note of notes) {
    // Sine (melodía) + square suave (brillo tipo fanfarria)
    for (const [type, vol] of [["sine", note.vol], ["square", note.vol * 0.12]] as [OscillatorType, number][]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = type === "square" ? 2000 : 8000;
      osc.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = note.freq;
      const t = now + note.t;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.025);
      gain.gain.setValueAtTime(vol * 0.85, t + note.dur * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.dur);
      osc.start(t);
      osc.stop(t + note.dur + 0.05);
    }
  }

  // Destellos brillantes — chispas agudas aleatorias
  for (let i = 0; i < 8; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 1800 + Math.random() * 1600;
    const t = now + 0.45 + Math.random() * 0.5;
    const d = 0.08 + Math.random() * 0.12;
    gain.gain.setValueAtTime(0.12 + Math.random() * 0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + d);
    osc.start(t);
    osc.stop(t + d + 0.02);
  }

  // Reverb simulado — eco corto en la nota final
  (() => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 1046.5;
    const t = now + 0.9;
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.start(t);
    osc.stop(t + 0.65);
  })();
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function RuletaPage() {
  const [phase,    setPhase]    = useState<Phase>("idle");
  const [winner,   setWinner]   = useState<Prize | null>(null);
  const [hubPress, setHubPress] = useState(false);

  const wheelRef    = useRef<HTMLCanvasElement>(null);
  const confRef     = useRef<HTMLCanvasElement>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);
  const rotRef      = useRef(0);
  const animRef     = useRef(0);
  const audioRef    = useRef<AudioContext | null>(null);
  const lastSegRef  = useRef(-1);
  const startTRef   = useRef(0);
  const startRotRef = useRef(0);
  const deltaRef    = useRef(0);
  const phaseRef    = useRef<Phase>("idle");

  // Keep phaseRef in sync so draw() can read current phase
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── DRAW ────────────────────────────────────────────────────────────────────
  const draw = useCallback((rot: number) => {
    const canvas = wheelRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const S  = canvas.width;
    const cx = S / 2, cy = S / 2;
    const R  = S / 2 - 6;
    const hr = R * HUB_R; // hub radius

    ctx.clearRect(0, 0, S, S);

    // Outer glow halo
    const og = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R + 12);
    og.addColorStop(0, "rgba(245,158,11,0)");
    og.addColorStop(1, "rgba(245,158,11,0.32)");
    ctx.beginPath();
    ctx.arc(cx, cy, R + 12, 0, 2 * Math.PI);
    ctx.fillStyle = og;
    ctx.fill();

    // Segments
    for (let i = 0; i < N; i++) {
      const p  = PRIZES[i];
      const a0 = rot + i * SEG;
      const a1 = rot + (i + 1) * SEG;
      const am = rot + (i + 0.5) * SEG;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, a0, a1);
      ctx.closePath();
      ctx.fillStyle = p.color;
      ctx.fill();

      // Sheen
      const sh = ctx.createLinearGradient(
        cx + Math.cos(am) * R * 0.2, cy + Math.sin(am) * R * 0.2,
        cx + Math.cos(am) * R,       cy + Math.sin(am) * R
      );
      sh.addColorStop(0, "rgba(255,255,255,0.17)");
      sh.addColorStop(1, "rgba(0,0,0,0.17)");
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, a0, a1);
      ctx.closePath();
      ctx.fillStyle = sh;
      ctx.fill();

      // Divider line
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a0) * hr, cy + Math.sin(a0) * hr);
      ctx.lineTo(cx + Math.cos(a0) * R,  cy + Math.sin(a0) * R);
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Content
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(am);
      const tc = p.dark ? "#000" : "#fff";

      // Emoji — near outer edge
      ctx.font = `${S * 0.046}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = tc;
      ctx.fillText(p.emoji, R * 0.83, 0);

      // Single-line label — centered radially
      const labelText = `${p.line1} ${p.line2}`;
      const fs = S * 0.028;
      ctx.font = `900 ${fs}px system-ui,-apple-system,sans-serif`;
      ctx.fillStyle = tc;
      ctx.shadowColor = "rgba(0,0,0,0.75)";
      ctx.shadowBlur = 5;
      // Scale down if text is too wide for the segment
      const maxW = R * 0.56;
      const measured = ctx.measureText(labelText).width;
      if (measured > maxW) {
        ctx.scale(maxW / measured, 1);
        ctx.fillText(labelText, R * 0.54 * (measured / maxW), 0);
      } else {
        ctx.fillText(labelText, R * 0.54, 0);
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Outer gold border
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 5;
    ctx.stroke();

    // Gold dots at boundaries
    for (let i = 0; i < N; i++) {
      const a = rot + i * SEG;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
    }

    // ── HUB / BOTÓN GIRAR ────────────────────────────────────────────────────
    // Shadow for depth
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur  = 18;

    const isIdle = phaseRef.current === "idle";
    const hub = ctx.createRadialGradient(cx - hr * 0.3, cy - hr * 0.3, 0, cx, cy, hr);
    if (isIdle) {
      hub.addColorStop(0, "#fde68a");
      hub.addColorStop(0.5, "#f59e0b");
      hub.addColorStop(1, "#92400e");
    } else {
      hub.addColorStop(0, "#6b7280");
      hub.addColorStop(1, "#1f2937");
    }
    ctx.beginPath();
    ctx.arc(cx, cy, hr, 0, 2 * Math.PI);
    ctx.fillStyle = hub;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Hub border
    ctx.strokeStyle = isIdle ? "#fcd34d" : "#4b5563";
    ctx.lineWidth = 3.5;
    ctx.stroke();

    if (!isIdle) {
      // Spinning: gold dot
      ctx.beginPath();
      ctx.arc(cx, cy, hr * 0.22, 0, 2 * Math.PI);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
    }
    // When idle: "GIRAR" rendered via HTML overlay (proper fonts + CSS animation)
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

  // Redraw when phase changes (hub appearance)
  useEffect(() => { draw(rotRef.current); }, [phase, draw]);

  // ── CONFETTI ────────────────────────────────────────────────────────────────
  const launchConfetti = useCallback(() => {
    const canvas = confRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cols = ["#ef4444","#f59e0b","#d946ef","#06b6d4","#10b981","#ec4899","#f97316","#fff","#fcd34d"];
    const pcs  = Array.from({ length: 180 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 250,
      w: 5 + Math.random() * 9,
      h: 3 + Math.random() * 5,
      col: cols[Math.floor(Math.random() * cols.length)],
      vx: (Math.random() - 0.5) * 8,
      vy: 3 + Math.random() * 6,
      vr: (Math.random() - 0.5) * 14,
      r:  Math.random() * 360,
      shape: i % 3, // 0=rect, 1=circle, 2=rect
    }));

    let frame = 0;
    function loop() {
      if (frame > 260) { ctx!.clearRect(0, 0, canvas!.width, canvas!.height); return; }
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const alpha = Math.max(0, 1 - frame / 200);
      for (const p of pcs) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.14; p.r += p.vr;
        ctx!.save();
        ctx!.globalAlpha = alpha;
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.r * Math.PI) / 180);
        ctx!.fillStyle = p.col;
        if (p.shape === 1) {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.w / 2, 0, 2 * Math.PI);
          ctx!.fill();
        } else {
          ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
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
    startRotRef.current = rotRef.current;
    const target      = pickWeightedSegment();
    const targetAngle = -(target + 0.5 + (Math.random() - 0.5) * 0.7) * SEG - Math.PI / 2;
    const fullSpins   = (10 + Math.floor(Math.random() * 6)) * 2 * Math.PI;
    let delta = (targetAngle - startRotRef.current + fullSpins) % (2 * Math.PI);
    if (delta <= 0) delta += 2 * Math.PI;
    delta += Math.floor(10 + Math.random() * 5) * 2 * Math.PI;
    deltaRef.current  = delta;
    startTRef.current = 0;
    lastSegRef.current = -1;

    function frame(ts: number) {
      if (!startTRef.current) startTRef.current = ts;
      const t   = Math.min((ts - startTRef.current) / DURATION, 1);
      const et  = easeWheel(t);
      const rot = startRotRef.current + et * deltaRef.current;
      rotRef.current = rot;
      draw(rot);

      const seg = Math.floor(
        (((-Math.PI / 2 - rot) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) / SEG
      ) % N;
      if (seg !== lastSegRef.current && audioRef.current) {
        // Volume builds as wheel slows — maximum drama near the stop
        const tickVol = t > 0.85 ? 0.55 : t > 0.65 ? 0.42 : t > 0.4 ? 0.30 : 0.20;
        playTick(audioRef.current, tickVol);
        lastSegRef.current = seg;
      }

      if (t < 1) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        const won = getWinner(rotRef.current);
        // Sonido PRIMERO, luego modal (300ms delay para que el sonido arranque primero)
        if (audioRef.current) playWinFanfare(audioRef.current);
        launchConfetti();
        setTimeout(() => {
          setWinner(won);
          setPhase("result");
        }, 320);
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

      {/* Ambient glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background:
          "radial-gradient(ellipse at 25% 35%, rgba(217,70,239,0.12) 0%, transparent 55%)," +
          "radial-gradient(ellipse at 75% 65%, rgba(245,158,11,0.10) 0%, transparent 55%)," +
          "radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.06) 0%, transparent 60%)",
      }} />

      {/* Confetti overlay */}
      <canvas ref={confRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:300 }} />

      {/* Logo */}
      <img
        src="/logoprincipal.png"
        alt="Santo Dilema"
        style={{
          height: "clamp(44px,7vw,72px)",
          objectFit: "contain",
          marginBottom: 12,
          zIndex: 1,
          filter: "drop-shadow(0 0 12px rgba(245,158,11,0.5))",
        }}
      />

      {/* Title */}
      <h1 style={{
        fontFamily: "var(--font-graffiti), system-ui, sans-serif",
        color: "#f59e0b",
        fontSize: "clamp(1.35rem,4.5vw,2.8rem)",
        margin: "0 0 20px",
        textAlign: "center",
        letterSpacing: 3,
        textShadow: "0 0 20px rgba(245,158,11,0.9),0 0 50px rgba(245,158,11,0.4)",
        zIndex: 1,
      }}>
        ¡LA RULETA DE LA SUERTE!
      </h1>

      {/* Wheel wrapper */}
      <div ref={wrapRef} style={{
        position: "relative",
        width: "min(82vw, 78vh, 700px)",
        height: "min(82vw, 78vh, 700px)",
        zIndex: 1,
        flexShrink: 0,
      }}>

        {/* Pointer */}
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

        {/* Outer ring glow — intensifies while spinning */}
        <div style={{
          position: "absolute", inset: -8, borderRadius: "50%",
          boxShadow: phase === "spinning"
            ? "0 0 55px rgba(245,158,11,0.85),0 0 110px rgba(245,158,11,0.45),0 0 170px rgba(217,70,239,0.2)"
            : "0 0 30px rgba(245,158,11,0.5),0 0 60px rgba(245,158,11,0.2)",
          transition: "box-shadow 0.6s ease",
          pointerEvents: "none",
        }} />

        <canvas ref={wheelRef} style={{ width:"100%", height:"100%", borderRadius:"50%", display:"block" }} />

        {/* ── HUB OVERLAY BUTTON ─────────────────────────────────────────── */}
        <button
          onClick={spin}
          onMouseDown={() => setHubPress(true)}
          onMouseUp={() => setHubPress(false)}
          onTouchStart={() => setHubPress(true)}
          onTouchEnd={() => { setHubPress(false); }}
          disabled={phase !== "idle"}
          aria-label="Girar la ruleta"
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: `translate(-50%, -50%) scale(${hubPress && phase === "idle" ? 0.93 : 1})`,
            width: "19%",
            height: "19%",
            borderRadius: "50%",
            background: "transparent",
            border: "none",
            cursor: phase === "idle" ? "pointer" : "default",
            padding: 0,
            zIndex: 20,
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
            transition: "transform 0.1s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {phase === "idle" && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0,
              animation: "sdHubPulse 1.5s ease-in-out infinite",
              pointerEvents: "none",
              lineHeight: 1,
            }}>
              <span style={{
                fontFamily: "'Lilita One', cursive",
                fontSize: "clamp(11px, 1.7vw, 20px)",
                fontWeight: 900,
                color: "#1a0800",
                letterSpacing: 1,
                textShadow: "0 1px 0 rgba(255,255,255,0.5), 0 -1px 0 rgba(0,0,0,0.2)",
                lineHeight: 1.1,
              }}>GIRAR</span>
            </div>
          )}
        </button>
      </div>

      {/* Spinning indicator */}
      {phase === "spinning" && (
        <div style={{
          marginTop: 22,
          fontFamily: "var(--font-graffiti), system-ui, sans-serif",
          color: "#f59e0b",
          fontSize: "clamp(0.9rem,2.5vw,1.3rem)",
          letterSpacing: 5,
          animation: "sdBlink 0.55s step-end infinite",
          zIndex: 1,
        }}>
          GIRANDO...
        </div>
      )}

      {/* Spacer when idle so layout stays stable */}
      {phase === "idle" && <div style={{ marginTop: 22, height: "clamp(1.2rem,2.5vw,1.56rem)" }} />}

      {/* Winner modal */}
      {phase === "result" && winner && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.9)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          animation: "sdFadeIn 0.3s ease",
        }}>
          <div style={{
            background: "linear-gradient(160deg,#1e1e1e,#0a0a0a)",
            border: `3px solid ${winner.color}`,
            borderRadius: 28,
            padding: "clamp(24px,5vw,44px) clamp(20px,6vw,52px)",
            maxWidth: "min(92vw,520px)",
            width: "100%",
            textAlign: "center",
            boxShadow: `0 0 80px ${winner.color}aa,0 0 160px ${winner.color}44,0 28px 80px rgba(0,0,0,0.8)`,
            animation: "sdPopIn 0.5s cubic-bezier(0.34,1.56,0.64,1)",
            position: "relative",
            overflow: "hidden",
          }}>

            {/* Rays background */}
            <div style={{
              position: "absolute", inset: 0, zIndex: 0,
              background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${winner.color}18 10deg, transparent 20deg, transparent 30deg, ${winner.color}12 40deg, transparent 50deg, transparent 60deg, ${winner.color}15 70deg, transparent 80deg, transparent 90deg, ${winner.color}10 100deg, transparent 110deg, transparent 120deg, ${winner.color}18 130deg, transparent 140deg, transparent 150deg, ${winner.color}12 160deg, transparent 170deg, transparent 180deg, ${winner.color}18 190deg, transparent 200deg, transparent 210deg, ${winner.color}12 220deg, transparent 230deg, transparent 240deg, ${winner.color}18 250deg, transparent 260deg, transparent 270deg, ${winner.color}12 280deg, transparent 290deg, transparent 300deg, ${winner.color}18 310deg, transparent 320deg, transparent 330deg, ${winner.color}12 340deg, transparent 350deg, transparent 360deg)`,
              animation: "sdRotateRays 8s linear infinite",
              borderRadius: 25,
            }} />

            {/* Content */}
            <div style={{ position: "relative", zIndex: 1 }}>

              {/* Stars burst */}
              <div style={{
                fontSize: "clamp(1.8rem,6vw,3rem)",
                lineHeight: 1,
                marginBottom: 6,
                animation: "sdStarBurst 0.6s cubic-bezier(0.34,1.56,0.64,1)",
              }}>
                ✨🎊✨
              </div>

              <h2 style={{
                fontFamily: "var(--font-graffiti), system-ui, sans-serif",
                color: "#f59e0b",
                fontSize: "clamp(2rem,6.5vw,3.4rem)",
                margin: "4px 0 10px",
                letterSpacing: 3,
                textShadow: "0 0 28px rgba(245,158,11,1),0 0 60px rgba(245,158,11,0.5)",
                animation: "sdTitleIn 0.5s 0.1s both ease-out",
              }}>
                ¡FELICIDADES!
              </h2>

              <p style={{
                color: "#9ca3af",
                fontSize: "clamp(0.8rem,2.2vw,1rem)",
                margin: "0 0 18px",
                letterSpacing: 3,
                animation: "sdFadeUp 0.4s 0.2s both ease-out",
              }}>
                HAS GANADO
              </p>

              {/* Prize card */}
              <div style={{
                background: winner.color,
                borderRadius: 20,
                padding: "clamp(18px,4vw,30px) clamp(14px,4vw,30px)",
                marginBottom: 24,
                boxShadow: `0 0 60px ${winner.color}bb,inset 0 1px 0 rgba(255,255,255,0.25)`,
                position: "relative",
                overflow: "hidden",
                animation: "sdPrizeIn 0.55s 0.25s both cubic-bezier(0.34,1.56,0.64,1)",
              }}>
                {/* Shimmer */}
                <div style={{
                  position:"absolute", inset:0, pointerEvents:"none",
                  background:"linear-gradient(105deg,rgba(255,255,255,0) 30%,rgba(255,255,255,0.2) 50%,rgba(255,255,255,0) 70%)",
                  animation:"sdShimmer 2.5s 0.5s ease-in-out infinite",
                }} />
                <div style={{
                  fontSize:"clamp(3rem,10vw,5rem)",
                  lineHeight: 1.1,
                  position: "relative",
                  animation: "sdEmojiBounce 0.6s 0.35s both cubic-bezier(0.34,1.56,0.64,1)",
                }}>
                  {winner.emoji}
                </div>
                <div style={{
                  color: winner.dark ? "#000" : "#fff",
                  fontFamily: "var(--font-graffiti), system-ui, sans-serif",
                  fontSize: "clamp(1.4rem,5vw,2.4rem)",
                  fontWeight: 900,
                  marginTop: 10,
                  letterSpacing: 2,
                  textShadow: winner.dark ? "none" : "0 2px 10px rgba(0,0,0,0.4)",
                  position: "relative",
                }}>
                  {winner.label}
                </div>
              </div>

              {/* Next participant */}
              <button
                onClick={reset}
                style={{
                  padding: "clamp(13px,3vw,18px) clamp(26px,6vw,44px)",
                  fontSize: "clamp(0.9rem,2.8vw,1.15rem)",
                  fontFamily: "var(--font-graffiti), system-ui, sans-serif",
                  fontWeight: 700,
                  background: "linear-gradient(135deg,#374151,#1f2937)",
                  color: "#d1d5db",
                  border: "2px solid #4b5563",
                  borderRadius: 14,
                  cursor: "pointer",
                  letterSpacing: 2,
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                  animation: "sdFadeUp 0.4s 0.45s both ease-out",
                }}
                onTouchStart={e => (e.currentTarget.style.background = "linear-gradient(135deg,#4b5563,#374151)")}
                onTouchEnd={e => (e.currentTarget.style.background = "linear-gradient(135deg,#374151,#1f2937)")}
              >
                Siguiente participante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <p style={{
        position:"absolute", bottom:10,
        color:"#374151", fontSize:"0.62rem",
        letterSpacing:2, margin:0, zIndex:1,
      }}>
        SANTO DILEMA · DARK KITCHEN · CHANCAY
      </p>

      <style>{`
        @keyframes sdBlink {
          0%,100% { opacity:1; }
          50%      { opacity:0.15; }
        }
        @keyframes sdFadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes sdPopIn {
          from { opacity:0; transform:scale(0.35) rotate(-6deg); }
          to   { opacity:1; transform:scale(1)    rotate(0deg);  }
        }
        @keyframes sdTitleIn {
          from { opacity:0; transform:scale(0.7) translateY(8px); }
          to   { opacity:1; transform:scale(1)   translateY(0);   }
        }
        @keyframes sdFadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes sdPrizeIn {
          from { opacity:0; transform:scale(0.5) translateY(20px); }
          to   { opacity:1; transform:scale(1)   translateY(0);    }
        }
        @keyframes sdEmojiBounce {
          from { transform:scale(0) rotate(-15deg); }
          to   { transform:scale(1) rotate(0deg);   }
        }
        @keyframes sdStarBurst {
          from { transform:scale(0); opacity:0; }
          to   { transform:scale(1); opacity:1; }
        }
        @keyframes sdShimmer {
          0%       { transform:translateX(-120%); }
          50%,100% { transform:translateX(220%);  }
        }
        @keyframes sdRotateRays {
          from { transform:rotate(0deg);   }
          to   { transform:rotate(360deg); }
        }
        @keyframes sdHubPulse {
          0%,100% { transform:scale(1);    opacity:1;    }
          50%     { transform:scale(1.13); opacity:0.88; }
        }
      `}</style>
    </div>
  );
}
