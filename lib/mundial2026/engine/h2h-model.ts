/**
 * Head-to-Head Adjustment Layer
 *
 * Applies a H2H-informed probability adjustment on top of the base ensemble.
 * The adjustment is conservative (max ±12%) to avoid over-fitting on historical data
 * that may not reflect current squad quality.
 *
 * Formula:
 *   h2hHomeWin = h2h.winRate (from home team's perspective)
 *   h2hAway    = h2h.lossRate
 *   h2hDraw    = h2h.drawRate
 *
 *   blendFactor = min(0.12, played / 80)   -- more matches = more weight, cap at 12%
 *   wcBoost     = wcMeets * 0.01           -- WC encounters add up to 6% more weight
 *
 *   finalBlend  = min(0.15, blendFactor + wcBoost)
 *
 *   adjusted_home = (1 - finalBlend) * ensemble.homeWin + finalBlend * h2hHomeWin
 *   adjusted_draw = (1 - finalBlend) * ensemble.draw    + finalBlend * h2hDraw
 *   adjusted_away = (1 - finalBlend) * ensemble.awayWin + finalBlend * h2hAway
 *   (then normalize to sum = 1)
 *
 * Returns the adjustment delta (not the final probabilities — those are computed
 * in ensemble.ts after blending).
 */

import { getH2HPerspective } from '../data/h2h'
import type { H2HAdjustment } from '../types'

export type { H2HAdjustment }

export function calcH2HAdjustment(
  homeCode:      string,
  awayCode:      string,
  ensembleHome:  number,
  ensembleDraw:  number,
  ensembleAway:  number,
): H2HAdjustment {
  const h = getH2HPerspective(homeCode, awayCode)

  if (!h || h.played < 4) {
    return {
      hasData: false,
      blendFactor: 0,
      h2hHomeWin: ensembleHome,
      h2hDraw:    ensembleDraw,
      h2hAwayWin: ensembleAway,
      played:     0,
      wcMeets:    0,
      deltaHomeWin: 0,
      deltaAwayWin: 0,
    }
  }

  // More historical matches → more confidence in H2H
  const blendFactor = Math.min(0.12, h.played / 80)
  // World Cup encounters extra weight
  const wcBoost = Math.min(0.04, h.wcMeets * 0.01)
  const finalBlend = Math.min(0.15, blendFactor + wcBoost)

  const h2hHomeWin = h.winRate
  const h2hDraw    = h.drawRate
  const h2hAwayWin = h.lossRate

  // Blended probabilities
  const rawHome = (1 - finalBlend) * ensembleHome + finalBlend * h2hHomeWin
  const rawDraw = (1 - finalBlend) * ensembleDraw + finalBlend * h2hDraw
  const rawAway = (1 - finalBlend) * ensembleAway + finalBlend * h2hAwayWin
  const total = rawHome + rawDraw + rawAway

  return {
    hasData:     true,
    blendFactor: finalBlend,
    h2hHomeWin:  rawHome / total,
    h2hDraw:     rawDraw / total,
    h2hAwayWin:  rawAway / total,
    played:      h.played,
    wcMeets:     h.wcMeets,
    deltaHomeWin: rawHome / total - ensembleHome,
    deltaAwayWin: rawAway / total - ensembleAway,
  }
}
