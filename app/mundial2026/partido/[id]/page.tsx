import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFixtures } from '@/lib/mundial2026/api'
import { generatePrediction } from '@/lib/mundial2026/predictions'
import type { MatchWithTeams } from '@/lib/mundial2026/types'

export const dynamic = 'force-dynamic'

function limaDateTime(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
  } catch { return isoDate }
}

function ScoreBar({ homeProb, drawProb, awayProb, homeLabel, awayLabel }: {
  homeProb: number; drawProb: number; awayProb: number
  homeLabel: string; awayLabel: string
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#22c55e' }}>
          {homeLabel} {Math.round(homeProb * 100)}%
        </span>
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          Empate {Math.round(drawProb * 100)}%
        </span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6' }}>
          {Math.round(awayProb * 100)}% {awayLabel}
        </span>
      </div>
      <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', gap: '2px' }}>
        <div style={{ flex: homeProb, background: '#22c55e', borderRadius: '5px 0 0 5px' }} />
        <div style={{ flex: drawProb, background: '#475569' }} />
        <div style={{ flex: awayProb, background: '#3b82f6', borderRadius: '0 5px 5px 0' }} />
      </div>
    </div>
  )
}

function ModelRow({ label, home, draw, away }: {
  label: string; home: number; draw: number; away: number
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', gap: '20px' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e', minWidth: '40px', textAlign: 'right' }}>
          {Math.round(home * 100)}%
        </span>
        <span style={{ fontSize: '14px', color: '#64748b', minWidth: '40px', textAlign: 'center' }}>
          {Math.round(draw * 100)}%
        </span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6', minWidth: '40px', textAlign: 'left' }}>
          {Math.round(away * 100)}%
        </span>
      </div>
    </div>
  )
}

