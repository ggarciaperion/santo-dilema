'use client';

import { useState, useEffect, useCallback } from 'react';

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
  fechaDesde: string;
  fechaHasta: string;
  mensajePromo: string;
  premio: string;
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
  ip: string;
}

interface Metricas {
  impresiones: number;
  participaciones: number;
  conversion: number;
  porDia: Record<string, number>;
}

const DEFAULT_CONFIG: Config = {
  active: false,
  concursoAbierto: false,
  matchId: '',
  matchLabel: '',
  equipoLocal: '',
  equipoVisitante: '',
  flagLocal: '',
  flagVisitante: '',
  fechaPartido: '',
  horaPartido: '',
  fechaDesde: '',
  fechaHasta: '',
  mensajePromo: '🏆 ¡Adivina el resultado y gana alitas gratis!',
  premio: 'Alitas gratis',
};

const ESTADO_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  participando: { bg: 'rgba(234,179,8,0.2)', color: '#fbbf24', label: 'Participando' },
  acerto: { bg: 'rgba(34,197,94,0.2)', color: '#4ade80', label: '✓ Acertó' },
  no_acerto: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: '✗ No acertó' },
  ganador: { bg: 'rgba(168,85,247,0.2)', color: '#c084fc', label: '🏆 GANADOR' },
};

