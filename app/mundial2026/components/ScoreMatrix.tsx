'use client'

import type { ScoreProbability } from '@/lib/mundial2026/types'

interface Props {
  scores:    ScoreProbability[]
  homeLabel: string
  awayLabel: string
}

export default function ScoreMatrix({ scores, homeLabel, awayLabel }: Props) {
  const maxGoals = 5

  // Build 2D lookup
  const lookup = new Map<string, number>()
  scores.forEach(s => {
    if (s.homeGoals <= maxGoals && s.awayGoals <= maxGoals) {
      lookup.set(`${s.homeGoals}:${s.awayGoals}`, s.probability)
    }
  })

  const maxP = Math.max(...Array.from(lookup.values()))

  function cellBg(p: number): string {
    if (p <= 0) return 'rgba(255,255,255,0.02)'
    const intensity = p / maxP
    if (p === maxP)                return 'rgba(250,204,21,0.85)'   // top score: gold
    if (intensity > 0.6)           return 'rgba(34,197,94,0.70)'
    if (intensity > 0.35)          return 'rgba(34,197,94,0.40)'
    if (intensity > 0.15)          return 'rgba(34,197,94,0.20)'
    return 'rgba(255,255,255,0.04)'
  }

  function textColor(p: number): string {
    const intensity = p / maxP
    if (intensity > 0.6) return '#000'
    if (intensity > 0.15) return '#f1f5f9'
    return '#475569'
  }

  const CELL = 48

  return (
    <div>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textAlign: 'center' }}>
        Probabilidad de marcador — goles {homeLabel} (fila) × {awayLabel} (columna)
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', margin: '0 auto', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ width: CELL, height: CELL, color: '#64748b', fontWeight: 600, fontSize: '10px', textAlign: 'center', verticalAlign: 'bottom', paddingBottom: '4px' }}>
                ↓{homeLabel.slice(0,3)} / {awayLabel.slice(0,3)}→
              </th>
              {Array.from({ length: maxGoals + 1 }, (_, a) => (
                <th key={a} style={{ width: CELL, textAlign: 'center', color: '#3b82f6', fontWeight: 700, paddingBottom: '6px' }}>
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxGoals + 1 }, (_, h) => (
              <tr key={h}>
                <td style={{ color: '#22c55e', fontWeight: 700, textAlign: 'center', paddingRight: '6px' }}>{h}</td>
                {Array.from({ length: maxGoals + 1 }, (_, a) => {
                  const p = lookup.get(`${h}:${a}`) ?? 0
                  return (
                    <td key={a} style={{
                      width: CELL, height: CELL,
                      background: cellBg(p),
                      color: textColor(p),
                      textAlign: 'center',
                      fontWeight: p === maxP ? 800 : 600,
                      fontSize: p > 0.02 ? '11px' : '9px',
                      borderRadius: '4px',
                      border: p === maxP ? '2px solid rgba(250,204,21,0.8)' : '1px solid rgba(255,255,255,0.04)',
                      cursor: 'default',
                      transition: 'all 0.1s',
                      position: 'relative',
                    }}>
                      {p > 0.001 ? `${(p * 100).toFixed(1)}%` : ''}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top 5 scores */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {scores.slice(0, 6).map((s, i) => (
          <div key={i} style={{
            padding: '4px 10px',
            background: i === 0 ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${i === 0 ? 'rgba(250,204,21,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            color: i === 0 ? '#facc15' : '#94a3b8',
          }}>
            {s.homeGoals}–{s.awayGoals} <span style={{ fontWeight: 400 }}>{(s.probability * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
