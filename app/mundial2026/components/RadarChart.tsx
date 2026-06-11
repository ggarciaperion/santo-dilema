'use client'

import type { TeamRadar } from '@/lib/mundial2026/types'

interface Props {
  home:     TeamRadar
  away:     TeamRadar
  homeLabel: string
  homeColor: string
  awayLabel: string
  awayColor: string
}

const AXES = [
  { key: 'attack',   label: 'Ataque'    },
  { key: 'defense',  label: 'Defensa'   },
  { key: 'form',     label: 'Forma'     },
  { key: 'xG',       label: 'xG'        },
  { key: 'history',  label: 'Historia'  },
  { key: 'pressure', label: 'Presión'   },
] as const

const N     = AXES.length
const CX    = 150
const CY    = 150
const R     = 110  // outer radius
const RINGS = 5

function polarToXY(angle: number, radius: number): [number, number] {
  const rad = (angle - 90) * (Math.PI / 180)
  return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)]
}

function radarPath(data: TeamRadar, maxR: number): string {
  return AXES.map(({ key }, i) => {
    const angle = (360 / N) * i
    const val   = (data[key] / 100) * maxR
    const [x, y] = polarToXY(angle, val)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ') + ' Z'
}

export default function RadarChart({ home, away, homeLabel, homeColor, awayLabel, awayColor }: Props) {
  return (
    <svg viewBox="0 0 300 300" style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}>

      {/* Background rings */}
      {Array.from({ length: RINGS }, (_, i) => {
        const r = R * ((i + 1) / RINGS)
        const points = AXES.map((_, j) => polarToXY((360 / N) * j, r)).map(([x, y]) => `${x},${y}`).join(' ')
        return <polygon key={i} points={points} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      })}

      {/* Ring labels */}
      {Array.from({ length: RINGS }, (_, i) => {
        const r   = R * ((i + 1) / RINGS)
        const val = Math.round(((i + 1) / RINGS) * 100)
        const [x, y] = polarToXY(0, r)
        return (
          <text key={i} x={x + 3} y={y - 2} fontSize="8" fill="rgba(255,255,255,0.25)" textAnchor="start">
            {val}
          </text>
        )
      })}

      {/* Axis lines */}
      {AXES.map((_, i) => {
        const [x, y] = polarToXY((360 / N) * i, R)
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      })}

      {/* Away polygon */}
      <path
        d={radarPath(away, R)}
        fill={awayColor + '28'}
        stroke={awayColor}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Home polygon */}
      <path
        d={radarPath(home, R)}
        fill={homeColor + '28'}
        stroke={homeColor}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Data points — home */}
      {AXES.map(({ key }, i) => {
        const [x, y] = polarToXY((360 / N) * i, (home[key] / 100) * R)
        return <circle key={i} cx={x} cy={y} r="3.5" fill={homeColor} />
      })}

      {/* Data points — away */}
      {AXES.map(({ key }, i) => {
        const [x, y] = polarToXY((360 / N) * i, (away[key] / 100) * R)
        return <circle key={i} cx={x} cy={y} r="3.5" fill={awayColor} />
      })}

      {/* Axis labels */}
      {AXES.map(({ label }, i) => {
        const angle   = (360 / N) * i
        const labelR  = R + 22
        const [x, y]  = polarToXY(angle, labelR)
        const anchor  = x < CX - 5 ? 'end' : x > CX + 5 ? 'start' : 'middle'
        return (
          <text key={i} x={x} y={y + 4} fontSize="11" fontWeight="600"
            fill="rgba(255,255,255,0.7)" textAnchor={anchor}>
            {label}
          </text>
        )
      })}

      {/* Legend */}
      <rect x="20" y="270" width="10" height="10" fill={homeColor} rx="2" />
      <text x="34" y="279" fontSize="10" fill={homeColor} fontWeight="700">{homeLabel}</text>

      <rect x="170" y="270" width="10" height="10" fill={awayColor} rx="2" />
      <text x="184" y="279" fontSize="10" fill={awayColor} fontWeight="700">{awayLabel}</text>
    </svg>
  )
}
