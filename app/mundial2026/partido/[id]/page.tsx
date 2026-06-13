import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFixtures } from '@/lib/mundial2026/api'
import { generateAdvancedPrediction } from '@/lib/mundial2026/predictions'
import type { AdvancedPrediction, MatchEvent, MatchWithTeams, RiskFactor } from '@/lib/mundial2026/types'
import RadarChart from '../../components/RadarChart'
import ScoreMatrix from '../../components/ScoreMatrix'
import LiveMatchUpdater from '../../components/LiveMatchUpdater'

export const dynamic = 'force-dynamic'

function limaDateTime(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
  } catch { return isoDate }
}

function pct(n: number) { return `${Math.round(n * 100)}%` }
function fmt2(n: number) { return n.toFixed(2) }

const CONF_COLORS: Record<string, string> = {
  'very-high': '#22c55e',
  'high':      '#86efac',
  'medium':    '#facc15',
  'low':       '#f87171',
}
const CONF_LABELS: Record<string, string> = {
  'very-high': 'MUY ALTA',
  'high':      'ALTA',
  'medium':    'MEDIA',
  'low':       'BAJA',
}
const RISK_ICONS: Record<RiskFactor['type'], string> = {
  altitude: '⛰️', form: '📈', h2h: '⚔️',
  market: '💹', fatigue: '😴', host: '🏟️', pressure: '🧠',
}

const EVENT_ICON: Record<MatchEvent['type'], string> = {
  goal: '⚽', own_goal: '⚽', penalty: '⚽', yellow: '🟨', red: '🟥',
}
const EVENT_LABEL: Record<MatchEvent['type'], string> = {
  goal: 'Gol', own_goal: 'Gol en propia', penalty: 'Penalti', yellow: 'Amarilla', red: 'Roja',
}

function ModelRow({ label, h, d, a }: { label: string; h: number; d: number; a: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="model-label">{label}</div>
      <div style={{ flex: 1, display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', gap: '1px', minWidth: 0 }}>
        <div style={{ flex: h * 100, background: '#22c55e', borderRadius: '4px 0 0 4px' }} />
        <div style={{ flex: d * 100, background: '#475569' }} />
        <div style={{ flex: a * 100, background: '#3b82f6', borderRadius: '0 4px 4px 0' }} />
      </div>
      <div className="model-values">
        <span style={{ color: '#22c55e' }}>{pct(h)}</span>
        <span style={{ color: '#64748b' }}>{pct(d)}</span>
        <span style={{ color: '#3b82f6' }}>{pct(a)}</span>
      </div>
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0D1627 0%, #0A1220 100%)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px',
      padding: '20px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: '#facc15',
      marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, rgba(250,204,21,0.4), transparent)' }} />
      {children}
      <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, rgba(250,204,21,0.4))' }} />
    </div>
  )
}

function EventTimeline({ events, homeShort, awayShort }: { events: MatchEvent[]; homeShort: string; awayShort: string }) {
  if (!events || events.length === 0) return null
  // Sort by minute (parse number from "77'" etc.)
  const sorted = [...events].sort((a, b) => {
    const ma = parseInt(a.minute) || 0
    const mb = parseInt(b.minute) || 0
    return ma - mb
  })
  return (
    <div style={{ marginBottom: '16px' }}>
      <Card style={{ padding: '16px 20px' }}>
        <SectionTitle>Eventos del partido</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sorted.map((ev, i) => {
            const isHome   = ev.side === 'home'
            const isGoal   = ev.type === 'goal' || ev.type === 'own_goal' || ev.type === 'penalty'
            const isRed    = ev.type === 'red'
            const accentColor = isGoal ? (isHome ? '#22c55e' : '#3b82f6') : isRed ? '#ef4444' : '#facc15'
            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: `${accentColor}08`,
                border: `1px solid ${accentColor}22`,
                borderRadius: '8px',
                // goals and reds get slightly more emphasis
                ...(isGoal || isRed ? { borderColor: `${accentColor}40` } : {}),
              }}>
                {/* Minute */}
                <div style={{
                  width: '36px', textAlign: 'right', flexShrink: 0,
                  fontSize: '12px', fontWeight: 700,
                  color: accentColor,
                }}>
                  {ev.minute}
                </div>

                {/* Icon */}
                <div style={{ fontSize: '14px', flexShrink: 0 }}>{EVENT_ICON[ev.type]}</div>

                {/* Player + event label — laid out home ← center → away */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  {isHome ? (
                    <>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.playerName}
                      </span>
                      <span style={{ fontSize: '10px', color: '#475569', flexShrink: 0 }}>{EVENT_LABEL[ev.type]}</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '10px', color: '#475569', flexShrink: 0 }}>{EVENT_LABEL[ev.type]}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.playerName}
                      </span>
                    </>
                  )}
                </div>

                {/* Side badge */}
                <div style={{
                  flexShrink: 0, fontSize: '10px', fontWeight: 700,
                  color: isHome ? '#22c55e' : '#3b82f6',
                  background: isHome ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
                  padding: '2px 7px', borderRadius: '4px',
                }}>
                  {isHome ? homeShort : awayShort}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

