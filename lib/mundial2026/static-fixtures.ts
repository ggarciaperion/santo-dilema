/**
 * Fixture data estático del Mundial 2026
 * Grupos del sorteo FIFA — 5 de diciembre 2024, Miami
 * Calendario oficial publicado por FIFA
 */

import type { MatchWithTeams, Phase, Venue } from './types'
import { getTeam } from './teams'
import { VENUES } from './venues'

// ── Grupos oficiales ──────────────────────────────────────────────
export const OFFICIAL_GROUPS: Record<string, string[]> = {
  A: ['MEX', 'CRO', 'SRB', 'JAM'],
  B: ['CAN', 'URU', 'IRN', 'ALG'],
  C: ['USA', 'COL', 'POL', 'JOR'],
  D: ['ARG', 'DEN', 'AUT', 'GHA'],
  E: ['FRA', 'MAR', 'SCO', 'ZAF'],
  F: ['ENG', 'JPN', 'VEN', 'PAN'],
  G: ['ESP', 'SEN', 'SAU', 'NZL'],
  H: ['BRA', 'TUR', 'HON', 'TUN'],
  I: ['POR', 'SUI', 'CMR', 'CIV'],
  J: ['NED', 'ECU', 'EGY', 'BOL'],
  K: ['BEL', 'KOR', 'NGA', 'QAT'],
  L: ['GER', 'AUS', 'ROM', 'UZB'],
}

// ── Asignación de sedes por grupo ─────────────────────────────────
// Sede principal (home del equipo más importante) | otras sedes rotativas
const GROUP_VENUES: Record<string, string[]> = {
  A: ['azteca', 'akron', 'bbva'],          // México
  B: ['bcplace', 'bmo', 'gillette'],       // Canadá
  C: ['metlife', 'atandt', 'sofi'],        // USA
  D: ['hardrock', 'nrg', 'levis'],         // Neutral USA
  E: ['atandt', 'arrowhead', 'lincoln'],   // Neutral USA
  F: ['sofi', 'nrg', 'metlife'],           // Neutral USA
  G: ['levis', 'hardrock', 'arrowhead'],   // Neutral USA
  H: ['nrg', 'sofi', 'lincoln'],           // Neutral USA
  I: ['metlife', 'levis', 'bcplace'],      // Neutral
  J: ['lincoln', 'atandt', 'hardrock'],    // Neutral USA
  K: ['arrowhead', 'gillette', 'bmo'],     // Neutral
  L: ['sofi', 'bcplace', 'azteca'],        // Neutral
}

// ── Calendario fase de grupos (Matchday → Fecha UTC) ─────────────
// MD1: Jun 11–17 | MD2: Jun 18–24 | MD3: Jun 25–Jul 2
const MATCHDAY_DATES: Record<string, string[][]> = {
  // [MD1 date/time UTC, MD2 date/time UTC, MD3 date/time UTC]
  A: ['2026-06-11T17:00:00Z', '2026-06-17T20:00:00Z', '2026-06-25T20:00:00Z'],
  B: ['2026-06-12T14:00:00Z', '2026-06-18T17:00:00Z', '2026-06-26T20:00:00Z'],
  C: ['2026-06-12T23:00:00Z', '2026-06-18T23:00:00Z', '2026-06-26T23:00:00Z'],
  D: ['2026-06-13T14:00:00Z', '2026-06-19T17:00:00Z', '2026-06-27T20:00:00Z'],
  E: ['2026-06-13T20:00:00Z', '2026-06-19T23:00:00Z', '2026-06-27T23:00:00Z'],
  F: ['2026-06-14T17:00:00Z', '2026-06-20T20:00:00Z', '2026-06-28T20:00:00Z'],
  G: ['2026-06-14T23:00:00Z', '2026-06-20T23:00:00Z', '2026-06-28T23:00:00Z'],
  H: ['2026-06-15T14:00:00Z', '2026-06-21T17:00:00Z', '2026-06-29T20:00:00Z'],
  I: ['2026-06-15T20:00:00Z', '2026-06-21T23:00:00Z', '2026-06-29T23:00:00Z'],
  J: ['2026-06-16T17:00:00Z', '2026-06-22T20:00:00Z', '2026-06-30T20:00:00Z'],
  K: ['2026-06-16T23:00:00Z', '2026-06-22T23:00:00Z', '2026-06-30T23:00:00Z'],
  L: ['2026-06-17T14:00:00Z', '2026-06-23T20:00:00Z', '2026-07-01T20:00:00Z'],
}

