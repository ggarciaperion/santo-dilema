/**
 * Prediction orchestrator — uses full professional engine stack
 *
 * Pipeline:
 *   1. Dixon-Coles bivariate Poisson (primary model)
 *   2. Monte Carlo simulation (100,000 iterations)
 *   3. Bayesian updating (recent form prior + opponent quality)
 *   4. ELO model (long-run strength)
 *   5. H2H adjustment layer (up to ±15% blend)
 *   6. Ensemble weighting (40/30/20/10)
 *   7. Confidence assessment
 *   8. Value analysis (if odds available)
 *
 * Cache: Upstash Redis (prod) with 6h TTL; in-process Map fallback (dev)
 */

import type {
  Team, Venue, Phase, Prediction, AdvancedPrediction,
  EloModel, ValueAnalysis,
} from './types'

import { calcDixonColes } from './engine/dixon-coles'
import { runMonteCarlo } from './engine/monte-carlo'
import { calcBayesian } from './engine/bayesian'
import {
  buildEnsemble, buildConfidence, buildRadar,
  generateInsight, mergeTopScores,
} from './engine/ensemble'
import { enrichWithValue } from './odds/client'

// ── Redis client (prod only) ───────────────────────────────────────
let _redis: any = null
async function getRedis() {
  if (_redis) return _redis
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import('@upstash/redis')
    _redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return _redis
}

const CACHE_KEY   = (matchId: string) => `mundial2026:pred:v2:${matchId}`
const CACHE_TTL   = 60 * 60 * 6  // 6 hours

// In-process fallback (dev / same serverless instance)
const _localCache = new Map<string, AdvancedPrediction>()

// ── ELO model (retained for ensemble input) ───────────────────────
function calcElo(home: Team, away: Team, neutralVenue = true): EloModel {
  const homeAdv = neutralVenue ? 0 : 100
  const E_h = 1 / (1 + Math.pow(10, (away.eloRating - home.eloRating - homeAdv) / 400))
  const E_a = 1 / (1 + Math.pow(10, (home.eloRating + homeAdv - away.eloRating) / 400))

  const eloDiff = Math.abs(home.eloRating - away.eloRating)
  const drawProb = Math.max(0.10, 0.28 - eloDiff * 0.0003)

  return {
    homeWin: E_h * (1 - drawProb),
    draw:    drawProb,
    awayWin: E_a * (1 - drawProb),
  }
}

export function generatePrediction(
  home: Team,
  away: Team,
  matchId: string,
  neutralVenue = true,
  _phase: Phase = 'groups',
  venue?: Venue,
  precomputedValue?: ValueAnalysis,
): Prediction {
  const adv = generateAdvancedPrediction(home, away, matchId, neutralVenue, venue, precomputedValue)
  return legacyFromAdvanced(adv)
}

export function generateAdvancedPrediction(
  home:             Team,
  away:             Team,
  matchId:          string,
  neutralVenue     = true,
  venue?:           Venue,
  precomputedValue?: ValueAnalysis,
): AdvancedPrediction {
  // Check in-process cache first (free, synchronous)
  const localHit = _localCache.get(matchId)
  if (localHit) return localHit

  const isHost =
    (home.code === 'MEX' || home.code === 'USA' || home.code === 'CAN')
  const venueType = isHost ? 'host' : 'neutral'

  // ── Models ──────────────────────────────────────────────────────
  const dc    = calcDixonColes({ homeCode: home.code, awayCode: away.code, venueType })
  const mc    = runMonteCarlo({ expectedGoalsH: dc.expectedGoalsH, expectedGoalsA: dc.expectedGoalsA, iterations: 100000 })
  const bayes = calcBayesian({ homeCode: home.code, awayCode: away.code })
  const elo   = calcElo(home, away, neutralVenue)

  const ensemble   = buildEnsemble(dc, mc, bayes, elo, home.code, away.code)
  const topScores  = mergeTopScores(dc, mc)
  const homeRadar  = buildRadar(home.code)
  const awayRadar  = buildRadar(away.code)

  const baseValue  = precomputedValue ?? { hasOdds: false, marketSource: 'unavailable' as const }
  const value      = enrichWithValue(baseValue, ensemble.homeWin, ensemble.draw, ensemble.awayWin)

  const altitude   = venue?.altitude ?? 0
  const confidence = buildConfidence(home.code, away.code, ensemble, dc, mc, bayes, altitude)
  const insight    = generateInsight(home.code, away.code, ensemble, dc, value, altitude)

  const adv: AdvancedPrediction = {
    matchId,
    generatedAt: new Date().toISOString(),
    homeWinProb: ensemble.homeWin,
    drawProb:    ensemble.draw,
    awayWinProb: ensemble.awayWin,
    topScores,
    models: { dixonColes: dc, monteCarlo: mc, bayesian: bayes, elo, ensemble },
    homeRadar,
    awayRadar,
    valueAnalysis: value,
    confidence,
    insight,
  }

  _localCache.set(matchId, adv)
  return adv
}

