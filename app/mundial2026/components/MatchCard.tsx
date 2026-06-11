'use client'

import Link from 'next/link'
import type { MatchWithTeams } from '@/lib/mundial2026/types'
import { generatePrediction } from '@/lib/mundial2026/predictions'

interface Props {
  match: MatchWithTeams
}

function limaTime(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return '--:--'
  }
}

function limaDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('es-PE', {
      timeZone: 'America/Lima',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return '—'
  }
}

export default function MatchCard({ match }: Props) {
  const { home, away, status, homeScore, awayScore, minute, venue, group, phase } = match
  const isLive     = status === 'live'
  const isFinished = status === 'finished'
  const isScheduled = status === 'scheduled'

  // Quick ELO prediction for scheduled matches
  const pred = isScheduled
    ? generatePrediction(home, away, match.id, phase !== 'groups')
    : null

  const phaseLabel = phase === 'groups'
    ? `Grupo ${group ?? ''}`
    : phase === 'round32'  ? 'Ronda de 32'
    : phase === 'round16'  ? 'Octavos de Final'
    : phase === 'quarterfinal' ? 'Cuartos de Final'
    : phase === 'semifinal'    ? 'Semifinal'
    : phase === 'thirdplace'   ? 'Tercer Puesto'
    : 'Final'

  const confColor =
    pred?.confidence === 'very-high' ? '#22c55e'
    : pred?.confidence === 'high'    ? '#86efac'
    : pred?.confidence === 'medium'  ? '#facc15'
    : '#94a3b8'

  return (
    <Link href={`/mundial2026/partido/${match.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #0D1627 0%, #0A1220 100%)',
          border: `1px solid ${isLive ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: '14px',
          padding: '18px 20px',
          cursor: 'pointer',
          transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.transform = 'translateY(-2px)'
          el.style.borderColor = isLive ? 'rgba(239,68,68,0.8)' : 'rgba(250,204,21,0.35)'
          el.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.transform = 'translateY(0)'
          el.style.borderColor = isLive ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'
          el.style.boxShadow = 'none'
        }}
      >
        {/* Top strip: live glow */}
        {isLive && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)',
          }} />
        )}

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: '#64748b', background: 'rgba(255,255,255,0.04)',
            padding: '3px 8px', borderRadius: '5px',
          }}>
            {phaseLabel}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isLive && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '11px', fontWeight: 700, color: '#ef4444',
                background: 'rgba(239,68,68,0.12)', padding: '3px 8px', borderRadius: '5px',
              }}>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: '#ef4444', animation: 'pulse-live 1.4s infinite',
                  display: 'inline-block',
                }} />
                LIVE {minute}′
              </span>
            )}
            {isFinished && (
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>Final</span>
            )}
          </div>
        </div>

        {/* Teams row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

          {/* Home team */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '32px', lineHeight: 1 }}>{home.flag}</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>
                {home.shortName}
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', fontWeight: 500 }}>
                ELO {home.eloRating}
              </div>
            </div>
          </div>

          {/* Score / Time */}
          <div style={{ textAlign: 'center', minWidth: '70px' }}>
            {isFinished || isLive ? (
              <div style={{
                fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px',
                color: '#f8fafc', fontVariantNumeric: 'tabular-nums',
              }}>
                {homeScore ?? 0} <span style={{ color: '#334155' }}>-</span> {awayScore ?? 0}
              </div>
            ) : (
              <>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#facc15', letterSpacing: '-0.5px' }}>
                  {limaTime(match.date)}
                </div>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px', fontWeight: 500 }}>
                  Lima
                </div>
              </>
            )}
          </div>

          {/* Away team */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>
                {away.shortName}
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', fontWeight: 500 }}>
                ELO {away.eloRating}
              </div>
            </div>
            <span style={{ fontSize: '32px', lineHeight: 1 }}>{away.flag}</span>
          </div>

        </div>

        {/* Prediction bar — only for scheduled matches */}
        {pred && (
          <div style={{ marginTop: '14px' }}>
            {/* Probability bar */}
            <div style={{ display: 'flex', height: '5px', borderRadius: '3px', overflow: 'hidden', gap: '1px' }}>
              <div style={{ flex: pred.homeWinProb, background: '#22c55e', borderRadius: '3px 0 0 3px' }} />
              <div style={{ flex: pred.drawProb, background: '#475569' }} />
              <div style={{ flex: pred.awayWinProb, background: '#3b82f6', borderRadius: '0 3px 3px 0' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
              <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 600 }}>
                {Math.round(pred.homeWinProb * 100)}%
              </span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>
                {Math.round(pred.drawProb * 100)}% empate
              </span>
              <span style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 600 }}>
                {Math.round(pred.awayWinProb * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '12px', paddingTop: '10px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '11px', color: '#475569' }}>
            📍 {venue.city} · {venue.name}
          </span>
          <span style={{
            fontSize: '11px', fontWeight: 600, color: '#facc15',
            display: 'flex', alignItems: 'center', gap: '3px',
          }}>
            Ver análisis →
          </span>
        </div>
      </div>
    </Link>
  )
}
