'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* ══════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════ */
interface Participante {
  id: string;
  nombre: string;
  telefono: string;
  matchLabel?: string;
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

/* ══════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════ */
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// 35 nombres ficticios peruanos para llenar el bombo visual
const NOMBRES_FICTICIOS = [
  'Carlos Ramirez','Maria Flores','Juan Quispe','Ana Gutierrez','Pedro Mendoza',
  'Rosa Castro','Luis Vargas','Carmen Silva','Miguel Torres','Isabel Huanca',
  'Jose Condori','Elena Mamani','Ricardo Chavez','Patricia Rojas','Fernando Diaz',
  'Lucia Rios','Roberto Santos','Gloria Morales','David Herrera','Miriam Pena',
  'Andres Vasquez','Sandra Perez','Hector Llanos','Beatriz Paredes','Oscar Jimenez',
  'Teresa Aguilar','Jorge Lozano','Margarita Soto','Eduardo Espinoza','Claudia Medina',
  'Pablo Reyes','Veronica Luna','Marcos Fuentes','Silvia Campos','Antonio Cruz',
];

/* ══════════════════════════════════════════════════════
   CANVAS HELPERS
══════════════════════════════════════════════════════ */
function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function clip(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (ctx.measureText(t + '…').width > maxW && t.length > 1) t = t.slice(0, -1);
  return t + '…';
}

function spotlight(ctx: CanvasRenderingContext2D, ox: number, oy: number, angle: number, spread: number, len: number, op: number) {
  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(angle);
  const g = ctx.createLinearGradient(0, 0, 0, -len);
  g.addColorStop(0, `rgba(255,235,120,${op})`);
  g.addColorStop(1, 'rgba(255,235,120,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-spread, -len);
  ctx.lineTo(spread, -len);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function soccerBall(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number, alpha = 0.5) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = r * 0.07; ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52, r * 0.17, 0, Math.PI * 2); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function fireBurst(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha: number, colors: string[]) {
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const len = radius * (0.55 + (i % 3) * 0.2);
    ctx.save();
    ctx.globalAlpha = alpha * (0.7 + Math.random() * 0.3);
    ctx.strokeStyle = colors[i % colors.length];
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * radius * 0.1, y + Math.sin(angle) * radius * 0.1);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
    ctx.restore();
  }
}

/* ══════════════════════════════════════════════════════
   AUDIO SYNTHESIS  (Web Audio API → recorded into video)
══════════════════════════════════════════════════════ */
function scheduleSorteoAudio(
  ac: AudioContext,
  dest: AudioNode,
  base: number, // ac.currentTime offset
) {
  const master = ac.createGain();
  master.gain.value = 0.65;
  master.connect(dest);
  master.connect(ac.destination); // live monitor

  // Noise buffer for snare/crash
  const mkNoise = (dur: number) => {
    const len = Math.ceil(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  };

  const kick = (t: number, vol = 0.55) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(170, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.14);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.19);
  };

  const snare = (t: number, vol = 0.3) => {
    const src = ac.createBufferSource();
    src.buffer = mkNoise(0.1);
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.8;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + 0.1);
  };

  const tone = (t: number, freq: number, dur: number, vol = 0.15, type: OscillatorType = 'sine') => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.04);
    g.gain.setValueAtTime(vol, t + dur * 0.75);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.01);
  };

  // ── Phase 1: Suspense intro (0-3s) ──
  const BEAT = 60 / 88;
  for (let i = 0; i < Math.ceil(3 / BEAT); i++) {
    kick(base + i * BEAT, 0.38);
    if (i % 2 === 1) snare(base + i * BEAT, 0.18);
  }
  [110, 138.59, 164.81].forEach(f => tone(base, f, 3.0, 0.07)); // Dm chord

  // ── Phase 2: Countdown (3-8.5s) — big hit each second + building roll ──
  for (let i = 0; i < 5; i++) {
    const ct = base + 3 + i * 1.1;
    kick(ct, 0.72 + i * 0.04);
    tone(ct, 100 + i * 22, 0.9, 0.13);
    // Snare roll fills before next count
    const fillCount = 6 + i * 4;
    for (let j = 0; j < fillCount; j++) {
      const ft = ct + 0.55 + j * (0.45 / fillCount);
      if (ft < ct + 1.0) snare(ft, 0.1 + j * 0.012);
    }
  }

  // ── Phase 3: Drumroll (8.5-15s) — accelerating snare ──
  let rt = base + 8.5;
  let ri = 0.11;
  while (rt < base + 14.85) {
    const prog = (rt - (base + 8.5)) / 6.5;
    snare(rt, 0.28 + prog * 0.45);
    if (Math.floor(prog * 12) % 2 === 0) kick(rt, 0.22);
    ri = Math.max(0.032, ri * 0.978);
    rt += ri;
  }
  // Final 3 hits
  kick(base + 14.82, 0.9); snare(base + 14.90, 0.9); kick(base + 14.97, 1.0);

  // ── Phase 4: Fanfare (15-20s) ──
  const F = base + 15.05;
  // Crash
  {
    const src = ac.createBufferSource();
    src.buffer = mkNoise(1.4);
    const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3500;
    const g = ac.createGain(); g.gain.value = 0.38;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(F); src.stop(F + 1.5);
  }
  // Ascending fanfare arpeggio
  [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.50].forEach((freq, i) => {
    tone(F + i * 0.1, freq, 0.45, 0.2, 'triangle');
    if (i >= 4) tone(F + i * 0.1, freq / 2, 0.45, 0.1);
  });
  // Sustained chord
  [523.25, 659.25, 783.99, 1046.50].forEach(f => tone(F + 0.85, f, 4.2, 0.11));
  // Celebration beat
  for (let i = 0; i < 22; i++) {
    const ct = F + 0.5 + i * 0.21;
    if (ct < base + 19.8) {
      kick(ct, 0.3);
      if (i % 2 === 1) snare(ct, 0.22);
    }
  }
}

