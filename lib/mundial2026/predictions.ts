/**
 * Prediction orchestrator — uses full professional engine stack
 *
 * Pipeline:
 *   1. Dixon-Coles bivariate Poisson (primary model)
 *   2. Monte Carlo simulation (50,000 iterations)
 *   3. Bayesian updating (recent form prior)
 *   4. ELO model (long-run strength)
 *   5. Ensemble weighting (40/30/20/10)
 *   6. Confidence assessment
 *   7. Value analysis (if odds available)
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

// In-process cache (cleared on deploy/cold start)
const _cache = new Map<string, AdvancedPrediction>()

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
  const cached = _cache.get(matchId)
  if (cached) return cached

  const isHost =
    (home.code === 'MEX' || home.code === 'USA' || home.code === 'CAN')
  const venueType = isHost ? 'host' : 'neutral'

  // ── Models ──────────────────────────────────────────────────────
  const dc    = calcDixonColes({ homeCode: home.code, awayCode: away.code, venueType })
  const mc    = runMonteCarlo({ expectedGoalsH: dc.expectedGoalsH, expectedGoalsA: dc.expectedGoalsA, iterations: 50000 })
  const bayes = calcBayesian({ homeCode: home.code, awayCode: away.code })
  const elo   = calcElo(home, away, neutralVenue)

  const ensemble   = buildEnsemble(dc, mc, bayes, elo)
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

  _cache.set(matchId, adv)
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
  if (matchId) _cache.delete(matchId)
  else _cache.clear()
}
