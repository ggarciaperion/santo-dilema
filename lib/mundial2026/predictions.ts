import type { Team, Prediction, ScoreProbability, EloModel, PoissonModel } from './types'

// ── ELO Model ─────────────────────────────────────────────────────
// Standard ELO win probability formula (Elo, 1978)

const ELO_K = 400 // scaling constant

function eloWinProb(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / ELO_K))
}

// Approximate draw probability: teams of similar strength draw ~28% of the time.
// For uneven matches, draw probability decreases.
function eloDrawProb(winProbFavorite: number): number {
  // Draw probability peaks (~0.28) at winProb = 0.5 (equal teams)
  // Decreases toward 0 as the match becomes more one-sided
  const symmetry = 1 - Math.abs(2 * winProbFavorite - 1)
  return 0.28 * symmetry + 0.04
}

export function calcEloModel(home: Team, away: Team, neutralVenue = false): EloModel {
  const homeAdvantage = neutralVenue ? 0 : 100  // +100 ELO points for home advantage
  const adjHomeRating = home.eloRating + homeAdvantage

  const rawHomeWin = eloWinProb(adjHomeRating, away.eloRating)
  const draw       = eloDrawProb(rawHomeWin)
  const homeWin    = rawHomeWin * (1 - draw)
  const awayWin    = 1 - homeWin - draw

  return {
    homeWin: Math.max(0.01, Math.round(homeWin * 1000) / 1000),
    draw:    Math.max(0.01, Math.round(draw    * 1000) / 1000),
    awayWin: Math.max(0.01, Math.round(awayWin * 1000) / 1000),
  }
}

// ── Poisson / Dixon-Coles Model ───────────────────────────────────
// Projects goal totals and score distributions

const LEAGUE_AVG_GOALS = 1.38  // Historical WC average goals per team per game

function factorial(n: number): number {
  if (n <= 1) return 1
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

function poisson(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k)
}

// Dixon-Coles low-score correction
function rho(i: number, j: number, lambda: number, mu: number, rhoVal = -0.13): number {
  if (i === 0 && j === 0) return 1 - lambda * mu * rhoVal
  if (i === 1 && j === 0) return 1 + mu * rhoVal
  if (i === 0 && j === 1) return 1 + lambda * rhoVal
  if (i === 1 && j === 1) return 1 - rhoVal
  return 1
}

function eloToAttack(elo: number): number {
  // Converts ELO to attack strength relative to WC average
  return LEAGUE_AVG_GOALS * (1 + (elo - 1750) / 2000)
}

function eloToDefense(elo: number): number {
  // Lower defense value = better defense
  return LEAGUE_AVG_GOALS * (1 - (elo - 1750) / 2500)
}

export function calcPoissonModel(home: Team, away: Team, neutralVenue = false): PoissonModel {
  const homeBonus = neutralVenue ? 0 : 0.15  // home teams score ~15% more

  const lambdaH = Math.max(0.2, eloToAttack(home.eloRating) * (1 + homeBonus) * eloToDefense(away.eloRating) / LEAGUE_AVG_GOALS)
  const lambdaA = Math.max(0.2, eloToAttack(away.eloRating) * eloToDefense(home.eloRating) / LEAGUE_AVG_GOALS)

  let homeWin = 0, draw = 0, awayWin = 0

  for (let i = 0; i <= 8; i++) {
    for (let j = 0; j <= 8; j++) {
      const p = poisson(lambdaH, i) * poisson(lambdaA, j) * rho(i, j, lambdaH, lambdaA)
      if (i > j) homeWin += p
      else if (i === j) draw += p
      else awayWin += p
    }
  }

  const total = homeWin + draw + awayWin
  return {
    homeWin: Math.round((homeWin / total) * 1000) / 1000,
    draw:    Math.round((draw    / total) * 1000) / 1000,
    awayWin: Math.round((awayWin / total) * 1000) / 1000,
    expectedGoalsH: Math.round(lambdaH * 100) / 100,
    expectedGoalsA: Math.round(lambdaA * 100) / 100,
  }
}