function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0D1627 0%, #0A1220 100%)',
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px',
      padding: '20px 22px',
    }}>
      <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function ConfidenceBadge({ level }: { level: string }) {
  const cfg: Record<string, { color: string; bg: string; label: string }> = {
    'very-high': { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Muy alta' },
    'high':      { color: '#86efac', bg: 'rgba(134,239,172,0.1)', label: 'Alta' },
    'medium':    { color: '#facc15', bg: 'rgba(250,204,21,0.1)', label: 'Media' },
    'low':       { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'Baja' },
  }
  const c = cfg[level] ?? cfg['medium']
  return (
    <span style={{
      fontSize: '12px', fontWeight: 700, color: c.color, background: c.bg,
      border: `1px solid ${c.color}30`, padding: '4px 10px', borderRadius: '6px',
    }}>
      Confianza: {c.label}
    </span>
  )
}

export default async function PartidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { fixtures } = await getFixtures()

  const match: MatchWithTeams | undefined = fixtures.find(m => m.id === id)
  if (!match) notFound()

  const { home, away, venue, date, phase, group, status, homeScore, awayScore } = match

  const isScheduled = status === 'scheduled'
  const isLive      = status === 'live'
  const isFinished  = status === 'finished'

  const pred = generatePrediction(home, away, id, phase !== 'groups')

  const phaseLabel =
    phase === 'groups'       ? `Fase de Grupos — Grupo ${group ?? ''}`
    : phase === 'round32'    ? 'Ronda de 32'
    : phase === 'round16'    ? 'Octavos de Final'
    : phase === 'quarterfinal' ? 'Cuartos de Final'
    : phase === 'semifinal'  ? 'Semifinal'
    : phase === 'thirdplace' ? 'Tercer Puesto'
    : 'Gran Final'

  return (
    <div style={{ minHeight: '100vh', background: '#05070F', color: '#f1f5f9' }}>
      <style>{`
        @keyframes pulse-live { 0%,100%{opacity:1}50%{opacity:0.5} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(180deg, #080D1A 0%, #05070F 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 24px 32px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Back */}
          <Link href="/mundial2026" style={{ color: '#475569', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '20px' }}>
            ← Volver al calendario
          </Link>

          {/* Phase badge */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#facc15', background: 'rgba(250,204,21,0.1)',
              border: '1px solid rgba(250,204,21,0.25)', padding: '4px 10px', borderRadius: '6px',
            }}>
              {phaseLabel}
            </span>
            {isLive && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700,
                color: '#ef4444', background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)', padding: '4px 10px', borderRadius: '6px',
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', animation: 'pulse-live 1.4s infinite', display: 'inline-block' }} />
                EN VIVO {match.minute}′
              </span>
            )}
            {isFinished && (
              <span style={{ fontSize: '11px', color: '#475569', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px' }}>
                Partido finalizado
              </span>
            )}
          </div>

          {/* Teams header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center' }}>
            {/* Home */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '56px', lineHeight: 1, marginBottom: '8px' }}>{home.flag}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>{home.shortName}</div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                ELO {home.eloRating} · {home.confederation}
              </div>
            </div>

            {/* Score / VS */}
            <div style={{ textAlign: 'center', minWidth: '100px' }}>
              {isFinished || isLive ? (
                <div style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-1px', color: '#f8fafc' }}>
                  {homeScore ?? 0} <span style={{ color: '#334155' }}>—</span> {awayScore ?? 0}
                </div>
              ) : (
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#334155' }}>VS</div>
              )}
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                {isScheduled ? limaDateTime(date) : ''}
              </div>
            </div>

            {/* Away */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '56px', lineHeight: 1, marginBottom: '8px' }}>{away.flag}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>{away.shortName}</div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                ELO {away.eloRating} · {away.confederation}
              </div>
            </div>
          </div>

          {/* Venue & date */}
          <div style={{ textAlign: 'center', marginTop: '16px', color: '#475569', fontSize: '13px' }}>
            📍 {venue.name}, {venue.city} &nbsp;·&nbsp; Alt. {venue.altitude}m &nbsp;·&nbsp; Cap. {venue.capacity.toLocaleString('es')}
          </div>
          {isScheduled && (
            <div style={{ textAlign: 'center', marginTop: '6px', color: '#64748b', fontSize: '12px' }}>
              🕐 {limaDateTime(date)} (hora Lima)
            </div>
          )}
        </div>
      </div>

      {/* ── ANALYSIS CONTENT ── */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* ── PREDICTION SUMMARY ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(250,204,21,0.06) 0%, rgba(34,197,94,0.04) 100%)',
          border: '1px solid rgba(250,204,21,0.2)', borderRadius: '16px',
          padding: '24px 28px', marginBottom: '24px', animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#facc15', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Predicción del partido
            </h2>
            <ConfidenceBadge level={pred.confidence} />
          </div>

          <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 20px' }}>
            {pred.summary}
          </p>

          <ScoreBar
            homeProb={pred.homeWinProb}
            drawProb={pred.drawProb}
            awayProb={pred.awayWinProb}
            homeLabel={home.shortName}
            awayLabel={away.shortName}
          />
        </div>

        {/* ── GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>

          {/* Probabilidades por modelo */}
          <StatCard title="Modelos predictivos">
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600, minWidth: '40px', textAlign: 'right' }}>{home.code}</span>
              <span style={{ fontSize: '11px', color: '#64748b', minWidth: '40px', textAlign: 'center' }}>EMP</span>
              <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600, minWidth: '40px' }}>{away.code}</span>
            </div>
            <ModelRow label="ELO Rating" home={pred.models.elo.homeWin} draw={pred.models.elo.draw} away={pred.models.elo.awayWin} />
            <ModelRow label="Poisson (D-C)" home={pred.models.poisson.homeWin} draw={pred.models.poisson.draw} away={pred.models.poisson.awayWin} />
            <ModelRow label="Ensemble Final" home={pred.models.ensemble.homeWin} draw={pred.models.ensemble.draw} away={pred.models.ensemble.awayWin} />

            <div style={{ marginTop: '14px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '6px' }}>Goles esperados</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9' }}>
                    {pred.models.poisson.expectedGoalsH.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '11px', color: '#475569', marginLeft: '4px' }}>xG {home.code}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9' }}>
                    {pred.models.poisson.expectedGoalsA.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '11px', color: '#475569', marginLeft: '4px' }}>xG {away.code}</span>
                </div>
              </div>
            </div>
          </StatCard>

          {/* Marcadores más probables */}
          <StatCard title="Marcadores más probables">
            {pred.mostLikelyScores.slice(0, 6).map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, color: '#475569',
                    background: 'rgba(255,255,255,0.05)', width: '20px', height: '20px',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
                    {s.homeGoals} — {s.awayGoals}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    height: '4px', width: `${Math.round(s.probability * 100 * 3)}px`,
                    maxWidth: '80px', background: i === 0 ? '#facc15' : '#334155',
                    borderRadius: '2px', minWidth: '20px',
                  }} />
                  <span style={{
                    fontSize: '13px', fontWeight: 700,
                    color: i === 0 ? '#facc15' : '#64748b',
                    minWidth: '38px', textAlign: 'right',
                  }}>
                    {(s.probability * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </StatCard>

          {/* ELO comparativo */}
          <StatCard title="Comparativa ELO">
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '14px', background: 'rgba(34,197,94,0.06)', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.15)' }}>
                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{home.flag} {home.code}</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#22c55e' }}>{home.eloRating}</div>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>ELO Rating</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '14px', background: 'rgba(59,130,246,0.06)', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{away.flag} {away.code}</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#3b82f6' }}>{away.eloRating}</div>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>ELO Rating</div>
              </div>
            </div>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Diferencia ELO</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: home.eloRating > away.eloRating ? '#22c55e' : '#3b82f6' }}>
                {Math.abs(home.eloRating - away.eloRating)} puntos
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                Favorito: {home.eloRating >= away.eloRating ? home.shortName : away.shortName}
              </div>
            </div>
          </StatCard>

          {/* Sede & condiciones */}
          <StatCard title="Condiciones de juego">
            {[
              { label: 'Estadio',   value: venue.name },
              { label: 'Ciudad',    value: `${venue.city}, ${venue.country}` },
              { label: 'Altitud',   value: `${venue.altitude}m snm`, warn: venue.altitude > 1500 },
              { label: 'Capacidad', value: venue.capacity.toLocaleString('es') + ' esp.' },
              { label: 'Zona horaria', value: venue.timezone.replace('America/', '') },
              { label: 'Cancha',    value: phase === 'groups' ? 'Neutral' : 'Neutral' },
            ].map(({ label, value, warn }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center',
              }}>
                <span style={{ fontSize: '12px', color: '#475569' }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: warn ? '#facc15' : '#cbd5e1' }}>
                  {warn && '⚠️ '}{value}
                </span>
              </div>
            ))}
          </StatCard>

        </div>

        {/* ── Phase 2 placeholder ── */}
        <div style={{
          marginTop: '24px',
          background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: '14px', padding: '28px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '13px', color: '#334155', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Próximamente — Fase 2
          </div>
          <div style={{ fontSize: '14px', color: '#475569', marginTop: '8px', lineHeight: 1.6 }}>
            Historial H2H completo · Forma reciente (últimos 5/10/20 partidos) ·
            Estadísticas xG de API-Football · Jugadores lesionados y suspendidos ·
            Modelo Bayesiano · Radar charts comparativos
          </div>
        </div>

        {/* Back */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link href="/mundial2026" style={{
            display: 'inline-block', padding: '12px 28px',
            background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.25)',
            borderRadius: '10px', color: '#facc15', fontSize: '13px', fontWeight: 600,
            textDecoration: 'none',
          }}>
            ← Ver todos los partidos
          </Link>
        </div>
      </div>
    </div>
  )
}
