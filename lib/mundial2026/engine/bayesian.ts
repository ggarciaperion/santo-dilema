/**
 * Bayesian Team Strength Estimation
 *
 * Uses a Beta distribution prior on win probability,
 * updated with recent match results (last 15 competitive games).
 *
 * Prior: Based on ELO rating difference (converted to win probability)
 * Likelihood: Match outcomes weighted by recency and competition level
 * Posterior: Beta(α, β) → P(win) = α / (α + β)
 *
 * Competition weights:
 *   World Cup / Major final: 3.0
 *   Copa América / Euros / AFCON: 2.5
 *   WC Qualifiers: 2.0
 *   Friendlies: 1.0
 */

import type { BayesianResult } from '../types'
import { getTeamParams } from '../data/team-params'
import { TEAMS } from '../teams'

// Beta distribution: 95% HPD interval via numerical approximation
function betaHPD(alpha: number, beta: number): [number, number] {
  const mean = alpha / (alpha + beta)
  // Approximate using normal approximation to Beta
  const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1))
  const sd = Math.sqrt(variance)
  return [
    Math.max(0, mean - 1.96 * sd),
    Math.min(1, mean + 1.96 * sd),
  ]
}

// Convert ELO difference to win probability (simplified logistic)
function eloToWinProb(eloHome: number, eloAway: number): number {
  return 1 / (1 + Math.pow(10, (eloAway - eloHome) / 400))
}

// Recent form data per team — last 15 competitive matches
// [result, competition_weight, recency_weight (0-1, 1=most recent)]
// result: 1=win, 0.5=draw, 0=loss
interface RecentResult {
  result: number           // 1=W, 0.5=D, 0=L
  compWeight: number       // competition importance
}

