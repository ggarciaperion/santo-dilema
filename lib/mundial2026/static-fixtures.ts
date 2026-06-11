/**
 * Fixture data oficial del Mundial 2026
 * Fuente: ESPN / FIFA / Sky Sports
 * Sorteo: 5 de diciembre 2024, Miami
 * Horarios en UTC (ET + 4h durante horario de verano)
 */

import type { MatchWithTeams, Phase } from './types'
import { getTeam } from './teams'
import { VENUES } from './venues'

function getStatus(dateISO: string): MatchWithTeams['status'] {
  const diff = Date.now() - new Date(dateISO).getTime()
  if (diff > 120 * 60 * 1000) return 'finished'
  if (diff > 0)               return 'live'
  return 'scheduled'
}

function mk(
  id: string,
  home: string,
  away: string,
  date: string,
  venueId: string,
  group: string,
  matchday: number,
): MatchWithTeams {
  return {
    id,
    homeTeamId: home,
    awayTeamId: away,
    home: getTeam(home),
    away: getTeam(away),
    date,
    venue: VENUES[venueId] ?? VENUES['metlife'],
    phase: 'groups',
    group,
    matchday,
    status: getStatus(date),
    homeScore: undefined,
    awayScore: undefined,
  }
}

function mkKO(
  id: string,
  date: string,
  venueId: string,
  phase: Phase,
  label: string,
): MatchWithTeams {
  const phaseLabels: Record<string, string> = {
    round32: 'Ronda de 32', round16: 'Octavos de Final',
    quarterfinal: 'Cuartos de Final', semifinal: 'Semifinal',
    thirdplace: 'Tercer Puesto', final: 'Gran Final',
  }
  const ph = phaseLabels[phase] ?? label
  const tbd1 = getTeam('ARG')
  const tbd2 = getTeam('BRA')
  return {
    id,
    homeTeamId: 'TBD',
    awayTeamId: 'TBD',
    home: { ...tbd1, id: 'TBD',  name: `${ph} — A`, shortName: 'TBD', code: 'TBD', flag: '\u{1F3C6}' },
    away: { ...tbd2, id: 'TBD2', name: `${ph} — B`, shortName: 'TBD', code: 'TBD', flag: '\u{1F3C6}' },
    date,
    venue: VENUES[venueId] ?? VENUES['metlife'],
    phase,
    roundLabel: label,
    status: 'scheduled',
  }
}

// ── Grupos reales (Sorteo FIFA, 5 dic 2024) ─────────────────────
// A: México, Sudáfrica, Corea del Sur, Chequia
// B: Canadá, Bosnia-Herz., Qatar, Suiza
// C: Brasil, Marruecos, Haití, Escocia
// D: USA, Paraguay, Australia, Turquía
// E: Alemania, Curazao, Costa de Marfil, Ecuador
// F: Países Bajos, Japón, Suecia, Túnez
// G: Bélgica, Egipto, Irán, Nueva Zelanda
// H: España, Cabo Verde, Arabia Saudí, Uruguay
// I: Francia, Senegal, Irak, Noruega
// J: Argentina, Argelia, Austria, Jordania
// K: Portugal, RD Congo, Uzbekistán, Colombia
// L: Inglaterra, Croacia, Ghana, Panamá

