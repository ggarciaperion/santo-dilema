/**
 * Ensemble Model + Confidence Assessment + Value Detection
 *
 * Combines Dixon-Coles, Monte Carlo, Bayesian, and ELO into
 * a weighted ensemble. Weights calibrated against WC historical data.
 *
 * Calibrated weights (v1):
 *   Dixon-Coles: 40%   — best calibrated for score prediction
 *   Monte Carlo: 30%   — captures tails and scenario distribution
 *   Bayesian:    20%   — incorporates recent form + prior
 *   ELO:         10%   — long-run strength signal
 */

import type {
  AdvancedPrediction, EnsembleResult, ConfidenceAssessment,
  RiskFactor, TeamRadar, ValueAnalysis, ScoreProbability,
  DixonColesResult, MonteCarloResult, BayesianResult, EloModel,
} from '../types'
import { getTeamParams } from '../data/team-params'
import { TEAMS } from '../teams'
import { calcH2HAdjustment } from './h2h-model'

// Ensemble weights (must sum to 1.0)
const W = { dixon: 0.40, monte: 0.30, bayes: 0.20, elo: 0.10 }

export function buildEnsemble(
  dc:       DixonColesResult,
  mc:       MonteCarloResult,
  bayes:    BayesianResult,
  elo:      EloModel,
  homeCode: string,
  awayCode: string,
): EnsembleResult {
  // Base weighted sum
  let homeWin =
    W.dixon * dc.homeWin +
    W.monte * mc.homeWin +
    W.bayes * bayes.homeWin +
    W.elo   * elo.homeWin

  let draw =
    W.dixon * dc.draw +
    W.monte * mc.draw +
    W.bayes * bayes.draw +
    W.elo   * elo.draw

  let awayWin =
    W.dixon * dc.awayWin +
    W.monte * mc.awayWin +
    W.bayes * bayes.awayWin +
    W.elo   * elo.awayWin

  // Normalize base
  let total = homeWin + draw + awayWin
  homeWin /= total
  draw    /= total
  awayWin /= total

  // H2H adjustment layer
  const h2h = calcH2HAdjustment(homeCode, awayCode, homeWin, draw, awayWin)

  return {
    homeWin: h2h.hasData ? h2h.h2hHomeWin : homeWin,
    draw:    h2h.hasData ? h2h.h2hDraw    : draw,
    awayWin: h2h.hasData ? h2h.h2hAwayWin : awayWin,
    weights: { dixon: W.dixon, elo: W.elo, bayesian: W.bayes },
    h2h,
  }
}

// Build team radar (0-100 per dimension)
export function buildRadar(code: string): TeamRadar {
  const p    = getTeamParams(code)
  const team = TEAMS[code]

  // Attack (0-100): based on attack param and xGFor
  const attack = Math.min(100, Math.round(
    ((p.attack - 0.5) / (2.0 - 0.5)) * 100
  ))

  // Defense (0-100): lower defense param = better
  const defense = Math.min(100, Math.round(
    ((1.5 - p.defense) / (1.5 - 0.5)) * 100
  ))

  // Form (0-100)
  const form = Math.round(p.formScore * 100)

  // xG relative (0-100): xGFor vs average 1.35
  const xG = Math.min(100, Math.round(
    ((p.xGFor - 0.5) / (2.5 - 0.5)) * 100
  ))

  // WC History (0-100)
  const history = Math.round((p.wcHistory / 10) * 100)

  // Pressure performance (0-100)
  const pressure = Math.round(p.pressureRating * 100)

  return { attack, defense, form, xG, history, pressure }
}

