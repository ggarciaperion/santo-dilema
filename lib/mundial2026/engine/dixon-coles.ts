/**
 * Dixon-Coles Bivariate Poisson Model
 *
 * Dixon, M. J. & Coles, S. G. (1997). Modelling association football scores
 * and inefficiencies in the football betting market.
 * Journal of the Royal Statistical Society: Series C.
 *
 * The model fixes the base Poisson's systematic underestimation of
 * low-scoring draws (0-0, 1-1) via the τ (tau) correction.
 *
 * Expected goals:
 *   λ_h = attack_h × defense_a × avgGoals × homeAdv
 *   μ_a = attack_a × defense_h × avgGoals
 *
 * Score probability:
 *   P(X:Y) = τ(X,Y,λ,μ,ρ) × Poisson(X,λ) × Poisson(Y,μ)
 */

import type { DixonColesResult, ScoreProbability } from '../types'
import { getTeamParams, AVG_GOALS_BASE, DC_RHO, HOST_ADVANTAGE, NEUTRAL_VENUE_ADV } from '../data/team-params'

// Dixon-Coles τ correction factor
function tau(x: number, y: number, lambda: number, mu: number, rho: number): number {
  if (x === 0 && y === 0) return 1 - lambda * mu * rho
  if (x === 1 && y === 0) return 1 + mu * rho
  if (x === 0 && y === 1) return 1 + lambda * rho
  if (x === 1 && y === 1) return 1 - rho
  return 1
}

// Poisson probability mass function
function poisson(k: number, lambda: number): number {
  if (k < 0 || lambda <= 0) return 0
  let logP = -lambda + k * Math.log(lambda)
  for (let i = 1; i <= k; i++) logP -= Math.log(i)
  return Math.exp(logP)
}

export interface DCInput {
  homeCode: string
  awayCode: string
  // venue type affects home advantage
  venueType: 'home' | 'neutral' | 'host'
}

export function calcDixonColes(input: DCInput): DixonColesResult {
  const { homeCode, awayCode, venueType } = input
  const hp = getTeamParams(homeCode)
  const ap = getTeamParams(awayCode)

  // Home advantage multiplier
  let homeAdv = NEUTRAL_VENUE_ADV
  if (venueType === 'host') homeAdv = HOST_ADVANTAGE
  // For World Cup (all neutral venues), home teams still get a small crowd edge

  // Expected goals (Dixon-Coles parameters)
  const lambda = hp.attack * ap.defense * AVG_GOALS_BASE * homeAdv
  const mu     = ap.attack * hp.defense * AVG_GOALS_BASE

  const rho = DC_RHO
  const maxGoals = 7

  // Build score probability matrix
  const matrix: number[][] = Array.from({ length: maxGoals + 1 }, () =>
    new Array(maxGoals + 1).fill(0)
  )

  let homeWin = 0
  let draw    = 0
  let awayWin = 0

  for (let x = 0; x <= maxGoals; x++) {
    for (let y = 0; y <= maxGoals; y++) {
      const p = tau(x, y, lambda, mu, rho) * poisson(x, lambda) * poisson(y, mu)
      matrix[x][y] = Math.max(0, p)

      if (x > y) homeWin += matrix[x][y]
      else if (x === y) draw += matrix[x][y]
      else awayWin += matrix[x][y]
    }
  }

  // Normalize (rho correction can slightly shift mass)
  const total = homeWin + draw + awayWin
  homeWin /= total
  draw    /= total
  awayWin /= total

  // Top scorelines
  const scores: ScoreProbability[] = []
  for (let x = 0; x <= maxGoals; x++) {
    for (let y = 0; y <= maxGoals; y++) {
      scores.push({ homeGoals: x, awayGoals: y, probability: matrix[x][y] / total })
    }
  }
  scores.sort((a, b) => b.probability - a.probability)

  return {
    homeWin,
    draw,
    awayWin,
    expectedGoalsH: lambda,
    expectedGoalsA: mu,
    rho,
    scoreMatrix: matrix,
  }
}

export function getTopScores(dc: DixonColesResult, n = 10): ScoreProbability[] {
  const scores: ScoreProbability[] = []
  const total = dc.homeWin + dc.draw + dc.awayWin
  const norm  = total > 0 ? total : 1

  for (let x = 0; x < dc.scoreMatrix.length; x++) {
    for (let y = 0; y < dc.scoreMatrix[x].length; y++) {
      scores.push({
        homeGoals: x,
        awayGoals: y,
        probability: dc.scoreMatrix[x][y] / norm,
      })
    }
  }

  return scores
    .filter(s => s.homeGoals + s.awayGoals <= 8)
    .sort((a, b) => b.probability - a.probability)
    .slice(0, n)
}