export default async function PartidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { fixtures } = await getFixtures()
  const match: MatchWithTeams | undefined = fixtures.find(m => m.id === id)

  if (!match) notFound()

  // Show analysis for scheduled AND live matches
  const showAnalysis = match.status === 'scheduled' || match.status === 'live'
  const pred: AdvancedPrediction | null = showAnalysis
    ? generateAdvancedPrediction(match.home, match.away, match.id, true, match.venue)
    : null

  const { home, away, venue } = match

  const phaseLabel =
    match.phase === 'groups'       ? `Grupo ${match.group} — Fecha ${match.matchday}` :
    match.phase === 'round32'      ? 'Ronda de 32' :
    match.phase === 'round16'      ? 'Octavos de Final' :
    match.phase === 'quarterfinal' ? 'Cuartos de Final' :
    match.phase === 'semifinal'    ? 'Semifinal' :
    match.phase === 'thirdplace'   ? 'Tercer Puesto' : 'Gran Final'

  const isLive     = match.status === 'live'
  const isFinished = match.status === 'finished'

  return (
    <div style={{ minHeight: '100vh', background: '#05070F', color: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      <style>{`
        @keyframes pulse-live { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease both; }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
          gap: 16px;
        }
        .odds-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .venue-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 12px;
        }
        .model-label {
          width: 110px; font-size: 12px; color: #64748b; font-weight: 600; flex-shrink: 0;
        }
        .model-values {
          display: flex; gap: 8px; font-size: 11px; font-weight: 700;
          min-width: 120px; justify-content: flex-end; flex-shrink: 0;
        }
        .mc-ci { display: flex; gap: 12px; flex-wrap: wrap; }
        .hero-flag { font-size: 64px; line-height: 1; }
        .hero-name { font-size: 22px; font-weight: 900; color: #f1f5f9; text-align: center; }
        .hero-center { text-align: center; min-width: 150px; }
        .hero-score { font-size: 42px; font-weight: 900; color: #f8fafc; letter-spacing: -1px; font-variant-numeric: tabular-nums; }
        .hero-time  { font-size: 28px; font-weight: 900; color: #facc15; letter-spacing: -0.5px; }
        .content-pad { padding: 24px 20px 60px; }

        @media (max-width: 720px) {
          .cards-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .odds-grid-3 { grid-template-columns: 1fr; gap: 8px; }
          .mc-ci { flex-direction: column; gap: 4px; }
          .venue-grid { grid-template-columns: 1fr; gap: 6px; }
          .hero-flag { font-size: 44px; }
          .hero-name { font-size: 17px; }
          .hero-center { min-width: 120px; }
          .hero-score { font-size: 32px; }
          .hero-time  { font-size: 22px; }
          .content-pad { padding: 16px 14px 60px; }
          .model-label { width: 78px; font-size: 11px; }
          .model-values { min-width: 96px; font-size: 10px; gap: 4px; }
        }
        @media (max-width: 400px) {
          .hero-flag { font-size: 36px; }
          .hero-name { font-size: 15px; }
          .model-label { width: 68px; font-size: 10px; }
          .model-values { min-width: 84px; font-size: 10px; gap: 3px; }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div style={{
        background: isLive
          ? 'linear-gradient(180deg, #1a0707 0%, #05070F 100%)'
          : 'linear-gradient(180deg, #070C1A 0%, #05070F 100%)',
        borderBottom: `1px solid ${isLive ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
        padding: '28px 16px 24px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <Link href="/mundial2026" style={{ fontSize: '12px', color: '#475569', textDecoration: 'none' }}>
              ← Mundial 2026
            </Link>
            <span style={{ color: '#1e293b' }}>·</span>
            <span style={{ fontSize: '12px', color: '#64748b', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px' }}>
              {phaseLabel}
            </span>
            {isLive && (
              <span style={{
                fontSize: '11px', fontWeight: 700, color: '#ef4444',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                padding: '2px 10px', borderRadius: '4px',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'pulse-live 1.4s infinite', display: 'inline-block' }} />
                EN VIVO
              </span>
            )}
          </div>

          {/* Teams */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>

            {/* Home */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', flex: 1 }}>
              <span className="hero-flag">{home.flag}</span>
              <div className="hero-name">{home.shortName}</div>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>ELO {home.eloRating}</div>
              <div style={{ fontSize: '10px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{home.confederation}</div>
            </div>

            {/* Center */}
            <div className="hero-center">
              {isLive || isFinished ? (
                <div>
                  <div className="hero-score">
                    {match.homeScore ?? 0}
                    <span style={{ color: '#1e293b', margin: '0 6px' }}>:</span>
                    {match.awayScore ?? 0}
                  </div>
                  {isLive && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse-live 1.4s infinite', display: 'inline-block' }} />
                      <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: 700 }}>
                        {match.minute ? `${match.minute}′` : 'EN VIVO'}
                      </span>
                    </div>
                  )}
                  {isFinished && (
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>Partido finalizado</div>
                  )}
                  {/* Quick probs even for live/finished */}
                  {pred && (
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '10px' }}>
                      <div style={{ padding: '3px 7px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '5px', fontSize: '10px', fontWeight: 700, color: '#22c55e' }}>
                        {pct(pred.homeWinProb)}
                      </div>
                      <div style={{ padding: '3px 7px', background: 'rgba(100,116,139,0.12)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: '5px', fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>
                        {pct(pred.drawProb)}
                      </div>
                      <div style={{ padding: '3px 7px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '5px', fontSize: '10px', fontWeight: 700, color: '#3b82f6' }}>
                        {pct(pred.awayWinProb)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>🕐 Lima</div>
                  <div className="hero-time">
                    {new Date(match.date).toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', textTransform: 'capitalize' }}>
                    {limaDateTime(match.date).split(',').slice(0, 2).join(',')}
                  </div>
                  {pred && (
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '10px' }}>
                      <div style={{ padding: '4px 7px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#22c55e' }}>
                        {pct(pred.homeWinProb)}
                      </div>
                      <div style={{ padding: '4px 7px', background: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.25)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
                        {pct(pred.drawProb)}
                      </div>
                      <div style={{ padding: '4px 7px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#3b82f6' }}>
                        {pct(pred.awayWinProb)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Away */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', flex: 1 }}>
              <span className="hero-flag">{away.flag}</span>
              <div className="hero-name">{away.shortName}</div>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>ELO {away.eloRating}</div>
              <div style={{ fontSize: '10px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{away.confederation}</div>
            </div>
          </div>

          {/* Venue */}
          <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '12px', color: '#475569' }}>
            📍 {venue.name} · {venue.city}
            {venue.altitude > 1000 && (
              <span style={{ marginLeft: '8px', color: '#f97316', fontWeight: 600 }}>⛰️ {venue.altitude}m</span>
            )}
          </div>

          {/* Confidence badge */}
          {pred && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
              <div style={{
                padding: '6px 14px',
                background: `${CONF_COLORS[pred.confidence.level]}18`,
                border: `1px solid ${CONF_COLORS[pred.confidence.level]}40`,
                borderRadius: '8px',
                fontSize: '11px', fontWeight: 700, color: CONF_COLORS[pred.confidence.level],
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span>CONFIANZA {CONF_LABELS[pred.confidence.level]}</span>
                <span style={{ opacity: 0.7, fontWeight: 400 }}>{pred.confidence.score}/100</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────── */}
      {pred ? (
        <div className="content-pad" style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* ── Live source notice ── */}
          {isLive && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 14px', marginBottom: '14px',
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: '8px', fontSize: '11px', color: '#94a3b8',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'pulse-live 1.4s infinite', display: 'inline-block', flexShrink: 0 }} />
              Resultado en tiempo real vía ESPN · Análisis pre-partido (modelo calculado antes del inicio)
            </div>
          )}

          {/* ── Events timeline (live / finished) ── */}
          {(isLive || isFinished) && match.events && match.events.length > 0 && (
            <EventTimeline events={match.events} homeShort={home.shortName} awayShort={away.shortName} />
          )}

          {/* ── Insight narrative ── */}
          <div className="fade-up" style={{
            background: 'rgba(250,204,21,0.04)',
            border: '1px solid rgba(250,204,21,0.15)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#cbd5e1',
            lineHeight: 1.6,
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#facc15', letterSpacing: '0.1em', marginBottom: '8px' }}>
              ◆ ANÁLISIS ESTADÍSTICO
            </div>
            {pred.insight}
          </div>

          {/* ── Cards grid ── */}
          <div className="cards-grid">

            {/* RADAR CHART */}
            <Card>
              <SectionTitle>Comparativa de selecciones</SectionTitle>
              <RadarChart
                home={pred.homeRadar}  homeLabel={home.shortName}  homeColor="#22c55e"
                away={pred.awayRadar}  awayLabel={away.shortName}  awayColor="#3b82f6"
              />
            </Card>

            {/* MODEL COMPARISON */}
            <Card>
              <SectionTitle>Comparativa de modelos</SectionTitle>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginBottom: '4px', paddingLeft: '118px' }}>
                <span style={{ color: '#22c55e', fontWeight: 700 }}>{home.shortName}</span>
                <span>Empate</span>
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>{away.shortName}</span>
              </div>

              <ModelRow label="Ensemble"    h={pred.homeWinProb}               d={pred.drawProb}               a={pred.awayWinProb}               color="#facc15" />
              <ModelRow label="Dixon-Coles" h={pred.models.dixonColes.homeWin} d={pred.models.dixonColes.draw} a={pred.models.dixonColes.awayWin} color="#22c55e" />
              <ModelRow label="Monte Carlo" h={pred.models.monteCarlo.homeWin} d={pred.models.monteCarlo.draw} a={pred.models.monteCarlo.awayWin} color="#a78bfa" />
              <ModelRow label="Bayesiano"   h={pred.models.bayesian.homeWin}   d={pred.models.bayesian.draw}   a={pred.models.bayesian.awayWin}   color="#38bdf8" />
              <ModelRow label="ELO"         h={pred.models.elo.homeWin}        d={pred.models.elo.draw}        a={pred.models.elo.awayWin}        color="#fb923c" />

              {/* xG */}
              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#22c55e' }}>{fmt2(pred.models.dixonColes.expectedGoalsH)}</div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>xG {home.shortName}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#1e293b', fontWeight: 800 }}>VS</div>
                <div style={{ flex: 1, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#3b82f6' }}>{fmt2(pred.models.dixonColes.expectedGoalsA)}</div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>xG {away.shortName}</div>
                </div>
              </div>

              {/* MC CI */}
              <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '11px', color: '#64748b' }}>
                <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>IC 95% — Monte Carlo (n=50,000)</div>
                <div className="mc-ci">
                  <span style={{ color: '#22c55e' }}>{home.shortName}: {pct(pred.models.monteCarlo.homeWinCI[0])}–{pct(pred.models.monteCarlo.homeWinCI[1])}</span>
                  <span>Empate: {pct(pred.models.monteCarlo.drawCI[0])}–{pct(pred.models.monteCarlo.drawCI[1])}</span>
                  <span style={{ color: '#3b82f6' }}>{away.shortName}: {pct(pred.models.monteCarlo.awayWinCI[0])}–{pct(pred.models.monteCarlo.awayWinCI[1])}</span>
                </div>
              </div>
            </Card>

            {/* SCORE MATRIX */}
            <Card>
              <SectionTitle>Mapa de probabilidad de marcadores</SectionTitle>
              <ScoreMatrix scores={pred.topScores} homeLabel={home.shortName} awayLabel={away.shortName} />
            </Card>

            {/* CONFIDENCE & RISK */}
            <Card>
              <SectionTitle>Factores de confianza y riesgo</SectionTitle>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>Índice de certeza</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: CONF_COLORS[pred.confidence.level] }}>
                    {pred.confidence.score}<span style={{ fontSize: '12px', fontWeight: 400, color: '#475569' }}>/100</span>
                  </span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pred.confidence.score}%`,
                    background: `linear-gradient(90deg, ${CONF_COLORS[pred.confidence.level]}, ${CONF_COLORS[pred.confidence.level]}88)`,
                    borderRadius: '4px',
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pred.confidence.factors.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                    padding: '10px 12px',
                    background: f.impact === 'positive' ? 'rgba(34,197,94,0.06)' : f.impact === 'negative' ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${f.impact === 'positive' ? 'rgba(34,197,94,0.15)' : f.impact === 'negative' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: '8px',
                  }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{RISK_ICONS[f.type]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500, lineHeight: 1.4 }}>{f.description}</div>
                    </div>
                    <div style={{
                      fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                      padding: '2px 6px', borderRadius: '4px', flexShrink: 0,
                      color: f.impact === 'positive' ? '#22c55e' : f.impact === 'negative' ? '#ef4444' : '#64748b',
                      background: f.impact === 'positive' ? 'rgba(34,197,94,0.12)' : f.impact === 'negative' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)',
                    }}>
                      {f.impact === 'positive' ? '+' : f.impact === 'negative' ? '−' : '~'}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>Condiciones de sede</div>
                <div className="venue-grid">
                  <div><span style={{ color: '#475569' }}>Estadio: </span><span style={{ color: '#e2e8f0', fontWeight: 600 }}>{venue.name}</span></div>
                  <div><span style={{ color: '#475569' }}>Ciudad: </span><span style={{ color: '#e2e8f0', fontWeight: 600 }}>{venue.city}</span></div>
                  <div><span style={{ color: '#475569' }}>País: </span><span style={{ color: '#e2e8f0', fontWeight: 600 }}>{venue.country}</span></div>
                  <div>
                    <span style={{ color: '#475569' }}>Altitud: </span>
                    <span style={{ color: venue.altitude > 1500 ? '#f97316' : '#22c55e', fontWeight: 700 }}>
                      {venue.altitude}m {venue.altitude > 1500 ? '⚠️' : '✓'}
                    </span>
                  </div>
                  <div><span style={{ color: '#475569' }}>Aforo: </span><span style={{ color: '#e2e8f0', fontWeight: 600 }}>{venue.capacity.toLocaleString()}</span></div>
                </div>
              </div>
            </Card>

          </div>

          {/* ── MARKET INTELLIGENCE ── */}
          {pred.valueAnalysis.hasOdds && (
            <div style={{ marginTop: '16px' }}>
              <Card>
                <SectionTitle>Inteligencia de mercado</SectionTitle>
                <div className="odds-grid-3">
                  {[
                    { label: home.shortName, odds: pred.valueAnalysis.bestHomeOdds, ev: pred.valueAnalysis.homeEV, value: pred.valueAnalysis.valueHome, fair: pred.valueAnalysis.fairHomeProb, model: pred.homeWinProb, color: '#22c55e' },
                    { label: 'Empate',       odds: pred.valueAnalysis.bestDrawOdds, ev: pred.valueAnalysis.drawEV, value: pred.valueAnalysis.valueDraw, fair: pred.valueAnalysis.fairDrawProb, model: pred.drawProb,    color: '#94a3b8' },
                    { label: away.shortName, odds: pred.valueAnalysis.bestAwayOdds, ev: pred.valueAnalysis.awayEV, value: pred.valueAnalysis.valueAway, fair: pred.valueAnalysis.fairAwayProb, model: pred.awayWinProb, color: '#3b82f6' },
                  ].map(o => (
                    <div key={o.label} style={{
                      padding: '14px',
                      background: o.value ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${o.value ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '10px', textAlign: 'center',
                    }}>
                      {o.value && <div style={{ fontSize: '9px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.08em', marginBottom: '6px' }}>✦ VALOR DETECTADO</div>}
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{o.label}</div>
                      <div style={{ fontSize: '26px', fontWeight: 800, color: o.color }}>{o.odds?.toFixed(2) ?? '—'}</div>
                      <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px' }}>mejor cuota</div>
                      <div style={{ marginTop: '8px', padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                          <span>Prob. mercado</span><span style={{ fontWeight: 600, color: '#94a3b8' }}>{o.fair ? pct(o.fair) : '—'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                          <span>Prob. modelo</span><span style={{ fontWeight: 600, color: o.color }}>{pct(o.model)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                          <span>EV esperado</span>
                          <span style={{ fontWeight: 700, color: (o.ev ?? 0) > 0 ? '#22c55e' : '#ef4444' }}>
                            {o.ev != null ? `${o.ev > 0 ? '+' : ''}${(o.ev * 100).toFixed(1)}%` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {pred.valueAnalysis.sharpSignal && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '12px', color: '#fca5a5' }}>
                    🔔 <strong>Sharp money detectado:</strong> Pinnacle mueve línea hacia {
                      pred.valueAnalysis.sharpSignal === 'home' ? home.shortName :
                      pred.valueAnalysis.sharpSignal === 'away' ? away.shortName : 'empate'
                    } — divergencia respecto a casas públicas.
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ── METHODOLOGY ── */}
          <div style={{ marginTop: '24px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', fontSize: '11px', color: '#334155', lineHeight: 1.6 }}>
            <strong style={{ color: '#475569' }}>Metodología:</strong> Ensemble ponderado (Dixon-Coles 40% + Monte Carlo 30% + Bayesiano 20% + ELO 10%).
            Dixon-Coles con corrección ρ={pred.models.dixonColes.rho} para marcadores bajos.
            Monte Carlo: {pred.models.monteCarlo.iterations.toLocaleString()} iteraciones, IC 95% via Wilson Score.
            {(isLive || isFinished) && ' Análisis calculado antes del inicio del partido.'}
            {' '}Scores en vivo: ESPN API (sin costo, actualización ~45s).
          </div>

        </div>
      ) : (
        /* Finished without pred (shouldn't happen now, but fallback) */
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px 60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏁</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>Partido finalizado</h2>
          <div style={{ fontSize: '48px', fontWeight: 900, color: '#facc15', marginBottom: '8px' }}>
            {match.homeScore ?? 0} — {match.awayScore ?? 0}
          </div>
          <p style={{ color: '#475569', fontSize: '14px' }}>{home.flag} {home.shortName} vs {away.flag} {away.shortName}</p>
          {match.events && match.events.length > 0 && (
            <div style={{ maxWidth: '500px', margin: '24px auto 0' }}>
              <EventTimeline events={match.events} homeShort={home.shortName} awayShort={away.shortName} />
            </div>
          )}
        </div>
      )}

      {/* Back */}
      <div style={{ textAlign: 'center', padding: '0 0 40px' }}>
        <Link href="/mundial2026" style={{
          display: 'inline-block', padding: '10px 24px',
          background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.25)',
          borderRadius: '8px', color: '#facc15', fontWeight: 700, fontSize: '13px', textDecoration: 'none',
        }}>
          ← Volver al calendario
        </Link>
      </div>

      {/* Live polling — refreshes this Server Component every 15s when match is live */}
      {isLive && (
        <LiveMatchUpdater
          matchId={match.id}
          initScore={`${match.homeScore ?? 0}:${match.awayScore ?? 0}:${match.minute ?? ''}`}
          isLive={isLive}
        />
      )}

    </div>
  )
}
