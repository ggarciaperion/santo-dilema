/**
 * Parámetros de equipo para modelos predictivos
 *
 * attack:   multiplicador ofensivo (1.0 = promedio mundial)
 * defense:  multiplicador defensivo (menor = mejor defensa)
 *
 * Los parámetros se estiman a partir de:
 * - Clasificatorias 2022-2026 (ponderadas por tiempo)
 * - Torneos recientes: Euro 2024, Copa América 2024, AFCON 2023, Copa Asia 2023
 * - Rendimiento WC 2022
 * - ELO World Football Rating actual
 *
 * En Dixon-Coles:
 *   λ_h (goles esperados local)    = attack_h × defense_a × avgGoals × homeAdv
 *   μ_a (goles esperados visitante) = attack_a × defense_h × avgGoals
 *   avgGoals internacional ≈ 1.35
 */

import type { TeamParams } from '../types'

// Ventaja de sede para anfitriones (MEX, USA, CAN)
export const HOST_ADVANTAGE = 1.35

// Ventaja de local en partidos neutrales
export const NEUTRAL_VENUE_ADV = 1.05

// ρ (rho) de Dixon-Coles: corrección para marcadores bajos
// Valor negativo aumenta P(0-0) y P(1-1), calibrado en partidos internacionales
export const DC_RHO = -0.10

// Promedio de goles por partido en torneos internacionales (base)
export const AVG_GOALS_BASE = 1.35

