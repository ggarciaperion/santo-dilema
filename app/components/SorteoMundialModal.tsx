'use client';

import { useState, useEffect, useCallback } from 'react';

interface Config {
  active: boolean;
  concursoAbierto: boolean;
  matchLabel: string | null;
  equipoLocal: string | null;
  equipoVisitante: string | null;
  flagLocal: string | null;
  flagVisitante: string | null;
  mensajePromo: string;
  premio: string;
}

const FLAG_FALLBACK: Record<string, string> = {
  'México': '🇲🇽', 'Mexico': '🇲🇽',
  'Brasil': '🇧🇷', 'Brazil': '🇧🇷',
  'Argentina': '🇦🇷',
  'Perú': '🇵🇪', 'Peru': '🇵🇪',
  'USA': '🇺🇸', 'Estados Unidos': '🇺🇸',
  'Alemania': '🇩🇪', 'Germany': '🇩🇪',
  'Francia': '🇫🇷', 'France': '🇫🇷',
  'España': '🇪🇸', 'Spain': '🇪🇸',
  'Portugal': '🇵🇹',
  'Uruguay': '🇺🇾',
  'Colombia': '🇨🇴',
  'Chile': '🇨🇱',
  'Ecuador': '🇪🇨',
  'Bolivia': '🇧🇴',
  'Paraguay': '🇵🇾',
  'Venezuela': '🇻🇪',
  'Canadá': '🇨🇦', 'Canada': '🇨🇦',
  'Japón': '🇯🇵', 'Japan': '🇯🇵',
  'Corea del Sur': '🇰🇷', 'South Korea': '🇰🇷',
  'Australia': '🇦🇺',
  'Marruecos': '🇲🇦', 'Morocco': '🇲🇦',
  'Senegal': '🇸🇳',
  'Nigeria': '🇳🇬',
  'Egipto': '🇪🇬', 'Egypt': '🇪🇬',
  'Sudáfrica': '🇿🇦', 'South Africa': '🇿🇦',
  'Arabia Saudita': '🇸🇦', 'Saudi Arabia': '🇸🇦',
  'Irán': '🇮🇷', 'Iran': '🇮🇷',
};

function getFlag(nombre: string | null, flagUrl: string | null): string {
  if (!nombre) return '⚽';
  // Si ya es un emoji de bandera (no URL HTTP), usarlo directamente
  if (flagUrl && !flagUrl.startsWith('http')) return flagUrl;
  // Fallback por nombre de país
  return FLAG_FALLBACK[nombre] || '⚽';
}

type Step = 'loading' | 'form' | 'success' | 'closed' | 'hidden';

const STORAGE_KEY = 'sorteo_mundial_v2';

