/**
 * ESPN undocumented public API — no key required
 * Endpoint: https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
 *
 * Returns live scores, events (goals, yellow/red cards) for all active
 * and recently finished World Cup matches.
 *
 * In-process cache: 45 seconds (avoids hammering ESPN on every request)
 */

import type { MatchEvent, MatchStatus, MatchWithTeams } from './types'

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

// ESPN team display name → our 3-letter code
const ESPN_TO_CODE: Record<string, string> = {
  'Mexico': 'MEX', 'South Africa': 'ZAF', 'South Korea': 'KOR', 'Czechia': 'CZE',
  'Canada': 'CAN', 'Bosnia and Herzegovina': 'BIH', 'Qatar': 'QAT', 'Switzerland': 'SUI',
  'Brazil': 'BRA', 'Morocco': 'MAR', 'Haiti': 'HAI', 'Scotland': 'SCO',
  'United States': 'USA', 'Paraguay': 'PAR', 'Australia': 'AUS', 'Turkey': 'TUR',
  'Germany': 'GER', 'Curaçao': 'CUW', "Ivory Coast": 'CIV', "Côte d'Ivoire": 'CIV', 'Ecuador': 'ECU',
  'Netherlands': 'NED', 'Japan': 'JPN', 'Sweden': 'SWE', 'Tunisia': 'TUN',
  'Belgium': 'BEL', 'Egypt': 'EGY', 'Iran': 'IRN', 'New Zealand': 'NZL',
  'Spain': 'ESP', 'Cape Verde': 'CPV', 'Saudi Arabia': 'SAU', 'Uruguay': 'URU',
  'France': 'FRA', 'Senegal': 'SEN', 'Iraq': 'IRQ', 'Norway': 'NOR',
  'Argentina': 'ARG', 'Algeria': 'ALG', 'Austria': 'AUT', 'Jordan': 'JOR',
  'Portugal': 'POR', 'DR Congo': 'COD', 'Uzbekistan': 'UZB', 'Colombia': 'COL',
  'England': 'ENG', 'Croatia': 'CRO', 'Ghana': 'GHA', 'Panama': 'PAN',
}

interface EspnMatchSnapshot {
  homeScore: number
  awayScore: number
  status: MatchStatus
  minute: number | undefined  // numeric for live (e.g. 77)
  minuteDisplay: string       // e.g. "77'"
  events: MatchEvent[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEvents(details: any[], homeEspnId: string): MatchEvent[] {
  if (!Array.isArray(details)) return []
  const out: MatchEvent[] = []
  for (const d of details) {
    const side: 'home' | 'away' = d.team?.id === homeEspnId ? 'home' : 'away'
    const minute = d.clock?.displayValue ?? '?'
    const playerName = d.athletesInvolved?.[0]?.shortName ?? ''

    if (d.redCard)               { out.push({ type: 'red',      minute, playerName, side }); continue }
    if (d.yellowCard)            { out.push({ type: 'yellow',   minute, playerName, side }); continue }
    if (d.scoringPlay && d.ownGoal)     { out.push({ type: 'own_goal', minute, playerName, side }); continue }
    if (d.scoringPlay && d.penaltyKick) { out.push({ type: 'penalty',  minute, playerName, side }); continue }
    if (d.scoringPlay)           { out.push({ type: 'goal',     minute, playerName, side }); continue }
  }
  return out
}

function espnState(state: string, completed: boolean): MatchStatus {
  if (completed || state === 'post') return 'finished'
  if (state === 'in')               return 'live'
  return 'scheduled'
}

// In-process cache (no Redis needed — ESPN is fast and free)
let _cacheTs   = 0
let _cacheMap: Map<string, EspnMatchSnapshot> | null = null
const CACHE_MS = 45_000

export async function getEspnLiveMap(): Promise<Map<string, EspnMatchSnapshot>> {
  const now = Date.now()
  if (_cacheMap && now - _cacheTs < CACHE_MS) return _cacheMap

  try {
    const res = await fetch(ESPN_URL, { next: { revalidate: 60 } })
    if (!res.ok) return _cacheMap ?? new Map()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json()
    const map = new Map<string, EspnMatchSnapshot>()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const event of (data.events ?? []) as any[]) {
      const comp = event.competitions?.[0]
      if (!comp) continue

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const homeComp = comp.competitors?.find((c: any) => c.homeAway === 'home')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const awayComp = comp.competitors?.find((c: any) => c.homeAway === 'away')
      if (!homeComp || !awayComp) continue

      const homeCode = ESPN_TO_CODE[homeComp.team?.displayName ?? '']
      const awayCode = ESPN_TO_CODE[awayComp.team?.displayName ?? '']
      if (!homeCode || !awayCode) continue

      const statusType = comp.status?.type ?? {}
      const state      = statusType.state ?? 'pre'
      const completed  = statusType.completed ?? false
      const status     = espnState(state, completed)

      // "77'" → 77
      const minuteDisplay = statusType.shortDetail ?? ''
      const minuteNum     = status === 'live'
        ? (parseInt(minuteDisplay) || undefined)
        : undefined

      const events = parseEvents(comp.details ?? [], homeComp.team?.id ?? '')

      map.set(`${homeCode}:${awayCode}`, {
        homeScore: parseInt(homeComp.score ?? '0', 10),
        awayScore: parseInt(awayComp.score ?? '0', 10),
        status,
        minute: minuteNum,
        minuteDisplay,
        events,
      })
    }

    _cacheMap = map
    _cacheTs  = now
    return map
  } catch (err) {
    console.error('[espn-live] fetch error:', err)
    return _cacheMap ?? new Map()
  }
}

/**
 * Overlay live ESPN data on top of our static fixtures.
 * Only updates matches ESPN knows about (today's live/finished games).
 */
export function overlayEspnData(
  fixtures: MatchWithTeams[],
  espnMap: Map<string, EspnMatchSnapshot>,
): MatchWithTeams[] {
  return fixtures.map(m => {
    const snap = espnMap.get(`${m.homeTeamId}:${m.awayTeamId}`)
    if (!snap) return m
    // Only update if ESPN has a non-scheduled status OR it's a live/finished match
    if (snap.status === 'scheduled') return m
    return {
      ...m,
      homeScore: snap.homeScore,
      awayScore: snap.awayScore,
      status:    snap.status,
      minute:    snap.minute,
      events:    snap.events,
    }
  })
}
