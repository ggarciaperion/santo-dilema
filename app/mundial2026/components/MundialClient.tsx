'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import type { MatchWithTeams, Phase, ApiFixturesResponse } from '@/lib/mundial2026/types'
import MatchCard from './MatchCard'

interface Props {
  initialData: ApiFixturesResponse
}

const POLL_INTERVAL = 45_000  // 45s

/** True if any match is live or started less than 3h ago (still in match window) */
function hasActiveMatch(fixtures: MatchWithTeams[]): boolean {
  const now = Date.now()
  return fixtures.some(f => {
    if (f.status === 'live') return true
    if (f.status === 'finished' || f.status === 'postponed') return false
    const elapsed = now - new Date(f.date).getTime()
    return elapsed >= 0 && elapsed < 3 * 60 * 60 * 1000
  })
}

type PhaseTab = Phase | 'all'

const PHASE_TABS: { key: PhaseTab; label: string; short: string }[] = [
  { key: 'all',          label: 'Todos',            short: 'Todos'   },
  { key: 'groups',       label: 'Fase de Grupos',   short: 'Grupos'  },
  { key: 'round32',      label: 'Ronda de 32',      short: 'R32'     },
  { key: 'round16',      label: 'Octavos de Final', short: 'R16'     },
  { key: 'quarterfinal', label: 'Cuartos de Final', short: 'QF'      },
  { key: 'semifinal',    label: 'Semifinales',      short: 'SF'      },
  { key: 'thirdplace',   label: '3er Puesto',       short: '3°'      },
  { key: 'final',        label: 'Final',            short: 'Final'   },
]

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

function limaDateHeader(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('es-PE', {
      timeZone: 'America/Lima',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return isoDate
  }
}

function limaDateKey(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
  } catch {
    return isoDate.slice(0, 10)
  }
}

function groupMatchesByDate(matches: MatchWithTeams[]): { date: string; label: string; matches: MatchWithTeams[] }[] {
  const map = new Map<string, MatchWithTeams[]>()
  for (const m of matches) {
    const key = limaDateKey(m.date)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, matches]) => ({
      date,
      label: limaDateHeader(matches[0].date),
      matches: matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    }))
}

const LIVE_COLORS   = { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.4)', text: '#ef4444' }
const FINISH_COLORS = { bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)', text: '#64748b' }