const GROUP_MATCHES: MatchWithTeams[] = [

  // ── GROUP A ──────────────────────────────────────────────────────
  mk('A-1-1', 'MEX', 'ZAF', '2026-06-11T19:00:00Z', 'azteca',    'A', 1),
  mk('A-1-2', 'KOR', 'CZE', '2026-06-12T02:00:00Z', 'akron',     'A', 1),
  mk('A-2-1', 'CZE', 'ZAF', '2026-06-18T16:00:00Z', 'atlanta',   'A', 2),
  mk('A-2-2', 'MEX', 'KOR', '2026-06-19T03:00:00Z', 'akron',     'A', 2),
  mk('A-3-1', 'ZAF', 'KOR', '2026-06-25T01:00:00Z', 'bbva',      'A', 3),
  mk('A-3-2', 'CZE', 'MEX', '2026-06-25T01:00:00Z', 'azteca',    'A', 3),

  // ── GROUP B ──────────────────────────────────────────────────────
  mk('B-1-1', 'CAN', 'BIH', '2026-06-12T19:00:00Z', 'bmo',       'B', 1),
  mk('B-1-2', 'QAT', 'SUI', '2026-06-12T19:00:00Z', 'levis',     'B', 1),
  mk('B-2-1', 'SUI', 'BIH', '2026-06-18T19:00:00Z', 'sofi',      'B', 2),
  mk('B-2-2', 'CAN', 'QAT', '2026-06-18T22:00:00Z', 'bcplace',   'B', 2),
  mk('B-3-1', 'SUI', 'CAN', '2026-06-24T19:00:00Z', 'bcplace',   'B', 3),
  mk('B-3-2', 'BIH', 'QAT', '2026-06-24T19:00:00Z', 'lumen',     'B', 3),

  // ── GROUP C ──────────────────────────────────────────────────────
  mk('C-1-1', 'BRA', 'MAR', '2026-06-13T22:00:00Z', 'metlife',   'C', 1),
  mk('C-1-2', 'HAI', 'SCO', '2026-06-14T01:00:00Z', 'gillette',  'C', 1),
  mk('C-2-1', 'SCO', 'MAR', '2026-06-19T22:00:00Z', 'gillette',  'C', 2),
  mk('C-2-2', 'BRA', 'HAI', '2026-06-20T01:00:00Z', 'lincoln',   'C', 2),
  mk('C-3-1', 'SCO', 'BRA', '2026-06-24T22:00:00Z', 'hardrock',  'C', 3),
  mk('C-3-2', 'MAR', 'HAI', '2026-06-24T22:00:00Z', 'atlanta',   'C', 3),

  // ── GROUP D ──────────────────────────────────────────────────────
  mk('D-1-1', 'USA', 'PAR', '2026-06-13T01:00:00Z', 'sofi',      'D', 1),
  mk('D-1-2', 'AUS', 'TUR', '2026-06-14T04:00:00Z', 'bcplace',   'D', 1),
  mk('D-2-1', 'USA', 'AUS', '2026-06-19T19:00:00Z', 'lumen',     'D', 2),
  mk('D-2-2', 'TUR', 'PAR', '2026-06-20T04:00:00Z', 'levis',     'D', 2),
  mk('D-3-1', 'TUR', 'USA', '2026-06-26T02:00:00Z', 'sofi',      'D', 3),
  mk('D-3-2', 'PAR', 'AUS', '2026-06-26T02:00:00Z', 'levis',     'D', 3),

  // ── GROUP E ──────────────────────────────────────────────────────
  mk('E-1-1', 'GER', 'CUW', '2026-06-14T17:00:00Z', 'nrg',      'E', 1),
  mk('E-1-2', 'CIV', 'ECU', '2026-06-14T23:00:00Z', 'lincoln',  'E', 1),
  mk('E-2-1', 'GER', 'CIV', '2026-06-20T20:00:00Z', 'bmo',      'E', 2),
  mk('E-2-2', 'ECU', 'CUW', '2026-06-21T00:00:00Z', 'arrowhead','E', 2),
  mk('E-3-1', 'ECU', 'GER', '2026-06-25T20:00:00Z', 'metlife',  'E', 3),
  mk('E-3-2', 'CUW', 'CIV', '2026-06-25T20:00:00Z', 'lincoln',  'E', 3),

  // ── GROUP F ──────────────────────────────────────────────────────
  mk('F-1-1', 'NED', 'JPN', '2026-06-14T20:00:00Z', 'atandt',   'F', 1),
  mk('F-1-2', 'SWE', 'TUN', '2026-06-15T02:00:00Z', 'bbva',     'F', 1),
  mk('F-2-1', 'NED', 'SWE', '2026-06-20T17:00:00Z', 'nrg',      'F', 2),
  mk('F-2-2', 'TUN', 'JPN', '2026-06-21T04:00:00Z', 'bbva',     'F', 2),
  mk('F-3-1', 'JPN', 'SWE', '2026-06-25T23:00:00Z', 'atandt',   'F', 3),
  mk('F-3-2', 'TUN', 'NED', '2026-06-25T23:00:00Z', 'arrowhead','F', 3),

  // ── GROUP G ──────────────────────────────────────────────────────
  mk('G-1-1', 'BEL', 'EGY', '2026-06-15T22:00:00Z', 'lumen',    'G', 1),
  mk('G-1-2', 'IRN', 'NZL', '2026-06-16T04:00:00Z', 'sofi',     'G', 1),
  mk('G-2-1', 'BEL', 'IRN', '2026-06-21T19:00:00Z', 'sofi',     'G', 2),
  mk('G-2-2', 'NZL', 'EGY', '2026-06-22T01:00:00Z', 'bcplace',  'G', 2),
  mk('G-3-1', 'EGY', 'IRN', '2026-06-27T03:00:00Z', 'lumen',    'G', 3),
  mk('G-3-2', 'NZL', 'BEL', '2026-06-27T03:00:00Z', 'bcplace',  'G', 3),

  // ── GROUP H ──────────────────────────────────────────────────────
  mk('H-1-1', 'ESP', 'CPV', '2026-06-15T17:00:00Z', 'atlanta',  'H', 1),
  mk('H-1-2', 'SAU', 'URU', '2026-06-15T22:00:00Z', 'hardrock', 'H', 1),
  mk('H-2-1', 'ESP', 'SAU', '2026-06-21T16:00:00Z', 'atlanta',  'H', 2),
  mk('H-2-2', 'URU', 'CPV', '2026-06-21T22:00:00Z', 'hardrock', 'H', 2),
  mk('H-3-1', 'CPV', 'SAU', '2026-06-27T00:00:00Z', 'nrg',     'H', 3),
  mk('H-3-2', 'URU', 'ESP', '2026-06-27T00:00:00Z', 'akron',   'H', 3),

  // ── GROUP I ──────────────────────────────────────────────────────
  mk('I-1-1', 'FRA', 'SEN', '2026-06-16T19:00:00Z', 'metlife',  'I', 1),
  mk('I-1-2', 'IRQ', 'NOR', '2026-06-16T22:00:00Z', 'gillette', 'I', 1),
  mk('I-2-1', 'FRA', 'IRQ', '2026-06-22T21:00:00Z', 'lincoln',  'I', 2),
  mk('I-2-2', 'NOR', 'SEN', '2026-06-23T00:00:00Z', 'metlife',  'I', 2),
  mk('I-3-1', 'NOR', 'FRA', '2026-06-26T19:00:00Z', 'gillette', 'I', 3),
  mk('I-3-2', 'SEN', 'IRQ', '2026-06-26T19:00:00Z', 'bmo',     'I', 3),

  // ── GROUP J ──────────────────────────────────────────────────────
  mk('J-1-1', 'ARG', 'ALG', '2026-06-17T01:00:00Z', 'arrowhead','J', 1),
  mk('J-1-2', 'AUT', 'JOR', '2026-06-17T04:00:00Z', 'levis',    'J', 1),
  mk('J-2-1', 'ARG', 'AUT', '2026-06-22T17:00:00Z', 'atandt',   'J', 2),
  mk('J-2-2', 'JOR', 'ALG', '2026-06-23T03:00:00Z', 'levis',    'J', 2),
  mk('J-3-1', 'ALG', 'AUT', '2026-06-28T02:00:00Z', 'arrowhead','J', 3),
  mk('J-3-2', 'JOR', 'ARG', '2026-06-28T02:00:00Z', 'atandt',   'J', 3),

  // ── GROUP K ──────────────────────────────────────────────────────
  mk('K-1-1', 'POR', 'COD', '2026-06-17T17:00:00Z', 'nrg',     'K', 1),
  mk('K-1-2', 'UZB', 'COL', '2026-06-18T02:00:00Z', 'azteca',  'K', 1),
  mk('K-2-1', 'POR', 'UZB', '2026-06-23T17:00:00Z', 'nrg',     'K', 2),
  mk('K-2-2', 'COL', 'COD', '2026-06-24T02:00:00Z', 'akron',   'K', 2),
  mk('K-3-1', 'COL', 'POR', '2026-06-27T23:30:00Z', 'hardrock','K', 3),
  mk('K-3-2', 'COD', 'UZB', '2026-06-27T23:30:00Z', 'atlanta', 'K', 3),

  // ── GROUP L ──────────────────────────────────────────────────────
  mk('L-1-1', 'ENG', 'CRO', '2026-06-17T20:00:00Z', 'atandt',  'L', 1),
  mk('L-1-2', 'GHA', 'PAN', '2026-06-17T23:00:00Z', 'bmo',     'L', 1),
  mk('L-2-1', 'ENG', 'GHA', '2026-06-23T20:00:00Z', 'gillette','L', 2),
  mk('L-2-2', 'PAN', 'CRO', '2026-06-23T23:00:00Z', 'bmo',     'L', 2),
  mk('L-3-1', 'PAN', 'ENG', '2026-06-27T21:00:00Z', 'metlife', 'L', 3),
  mk('L-3-2', 'CRO', 'GHA', '2026-06-27T21:00:00Z', 'lincoln', 'L', 3),
]