/* ══════════════════════════════════════════════════════
   CONFETTI COMPONENT (browser UI)
══════════════════════════════════════════════════════ */
function ConfettiExplosion() {
  const COLORS = ['#dc2626','#f59e0b','#7c3aed','#22c55e','#3b82f6','#fbbf24','#fff','#ec4899'];
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:20 }}>
      {Array.from({ length: 72 }, (_, i) => (
        <div key={i} style={{
          position:'absolute',
          width: 6 + (i % 5) * 2,
          height: i % 3 === 0 ? 6 + (i % 5) * 2 : (6 + (i % 5) * 2) * 1.9,
          background: COLORS[i % COLORS.length],
          borderRadius: i % 4 === 0 ? '50%' : 2,
          left: `${(i * 1.42) % 100}%`,
          top: -28,
          opacity: 0,
          animation: `cfExp ${1.3 + (i % 7) * 0.2}s ease-in ${(i % 11) * 0.07}s both`,
          transform: `rotate(${(i * 41) % 360}deg)`,
        }} />
      ))}
      <style>{`
        @keyframes cfExp {
          0%   { opacity:1; transform:translateY(0)     rotate(0deg); }
          20%  { opacity:1; }
          100% { opacity:0; transform:translateY(780px) rotate(660deg) scaleX(0.5); }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function SorteoAnimadoTab({ premio }: Props) {
  const [todos, setTodos] = useState<Participante[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const [phase, setPhase] = useState<Phase>('idle');
  const [countNum, setCountNum] = useState(5);
  const [displayName, setDisplayName] = useState('');
  const [winner, setWinner] = useState<Participante | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const [recording, setRecording] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef   = useRef<number>(0);
  const confRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (spinRef.current)  clearTimeout(spinRef.current);
    if (confRef.current)  clearTimeout(confRef.current);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  /* ── Cargar TODOS los participantes ── */
  const cargarTodos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sorteo-mundial/participantes');
      if (res.ok) { const d = await res.json(); setTodos(d.participantes || []); setLoaded(true); }
    } catch { /**/ }
    setLoading(false);
  };

  /* ── Iniciar sorteo: countdown → spin → reveal ── */
  const iniciarSorteo = useCallback(async () => {
    if (todos.length === 0) return;
    const picked = todos[Math.floor(Math.random() * todos.length)]; // real winner

    setWinner(null); setVideoUrl(null); setShowConfetti(false);

    // Countdown
    setPhase('countdown');
    for (let i = 5; i >= 1; i--) { setCountNum(i); await sleep(1080); }

    // Build visual pool: real + fake names shuffled
    const pool = [
      ...todos.map(p => p.nombre),
      ...NOMBRES_FICTICIOS,
    ].sort(() => Math.random() - 0.5);

    // Spin
    setPhase('spinning');
    const SPIN_MS = 7200;
    const t0 = Date.now();
    await new Promise<void>(resolve => {
      const spin = () => {
        const el = Date.now() - t0;
        if (el >= SPIN_MS) { resolve(); return; }
        setDisplayName(pool[Math.floor(Math.random() * pool.length)]);
        spinRef.current = setTimeout(spin, 55 + (el / SPIN_MS) * 430);
      };
      spin();
    });

    // Reveal actual winner
    setDisplayName(picked.nombre);
    setWinner(picked);
    setPhase('winner');
    setShowConfetti(true);
    confRef.current = setTimeout(() => setShowConfetti(false), 5500);
  }, [todos]);

  /* ══════════════════════════════════════════════════
     CANVAS VIDEO — 20 segundos, 9:16, con audio
  ══════════════════════════════════════════════════ */
  const generarVideo = useCallback(async () => {
    if (!winner || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = 540; canvas.height = 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load logo
    const logo = new window.Image();
    await new Promise<void>(r => { logo.onload = () => r(); logo.onerror = () => r(); logo.src = '/logoprincipal1.png'; });

    if (!('captureStream' in canvas)) { alert('Usa Chrome o Edge para generar el video.'); return; }

    // Audio
    const AudioCtxClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) { alert('Tu navegador no soporta Web Audio API.'); return; }
    const ac = new AudioCtxClass();
    const audioDest = ac.createMediaStreamDestination();

    // MIME with audio
    const mime =
      MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' :
      MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' :
      'video/webm';

    const videoStream = (canvas as HTMLCanvasElement & { captureStream(fps: number): MediaStream }).captureStream(30);
    const combined = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioDest.stream.getAudioTracks(),
    ]);

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(combined, { mimeType: mime, videoBitsPerSecond: 2_200_000 });
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      ac.close();
      setVideoUrl(URL.createObjectURL(new Blob(chunks, { type: mime })));
      setRecording(false); setVideoProgress(100);
    };

    setRecording(true); setVideoProgress(0);
    recorder.start();

    // Schedule audio from now
    const audioBase = ac.currentTime + 0.08;
    scheduleSorteoAudio(ac, audioDest, audioBase);

    /* ── Canvas animation data ── */
    const TOTAL = 20_000;
    const t0 = performance.now();

    // Visual drum pool: real names + fake names
    const pool = [
      ...todos.map(p => p.nombre),
      ...NOMBRES_FICTICIOS,
    ].sort(() => Math.random() - 0.5);

    // Confetti particles
    const confP = Array.from({ length: 100 }, () => ({
      x: Math.random() * 540, y: -Math.random() * 450,
      vx: (Math.random() - 0.5) * 4.5, vy: Math.random() * 4 + 1.3,
      color: ['#dc2626','#f59e0b','#fff','#fbbf24','#ef4444','#7c3aed','#22c55e','#ec4899'][Math.floor(Math.random() * 8)],
      w: Math.random() * 13 + 3, h: Math.random() * 6 + 3,
      rot: Math.random() * Math.PI * 2, rv: (Math.random() - 0.5) * 0.17,
    }));

    // Floating balls
    const balls = [
      { sx: 50,  sy: 420, r: 30, sp: 0.28 },
      { sx: 490, sy: 380, r: 24, sp: 0.35 },
      { sx: 70,  sy: 650, r: 20, sp: 0.42 },
      { sx: 470, sy: 700, r: 28, sp: 0.31 },
      { sx: 270, sy: 800, r: 18, sp: 0.5  },
    ];

    // Firework positions / timings
    const bursts = [
      { x: 110, y: 300, t: 15200, c: ['#f59e0b','#fff','#dc2626'] },
      { x: 430, y: 270, t: 15450, c: ['#dc2626','#fbbf24','#fff'] },
      { x: 270, y: 230, t: 15700, c: ['#fff','#22c55e','#f59e0b'] },
      { x: 70,  y: 430, t: 16100, c: ['#7c3aed','#fff','#fbbf24'] },
      { x: 470, y: 410, t: 16350, c: ['#ec4899','#fff','#f59e0b'] },
      { x: 190, y: 210, t: 16700, c: ['#f59e0b','#dc2626','#fff'] },
      { x: 360, y: 200, t: 17000, c: ['#22c55e','#fff','#7c3aed'] },
    ];

    let poolIdx = 0;
    let lastSwitch = 0;

    /* ── Draw background (all phases) ── */
    const drawBg = (el: number) => {
      // Deep navy
      const bgG = ctx.createLinearGradient(0, 0, 0, 960);
      bgG.addColorStop(0, '#040d1c');
      bgG.addColorStop(0.55, '#081630');
      bgG.addColorStop(1, '#020810');
      ctx.fillStyle = bgG;
      ctx.fillRect(0, 0, 540, 960);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.022)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 540; x += 54) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,960); ctx.stroke(); }
      for (let y = 0; y <= 960; y += 80) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(540,y); ctx.stroke(); }

      // Stadium spotlights
      spotlight(ctx, 60,  960, Math.sin(el*0.00042)*0.5,  52, 880, 0.065);
      spotlight(ctx, 480, 960, Math.sin(el*0.00036+1.2)*0.5, 52, 880, 0.065);
      spotlight(ctx, 270, 960, Math.sin(el*0.00048+2.4)*0.38, 38, 960, 0.04);

      // Floating balls
      balls.forEach((b, i) => {
        const yy = b.sy + Math.sin(el * 0.001 * b.sp + i * 1.1) * 45;
        soccerBall(ctx, b.sx, yy, b.r, el * 0.001 * (i%2===0?1:-1), 0.55);
      });

      // Sparkle dots
      for (let i = 0; i < 20; i++) {
        const px = ((i*131+60)%480)+30, py = ((i*89+150)%650)+160;
        const a = 0.15 + Math.sin(el*0.004 + i*0.65)*0.13;
        ctx.beginPath(); ctx.arc(px, py, 1.4, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,245,180,${a})`; ctx.fill();
      }
    };

    /* ── Draw header (all phases) ── */
    const drawHeader = () => {
      const hg = ctx.createLinearGradient(0,0,540,0);
      hg.addColorStop(0,'#6b1010'); hg.addColorStop(0.5,'#cc2020'); hg.addColorStop(1,'#6b1010');
      ctx.fillStyle = hg; ctx.fillRect(0,0,540,118);
      // Gold accent line
      const ag = ctx.createLinearGradient(0,0,540,0);
      ag.addColorStop(0,'transparent'); ag.addColorStop(0.2,'#f59e0b'); ag.addColorStop(0.8,'#f59e0b'); ag.addColorStop(1,'transparent');
      ctx.fillStyle = ag; ctx.fillRect(0,118,540,3);

      if (logo.complete && logo.naturalWidth > 0) {
        const asp = logo.naturalWidth / logo.naturalHeight;
        const lh = 80, lw = lh * asp;
        ctx.drawImage(logo, Math.round(270-lw/2), 19, Math.round(lw), lh);
      } else {
        ctx.fillStyle = '#fff'; ctx.font = 'bold 27px Arial'; ctx.textAlign = 'center'; ctx.fillText('SANTO DILEMA', 270, 76);
      }
    };

    /* ════════════════════════════════════════
       DRAW FRAME
    ════════════════════════════════════════ */
    const draw = (now: number) => {
      const el = now - t0;
      const prog = Math.min(el / TOTAL, 1);
      if (prog >= 1) { recorder.stop(); return; }
      setVideoProgress(Math.round(prog * 95));

      drawBg(el);
      drawHeader();

      const CX = 270; // canvas center x

      /* ── PHASE 1: INTRO  0–3s ── */
      if (el < 3000) {
        const fade = Math.min(el / 700, 1);
        ctx.globalAlpha = fade;
        ctx.textAlign = 'center';

        // "GRAN SORTEO" gold badge
        const badgeG = ctx.createLinearGradient(60,160,480,230);
        badgeG.addColorStop(0,'#78350f'); badgeG.addColorStop(0.5,'#f59e0b'); badgeG.addColorStop(1,'#78350f');
        ctx.fillStyle = badgeG;
        rrect(ctx, 60, 158, 420, 66, 18); ctx.fill();
        ctx.fillStyle = '#000'; ctx.font = 'bold 30px Arial'; ctx.fillText('GRAN SORTEO', CX, 202);

        // "MUNDIAL 2026"
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 42px Arial';
        ctx.shadowColor = 'rgba(255,255,255,0.15)'; ctx.shadowBlur = 10;
        ctx.fillText('MUNDIAL 2026', CX, 272);
        ctx.shadowBlur = 0;

        // Subtitle
        ctx.fillStyle = '#64748b'; ctx.font = '16px Arial';
        ctx.fillText('Santo Dilema · Chancay · Peru', CX, 306);

        // Divider
        ctx.strokeStyle = 'rgba(245,158,11,0.3)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(80,335); ctx.lineTo(460,335); ctx.stroke();

        // Prize section
        ctx.fillStyle = '#94a3b8'; ctx.font = '15px Arial';
        ctx.fillText('PREMIO DEL SORTEO', CX, 400);

        const prizeG = ctx.createLinearGradient(60,420,480,500);
        prizeG.addColorStop(0,'rgba(220,38,38,0.22)'); prizeG.addColorStop(1,'rgba(220,38,38,0.08)');
        ctx.fillStyle = prizeG;
        rrect(ctx, 60, 414, 420, 80, 18); ctx.fill();
        ctx.strokeStyle = 'rgba(220,38,38,0.5)'; ctx.lineWidth = 1.5;
        rrect(ctx, 60, 414, 420, 80, 18); ctx.stroke();

        ctx.fillStyle = '#fff'; ctx.font = 'bold 32px Arial';
        ctx.shadowColor = '#dc2626'; ctx.shadowBlur = 14;
        ctx.fillText(premio || 'Alitas gratis', CX, 464);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#475569'; ctx.font = '13px Arial';
        ctx.fillText('El ganador sera contactado por WhatsApp', CX, 540);

        // @handle
        ctx.fillStyle = '#dc2626'; ctx.font = 'bold 19px Arial';
        ctx.fillText('@santodilema', CX, 890);

        ctx.globalAlpha = 1;
      }

      /* ── PHASE 2: COUNTDOWN  3–8.5s ── */
      else if (el < 8500) {
        const ce  = el - 3000;
        const num = Math.max(1, 5 - Math.floor(ce / 1100));
        const wth = (ce % 1100) / 1100;

        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 16px Arial';
        ctx.fillText('EL SORTEO COMIENZA EN...', CX, 210);

        // Pulsing ring
        for (let ri = 0; ri < 4; ri++) {
          ctx.beginPath();
          ctx.arc(CX, 520, 95 + ri*38, 0, Math.PI*2);
          ctx.strokeStyle = `rgba(245,158,11,${0.14 - ri*0.025})`;
          ctx.lineWidth = 1.5; ctx.stroke();
        }

        // Countdown number
        const sc = wth < 0.1 ? 1.8 - wth*8 : wth > 0.84 ? 1+(wth-0.84)*3.5 : 1;
        const al = wth < 0.06 ? wth/0.06 : wth > 0.88 ? 1-(wth-0.88)/0.12 : 1;
        ctx.save();
        ctx.translate(CX, 545); ctx.scale(sc, sc);
        ctx.globalAlpha = al;
        ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 70;
        ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 216px Arial';
        ctx.fillText(String(num), 0, 76);
        ctx.shadowBlur = 0;
        ctx.restore(); ctx.globalAlpha = 1;

        ctx.fillStyle = '#334155'; ctx.font = '14px Arial';
        ctx.fillText(`${premio || 'Alitas gratis'} en juego`, CX, 820);
      }

      /* ── PHASE 3: DRUM ROLL  8.5–15s ── */
      else if (el < 15000) {
        const se = el - 8500;
        const sp = se / 6500;

        ctx.textAlign = 'center';

        // Title (pulsing opacity)
        const pa = 0.65 + Math.sin(se*0.009)*0.35;
        ctx.globalAlpha = pa;
        ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 20px Arial';
        ctx.fillText('SORTEANDO AL GANADOR', CX, 205);
        ctx.globalAlpha = 1;

        // Slot window
        const SLOT_Y = 495;
        const ROW_H  = 90;

        // Outer glow track
        ctx.shadowColor = '#dc2626'; ctx.shadowBlur = 22 + Math.sin(se*0.012)*10;
        ctx.strokeStyle = 'rgba(220,38,38,0.45)'; ctx.lineWidth = 2;
        rrect(ctx, 28, SLOT_Y - ROW_H*1.5 - 5, 484, ROW_H*3, 20); ctx.stroke();
        ctx.shadowBlur = 0;

        // Slot background
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        rrect(ctx, 28, SLOT_Y - ROW_H*1.5 - 5, 484, ROW_H*3, 20); ctx.fill();

        // Center highlight bar
        const cHG = ctx.createLinearGradient(28, SLOT_Y-50, 512, SLOT_Y+50);
        cHG.addColorStop(0,'rgba(220,38,38,0.08)'); cHG.addColorStop(0.5,'rgba(220,38,38,0.22)'); cHG.addColorStop(1,'rgba(220,38,38,0.08)');
        ctx.fillStyle = cHG;
        rrect(ctx, 28, SLOT_Y - ROW_H/2 + 2, 484, ROW_H - 4, 12); ctx.fill();

        // Border center
        ctx.strokeStyle = `rgba(220,38,38,${0.6 + Math.sin(se*0.015)*0.3})`;
        ctx.lineWidth = 2;
        rrect(ctx, 28, SLOT_Y - ROW_H/2 + 2, 484, ROW_H - 4, 12); ctx.stroke();

        // Name switching
        const swInt = 56 + sp * 510;
        if (se - lastSwitch > swInt) { poolIdx = (poolIdx+1) % pool.length; lastSwitch = se; }

        // Fade masks top/bottom
        const mask = ctx.createLinearGradient(0, SLOT_Y - ROW_H*1.5, 0, SLOT_Y + ROW_H*1.5);
        mask.addColorStop(0,'rgba(4,13,28,0.95)'); mask.addColorStop(0.22,'rgba(4,13,28,0)'); mask.addColorStop(0.78,'rgba(4,13,28,0)'); mask.addColorStop(1,'rgba(4,13,28,0.95)');
        ctx.fillStyle = mask;
        rrect(ctx, 28, SLOT_Y - ROW_H*1.5 - 5, 484, ROW_H*3, 20); ctx.fill();

        // Draw 3 names
        for (let off = -1; off <= 1; off++) {
          const idx = (poolIdx + off + pool.length) % pool.length;
          const cy  = SLOT_Y + off * ROW_H;
          const isC = off === 0;
          ctx.font = isC ? 'bold 28px Arial' : '17px Arial';
          ctx.fillStyle = isC ? '#ffffff' : 'rgba(255,255,255,0.18)';
          ctx.textAlign = 'center';
          if (isC) { ctx.shadowColor = 'rgba(255,255,255,0.4)'; ctx.shadowBlur = 8; }
          ctx.fillText(clip(ctx, pool[idx] || '', 440), CX, cy + 24);
          ctx.shadowBlur = 0;
        }

        // Progress bar
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        rrect(ctx, 55, 748, 430, 8, 4); ctx.fill();
        const barG = ctx.createLinearGradient(55,0,485,0);
        barG.addColorStop(0,'#dc2626'); barG.addColorStop(1,'#f59e0b');
        ctx.fillStyle = barG;
        rrect(ctx, 55, 748, 430*sp, 8, 4); ctx.fill();

        // Prize
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        rrect(ctx, 80, 788, 380, 52, 12); ctx.fill();
        ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
        ctx.fillText(`Premio: ${premio || 'Alitas gratis'}`, CX, 820);
      }

      /* ── PHASE 4: WINNER REVEAL  15–20s ── */
      else {
        const re = el - 15000;
        const rp = re / 5000;

        // Flash
        if (re < 280) {
          ctx.fillStyle = `rgba(255,255,255,${(1 - re/280)*0.72})`;
          ctx.fillRect(0,0,540,960);
        }

        // Confetti
        confP.forEach(p => {
          p.x += p.vx; p.y += p.vy*(0.4+rp); p.rot += p.rv;
          if (p.y > 985) { p.y=-20; p.x=Math.random()*540; }
          ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.color; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
          ctx.restore();
        });

        // Firework bursts
        bursts.forEach(b => {
          if (el > b.t) {
            const age = (el - b.t) / 780;
            if (age < 1) fireBurst(ctx, b.x, b.y, age*96, (1-age)*0.85, b.c);
          }
        });

        ctx.textAlign = 'center';

        // Gold "GANADOR/A" banner
        ctx.globalAlpha = Math.min(rp*6, 1);
        const bnG = ctx.createLinearGradient(50,165,490,255);
        bnG.addColorStop(0,'#6b3003'); bnG.addColorStop(0.3,'#f59e0b'); bnG.addColorStop(0.7,'#f59e0b'); bnG.addColorStop(1,'#6b3003');
        ctx.fillStyle = bnG;
        rrect(ctx, 50,163,440,80,22); ctx.fill();
        ctx.fillStyle = '#0a0a0a'; ctx.font = 'bold 30px Arial';
        ctx.fillText('GANADOR/A DEL SORTEO', CX, 216);

        // Trophy
        ctx.globalAlpha = Math.min((rp-0.04)*6, 1);
        ctx.font = '48px Arial'; ctx.fillText('🏆', CX, 292);

        // Winner name
        ctx.globalAlpha = Math.min((rp-0.1)*5, 1);
        ctx.font = 'bold 50px Arial';
        const words = winner.nombre.split(' ');
        const lines: string[] = [];
        let ln = '';
        words.forEach(w => { const t = ln ? `${ln} ${w}` : w; if (ctx.measureText(t).width > 460 && ln) { lines.push(ln); ln=w; } else ln=t; });
        if (ln) lines.push(ln);
        const ny = 365 - (lines.length-1)*28;
        ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 22 + Math.sin(re*0.006)*12;
        ctx.fillStyle = '#ffffff';
        lines.forEach((l,i) => ctx.fillText(l, CX, ny+i*64));
        ctx.shadowBlur = 0;

        // Separator
        ctx.globalAlpha = Math.min((rp-0.28)*5, 1);
        ctx.strokeStyle = 'rgba(245,158,11,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(90,565); ctx.lineTo(450,565); ctx.stroke();

        // Prize box
        const prG = ctx.createLinearGradient(70,580,470,650);
        prG.addColorStop(0,'rgba(220,38,38,0.22)'); prG.addColorStop(1,'rgba(220,38,38,0.08)');
        ctx.fillStyle = prG;
        rrect(ctx,70,572,400,62,16); ctx.fill();
        ctx.strokeStyle = 'rgba(220,38,38,0.45)'; ctx.lineWidth = 1.5;
        rrect(ctx,70,572,400,62,16); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Arial';
        ctx.fillText(`${premio || 'Alitas gratis'}`, CX, 611);

        // "Contactaremos por WhatsApp"
        ctx.globalAlpha = Math.min((rp-0.45)*5, 1);
        ctx.fillStyle = '#475569'; ctx.font = '13px Arial';
        ctx.fillText('El ganador sera contactado por WhatsApp', CX, 678);

        // @santodilema
        ctx.globalAlpha = Math.min((rp-0.62)*5, 1);
        ctx.fillStyle = '#dc2626'; ctx.font = 'bold 20px Arial';
        ctx.fillText('@santodilema', CX, 890);

        ctx.globalAlpha = 1;
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
  }, [winner, todos, premio]);

  /* ══════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════ */
  const darkCard: React.CSSProperties = {
    borderRadius: 18, padding: '26px 22px', textAlign: 'center',
    background: 'linear-gradient(145deg, #050e1d, #0a1a30)',
    border: '1.5px solid rgba(255,255,255,0.07)',
    boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
    position: 'relative', overflow: 'hidden',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── IDLE ── */}
      {phase === 'idle' && (
        <div style={darkCard}>
          <div style={{ position:'absolute', top:-50, right:-50, width:180, height:180, borderRadius:'50%', background:'rgba(220,38,38,0.06)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-40, left:-40, width:150, height:150, borderRadius:'50%', background:'rgba(245,158,11,0.06)', pointerEvents:'none' }} />

          {!loaded ? (
            <>
              <div style={{ fontSize:48, marginBottom:14 }}>⚽ 🏆 ⚽</div>
              <h3 style={{ color:'#fff', fontWeight:900, fontSize:'1.25rem', marginBottom:8 }}>Gran Sorteo Mundial 2026</h3>
              <p style={{ color:'#475569', fontSize:'0.8rem', marginBottom:22 }}>
                Incluye a todos los participantes de todos los partidos
              </p>
              <button onClick={cargarTodos} disabled={loading} style={{
                padding:'12px 36px', borderRadius:12, border:'none', cursor:'pointer',
                background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
                color:'#fff', fontSize:'0.9rem', fontWeight:700,
                boxShadow: loading ? 'none' : '0 6px 22px rgba(220,38,38,0.4)',
              }}>
                {loading ? 'Cargando...' : 'Cargar participantes'}
              </button>
            </>
          ) : (
            <>
              <div style={{ display:'flex', justifyContent:'center', gap:10, fontSize:38, marginBottom:14 }}>⚽ 🏆 ⚽</div>
              <p style={{ fontSize:'0.62rem', fontWeight:700, color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:6 }}>
                Gran Sorteo Mundial 2026
              </p>
              <h2 style={{ color:'#fff', fontWeight:900, fontSize:'1.6rem', marginBottom:4 }}>
                {todos.length} participantes
              </h2>
              <p style={{ color:'#334155', fontSize:'0.76rem', marginBottom:18 }}>
                de todos los partidos · Premio: {premio || 'Alitas gratis'}
              </p>

              {/* Preview list */}
              <div style={{ maxHeight:140, overflowY:'auto', marginBottom:18, display:'flex', flexDirection:'column', gap:3 }}>
                {todos.slice(0, 15).map((p, i) => (
                  <div key={p.id} style={{ display:'flex', gap:8, padding:'4px 10px', background:'rgba(255,255,255,0.04)', borderRadius:8, textAlign:'left' }}>
                    <span style={{ color:'#334155', fontSize:'0.66rem', minWidth:20 }}>{i+1}.</span>
                    <span style={{ color:'#e2e8f0', fontSize:'0.78rem', fontWeight:600, flex:1 }}>{p.nombre}</span>
                  </div>
                ))}
                {todos.length > 15 && <p style={{ color:'#334155', fontSize:'0.65rem', marginTop:4 }}>+ {todos.length-15} participantes mas</p>}
              </div>

              <button onClick={iniciarSorteo} style={{
                padding:'18px 54px', borderRadius:16, border:'2px solid rgba(245,158,11,0.35)',
                cursor:'pointer',
                background:'linear-gradient(135deg,#dc2626,#991b1b)',
                color:'#fff', fontSize:'1.1rem', fontWeight:900, letterSpacing:'0.06em',
                boxShadow:'0 12px 38px rgba(220,38,38,0.52), 0 0 0 4px rgba(220,38,38,0.1)',
              }}>
                INICIAR GRAN SORTEO
              </button>
              <button onClick={cargarTodos} style={{ display:'block', margin:'10px auto 0', background:'none', border:'none', color:'#334155', fontSize:'0.7rem', cursor:'pointer' }}>
                Recargar lista
              </button>
            </>
          )}
        </div>
      )}

      {/* ── COUNTDOWN ── */}
      {phase === 'countdown' && (
        <div style={{ ...darkCard, border:'1.5px solid rgba(245,158,11,0.22)', padding:'44px 22px 36px' }}>
          <p style={{ color:'#64748b', fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.22em', marginBottom:10 }}>
            EL SORTEO COMIENZA EN
          </p>
          <div key={countNum} style={{
            fontSize:'clamp(120px,46vw,200px)', fontWeight:900, color:'#f59e0b', lineHeight:1,
            textShadow:'0 0 90px rgba(245,158,11,0.85), 0 0 40px rgba(245,158,11,0.5)',
            animation:'cdAnim 1.08s cubic-bezier(0.34,1.56,0.64,1) both',
            margin:'14px 0',
          }}>
            {countNum}
          </div>
          <p style={{ color:'#1e293b', fontSize:'0.72rem', marginTop:14 }}>
            {todos.length} participantes listos · {premio || 'Alitas gratis'} en juego
          </p>
          <style>{`
            @keyframes cdAnim {
              0%   { transform:scale(2.4) translateY(26px); opacity:0; filter:blur(14px); }
              32%  { transform:scale(1)   translateY(0);    opacity:1; filter:blur(0); }
              76%  { transform:scale(1)   translateY(0);    opacity:1; }
              100% { transform:scale(0.35) translateY(-22px); opacity:0; }
            }
          `}</style>
        </div>
      )}

      {/* ── SPINNING ── */}
      {phase === 'spinning' && (
        <div style={{ ...darkCard, background:'linear-gradient(145deg,#08031a,#150535)', border:'1.5px solid rgba(139,92,246,0.3)', padding:'28px 20px' }}>
          <p style={{ fontSize:'0.66rem', fontWeight:700, color:'#8b5cf6', textTransform:'uppercase', letterSpacing:'0.18em', marginBottom:18 }}>
            Sorteando entre todos los participantes
          </p>
          <div style={{
            position:'relative', overflow:'hidden', borderRadius:14,
            background:'rgba(255,255,255,0.04)', border:'2px solid rgba(139,92,246,0.45)',
            minHeight:88, display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 28px rgba(139,92,246,0.15) inset',
          }}>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(8,3,26,0.92) 0%,transparent 28%,transparent 72%,rgba(8,3,26,0.92) 100%)', zIndex:1, pointerEvents:'none' }} />
            <span style={{
              fontSize: displayName.length > 26 ? '1.1rem' : '1.75rem',
              fontWeight:900, color:'#fff', padding:'18px 24px',
              position:'relative', zIndex:2,
              textShadow:'0 0 16px rgba(255,255,255,0.25)',
            }}>
              {displayName || '...'}
            </span>
          </div>
          <p style={{ fontSize:'0.68rem', color:'#2d1b4e', marginTop:14 }}>Seleccionando al ganador/a...</p>
        </div>
      )}

      {/* ── WINNER ── */}
      {phase === 'winner' && winner && (
        <div style={{
          borderRadius:20, padding:'32px 24px', textAlign:'center',
          background:'linear-gradient(145deg,#040d1c,#0e1a2e)',
          border:'2px solid rgba(245,158,11,0.45)',
          position:'relative', overflow:'hidden',
          boxShadow:'0 0 70px rgba(245,158,11,0.12), 0 20px 55px rgba(0,0,0,0.6)',
        }}>
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:380, height:380, borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,0.07) 0%,transparent 70%)', pointerEvents:'none' }} />
          {showConfetti && <ConfettiExplosion />}

          {/* Gold banner */}
          <div style={{ background:'linear-gradient(90deg,#78350f,#f59e0b,#78350f)', borderRadius:13, padding:'10px 20px', marginBottom:16, position:'relative', zIndex:2 }}>
            <p style={{ margin:0, fontSize:'0.68rem', fontWeight:900, color:'#000', textTransform:'uppercase', letterSpacing:'0.2em' }}>
              GANADOR/A DEL SORTEO MUNDIAL
            </p>
          </div>

          <div style={{ fontSize:48, marginBottom:12, position:'relative', zIndex:2 }}>🏆</div>

          <h3 style={{
            fontSize: winner.nombre.length > 22 ? '1.5rem' : '2rem',
            fontWeight:900, color:'#f59e0b', margin:'0 0 8px', lineHeight:1.15,
            position:'relative', zIndex:2,
            textShadow:'0 0 28px rgba(245,158,11,0.45)',
          }}>
            {winner.nombre}
          </h3>
          <p style={{ color:'#64748b', fontSize:'0.88rem', fontWeight:600, marginBottom:18, position:'relative', zIndex:2 }}>
            {winner.telefono}
          </p>

          {/* Prize */}
          <div style={{ background:'rgba(220,38,38,0.14)', border:'1px solid rgba(220,38,38,0.35)', borderRadius:12, padding:'10px 20px', marginBottom:22, display:'inline-block', position:'relative', zIndex:2 }}>
            <p style={{ margin:0, color:'#fca5a5', fontWeight:700, fontSize:'0.88rem' }}>
              Premio: {premio || 'Alitas gratis'}
            </p>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', position:'relative', zIndex:2 }}>
            <button onClick={() => { setPhase('idle'); setWinner(null); setVideoUrl(null); setDisplayName(''); }} style={{
              padding:'10px 18px', borderRadius:10, border:'1px solid rgba(255,255,255,0.12)',
              background:'rgba(255,255,255,0.06)', color:'#64748b',
              fontSize:'0.8rem', fontWeight:700, cursor:'pointer',
            }}>Nuevo sorteo</button>
            <button onClick={generarVideo} disabled={recording} style={{
              padding:'12px 26px', borderRadius:12, border:'none',
              background: recording ? 'rgba(220,38,38,0.18)' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
              color:'#fff', fontSize:'0.85rem', fontWeight:700,
              cursor: recording ? 'not-allowed' : 'pointer',
              boxShadow: recording ? 'none' : '0 6px 18px rgba(220,38,38,0.42)',
            }}>
              {recording ? `Generando ${videoProgress}%...` : 'Generar video para Stories'}
            </button>
          </div>

          {recording && (
            <div style={{ marginTop:14, position:'relative', zIndex:2 }}>
              <div style={{ height:5, borderRadius:3, background:'rgba(255,255,255,0.06)' }}>
                <div style={{ height:'100%', width:`${videoProgress}%`, background:'linear-gradient(90deg,#dc2626,#f59e0b)', borderRadius:3, transition:'width 0.3s' }} />
              </div>
              <p style={{ fontSize:'0.6rem', color:'#334155', marginTop:6 }}>Renderizando video con musica... {videoProgress}%</p>
            </div>
          )}
        </div>
      )}

      {/* ── VIDEO DOWNLOAD ── */}
      {videoUrl && winner && (
        <div style={{
          borderRadius:14, padding:'20px 22px', textAlign:'center',
          background:'linear-gradient(135deg,#050e1d,#0a0505)',
          border:'1.5px solid rgba(220,38,38,0.38)',
        }}>
          <p style={{ fontSize:'0.9rem', fontWeight:700, color:'#dc2626', marginBottom:5 }}>Video listo</p>
          <p style={{ fontSize:'0.7rem', color:'#334155', marginBottom:18 }}>
            20 seg · 9:16 Stories · Musica incluida · Countdown + sorteo + revelacion · ~4 MB
          </p>
          <a href={videoUrl} download={`sorteo-mundial-${winner.nombre.replace(/\s+/g,'-').toLowerCase()}.webm`}
            style={{ display:'inline-block', padding:'13px 40px', borderRadius:12, background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'#fff', fontSize:'0.95rem', fontWeight:700, textDecoration:'none', boxShadow:'0 6px 18px rgba(220,38,38,0.42)' }}>
            Descargar video (.webm)
          </a>
          <p style={{ fontSize:'0.6rem', color:'#1e293b', marginTop:10 }}>
            Compatible con Instagram, TikTok y WhatsApp · Para .mp4: convertio.co
          </p>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display:'none' }} />
    </div>
  );
}
