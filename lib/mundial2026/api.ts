/**
 * API-Football client for WC 2026 data
 * Docs: https://www.api-football.com/documentation-v3
 *
 * Env var required: FOOTBALL_API_KEY
 * Free tier: 100 requests/day
 * Cache strategy: Redis with generous TTLs to minimize API calls
 */

import { Redis } from '@upstash/redis'
import type { Match, MatchWithTeams, Phase, ApiFixturesResponse } from './types'
import { TEAMS, getTeam } from './teams'
import { VENUES, getVenue } from './venues'
import { getStaticFixtures } from './static-fixtures'
import { getEspnLiveMap, overlayEspnData } from './espn-live'

const BASE_URL  = 'https://v3.football.api-sports.io'
const LEAGUE_ID = 1     // FIFA World Cup
const SEASON    = 2026

// Cache TTLs (seconds)
const TTL_FIXTURES  = 60 * 60 * 6   // 6 hours  — fixture list
const TTL_LIVE      = 60 * 3         // 3 min    — during active matches
const TTL_STANDINGS = 60 * 60 * 2   // 2 hours  — group standings

const CACHE_KEY_FIXTURES = 'mundial2026:fixtures:all'

// ── Redis ─────────────────────────────────────────────────────────

function getRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return null
}

// ── API-Football fetch helper ─────────────────────────────────────

async function apiFetch<T>(endpoint: string): Promise<T | null> {
  const key = process.env.FOOTBALL_API_KEY
  if (!key) {
    console.warn('[mundial2026] FOOTBALL_API_KEY not set — API calls disabled')
    return null
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'x-apisports-key': key },
      next: { revalidate: TTL_FIXTURES },
    })

    if (!res.ok) {
      console.error(`[mundial2026] API error ${res.status}: ${endpoint}`)
      return null
    }

    const json = await res.json()
    if (json.errors && Object.keys(json.errors).length > 0) {
      console.error('[mundial2026] API errors:', json.errors)
      return null
    }

    return json.response as T
  } catch (err) {
    console.error('[mundial2026] fetch error:', err)
    return null
  }
}

// ── Normalize API-Football fixture → our Match type ───────────────

function phaseFromRound(round: string): Phase {
  const r = round.toLowerCase()
  if (r.includes('group'))            return 'groups'
  if (r.includes('round of 32'))      return 'round32'
  if (r.includes('round of 16'))      return 'round16'
  if (r.includes('quarter'))          return 'quarterfinal'
  if (r.includes('semi'))             return 'semifinal'
  if (r.includes('3rd') || r.includes('third')) return 'thirdplace'
  if (r.includes('final'))            return 'final'
  return 'groups'
}