export default function MundialClient({ initialData }: Props) {
  const [activePhase, setActivePhase]  = useState<PhaseTab>('groups')
  const [activeGroup, setActiveGroup]  = useState<string>('all')
  const [fixtures, setFixtures]        = useState<MatchWithTeams[]>(initialData.fixtures)
  const [source, setSource]            = useState(initialData.source)
  const [cachedAt, setCachedAt]        = useState(initialData.cachedAt)

  // Live polling — re-fetches every 45s when a match window is open
  const fixturesRef = useRef(fixtures)
  useEffect(() => { fixturesRef.current = fixtures }, [fixtures])

  useEffect(() => {
    const tick = async () => {
      if (!hasActiveMatch(fixturesRef.current)) return
      try {
        const res = await fetch('/api/mundial/fixtures', { cache: 'no-store' })
        if (!res.ok) return
        const data: ApiFixturesResponse = await res.json()
        setFixtures(data.fixtures)
        setSource(data.source)
        setCachedAt(data.cachedAt)
        fixturesRef.current = data.fixtures
      } catch { /* silent */ }
    }
    const id = setInterval(tick, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Live matches — always show at top regardless of filter
  const liveMatches = useMemo(
    () => fixtures.filter(m => m.status === 'live'),
    [fixtures]
  )

  // Filtered matches
  const filtered = useMemo(() => {
    let f = fixtures
    if (activePhase !== 'all') f = f.filter(m => m.phase === activePhase)
    if (activePhase === 'groups' && activeGroup !== 'all') {
      f = f.filter(m => m.group === activeGroup)
    }
    return f
  }, [fixtures, activePhase, activeGroup])

  const grouped = useMemo(() => groupMatchesByDate(filtered), [filtered])

  const noApiKey  = source === 'fallback' && fixtures.length === 0
  const hasLive   = liveMatches.length > 0

  return (
    <div style={{ minHeight: '100vh', background: '#05070F', color: '#f1f5f9' }}>

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes pulse-live {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .match-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 14px;
        }
        @media (max-width: 600px) {
          .match-grid { grid-template-columns: 1fr; }
        }
        .phase-tab {
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid transparent;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.15s ease;
          white-space: nowrap;
          background: transparent;
          color: #64748b;
        }
        .phase-tab:hover { color: #f1f5f9; background: rgba(255,255,255,0.06); }
        .phase-tab.active {
          background: rgba(250,204,21,0.12);
          border-color: rgba(250,204,21,0.35);
          color: #facc15;
        }
        .group-chip {
          cursor: pointer;
          padding: 5px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 12px;
          font-weight: 700;
          transition: all 0.12s ease;
          background: transparent;
          color: #64748b;
        }
        .group-chip:hover { color: #f1f5f9; border-color: rgba(255,255,255,0.2); }
        .group-chip.active {
          background: rgba(34,197,94,0.15);
          border-color: rgba(34,197,94,0.4);
          color: #22c55e;
        }
      `}</style>

      {/* ── HERO ── */}
      <div style={{
        background: 'linear-gradient(180deg, #080D1A 0%, #05070F 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '40px 24px 32px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#facc15', background: 'rgba(250,204,21,0.1)',
              border: '1px solid rgba(250,204,21,0.25)', padding: '4px 10px', borderRadius: '6px',
            }}>
              FIFA World Cup 2026
            </span>
            {hasLive && (
              <span style={{
                fontSize: '11px', fontWeight: 700, color: '#ef4444',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', animation: 'pulse-live 1.4s infinite', display: 'inline-block' }} />
                {liveMatches.length} partido{liveMatches.length !== 1 ? 's' : ''} en vivo
              </span>
            )}
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 900, lineHeight: 1.1,
            background: 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', margin: 0,
          }}>
            Análisis Estadístico
          </h1>
          <h2 style={{
            fontSize: 'clamp(14px, 3vw, 20px)', fontWeight: 400,
            color: '#475569', marginTop: '6px', marginBottom: '0',
          }}>
            Predicciones ELO · Poisson · Bayesiano — Horarios en Lima, Perú
          </h2>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>
            {[
              { n: '48', label: 'Selecciones' },
              { n: '104', label: 'Partidos' },
              { n: '16', label: 'Sedes' },
              { n: '3', label: 'Países anfitriones' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#facc15', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── LIVE SECTION (always visible if live) ── */}
      {hasLive && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 0' }}>
          <div style={{
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '12px', padding: '16px 20px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', letterSpacing: '0.08em', marginBottom: '12px', textTransform: 'uppercase' }}>
              ● En vivo ahora
            </div>
            <div className="match-grid">
              {liveMatches.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        </div>
      )}

      {/* ── FILTERS ── */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 0',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'linear-gradient(180deg, #05070F 85%, transparent 100%)',
        paddingBottom: '8px',
      }}>
        {/* Phase tabs */}
        <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
          <div style={{ display: 'flex', gap: '6px', minWidth: 'max-content' }}>
            {PHASE_TABS.map(t => (
              <button
                key={t.key}
                className={`phase-tab${activePhase === t.key ? ' active' : ''}`}
                onClick={() => { setActivePhase(t.key); setActiveGroup('all') }}
              >
                <span className="show-short" style={{ display: 'none' }}>{t.short}</span>
                <span className="show-long">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Group chips — only for group phase */}
        {(activePhase === 'groups' || activePhase === 'all') && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button
              className={`group-chip${activeGroup === 'all' ? ' active' : ''}`}
              onClick={() => setActiveGroup('all')}
            >
              Todos
            </button>
            {GROUPS.map(g => (
              <button
                key={g}
                className={`group-chip${activeGroup === g ? ' active' : ''}`}
                onClick={() => { setActivePhase('groups'); setActiveGroup(g) }}
              >
                Grupo {g}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px 60px' }}>

        {/* No API key configured */}
        {noApiKey && (
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            background: 'rgba(250,204,21,0.04)', border: '1px solid rgba(250,204,21,0.15)',
            borderRadius: '16px', animation: 'fadeIn 0.4s ease',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' }}>
              Configura tu API Key para ver los partidos
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '440px', margin: '0 auto 24px' }}>
              Los fixtures del Mundial 2026 se obtienen en tiempo real desde API-Football.
              Agrega tu clave en las variables de entorno de Vercel para activar la plataforma.
            </p>
            <div style={{
              background: '#0D1627', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', padding: '16px 20px', textAlign: 'left',
              maxWidth: '420px', margin: '0 auto', fontFamily: 'monospace',
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                Vercel → Settings → Environment Variables
              </div>
              <div style={{ fontSize: '13px', color: '#22c55e' }}>
                FOOTBALL_API_KEY=<span style={{ color: '#facc15' }}>tu_key_aquí</span>
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px' }}>
                Obtén una gratis en api-football.com (100 req/día)
              </div>
            </div>
          </div>
        )}

        {/* Has data but empty filter result */}
        {!noApiKey && grouped.length === 0 && fixtures.length > 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#475569' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
            <p>No hay partidos para este filtro todavía.</p>
          </div>
        )}

        {/* Fixture groups by date */}
        {grouped.map(({ date, label, matches }) => (
          <div key={date} style={{ marginBottom: '36px', animation: 'fadeIn 0.3s ease' }}>
            {/* Date header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px',
            }}>
              <div style={{
                height: '1px', flex: 1,
                background: 'linear-gradient(90deg, rgba(250,204,21,0.3), transparent)',
              }} />
              <span style={{
                fontSize: '12px', fontWeight: 700, color: '#facc15',
                textTransform: 'capitalize', letterSpacing: '0.04em',
                background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)',
                padding: '4px 12px', borderRadius: '20px',
              }}>
                {label}
              </span>
              <div style={{
                height: '1px', flex: 1,
                background: 'linear-gradient(90deg, transparent, rgba(250,204,21,0.3))',
              }} />
            </div>

            {/* Matches grid */}
            <div className="match-grid">
              {matches.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        ))}

        {/* Cache info footer */}
        {cachedAt && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <span style={{ fontSize: '11px', color: '#1e293b' }}>
              Datos actualizados: {new Date(cachedAt).toLocaleString('es-PE', {
                timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit',
                day: 'numeric', month: 'short',
              })} Lima · Fuente: API-Football
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
