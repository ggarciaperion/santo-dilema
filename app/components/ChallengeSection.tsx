'use client';

import { useState, useEffect, useRef } from 'react';

interface ChallengeData {
  salesAmount: number;
  goal: number;
  active: boolean;
  deadline: string;
}

const GOAL = 5000;
const DEADLINE = new Date('2026-03-28T23:59:59-05:00');
const MIN_VISUAL_PCT = 45; // Siempre arranca en 45% para no desanimar

function calcVisualPct(salesAmount: number): number {
  const real = Math.min((salesAmount / GOAL) * 100, 100);
  return MIN_VISUAL_PCT + (real / 100) * (100 - MIN_VISUAL_PCT);
}

function DaysCounter() {
  const [daysLeft, setDaysLeft] = useState(0);
  const [hoursLeft, setHoursLeft] = useState(0);

  useEffect(() => {
    const tick = () => {
      const diff = DEADLINE.getTime() - Date.now();
      if (diff <= 0) { setDaysLeft(0); setHoursLeft(0); return; }
      setDaysLeft(Math.floor(diff / (1000 * 60 * 60 * 24)));
      setHoursLeft(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-black text-red-400 tabular-nums text-lg">
      {daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : 'HOY'}
    </span>
  );
}

/* ─── Widget flotante (derecha) ─── */
function FloatingWidget({ data, onClick }: { data: ChallengeData; onClick: () => void }) {
  const visualPct = calcVisualPct(data.salesAmount);
  const isGoalReached = data.salesAmount >= GOAL;
  const fillRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // pequeño delay para que arranque la animación después de montar
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (fillRef.current) {
      fillRef.current.style.setProperty('--thermo-height', `${visualPct}%`);
    }
  }, [visualPct]);

  return (
    <button
      onClick={onClick}
      className="challenge-widget-in fixed bottom-28 right-3 z-40 flex flex-col items-center gap-1 cursor-pointer group"
      aria-label="Ver desafío del cliente"
    >
      {/* Badge superior */}
      <div className="bg-red-600 group-hover:bg-red-500 transition-colors text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg whitespace-nowrap">
        🔥 DESAFÍO
      </div>

      {/* Tubo compacto */}
      <div
        className="thermo-tube-glow relative w-7 h-32 rounded-full overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '2px solid rgba(255,255,255,0.14)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        }}
      >
        {/* Línea de meta */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-yellow-400/70 z-10" />

        {/* Gradaciones */}
        {[75, 50, 25].map(p => (
          <div key={p}
            className="absolute left-0 right-0 h-px bg-white/12"
            style={{ bottom: `${p}%` }}
          />
        ))}

        {/* Mercurio */}
        <div
          ref={fillRef}
          className={ready ? 'thermo-fill' : ''}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: ready ? undefined : `${visualPct}%`,
            ['--thermo-height' as string]: `${visualPct}%`,
            background: isGoalReached
              ? 'linear-gradient(to top, #f59e0b, #ef4444, #fbbf24)'
              : 'linear-gradient(to top, #7f1d1d, #dc2626, #ef4444, #f87171)',
          }}
        />

        {/* Brillo lateral */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to right, transparent 55%, rgba(255,255,255,0.09))' }}
        />
      </div>

      {/* Bulbo */}
      <div
        className="thermo-bulb-pulse w-9 h-9 rounded-full flex items-center justify-center text-sm shadow-xl"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #f87171, #dc2626, #7f1d1d)',
        }}
      >
        🔥
      </div>

      {/* Días */}
      <div className="bg-black/80 border border-red-500/30 rounded-lg px-1.5 py-0.5 text-center">
        <div className="text-white/40 text-[8px] uppercase tracking-wider font-semibold">Fin</div>
        <span className="font-black text-red-400 tabular-nums text-xs">
          <DaysCounter />
        </span>
      </div>
    </button>
  );
}

