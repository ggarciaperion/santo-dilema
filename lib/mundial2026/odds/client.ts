/**
 * The Odds API Client — Sports betting market intelligence
 * https://the-odds-api.com/
 *
 * Free tier: 500 requests/month
 * Includes: Pinnacle (sharp reference), Bet365, Betfair, DraftKings
 * Sport key: soccer_fifa_world_cup
 *
 * Set env var: ODDS_API_KEY=your_key_here
 *
 * Redis caching strategy:
 *   - Cache odds snapshots every 30min (TTL 35min)
 *   - Store last 5 snapshots per match for movement tracking
 *   - Key: mundial2026:odds:{matchId}
 *   - Movement key: mundial2026:odds_history:{matchId}
 */

import { Redis } from '@upstash/redis'
import type { OddsEntry, ValueAnalysis } from '../types'

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4'
const SPORT_KEY     = 'soccer_fifa_world_cup'
const CACHE_TTL_SEC = 35 * 60  // 35 minutes

// Sharp bookmakers (best market signals)
const SHARP_BOOKS = ['pinnacle', 'betfair_ex_eu', 'betfair']
// Public bookmakers (for sharp vs public divergence)
const PUBLIC_BOOKS = ['draftkings', 'fanduel', 'caesars', 'bet365']

function getRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return null
}

// Remove vig from decimal odds and return fair probabilities
function removeVig(homeOdds: number, drawOdds: number, awayOdds: number): {
  fairHome: number; fairDraw: number; fairAway: number; vig: number
} {
  const rawHome = 1 / homeOdds
  const rawDraw = 1 / drawOdds
  const rawAway = 1 / awayOdds
  const total   = rawHome + rawDraw + rawAway
  const vig     = total - 1
  return {
    fairHome: rawHome / total,
    fairDraw: rawDraw / total,
    fairAway: rawAway / total,
    vig,
  }
}