export const TEAM_PARAMS: Record<string, TeamParams> = {

  // ── GROUP A ─────────────────────────────────────────────────────
  MEX: {
    code: 'MEX', attack: 1.40, defense: 0.82,
    xGFor: 1.65, xGAgainst: 1.05,
    formScore: 0.62, wcHistory: 7.0, pressureRating: 0.72,
    isHost: true,
  },
  ZAF: {
    code: 'ZAF', attack: 0.88, defense: 1.05,
    xGFor: 1.05, xGAgainst: 1.30,
    formScore: 0.48, wcHistory: 3.5, pressureRating: 0.60,
    isHost: false,
  },
  KOR: {
    code: 'KOR', attack: 1.12, defense: 0.92,
    xGFor: 1.28, xGAgainst: 1.15,
    formScore: 0.55, wcHistory: 5.5, pressureRating: 0.75,
    isHost: false,
  },
  CZE: {
    code: 'CZE', attack: 1.10, defense: 0.95,
    xGFor: 1.22, xGAgainst: 1.18,
    formScore: 0.53, wcHistory: 5.0, pressureRating: 0.68,
    isHost: false,
  },

  // ── GROUP B ─────────────────────────────────────────────────────
  CAN: {
    code: 'CAN', attack: 1.28, defense: 0.88,
    xGFor: 1.42, xGAgainst: 1.10,
    formScore: 0.60, wcHistory: 2.0, pressureRating: 0.55,
    isHost: true,
  },
  BIH: {
    code: 'BIH', attack: 1.02, defense: 1.00,
    xGFor: 1.15, xGAgainst: 1.25,
    formScore: 0.50, wcHistory: 2.5, pressureRating: 0.58,
    isHost: false,
  },
  QAT: {
    code: 'QAT', attack: 0.72, defense: 1.18,
    xGFor: 0.88, xGAgainst: 1.45,
    formScore: 0.38, wcHistory: 2.0, pressureRating: 0.40,
    isHost: false,
  },
  SUI: {
    code: 'SUI', attack: 1.22, defense: 0.82,
    xGFor: 1.38, xGAgainst: 1.02,
    formScore: 0.62, wcHistory: 5.5, pressureRating: 0.72,
    isHost: false,
  },

  // ── GROUP C ─────────────────────────────────────────────────────
  BRA: {
    code: 'BRA', attack: 1.58, defense: 0.72,
    xGFor: 2.02, xGAgainst: 0.90,
    formScore: 0.65, wcHistory: 9.5, pressureRating: 0.80,
    isHost: false,
  },
  MAR: {
    code: 'MAR', attack: 1.22, defense: 0.72,
    xGFor: 1.30, xGAgainst: 0.88,
    formScore: 0.68, wcHistory: 5.0, pressureRating: 0.92,
    isHost: false,
  },
  HAI: {
    code: 'HAI', attack: 0.72, defense: 1.22,
    xGFor: 0.82, xGAgainst: 1.50,
    formScore: 0.40, wcHistory: 1.5, pressureRating: 0.45,
    isHost: false,
  },
  SCO: {
    code: 'SCO', attack: 1.05, defense: 0.98,
    xGFor: 1.18, xGAgainst: 1.22,
    formScore: 0.52, wcHistory: 3.5, pressureRating: 0.62,
    isHost: false,
  },

  // ── GROUP D ─────────────────────────────────────────────────────
  USA: {
    code: 'USA', attack: 1.32, defense: 0.85,
    xGFor: 1.48, xGAgainst: 1.05,
    formScore: 0.65, wcHistory: 6.0, pressureRating: 0.70,
    isHost: true,
  },
  PAR: {
    code: 'PAR', attack: 1.02, defense: 0.95,
    xGFor: 1.12, xGAgainst: 1.18,
    formScore: 0.52, wcHistory: 5.5, pressureRating: 0.70,
    isHost: false,
  },
  AUS: {
    code: 'AUS', attack: 1.05, defense: 0.98,
    xGFor: 1.18, xGAgainst: 1.22,
    formScore: 0.55, wcHistory: 4.5, pressureRating: 0.72,
    isHost: false,
  },
  TUR: {
    code: 'TUR', attack: 1.22, defense: 0.88,
    xGFor: 1.35, xGAgainst: 1.08,
    formScore: 0.60, wcHistory: 5.0, pressureRating: 0.68,
    isHost: false,
  },

  // ── GROUP E ─────────────────────────────────────────────────────
  GER: {
    code: 'GER', attack: 1.62, defense: 0.85,
    xGFor: 2.05, xGAgainst: 1.05,
    formScore: 0.68, wcHistory: 9.0, pressureRating: 0.85,
    isHost: false,
  },
  CUW: {
    code: 'CUW', attack: 0.62, defense: 1.32,
    xGFor: 0.72, xGAgainst: 1.62,
    formScore: 0.35, wcHistory: 1.0, pressureRating: 0.42,
    isHost: false,
  },
  CIV: {
    code: 'CIV', attack: 1.12, defense: 0.95,
    xGFor: 1.25, xGAgainst: 1.18,
    formScore: 0.60, wcHistory: 4.0, pressureRating: 0.65,
    isHost: false,
  },
  ECU: {
    code: 'ECU', attack: 1.12, defense: 0.90,
    xGFor: 1.28, xGAgainst: 1.12,
    formScore: 0.58, wcHistory: 4.0, pressureRating: 0.65,
    isHost: false,
  },

  // ── GROUP F ─────────────────────────────────────────────────────
  NED: {
    code: 'NED', attack: 1.48, defense: 0.72,
    xGFor: 1.82, xGAgainst: 0.90,
    formScore: 0.68, wcHistory: 8.0, pressureRating: 0.80,
    isHost: false,
  },
  JPN: {
    code: 'JPN', attack: 1.22, defense: 0.82,
    xGFor: 1.35, xGAgainst: 1.00,
    formScore: 0.70, wcHistory: 5.5, pressureRating: 0.82,
    isHost: false,
  },
  SWE: {
    code: 'SWE', attack: 1.28, defense: 0.82,
    xGFor: 1.42, xGAgainst: 1.02,
    formScore: 0.62, wcHistory: 6.5, pressureRating: 0.75,
    isHost: false,
  },
  TUN: {
    code: 'TUN', attack: 0.85, defense: 1.05,
    xGFor: 0.98, xGAgainst: 1.28,
    formScore: 0.48, wcHistory: 3.5, pressureRating: 0.52,
    isHost: false,
  },

  // ── GROUP G ─────────────────────────────────────────────────────
  BEL: {
    code: 'BEL', attack: 1.42, defense: 0.78,
    xGFor: 1.72, xGAgainst: 0.95,
    formScore: 0.65, wcHistory: 7.5, pressureRating: 0.75,
    isHost: false,
  },
  EGY: {
    code: 'EGY', attack: 0.95, defense: 0.98,
    xGFor: 1.08, xGAgainst: 1.20,
    formScore: 0.52, wcHistory: 3.5, pressureRating: 0.60,
    isHost: false,
  },
  IRN: {
    code: 'IRN', attack: 0.95, defense: 0.90,
    xGFor: 1.08, xGAgainst: 1.12,
    formScore: 0.55, wcHistory: 4.0, pressureRating: 0.62,
    isHost: false,
  },
  NZL: {
    code: 'NZL', attack: 0.72, defense: 1.12,
    xGFor: 0.82, xGAgainst: 1.38,
    formScore: 0.42, wcHistory: 2.5, pressureRating: 0.50,
    isHost: false,
  },

  // ── GROUP H ─────────────────────────────────────────────────────
  ESP: {
    code: 'ESP', attack: 1.88, defense: 0.60,
    xGFor: 2.25, xGAgainst: 0.72,
    formScore: 0.82, wcHistory: 8.5, pressureRating: 0.90,
    isHost: false,
  },
  CPV: {
    code: 'CPV', attack: 0.82, defense: 1.08,
    xGFor: 0.95, xGAgainst: 1.32,
    formScore: 0.48, wcHistory: 2.0, pressureRating: 0.52,
    isHost: false,
  },
  SAU: {
    code: 'SAU', attack: 0.88, defense: 1.05,
    xGFor: 1.00, xGAgainst: 1.28,
    formScore: 0.50, wcHistory: 4.0, pressureRating: 0.58,
    isHost: false,
  },
  URU: {
    code: 'URU', attack: 1.35, defense: 0.72,
    xGFor: 1.52, xGAgainst: 0.88,
    formScore: 0.65, wcHistory: 8.5, pressureRating: 0.82,
    isHost: false,
  },

  // ── GROUP I ─────────────────────────────────────────────────────
  FRA: {
    code: 'FRA', attack: 1.65, defense: 0.72,
    xGFor: 2.00, xGAgainst: 0.88,
    formScore: 0.72, wcHistory: 9.0, pressureRating: 0.88,
    isHost: false,
  },
  SEN: {
    code: 'SEN', attack: 1.12, defense: 0.82,
    xGFor: 1.28, xGAgainst: 1.00,
    formScore: 0.65, wcHistory: 4.5, pressureRating: 0.75,
    isHost: false,
  },
  IRQ: {
    code: 'IRQ', attack: 0.80, defense: 1.12,
    xGFor: 0.92, xGAgainst: 1.38,
    formScore: 0.45, wcHistory: 3.0, pressureRating: 0.52,
    isHost: false,
  },
  NOR: {
    code: 'NOR', attack: 1.28, defense: 0.82,
    xGFor: 1.45, xGAgainst: 1.00,
    formScore: 0.62, wcHistory: 3.5, pressureRating: 0.68,
    isHost: false,
  },

  // ── GROUP J ─────────────────────────────────────────────────────
  ARG: {
    code: 'ARG', attack: 1.75, defense: 0.68,
    xGFor: 2.10, xGAgainst: 0.82,
    formScore: 0.80, wcHistory: 9.5, pressureRating: 0.95,
    isHost: false,
  },
  ALG: {
    code: 'ALG', attack: 0.90, defense: 1.00,
    xGFor: 1.02, xGAgainst: 1.22,
    formScore: 0.50, wcHistory: 4.0, pressureRating: 0.60,
    isHost: false,
  },
  AUT: {
    code: 'AUT', attack: 1.22, defense: 0.85,
    xGFor: 1.38, xGAgainst: 1.05,
    formScore: 0.62, wcHistory: 4.5, pressureRating: 0.68,
    isHost: false,
  },
  JOR: {
    code: 'JOR', attack: 0.68, defense: 1.15,
    xGFor: 0.78, xGAgainst: 1.42,
    formScore: 0.40, wcHistory: 1.5, pressureRating: 0.45,
    isHost: false,
  },

  // ── GROUP K ─────────────────────────────────────────────────────
  POR: {
    code: 'POR', attack: 1.72, defense: 0.78,
    xGFor: 2.05, xGAgainst: 0.95,
    formScore: 0.75, wcHistory: 7.5, pressureRating: 0.82,
    isHost: false,
  },
  COD: {
    code: 'COD', attack: 0.80, defense: 1.05,
    xGFor: 0.92, xGAgainst: 1.28,
    formScore: 0.48, wcHistory: 3.5, pressureRating: 0.55,
    isHost: false,
  },
  UZB: {
    code: 'UZB', attack: 0.82, defense: 1.05,
    xGFor: 0.95, xGAgainst: 1.28,
    formScore: 0.48, wcHistory: 1.5, pressureRating: 0.50,
    isHost: false,
  },
  COL: {
    code: 'COL', attack: 1.38, defense: 0.80,
    xGFor: 1.55, xGAgainst: 0.98,
    formScore: 0.68, wcHistory: 6.0, pressureRating: 0.75,
    isHost: false,
  },

  // ── GROUP L ─────────────────────────────────────────────────────
  ENG: {
    code: 'ENG', attack: 1.50, defense: 0.70,
    xGFor: 1.82, xGAgainst: 0.88,
    formScore: 0.70, wcHistory: 7.5, pressureRating: 0.78,
    isHost: false,
  },
  CRO: {
    code: 'CRO', attack: 1.18, defense: 0.80,
    xGFor: 1.32, xGAgainst: 0.98,
    formScore: 0.58, wcHistory: 7.0, pressureRating: 0.88,
    isHost: false,
  },
  GHA: {
    code: 'GHA', attack: 0.95, defense: 1.05,
    xGFor: 1.08, xGAgainst: 1.28,
    formScore: 0.50, wcHistory: 4.5, pressureRating: 0.62,
    isHost: false,
  },
  PAN: {
    code: 'PAN', attack: 0.72, defense: 1.18,
    xGFor: 0.82, xGAgainst: 1.45,
    formScore: 0.42, wcHistory: 2.5, pressureRating: 0.48,
    isHost: false,
  },
}

export function getTeamParams(code: string): TeamParams {
  return TEAM_PARAMS[code] ?? {
    code,
    attack: 1.0, defense: 1.0,
    xGFor: 1.35, xGAgainst: 1.35,
    formScore: 0.50, wcHistory: 3.0, pressureRating: 0.60,
    isHost: false,
  }
}