function statusFromApi(short: string): Match['status'] {
  if (['1H','2H','HT','ET','BT','P','INT'].includes(short)) return 'live'
  if (['FT','AET','PEN'].includes(short))                   return 'finished'
  if (short === 'PST')                                      return 'postponed'
  return 'scheduled'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeFixture(f: any): MatchWithTeams | null {
  try {
    const homeCode = f.teams?.home?.name ? codeFromApiName(f.teams.home.name) : null
    const awayCode = f.teams?.away?.name ? codeFromApiName(f.teams.away.name) : null
    if (!homeCode || !awayCode) return null

    const home = getTeam(homeCode)
    const away = getTeam(awayCode)

    const venueId = venueIdFromApiVenue(f.fixture?.venue?.name ?? '', f.fixture?.venue?.city ?? '')

    const phase = phaseFromRound(f.league?.round ?? '')
    const group = (f.league?.round as string)?.match(/Group ([A-L])/i)?.[1] ?? undefined

    return {
      id:             String(f.fixture?.id),
      apiFootballId:  f.fixture?.id,
      homeTeamId:     homeCode,
      awayTeamId:     awayCode,
      home,
      away,
      homeScore:      f.goals?.home  ?? undefined,
      awayScore:      f.goals?.away  ?? undefined,
      date:           f.fixture?.date ?? '',
      venue:          getVenue(venueId),
      phase,
      group,
      matchday:       extractMatchday(f.league?.round ?? ''),
      status:         statusFromApi(f.fixture?.status?.short ?? 'NS'),
      minute:         f.fixture?.status?.elapsed ?? undefined,
    }
  } catch {
    return null
  }
}

function extractMatchday(round: string): number | undefined {
  const m = round.match(/(\d+)/)
  return m ? parseInt(m[1]) : undefined
}

// ── Name → FIFA code mapping ──────────────────────────────────────
// API-Football uses full English country names

const API_NAME_TO_CODE: Record<string, string> = {
  'Argentina': 'ARG', 'Brazil': 'BRA', 'Colombia': 'COL', 'Ecuador': 'ECU',
  'Uruguay': 'URU', 'Venezuela': 'VEN', 'United States': 'USA', 'Mexico': 'MEX',
  'Canada': 'CAN', 'Panama': 'PAN', 'Honduras': 'HON', 'Jamaica': 'JAM',
  'France': 'FRA', 'England': 'ENG', 'Germany': 'GER', 'Spain': 'ESP',
  'Portugal': 'POR', 'Netherlands': 'NED', 'Belgium': 'BEL', 'Switzerland': 'SUI',
  'Denmark': 'DEN', 'Austria': 'AUT', 'Scotland': 'SCO', 'Serbia': 'SRB',
  'Croatia': 'CRO', 'Poland': 'POL', 'Romania': 'ROM', 'Turkey': 'TUR',
  'Morocco': 'MAR', 'Senegal': 'SEN', 'Nigeria': 'NGA', "Ivory Coast": 'CIV',
  "Côte d'Ivoire": 'CIV', 'Egypt': 'EGY', 'Algeria': 'ALG', 'Cameroon': 'CMR',
  'Tunisia': 'TUN', 'South Africa': 'ZAF', 'Japan': 'JPN', 'South Korea': 'KOR',
  'Korea Republic': 'KOR', 'Iran': 'IRN', 'Australia': 'AUS', 'Jordan': 'JOR',
  'Qatar': 'QAT', 'Saudi Arabia': 'SAU', 'Uzbekistan': 'UZB', 'New Zealand': 'NZL',
  'Bolivia': 'BOL', 'Ghana': 'GHA',
}

function codeFromApiName(name: string): string | null {
  if (API_NAME_TO_CODE[name]) return API_NAME_TO_CODE[name]
  // Fallback: check by apiFootballId or shortName match in TEAMS
  const found = Object.values(TEAMS).find(
    t => t.name.toLowerCase() === name.toLowerCase() ||
         t.shortName.toLowerCase() === name.toLowerCase()
  )
  return found?.id ?? null
}

function venueIdFromApiVenue(name: string, city: string): string {
  const n = name.toLowerCase()
  const c = city.toLowerCase()
  if (n.includes('azteca'))    return 'azteca'
  if (n.includes('akron'))     return 'akron'
  if (n.includes('bbva'))      return 'bbva'
  if (n.includes('metlife'))   return 'metlife'
  if (n.includes('at&t') || n.includes('att')) return 'atandt'
  if (n.includes('sofi'))      return 'sofi'
  if (n.includes('hard rock')) return 'hardrock'
  if (n.includes("levi"))      return 'levis'
  if (n.includes('arrowhead')) return 'arrowhead'
  if (n.includes('lincoln'))   return 'lincoln'
  if (n.includes('gillette'))  return 'gillette'
  if (n.includes('nrg'))       return 'nrg'
  if (n.includes('bc place'))  return 'bcplace'
  if (n.includes('bmo'))       return 'bmo'
  // Fallback by city
  if (c.includes('dallas') || c.includes('arlington')) return 'atandt'
  if (c.includes('new york') || c.includes('rutherford')) return 'metlife'
  if (c.includes('los angeles') || c.includes('inglewood')) return 'sofi'
  if (c.includes('miami'))     return 'hardrock'
  if (c.includes('houston'))   return 'nrg'
  if (c.includes('kansas'))    return 'arrowhead'
  if (c.includes('philadelphia')) return 'lincoln'
  if (c.includes('boston') || c.includes('foxborough')) return 'gillette'
  if (c.includes('santa clara') || c.includes('san francisco')) return 'levis'
  if (c.includes('seattle'))   return 'nrg'
  if (c.includes('vancouver')) return 'bcplace'
  if (c.includes('toronto'))   return 'bmo'
  if (c.includes('guadalajara')) return 'akron'
  if (c.includes('monterrey')) return 'bbva'
  return 'metlife'  // default
}

// ── Main data access function ─────────────────────────────────────

export async function getFixtures(): Promise<ApiFixturesResponse> {
  const redis = getRedis()

  // 1. Check cache
  if (redis) {
    try {
      const cached = await redis.get<{ fixtures: MatchWithTeams[]; cachedAt: string }>(CACHE_KEY_FIXTURES)
      if (cached) {
        const cachedAt = new Date(cached.cachedAt)
        const nextRefresh = new Date(cachedAt.getTime() + TTL_FIXTURES * 1000)
        return {
          fixtures: cached.fixtures,
          source: 'cache',
          cachedAt: cached.cachedAt,
          nextRefresh: nextRefresh.toISOString(),
        }
      }
    } catch (e) {
      console.warn('[mundial2026] Redis read error:', e)
    }
  }

  // 2. Fetch from API-Football
  const apiKey = process.env.FOOTBALL_API_KEY
  if (apiKey) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await apiFetch<any[]>(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}`)
    if (raw && Array.isArray(raw) && raw.length > 0) {
      const fixtures = raw
        .map(normalizeFixture)
        .filter((f): f is MatchWithTeams => f !== null)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      const payload = { fixtures, cachedAt: new Date().toISOString() }

      if (redis) {
        const ttl = fixtures.some(f => f.status === 'live') ? TTL_LIVE : TTL_FIXTURES
        await redis.set(CACHE_KEY_FIXTURES, payload, { ex: ttl }).catch(() => {})
      }

      return {
        fixtures,
        source: 'api',
        cachedAt: payload.cachedAt,
        nextRefresh: new Date(Date.now() + TTL_FIXTURES * 1000).toISOString(),
      }
    }
  }

  // 3. Fallback: static data + ESPN live overlay (free, no key needed)
  const staticFixtures = getStaticFixtures()
  const espnMap        = await getEspnLiveMap()
  const fixtures       = overlayEspnData(staticFixtures, espnMap)
  return { fixtures, source: 'fallback', cachedAt: new Date().toISOString() }
}

// ── Cache invalidation ────────────────────────────────────────────

export async function invalidateCache(): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return false
  try {
    await redis.del(CACHE_KEY_FIXTURES)
    return true
  } catch {
    return false
  }
}

// ── Standings ─────────────────────────────────────────────────────

export async function getStandings(): Promise<unknown | null> {
  const redis = getRedis()
  const cacheKey = 'mundial2026:standings'

  if (redis) {
    const cached = await redis.get(cacheKey).catch(() => null)
    if (cached) return cached
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await apiFetch<any>(`/standings?league=${LEAGUE_ID}&season=${SEASON}`)
  if (raw && redis) {
    await redis.set(cacheKey, raw, { ex: TTL_STANDINGS }).catch(() => {})
  }
  return raw
}