// ── Fase eliminatoria (placeholders) ────────────────────────────
// R32: Jun 28 – Jul 3 | R16: Jul 5–8 | QF: Jul 10–11 | SF: Jul 14–15 | Final: Jul 19
const KNOCKOUT_MATCHES: MatchWithTeams[] = [
  // Ronda de 32 — 16 partidos
  mkKO('r32-1',  '2026-06-29T17:00:00Z', 'metlife',   'round32', 'Ronda de 32 — P1'),
  mkKO('r32-2',  '2026-06-29T21:00:00Z', 'atandt',    'round32', 'Ronda de 32 — P2'),
  mkKO('r32-3',  '2026-06-30T17:00:00Z', 'sofi',      'round32', 'Ronda de 32 — P3'),
  mkKO('r32-4',  '2026-06-30T21:00:00Z', 'hardrock',  'round32', 'Ronda de 32 — P4'),
  mkKO('r32-5',  '2026-07-01T17:00:00Z', 'levis',     'round32', 'Ronda de 32 — P5'),
  mkKO('r32-6',  '2026-07-01T21:00:00Z', 'arrowhead', 'round32', 'Ronda de 32 — P6'),
  mkKO('r32-7',  '2026-07-02T17:00:00Z', 'lincoln',   'round32', 'Ronda de 32 — P7'),
  mkKO('r32-8',  '2026-07-02T21:00:00Z', 'gillette',  'round32', 'Ronda de 32 — P8'),
  mkKO('r32-9',  '2026-07-03T17:00:00Z', 'nrg',       'round32', 'Ronda de 32 — P9'),
  mkKO('r32-10', '2026-07-03T21:00:00Z', 'sofi',      'round32', 'Ronda de 32 — P10'),
  mkKO('r32-11', '2026-07-04T17:00:00Z', 'bcplace',   'round32', 'Ronda de 32 — P11'),
  mkKO('r32-12', '2026-07-04T21:00:00Z', 'bmo',       'round32', 'Ronda de 32 — P12'),
  mkKO('r32-13', '2026-07-05T17:00:00Z', 'azteca',    'round32', 'Ronda de 32 — P13'),
  mkKO('r32-14', '2026-07-05T21:00:00Z', 'akron',     'round32', 'Ronda de 32 — P14'),
  mkKO('r32-15', '2026-07-06T17:00:00Z', 'atlanta',   'round32', 'Ronda de 32 — P15'),
  mkKO('r32-16', '2026-07-06T21:00:00Z', 'lumen',     'round32', 'Ronda de 32 — P16'),

  // Octavos de Final — 8 partidos
  mkKO('r16-1', '2026-07-08T17:00:00Z', 'metlife',   'round16', 'Octavos — P1'),
  mkKO('r16-2', '2026-07-08T21:00:00Z', 'atandt',    'round16', 'Octavos — P2'),
  mkKO('r16-3', '2026-07-09T17:00:00Z', 'sofi',      'round16', 'Octavos — P3'),
  mkKO('r16-4', '2026-07-09T21:00:00Z', 'hardrock',  'round16', 'Octavos — P4'),
  mkKO('r16-5', '2026-07-10T17:00:00Z', 'levis',     'round16', 'Octavos — P5'),
  mkKO('r16-6', '2026-07-10T21:00:00Z', 'arrowhead', 'round16', 'Octavos — P6'),
  mkKO('r16-7', '2026-07-11T17:00:00Z', 'lincoln',   'round16', 'Octavos — P7'),
  mkKO('r16-8', '2026-07-11T21:00:00Z', 'gillette',  'round16', 'Octavos — P8'),

  // Cuartos de Final — 4 partidos
  mkKO('qf-1', '2026-07-13T17:00:00Z', 'metlife',   'quarterfinal', 'Cuartos — P1'),
  mkKO('qf-2', '2026-07-13T21:00:00Z', 'atandt',    'quarterfinal', 'Cuartos — P2'),
  mkKO('qf-3', '2026-07-14T17:00:00Z', 'sofi',      'quarterfinal', 'Cuartos — P3'),
  mkKO('qf-4', '2026-07-14T21:00:00Z', 'hardrock',  'quarterfinal', 'Cuartos — P4'),

  // Semifinales
  mkKO('sf-1', '2026-07-16T21:00:00Z', 'metlife', 'semifinal', 'Semifinal 1'),
  mkKO('sf-2', '2026-07-17T21:00:00Z', 'sofi',    'semifinal', 'Semifinal 2'),

  // Tercer Puesto
  mkKO('tp-1', '2026-07-18T19:00:00Z', 'atandt', 'thirdplace', 'Tercer Puesto'),

  // Gran Final
  mkKO('final-1', '2026-07-19T21:00:00Z', 'metlife', 'final', 'Gran Final'),
]