/* ─── Modal completo ─── */
function ChallengeModal({ data, onClose }: { data: ChallengeData; onClose: () => void }) {
  const visualPct = calcVisualPct(data.salesAmount);
  const isGoalReached = data.salesAmount >= GOAL;
  const pct = Math.round((data.salesAmount / GOAL) * 100);
  const [barWidth, setBarWidth] = useState(MIN_VISUAL_PCT);

  useEffect(() => {
    // Animación de llenado diferido
    const t = setTimeout(() => setBarWidth(visualPct), 300);
    return () => clearTimeout(t);
  }, [visualPct]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="challenge-modal-in relative bg-gray-950 border-2 border-red-500/40 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
        style={{ boxShadow: '0 0 60px rgba(239,68,68,0.25), 0 0 120px rgba(239,68,68,0.08)' }}
      >
        {/* Encabezado */}
        <div
          className="relative overflow-hidden px-6 pt-6 pb-4"
          style={{ background: 'linear-gradient(135deg, #1a0000 0%, #2d0505 50%, #1a0000 100%)' }}
        >
          <div
            className="absolute inset-0 opacity-25"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.7), transparent 70%)' }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-white/40 hover:text-white/80 text-2xl transition-colors z-10"
          >
            ×
          </button>
          <div className="relative text-center">
            <div className="text-4xl mb-1 heartbeat-promo">🏆</div>
            <h2 className="text-xl font-black text-white tracking-tight">
              DESAFÍO <span className="text-red-400">SANTO DILEMA</span>
            </h2>
            <p className="text-red-300/70 text-[11px] font-bold tracking-widest uppercase mt-0.5">
              MARZO 2026 — ¡Cierra el verano a lo grande!
            </p>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-5 space-y-4">

          {/* Premio */}
          <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/20 border border-yellow-500/30 rounded-xl p-4 text-center">
            <div className="text-3xl mb-1">🏡</div>
            <p className="text-yellow-300 font-black text-base uppercase tracking-wide">Full Day en Casa de Campo</p>
            <p className="text-yellow-200/60 text-xs mt-1">Para toda la familia · Fin del verano 🌞</p>
          </div>

          {/* Termómetro horizontal */}
          <div>
            <div className="mb-2">
              <span className="text-white/55 text-xs font-bold uppercase tracking-wide">¿Cómo va el termómetro?</span>
            </div>

            <div
              className="thermo-tube-glow relative h-8 rounded-full overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '2px solid rgba(255,255,255,0.13)',
              }}
            >
              {/* Marca de meta */}
              <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-yellow-400/60 z-10" />

              {/* Barra de relleno con transition */}
              <div
                className="thermo-fill absolute left-0 top-0 bottom-0 origin-left rounded-full"
                style={{
                  width: `${barWidth}%`,
                  transition: 'width 1.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  background: isGoalReached
                    ? 'linear-gradient(to right, #f59e0b, #ef4444, #fbbf24)'
                    : 'linear-gradient(to right, #7f1d1d, #dc2626, #ef4444, #f87171)',
                }}
              />

              {/* Texto encima */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <span className="text-white font-black text-xs drop-shadow-lg">
                  {isGoalReached ? '🔥 ¡META ALCANZADA!' : '¡Sigue subiendo!'}
                </span>
              </div>
            </div>

            <div className="flex justify-between mt-1.5 text-[10px] font-semibold">
              <span className="text-white/35">Inicio</span>
              <span className="text-yellow-400/70">🏆 ¡SORTEO!</span>
            </div>
          </div>

          {/* Cómo funciona */}
          <div className="space-y-2.5">
            {[
              { icon: '🛒', bold: 'Compra cualquier menú', text: 'antes del 28 de marzo y entras al sorteo automáticamente.' },
              { icon: '🔥', bold: 'Cada compra hace subir el termómetro.', text: 'Mientras más pedidos tengamos entre todos, más sube. ¡Si llegamos a la meta, el sorteo se activa!' },
              { icon: '📢', bold: 'Sorteo en vivo', text: 'el sábado 28 de marzo por WhatsApp y redes.' },
            ].map(({ icon, bold, text }) => (
              <div key={bold} className="flex items-start gap-2.5">
                <span className="text-lg leading-none mt-0.5 flex-shrink-0">{icon}</span>
                <p className="text-white/75 text-xs leading-relaxed">
                  <span className="text-white font-bold">{bold}</span> {text}
                </p>
              </div>
            ))}
          </div>

          {/* Countdown */}
          <div className="bg-gray-900/80 border border-red-500/20 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-0.5">Tiempo restante</p>
              <div className="flex items-center gap-1">
                <span className="text-xl">⏳</span>
                <DaysCounter />
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-0.5">Sorteo</p>
              <p className="text-red-300 font-black text-base">Sáb 28 Mar</p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full py-4 rounded-xl font-black text-sm text-white transition-all hover:scale-[1.02] active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #b91c1c, #dc2626, #ef4444)',
              boxShadow: '0 0 24px rgba(239,68,68,0.45), 0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            🔥 ¡PARTICIPAR COMPRANDO AHORA!
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Export principal ─── */
export default function ChallengeSection() {
  const [data, setData] = useState<ChallengeData>({ salesAmount: 0, goal: GOAL, active: true, deadline: '2026-03-28' });
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/challenge')
      .then(r => r.json())
      .then((d: ChallengeData) => setData(d))
      .catch(() => {});

    const shown = sessionStorage.getItem('challengeModalShown_v1');
    if (!shown) {
      const timer = setTimeout(() => {
        setShowModal(true);
        sessionStorage.setItem('challengeModalShown_v1', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // No renderizar en SSR ni si ya pasó la fecha
  if (!mounted || !data.active) return null;
  if (new Date() > DEADLINE) return null;

  return (
    <>
      <FloatingWidget data={data} onClick={() => setShowModal(true)} />
      {showModal && <ChallengeModal data={data} onClose={() => setShowModal(false)} />}
    </>
  );
}
