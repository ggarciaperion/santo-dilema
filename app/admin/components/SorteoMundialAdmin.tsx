'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface Config {
  active: boolean;
  concursoAbierto: boolean;
  matchId: string;
  matchLabel: string;
  equipoLocal: string;
  equipoVisitante: string;
  flagLocal: string;
  flagVisitante: string;
  fechaPartido: string;
  horaPartido: string;
  mensajePromo: string;
  premio: string;
  _raw?: {
    active: boolean;
    esDiaValido: boolean;
    dentroDeHorario: boolean;
    horaActualLima: number;
  };
}

interface Fixture {
  id: string;
  date: string;       // ISO UTC
  status: string;
  phase: string;
  group?: string;
  roundLabel?: string;
  home: { name: string; shortName: string; flag: string };
  away: { name: string; shortName: string; flag: string };
  homeScore?: number;
  awayScore?: number;
}

interface Participante {
  id: string;
  nombre: string;
  telefono: string;
  matchLabel: string;
  prediccionLabel: string;
  prediccion: string;
  fechaParticipacion: string;
  estado: string;
}

interface Metricas {
  impresiones: number;
  participaciones: number;
  conversion: number;
  porDia: Record<string, number>;
}

const DEFAULT_CONFIG: Config = {
  active: false, concursoAbierto: false,
  matchId: '', matchLabel: '',
  equipoLocal: '', equipoVisitante: '',
  flagLocal: '', flagVisitante: '',
  fechaPartido: '', horaPartido: '',
  mensajePromo: '🏆 Quienes acierten entran al sorteo de alitas gratis.',
  premio: 'Alitas gratis',
};

const ESTADO_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  participando: { bg: 'rgba(234,179,8,0.2)',   color: '#fbbf24', label: 'Participando' },
  acerto:       { bg: 'rgba(34,197,94,0.2)',    color: '#4ade80', label: '✓ Acertó' },
  no_acerto:    { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', label: '✗ No acertó' },
  ganador:      { bg: 'rgba(168,85,247,0.2)',   color: '#c084fc', label: '🏆 GANADOR' },
};