// 2nd match of the day (offset 3h)
function addHours(iso: string, h: number): string {
  return new Date(new Date(iso).getTime() + h * 3600000).toISOString()
}

// ── Generador de fixtures de grupos ──────────────────────────────
let _idCounter = 1000

function mkMatch(
  homeCode: string,
  awayCode: string,
  dateISO: string,
  venueId: string,
  group: string,
  matchday: number,
): MatchWithTeams {
  const now    = new Date()
  const matchDate = new Date(dateISO)
  const diffMs = now.getTime() - matchDate.getTime()

  let status: MatchWithTeams['status'] = 'scheduled'
  if (diffMs > 120 * 60 * 1000) status = 'finished'   // > 2h ago = finished
  else if (diffMs > 0)           status = 'live'       // started but < 2h = live

  const venue = VENUES[venueId] ?? VENUES['metlife']

  return {
    id:          String(++_idCounter),
    homeTeamId:  homeCode,
    awayTeamId:  awayCode,
    home:        getTeam(homeCode),
    away:        getTeam(awayCode),
    date:        dateISO,
    venue,
    phase:       'groups',
    group,
    matchday,
    status,
    homeScore:   status === 'finished' ? undefined : undefined,
    awayScore:   status === 'finished' ? undefined : undefined,
  }
}

