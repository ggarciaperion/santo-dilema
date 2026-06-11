/**
 * Monte Carlo Simulation Engine
 *
 * Runs N simulations of a match score using the Dixon-Coles
 * expected goals values. Each iteration independently samples
 * from Poisson distributions for home and away goals.
 *
 * With N=50,000:
 *   Standard error ≈ ±0.4% for probabilities near 50%
 *   95% CI width  ≈ ±0.88%
 *
 * Algorithm: Knuth's Poisson sampler (exact for λ < 30)
 */

import type { MonteCarloResult, ScoreProbability } from '../types'

// Poisson random variable (Knuth algorithm)
function poissonSample(lambda: number): number {
  if (lambda <= 0) return 0
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= Math.random()
  } while (p > L)
  return k - 1
}

// Wilson score interval for binomial proportion
function wilsonInterval(successes: number, n: number, z = 1.96): [number, number] {
  const p = successes / n
  const center = (p + (z * z) / (2 * n)) / (1 + (z * z) / n)
  const margin  = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / (1 + (z * z) / n)
  return [Math.max(0, center - margin), Math.min(1, center + margin)]
}

export interface MCInput {
  expectedGoalsH: number
  expectedGoalsA: number
  iterations?: number
}

export function runMonteCarlo(input: MCInput): MonteCarloResult {
  const { expectedGoalsH, expectedGoalsA, iterations = 50000 } = input

  let homeWins = 0
  let draws    = 0
  let awayWins = 0

  // Score frequency map
  const scoreFreq = new Map<string, number>()

  for (let i = 0; i < iterations; i++) {
    const h = poissonSample(expectedGoalsH)
    const a = poissonSample(expectedGoalsA)

    if (h > a) homeWins++
    else if (h === a) draws++
    else awayWins++

    const key = `${h}:${a}`
    scoreFreq.set(key, (scoreFreq.get(key) ?? 0) + 1)
  }

  const homeWinP = homeWins / iterations
  const drawP    = draws    / iterations
  const awayWinP = awayWins / iterations

  // Top 12 most common scorelines
  const topScores: ScoreProbability[] = Array.from(scoreFreq.entries())
    .map(([key, count]) => {
      const [h, a] = key.split(':').map(Number)
      return { homeGoals: h, awayGoals: a, probability: count / iterations }
    })
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 12)

  return {
    homeWin:   homeWinP,
    draw:      drawP,
    awayWin:   awayWinP,
    iterations,
    topScores,
    homeWinCI: wilsonInterval(homeWins, iterations),
    drawCI:    wilsonInterval(draws,    iterations),
    awayWinCI: wilsonInterval(awayWins, iterations),
  }
}
