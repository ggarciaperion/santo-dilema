'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface Participante {
  id: string;
  nombre: string;
  telefono: string;
  prediccionLabel: string;
  estado: string;
}

interface Props {
  matchId: string;
  matchLabel: string;
  equipoLocal: string;
  equipoVisitante: string;
  premio: string;
}

/* ── Confetti CSS rain (UI only, not canvas) ── */
function ConfettiRain() {
  const COLORS = ['#dc2626', '#f59e0b', '#7c3aed', '#22c55e', '#3b82f6', '#fbbf24', '#ffffff'];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 10 }}>
      {Array.from({ length: 50 }, (_, i) => {
        const size = 6 + (i % 5) * 2;
        const isCircle = i % 4 === 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: size,
              height: isCircle ? size : size * 1.8,
              background: COLORS[i % COLORS.length],
              borderRadius: isCircle ? '50%' : 2,
              left: `${(i * 2.1) % 100}%`,
              top: -24,
              opacity: 0,
              animation: `cFall ${1.4 + (i % 6) * 0.25}s ease-in ${(i % 10) * 0.12}s both`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes cFall {
          0%   { transform: translateY(0) rotate(0deg);     opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(680px) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ── Polyfill roundRect for canvas ── */
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

function truncateCanvas(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (ctx.measureText(t + '…').width > maxW && t.length > 1) t = t.slice(0, -1);
  return t + '…';
}

export default function SorteoAnimadoTab({ matchId, matchLabel, equipoLocal, equipoVisitante, premio }: Props) {
  const [resultado, setResultado] = useState<'local' | 'empate' | 'visitante' | ''>('');
  const [acertantes, setAcertantes] = useState<Participante[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [spinPhase, setSpinPhase] = useState<'idle' | 'spinning' | 'winner'>('idle');
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

  const cargarAcertantes = async () => {
    if (!resultado || !matchId) return;
    setLoadingA(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/sorteo-mundial/ganadores?matchId=${matchId}&resultado=${resultado}`);
      if (res.ok) {
        const d = await res.json();
        setAcertantes(d.acertantes || []);
        if ((d.acertantes || []).length === 0) setErrorMsg('No hay participantes que hayan acertado ese resultado.');
      } else {
        setErrorMsg('Error al cargar participantes.');
      }
    } catch {
      setErrorMsg('Error de red.');
    }
    setLoadingA(false);
  };

  /* ── SPIN: animation + server picks winner ── */
  const girarSorteo = useCallback(async () => {
    if (acertantes.length === 0 || !matchId || !resultado) return;

    setSpinPhase('spinning');
    setWinner(null);
    setVideoUrl(null);
    setShowConfetti(false);

    const SPIN_MS = 7800;
    const spinStart = Date.now();

    /* Fetch winner from server in parallel */
    const winnerPromise = fetch('/api/sorteo-mundial/ganadores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, resultadoPartido: resultado, modo: 'random' }),
    }).then(r => r.json()).catch(() => null);

    /* Slot animation: fast → slow */
    await new Promise<void>(resolve => {
      const spin = () => {
        const elapsed = Date.now() - spinStart;
        if (elapsed >= SPIN_MS) { resolve(); return; }
        const idx = Math.floor(Math.random() * acertantes.length);
        setDisplayName(acertantes[idx].nombre);
        const interval = 55 + (elapsed / SPIN_MS) * 380;
        spinTimerRef.current = setTimeout(spin, interval);
      };
      spin();
    });

    /* Reveal */
    const data = await winnerPromise;
    const picked: Participante | null = data?.ganador ?? null;
    const finalWinner = picked ?? acertantes[Math.floor(Math.random() * acertantes.length)];

    setDisplayName(finalWinner.nombre);
    setWinner(finalWinner);
    setSpinPhase('winner');
    setShowConfetti(true);
    confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 4500);
  }, [acertantes, matchId, resultado]);

  /* ── CANVAS VIDEO GENERATION ── */
  const generarVideo = useCallback(async () => {
    if (!winner || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = 540;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* Load logo */
    const logo = new window.Image();
    await new Promise<void>(r => {
      logo.onload = () => r();
      logo.onerror = () => r();
      logo.src = '/logoprincipal1.png';
    });

    /* Check support */
    if (!('captureStream' in canvas)) {
      alert('Usa Chrome o Edge para generar el video.');
      return;
    }

    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9' : 'video/webm';

    const chunks: Blob[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = (canvas as any).captureStream(30) as MediaStream;
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_800_000 });

    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      setVideoUrl(URL.createObjectURL(blob));
      setRecording(false);
      setVideoProgress(100);
    };

    setRecording(true);
    setVideoProgress(0);
    recorder.start();

    /* ── 15-SECOND CANVAS ANIMATION ── */
    const TOTAL = 15_000;
    const t0 = performance.now();

    /* Confetti particles for phase 3 */
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * 540,
      y: -Math.random() * 400,
      vx: (Math.random() - 0.5) * 3.8,
      vy: Math.random() * 3.8 + 1.2,
      color: ['#dc2626','#f59e0b','#ffffff','#fbbf24','#ef4444','#fde68a','#7c3aed','#22c55e'][Math.floor(Math.random() * 8)],
      w: Math.random() * 12 + 4,
      h: Math.random() * 5 + 3,
      rot: Math.random() * Math.PI * 2,
      rv: (Math.random() - 0.5) * 0.14,
    }));

    const names = acertantes.map(a => a.nombre);
    let nameIdx = 0;
    let lastSwitch = 0;

    const drawFrame = (now: number) => {
      const elapsed = now - t0;
      const progress = Math.min(elapsed / TOTAL, 1);

      if (progress >= 1) {
        recorder.stop();
        return;
      }

      setVideoProgress(Math.round(progress * 95));

      /* ── BACKGROUND ── */
      ctx.fillStyle = '#0b0b14';
      ctx.fillRect(0, 0, 540, 960);

      /* Decorative rings */
      for (let i = 0; i < 7; i++) {
        ctx.strokeStyle = `rgba(220,38,38,${0.055 - i * 0.005})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(270, 510, 70 + i * 62, 0, Math.PI * 2);
        ctx.stroke();
      }

      /* ── RED HEADER BAR ── */
      const hg = ctx.createLinearGradient(0, 0, 540, 0);
      hg.addColorStop(0, '#7f1d1d');
      hg.addColorStop(0.5, '#dc2626');
      hg.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = hg;
      ctx.fillRect(0, 0, 540, 150);

      /* Logo or text in header */
      if (logo.complete && logo.naturalWidth > 0) {
        const asp = logo.naturalWidth / logo.naturalHeight;
        const lh = 90;
        const lw = lh * asp;
        ctx.drawImage(logo, Math.round(270 - lw / 2), 30, Math.round(lw), lh);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SANTO DILEMA', 270, 95);
      }

      /* ── PHASE 1: INTRO  0–2s ── */
      if (elapsed < 2000) {
        const fade = Math.min(elapsed / 500, 1);
        ctx.globalAlpha = fade;
        ctx.textAlign = 'center';

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.fillText('SORTEO MUNDIAL 2026', 270, 230);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '17px Arial';
        ctx.fillText(matchLabel || 'Gran Partido', 270, 272);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`Premio: ${premio || 'Alitas gratis'}`, 270, 320);

        /* Big participant count */
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 88px Arial';
        ctx.fillText(String(acertantes.length), 270, 510);
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('participantes calificados', 270, 555);

        ctx.globalAlpha = 1;
      }

      /* ── PHASE 2: SPINNING  2–10s ── */
      else if (elapsed < 10000) {
        const sp = (elapsed - 2000) / 8000;

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px Arial';
        ctx.fillText('SORTEANDO...', 270, 210);

        ctx.fillStyle = '#64748b';
        ctx.font = '14px Arial';
        ctx.fillText(`${acertantes.length} participantes en carrera`, 270, 240);

        /* Switch name (slows down) */
        const switchInterval = 60 + sp * 500;
        if ((elapsed - 2000) - lastSwitch > switchInterval) {
          nameIdx = (nameIdx + 1) % names.length;
          lastSwitch = elapsed - 2000;
        }

        /* Slot drum window */
        const SLOT_CY = 490;
        const ROW_H = 90;

        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        rr(ctx, 30, SLOT_CY - ROW_H - 52, 480, ROW_H * 3, 18);
        ctx.fill();

        /* Center highlight */
        ctx.fillStyle = 'rgba(220,38,38,0.22)';
        rr(ctx, 30, SLOT_CY - 52, 480, ROW_H, 14);
        ctx.fill();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.stroke();

        /* Draw 3 names (-1, 0, +1) */
        for (let off = -1; off <= 1; off++) {
          const idx = (nameIdx + off + names.length) % names.length;
          const cy = SLOT_CY + off * ROW_H;
          const isCenter = off === 0;

          ctx.font = `${isCenter ? 'bold 30px' : '18px'} Arial`;
          ctx.fillStyle = isCenter ? '#ffffff' : 'rgba(255,255,255,0.2)';
          ctx.textAlign = 'center';
          ctx.fillText(truncateCanvas(ctx, names[idx] || '', 430), 270, cy + 20);
        }

        /* Progress bar */
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        rr(ctx, 55, 730, 430, 10, 5);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        rr(ctx, 55, 730, 430 * sp, 10, 5);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Premio: ${premio || 'Alitas gratis'}`, 270, 820);
      }

      /* ── PHASE 3: WINNER REVEAL  10–15s ── */
      else {
        const rp = (elapsed - 10000) / 5000;

        /* Confetti */
        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.rv;
          if (p.y > 985) { p.y = -20; p.x = Math.random() * 540; }
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        });

        /* "GANADOR/A" badge */
        ctx.globalAlpha = Math.min(rp * 5, 1);
        const bg = ctx.createLinearGradient(55, 190, 485, 285);
        bg.addColorStop(0, '#7f1d1d');
        bg.addColorStop(1, '#dc2626');
        ctx.fillStyle = bg;
        rr(ctx, 55, 188, 430, 82, 22);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GANADOR/A DEL SORTEO', 270, 245);

        /* Trophy emoji line */
        ctx.font = '40px Arial';
        ctx.fillText('', 270, 310);

        /* Winner name — large, word-wrap */
        ctx.globalAlpha = Math.min((rp - 0.15) * 5, 1);
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.font = 'bold 50px Arial';

        const words = winner.nombre.split(' ');
        const maxW = 460;
        const lines: string[] = [];
        let line = '';
        words.forEach(w => {
          const test = line ? `${line} ${w}` : w;
          if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
          else line = test;
        });
        if (line) lines.push(line);

        const ny = 400 - ((lines.length - 1) * 30);
        lines.forEach((ln, i) => ctx.fillText(ln, 270, ny + i * 62));

        /* Prize box */
        ctx.globalAlpha = Math.min((rp - 0.35) * 4, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        rr(ctx, 80, 610, 380, 62, 14);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '19px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Premio: ${premio || 'Alitas gratis'}`, 270, 650);

        /* Match */
        ctx.fillStyle = '#475569';
        ctx.font = '13px Arial';
        ctx.fillText(matchLabel || '', 270, 710);

        /* Handle */
        ctx.globalAlpha = Math.min((rp - 0.6) * 4, 1);
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('@santodilema', 270, 895);

        ctx.globalAlpha = 1;
      }

      animFrameRef.current = requestAnimationFrame(drawFrame);
    };

    animFrameRef.current = requestAnimationFrame(drawFrame);
  }, [winner, acertantes, matchLabel, premio]);

  /* ── Styles ── */
  const card: React.CSSProperties = { borderRadius: 12, padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0' };
  const lbl: React.CSSProperties = { fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Warning: no match configured */}
      {!matchId && (
        <div style={{ ...card, background: '#fef9c3', border: '1px solid #fde68a' }}>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#b45309' }}>
            Configura y selecciona un partido en la pestana Configuracion primero.
          </p>
        </div>
      )}

      {/* Step 1: select result */}
      {matchId && (
        <div style={card}>
          <p style={{ margin: '0 0 12px', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
            Partido: <span style={{ color: '#15803d' }}>{matchLabel}</span>
          </p>
          <label style={lbl}>Resultado real del partido</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {(['local', 'empate', 'visitante'] as const).map(r => (
              <button key={r} onClick={() => { setResultado(r); setAcertantes([]); setErrorMsg(''); setSpinPhase('idle'); setWinner(null); setVideoUrl(null); }} style={{
                flex: 1, padding: '9px 6px', borderRadius: 8, cursor: 'pointer',
                background: resultado === r ? '#dcfce7' : '#f8fafc',
                border: resultado === r ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                color: resultado === r ? '#15803d' : '#64748b',
                fontSize: '0.72rem', fontWeight: 700,
              }}>
                {r === 'local' ? `Gana ${equipoLocal || 'Local'}` : r === 'visitante' ? `Gana ${equipoVisitante || 'Visitante'}` : 'Empate'}
              </button>
            ))}
          </div>
          <button onClick={cargarAcertantes} disabled={!resultado || loadingA} style={{
            padding: '9px 18px', borderRadius: 8, border: 'none',
            cursor: resultado && !loadingA ? 'pointer' : 'not-allowed',
            background: resultado ? '#e0e7ff' : '#f8fafc',
            color: resultado ? '#4338ca' : '#94a3b8',
            fontSize: '0.8rem', fontWeight: 700,
          }}>
            {loadingA ? 'Cargando...' : 'Cargar acertantes'}
          </button>
          {errorMsg && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '8px 0 0' }}>{errorMsg}</p>}
        </div>
      )}

      {/* Participants list */}
      {acertantes.length > 0 && spinPhase === 'idle' && (
        <div style={{ ...card, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d', marginBottom: 10 }}>
            {acertantes.length} participante(s) calificado(s) — acertaron el resultado
          </p>
          <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {acertantes.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: '#fff', borderRadius: 8 }}>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', minWidth: 22, fontWeight: 600 }}>{i + 1}.</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', flex: 1 }}>{a.nombre}</span>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{a.telefono}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SPIN BUTTON */}
      {acertantes.length > 0 && spinPhase !== 'winner' && (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <button
            onClick={girarSorteo}
            disabled={spinPhase === 'spinning'}
            style={{
              padding: '18px 60px', borderRadius: 18, border: 'none',
              cursor: spinPhase === 'spinning' ? 'default' : 'pointer',
              background: spinPhase === 'spinning'
                ? 'rgba(124,58,237,0.2)'
                : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              color: '#fff', fontSize: '1.15rem', fontWeight: 900,
              letterSpacing: '0.04em',
              boxShadow: spinPhase !== 'spinning' ? '0 10px 36px rgba(124,58,237,0.5)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {spinPhase === 'spinning' ? 'Sorteando...' : 'GIRAR SORTEO'}
          </button>
        </div>
      )}

      {/* SLOT MACHINE DISPLAY */}
      {spinPhase === 'spinning' && (
        <div style={{
          borderRadius: 20, padding: '28px 24px', textAlign: 'center',
          background: 'linear-gradient(145deg, #1e1b4b, #2e1065)',
          border: '2px solid rgba(99,102,241,0.4)',
        }}>
          <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 20 }}>
            Sorteando entre {acertantes.length} participantes
          </p>
          <div style={{
            position: 'relative', overflow: 'hidden', borderRadius: 14,
            background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(99,102,241,0.4)',
            padding: '20px 28px', minHeight: 82,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* gradient masks top/bottom for drum effect */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(30,27,75,0.9) 0%, transparent 30%, transparent 70%, rgba(30,27,75,0.9) 100%)', pointerEvents: 'none', zIndex: 1 }} />
            <span style={{
              fontSize: displayName.length > 22 ? '1.25rem' : '1.9rem',
              fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em', position: 'relative', zIndex: 2,
            }}>
              {displayName || '...'}
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: 14 }}>Seleccionando ganador/a...</p>
        </div>
      )}

      {/* WINNER DISPLAY */}
      {spinPhase === 'winner' && winner && (
        <div style={{
          borderRadius: 22, padding: '36px 28px', textAlign: 'center',
          background: 'linear-gradient(145deg, #faf5ff, #f3e8ff)',
          border: '2px solid #c4b5fd',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(124,58,237,0.2)',
        }}>
          {showConfetti && <ConfettiRain />}

          <div style={{ fontSize: 56, marginBottom: 10, position: 'relative', zIndex: 2 }}>
            {''}
          </div>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 10, position: 'relative', zIndex: 2 }}>
            GANADOR/A DEL SORTEO
          </p>
          <h3 style={{
            fontSize: winner.nombre.length > 20 ? '1.5rem' : '2rem',
            fontWeight: 900, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.15,
            position: 'relative', zIndex: 2,
          }}>
            {winner.nombre}
          </h3>
          <p style={{ color: '#7c3aed', fontSize: '0.95rem', fontWeight: 700, marginBottom: 4, position: 'relative', zIndex: 2 }}>
            {winner.telefono}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 24, position: 'relative', zIndex: 2 }}>
            Premio: {premio || 'Alitas gratis'}
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
            <button onClick={() => { setSpinPhase('idle'); setWinner(null); setVideoUrl(null); }} style={{
              padding: '10px 18px', borderRadius: 10, border: '1px solid #a78bfa',
              background: 'rgba(124,58,237,0.1)', color: '#7c3aed',
              fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
            }}>
              Nuevo sorteo
            </button>
            <button onClick={generarVideo} disabled={recording} style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: recording ? 'rgba(220,38,38,0.25)' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#fff', fontSize: '0.82rem', fontWeight: 700,
              cursor: recording ? 'not-allowed' : 'pointer',
              boxShadow: recording ? 'none' : '0 4px 16px rgba(220,38,38,0.4)',
            }}>
              {recording ? `Generando ${videoProgress}%...` : 'Generar video para Stories'}
            </button>
          </div>

          {/* Progress bar while recording */}
          {recording && (
            <div style={{ marginTop: 14, position: 'relative', zIndex: 2 }}>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(220,38,38,0.15)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${videoProgress}%`, background: '#dc2626', borderRadius: 3, transition: 'width 0.3s' }} />
              </div>
              <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 6 }}>
                Renderizando animacion... {videoProgress}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIDEO DOWNLOAD */}
      {videoUrl && winner && (
        <div style={{ ...card, background: '#fef2f2', border: '1px solid #fca5a5', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>
            Video listo — formato 9:16 (Stories)
          </p>
          <p style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 18 }}>
            15 segundos · ~3 MB · Animacion de sorteo con ganador · Apto para Instagram, TikTok y WhatsApp
          </p>
          <a
            href={videoUrl}
            download={`sorteo-${winner.nombre.replace(/\s+/g, '-').toLowerCase()}.webm`}
            style={{
              display: 'inline-block', padding: '13px 40px', borderRadius: 12,
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
              fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 18px rgba(220,38,38,0.38)',
            }}
          >
            Descargar video (.webm)
          </a>
          <p style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: 10 }}>
            Tip: el formato .webm es compatible con Instagram y TikTok. Para convertir a .mp4 usa ffmpeg o convertio.co
          </p>
        </div>
      )}

      {/* Hidden canvas — video is rendered here off-screen */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
