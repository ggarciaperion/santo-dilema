export type Phase =
  | 'groups'
  | 'round32'
  | 'round16'
  | 'quarterfinal'
  | 'semifinal'
  | 'thirdplace'
  | 'final'

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed'

export type Confederation = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC'

export interface Team {
  id: string         // FIFA code, e.g. "ARG"
  name: string       // Full name
  shortName: string  // e.g. "Argentina"
  code: string       // 3-letter FIFA code
  flag: string       // emoji flag
  confederation: Confederation
  eloRating: number  // World Football Elo rating
  fifaRanking?: number
  apiFootballId?: number
}

export interface Venue {
  id: string
  name: string
  city: string
  country: 'USA' | 'Mexico' | 'Canada'
  capacity: number
  altitude: number   // meters above sea level
  timezone: string   // IANA timezone
}

export interface Match {
  id: string
  apiFootballId?: number
  homeTeamId: string
  awayTeamId: string
  homeScore?: number
  awayScore?: number
  homeScorePenalties?: number
  awayScorePenalties?: number
  date: string           // ISO UTC
  venue: Venue
  phase: Phase
  group?: string         // 'A' through 'L'
  matchday?: number      // 1, 2, or 3 (group stage)
  roundLabel?: string    // "Ronda de 32 — Partido 1"
  status: MatchStatus
  minute?: number        // live minute
  elapsed?: number
}

export interface MatchWithTeams extends Match {
  home: Team
  away: Team
}

// ── Prediction types ───────────────────────────────────────────────

export interface EloModel {
  homeWin: number
  draw:    number
  awayWin: number
}

export interface PoissonModel {
  homeWin:         number
  draw:            number
  awayWin:         number
  expectedGoalsH:  number
  expectedGoalsA:  number
}

export interface ScoreProbability {
  homeGoals: number
  awayGoals: number
  probability: number
}

export interface Prediction {
  matchId:    string
  generatedAt: string
  homeWinProb: number
  drawProb:    number
  awayWinProb: number
  mostLikelyScores: ScoreProbability[]
  confidence: 'low' | 'medium' | 'high' | 'very-high'
  summary: string
  models: {
    elo:      EloModel
    poisson:  PoissonModel
    ensemble: EloModel
  }
}

// ── Analysis types (Phase 2+) ─────────────────────────────────────

export interface FormRecord {
  wins:   number
  draws:  number
  losses: number
  gf:     number
  ga:     number
}

export interface TeamForm {
  last5:  FormRecord
  last10: FormRecord
  last20: FormRecord
  xG?:   number
  xGA?:  number
  cleanSheets?: number
  avgPossession?: number
}

export interface H2HMatch {
  date:        string
  competition: string
  homeTeam:    string
  awayTeam:    string
  homeScore:   number
  awayScore:   number
}

export interface H2HRecord {
  totalMatches: number
  homeWins:     number
  draws:        number
  awayWins:     number
  homeGoals:    number
  awayGoals:    number
  recent:       H2HMatch[]
}

export interface MatchAnalysis {
  matchId:   string
  home:      Team
  away:      Team
  homeForm:  TeamForm
  awayForm:  TeamForm
  h2h:       H2HRecord
  prediction: Prediction
  venue:     Venue
  generatedAt: string
}

// ── API response types ────────────────────────────────────────────

export interface ApiFixturesResponse {
  fixtures: MatchWithTeams[]
  source: 'api' | 'cache' | 'fallback'
  cachedAt?: string
  nextRefresh?: string
}