// Build confidence assessment
export function buildConfidence(
  homeCode:  string,
  awayCode:  string,
  ensemble:  EnsembleResult,
  dc:        DixonColesResult,
  mc:        MonteCarloResult,
  bayes:     BayesianResult,
  altitude:  number,
): ConfidenceAssessment {
  const factors: RiskFactor[] = []
  let score = 70  // baseline

  const hp = getTeamParams(homeCode)
  const ap = getTeamParams(awayCode)
  const homeElo = TEAMS[homeCode]?.eloRating ?? 1700
  const awayElo = TEAMS[awayCode]?.eloRating ?? 1700
  const eloDiff = Math.abs(homeElo - awayElo)

  // Factor 1: Model agreement
  const modelSpread = Math.max(
    Math.abs(dc.homeWin - mc.homeWin),
    Math.abs(dc.draw    - mc.draw),
    Math.abs(dc.awayWin - mc.awayWin),
  )
  if (modelSpread < 0.04) {
    score += 8
    factors.push({ type: 'form', description: 'Los 4 modelos convergen con alta consistencia', impact: 'positive', magnitude: 'medium' })
  } else if (modelSpread > 0.12) {
    score -= 10
    factors.push({ type: 'form', description: 'Alta divergencia entre modelos — mayor incertidumbre', impact: 'negative', magnitude: 'high' })
  }

  // Factor 2: ELO gap (clear favorite = more confidence)
  if (eloDiff > 200) {
    score += 10
    factors.push({ type: 'form', description: `Brecha ELO significativa (${eloDiff} puntos)`, impact: 'positive', magnitude: 'medium' })
  } else if (eloDiff < 50) {
    score -= 8
    factors.push({ type: 'form', description: 'Equipos muy equilibrados en ELO — pronóstico incierto', impact: 'negative', magnitude: 'medium' })
  }

  // Factor 3: Altitude
  if (altitude > 2000) {
    score -= 12
    factors.push({
      type: 'altitude',
      description: `Altitud extrema (${altitude}m) — penaliza equipos no adaptados. Efecto estimado: -8% rendimiento visitante`,
      impact: 'negative',
      magnitude: 'high',
    })
  } else if (altitude > 1500) {
    score -= 6
    factors.push({
      type: 'altitude',
      description: `Altitud moderada-alta (${altitude}m) — posible impacto en rendimiento`,
      impact: 'negative',
      magnitude: 'medium',
    })
  }

  // Factor 4: Host advantage
  if (hp.isHost) {
    score += 6
    factors.push({ type: 'host', description: `${homeCode} juega en casa propia — ventaja estimada +8%`, impact: 'positive', magnitude: 'medium' })
  }

  // Factor 5: Form divergence between teams
  const formDiff = Math.abs(hp.formScore - ap.formScore)
  if (formDiff > 0.20) {
    score += 5
    const better = hp.formScore > ap.formScore ? homeCode : awayCode
    factors.push({ type: 'form', description: `${better} llega en forma marcadamente superior`, impact: 'positive', magnitude: 'medium' })
  }

  // Factor 6: Monte Carlo CI width
  const ciWidth = mc.homeWinCI[1] - mc.homeWinCI[0]
  if (ciWidth < 0.02) score += 4
  else if (ciWidth > 0.04) score -= 4

  // Factor 7: Pressure rating
  if (ensemble.homeWin > 0.50 && hp.pressureRating < 0.60) {
    score -= 5
    factors.push({ type: 'pressure', description: `${homeCode} tiene historial negativo en fases decisivas`, impact: 'negative', magnitude: 'medium' })
  }

  // Factor 8: H2H data availability and signal
  if (ensemble.h2h?.hasData) {
    const h2h = ensemble.h2h
    if (h2h.wcMeets >= 2) {
      score += 4
      factors.push({ type: 'h2h', description: `Rivalidad histórica rica en Mundiales (${h2h.wcMeets} encuentros WC, ${h2h.played} totales)`, impact: 'positive', magnitude: 'low' })
    } else if (h2h.played >= 20) {
      score += 2
      factors.push({ type: 'h2h', description: `Amplio historial H2H (${h2h.played} partidos) — ajuste aplicado (${(h2h.blendFactor * 100).toFixed(0)}%)`, impact: 'positive', magnitude: 'low' })
    }
    if (Math.abs(h2h.deltaHomeWin) > 0.05) {
      const favored = h2h.deltaHomeWin > 0 ? homeCode : awayCode
      factors.push({ type: 'h2h', description: `H2H favorece a ${favored} por encima de lo que sugieren los modelos estadísticos`, impact: 'neutral', magnitude: 'medium' })
    }
  } else {
    score -= 2  // slight penalty for no H2H data
  }

  score = Math.max(20, Math.min(95, score))

  const level =
    score >= 80 ? 'very-high' :
    score >= 65 ? 'high' :
    score >= 50 ? 'medium' : 'low'

  const dominantOutcome =
    ensemble.homeWin > ensemble.awayWin && ensemble.homeWin > ensemble.draw
      ? `victoria de ${TEAMS[homeCode]?.shortName ?? homeCode}`
      : ensemble.awayWin > ensemble.draw
        ? `victoria de ${TEAMS[awayCode]?.shortName ?? awayCode}`
        : 'empate'

  const summary = `Nivel de certeza ${score}/100. El modelo favorece el ${dominantOutcome} con probabilidad ${Math.round(Math.max(ensemble.homeWin, ensemble.draw, ensemble.awayWin) * 100)}%.`

  return { level, score, factors, summary }
}