// ── Export principal ─────────────────────────────────────────────
let _cachedFixtures: MatchWithTeams[] | null = null

export function getStaticFixtures(): MatchWithTeams[] {
  if (_cachedFixtures) return _cachedFixtures
  _cachedFixtures = [
    ...GROUP_MATCHES,
    ...KNOCKOUT_MATCHES,
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return _cachedFixtures
}

export const OFFICIAL_GROUPS: Record<string, string[]> = {
  A: ['MEX', 'ZAF', 'KOR', 'CZE'],
  B: ['CAN', 'BIH', 'QAT', 'SUI'],
  C: ['BRA', 'MAR', 'HAI', 'SCO'],
  D: ['USA', 'PAR', 'AUS', 'TUR'],
  E: ['GER', 'CUW', 'CIV', 'ECU'],
  F: ['NED', 'JPN', 'SWE', 'TUN'],
  G: ['BEL', 'EGY', 'IRN', 'NZL'],
  H: ['ESP', 'CPV', 'SAU', 'URU'],
  I: ['FRA', 'SEN', 'IRQ', 'NOR'],
  J: ['ARG', 'ALG', 'AUT', 'JOR'],
  K: ['POR', 'COD', 'UZB', 'COL'],
  L: ['ENG', 'CRO', 'GHA', 'PAN'],
}