// Pre-computed form data from qualifiers + recent tournaments
// Format: [result (1/0.5/0), competition_weight]
const TEAM_FORM: Record<string, RecentResult[]> = {
  // Group A
  MEX: [
    {result:1,compWeight:2.0},{result:1,compWeight:2.0},{result:0,compWeight:2.5},
    {result:1,compWeight:2.0},{result:0.5,compWeight:2.0},{result:1,compWeight:2.0},
    {result:1,compWeight:2.0},{result:0,compWeight:2.5},{result:1,compWeight:2.0},
    {result:1,compWeight:2.0},{result:0.5,compWeight:2.0},{result:1,compWeight:2.0},
    {result:0,compWeight:2.0},{result:1,compWeight:2.5},{result:1,compWeight:2.0},
  ],
  ZAF: [
    {result:1,compWeight:2.0},{result:0,compWeight:2.0},{result:0.5,compWeight:1.0},
    {result:1,compWeight:2.0},{result:0,compWeight:2.0},{result:0,compWeight:1.0},
    {result:1,compWeight:2.0},{result:0.5,compWeight:2.0},{result:0,compWeight:1.0},
    {result:1,compWeight:2.0},{result:0,compWeight:2.5},{result:0.5,compWeight:1.0},
    {result:1,compWeight:2.0},{result:0,compWeight:2.0},{result:1,compWeight:1.0},
  ],
  KOR: [
    {result:1,compWeight:2.0},{result:1,compWeight:2.0},{result:0,compWeight:2.0},
    {result:0.5,compWeight:2.0},{result:1,compWeight:2.0},{result:0,compWeight:1.0},
    {result:1,compWeight:2.0},{result:1,compWeight:2.0},{result:0.5,compWeight:2.0},
    {result:0,compWeight:2.0},{result:1,compWeight:2.0},{result:1,compWeight:1.0},
    {result:0,compWeight:2.5},{result:1,compWeight:2.0},{result:1,compWeight:2.0},
  ],
  CZE: [
    {result:1,compWeight:2.0},{result:1,compWeight:2.0},{result:0.5,compWeight:2.0},
    {result:0,compWeight:2.0},{result:1,compWeight:2.0},{result:1,compWeight:1.0},
    {result:0,compWeight:2.5},{result:1,compWeight:2.0},{result:0.5,compWeight:2.0},
    {result:1,compWeight:2.0},{result:0,compWeight:2.0},{result:1,compWeight:1.0},
    {result:1,compWeight:2.0},{result:0,compWeight:2.0},{result:1,compWeight:2.0},
  ],
  // Group B
  CAN: [
    {result:1,compWeight:2.0},{result:1,compWeight:2.5},{result:0,compWeight:2.5},
    {result:1,compWeight:2.0},{result:1,compWeight:2.0},{result:0.5,compWeight:2.0},
    {result:1,compWeight:2.0},{result:0,compWeight:2.5},{result:1,compWeight:2.0},
    {result:1,compWeight:2.0},{result:0.5,compWeight:2.0},{result:1,compWeight:2.0},
    {result:0,compWeight:2.0},{result:1,compWeight:2.0},{result:1,compWeight:2.0},
  ],
  BIH: [
    {result:0.5,compWeight:2.0},{result:1,compWeight:2.0},{result:0,compWeight:2.0},
    {result:1,compWeight:2.0},{result:0,compWeight:2.0},{result:1,compWeight:1.0},
    {result:0.5,compWeight:2.0},{result:0,compWeight:2.0},{result:1,compWeight:2.0},
    {result:0,compWeight:2.0},{result:1,compWeight:1.0},{result:0.5,compWeight:2.0},
    {result:1,compWeight:2.0},{result:0,compWeight:2.0},{result:1,compWeight:2.0},
  ],
  QAT: [
    {result:0,compWeight:2.0},{result:1,compWeight:2.0},{result:0,compWeight:1.0},
    {result:0,compWeight:2.0},{result:1,compWeight:2.0},{result:0,compWeight:2.0},
    {result:0.5,compWeight:1.0},{result:0,compWeight:2.0},{result:1,compWeight:1.0},
    {result:0,compWeight:2.0},{result:0,compWeight:2.0},{result:1,compWeight:2.0},
    {result:0,compWeight:3.0},{result:0,compWeight:3.0},{result:0,compWeight:3.0},
  ],
  SUI: [
    {result:1,compWeight:2.5},{result:1,compWeight:2.5},{result:0.5,compWeight:2.5},
    {result:1,compWeight:2.0},{result:0,compWeight:2.5},{result:1,compWeight:2.0},
    {result:1,compWeight:2.0},{result:0.5,compWeight:2.0},{result:1,compWeight:2.5},
    {result:1,compWeight:2.0},{result:0,compWeight:2.5},{result:1,compWeight:2.0},
    {result:1,compWeight:2.0},{result:0.5,compWeight:2.5},{result:1,compWeight:2.0},
  ],
  // Top teams — more abbreviated for space
  BRA: [
    {result:1,compWeight:2.5},{result:1,compWeight:2.5},{result:1,compWeight:2.0},
    {result:0,compWeight:2.5},{result:1,compWeight:2.0},{result:1,compWeight:2.5},
    {result:0.5,compWeight:2.0},{result:1,compWeight:2.5},{result:1,compWeight:2.0},
    {result:0,compWeight:3.0},{result:1,compWeight:2.0},{result:1,compWeight:2.5},
    {result:1,compWeight:2.0},{result:1,compWeight:2.5},{result:0,compWeight:2.0},
  ],
  ARG: [
    {result:1,compWeight:2.5},{result:1,compWeight:3.0},{result:1,compWeight:2.5},
    {result:1,compWeight:2.5},{result:1,compWeight:2.5},{result:0.5,compWeight:2.5},
    {result:1,compWeight:2.0},{result:1,compWeight:3.0},{result:1,compWeight:2.5},
    {result:0,compWeight:2.5},{result:1,compWeight:2.5},{result:1,compWeight:2.5},
    {result:1,compWeight:2.0},{result:1,compWeight:2.5},{result:1,compWeight:3.0},
  ],
  FRA: [
    {result:1,compWeight:2.5},{result:1,compWeight:2.5},{result:0.5,compWeight:2.5},
    {result:1,compWeight:2.5},{result:1,compWeight:3.0},{result:0,compWeight:2.5},
    {result:1,compWeight:2.5},{result:1,compWeight:2.5},{result:1,compWeight:2.0},
    {result:1,compWeight:2.5},{result:0,compWeight:3.0},{result:1,compWeight:2.5},
    {result:1,compWeight:2.5},{result:1,compWeight:2.5},{result:0.5,compWeight:2.0},
  ],
  ESP: [
    {result:1,compWeight:3.0},{result:1,compWeight:3.0},{result:1,compWeight:3.0},
    {result:1,compWeight:3.0},{result:1,compWeight:3.0},{result:1,compWeight:3.0},
    {result:1,compWeight:2.5},{result:1,compWeight:2.5},{result:0.5,compWeight:2.5},
    {result:1,compWeight:2.5},{result:1,compWeight:2.5},{result:1,compWeight:2.0},
    {result:0,compWeight:2.5},{result:1,compWeight:2.5},{result:1,compWeight:2.5},
  ],
  ENG: [
    {result:1,compWeight:2.5},{result:0.5,compWeight:3.0},{result:1,compWeight:2.5},
    {result:1,compWeight:2.5},{result:1,compWeight:2.5},{result:0,compWeight:3.0},
    {result:1,compWeight:2.5},{result:1,compWeight:2.5},{result:1,compWeight:2.0},
    {result:0.5,compWeight:2.5},{result:1,compWeight:2.5},{result:1,compWeight:2.5},
    {result:0,compWeight:2.5},{result:1,compWeight:2.5},{result:1,compWeight:2.0},
  ],
  GER: [
    {result:1,compWeight:2.5},{result:1,compWeight:2.5},{result:0,compWeight:2.5},
    {result:1,compWeight:2.5},{result:1,compWeight:2.5},{result:1,compWeight:2.5},
    {result:0.5,compWeight:2.5},{result:1,compWeight:2.5},{result:1,compWeight:2.0},
    {result:1,compWeight:2.5},{result:0,compWeight:2.5},{result:1,compWeight:2.5},
    {result:1,compWeight:2.0},{result:1,compWeight:2.5},{result:0,compWeight:2.5},
  ],
  POR: [
    {result:1,compWeight:2.5},{result:1,compWeight:2.5},{result:1,compWeight:2.5},
    {result:1,compWeight:2.5},{result:0,compWeight:2.5},{result:1,compWeight:2.5},
    {result:1,compWeight:2.0},{result:1,compWeight:2.5},{result:1,compWeight:2.5},
    {result:1,compWeight:2.5},{result:0.5,compWeight:2.5},{result:1,compWeight:2.0},
    {result:0,compWeight:2.5},{result:1,compWeight:2.5},{result:1,compWeight:2.5},
  ],
}

