'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface Participante {
  id: string;
  nombre: string;
  telefono: string;
  matchLabel?: string;
  prediccionLabel?: string;
  estado: string;
}

type Phase = 'idle' | 'countdown' | 'spinning' | 'winner';

interface Props {
  matchId?: string;
  matchLabel?: string;
  equipoLocal?: string;
  equipoVisitante?: string;
  premio: string;
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function trunc(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (ctx.measureText(t + '…').width > maxW && t.length > 1) t = t.slice(0, -1);
  return t + '…';
}

/* ─────────────────────────────────────────────
   CANVAS DRAWING HELPERS
───────────────────────────────────────────── */
function drawSpotlight(ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number, spread: number, length: number, opacity: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const g = ctx.createLinearGradient(0, 0, 0, -length);
  g.addColorStop(0, `rgba(255,240,150,${opacity})`);
  g.addColorStop(1, 'rgba(255,240,150,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-spread, -length);
  ctx.lineTo(spread, -length);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = r * 0.07;
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.17, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.19, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, color: string) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFireburst(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha: number) {
  const COLORS = ['#f59e0b', '#dc2626', '#ffffff', '#22c55e', '#fbbf24', '#ef4444'];
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const len = radius * (0.6 + Math.random() * 0.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = COLORS[i % COLORS.length];
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * radius * 0.15, y + Math.sin(angle) * radius * 0.15);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
    ctx.restore();
  }
}

/* ─────────────────────────────────────────────
   CONFETTI COMPONENT (UI)
───────────────────────────────────────────── */
function ConfettiExplosion() {
  const COLORS = ['#dc2626', '#f59e0b', '#7c3aed', '#22c55e', '#3b82f6', '#fbbf24', '#ffffff', '#ec4899'];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 20 }}>
      {Array.from({ length: 70 }, (_, i) => {
        const size = 5 + (i % 6) * 2;
        const shapes = ['50%', '0', '0', '50%', '0'];
        return (
          <div key={i} style={{
            position: 'absolute',
            width: size,
            height: size * (i % 3 === 0 ? 1 : 2),
            background: COLORS[i % COLORS.length],
            borderRadius: shapes[i % shapes.length],
            left: `${(i * 1.44) % 100}%`,
            top: -30,
            opacity: 0,
            animation: `cExp ${1.2 + (i % 7) * 0.22}s ease-in ${(i % 12) * 0.08}s both`,
            transform: `rotate(${(i * 37) % 360}deg)`,
          }} />
        );
      })}
      <style>{`
        @keyframes cExp {
          0%   { transform: translateY(0)      rotate(0deg)   scaleX(1);  opacity: 1; }
          20%  { opacity: 1; }
          100% { transform: translateY(800px)  rotate(720deg) scaleX(0.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function SorteoAnimadoTab({ premio }: Props) {
  const [todos, setTodos] = useState<Participante[]>([]);
  const [loadingTodos, setLoadingTodos] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [phase, setPhase] = useState<Phase>('idle');
  const [countNum, setCountNum] = useState(5);
  const [displayName, setDisplayName] = useState('');
  const [winner, setWinner] = useState<Participante | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const [recording, setRecording] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number>(0);
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  /* ── Load ALL participants (all matches, no filter) ── */
  const cargarTodos = async () => {
    setLoadingTodos(true);
    try {
      const res = await fetch('/api/sorteo-mundial/participantes');
      if (res.ok) {
        const d = await res.json();
        setTodos(d.participantes || []);
        setLoaded(true);
      }
    } catch { /**/ }
    setLoadingTodos(false);
  };

  /* ── SORTEO: countdown → spin → reveal ── */
  const iniciarSorteo = useCallback(async () => {
    if (todos.length === 0) return;

    setWinner(null);
    setVideoUrl(null);
    setShowConfetti(false);

    // Pick winner upfront (client-side random from ALL participants)
    const picked = todos[Math.floor(Math.random() * todos.length)];

    // ── COUNTDOWN ──
    setPhase('countdown');
    for (let i = 5; i >= 1; i--) {
      setCountNum(i);
      await sleep(1050);
    }

    // ── SPINNING ──
    setPhase('spinning');
    const SPIN_MS = 7000;
    const spinStart = Date.now();

    await new Promise<void>(resolve => {
      const spin = () => {
        const elapsed = Date.now() - spinStart;
        if (elapsed >= SPIN_MS) { resolve(); return; }
        setDisplayName(todos[Math.floor(Math.random() * todos.length)].nombre);
        const interval = 55 + (elapsed / SPIN_MS) * 420;
        spinTimerRef.current = setTimeout(spin, interval);
      };
      spin();
    });

    // ── WINNER ──
    setDisplayName(picked.nombre);
    setWinner(picked);
    setPhase('winner');
    setShowConfetti(true);
    confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 5000);
  }, [todos]);

  /* ── CANVAS VIDEO GENERATION (20 seconds) ── */
  const generarVideo = useCallback(async () => {
    if (!winner || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = 540;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load logo
    const logo = new window.Image();
    await new Promise<void>(r => { logo.onload = () => r(); logo.onerror = () => r(); logo.src = '/logoprincipal1.png'; });

    if (!('captureStream' in canvas)) { alert('Usa Chrome o Edge para generar el video.'); return; }
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    const chunks: Blob[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = (canvas as any).captureStream(30) as MediaStream;
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_200_000 });
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      setVideoUrl(URL.createObjectURL(new Blob(chunks, { type: mime })));
      setRecording(false);
      setVideoProgress(100);
    };

    setRecording(true);
    setVideoProgress(0);
    recorder.start();

    const TOTAL = 20_000;
    const t0 = performance.now();

    // Pre-generate assets
    const confettiP = Array.from({ length: 110 }, () => ({
      x: Math.random() * 540, y: -Math.random() * 500,
      vx: (Math.random() - 0.5) * 5, vy: Math.random() * 4 + 1.5,
      color: ['#dc2626','#f59e0b','#ffffff','#fbbf24','#ef4444','#fde68a','#7c3aed','#22c55e','#ec4899'][Math.floor(Math.random() * 9)],
      w: Math.random() * 13 + 4, h: Math.random() * 6 + 3,
      rot: Math.random() * Math.PI * 2, rv: (Math.random() - 0.5) * 0.18,
    }));

    const balls = Array.from({ length: 6 }, (_, i) => ({
      x: 60 + (i * 100), y: 300 + Math.sin(i * 1.3) * 200,
      r: 25 + (i % 3) * 10, speed: 0.3 + i * 0.12,
      startY: 300 + Math.sin(i * 1.3) * 200,
    }));

    const names = todos.map(a => a.nombre);
    let nameIdx = 0;
    let lastSwitch = 0;

    // Firework bursts for reveal
    const bursts = [
      { x: 120, y: 280, t: 15200, color: '#f59e0b' },
      { x: 420, y: 250, t: 15400, color: '#dc2626' },
      { x: 270, y: 220, t: 15600, color: '#ffffff' },
      { x: 80,  y: 400, t: 16000, color: '#22c55e' },
      { x: 460, y: 380, t: 16200, color: '#7c3aed' },
      { x: 200, y: 180, t: 16500, color: '#f59e0b' },
      { x: 350, y: 200, t: 16800, color: '#ec4899' },
    ];

    const drawBg = (elapsed: number) => {
      // Deep navy gradient background
      const bg = ctx.createLinearGradient(0, 0, 0, 960);
      bg.addColorStop(0, '#050e1d');
      bg.addColorStop(0.5, '#071428');
      bg.addColorStop(1, '#030a15');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 540, 960);

      // Subtle grid (stadium feel)
      ctx.strokeStyle = 'rgba(255,255,255,0.025)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 540; x += 54) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 960); ctx.stroke(); }
      for (let y = 0; y <= 960; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(540, y); ctx.stroke(); }

      // Spotlight beams
      const sa1 = Math.sin(elapsed * 0.00045) * 0.55;
      const sa2 = Math.sin(elapsed * 0.00035 + 1.2) * 0.55;
      const sa3 = Math.sin(elapsed * 0.0005 + 2.4) * 0.45;
      drawSpotlight(ctx, 80,  960, sa1,  55, 900, 0.07);
      drawSpotlight(ctx, 460, 960, sa2, 55, 900, 0.07);
      drawSpotlight(ctx, 270, 960, sa3, 35, 960, 0.05);

      // Floating soccer balls
      balls.forEach((b, i) => {
        const yOff = Math.sin(elapsed * 0.001 * b.speed + i) * 50;
        const rot  = elapsed * 0.001 * (i % 2 === 0 ? 1 : -1);
        drawBall(ctx, b.x, b.startY + yOff, b.r, rot, 0.6);
      });

      // Corner stars
      const starAlpha = 0.4 + Math.sin(elapsed * 0.003) * 0.2;
      drawStar(ctx, 30,  30,  16, starAlpha, '#f59e0b');
      drawStar(ctx, 510, 30,  16, starAlpha, '#f59e0b');
      drawStar(ctx, 30,  930, 12, starAlpha * 0.7, '#dc2626');
      drawStar(ctx, 510, 930, 12, starAlpha * 0.7, '#dc2626');

      // Twinkle dots
      for (let i = 0; i < 18; i++) {
        const px = ((i * 137 + 70) % 480) + 30;
        const py = ((i * 97 + 120) % 700) + 130;
        const ta = 0.2 + Math.sin(elapsed * 0.004 + i * 0.7) * 0.18;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,200,${ta})`;
        ctx.fill();
      }
    };

    const drawHeader = () => {
      // Red header
      const hg = ctx.createLinearGradient(0, 0, 540, 0);
      hg.addColorStop(0, '#7f1d1d');
      hg.addColorStop(0.5, '#dc2626');
      hg.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = hg;
      ctx.fillRect(0, 0, 540, 130);

      // Gold trim
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, 127, 540, 3);

      if (logo.complete && logo.naturalWidth > 0) {
        const asp = logo.naturalWidth / logo.naturalHeight;
        const lh = 80, lw = lh * asp;
        ctx.drawImage(logo, Math.round(270 - lw / 2), 25, Math.round(lw), lh);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SANTO DILEMA', 270, 85);
      }
    };

    const draw = (now: number) => {
      const elapsed = now - t0;
      const progress = Math.min(elapsed / TOTAL, 1);
      if (progress >= 1) { recorder.stop(); return; }

      setVideoProgress(Math.round(progress * 95));

      drawBg(elapsed);
      drawHeader();

      /* ── PHASE 1: INTRO  0–3s ── */
      if (elapsed < 3000) {
        const t = elapsed / 3000;
        const fade = Math.min(elapsed / 600, 1);
        ctx.globalAlpha = fade;
        ctx.textAlign = 'center';

        // "GRAN SORTEO" badge
        const badgeG = ctx.createLinearGradient(60, 170, 480, 250);
        badgeG.addColorStop(0, '#78350f');
        badgeG.addColorStop(0.5, '#f59e0b');
        badgeG.addColorStop(1, '#78350f');
        ctx.fillStyle = badgeG;
        rr(ctx, 60, 168, 420, 74, 20);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 32px Arial';
        ctx.fillText('GRAN SORTEO', 270, 218);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('MUNDIAL 2026', 270, 290);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '15px Arial';
        ctx.fillText('Santo Dilema · Chancay', 270, 325);

        // Big participant count
        const scale = 0.6 + t * 0.4;
        ctx.save();
        ctx.translate(270, 530);
        ctx.scale(scale, scale);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 92px Arial';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 30;
        ctx.fillText(String(todos.length), 0, 0);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('participantes', 0, 44);
        ctx.restore();

        // Prize
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        rr(ctx, 80, 680, 380, 56, 14);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`Premio: ${premio || 'Alitas gratis'}`, 270, 715);

        ctx.globalAlpha = 1;
      }

      /* ── PHASE 2: COUNTDOWN  3s–8.5s ── */
      else if (elapsed < 8500) {
        const ce = elapsed - 3000;
        const num = 5 - Math.floor(ce / 1100);
        const within = (ce % 1100) / 1100;

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('SORTEANDO EN...', 270, 210);

        // Pulsing ring behind number
        const ringScale = 1 + Math.sin(ce * 0.006) * 0.08;
        ctx.save();
        ctx.translate(270, 520);
        ctx.scale(ringScale, ringScale);
        for (let ri = 0; ri < 3; ri++) {
          ctx.beginPath();
          ctx.arc(0, 0, 110 + ri * 35, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(245,158,11,${0.18 - ri * 0.05})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();

        // Glow number
        const numScale = num >= 1 ? (within < 0.12 ? 1.6 - within * 5 : within > 0.82 ? 1 + (within - 0.82) * 2.8 : 1) : 1;
        const numAlpha = within < 0.06 ? within / 0.06 : within > 0.88 ? 1 - (within - 0.88) / 0.12 : 1;

        ctx.save();
        ctx.translate(270, 540);
        ctx.scale(numScale, numScale);
        ctx.globalAlpha = numAlpha;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 60;
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 220px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(String(Math.max(num, 1)), 0, 70);
        ctx.shadowBlur = 0;
        ctx.restore();
        ctx.globalAlpha = 1;

        // Prize reminder
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${todos.length} participantes · ${premio || 'Alitas gratis'}`, 270, 830);
      }

      /* ── PHASE 3: DRUM ROLL  8.5s–15s ── */
      else if (elapsed < 15000) {
        const se = elapsed - 8500;
        const sp = se / 6500;

        ctx.textAlign = 'center';

        // Pulsing "SORTEANDO" text
        const pulseA = 0.7 + Math.sin(se * 0.008) * 0.3;
        ctx.globalAlpha = pulseA;
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('SORTEANDO AL GANADOR...', 270, 210);
        ctx.globalAlpha = 1;

        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '13px Arial';
        ctx.fillText(`${todos.length} participantes`, 270, 240);

        // Name switching
        const switchInt = 58 + sp * 500;
        if (se - lastSwitch > switchInt) { nameIdx = (nameIdx + 1) % names.length; lastSwitch = se; }

        // Slot window
        const SLOT_CY = 500;
        const ROW_H = 92;

        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        rr(ctx, 25, SLOT_CY - ROW_H - 55, 490, ROW_H * 3, 18);
        ctx.fill();

        // Glow frame on center slot
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 18 + Math.sin(se * 0.01) * 8;
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2.5;
        rr(ctx, 25, SLOT_CY - 55, 490, ROW_H, 14);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(220,38,38,0.18)';
        rr(ctx, 25, SLOT_CY - 55, 490, ROW_H, 14);
        ctx.fill();

        // Gradient mask
        const maskG = ctx.createLinearGradient(0, SLOT_CY - ROW_H - 55, 0, SLOT_CY + ROW_H * 2 - 55);
        maskG.addColorStop(0, 'rgba(5,14,29,0.85)');
        maskG.addColorStop(0.2, 'rgba(5,14,29,0)');
        maskG.addColorStop(0.8, 'rgba(5,14,29,0)');
        maskG.addColorStop(1, 'rgba(5,14,29,0.85)');
        ctx.fillStyle = maskG;
        rr(ctx, 25, SLOT_CY - ROW_H - 55, 490, ROW_H * 3, 18);
        ctx.fill();

        // 3 names
        for (let off = -1; off <= 1; off++) {
          const idx = (nameIdx + off + names.length) % names.length;
          const cy = SLOT_CY + off * ROW_H;
          const center = off === 0;
          ctx.font = `${center ? 'bold 29px' : '17px'} Arial`;
          ctx.fillStyle = center ? '#ffffff' : 'rgba(255,255,255,0.2)';
          ctx.textAlign = 'center';
          if (center) { ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 12; }
          ctx.fillText(trunc(ctx, names[idx] || '', 440), 270, cy + 22);
          ctx.shadowBlur = 0;
        }

        // Progress bar
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        rr(ctx, 50, 750, 440, 10, 5);
        ctx.fill();
        const barG = ctx.createLinearGradient(50, 0, 490, 0);
        barG.addColorStop(0, '#dc2626');
        barG.addColorStop(1, '#f59e0b');
        ctx.fillStyle = barG;
        rr(ctx, 50, 750, 440 * sp, 10, 5);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Premio: ${premio || 'Alitas gratis'}`, 270, 828);
      }

      /* ── PHASE 4: WINNER REVEAL  15–20s ── */
      else {
        const re = elapsed - 15000;
        const rp = re / 5000;

        // Flash effect at start
        if (re < 300) {
          ctx.fillStyle = `rgba(255,255,255,${(1 - re / 300) * 0.7})`;
          ctx.fillRect(0, 0, 540, 960);
        }

        // Confetti
        confettiP.forEach(p => {
          p.x += p.vx; p.y += p.vy * (0.5 + rp); p.rot += p.rv;
          if (p.y > 980) { p.y = -20; p.x = Math.random() * 540; }
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        });

        // Firework bursts
        bursts.forEach(b => {
          if (elapsed > b.t) {
            const age = (elapsed - b.t) / 700;
            if (age < 1) drawFireburst(ctx, b.x, b.y, age * 90, (1 - age) * 0.9);
          }
        });

        ctx.textAlign = 'center';

        // Stars top corners (appear with winner)
        const stA = Math.min(rp * 6, 1);
        drawStar(ctx, 75,  220, 24, stA, '#f59e0b');
        drawStar(ctx, 465, 220, 24, stA, '#f59e0b');
        drawStar(ctx, 40,  340, 16, stA * 0.7, '#fbbf24');
        drawStar(ctx, 500, 340, 16, stA * 0.7, '#fbbf24');

        // "GANADOR/A" banner
        ctx.globalAlpha = Math.min(rp * 6, 1);
        const bnrG = ctx.createLinearGradient(55, 175, 485, 265);
        bnrG.addColorStop(0, '#78350f');
        bnrG.addColorStop(0.5, '#f59e0b');
        bnrG.addColorStop(1, '#78350f');
        ctx.fillStyle = bnrG;
        rr(ctx, 55, 173, 430, 84, 22);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 36px Arial';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText('GANADOR/A DEL SORTEO', 270, 228);
        ctx.shadowBlur = 0;

        // Winner name
        ctx.globalAlpha = Math.min((rp - 0.08) * 7, 1);
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 30 + Math.sin(re * 0.005) * 15;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 52px Arial';

        const words = winner.nombre.split(' ');
        const maxW = 470;
        const lines: string[] = [];
        let line = '';
        words.forEach(w => {
          const t = line ? `${line} ${w}` : w;
          if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
        });
        if (line) lines.push(line);

        const ny = 390 - (lines.length - 1) * 30;
        lines.forEach((ln, i) => ctx.fillText(ln, 270, ny + i * 65));
        ctx.shadowBlur = 0;

        // Prize box
        ctx.globalAlpha = Math.min((rp - 0.3) * 5, 1);
        const prizeG = ctx.createLinearGradient(80, 600, 460, 660);
        prizeG.addColorStop(0, 'rgba(220,38,38,0.3)');
        prizeG.addColorStop(1, 'rgba(220,38,38,0.1)');
        ctx.fillStyle = prizeG;
        rr(ctx, 80, 598, 380, 60, 14);
        ctx.fill();
        ctx.strokeStyle = 'rgba(220,38,38,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`Premio: ${premio || 'Alitas gratis'}`, 270, 636);

        // "Contactaremos por WhatsApp" line
        ctx.globalAlpha = Math.min((rp - 0.5) * 4, 1);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px Arial';
        ctx.fillText('El ganador sera contactado por WhatsApp', 270, 705);

        // @santodilema
        ctx.globalAlpha = Math.min((rp - 0.65) * 5, 1);
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 21px Arial';
        ctx.fillText('@santodilema', 270, 895);

        ctx.globalAlpha = 1;
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
  }, [winner, todos, premio]);

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  const darkCard: React.CSSProperties = {
    borderRadius: 20, padding: '28px 22px', textAlign: 'center',
    background: 'linear-gradient(145deg, #050e1d, #0d1f3c)',
    border: '1.5px solid rgba(255,255,255,0.08)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    position: 'relative', overflow: 'hidden',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── IDLE: Load + launch ── */}
      {phase === 'idle' && (
        <>
          {/* Load button / count */}
          {!loaded ? (
            <div style={darkCard}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>⚽</div>
              <h3 style={{ color: '#ffffff', fontWeight: 900, fontSize: '1.2rem', marginBottom: 8 }}>
                Gran Sorteo Mundial 2026
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 20 }}>
                Incluye a todos los participantes de todos los partidos
              </p>
              <button onClick={cargarTodos} disabled={loadingTodos} style={{
                padding: '12px 36px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: loadingTodos ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: '#fff', fontSize: '0.9rem', fontWeight: 700,
                boxShadow: loadingTodos ? 'none' : '0 6px 24px rgba(220,38,38,0.4)',
              }}>
                {loadingTodos ? 'Cargando...' : 'Cargar todos los participantes'}
              </button>
            </div>
          ) : (
            <div style={darkCard}>
              {/* Decorative circles */}
              <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(220,38,38,0.07)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -40, left: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(245,158,11,0.07)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, fontSize: 36, marginBottom: 16 }}>
                ⚽ 🏆 ⚽
              </div>

              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>
                Gran Sorteo Mundial 2026
              </p>
              <h2 style={{ color: '#ffffff', fontWeight: 900, fontSize: '1.5rem', marginBottom: 4, lineHeight: 1.2 }}>
                {todos.length} participantes
              </h2>
              <p style={{ color: '#475569', fontSize: '0.78rem', marginBottom: 20 }}>
                de todos los partidos del Mundial · 1 ganador de {premio || 'Alitas gratis'}
              </p>

              {/* Participant list preview */}
              <div style={{ maxHeight: 130, overflowY: 'auto', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {todos.slice(0, 12).map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', gap: 8, padding: '4px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, textAlign: 'left' }}>
                    <span style={{ color: '#475569', fontSize: '0.68rem', minWidth: 22 }}>{i + 1}.</span>
                    <span style={{ color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 600, flex: 1 }}>{p.nombre}</span>
                    {p.matchLabel && <span style={{ color: '#334155', fontSize: '0.62rem' }}>{p.matchLabel}</span>}
                  </div>
                ))}
                {todos.length > 12 && (
                  <p style={{ color: '#475569', fontSize: '0.68rem', margin: '4px 0 0', textAlign: 'center' }}>
                    + {todos.length - 12} participantes mas
                  </p>
                )}
              </div>

              <button onClick={iniciarSorteo} style={{
                padding: '18px 56px', borderRadius: 18, border: '2px solid rgba(245,158,11,0.4)',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: '#fff', fontSize: '1.1rem', fontWeight: 900,
                letterSpacing: '0.06em',
                boxShadow: '0 12px 40px rgba(220,38,38,0.5), 0 0 0 4px rgba(220,38,38,0.1)',
                transition: 'all 0.2s',
              }}>
                INICIAR GRAN SORTEO
              </button>

              <button onClick={cargarTodos} style={{ display: 'block', margin: '12px auto 0', background: 'none', border: 'none', color: '#475569', fontSize: '0.72rem', cursor: 'pointer' }}>
                Recargar lista
              </button>
            </div>
          )}
        </>
      )}

      {/* ── COUNTDOWN ── */}
      {phase === 'countdown' && (
        <div style={{
          ...darkCard,
          background: 'linear-gradient(145deg, #050e1d, #0d1436)',
          border: '1.5px solid rgba(245,158,11,0.25)',
          padding: '40px 22px',
        }}>
          <p style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>
            SORTEANDO EN...
          </p>
          <div
            key={countNum}
            style={{
              fontSize: 'min(52vw, 200px)',
              fontWeight: 900,
              color: '#f59e0b',
              lineHeight: 1,
              textShadow: '0 0 80px rgba(245,158,11,0.8), 0 0 40px rgba(245,158,11,0.5)',
              animation: 'countAnim 1.05s cubic-bezier(0.34,1.56,0.64,1) both',
              margin: '16px 0',
            }}
          >
            {countNum}
          </div>
          <p style={{ color: '#334155', fontSize: '0.75rem', marginTop: 16 }}>
            {todos.length} participantes listos
          </p>
          <style>{`
            @keyframes countAnim {
              0%   { transform: scale(2.2) translateY(30px); opacity:0; filter:blur(12px); }
              35%  { transform: scale(1)   translateY(0);    opacity:1; filter:blur(0); }
              75%  { transform: scale(1)   translateY(0);    opacity:1; }
              100% { transform: scale(0.4) translateY(-20px); opacity:0; }
            }
          `}</style>
        </div>
      )}

      {/* ── SPINNING ── */}
      {phase === 'spinning' && (
        <div style={{
          ...darkCard,
          background: 'linear-gradient(145deg, #0a051e, #1a0a3a)',
          border: '1.5px solid rgba(124,58,237,0.35)',
        }}>
          <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 18 }}>
            Sorteando entre {todos.length} participantes
          </p>

          {/* Drum window */}
          <div style={{
            position: 'relative', overflow: 'hidden', borderRadius: 16,
            background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(139,92,246,0.5)',
            minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(139,92,246,0.2) inset',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(10,5,30,0.9) 0%, transparent 25%, transparent 75%, rgba(10,5,30,0.9) 100%)',
              pointerEvents: 'none', zIndex: 1,
            }} />
            <span style={{
              fontSize: displayName.length > 24 ? '1.15rem' : '1.8rem',
              fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em',
              position: 'relative', zIndex: 2, padding: '20px 24px',
              textShadow: '0 0 20px rgba(255,255,255,0.3)',
            }}>
              {displayName || '...'}
            </span>
          </div>

          <p style={{ fontSize: '0.7rem', color: '#4c1d95', marginTop: 14 }}>
            Seleccionando ganador/a...
          </p>
        </div>
      )}

      {/* ── WINNER ── */}
      {phase === 'winner' && winner && (
        <div style={{
          borderRadius: 22, padding: '36px 26px', textAlign: 'center',
          background: 'linear-gradient(145deg, #0a1628, #0f172a)',
          border: '2px solid rgba(245,158,11,0.5)',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 0 80px rgba(245,158,11,0.15), 0 20px 60px rgba(0,0,0,0.6)',
        }}>
          {/* BG glow */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {showConfetti && <ConfettiExplosion />}

          {/* Gold banner */}
          <div style={{
            background: 'linear-gradient(90deg, #78350f, #f59e0b, #78350f)',
            borderRadius: 14, padding: '10px 20px', marginBottom: 20,
            position: 'relative', zIndex: 2,
          }}>
            <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 900, color: '#000', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              GANADOR/A DEL SORTEO MUNDIAL
            </p>
          </div>

          {/* Emoji row */}
          <div style={{ fontSize: 36, marginBottom: 12, position: 'relative', zIndex: 2 }}>⚽ 🏆 ⚽</div>

          {/* Winner name */}
          <h3 style={{
            fontSize: winner.nombre.length > 20 ? '1.6rem' : '2.1rem',
            fontWeight: 900, color: '#f59e0b', margin: '0 0 8px', lineHeight: 1.15,
            position: 'relative', zIndex: 2,
            textShadow: '0 0 30px rgba(245,158,11,0.5)',
          }}>
            {winner.nombre}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600, marginBottom: 4, position: 'relative', zIndex: 2 }}>
            {winner.telefono}
          </p>
          {winner.matchLabel && (
            <p style={{ color: '#334155', fontSize: '0.72rem', marginBottom: 4, position: 'relative', zIndex: 2 }}>
              {winner.matchLabel}
            </p>
          )}

          {/* Prize */}
          <div style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.35)', borderRadius: 12, padding: '10px 20px', marginBottom: 22, display: 'inline-block', position: 'relative', zIndex: 2 }}>
            <p style={{ margin: 0, color: '#fca5a5', fontWeight: 700, fontSize: '0.85rem' }}>
              Premio: {premio || 'Alitas gratis'}
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
            <button onClick={() => { setPhase('idle'); setWinner(null); setVideoUrl(null); setDisplayName(''); }} style={{
              padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.07)', color: '#94a3b8',
              fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
            }}>
              Nuevo sorteo
            </button>
            <button onClick={generarVideo} disabled={recording} style={{
              padding: '12px 26px', borderRadius: 12, border: 'none',
              background: recording ? 'rgba(220,38,38,0.2)' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#fff', fontSize: '0.85rem', fontWeight: 700,
              cursor: recording ? 'not-allowed' : 'pointer',
              boxShadow: recording ? 'none' : '0 6px 20px rgba(220,38,38,0.45)',
            }}>
              {recording ? `Generando video ${videoProgress}%...` : 'Generar video para Stories'}
            </button>
          </div>

          {/* Video progress bar */}
          {recording && (
            <div style={{ marginTop: 14, position: 'relative', zIndex: 2 }}>
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(220,38,38,0.15)' }}>
                <div style={{ height: '100%', width: `${videoProgress}%`, background: 'linear-gradient(90deg, #dc2626, #f59e0b)', borderRadius: 3, transition: 'width 0.3s' }} />
              </div>
              <p style={{ fontSize: '0.62rem', color: '#475569', marginTop: 6 }}>
                Renderizando animacion World Cup... {videoProgress}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── VIDEO DOWNLOAD ── */}
      {videoUrl && winner && (
        <div style={{
          borderRadius: 16, padding: '20px 22px', textAlign: 'center',
          background: 'linear-gradient(135deg, #0a0a0a, #1a0505)',
          border: '1.5px solid rgba(220,38,38,0.4)',
        }}>
          <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>
            Video listo
          </p>
          <p style={{ fontSize: '0.7rem', color: '#475569', marginBottom: 18 }}>
            20 segundos · 9:16 (Stories) · Countdown + sorteo + revelacion ganador · ~4 MB
          </p>
          <a
            href={videoUrl}
            download={`sorteo-mundial-${winner.nombre.replace(/\s+/g, '-').toLowerCase()}.webm`}
            style={{
              display: 'inline-block', padding: '13px 40px', borderRadius: 12,
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
              fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(220,38,38,0.45)',
            }}
          >
            Descargar video (.webm)
          </a>
          <p style={{ fontSize: '0.62rem', color: '#334155', marginTop: 10 }}>
            Compatible con Instagram Stories, TikTok y WhatsApp · Para .mp4: convertio.co o ffmpeg
          </p>
        </div>
      )}

      {/* Hidden canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