// Detect sharp money: if Pinnacle moves opposite to public books
function detectSharpSignal(
  sharpBook: OddsEntry | undefined,
  publicBook: OddsEntry | undefined,
): 'home' | 'draw' | 'away' | null {
  if (!sharpBook || !publicBook) return null

  // If Pinnacle has better home odds than public → sharp money on away
  // If Pinnacle has worse home odds than public → sharp money on home
  const homeDiff = sharpBook.homeOdds - publicBook.homeOdds
  const awayDiff = sharpBook.awayOdds - publicBook.awayOdds

  if (homeDiff > 0.08 && awayDiff < -0.08) return 'away'
  if (homeDiff < -0.08 && awayDiff > 0.08) return 'home'
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeOddsEntry(bookmaker: any): OddsEntry | null {
  try {
    const h2h = bookmaker.markets?.find((m: any) => m.key === 'h2h')
    if (!h2h) return null

    const outcomes = h2h.outcomes as any[]
    const home = outcomes.find(o => o.name !== 'Draw' && outcomes.indexOf(o) === 0)
    const draw = outcomes.find(o => o.name === 'Draw')
    const away = outcomes.find(o => o.name !== 'Draw' && outcomes.indexOf(o) > 0)

    if (!home || !draw || !away) return null

    return {
      bookmaker:  bookmaker.key,
      homeOdds:   home.price,
      drawOdds:   draw.price,
      awayOdds:   away.price,
      timestamp:  h2h.last_update,
    }
  } catch {
    return null
  }
}

export async function fetchMatchOdds(
  homeTeam: string,
  awayTeam: string,
): Promise<ValueAnalysis> {
  const apiKey = process.env.ODDS_API_KEY
  if (!apiKey) {
    return { hasOdds: false, marketSource: 'unavailable' }
  }

  const cacheKey = `mundial2026:odds:${homeTeam}:${awayTeam}`
  const redis    = getRedis()

  // Check cache first
  if (redis) {
    try {
      const cached = await redis.get<ValueAnalysis>(cacheKey)
      if (cached) return { ...cached, marketSource: 'cached' }
    } catch { /* ignore */ }
  }

  try {
    const url = `${ODDS_API_BASE}/sports/${SPORT_KEY}/odds?apiKey=${apiKey}&regions=eu,uk,us&markets=h2h&oddsFormat=decimal&bookmakers=${[...SHARP_BOOKS, ...PUBLIC_BOOKS].join(',')}`
    const res = await fetch(url, { next: { revalidate: 1800 } })

    if (!res.ok) {
      return { hasOdds: false, marketSource: 'unavailable' }
    }

    const events = await res.json() as any[]

    // Find the matching event
    const event = events.find(e => {
      const h = e.home_team?.toLowerCase() ?? ''
      const a = e.away_team?.toLowerCase() ?? ''
      return (
        (h.includes(homeTeam.toLowerCase()) || homeTeam.toLowerCase().includes(h.slice(0, 4))) &&
        (a.includes(awayTeam.toLowerCase()) || awayTeam.toLowerCase().includes(a.slice(0, 4)))
      )
    })

    if (!event) {
      return { hasOdds: false, marketSource: 'unavailable' }
    }

    const bookmakerEntries: OddsEntry[] = event.bookmakers
      .map(normalizeOddsEntry)
      .filter(Boolean) as OddsEntry[]

    if (bookmakerEntries.length === 0) {
      return { hasOdds: false, marketSource: 'unavailable' }
    }

    // Best odds (max decimal across books)
    const bestHome = Math.max(...bookmakerEntries.map(b => b.homeOdds))
    const bestDraw = Math.max(...bookmakerEntries.map(b => b.drawOdds))
    const bestAway = Math.max(...bookmakerEntries.map(b => b.awayOdds))

    // Pinnacle (sharp reference)
    const pinnacle = bookmakerEntries.find(b => SHARP_BOOKS.includes(b.bookmaker))
    const publicBk = bookmakerEntries.find(b => PUBLIC_BOOKS.includes(b.bookmaker))

    // Fair odds from Pinnacle (sharp reference with ~2% margin)
    const fair = pinnacle
      ? removeVig(pinnacle.homeOdds, pinnacle.drawOdds, pinnacle.awayOdds)
      : removeVig(bestHome, bestDraw, bestAway)

    const result: ValueAnalysis = {
      hasOdds: true,
      bestHomeOdds: bestHome,
      bestDrawOdds: bestDraw,
      bestAwayOdds: bestAway,
      pinnacleHomeOdds: pinnacle?.homeOdds,
      pinnacleDrawOdds: pinnacle?.drawOdds,
      pinnacleAwayOdds: pinnacle?.awayOdds,
      fairHomeProb: fair.fairHome,
      fairDrawProb: fair.fairDraw,
      fairAwayProb: fair.fairAway,
      sharpSignal: detectSharpSignal(pinnacle, publicBk),
      marketSource: 'live',
    }

    // Cache result
    if (redis) {
      await redis.set(cacheKey, result, { ex: CACHE_TTL_SEC }).catch(() => {})
    }

    return result
  } catch (err) {
    console.error('[odds] fetch error:', err)
    return { hasOdds: false, marketSource: 'unavailable' }
  }
}

// Calculate EV and value flags after getting model probabilities
export function enrichWithValue(
  value:    ValueAnalysis,
  modelH:   number,
  modelD:   number,
  modelA:   number,
): ValueAnalysis {
  if (!value.hasOdds || !value.fairHomeProb) return value

  const threshold = 0.05  // 5% edge required to flag as value

  const homeEV = modelH * (value.bestHomeOdds ?? 1) - 1
  const drawEV = modelD * (value.bestDrawOdds ?? 1) - 1
  const awayEV = modelA * (value.bestAwayOdds ?? 1) - 1

  return {
    ...value,
    homeEV,
    drawEV,
    awayEV,
    valueHome:  modelH - (value.fairHomeProb ?? 0) > threshold,
    valueDraw:  modelD - (value.fairDrawProb  ?? 0) > threshold,
    valueAway:  modelA - (value.fairAwayProb  ?? 0) > threshold,
  }
}