export default function SorteoMundialAdmin() {
  const [tab, setTab] = useState<'config' | 'participantes' | 'ganadores'>('config');
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
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
      }
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

  const loadMetricas = useCallback(async () => {
    try {
      const res = await fetch('/api/sorteo-mundial/impresion');
      if (res.ok) setMetricas(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadConfig();
    loadMetricas();
  }, [loadConfig, loadMetricas]);

  useEffect(() => {
    if (tab === 'participantes') loadParticipantes();
  }, [tab, loadParticipantes]);

  const saveConfig = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/sorteo-mundial/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) setSaveMsg('✓ Configuración guardada');
      else setSaveMsg('✗ Error al guardar');
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
    try {
      const res = await fetch(`/api/sorteo-mundial/ganadores?matchId=${config.matchId}&resultado=${resultadoPartido}`);
      if (res.ok) {
        const data = await res.json();
        setAcertantes(data.acertantes || []);
      }
    } catch { /* silent */ }
  };

  const procesarGanador = async (modo: 'random' | 'manual') => {
    if (!resultadoPartido || !config.matchId) return;
    if (modo === 'manual' && !ganadorManualId) return;
    setProcesandoGanador(true);
    try {
      const res = await fetch('/api/sorteo-mundial/ganadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: config.matchId,
          resultadoPartido,
          modo,
          ganadorId: modo === 'manual' ? ganadorManualId : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGanadorInfo(data.ganador);
        setAcertantes(prev => prev.map(p => ({ ...p, estado: p.id === data.ganador?.id ? 'ganador' : 'acerto' })));
      }
    } catch { /* silent */ }
    setProcesandoGanador(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8, boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', fontSize: '0.85rem', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4,
  };

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', margin: 0 }}>
          🏆 Sorteo Mundial 2026
        </h2>
        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0' }}>
          Configura el partido, administra participantes y selecciona ganadores
        </p>
      </div>

      {/* Métricas rápidas */}
      {metricas && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Impresiones', value: metricas.impresiones, color: '#60a5fa' },
            { label: 'Participaciones', value: metricas.participaciones, color: '#4ade80' },
            { label: 'Conversión', value: `${metricas.conversion}%`, color: '#fbbf24' },
          ].map(m => (
            <div key={m.label} style={{
              borderRadius: 10, padding: '12px', textAlign: 'center',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 0 }}>
        {(['config', 'participantes', 'ganadores'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
              background: tab === t ? 'rgba(34,197,94,0.15)' : 'transparent',
              borderBottom: tab === t ? '2px solid #22c55e' : '2px solid transparent',
              color: tab === t ? '#4ade80' : '#64748b',
              fontSize: '0.78rem', fontWeight: 700, textTransform: 'capitalize',
            }}
          >
            {t === 'config' ? '⚙️ Configuración' : t === 'participantes' ? '👥 Participantes' : '🏆 Ganadores'}
          </button>
        ))}
      </div>

      {/* ── TAB: CONFIG ── */}
      {tab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Toggles principales */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { key: 'active', label: 'Modal activo', desc: 'Muestra el modal en la web' },
              { key: 'concursoAbierto', label: 'Concurso abierto', desc: 'Acepta participaciones' },
            ].map(({ key, label, desc }) => (
              <div key={key} style={{
                borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 8,
                background: (config as any)[key] ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${(config as any)[key] ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}>
                <div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', margin: 0 }}>{label}</p>
                  <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '2px 0 0' }}>{desc}</p>
                </div>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, [key]: !(prev as any)[key] }))}
                  style={{
                    padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    background: (config as any)[key] ? '#16a34a' : 'rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: '0.72rem', fontWeight: 700, alignSelf: 'flex-start',
                  }}
                >
                  {(config as any)[key] ? '✓ Activado' : 'Desactivado'}
                </button>
              </div>
            ))}
          </div>

          {/* Partido */}
          <div style={{ borderRadius: 12, padding: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 14 }}>⚽ Datos del partido</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>ID del partido</label>
                <input style={inputStyle} value={config.matchId}
                  onChange={e => setConfig(p => ({ ...p, matchId: e.target.value }))}
                  placeholder="ej: g001" />
              </div>
              <div>
                <label style={labelStyle}>Etiqueta (para admin)</label>
                <input style={inputStyle} value={config.matchLabel}
                  onChange={e => setConfig(p => ({ ...p, matchLabel: e.target.value }))}
                  placeholder="ej: México vs Sudáfrica" />
              </div>
              <div>
                <label style={labelStyle}>Equipo local</label>
                <input style={inputStyle} value={config.equipoLocal}
                  onChange={e => setConfig(p => ({ ...p, equipoLocal: e.target.value }))}
                  placeholder="ej: México" />
              </div>
              <div>
                <label style={labelStyle}>Equipo visitante</label>
                <input style={inputStyle} value={config.equipoVisitante}
                  onChange={e => setConfig(p => ({ ...p, equipoVisitante: e.target.value }))}
                  placeholder="ej: Sudáfrica" />
              </div>
              <div>
                <label style={labelStyle}>Fecha del partido</label>
                <input style={inputStyle} type="date" value={config.fechaPartido}
                  onChange={e => setConfig(p => ({ ...p, fechaPartido: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Hora (Perú)</label>
                <input style={inputStyle} type="time" value={config.horaPartido}
                  onChange={e => setConfig(p => ({ ...p, horaPartido: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Fechas de vigencia */}
          <div style={{ borderRadius: 12, padding: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 14 }}>📅 Vigencia del modal</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Mostrar desde</label>
                <input style={inputStyle} type="date" value={config.fechaDesde}
                  onChange={e => setConfig(p => ({ ...p, fechaDesde: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Mostrar hasta</label>
                <input style={inputStyle} type="date" value={config.fechaHasta}
                  onChange={e => setConfig(p => ({ ...p, fechaHasta: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Mensaje y premio */}
          <div style={{ borderRadius: 12, padding: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
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

          {/* Guardar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={saveConfig}
              disabled={saving}
              style={{
                padding: '11px 28px', borderRadius: 10, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                background: saving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #16a34a, #15803d)',
                color: '#fff', fontSize: '0.88rem', fontWeight: 700,
                boxShadow: saving ? 'none' : '0 4px 16px rgba(22,163,74,0.35)',
              }}
            >
              {saving ? '⏳ Guardando...' : '💾 Guardar configuración'}
            </button>
            {saveMsg && (
              <span style={{ fontSize: '0.8rem', color: saveMsg.startsWith('✓') ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: PARTICIPANTES ── */}
      {tab === 'participantes' && (
        <div>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <input
              style={{ ...inputStyle, width: 160, flex: 'none' }}
              type="date"
              value={filtroFecha}
              onChange={e => setFiltroFecha(e.target.value)}
            />
            <input
              style={{ ...inputStyle, width: 160, flex: 'none' }}
              type="text"
              placeholder="Buscar teléfono..."
              value={filtroTel}
              onChange={e => setFiltroTel(e.target.value)}
            />
            <button
              onClick={loadParticipantes}
              style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(99,102,241,0.25)', color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 700 }}
            >
              🔍 Filtrar
            </button>
            <button
              onClick={exportCSV}
              style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontSize: '0.8rem', fontWeight: 700 }}
            >
              📥 Exportar CSV
            </button>
          </div>

          {loadingP ? (
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Cargando...</p>
          ) : participantes.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No hay participantes con los filtros actuales.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <p style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 10 }}>{participantes.length} registro(s)</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr>
                    {['Nombre', 'Teléfono', 'Partido', 'Predicción', 'Fecha', 'Estado'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#64748b', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {h}
                      </th>
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
                          <span style={{ padding: '3px 8px', borderRadius: 20, background: badge.bg, color: badge.color, fontSize: '0.65rem', fontWeight: 700 }}>
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
          <div style={{ borderRadius: 12, padding: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>
              Partido activo: <span style={{ color: '#4ade80' }}>{config.matchLabel || '(sin configurar)'}</span>
            </p>

            <label style={labelStyle}>Resultado del partido</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {(['local', 'empate', 'visitante'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setResultadoPartido(r)}
                  style={{
                    flex: 1, padding: '9px 8px', borderRadius: 8, cursor: 'pointer',
                    background: resultadoPartido === r ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)',
                    border: resultadoPartido === r ? '1.5px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
                    color: resultadoPartido === r ? '#4ade80' : '#94a3b8',
                    fontSize: '0.75rem', fontWeight: 700,
                  } as React.CSSProperties}
                >
                  {r === 'local' ? `Gana ${config.equipoLocal || 'Local'}` : r === 'visitante' ? `Gana ${config.equipoVisitante || 'Visitante'}` : 'Empate'}
                </button>
              ))}
            </div>

            <button
              onClick={cargarAcertantes}
              disabled={!resultadoPartido}
              style={{
                padding: '9px 18px', borderRadius: 8, border: 'none', cursor: resultadoPartido ? 'pointer' : 'not-allowed',
                background: resultadoPartido ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                color: resultadoPartido ? '#a5b4fc' : '#475569', fontSize: '0.8rem', fontWeight: 700, marginBottom: 16,
              }}
            >
              🔍 Ver acertantes ({resultadoPartido || '...'})
            </button>

            {/* Lista acertantes */}
            {acertantes.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 700, marginBottom: 8 }}>
                  {acertantes.length} acertante(s) encontrado(s)
                </p>
                <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {acertantes.map(a => {
                    const badge = ESTADO_BADGE[a.estado] || { bg: 'rgba(255,255,255,0.06)', color: '#94a3b8', label: a.estado };
                    return (
                      <div
                        key={a.id}
                        onClick={() => setGanadorManualId(a.id)}
                        style={{
                          padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                          background: ganadorManualId === a.id ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${ganadorManualId === a.id ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.06)'}`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, color: '#e2e8f0', fontWeight: 700, fontSize: '0.82rem' }}>{a.nombre}</p>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '0.72rem' }}>{a.telefono}</p>
                        </div>
                        <span style={{ padding: '3px 8px', borderRadius: 20, background: badge.bg, color: badge.color, fontSize: '0.65rem', fontWeight: 700 }}>
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Seleccionar ganador */}
            {acertantes.length > 0 && !ganadorInfo && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => procesarGanador('random')}
                  disabled={procesandoGanador}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', fontSize: '0.82rem', fontWeight: 700,
                  }}
                >
                  🎲 Ganador aleatorio
                </button>
                <button
                  onClick={() => procesarGanador('manual')}
                  disabled={procesandoGanador || !ganadorManualId}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                    cursor: ganadorManualId ? 'pointer' : 'not-allowed',
                    background: ganadorManualId ? 'linear-gradient(135deg, #b45309, #92400e)' : 'rgba(255,255,255,0.05)',
                    color: ganadorManualId ? '#fff' : '#475569', fontSize: '0.82rem', fontWeight: 700,
                  }}
                >
                  👆 Ganador seleccionado
                </button>
              </div>
            )}
          </div>

          {/* Ganador */}
          {ganadorInfo && (
            <div style={{
              borderRadius: 14, padding: '20px', textAlign: 'center',
              background: 'linear-gradient(145deg, rgba(168,85,247,0.15), rgba(126,34,206,0.1))',
              border: '1.5px solid rgba(168,85,247,0.4)',
              boxShadow: '0 0 40px rgba(168,85,247,0.2)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>¡Ganador!</p>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>{ganadorInfo.nombre}</h3>
              <p style={{ color: '#c084fc', fontSize: '0.9rem', fontWeight: 600 }}>📱 {ganadorInfo.telefono}</p>
              <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 4 }}>Predicción: {ganadorInfo.prediccionLabel}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
