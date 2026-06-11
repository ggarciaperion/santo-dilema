import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFixtures } from '@/lib/mundial2026/api'
import { generateAdvancedPrediction } from '@/lib/mundial2026/predictions'
import type { AdvancedPrediction, MatchWithTeams, RiskFactor } from '@/lib/mundial2026/types'
import RadarChart from '../../components/RadarChart'
import ScoreMatrix from '../../components/ScoreMatrix'

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
  altitude:  '⛰️',
  form:      '📈',
  h2h:       '⚔️',
  market:    '💹',
  fatigue:   '😴',
  host:      '🏟️',
  pressure:  '🧠',
}

function ModelRow({ label, h, d, a, color }: { label: string; h: number; d: number; a: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ width: '120px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1, display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', gap: '1px' }}>
        <div style={{ flex: h * 100, background: '#22c55e', borderRadius: '4px 0 0 4px' }} />
        <div style={{ flex: d * 100, background: '#475569' }} />
        <div style={{ flex: a * 100, background: '#3b82f6', borderRadius: '0 4px 4px 0' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontWeight: 700, minWidth: '130px', justifyContent: 'flex-end' }}>
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
      padding: '24px',
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

export default async function PartidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { fixtures } = await getFixtures()
  const match: MatchWithTeams | undefined = fixtures.find(m => m.id === id)

  if (!match) notFound()

  const isScheduled = match.status === 'scheduled'
  const pred: AdvancedPrediction | null = isScheduled
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

  return (
    <div style={{ minHeight: '100vh', background: '#05070F', color: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      <style>{`
        @keyframes pulse-live { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .hover-card:hover { border-color: rgba(250,204,21,0.25) !important; }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(180deg, #070C1A 0%, #05070F 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '32px 24px 28px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Link href="/mundial2026" style={{ fontSize: '12px', color: '#475569', textDecoration: 'none' }}>
              ← Mundial 2026
            </Link>
            <span style={{ color: '#1e293b' }}>·</span>
            <span style={{ fontSize: '12px', color: '#64748b', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px' }}>
              {phaseLabel}
            </span>
          </div>

          {/* Teams header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>

            {/* Home team */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1, minWidth: 120 }}>
              <span style={{ fontSize: '64px', lineHeight: 1 }}>{home.flag}</span>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#f1f5f9', textAlign: 'center' }}>{home.shortName}</div>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>ELO {home.eloRating}</div>
              <div style={{ fontSize: '10px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{home.confederation}</div>
            </div>

            {/* Center score/time + prediction summary */}
            <div style={{ textAlign: 'center', minWidth: '160px' }}>
              {match.status === 'finished' || match.status === 'live' ? (
                <div>
                  <div style={{ fontSize: '42px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>
                    {match.homeScore ?? 0} <span style={{ color: '#1e293b' }}>:</span> {match.awayScore ?? 0}
                  </div>
                  {match.status === 'live' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse-live 1.4s infinite', display: 'inline-block' }} />
                      <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700 }}>EN VIVO {match.minute}′</span>
                    </div>
                  )}
                  {match.status === 'finished' && (
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>Partido finalizado</div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>🕐 Lima, Perú</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#facc15', letterSpacing: '-0.5px' }}>
                    {new Date(match.date).toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', textTransform: 'capitalize' }}>
                    {limaDateTime(match.date).split(',').slice(0, 2).join(',')}
                  </div>
                  {/* Quick probability pills */}
                  {pred && (
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '12px' }}>
                      <div style={{ padding: '4px 8px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#22c55e' }}>
                        {pct(pred.homeWinProb)}
                      </div>
                      <div style={{ padding: '4px 8px', background: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.25)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
                        {pct(pred.drawProb)}
                      </div>
                      <div style={{ padding: '4px 8px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#3b82f6' }}>
                        {pct(pred.awayWinProb)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Away team */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1, minWidth: 120 }}>
              <span style={{ fontSize: '64px', lineHeight: 1 }}>{away.flag}</span>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#f1f5f9', textAlign: 'center' }}>{away.shortName}</div>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>ELO {away.eloRating}</div>
              <div style={{ fontSize: '10px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{away.confederation}</div>
            </div>
          </div>

          {/* Venue */}
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#475569' }}>
            📍 {venue.name} · {venue.city}
            {venue.altitude > 1000 && (
              <span style={{ marginLeft: '8px', color: '#f97316', fontWeight: 600 }}>⛰️ {venue.altitude}m</span>
            )}
          </div>

          {/* Confidence badge */}
          {pred && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
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
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 20px 60px' }}>

          {/* ── Insight narrative ── */}
          <div className="fade-up" style={{
            background: 'rgba(250,204,21,0.04)',
            border: '1px solid rgba(250,204,21,0.15)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#cbd5e1',
            lineHeight: 1.6,
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#facc15', letterSpacing: '0.1em', marginBottom: '8px' }}>
              ◆ ANÁLISIS INTELIGENTE
            </div>
            {pred.insight}
          </div>

          {/* ── 2-col grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '16px' }}>

            {/* RADAR CHART */}
            <Card>
              <SectionTitle>Comparativa de selecciones</SectionTitle>
              <RadarChart
                home={pred.homeRadar}      homeLabel={home.shortName}  homeColor="#22c55e"
                away={pred.awayRadar}      awayLabel={away.shortName}  awayColor="#3b82f6"
              />
            </Card>

            {/* MODEL COMPARISON */}
            <Card>
              <SectionTitle>Comparativa de modelos</SectionTitle>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginBottom: '4px', paddingLeft: '132px' }}>
                <span style={{ color: '#22c55e', fontWeight: 700 }}>{home.shortName}</span>
                <span>Empate</span>
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>{away.shortName}</span>
              </div>

              <ModelRow label="Ensemble" h={pred.homeWinProb} d={pred.drawProb} a={pred.awayWinProb} color="#facc15" />
              <ModelRow label="Dixon-Coles" h={pred.models.dixonColes.homeWin} d={pred.models.dixonColes.draw} a={pred.models.dixonColes.awayWin} color="#22c55e" />
              <ModelRow label="Monte Carlo" h={pred.models.monteCarlo.homeWin} d={pred.models.monteCarlo.draw} a={pred.models.monteCarlo.awayWin} color="#a78bfa" />
              <ModelRow label="Bayesiano" h={pred.models.bayesian.homeWin} d={pred.models.bayesian.draw} a={pred.models.bayesian.awayWin} color="#38bdf8" />
              <ModelRow label="ELO" h={pred.models.elo.homeWin} d={pred.models.elo.draw} a={pred.models.elo.awayWin} color="#fb923c" />

              {/* xG Expected */}
              <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#22c55e' }}>
                    {fmt2(pred.models.dixonColes.expectedGoalsH)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>xG {home.shortName}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '16px', color: '#1e293b', fontWeight: 800 }}>VS</div>
                <div style={{ flex: 1, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#3b82f6' }}>
                    {fmt2(pred.models.dixonColes.expectedGoalsA)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>xG {away.shortName}</div>
                </div>
              </div>

              {/* Monte Carlo CI */}
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '11px', color: '#64748b' }}>
                <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Intervalos de confianza 95% (Monte Carlo, n=50,000)</div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ color: '#22c55e' }}>
                    {home.shortName}: {pct(pred.models.monteCarlo.homeWinCI[0])}–{pct(pred.models.monteCarlo.homeWinCI[1])}
                  </span>
                  <span>
                    Empate: {pct(pred.models.monteCarlo.drawCI[0])}–{pct(pred.models.monteCarlo.drawCI[1])}
                  </span>
                  <span style={{ color: '#3b82f6' }}>
                    {away.shortName}: {pct(pred.models.monteCarlo.awayWinCI[0])}–{pct(pred.models.monteCarlo.awayWinCI[1])}
                  </span>
                </div>
              </div>
            </Card>

            {/* SCORE MATRIX */}
            <Card style={{ gridColumn: 'span 1' }}>
              <SectionTitle>Mapa de probabilidad de marcadores</SectionTitle>
              <ScoreMatrix
                scores={pred.topScores}
                homeLabel={home.shortName}
                awayLabel={away.shortName}
              />
            </Card>

            {/* CONFIDENCE & RISK FACTORS */}
            <Card>
              <SectionTitle>Factores de confianza y riesgo</SectionTitle>

              {/* Confidence meter */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>Índice de certeza</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: CONF_COLORS[pred.confidence.level] }}>
                    {pred.confidence.score}<span style={{ fontSize: '12px', fontWeight: 400, color: '#475569' }}>/100</span>
                  </span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pred.confidence.score}%`,
                    background: `linear-gradient(90deg, ${CONF_COLORS[pred.confidence.level]}, ${CONF_COLORS[pred.confidence.level]}88)`,
                    borderRadius: '4px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Risk factors */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pred.confidence.factors.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                    padding: '10px 12px',
                    background: f.impact === 'positive' ? 'rgba(34,197,94,0.06)' : f.impact === 'negative' ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${f.impact === 'positive' ? 'rgba(34,197,94,0.15)' : f.impact === 'negative' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: '8px',
                  }}>
                    <span style={{ fontSize: '16px' }}>{RISK_ICONS[f.type]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500, lineHeight: 1.4 }}>{f.description}</div>
                    </div>
                    <div style={{
                      fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px',
                      color: f.impact === 'positive' ? '#22c55e' : f.impact === 'negative' ? '#ef4444' : '#64748b',
                      background: f.impact === 'positive' ? 'rgba(34,197,94,0.12)' : f.impact === 'negative' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)',
                    }}>
                      {f.impact === 'positive' ? '+' : f.impact === 'negative' ? '−' : '~'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Venue details */}
              <div style={{ marginTop: '16px', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>Condiciones de sede</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div><span style={{ color: '#475569' }}>Estadio:</span> <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{venue.name}</span></div>
                  <div><span style={{ color: '#475569' }}>Ciudad:</span> <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{venue.city}</span></div>
                  <div><span style={{ color: '#475569' }}>País:</span> <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{venue.country}</span></div>
                  <div>
                    <span style={{ color: '#475569' }}>Altitud:</span>{' '}
                    <span style={{ color: venue.altitude > 1500 ? '#f97316' : '#22c55e', fontWeight: 700 }}>
                      {venue.altitude}m {venue.altitude > 1500 ? '⚠️' : '✓'}
                    </span>
                  </div>
                  <div><span style={{ color: '#475569' }}>Aforo:</span> <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{venue.capacity.toLocaleString()}</span></div>
                </div>
              </div>
            </Card>

          </div>

          {/* ── MARKET INTELLIGENCE (if odds available) ── */}
          {pred.valueAnalysis.hasOdds && (
            <div style={{ marginTop: '16px' }}>
              <Card>
                <SectionTitle>Inteligencia de mercado</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { label: home.shortName, odds: pred.valueAnalysis.bestHomeOdds, ev: pred.valueAnalysis.homeEV, value: pred.valueAnalysis.valueHome, fair: pred.valueAnalysis.fairHomeProb, model: pred.homeWinProb, color: '#22c55e' },
                    { label: 'Empate',       odds: pred.valueAnalysis.bestDrawOdds, ev: pred.valueAnalysis.drawEV, value: pred.valueAnalysis.valueDraw, fair: pred.valueAnalysis.fairDrawProb, model: pred.drawProb, color: '#94a3b8' },
                    { label: away.shortName, odds: pred.valueAnalysis.bestAwayOdds, ev: pred.valueAnalysis.awayEV, value: pred.valueAnalysis.valueAway, fair: pred.valueAnalysis.fairAwayProb, model: pred.awayWinProb, color: '#3b82f6' },
                  ].map(o => (
                    <div key={o.label} style={{
                      padding: '14px',
                      background: o.value ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${o.value ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '10px',
                      textAlign: 'center',
                    }}>
                      {o.value && (
                        <div style={{ fontSize: '9px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.08em', marginBottom: '6px' }}>
                          ✦ VALOR DETECTADO
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{o.label}</div>
                      <div style={{ fontSize: '26px', fontWeight: 800, color: o.color }}>{o.odds?.toFixed(2) ?? '—'}</div>
                      <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px' }}>mejor cuota</div>
                      <div style={{ marginTop: '8px', padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                          <span>Prob. mercado</span>
                          <span style={{ fontWeight: 600, color: '#94a3b8' }}>{o.fair ? pct(o.fair) : '—'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                          <span>Prob. modelo</span>
                          <span style={{ fontWeight: 600, color: o.color }}>{pct(o.model)}</span>
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
                  <div style={{
                    padding: '10px 14px',
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '8px',
                    fontSize: '12px', color: '#fca5a5',
                  }}>
                    🔔 <strong>Sharp money detectado:</strong> Pinnacle mueve línea hacia {
                      pred.valueAnalysis.sharpSignal === 'home' ? home.shortName :
                      pred.valueAnalysis.sharpSignal === 'away' ? away.shortName : 'empate'
                    } — divergencia respecto a casas públicas.
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ── METHODOLOGY footnote ── */}
          <div style={{ marginTop: '24px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', fontSize: '11px', color: '#334155', lineHeight: 1.6 }}>
            <strong style={{ color: '#475569' }}>Metodología:</strong> Ensemble ponderado (Dixon-Coles 40% + Monte Carlo 30% + Bayesiano 20% + ELO 10%).
            Dixon-Coles con corrección ρ={pred.models.dixonColes.rho} para marcadores bajos.
            Monte Carlo: {pred.models.monteCarlo.iterations.toLocaleString()} iteraciones, IC 95% via Wilson Score.
            Parámetros de ataque/defensa estimados de clasificatorias 2022–2026 con decaimiento temporal.
            Este análisis es estadístico y no constituye consejo financiero.
          </div>

        </div>
      ) : (
        /* Finished / live match */
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>{match.status === 'live' ? '⚽' : '🏁'}</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>
            {match.status === 'live' ? 'Partido en curso' : 'Partido finalizado'}
          </h2>
          <div style={{ fontSize: '48px', fontWeight: 900, color: '#facc15', marginBottom: '8px' }}>
            {match.homeScore ?? 0} — {match.awayScore ?? 0}
          </div>
          <p style={{ color: '#475569', fontSize: '14px' }}>
            {home.flag} {home.shortName} vs {away.flag} {away.shortName}
          </p>
        </div>
      )}

      {/* Back button */}
      <div style={{ textAlign: 'center', padding: '0 0 40px' }}>
        <Link href="/mundial2026" style={{
          display: 'inline-block',
          padding: '10px 24px',
          background: 'rgba(250,204,21,0.08)',
          border: '1px solid rgba(250,204,21,0.25)',
          borderRadius: '8px',
          color: '#facc15',
          fontWeight: 700,
          fontSize: '13px',
          textDecoration: 'none',
        }}>
          ← Volver al calendario
        </Link>
      </div>

    </div>
  )
}
