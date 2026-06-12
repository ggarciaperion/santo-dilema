/**
 * Bayesian Team Strength Estimation
 *
 * Uses a Beta distribution prior on win probability,
 * updated with recent match results (last 15 competitive games).
 *
 * Prior: Based on ELO rating difference (converted to win probability)
 * Likelihood: Match outcomes weighted by recency × competition level × opponent quality
 * Posterior: Beta(α, β) → P(win) = α / (α + β)
 *
 * Competition weights:
 *   World Cup / Major final: 3.0
 *   Copa América / Euros / AFCON / NationsLeague final: 2.5
 *   WC Qualifiers / Conf Qualifiers: 2.0
 *   Friendlies / minor: 1.0
 *
 * Opponent quality multiplier:
 *   opponentQ = clamp(opponentElo / 1800, 0.5, 1.5)
 *   → win vs ELO 2000 team weights 1.11×, vs ELO 1500 team weights 0.83×
 */

import type { BayesianResult } from '../types'
import { getTeamParams } from '../data/team-params'
import { TEAMS } from '../teams'

// Beta distribution: 95% HPD interval via normal approximation
function betaHPD(alpha: number, beta: number): [number, number] {
  const mean = alpha / (alpha + beta)
  const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1))
  const sd = Math.sqrt(variance)
  return [Math.max(0, mean - 1.96 * sd), Math.min(1, mean + 1.96 * sd)]
}

// ELO difference → win probability (logistic)
function eloToWinProb(eloHome: number, eloAway: number): number {
  return 1 / (1 + Math.pow(10, (eloAway - eloHome) / 400))
}

interface RecentResult {
  result: number       // 1=W, 0.5=D, 0=L
  compWeight: number   // competition importance
  opponentElo: number  // ELO of the opponent faced
}