// ── Most Likely Scores ────────────────────────────────────────────

export function calcLikelyScores(home: Team, away: Team, neutralVenue = false): ScoreProbability[] {
  const { expectedGoalsH, expectedGoalsA } = calcPoissonModel(home, away, neutralVenue)
  const scores: ScoreProbability[] = []

  for (let i = 0; i <= 5; i++) {
    for (let j = 0; j <= 5; j++) {
      const p = poisson(expectedGoalsH, i) * poisson(expectedGoalsA, j)
      scores.push({ homeGoals: i, awayGoals: j, probability: Math.round(p * 10000) / 10000 })
    }
  }

  return scores.sort((a, b) => b.probability - a.probability).slice(0, 8)
}

// ── Ensemble Model ────────────────────────────────────────────────
// Weighted combination: 35% ELO + 65% Poisson

export function calcEnsemble(elo: EloModel, poisson: PoissonModel): EloModel {
  const w1 = 0.35, w2 = 0.65
  return {
    homeWin: Math.round((w1 * elo.homeWin + w2 * poisson.homeWin) * 1000) / 1000,
    draw:    Math.round((w1 * elo.draw    + w2 * poisson.draw)    * 1000) / 1000,
    awayWin: Math.round((w1 * elo.awayWin + w2 * poisson.awayWin) * 1000) / 1000,
  }
}

// ── Confidence Level ──────────────────────────────────────────────

function confidenceLevel(ensemble: EloModel): Prediction['confidence'] {
  const max = Math.max(ensemble.homeWin, ensemble.awayWin)
  const eloDiff = Math.abs(0 /* will be passed */)
  if (max >= 0.70) return 'very-high'
  if (max >= 0.58) return 'high'
  if (max >= 0.48) return 'medium'
  return 'low'
}

// ── Prediction Summary ────────────────────────────────────────────

function buildSummary(home: Team, away: Team, ensemble: EloModel, scores: ScoreProbability[]): string {
  const topScore = scores[0]
  const maxProb  = Math.max(ensemble.homeWin, ensemble.draw, ensemble.awayWin)
  const winner   =
    ensemble.homeWin === maxProb ? home.shortName
    : ensemble.awayWin === maxProb ? away.shortName
    : 'Empate'

  const homeP  = Math.round(ensemble.homeWin * 100)
  const drawP  = Math.round(ensemble.draw    * 100)
  const awayP  = Math.round(ensemble.awayWin * 100)
  const topStr = `${topScore.homeGoals}-${topScore.awayGoals} (${Math.round(topScore.probability * 100)}%)`

  if (winner === 'Empate') {
    return `Partido muy equilibrado. ${home.shortName} ${homeP}% | Empate ${drawP}% | ${away.shortName} ${awayP}%. Marcador más probable: ${topStr}.`
  }
  return `Según el modelo ensemble, ${winner} es favorito con ${Math.round(maxProb * 100)}% de probabilidad de victoria. Marcador más probable: ${topStr}.`
}

// ── Main Entry Point ──────────────────────────────────────────────

export function generatePrediction(home: Team, away: Team, matchId: string, neutralVenue = false): Prediction {
  const elo     = calcEloModel(home, away, neutralVenue)
  const pois    = calcPoissonModel(home, away, neutralVenue)
  const ensemble = calcEnsemble(elo, pois)
  const scores  = calcLikelyScores(home, away, neutralVenue)

  return {
    matchId,
    generatedAt: new Date().toISOString(),
    homeWinProb: ensemble.homeWin,
    drawProb:    ensemble.draw,
    awayWinProb: ensemble.awayWin,
    mostLikelyScores: scores,
    confidence: confidenceLevel(ensemble),
    summary: buildSummary(home, away, ensemble, scores),
    models: {
      elo,
      poisson: pois,
      ensemble,
    },
  }
}