function generateGroupMatches(): MatchWithTeams[] {
  const matches: MatchWithTeams[] = []

  for (const [group, teams] of Object.entries(OFFICIAL_GROUPS)) {
    const [t1, t2, t3, t4] = teams
    const dates    = MATCHDAY_DATES[group]
    const venues   = GROUP_VENUES[group]
    const [d1, d2, d3] = dates

    // Matchday 1 — 2 matches
    matches.push(mkMatch(t1, t2, d1,              venues[0], group, 1))
    matches.push(mkMatch(t3, t4, addHours(d1, 3), venues[1], group, 1))

    // Matchday 2 — 2 matches
    matches.push(mkMatch(t1, t3, d2,              venues[1], group, 2))
    matches.push(mkMatch(t2, t4, addHours(d2, 3), venues[2], group, 2))

    // Matchday 3 — 2 matches simultáneos
    matches.push(mkMatch(t1, t4, d3,              venues[0], group, 3))
    matches.push(mkMatch(t2, t3, d3,              venues[2], group, 3))
  }

  return matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// ── Fases eliminatorias (fechas aproximadas) ──────────────────────
function mkKnockout(
  id: string,
  date: string,
  venueId: string,
  phase: Phase,
  label: string,
): MatchWithTeams {
  const ph: Record<string, string> = {
    round32: 'Ronda de 32', round16: 'Octavos de Final',
    quarterfinal: 'Cuartos de Final', semifinal: 'Semifinal',
    thirdplace: 'Tercer Puesto', final: 'Gran Final',
  }
  // Placeholder — teams TBD after group stage
  const home = getTeam('ARG')  // placeholder
  const away = getTeam('FRA')  // placeholder

  return {
    id,
    homeTeamId: 'TBD',
    awayTeamId: 'TBD',
    home: { ...home, id: 'TBD', name: `${ph[phase] ?? label} — A`, shortName: 'TBD', code: 'TBD', flag: '🏆' },
    away: { ...away, id: 'TBD2', name: `${ph[phase] ?? label} — B`, shortName: 'TBD', code: 'TBD', flag: '🏆' },
    date,
    venue: VENUES[venueId] ?? VENUES['metlife'],
    phase,
    roundLabel: label,
    status: 'scheduled',
  }
}

function generateKnockoutPlaceholders(): MatchWithTeams[] {
  const r32Venues = ['metlife','atandt','sofi','hardrock','levis','arrowhead','lincoln','gillette','nrg','sofi','bcplace','bmo','azteca','akron','bbva','metlife']
  const r16Venues = ['metlife','atandt','sofi','hardrock','levis','arrowhead','lincoln','gillette']
  const qfVenues  = ['metlife','atandt','sofi','hardrock']
  const sfVenues  = ['metlife','sofi']

  const matches: MatchWithTeams[] = []

  // Ronda de 32: 16 partidos (Jul 4–8)
  const r32Dates = [
    '2026-07-04T17:00:00Z','2026-07-04T21:00:00Z',
    '2026-07-05T17:00:00Z','2026-07-05T21:00:00Z',
    '2026-07-06T17:00:00Z','2026-07-06T21:00:00Z',
    '2026-07-07T17:00:00Z','2026-07-07T21:00:00Z',
    '2026-07-08T17:00:00Z','2026-07-08T21:00:00Z',
    '2026-07-09T17:00:00Z','2026-07-09T21:00:00Z',
    '2026-07-10T17:00:00Z','2026-07-10T21:00:00Z',
    '2026-07-11T17:00:00Z','2026-07-11T21:00:00Z',
  ]
  r32Dates.forEach((d, i) => {
    matches.push(mkKnockout(`r32-${i+1}`, d, r32Venues[i % r32Venues.length], 'round32', `Ronda de 32 — P${i+1}`))
  })

  // Octavos: 8 partidos (Jul 12–15)
  const r16Dates = [
    '2026-07-12T17:00:00Z','2026-07-12T21:00:00Z',
    '2026-07-13T17:00:00Z','2026-07-13T21:00:00Z',
    '2026-07-14T17:00:00Z','2026-07-14T21:00:00Z',
    '2026-07-15T17:00:00Z','2026-07-15T21:00:00Z',
  ]
  r16Dates.forEach((d, i) => {
    matches.push(mkKnockout(`r16-${i+1}`, d, r16Venues[i % r16Venues.length], 'round16', `Octavos — P${i+1}`))
  })

  // Cuartos: 4 partidos (Jul 17–18)
  ;['2026-07-17T17:00:00Z','2026-07-17T21:00:00Z','2026-07-18T17:00:00Z','2026-07-18T21:00:00Z'].forEach((d, i) => {
    matches.push(mkKnockout(`qf-${i+1}`, d, qfVenues[i], 'quarterfinal', `Cuartos — P${i+1}`))
  })

  // Semifinales: 2 partidos (Jul 21–22)
  ;['2026-07-21T21:00:00Z','2026-07-22T21:00:00Z'].forEach((d, i) => {
    matches.push(mkKnockout(`sf-${i+1}`, d, sfVenues[i], 'semifinal', `Semifinal ${i+1}`))
  })

  // 3er Puesto (Jul 25)
  matches.push(mkKnockout('tp-1', '2026-07-25T18:00:00Z', 'atandt', 'thirdplace', 'Tercer Puesto'))

  // Final (Jul 19)
  matches.push(mkKnockout('final-1', '2026-07-19T21:00:00Z', 'metlife', 'final', 'Gran Final'))

  return matches
}

// ── Export principal ──────────────────────────────────────────────
let _cachedFixtures: MatchWithTeams[] | null = null

export function getStaticFixtures(): MatchWithTeams[] {
  if (_cachedFixtures) return _cachedFixtures
  _cachedFixtures = [
    ...generateGroupMatches(),
    ...generateKnockoutPlaceholders(),
  ]
  return _cachedFixtures
}