/**
 * Async version with Redis cache (call from API routes)
 * Falls back to synchronous generation if Redis is unavailable.
 */
export async function generateAdvancedPredictionCached(
  home:             Team,
  away:             Team,
  matchId:          string,
  neutralVenue     = true,
  venue?:           Venue,
  precomputedValue?: ValueAnalysis,
): Promise<AdvancedPrediction> {
  // 1. In-process cache
  const localHit = _localCache.get(matchId)
  if (localHit) return localHit

  // 2. Redis cache
  const redis = await getRedis()
  if (redis) {
    try {
      const cached = await redis.get(CACHE_KEY(matchId))
      if (cached) {
        const adv = cached as AdvancedPrediction
        _localCache.set(matchId, adv)  // warm local cache too
        return adv
      }
    } catch { /* Redis miss — compute fresh */ }
  }

  // 3. Compute
  const adv = generateAdvancedPrediction(home, away, matchId, neutralVenue, venue, precomputedValue)

  // 4. Persist to Redis
  if (redis) {
    try {
      await redis.set(CACHE_KEY(matchId), adv, { ex: CACHE_TTL })
    } catch { /* non-fatal */ }
  }

  return adv
}

function legacyFromAdvanced(adv: AdvancedPrediction): Prediction {
  const dc = adv.models.dixonColes
  return {
    matchId:          adv.matchId,
    generatedAt:      adv.generatedAt,
    homeWinProb:      adv.homeWinProb,
    drawProb:         adv.drawProb,
    awayWinProb:      adv.awayWinProb,
    mostLikelyScores: adv.topScores.slice(0, 5),
    confidence:       adv.confidence.level,
    summary:          adv.confidence.summary,
    models: {
      elo:     adv.models.elo,
      poisson: {
        homeWin: dc.homeWin, draw: dc.draw, awayWin: dc.awayWin,
        expectedGoalsH: dc.expectedGoalsH, expectedGoalsA: dc.expectedGoalsA,
      },
      ensemble: { homeWin: adv.homeWinProb, draw: adv.drawProb, awayWin: adv.awayWinProb },
    },
    advanced: adv,
  }
}

export function invalidatePredictionCache(matchId?: string) {
  if (matchId) _localCache.delete(matchId)
  else _localCache.clear()

  // Note: Redis invalidation must be called separately if needed
  // (async, call invalidatePredictionCacheRedis from an API route)
}

export async function invalidatePredictionCacheRedis(matchId?: string) {
  const redis = await getRedis()
  if (!redis) return
  if (matchId) {
    await redis.del(CACHE_KEY(matchId))
  } else {
    // Pattern delete — use carefully (admin only)
    const keys = await redis.keys('mundial2026:pred:v2:*')
    if (keys.length > 0) await redis.del(...keys)
  }
  invalidatePredictionCache(matchId)
}