export interface BayesianInput {
  homeCode: string
  awayCode: string
}

export function calcBayesian(input: BayesianInput): BayesianResult {
  const { homeCode, awayCode } = input
  const homeElo = TEAMS[homeCode]?.eloRating ?? 1700
  const awayElo = TEAMS[awayCode]?.eloRating ?? 1700

  // Prior: based on ELO-derived win probability
  const eloPriorH = eloToWinProb(homeElo, awayElo)
  const eloPriorD = 0.25  // flat prior for draws
  const eloPriorA = 1 - eloPriorH - eloPriorD

  // Strength of prior (equivalent match count)
  const priorStrength = 8

  let alphaH = Math.max(0.1, eloPriorH) * priorStrength
  let alphaD = Math.max(0.1, eloPriorD) * priorStrength
  let alphaA = Math.max(0.1, eloPriorA) * priorStrength

  // Update with home team's recent form
  const homeForm = TEAM_FORM[homeCode]
  if (homeForm) {
    homeForm.forEach((r, idx) => {
      const recencyW = 0.4 + (idx / homeForm.length) * 0.6
      const w = r.compWeight * recencyW
      alphaH += r.result * w
      alphaA += (1 - r.result) * w
      alphaD += (r.result === 0.5 ? 0.5 : 0) * w * 0.3
    })
  }

  // Update with away team's form (from away perspective)
  const awayForm = TEAM_FORM[awayCode]
  if (awayForm) {
    awayForm.forEach((r, idx) => {
      const recencyW = 0.4 + (idx / awayForm.length) * 0.6
      const w = r.compWeight * recencyW * 0.7  // away form weighted less
      alphaA += r.result * w
      alphaH += (1 - r.result) * w
    })
  }

  const total   = alphaH + alphaD + alphaA
  const homeWin = alphaH / total
  const draw    = alphaD / total
  const awayWin = alphaA / total

  return {
    homeWin,
    draw,
    awayWin,
    homeWinHPD: betaHPD(alphaH, alphaD + alphaA),
    priorWeight: priorStrength / (priorStrength + (homeForm?.length ?? 0)),
  }
}