export default function SorteoMundialModal() {
  const [step, setStep] = useState<Step>('loading');
  const [config, setConfig] = useState<Config | null>(null);
  const [prediccion, setPrediccion] = useState<'local' | 'empate' | 'visitante' | null>(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [visible, setVisible] = useState(false);

  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

  const checkParticipacion = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return data.fecha === hoy;
    } catch {
      return false;
    }
  }, [hoy]);

  useEffect(() => {
    // Delay de 1.5s para no bloquear la experiencia inicial
    const timer = setTimeout(async () => {
      try {
        // ?preview_sorteo=1 bypasa localStorage (para pruebas de admin)
        const bypass = typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('preview_sorteo') === '1';

        // Si ya participó hoy → no mostrar (salvo bypass)
        if (!bypass && checkParticipacion()) { setStep('hidden'); return; }

        const res = await fetch('/api/sorteo-mundial/config');
        if (!res.ok) { setStep('hidden'); return; }
        const data = await res.json();

        if (!data.active || !data.concursoAbierto || !data.equipoLocal) {
          setStep('hidden');
          return;
        }

        setConfig(data);
        setStep('form');
        setVisible(true);

        // Registrar impresión
        fetch('/api/sorteo-mundial/impresion', { method: 'POST' }).catch(() => {});
      } catch {
        setStep('hidden');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [checkParticipacion]);

  const handleSubmit = async () => {
    if (!prediccion) { setError('Selecciona tu predicción'); return; }
    if (!nombre.trim()) { setError('Ingresa tu nombre'); return; }
    if (!/^9[0-9]{8}$/.test(telefono.replace(/\s/g, ''))) {
      setError('Ingresa un celular peruano válido (9 dígitos)');
      return;
    }

    setError('');
    setEnviando(true);

    try {
      const res = await fetch('/api/sorteo-mundial/participar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, telefono: telefono.replace(/\s/g, ''), prediccion }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al registrar. Intenta de nuevo.');
        setEnviando(false);
        return;
      }

      // Guardar en localStorage para no re-mostrar hoy
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ fecha: hoy, id: data.id }));
      setStep('success');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
      setEnviando(false);
    }
  };

  const cerrar = () => {
    setVisible(false);
    setTimeout(() => setStep('hidden'), 300);
  };

  if (step === 'hidden' || step === 'loading') return null;

  const flagLocal = getFlag(config?.equipoLocal || null, config?.flagLocal || null);
  const flagVisit = getFlag(config?.equipoVisitante || null, config?.flagVisitante || null);

  return (
    <>
      <style>{`
        @keyframes smFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes smSlideUp { from{opacity:0;transform:translateY(32px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes smPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes smShine {
          0%{background-position:-200% center}
          100%{background-position:200% center}
        }
        @keyframes smBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes smGlowPulse {
          0%,100%{box-shadow:0 0 20px rgba(34,197,94,0.3), 0 0 40px rgba(234,179,8,0.1)}
          50%{box-shadow:0 0 30px rgba(34,197,94,0.5), 0 0 60px rgba(234,179,8,0.2)}
        }
        .sm-option { transition: all 0.18s ease; }
        .sm-option:hover { transform: translateY(-2px); }
        .sm-option.selected { animation: smGlowPulse 2s ease infinite; }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[230] flex items-center justify-center p-3 sm:p-4"
        style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(3px)',
          animation: 'smFadeIn 0.3s ease',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        onClick={cerrar}
      >
        {/* Card */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            maxWidth: 420,
            maxHeight: '95dvh',
            overflowY: 'auto',
            borderRadius: 20,
            background: 'linear-gradient(160deg, #0a1628 0%, #0d2240 50%, #0a1628 100%)',
            border: '1.5px solid rgba(34,197,94,0.35)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.8), 0 0 60px rgba(34,197,94,0.08)',
            animation: 'smSlideUp 0.4s cubic-bezier(0.22,1,0.36,1)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Top accent bar */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #16a34a, #eab308, #16a34a)', backgroundSize: '200% 100%', animation: 'smShine 3s linear infinite' }} />

          {step === 'form' && config && (
            <div className="px-5 py-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ fontSize: 18 }}>🏆</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', color: '#eab308', textTransform: 'uppercase' }}>
                      Mundial 2026 · Sorteo
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
                    ¡Adivina el resultado
                    <br />
                    <span style={{ color: '#4ade80' }}>y entra al sorteo! 🎁</span>
                  </h2>
                </div>
                <button
                  onClick={cerrar}
                  style={{
                    width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)',
                    fontSize: 16, fontWeight: 900, cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
              </div>

              {/* Promo message */}
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>
                {config.mensajePromo}
              </p>

              {/* Match card */}
              <div style={{
                borderRadius: 14, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)', padding: '14px 12px', marginBottom: 16,
              }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.15em', textAlign: 'center', textTransform: 'uppercase', marginBottom: 10 }}>
                  ⚽ Partido de hoy
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  {/* Local */}
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 4 }}>{flagLocal}</div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                      {config.equipoLocal}
                    </p>
                  </div>
                  {/* VS */}
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#64748b' }}>VS</div>
                  </div>
                  {/* Visitante */}
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 4 }}>{flagVisit}</div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                      {config.equipoVisitante}
                    </p>
                  </div>
                </div>
              </div>

              {/* Predicción */}
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                ¿Cuál es tu predicción?
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {([
                  { key: 'local', label: `Gana\n${config.equipoLocal}`, icon: flagLocal },
                  { key: 'empate', label: 'Empate', icon: '🤝' },
                  { key: 'visitante', label: `Gana\n${config.equipoVisitante}`, icon: flagVisit },
                ] as const).map(op => (
                  <button
                    key={op.key}
                    className={`sm-option${prediccion === op.key ? ' selected' : ''}`}
                    onClick={() => setPrediccion(op.key)}
                    style={{
                      flex: 1, padding: '10px 6px', borderRadius: 12, cursor: 'pointer',
                      border: prediccion === op.key ? '2px solid #22c55e' : '1.5px solid rgba(255,255,255,0.12)',
                      background: prediccion === op.key
                        ? 'linear-gradient(145deg, rgba(34,197,94,0.2), rgba(21,128,61,0.15))'
                        : 'rgba(255,255,255,0.04)',
                      textAlign: 'center', color: prediccion === op.key ? '#4ade80' : '#94a3b8',
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{op.icon}</div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, lineHeight: 1.3, whiteSpace: 'pre-line' }}>
                      {op.label}
                    </div>
                    {prediccion === op.key && (
                      <div style={{ fontSize: 12, marginTop: 4 }}>✓</div>
                    )}
                  </button>
                ))}
              </div>

              {/* Datos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Tu nombre"
                    maxLength={80}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(34,197,94,0.5)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>
                    Número de celular
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="9XXXXXXXX"
                    inputMode="numeric"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(34,197,94,0.5)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5',
                  fontSize: '0.78rem', marginBottom: 12,
                }}>
                  {error}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleSubmit}
                disabled={enviando}
                style={{
                  width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: enviando ? 'not-allowed' : 'pointer',
                  background: enviando ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#fff', fontSize: '0.9rem', fontWeight: 900, letterSpacing: '0.05em',
                  boxShadow: enviando ? 'none' : '0 4px 20px rgba(22,163,74,0.4)',
                  transition: 'all 0.2s ease',
                }}
              >
                {enviando ? '⏳ Registrando...' : '🎯 ¡Participar ahora!'}
              </button>

              {/* Fine print */}
              <p style={{ textAlign: 'center', fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: 10 }}>
                Quienes acierten entran al sorteo · Un celular por día · Jue–Dom · Santo Dilema
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="px-5 py-8 text-center">
              <div style={{ fontSize: 56, animation: 'smBounce 1s ease infinite', display: 'block', marginBottom: 12 }}>🏆</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4ade80', marginBottom: 6 }}>
                ¡Predicción registrada!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 16 }}>
                Si tu predicción es correcta, <strong style={{ color: '#fff' }}>entrarás al sorteo</strong> junto con todos los que acierten.
              </p>
              <div style={{
                borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)',
              }}>
                <p style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.82rem', margin: 0 }}>
                  🎲 El ganador del sorteo es elegido entre todos los acertantes
                </p>
              </div>
              <div style={{
                borderRadius: 12, padding: '12px 16px', marginBottom: 20,
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              }}>
                <p style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>
                  🎁 Premio: {config?.premio || 'Alitas gratis'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', margin: '4px 0 0' }}>
                  El ganador será contactado por WhatsApp
                </p>
              </div>
              <button
                onClick={cerrar}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', fontWeight: 700,
                }}
              >
                ¡Perfecto, gracias!
              </button>
            </div>
          )}

          {/* Bottom accent bar */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #eab308, #16a34a, #eab308)', backgroundSize: '200% 100%', animation: 'smShine 4s linear infinite' }} />
        </div>
      </div>
    </>
  );
}