// Pre-computed form data — last 15 competitive matches per team
// Ordered oldest → newest (index 0 = oldest, 14 = most recent)
// opponentElo: average ELO of typical opponent in that competition context
const TEAM_FORM: Record<string, RecentResult[]> = {

  // ── GROUP A ─────────────────────────────────────────────────────
  MEX: [
    {result:1,compWeight:2.0,opponentElo:1680},{result:1,compWeight:2.0,opponentElo:1710},
    {result:0,compWeight:2.5,opponentElo:1860},{result:1,compWeight:2.0,opponentElo:1650},
    {result:0.5,compWeight:2.0,opponentElo:1770},{result:1,compWeight:2.0,opponentElo:1640},
    {result:1,compWeight:2.0,opponentElo:1700},{result:0,compWeight:2.5,opponentElo:1835},
    {result:1,compWeight:2.0,opponentElo:1660},{result:1,compWeight:2.0,opponentElo:1680},
    {result:0.5,compWeight:2.0,opponentElo:1720},{result:1,compWeight:2.0,opponentElo:1650},
    {result:0,compWeight:2.0,opponentElo:1835},{result:1,compWeight:2.5,opponentElo:1710},
    {result:1,compWeight:2.0,opponentElo:1690},
  ],
  ZAF: [
    {result:1,compWeight:2.0,opponentElo:1580},{result:0,compWeight:2.0,opponentElo:1760},
    {result:0.5,compWeight:1.0,opponentElo:1550},{result:1,compWeight:2.0,opponentElo:1600},
    {result:0,compWeight:2.0,opponentElo:1730},{result:0,compWeight:1.0,opponentElo:1540},
    {result:1,compWeight:2.0,opponentElo:1590},{result:0.5,compWeight:2.0,opponentElo:1620},
    {result:0,compWeight:1.0,opponentElo:1560},{result:1,compWeight:2.0,opponentElo:1570},
    {result:0,compWeight:2.5,opponentElo:1780},{result:0.5,compWeight:1.0,opponentElo:1540},
    {result:1,compWeight:2.0,opponentElo:1610},{result:0,compWeight:2.0,opponentElo:1700},
    {result:1,compWeight:1.0,opponentElo:1560},
  ],
  KOR: [
    {result:1,compWeight:2.0,opponentElo:1600},{result:1,compWeight:2.0,opponentElo:1650},
    {result:0,compWeight:2.0,opponentElo:1830},{result:0.5,compWeight:2.0,opponentElo:1720},
    {result:1,compWeight:2.0,opponentElo:1670},{result:0,compWeight:1.0,opponentElo:1580},
    {result:1,compWeight:2.0,opponentElo:1640},{result:1,compWeight:2.0,opponentElo:1680},
    {result:0.5,compWeight:2.0,opponentElo:1770},{result:0,compWeight:2.0,opponentElo:1830},
    {result:1,compWeight:2.0,opponentElo:1620},{result:1,compWeight:1.0,opponentElo:1560},
    {result:0,compWeight:2.5,opponentElo:1830},{result:1,compWeight:2.0,opponentElo:1660},
    {result:1,compWeight:2.0,opponentElo:1700},
  ],
  CZE: [
    {result:1,compWeight:2.0,opponentElo:1620},{result:1,compWeight:2.0,opponentElo:1680},
    {result:0.5,compWeight:2.0,opponentElo:1840},{result:0,compWeight:2.0,opponentElo:1900},
    {result:1,compWeight:2.0,opponentElo:1650},{result:1,compWeight:1.0,opponentElo:1540},
    {result:0,compWeight:2.5,opponentElo:1970},{result:1,compWeight:2.0,opponentElo:1660},
    {result:0.5,compWeight:2.0,opponentElo:1750},{result:1,compWeight:2.0,opponentElo:1630},
    {result:0,compWeight:2.0,opponentElo:1880},{result:1,compWeight:1.0,opponentElo:1560},
    {result:1,compWeight:2.0,opponentElo:1640},{result:0,compWeight:2.0,opponentElo:1820},
    {result:1,compWeight:2.0,opponentElo:1670},
  ],

  // ── GROUP B ─────────────────────────────────────────────────────
  CAN: [
    {result:1,compWeight:2.0,opponentElo:1680},{result:1,compWeight:2.5,opponentElo:1860},
    {result:0,compWeight:2.5,opponentElo:2080},{result:1,compWeight:2.0,opponentElo:1710},
    {result:1,compWeight:2.0,opponentElo:1720},{result:0.5,compWeight:2.0,opponentElo:1820},
    {result:1,compWeight:2.0,opponentElo:1690},{result:0,compWeight:2.5,opponentElo:1870},
    {result:1,compWeight:2.0,opponentElo:1700},{result:1,compWeight:2.0,opponentElo:1710},
    {result:0.5,compWeight:2.0,opponentElo:1835},{result:1,compWeight:2.0,opponentElo:1660},
    {result:0,compWeight:2.0,opponentElo:1835},{result:1,compWeight:2.0,opponentElo:1730},
    {result:1,compWeight:2.0,opponentElo:1720},
  ],
  BIH: [
    {result:0.5,compWeight:2.0,opponentElo:1750},{result:1,compWeight:2.0,opponentElo:1640},
    {result:0,compWeight:2.0,opponentElo:1880},{result:1,compWeight:2.0,opponentElo:1660},
    {result:0,compWeight:2.0,opponentElo:1820},{result:1,compWeight:1.0,opponentElo:1540},
    {result:0.5,compWeight:2.0,opponentElo:1700},{result:0,compWeight:2.0,opponentElo:1810},
    {result:1,compWeight:2.0,opponentElo:1650},{result:0,compWeight:2.0,opponentElo:1870},
    {result:1,compWeight:1.0,opponentElo:1560},{result:0.5,compWeight:2.0,opponentElo:1720},
    {result:1,compWeight:2.0,opponentElo:1630},{result:0,compWeight:2.0,opponentElo:1840},
    {result:1,compWeight:2.0,opponentElo:1670},
  ],
  QAT: [
    {result:0,compWeight:2.0,opponentElo:1700},{result:1,compWeight:2.0,opponentElo:1530},
    {result:0,compWeight:1.0,opponentElo:1580},{result:0,compWeight:2.0,opponentElo:1720},
    {result:1,compWeight:2.0,opponentElo:1540},{result:0,compWeight:2.0,opponentElo:1680},
    {result:0.5,compWeight:1.0,opponentElo:1550},{result:0,compWeight:2.0,opponentElo:1670},
    {result:1,compWeight:1.0,opponentElo:1520},{result:0,compWeight:2.0,opponentElo:1710},
    {result:0,compWeight:2.0,opponentElo:1780},{result:1,compWeight:2.0,opponentElo:1560},
    {result:0,compWeight:3.0,opponentElo:1830},{result:0,compWeight:3.0,opponentElo:1835},
    {result:0,compWeight:3.0,opponentElo:2020},
  ],
  SUI: [
    {result:1,compWeight:2.5,opponentElo:1940},{result:1,compWeight:2.5,opponentElo:1810},
    {result:0.5,compWeight:2.5,opponentElo:1970},{result:1,compWeight:2.0,opponentElo:1720},
    {result:0,compWeight:2.5,opponentElo:2055},{result:1,compWeight:2.0,opponentElo:1750},
    {result:1,compWeight:2.0,opponentElo:1760},{result:0.5,compWeight:2.0,opponentElo:1800},
    {result:1,compWeight:2.5,opponentElo:1880},{result:1,compWeight:2.0,opponentElo:1730},
    {result:0,compWeight:2.5,opponentElo:1965},{result:1,compWeight:2.0,opponentElo:1710},
    {result:1,compWeight:2.0,opponentElo:1740},{result:0.5,compWeight:2.5,opponentElo:1840},
    {result:1,compWeight:2.0,opponentElo:1720},
  ],

  // ── CONMEBOL ────────────────────────────────────────────────────
  ARG: [
    {result:1,compWeight:2.5,opponentElo:1860},{result:1,compWeight:3.0,opponentElo:2020},
    {result:1,compWeight:2.5,opponentElo:1870},{result:1,compWeight:2.5,opponentElo:1790},
    {result:1,compWeight:2.5,opponentElo:1850},{result:0.5,compWeight:2.5,opponentElo:1860},
    {result:1,compWeight:2.0,opponentElo:1650},{result:1,compWeight:3.0,opponentElo:2020},
    {result:1,compWeight:2.5,opponentElo:1860},{result:0,compWeight:2.5,opponentElo:2020},
    {result:1,compWeight:2.5,opponentElo:1790},{result:1,compWeight:2.5,opponentElo:1650},
    {result:1,compWeight:2.0,opponentElo:1710},{result:1,compWeight:2.5,opponentElo:1860},
    {result:1,compWeight:3.0,opponentElo:1870},
  ],
  BRA: [
    {result:1,compWeight:2.5,opponentElo:1790},{result:1,compWeight:2.5,opponentElo:1860},
    {result:1,compWeight:2.0,opponentElo:1700},{result:0,compWeight:2.5,opponentElo:2080},
    {result:1,compWeight:2.0,opponentElo:1650},{result:1,compWeight:2.5,opponentElo:1860},
    {result:0.5,compWeight:2.0,opponentElo:1720},{result:1,compWeight:2.5,opponentElo:1870},
    {result:1,compWeight:2.0,opponentElo:1690},{result:0,compWeight:3.0,opponentElo:2080},
    {result:1,compWeight:2.0,opponentElo:1660},{result:1,compWeight:2.5,opponentElo:1790},
    {result:1,compWeight:2.0,opponentElo:1730},{result:1,compWeight:2.5,opponentElo:1860},
    {result:0,compWeight:2.0,opponentElo:1870},
  ],
  COL: [
    {result:1,compWeight:2.5,opponentElo:1790},{result:1,compWeight:2.5,opponentElo:1860},
    {result:1,compWeight:2.5,opponentElo:1650},{result:1,compWeight:2.5,opponentElo:1770},
    {result:0.5,compWeight:2.5,opponentElo:2080},{result:1,compWeight:2.0,opponentElo:1700},
    {result:1,compWeight:2.5,opponentElo:1790},{result:0,compWeight:2.5,opponentElo:2080},
    {result:1,compWeight:2.5,opponentElo:1860},{result:1,compWeight:2.5,opponentElo:1650},
    {result:0,compWeight:3.0,opponentElo:2080},{result:1,compWeight:2.0,opponentElo:1710},
    {result:1,compWeight:2.5,opponentElo:1790},{result:1,compWeight:2.5,opponentElo:1860},
    {result:0.5,compWeight:2.0,opponentElo:1870},
  ],
  ECU: [
    {result:1,compWeight:2.0,opponentElo:1650},{result:0,compWeight:2.5,opponentElo:2020},
    {result:1,compWeight:2.0,opponentElo:1660},{result:0.5,compWeight:2.5,opponentElo:1860},
    {result:0,compWeight:2.5,opponentElo:1870},{result:1,compWeight:2.0,opponentElo:1690},
    {result:0.5,compWeight:2.5,opponentElo:1790},{result:0,compWeight:2.5,opponentElo:2080},
    {result:1,compWeight:2.0,opponentElo:1650},{result:1,compWeight:2.5,opponentElo:1660},
    {result:0,compWeight:2.5,opponentElo:1860},{result:1,compWeight:2.0,opponentElo:1700},
    {result:0.5,compWeight:2.5,opponentElo:1870},{result:1,compWeight:2.0,opponentElo:1650},
    {result:0,compWeight:2.5,opponentElo:1870},
  ],
  URU: [
    {result:1,compWeight:2.5,opponentElo:1650},{result:1,compWeight:2.5,opponentElo:1790},
    {result:1,compWeight:2.0,opponentElo:1700},{result:0,compWeight:2.5,opponentElo:2080},
    {result:1,compWeight:2.5,opponentElo:1860},{result:0.5,compWeight:2.5,opponentElo:1870},
    {result:1,compWeight:2.0,opponentElo:1660},{result:1,compWeight:2.5,opponentElo:1790},
    {result:0,compWeight:2.5,opponentElo:2020},{result:1,compWeight:2.5,opponentElo:1650},
    {result:1,compWeight:2.5,opponentElo:1710},{result:0.5,compWeight:2.5,opponentElo:1870},
    {result:1,compWeight:2.0,opponentElo:1680},{result:0,compWeight:3.0,opponentElo:2020},
    {result:1,compWeight:2.5,opponentElo:1790},
  ],
  PAR: [
    {result:0,compWeight:2.5,opponentElo:2020},{result:0,compWeight:2.5,opponentElo:1860},
    {result:1,compWeight:2.0,opponentElo:1640},{result:0,compWeight:2.5,opponentElo:1870},
    {result:0.5,compWeight:2.5,opponentElo:1790},{result:0,compWeight:2.5,opponentElo:2080},
    {result:1,compWeight:2.0,opponentElo:1650},{result:0,compWeight:2.5,opponentElo:1860},
    {result:0.5,compWeight:2.5,opponentElo:1770},{result:1,compWeight:2.0,opponentElo:1640},
    {result:0,compWeight:2.5,opponentElo:1870},{result:1,compWeight:2.0,opponentElo:1640},
    {result:0,compWeight:2.5,opponentElo:1790},{result:0.5,compWeight:2.5,opponentElo:1860},
    {result:1,compWeight:2.0,opponentElo:1650},
  ],

  // ── CONCACAF ────────────────────────────────────────────────────
  USA: [
    {result:1,compWeight:2.0,opponentElo:1710},{result:1,compWeight:2.5,opponentElo:1820},
    {result:0,compWeight:2.5,opponentElo:2080},{result:1,compWeight:2.0,opponentElo:1680},
    {result:1,compWeight:2.0,opponentElo:1720},{result:0.5,compWeight:2.5,opponentElo:1870},
    {result:1,compWeight:2.0,opponentElo:1710},{result:0,compWeight:2.5,opponentElo:1820},
    {result:1,compWeight:2.0,opponentElo:1700},{result:1,compWeight:2.0,opponentElo:1710},
    {result:0.5,compWeight:2.5,opponentElo:1860},{result:1,compWeight:2.0,opponentElo:1660},
    {result:0,compWeight:2.5,opponentElo:1870},{result:1,compWeight:2.0,opponentElo:1700},
    {result:1,compWeight:2.0,opponentElo:1720},
  ],
  PAN: [
    {result:1,compWeight:2.0,opponentElo:1560},{result:0,compWeight:2.0,opponentElo:1820},
    {result:0.5,compWeight:2.0,opponentElo:1650},{result:1,compWeight:2.0,opponentElo:1540},
    {result:0,compWeight:2.0,opponentElo:1770},{result:1,compWeight:2.0,opponentElo:1560},
    {result:0,compWeight:2.5,opponentElo:1835},{result:0.5,compWeight:2.0,opponentElo:1600},
    {result:1,compWeight:2.0,opponentElo:1550},{result:0,compWeight:2.0,opponentElo:1710},
    {result:1,compWeight:2.0,opponentElo:1570},{result:0,compWeight:2.5,opponentElo:1820},
    {result:0.5,compWeight:2.0,opponentElo:1650},{result:1,compWeight:2.0,opponentElo:1560},
    {result:0,compWeight:2.0,opponentElo:1770},
  ],
  HAI: [
    {result:0,compWeight:2.0,opponentElo:1710},{result:1,compWeight:2.0,opponentElo:1400},
    {result:0,compWeight:2.0,opponentElo:1720},{result:0.5,compWeight:2.0,opponentElo:1480},
    {result:0,compWeight:2.0,opponentElo:1510},{result:1,compWeight:2.0,opponentElo:1380},
    {result:0,compWeight:2.5,opponentElo:1820},{result:0.5,compWeight:2.0,opponentElo:1450},
    {result:0,compWeight:2.0,opponentElo:1710},{result:1,compWeight:2.0,opponentElo:1390},
    {result:0,compWeight:2.0,opponentElo:1630},{result:0.5,compWeight:2.0,opponentElo:1440},
    {result:1,compWeight:2.0,opponentElo:1420},{result:0,compWeight:2.0,opponentElo:1710},
    {result:0,compWeight:2.0,opponentElo:1720},
  ],
  CUW: [
    {result:1,compWeight:2.0,opponentElo:1390},{result:0,compWeight:2.0,opponentElo:1710},
    {result:0.5,compWeight:2.0,opponentElo:1440},{result:1,compWeight:2.0,opponentElo:1400},
    {result:0,compWeight:2.0,opponentElo:1720},{result:0.5,compWeight:2.0,opponentElo:1460},
    {result:1,compWeight:2.0,opponentElo:1410},{result:0,compWeight:2.5,opponentElo:1820},
    {result:0,compWeight:2.0,opponentElo:1710},{result:1,compWeight:2.0,opponentElo:1380},
    {result:0.5,compWeight:2.0,opponentElo:1450},{result:0,compWeight:2.0,opponentElo:1720},
    {result:1,compWeight:2.0,opponentElo:1400},{result:0,compWeight:2.0,opponentElo:1480},
    {result:0.5,compWeight:2.0,opponentElo:1430},
  ],

  // ── UEFA ────────────────────────────────────────────────────────
  FRA: [
    {result:1,compWeight:2.5,opponentElo:1880},{result:1,compWeight:2.5,opponentElo:1840},
    {result:0.5,compWeight:2.5,opponentElo:1970},{result:1,compWeight:2.5,opponentElo:1760},
    {result:1,compWeight:3.0,opponentElo:1985},{result:0,compWeight:2.5,opponentElo:2045},
    {result:1,compWeight:2.5,opponentElo:1830},{result:1,compWeight:2.5,opponentElo:1750},
    {result:1,compWeight:2.0,opponentElo:1720},{result:1,compWeight:2.5,opponentElo:1880},
    {result:0,compWeight:3.0,opponentElo:2045},{result:1,compWeight:2.5,opponentElo:1810},
    {result:1,compWeight:2.5,opponentElo:1870},{result:1,compWeight:2.5,opponentElo:1750},
    {result:0.5,compWeight:2.0,opponentElo:1800},
  ],
  ENG: [
    {result:1,compWeight:2.5,opponentElo:1880},{result:0.5,compWeight:3.0,opponentElo:2045},
    {result:1,compWeight:2.5,opponentElo:1840},{result:1,compWeight:2.5,opponentElo:1760},
    {result:1,compWeight:2.5,opponentElo:1870},{result:0,compWeight:3.0,opponentElo:2045},
    {result:1,compWeight:2.5,opponentElo:1800},{result:1,compWeight:2.5,opponentElo:1750},
    {result:1,compWeight:2.0,opponentElo:1710},{result:0.5,compWeight:2.5,opponentElo:1880},
    {result:1,compWeight:2.5,opponentElo:1810},{result:1,compWeight:2.5,opponentElo:1840},
    {result:0,compWeight:2.5,opponentElo:1985},{result:1,compWeight:2.5,opponentElo:1800},
    {result:1,compWeight:2.0,opponentElo:1720},
  ],
  GER: [
    {result:1,compWeight:2.5,opponentElo:1810},{result:1,compWeight:2.5,opponentElo:1870},
    {result:0,compWeight:2.5,opponentElo:2045},{result:1,compWeight:2.5,opponentElo:1760},
    {result:1,compWeight:2.5,opponentElo:1840},{result:1,compWeight:2.5,opponentElo:1800},
    {result:0.5,compWeight:2.5,opponentElo:1880},{result:1,compWeight:2.5,opponentElo:1750},
    {result:1,compWeight:2.0,opponentElo:1700},{result:1,compWeight:2.5,opponentElo:1810},
    {result:0,compWeight:2.5,opponentElo:2010},{result:1,compWeight:2.5,opponentElo:1870},
    {result:1,compWeight:2.0,opponentElo:1720},{result:1,compWeight:2.5,opponentElo:1840},
    {result:0,compWeight:2.5,opponentElo:1880},
  ],
  ESP: [
    {result:1,compWeight:3.0,opponentElo:1880},{result:1,compWeight:3.0,opponentElo:1840},
    {result:1,compWeight:3.0,opponentElo:2010},{result:1,compWeight:3.0,opponentElo:1970},
    {result:1,compWeight:3.0,opponentElo:2055},{result:1,compWeight:3.0,opponentElo:1985},
    {result:1,compWeight:2.5,opponentElo:1810},{result:1,compWeight:2.5,opponentElo:1870},
    {result:0.5,compWeight:2.5,opponentElo:1940},{result:1,compWeight:2.5,opponentElo:1760},
    {result:1,compWeight:2.5,opponentElo:1880},{result:1,compWeight:2.0,opponentElo:1720},
    {result:0,compWeight:2.5,opponentElo:1985},{result:1,compWeight:2.5,opponentElo:1840},
    {result:1,compWeight:2.5,opponentElo:1870},
  ],
  POR: [
    {result:1,compWeight:2.5,opponentElo:1810},{result:1,compWeight:2.5,opponentElo:1870},
    {result:1,compWeight:2.5,opponentElo:1840},{result:1,compWeight:2.5,opponentElo:1760},
    {result:0,compWeight:2.5,opponentElo:2045},{result:1,compWeight:2.5,opponentElo:1780},
    {result:1,compWeight:2.0,opponentElo:1720},{result:1,compWeight:2.5,opponentElo:1870},
    {result:1,compWeight:2.5,opponentElo:1840},{result:1,compWeight:2.5,opponentElo:1810},
    {result:0.5,compWeight:2.5,opponentElo:1880},{result:1,compWeight:2.0,opponentElo:1700},
    {result:0,compWeight:2.5,opponentElo:1985},{result:1,compWeight:2.5,opponentElo:1840},
    {result:1,compWeight:2.5,opponentElo:1870},
  ],
  NED: [
    {result:1,compWeight:2.5,opponentElo:1810},{result:1,compWeight:2.5,opponentElo:1870},
    {result:0.5,compWeight:2.5,opponentElo:1940},{result:1,compWeight:2.5,opponentElo:1760},
    {result:1,compWeight:2.5,opponentElo:1880},{result:0,compWeight:3.0,opponentElo:2045},
    {result:1,compWeight:2.5,opponentElo:1810},{result:0.5,compWeight:3.0,opponentElo:2055},
    {result:1,compWeight:2.0,opponentElo:1720},{result:1,compWeight:2.5,opponentElo:1840},
    {result:0,compWeight:2.5,opponentElo:2055},{result:1,compWeight:2.5,opponentElo:1800},
    {result:1,compWeight:2.5,opponentElo:1870},{result:1,compWeight:2.5,opponentElo:1760},
    {result:0.5,compWeight:2.0,opponentElo:1810},
  ],
  BEL: [
    {result:1,compWeight:2.5,opponentElo:1760},{result:1,compWeight:2.5,opponentElo:1810},
    {result:0,compWeight:2.5,opponentElo:1880},{result:1,compWeight:2.5,opponentElo:1720},
    {result:0,compWeight:3.0,opponentElo:1985},{result:0.5,compWeight:2.5,opponentElo:1840},
    {result:1,compWeight:2.0,opponentElo:1700},{result:0,compWeight:2.5,opponentElo:1970},
    {result:1,compWeight:2.5,opponentElo:1760},{result:1,compWeight:2.5,opponentElo:1800},
    {result:0.5,compWeight:2.5,opponentElo:1880},{result:1,compWeight:2.0,opponentElo:1710},
    {result:0,compWeight:2.5,opponentElo:1940},{result:1,compWeight:2.5,opponentElo:1780},
    {result:1,compWeight:2.0,opponentElo:1720},
  ],
  AUT: [
    {result:1,compWeight:2.5,opponentElo:1700},{result:1,compWeight:2.5,opponentElo:1760},
    {result:0,compWeight:2.5,opponentElo:1970},{result:1,compWeight:2.5,opponentElo:1720},
    {result:0.5,compWeight:2.5,opponentElo:1810},{result:1,compWeight:2.0,opponentElo:1660},
    {result:1,compWeight:2.5,opponentElo:1700},{result:0,compWeight:2.5,opponentElo:1985},
    {result:1,compWeight:2.5,opponentElo:1740},{result:0,compWeight:2.5,opponentElo:1880},
    {result:1,compWeight:2.0,opponentElo:1680},{result:0.5,compWeight:2.5,opponentElo:1810},
    {result:1,compWeight:2.5,opponentElo:1720},{result:0,compWeight:2.5,opponentElo:1940},
    {result:1,compWeight:2.0,opponentElo:1690},
  ],
  SCO: [
    {result:1,compWeight:2.0,opponentElo:1620},{result:0,compWeight:2.5,opponentElo:1985},
    {result:0.5,compWeight:2.5,opponentElo:1810},{result:1,compWeight:2.0,opponentElo:1650},
    {result:0,compWeight:2.5,opponentElo:1970},{result:1,compWeight:2.0,opponentElo:1640},
    {result:0,compWeight:2.5,opponentElo:1880},{result:0.5,compWeight:2.0,opponentElo:1700},
    {result:1,compWeight:2.0,opponentElo:1640},{result:0,compWeight:2.5,opponentElo:1940},
    {result:1,compWeight:2.0,opponentElo:1630},{result:0.5,compWeight:2.0,opponentElo:1720},
    {result:0,compWeight:2.5,opponentElo:1810},{result:1,compWeight:2.0,opponentElo:1650},
    {result:0,compWeight:2.5,opponentElo:1880},
  ],
  CRO: [
    {result:1,compWeight:2.5,opponentElo:1760},{result:0.5,compWeight:2.5,opponentElo:1840},
    {result:1,compWeight:2.0,opponentElo:1700},{result:0,compWeight:2.5,opponentElo:1970},
    {result:1,compWeight:2.5,opponentElo:1810},{result:0.5,compWeight:3.0,opponentElo:1985},
    {result:0,compWeight:2.5,opponentElo:2045},{result:1,compWeight:2.0,opponentElo:1720},
    {result:1,compWeight:2.5,opponentElo:1810},{result:0,compWeight:2.5,opponentElo:1880},
    {result:0.5,compWeight:2.0,opponentElo:1730},{result:1,compWeight:2.5,opponentElo:1760},
    {result:0,compWeight:2.5,opponentElo:1940},{result:1,compWeight:2.0,opponentElo:1700},
    {result:0.5,compWeight:2.0,opponentElo:1740},
  ],
  TUR: [
    {result:1,compWeight:2.5,opponentElo:1700},{result:1,compWeight:2.5,opponentElo:1760},
    {result:0,compWeight:2.5,opponentElo:1940},{result:1,compWeight:2.5,opponentElo:1720},
    {result:1,compWeight:2.5,opponentElo:1810},{result:0,compWeight:2.5,opponentElo:2010},
    {result:1,compWeight:2.5,opponentElo:1740},{result:0.5,compWeight:2.5,opponentElo:1880},
    {result:1,compWeight:2.0,opponentElo:1660},{result:0,compWeight:2.5,opponentElo:1970},
    {result:1,compWeight:2.5,opponentElo:1750},{result:0,compWeight:2.5,opponentElo:1840},
    {result:1,compWeight:2.0,opponentElo:1700},{result:0.5,compWeight:2.5,opponentElo:1810},
    {result:0,compWeight:2.5,opponentElo:1880},
  ],
  SWE: [
    {result:1,compWeight:2.0,opponentElo:1650},{result:0,compWeight:2.5,opponentElo:1970},
    {result:1,compWeight:2.0,opponentElo:1680},{result:0.5,compWeight:2.5,opponentElo:1840},
    {result:0,compWeight:2.5,opponentElo:1940},{result:1,compWeight:2.0,opponentElo:1660},
    {result:1,compWeight:2.5,opponentElo:1700},{result:0,compWeight:2.5,opponentElo:1880},
    {result:0.5,compWeight:2.0,opponentElo:1720},{result:1,compWeight:2.0,opponentElo:1660},
    {result:0,compWeight:2.5,opponentElo:1810},{result:1,compWeight:2.0,opponentElo:1640},
    {result:0.5,compWeight:2.0,opponentElo:1700},{result:0,compWeight:2.5,opponentElo:1880},
    {result:1,compWeight:2.0,opponentElo:1650},
  ],
  NOR: [
    {result:1,compWeight:2.5,opponentElo:1700},{result:1,compWeight:2.5,opponentElo:1760},
    {result:0,compWeight:2.5,opponentElo:1840},{result:1,compWeight:2.5,opponentElo:1720},
    {result:1,compWeight:2.0,opponentElo:1680},{result:0,compWeight:2.5,opponentElo:1940},
    {result:1,compWeight:2.5,opponentElo:1710},{result:0.5,compWeight:2.5,opponentElo:1810},
    {result:1,compWeight:2.0,opponentElo:1650},{result:0,compWeight:2.5,opponentElo:1880},
    {result:1,compWeight:2.5,opponentElo:1730},{result:0,compWeight:2.5,opponentElo:1840},
    {result:1,compWeight:2.0,opponentElo:1670},{result:0.5,compWeight:2.5,opponentElo:1810},
    {result:1,compWeight:2.0,opponentElo:1690},
  ],

  // ── CAF ─────────────────────────────────────────────────────────
  MAR: [
    {result:1,compWeight:2.5,opponentElo:1760},{result:1,compWeight:2.5,opponentElo:1730},
    {result:0.5,compWeight:2.5,opponentElo:1780},{result:1,compWeight:3.0,opponentElo:1830},
    {result:1,compWeight:3.0,opponentElo:1880},{result:1,compWeight:3.0,opponentElo:1965},
    {result:1,compWeight:2.0,opponentElo:1640},{result:1,compWeight:2.0,opponentElo:1680},
    {result:0,compWeight:3.0,opponentElo:2055},{result:1,compWeight:2.5,opponentElo:1760},
    {result:1,compWeight:2.5,opponentElo:1700},{result:0.5,compWeight:2.5,opponentElo:1780},
    {result:1,compWeight:2.0,opponentElo:1620},{result:1,compWeight:2.5,opponentElo:1730},
    {result:0,compWeight:2.5,opponentElo:1880},
  ],
  SEN: [
    {result:1,compWeight:2.5,opponentElo:1700},{result:1,compWeight:2.5,opponentElo:1730},
    {result:1,compWeight:2.5,opponentElo:1760},{result:0,compWeight:2.5,opponentElo:1830},
    {result:1,compWeight:2.5,opponentElo:1680},{result:1,compWeight:3.0,opponentElo:1760},
    {result:1,compWeight:2.0,opponentElo:1620},{result:0.5,compWeight:2.5,opponentElo:1780},
    {result:1,compWeight:2.0,opponentElo:1640},{result:1,compWeight:2.5,opponentElo:1700},
    {result:0,compWeight:2.5,opponentElo:1830},{result:1,compWeight:2.0,opponentElo:1620},
    {result:1,compWeight:2.5,opponentElo:1730},{result:0.5,compWeight:2.5,opponentElo:1760},
    {result:1,compWeight:2.0,opponentElo:1650},
  ],
  CIV: [
    {result:1,compWeight:2.5,opponentElo:1680},{result:1,compWeight:2.5,opponentElo:1700},
    {result:1,compWeight:3.0,opponentElo:1780},{result:1,compWeight:3.0,opponentElo:1730},
    {result:0,compWeight:3.0,opponentElo:1830},{result:1,compWeight:2.5,opponentElo:1650},
    {result:0.5,compWeight:2.5,opponentElo:1760},{result:1,compWeight:2.0,opponentElo:1600},
    {result:1,compWeight:2.5,opponentElo:1680},{result:1,compWeight:2.5,opponentElo:1720},
    {result:0,compWeight:2.5,opponentElo:1780},{result:1,compWeight:2.0,opponentElo:1630},
    {result:0.5,compWeight:2.5,opponentElo:1700},{result:1,compWeight:2.5,opponentElo:1760},
    {result:1,compWeight:2.0,opponentElo:1650},
  ],
  EGY: [
    {result:1,compWeight:2.5,opponentElo:1640},{result:0,compWeight:2.5,opponentElo:1780},
    {result:1,compWeight:2.5,opponentElo:1660},{result:0.5,compWeight:2.5,opponentElo:1700},
    {result:0,compWeight:2.5,opponentElo:1760},{result:1,compWeight:2.0,opponentElo:1620},
    {result:1,compWeight:2.5,opponentElo:1680},{result:0,compWeight:2.5,opponentElo:1780},
    {result:0.5,compWeight:2.5,opponentElo:1730},{result:1,compWeight:2.0,opponentElo:1600},
    {result:0,compWeight:2.5,opponentElo:1830},{result:1,compWeight:2.5,opponentElo:1660},
    {result:1,compWeight:2.0,opponentElo:1640},{result:0,compWeight:2.5,opponentElo:1780},
    {result:1,compWeight:2.5,opponentElo:1700},
  ],
  ALG: [
    {result:1,compWeight:2.0,opponentElo:1620},{result:0,compWeight:2.5,opponentElo:1780},
    {result:1,compWeight:2.0,opponentElo:1640},{result:0.5,compWeight:2.5,opponentElo:1700},
    {result:0,compWeight:2.5,opponentElo:1760},{result:1,compWeight:2.0,opponentElo:1600},
    {result:1,compWeight:2.0,opponentElo:1630},{result:0,compWeight:2.5,opponentElo:1730},
    {result:0.5,compWeight:2.5,opponentElo:1680},{result:1,compWeight:2.0,opponentElo:1610},
    {result:0,compWeight:2.5,opponentElo:1760},{result:1,compWeight:2.0,opponentElo:1640},
    {result:0.5,compWeight:2.0,opponentElo:1660},{result:0,compWeight:2.5,opponentElo:1780},
    {result:1,compWeight:2.0,opponentElo:1620},
  ],
  TUN: [
    {result:1,compWeight:2.0,opponentElo:1620},{result:0,compWeight:2.5,opponentElo:1730},
    {result:0.5,compWeight:2.5,opponentElo:1680},{result:1,compWeight:2.0,opponentElo:1610},
    {result:0,compWeight:2.5,opponentElo:1760},{result:1,compWeight:2.0,opponentElo:1590},
    {result:0,compWeight:2.5,opponentElo:1780},{result:0.5,compWeight:2.0,opponentElo:1640},
    {result:1,compWeight:2.0,opponentElo:1600},{result:0,compWeight:2.5,opponentElo:1730},
    {result:1,compWeight:2.0,opponentElo:1620},{result:0.5,compWeight:2.0,opponentElo:1660},
    {result:0,compWeight:2.5,opponentElo:1760},{result:1,compWeight:2.0,opponentElo:1620},
    {result:0,compWeight:2.5,opponentElo:1730},
  ],
  GHA: [
    {result:1,compWeight:2.0,opponentElo:1580},{result:0,compWeight:2.5,opponentElo:1730},
    {result:0.5,compWeight:2.5,opponentElo:1680},{result:1,compWeight:2.0,opponentElo:1600},
    {result:0,compWeight:2.5,opponentElo:1760},{result:1,compWeight:2.0,opponentElo:1580},
    {result:0,compWeight:2.5,opponentElo:1780},{result:0.5,compWeight:2.0,opponentElo:1640},
    {result:1,compWeight:2.0,opponentElo:1590},{result:0,compWeight:2.5,opponentElo:1760},
    {result:1,compWeight:2.0,opponentElo:1570},{result:0.5,compWeight:2.0,opponentElo:1650},
    {result:0,compWeight:2.5,opponentElo:1730},{result:1,compWeight:2.0,opponentElo:1590},
    {result:0,compWeight:2.5,opponentElo:1760},
  ],
  CPV: [
    {result:1,compWeight:2.0,opponentElo:1490},{result:1,compWeight:2.0,opponentElo:1510},
    {result:0.5,compWeight:2.5,opponentElo:1700},{result:0,compWeight:2.5,opponentElo:1730},
    {result:1,compWeight:2.0,opponentElo:1480},{result:0,compWeight:2.5,opponentElo:1760},
    {result:1,compWeight:2.0,opponentElo:1500},{result:0.5,compWeight:2.0,opponentElo:1540},
    {result:0,compWeight:2.5,opponentElo:1780},{result:1,compWeight:2.0,opponentElo:1490},
    {result:0,compWeight:2.5,opponentElo:1730},{result:0.5,compWeight:2.0,opponentElo:1530},
    {result:1,compWeight:2.0,opponentElo:1490},{result:0,compWeight:2.5,opponentElo:1760},
    {result:1,compWeight:2.0,opponentElo:1510},
  ],
  COD: [
    {result:1,compWeight:2.0,opponentElo:1500},{result:0,compWeight:2.5,opponentElo:1700},
    {result:0.5,compWeight:2.0,opponentElo:1540},{result:1,compWeight:2.0,opponentElo:1480},
    {result:0,compWeight:2.5,opponentElo:1730},{result:1,compWeight:2.0,opponentElo:1500},
    {result:0,compWeight:2.5,opponentElo:1760},{result:0.5,compWeight:2.0,opponentElo:1520},
    {result:1,compWeight:2.0,opponentElo:1490},{result:0,compWeight:2.5,opponentElo:1780},
    {result:1,compWeight:2.0,opponentElo:1510},{result:0.5,compWeight:2.0,opponentElo:1560},
    {result:0,compWeight:2.5,opponentElo:1730},{result:1,compWeight:2.0,opponentElo:1500},
    {result:0,compWeight:2.5,opponentElo:1760},
  ],

  // ── AFC ─────────────────────────────────────────────────────────
  JPN: [
    {result:1,compWeight:2.0,opponentElo:1680},{result:1,compWeight:2.0,opponentElo:1720},
    {result:0,compWeight:2.5,opponentElo:1870},{result:1,compWeight:2.0,opponentElo:1650},
    {result:1,compWeight:2.0,opponentElo:1700},{result:0,compWeight:3.0,opponentElo:1985},
    {result:1,compWeight:2.0,opponentElo:1670},{result:1,compWeight:2.0,opponentElo:1690},
    {result:0,compWeight:2.5,opponentElo:1830},{result:1,compWeight:2.0,opponentElo:1660},
    {result:1,compWeight:2.0,opponentElo:1680},{result:0.5,compWeight:2.0,opponentElo:1770},
    {result:1,compWeight:2.0,opponentElo:1650},{result:1,compWeight:2.0,opponentElo:1720},
    {result:0,compWeight:2.5,opponentElo:1830},
  ],
  IRN: [
    {result:1,compWeight:2.0,opponentElo:1620},{result:1,compWeight:2.0,opponentElo:1650},
    {result:0,compWeight:2.0,opponentElo:1830},{result:1,compWeight:2.0,opponentElo:1640},
    {result:1,compWeight:2.0,opponentElo:1670},{result:0,compWeight:2.5,opponentElo:1830},
    {result:1,compWeight:2.0,opponentElo:1630},{result:0.5,compWeight:2.0,opponentElo:1680},
    {result:0,compWeight:2.0,opponentElo:1770},{result:1,compWeight:2.0,opponentElo:1640},
    {result:1,compWeight:2.0,opponentElo:1660},{result:0,compWeight:2.0,opponentElo:1780},
    {result:0.5,compWeight:2.0,opponentElo:1700},{result:1,compWeight:2.0,opponentElo:1650},
    {result:0,compWeight:2.5,opponentElo:1830},
  ],
  AUS: [
    {result:1,compWeight:2.0,opponentElo:1600},{result:1,compWeight:2.0,opponentElo:1650},
    {result:0,compWeight:2.5,opponentElo:1830},{result:1,compWeight:2.0,opponentElo:1620},
    {result:0.5,compWeight:2.0,opponentElo:1680},{result:1,compWeight:2.0,opponentElo:1610},
    {result:0,compWeight:2.0,opponentElo:1770},{result:1,compWeight:2.0,opponentElo:1640},
    {result:1,compWeight:2.0,opponentElo:1660},{result:0,compWeight:2.5,opponentElo:1830},
    {result:0.5,compWeight:2.0,opponentElo:1680},{result:1,compWeight:2.0,opponentElo:1620},
    {result:0,compWeight:2.0,opponentElo:1780},{result:1,compWeight:2.0,opponentElo:1640},
    {result:1,compWeight:2.0,opponentElo:1660},
  ],
  SAU: [
    {result:1,compWeight:2.0,opponentElo:1600},{result:0,compWeight:2.0,opponentElo:1770},
    {result:1,compWeight:2.0,opponentElo:1620},{result:0.5,compWeight:2.0,opponentElo:1680},
    {result:0,compWeight:2.0,opponentElo:1830},{result:1,compWeight:2.0,opponentElo:1610},
    {result:0,compWeight:3.0,opponentElo:1970},{result:0.5,compWeight:2.0,opponentElo:1650},
    {result:1,compWeight:2.0,opponentElo:1630},{result:0,compWeight:2.0,opponentElo:1780},
    {result:1,compWeight:2.0,opponentElo:1600},{result:0.5,compWeight:2.0,opponentElo:1670},
    {result:0,compWeight:2.0,opponentElo:1830},{result:1,compWeight:2.0,opponentElo:1620},
    {result:0,compWeight:2.0,opponentElo:1770},
  ],
  UZB: [
    {result:1,compWeight:2.0,opponentElo:1560},{result:1,compWeight:2.0,opponentElo:1600},
    {result:0,compWeight:2.0,opponentElo:1770},{result:0.5,compWeight:2.0,opponentElo:1680},
    {result:1,compWeight:2.0,opponentElo:1580},{result:0,compWeight:2.0,opponentElo:1830},
    {result:1,compWeight:2.0,opponentElo:1570},{result:0.5,compWeight:2.0,opponentElo:1640},
    {result:0,compWeight:2.0,opponentElo:1720},{result:1,compWeight:2.0,opponentElo:1590},
    {result:1,compWeight:2.0,opponentElo:1620},{result:0,compWeight:2.0,opponentElo:1770},
    {result:0.5,compWeight:2.0,opponentElo:1650},{result:1,compWeight:2.0,opponentElo:1580},
    {result:0,compWeight:2.0,opponentElo:1830},
  ],
  IRQ: [
    {result:1,compWeight:2.0,opponentElo:1490},{result:0,compWeight:2.0,opponentElo:1770},
    {result:0.5,compWeight:2.0,opponentElo:1640},{result:1,compWeight:2.0,opponentElo:1510},
    {result:0,compWeight:2.0,opponentElo:1830},{result:0.5,compWeight:2.0,opponentElo:1620},
    {result:1,compWeight:2.0,opponentElo:1500},{result:0,compWeight:2.0,opponentElo:1780},
    {result:0.5,compWeight:2.0,opponentElo:1650},{result:1,compWeight:2.0,opponentElo:1510},
    {result:0,compWeight:2.0,opponentElo:1770},{result:0.5,compWeight:2.0,opponentElo:1640},
    {result:0,compWeight:2.0,opponentElo:1830},{result:1,compWeight:2.0,opponentElo:1500},
    {result:0,compWeight:2.0,opponentElo:1780},
  ],
  JOR: [
    {result:1,compWeight:2.0,opponentElo:1490},{result:0,compWeight:2.0,opponentElo:1770},
    {result:0.5,compWeight:2.0,opponentElo:1640},{result:1,compWeight:2.0,opponentElo:1510},
    {result:1,compWeight:2.5,opponentElo:1720},{result:0,compWeight:2.5,opponentElo:1830},
    {result:1,compWeight:2.5,opponentElo:1680},{result:0.5,compWeight:2.5,opponentElo:1770},
    {result:0,compWeight:2.5,opponentElo:1830},{result:1,compWeight:2.0,opponentElo:1510},
    {result:0,compWeight:2.0,opponentElo:1780},{result:0.5,compWeight:2.0,opponentElo:1640},
    {result:1,compWeight:2.0,opponentElo:1500},{result:0,compWeight:2.5,opponentElo:1720},
    {result:0.5,compWeight:2.0,opponentElo:1660},
  ],

  // ── OFC ─────────────────────────────────────────────────────────
  NZL: [
    {result:1,compWeight:1.5,opponentElo:1400},{result:1,compWeight:1.5,opponentElo:1380},
    {result:0,compWeight:2.0,opponentElo:1750},{result:1,compWeight:1.5,opponentElo:1420},
    {result:1,compWeight:1.5,opponentElo:1410},{result:0.5,compWeight:2.0,opponentElo:1680},
    {result:1,compWeight:1.5,opponentElo:1390},{result:0,compWeight:2.0,opponentElo:1770},
    {result:1,compWeight:1.5,opponentElo:1400},{result:0.5,compWeight:2.0,opponentElo:1620},
    {result:0,compWeight:2.0,opponentElo:1750},{result:1,compWeight:1.5,opponentElo:1390},
    {result:1,compWeight:1.5,opponentElo:1420},{result:0,compWeight:2.0,opponentElo:1720},
    {result:1,compWeight:1.5,opponentElo:1400},
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

  // Update with home team's recent form (opponent-quality weighted)
  const homeForm = TEAM_FORM[homeCode]
  if (homeForm) {
    homeForm.forEach((r, idx) => {
      const recencyW = 0.4 + (idx / homeForm.length) * 0.6
      const opponentQ = Math.max(0.5, Math.min(1.5, r.opponentElo / 1800))
      const w = r.compWeight * recencyW * opponentQ
      alphaH += r.result * w
      alphaA += (1 - r.result) * w
      alphaD += (r.result === 0.5 ? 0.5 : 0) * w * 0.3
    })
  }

  // Update with away team's form (from away perspective, weighted less)
  const awayForm = TEAM_FORM[awayCode]
  if (awayForm) {
    awayForm.forEach((r, idx) => {
      const recencyW = 0.4 + (idx / awayForm.length) * 0.6
      const opponentQ = Math.max(0.5, Math.min(1.5, r.opponentElo / 1800))
      const w = r.compWeight * recencyW * opponentQ * 0.7  // away form weighted less
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