function toHoraLima(isoUtc: string): string {
  return new Date(isoUtc).toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function toLimaDateStr(isoUtc: string): string {
  return new Date(isoUtc).toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}

function FlagImg({ src, name, size = 32 }: { src: string; name: string; size?: number }) {
  const isUrl = src?.startsWith('http');
  if (isUrl) {
    return (
      <Image
        src={src} alt={name} width={size} height={size}
        style={{ objectFit: 'contain', borderRadius: 3, flexShrink: 0 }}
        unoptimized
      />
    );
  }
  return <span style={{ fontSize: size * 0.85, lineHeight: 1, flexShrink: 0 }}>{src || '🏳️'}</span>;
}

export default function SorteoMundialAdmin() {
  const [tab, setTab] = useState<'config' | 'participantes' | 'ganadores'>('config');
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Fixtures del día
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [showManual, setShowManual] = useState(false);

  // Participantes
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loadingP, setLoadingP] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroTel, setFiltroTel] = useState('');
  const [metricas, setMetricas] = useState<Metricas | null>(null);

  // Ganadores
  const [resultadoPartido, setResultadoPartido] = useState<'local' | 'empate' | 'visitante' | ''>('');
  const [procesandoGanador, setProcesandoGanador] = useState(false);
  const [ganadorInfo, setGanadorInfo] = useState<Participante | null>(null);
  const [acertantes, setAcertantes] = useState<Participante[]>([]);
  const [ganadorManualId, setGanadorManualId] = useState('');

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/sorteo-mundial/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(prev => ({ ...DEFAULT_CONFIG, ...prev, ...data }));
        if (data.matchId) setSelectedMatchId(data.matchId);
      }
    } catch { /* silent */ }
  }, []);

  const loadFixtures = useCallback(async () => {
    setLoadingFixtures(true);
    try {
      const res = await fetch('/api/mundial/fixtures');
      if (!res.ok) return;
      const data = await res.json();
      const hoyLima = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
      const hoy: Fixture[] = (data.fixtures || []).filter((f: Fixture) =>
        toLimaDateStr(f.date) === hoyLima
      );
      setFixtures(hoy);
    } catch { /* silent */ }
    setLoadingFixtures(false);
  }, []);

  const loadMetricas = useCallback(async () => {
    try {
      const res = await fetch('/api/sorteo-mundial/impresion');
      if (res.ok) setMetricas(await res.json());
    } catch { /* silent */ }
  }, []);

  const loadParticipantes = useCallback(async () => {
    setLoadingP(true);
    try {
      const params = new URLSearchParams();
      if (filtroFecha) params.set('fecha', filtroFecha);
      if (filtroTel) params.set('telefono', filtroTel);
      const res = await fetch(`/api/sorteo-mundial/participantes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setParticipantes(data.participantes || []);
      }
    } catch { /* silent */ }
    setLoadingP(false);
  }, [filtroFecha, filtroTel]);

  useEffect(() => { loadConfig(); loadMetricas(); loadFixtures(); }, [loadConfig, loadMetricas, loadFixtures]);
  useEffect(() => { if (tab === 'participantes') loadParticipantes(); }, [tab, loadParticipantes]);

  const selectFixture = (f: Fixture) => {
    const horaLima = toHoraLima(f.date);
    const fechaLima = toLimaDateStr(f.date);
    setSelectedMatchId(f.id);
    setConfig(prev => ({
      ...prev,
      matchId: f.id,
      matchLabel: `${f.home.name} vs ${f.away.name}`,
      equipoLocal: f.home.name,
      equipoVisitante: f.away.name,
      flagLocal: f.home.flag || '',
      flagVisitante: f.away.flag || '',
      fechaPartido: fechaLima,
      horaPartido: horaLima,
    }));
  };

  // Activar/desactivar sorteo en un solo click (guarda todo)
  const toggleSorteo = async (activar: boolean) => {
    setSaving(true);
    setSaveMsg('');
    try {
      const payload = { ...config, active: activar, concursoAbierto: activar };
      const res = await fetch('/api/sorteo-mundial/config', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setConfig(prev => ({ ...prev, active: activar, concursoAbierto: activar }));
        setSaveMsg(activar ? '✓ Sorteo activado — ya aparece en la web' : '✓ Sorteo desactivado');
      } else {
        setSaveMsg('✗ Error al guardar');
      }
    } catch { setSaveMsg('✗ Error de red'); }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 4000);
  };

  const saveConfig = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/sorteo-mundial/config', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) setSaveMsg('✓ Guardado');
      else setSaveMsg('✗ Error');
    } catch { setSaveMsg('✗ Error de red'); }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const exportCSV = () => {
    const params = new URLSearchParams({ formato: 'csv' });
    if (filtroFecha) params.set('fecha', filtroFecha);
    if (filtroTel) params.set('telefono', filtroTel);
    window.open(`/api/sorteo-mundial/participantes?${params}`, '_blank');
  };

  const cargarAcertantes = async () => {
    if (!resultadoPartido || !config.matchId) return;
    const res = await fetch(`/api/sorteo-mundial/ganadores?matchId=${config.matchId}&resultado=${resultadoPartido}`);
    if (res.ok) { const d = await res.json(); setAcertantes(d.acertantes || []); }
  };

  const procesarGanador = async (modo: 'random' | 'manual') => {
    if (!resultadoPartido || !config.matchId) return;
    if (modo === 'manual' && !ganadorManualId) return;
    setProcesandoGanador(true);
    const res = await fetch('/api/sorteo-mundial/ganadores', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: config.matchId, resultadoPartido, modo, ganadorId: modo === 'manual' ? ganadorManualId : undefined }),
    });
    if (res.ok) {
      const d = await res.json();
      setGanadorInfo(d.ganador);
      setAcertantes(prev => prev.map(p => ({ ...p, estado: p.id === d.ganador?.id ? 'ganador' : 'acerto' })));
    }
    setProcesandoGanador(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8, boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', fontSize: '0.85rem', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4,
  };
  const cardStyle: React.CSSProperties = {
    borderRadius: 12, padding: '16px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  };

  const raw = config._raw;
  const sorteoActivo = raw ? raw.active : config.active;
  const puedeActivar = fixtures.length > 0 || showManual ? !!config.matchId : false;

  return (
    <div style={{ padding: '0 0 40px' }}>

      {/* ── ESTADO PRINCIPAL ── */}
      <div style={{
        ...cardStyle,
        marginBottom: 20,
        background: sorteoActivo
          ? 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(21,128,61,0.08))'
          : 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${sorteoActivo ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: sorteoActivo ? '#22c55e' : '#475569',
              boxShadow: sorteoActivo ? '0 0 8px #22c55e' : 'none',
            }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: sorteoActivo ? '#4ade80' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              {sorteoActivo ? 'Sorteo activo' : 'Sorteo inactivo'}
            </span>
          </div>
          {config.matchLabel ? (
            <p style={{ margin: 0, color: '#e2e8f0', fontWeight: 700, fontSize: '0.9rem' }}>
              ⚽ {config.matchLabel}
            </p>
          ) : (
            <p style={{ margin: 0, color: '#475569', fontSize: '0.82rem' }}>Sin partido seleccionado</p>
          )}
          {raw && !raw.esDiaValido && (
            <p style={{ margin: '4px 0 0', color: '#f87171', fontSize: '0.7rem' }}>
              ⚠️ Hoy no es Jue/Vie/Sáb/Dom — el modal no aparece aunque esté activo
            </p>
          )}
          {raw && !raw.dentroDeHorario && raw.esDiaValido && (
            <p style={{ margin: '4px 0 0', color: '#f87171', fontSize: '0.7rem' }}>
              ⚠️ Son las {raw.horaActualLima}:00 hs Lima — el modal se oculta después de las 23:00
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {sorteoActivo ? (
            <button
              onClick={() => toggleSorteo(false)}
              disabled={saving}
              style={{
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
                color: '#f87171', fontSize: '0.82rem', fontWeight: 700,
              } as React.CSSProperties}
            >
              ⏹ Desactivar sorteo
            </button>
          ) : (
            <button
              onClick={() => toggleSorteo(true)}
              disabled={saving || !config.matchId}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                cursor: config.matchId ? 'pointer' : 'not-allowed',
                background: config.matchId
                  ? 'linear-gradient(135deg, #16a34a, #15803d)'
                  : 'rgba(255,255,255,0.05)',
                color: config.matchId ? '#fff' : '#475569',
                fontSize: '0.82rem', fontWeight: 700,
                boxShadow: config.matchId ? '0 4px 16px rgba(22,163,74,0.35)' : 'none',
              }}
            >
              {saving ? '⏳...' : '▶ Activar sorteo'}
            </button>
          )}
        </div>
      </div>
      {saveMsg && (
        <p style={{ fontSize: '0.8rem', color: saveMsg.startsWith('✓') ? '#4ade80' : '#f87171', fontWeight: 600, marginBottom: 12, marginTop: -8 }}>
          {saveMsg}
        </p>
      )}

      {/* Métricas rápidas */}
      {metricas && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Impresiones', value: metricas.impresiones, color: '#60a5fa' },
            { label: 'Participaciones', value: metricas.participaciones, color: '#4ade80' },
            { label: 'Conversión', value: `${metricas.conversion}%`, color: '#fbbf24' },
          ].map(m => (
            <div key={m.label} style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {(['config', 'participantes', 'ganadores'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
            background: tab === t ? 'rgba(34,197,94,0.15)' : 'transparent',
            borderBottom: tab === t ? '2px solid #22c55e' : '2px solid transparent',
            color: tab === t ? '#4ade80' : '#64748b',
            fontSize: '0.78rem', fontWeight: 700,
          }}>
            {t === 'config' ? '⚙️ Configuración' : t === 'participantes' ? '👥 Participantes' : '🏆 Ganadores'}
          </button>
        ))}
      </div>

      {/* ── TAB: CONFIG ── */}
      {tab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* PARTIDOS DEL DÍA */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>
                📅 Partidos de hoy
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 400, marginLeft: 8 }}>
                  ({new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima', weekday: 'long', day: 'numeric', month: 'long' })})
                </span>
              </p>
              <button onClick={loadFixtures} style={{
                padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: 'rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: '0.7rem',
              }}>↻ Recargar</button>
            </div>

            {loadingFixtures ? (
              <p style={{ color: '#475569', fontSize: '0.8rem' }}>Cargando partidos...</p>
            ) : fixtures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ color: '#475569', fontSize: '0.82rem', margin: '0 0 8px' }}>
                  No hay partidos del Mundial hoy.
                </p>
                <button
                  onClick={() => setShowManual(true)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  + Ingresar partido manualmente
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {fixtures.map(f => {
                  const selected = selectedMatchId === f.id;
                  const hora = toHoraLima(f.date);
                  const finished = f.status === 'finished';
                  return (
                    <div
                      key={f.id}
                      onClick={() => !finished && selectFixture(f)}
                      style={{
                        borderRadius: 12, padding: '12px 14px',
                        background: selected
                          ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(21,128,61,0.1))'
                          : finished ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                        border: `1.5px solid ${selected ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        cursor: finished ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 12,
                        opacity: finished ? 0.55 : 1,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {/* Local */}
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', textAlign: 'right' }}>
                          {f.home.shortName || f.home.name}
                        </span>
                        <FlagImg src={f.home.flag} name={f.home.name} size={26} />
                      </div>

                      {/* Centro */}
                      <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 60 }}>
                        {finished ? (
                          <div style={{ fontWeight: 900, color: '#94a3b8', fontSize: '1rem' }}>
                            {f.homeScore} - {f.awayScore}
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>VS</div>
                            <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700 }}>{hora}</div>
                          </>
                        )}
                        {f.group && (
                          <div style={{ fontSize: '0.58rem', color: '#475569', marginTop: 2 }}>Grupo {f.group}</div>
                        )}
                      </div>

                      {/* Visitante */}
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FlagImg src={f.away.flag} name={f.away.name} size={26} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>
                          {f.away.shortName || f.away.name}
                        </span>
                      </div>

                      {/* Check seleccionado */}
                      {selected && (
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>✓</span>
                        </div>
                      )}
                      {finished && (
                        <span style={{ fontSize: '0.6rem', color: '#475569', flexShrink: 0 }}>FINALIZADO</span>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={() => setShowManual(!showManual)}
                  style={{ alignSelf: 'flex-start', padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748b', fontSize: '0.7rem', cursor: 'pointer', marginTop: 4 }}
                >
                  {showManual ? '− Ocultar entrada manual' : '+ Partido manual'}
                </button>
              </div>
            )}
          </div>

          {/* PARTIDO MANUAL */}
          {showManual && (
            <div style={{ ...cardStyle, border: '1px solid rgba(234,179,8,0.2)' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fbbf24', marginBottom: 14 }}>
                ✏️ Partido manual
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Equipo local</label>
                  <input style={inputStyle} value={config.equipoLocal}
                    onChange={e => setConfig(p => ({ ...p, equipoLocal: e.target.value, matchId: `manual_${Date.now()}`, matchLabel: `${e.target.value} vs ${p.equipoVisitante}` }))}
                    placeholder="ej: México" />
                </div>
                <div>
                  <label style={labelStyle}>Equipo visitante</label>
                  <input style={inputStyle} value={config.equipoVisitante}
                    onChange={e => setConfig(p => ({ ...p, equipoVisitante: e.target.value, matchLabel: `${p.equipoLocal} vs ${e.target.value}` }))}
                    placeholder="ej: Sudáfrica" />
                </div>
                <div>
                  <label style={labelStyle}>Hora (Lima)</label>
                  <input style={inputStyle} type="time" value={config.horaPartido}
                    onChange={e => setConfig(p => ({ ...p, horaPartido: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>ID único del partido</label>
                  <input style={inputStyle} value={config.matchId}
                    onChange={e => setConfig(p => ({ ...p, matchId: e.target.value }))}
                    placeholder="ej: g001" />
                </div>
              </div>
            </div>
          )}

          {/* PARTIDO SELECCIONADO — preview */}
          {config.equipoLocal && config.equipoVisitante && (
            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Partido seleccionado</p>
                <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                  {config.equipoLocal} vs {config.equipoVisitante}
                </p>
                {config.horaPartido && (
                  <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#fbbf24' }}>
                    ⏰ {config.horaPartido} hrs Lima
                  </p>
                )}
              </div>
              <button
                onClick={() => { setConfig(p => ({ ...p, matchId: '', matchLabel: '', equipoLocal: '', equipoVisitante: '', flagLocal: '', flagVisitante: '', fechaPartido: '', horaPartido: '' })); setSelectedMatchId(''); }}
                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.72rem', cursor: 'pointer' }}
              >
                ✕ Cambiar
              </button>
            </div>
          )}

          {/* MENSAJE Y PREMIO */}
          <div style={cardStyle}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 14 }}>🎁 Mensaje y premio</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Mensaje promocional</label>
                <input style={inputStyle} value={config.mensajePromo}
                  onChange={e => setConfig(p => ({ ...p, mensajePromo: e.target.value }))}
                  placeholder="ej: ¡Adivina el resultado y gana alitas gratis!" />
              </div>
              <div>
                <label style={labelStyle}>Premio</label>
                <input style={inputStyle} value={config.premio}
                  onChange={e => setConfig(p => ({ ...p, premio: e.target.value }))}
                  placeholder="ej: Alitas gratis (porción de 6)" />
              </div>
            </div>
          </div>

          {/* GUARDAR CONFIG (sin activar) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={saveConfig} disabled={saving} style={{
              padding: '9px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.06)', cursor: 'pointer',
              color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600,
            }}>
              {saving ? '⏳...' : '💾 Guardar sin activar'}
            </button>
            {saveMsg && (
              <span style={{ fontSize: '0.78rem', color: saveMsg.startsWith('✓') ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                {saveMsg}
              </span>
            )}
          </div>

          {/* Info de vigencia */}
          <div style={{ ...cardStyle, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.6 }}>
              <strong style={{ color: '#a5b4fc' }}>ℹ️ Vigencia automática:</strong> el modal se muestra solo
              los <strong style={{ color: '#e2e8f0' }}>jueves, viernes, sábados y domingos</strong> entre
              las <strong style={{ color: '#e2e8f0' }}>00:00 y las 23:00 hrs Lima</strong>.
              Se oculta automáticamente a las 23:00 o cuando desactives el sorteo.
            </p>
          </div>
        </div>
      )}

      {/* ── TAB: PARTICIPANTES ── */}
      {tab === 'participantes' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <input style={{ ...inputStyle, width: 160, flex: 'none' }} type="date"
              value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
            <input style={{ ...inputStyle, width: 160, flex: 'none' }} type="text"
              placeholder="Buscar teléfono..." value={filtroTel} onChange={e => setFiltroTel(e.target.value)} />
            <button onClick={loadParticipantes} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(99,102,241,0.25)', color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 700 }}>
              🔍 Filtrar
            </button>
            <button onClick={exportCSV} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontSize: '0.8rem', fontWeight: 700 }}>
              📥 CSV
            </button>
          </div>

          {loadingP ? (
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Cargando...</p>
          ) : participantes.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Sin resultados.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <p style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 8 }}>{participantes.length} registro(s)</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr>
                    {['Nombre', 'Teléfono', 'Partido', 'Predicción', 'Fecha', 'Estado'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '7px 10px', color: '#475569', fontWeight: 700, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {participantes.map(p => {
                    const badge = ESTADO_BADGE[p.estado] || { bg: 'rgba(255,255,255,0.06)', color: '#94a3b8', label: p.estado };
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '8px 10px', color: '#e2e8f0', fontWeight: 600 }}>{p.nombre}</td>
                        <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{p.telefono}</td>
                        <td style={{ padding: '8px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{p.matchLabel}</td>
                        <td style={{ padding: '8px 10px', color: '#60a5fa' }}>{p.prediccionLabel}</td>
                        <td style={{ padding: '8px 10px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {new Date(p.fechaParticipacion).toLocaleDateString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 20, background: badge.bg, color: badge.color, fontSize: '0.63rem', fontWeight: 700 }}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: GANADORES ── */}
      {tab === 'ganadores' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={cardStyle}>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 14 }}>
              Partido: <span style={{ color: '#4ade80' }}>{config.matchLabel || '(sin configurar)'}</span>
            </p>

            <label style={labelStyle}>Resultado del partido</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {(['local', 'empate', 'visitante'] as const).map(r => (
                <button key={r} onClick={() => setResultadoPartido(r)} style={{
                  flex: 1, padding: '9px 8px', borderRadius: 8, cursor: 'pointer',
                  background: resultadoPartido === r ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)',
                  border: resultadoPartido === r ? '1.5px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
                  color: resultadoPartido === r ? '#4ade80' : '#94a3b8',
                  fontSize: '0.75rem', fontWeight: 700,
                } as React.CSSProperties}>
                  {r === 'local' ? `Gana ${config.equipoLocal || 'Local'}` : r === 'visitante' ? `Gana ${config.equipoVisitante || 'Visitante'}` : 'Empate'}
                </button>
              ))}
            </div>

            <button onClick={cargarAcertantes} disabled={!resultadoPartido} style={{
              padding: '9px 18px', borderRadius: 8, border: 'none', cursor: resultadoPartido ? 'pointer' : 'not-allowed',
              background: resultadoPartido ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
              color: resultadoPartido ? '#a5b4fc' : '#475569', fontSize: '0.8rem', fontWeight: 700, marginBottom: 16,
            }}>
              🔍 Ver acertantes
            </button>

            {acertantes.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 700, marginBottom: 8 }}>
                  {acertantes.length} acertante(s)
                </p>
                <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {acertantes.map(a => {
                    const badge = ESTADO_BADGE[a.estado] || { bg: 'rgba(255,255,255,0.06)', color: '#94a3b8', label: a.estado };
                    return (
                      <div key={a.id} onClick={() => setGanadorManualId(a.id)} style={{
                        padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                        background: ganadorManualId === a.id ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${ganadorManualId === a.id ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.06)'}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div>
                          <p style={{ margin: 0, color: '#e2e8f0', fontWeight: 700, fontSize: '0.82rem' }}>{a.nombre}</p>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '0.72rem' }}>{a.telefono}</p>
                        </div>
                        <span style={{ padding: '3px 8px', borderRadius: 20, background: badge.bg, color: badge.color, fontSize: '0.63rem', fontWeight: 700 }}>
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {acertantes.length > 0 && !ganadorInfo && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => procesarGanador('random')} disabled={procesandoGanador} style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', fontSize: '0.82rem', fontWeight: 700,
                }}>🎲 Aleatorio</button>
                <button onClick={() => procesarGanador('manual')} disabled={procesandoGanador || !ganadorManualId} style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                  cursor: ganadorManualId ? 'pointer' : 'not-allowed',
                  background: ganadorManualId ? 'linear-gradient(135deg, #b45309, #92400e)' : 'rgba(255,255,255,0.05)',
                  color: ganadorManualId ? '#fff' : '#475569', fontSize: '0.82rem', fontWeight: 700,
                }}>👆 Seleccionado</button>
              </div>
            )}
          </div>

          {ganadorInfo && (
            <div style={{
              borderRadius: 14, padding: '20px', textAlign: 'center',
              background: 'linear-gradient(145deg, rgba(168,85,247,0.15), rgba(126,34,206,0.1))',
              border: '1.5px solid rgba(168,85,247,0.4)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>¡Ganador!</p>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>{ganadorInfo.nombre}</h3>
              <p style={{ color: '#c084fc', fontSize: '0.9rem', fontWeight: 600 }}>📱 {ganadorInfo.telefono}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