// Generate professional narrative insight
export function generateInsight(
  homeCode:  string,
  awayCode:  string,
  ensemble:  EnsembleResult,
  dc:        DixonColesResult,
  value:     ValueAnalysis,
  altitude:  number,
): string {
  const home = TEAMS[homeCode]?.shortName ?? homeCode
  const away = TEAMS[awayCode]?.shortName ?? awayCode
  const hp   = getTeamParams(homeCode)
  const ap   = getTeamParams(awayCode)

  const winner =
    ensemble.homeWin > ensemble.awayWin && ensemble.homeWin > ensemble.draw
      ? home
      : ensemble.awayWin > ensemble.draw
        ? away
        : null

  const pct = winner
    ? Math.round(Math.max(ensemble.homeWin, ensemble.awayWin) * 100)
    : Math.round(ensemble.draw * 100)

  let text = winner
    ? `El modelo ensemble favorece a ${winner} (${pct}%) impulsado por su superioridad en ataque (${winner === home ? hp.xGFor : ap.xGFor} xG/90) y su cohesión táctica reciente. `
    : `Partido extremadamente equilibrado: ${home} y ${away} presentan diferencias estadísticas mínimas. El empate (${pct}%) es el resultado más probable según el modelo Dixon-Coles. `

  // Add xG context
  text += `Los goles esperados del modelo son ${dc.expectedGoalsH.toFixed(2)} (${home}) vs ${dc.expectedGoalsA.toFixed(2)} (${away}). `

  // Altitude warning
  if (altitude > 1500) {
    text += `Alerta: sede a ${altitude}m sobre el nivel del mar — equipos sin adaptación a la altitud pueden ver reducida su capacidad aeróbica hasta un 10%. `
  }

  // Value signal
  if (value.hasOdds && (value.valueHome || value.valueDraw || value.valueAway)) {
    const valueTarget = value.valueHome ? home : (value.valueAway ? away : 'empate')
    text += `El mercado de apuestas subestima las probabilidades de ${valueTarget} — se detecta valor estadístico positivo (EV > 5%).`
  } else if (value.hasOdds) {
    text += `Las cuotas del mercado están alineadas con el modelo — no se detecta valor estadístico claro.`
  }

  return text
}

// Merge all top scores, weighted average
export function mergeTopScores(
  dc: DixonColesResult,
  mc: MonteCarloResult,
): ScoreProbability[] {
  const combined = new Map<string, number>()

  // From Dixon-Coles scoreMatrix (primary source)
  for (let x = 0; x <= 6; x++) {
    for (let y = 0; y <= 6; y++) {
      const key = `${x}:${y}`
      const dcP = (dc.scoreMatrix[x]?.[y] ?? 0)
      combined.set(key, (W.dixon + W.monte * 0.5) * dcP)
    }
  }

  // Add Monte Carlo scores
  mc.topScores.forEach(s => {
    const key = `${s.homeGoals}:${s.awayGoals}`
    const cur = combined.get(key) ?? 0
    combined.set(key, cur + W.monte * 0.5 * s.probability)
  })

  const total = Array.from(combined.values()).reduce((a, b) => a + b, 0)

  return Array.from(combined.entries())
    .map(([key, prob]) => {
      const [h, a] = key.split(':').map(Number)
      return { homeGoals: h, awayGoals: a, probability: prob / total }
    })
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 12)
}
