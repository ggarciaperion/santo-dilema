export type Phase =
  | 'groups'
  | 'round32'
  | 'round16'
  | 'quarterfinal'
  | 'semifinal'
  | 'thirdplace'
  | 'final'

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed'

export interface MatchEvent {
  type: 'goal' | 'own_goal' | 'penalty' | 'yellow' | 'red'
  minute: string      // e.g. "9'" or "45+2'"
  playerName: string
  side: 'home' | 'away'
}

export type Confederation = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC'

export interface Team {
  id: string
  name: string
  shortName: string
  code: string
  flag: string
  confederation: Confederation
  eloRating: number
  fifaRanking?: number
  apiFootballId?: number
}

export interface Venue {
  id: string
  name: string
  city: string
  country: 'USA' | 'Mexico' | 'Canada'
  capacity: number
  altitude: number
  timezone: string
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
  date: string
  venue: Venue
  phase: Phase
  group?: string
  matchday?: number
  roundLabel?: string
  status: MatchStatus
  minute?: number
  elapsed?: number
  events?: MatchEvent[]
}

export interface MatchWithTeams extends Match {
  home: Team
  away: Team
}

// ── Team parameters for predictive models ─────────────────────────

export interface TeamParams {
  code: string
  // Dixon-Coles parameters
  attack: number         // Offensive multiplier (1.0 = average)
  defense: number        // Defensive multiplier (lower = better, 1.0 = average)
  // Advanced metrics (from qualifiers/recent tournaments)
  xGFor: number          // Expected goals scored per 90
  xGAgainst: number      // Expected goals conceded per 90
  // Form (last 15 competitive matches, 0-1 scale)
  formScore: number
  // World Cup history (0-10 scale)
  wcHistory: number
  // Pressure performance: elimination stages vs group stage ratio (1.0 = same)
  pressureRating: number
  // Home/host advantage (applies to MEX, USA, CAN)
  isHost: boolean
}

// ── Prediction types ───────────────────────────────────────────────

export interface EloModel {
  homeWin: number
  draw:    number
  awayWin: number
}

export interface DixonColesResult {
  homeWin:        number
  draw:           number
  awayWin:        number
  expectedGoalsH: number
  expectedGoalsA: number
  rho:            number
  // Score matrix up to 5x5
  scoreMatrix:    number[][]
}

export interface MonteCarloResult {
  homeWin:    number
  draw:       number
  awayWin:    number
  iterations: number
  // Most likely scores with probabilities
  topScores:  ScoreProbability[]
  // Confidence intervals (95%)
  homeWinCI:  [number, number]
  drawCI:     [number, number]
  awayWinCI:  [number, number]
}

export interface BayesianResult {
  homeWin:     number
  draw:        number
  awayWin:     number
  // 95% highest posterior density interval
  homeWinHPD:  [number, number]
  priorWeight: number
}

export interface EnsembleResult {
  homeWin:  number
  draw:     number
  awayWin:  number
  // Model contributions
  weights: {
    dixon:   number
    elo:     number
    bayesian: number
  }
}

// ── Score probability ──────────────────────────────────────────────

export interface ScoreProbability {
  homeGoals:   number
  awayGoals:   number
  probability: number
}

// ── Value analysis (betting market) ───────────────────────────────

export interface OddsEntry {
  bookmaker:    string
  homeOdds:     number    // decimal
  drawOdds:     number
  awayOdds:     number
  timestamp:    string
}

export interface ValueAnalysis {
  hasOdds:          boolean
  bestHomeOdds?:    number
  bestDrawOdds?:    number
  bestAwayOdds?:    number
  pinnacleHomeOdds?: number
  pinnacleDrawOdds?: number
  pinnacleAwayOdds?: number
  // Fair probabilities (vig removed)
  fairHomeProb?:    number
  fairDrawProb?:    number
  fairAwayProb?:    number
  // Expected value vs our model
  homeEV?:          number
  drawEV?:          number
  awayEV?:          number
  // Value bets (our prob > market fair prob + threshold)
  valueHome?:       boolean
  valueDraw?:       boolean
  valueAway?:       boolean
  // Sharp money signal
  sharpSignal?:     'home' | 'draw' | 'away' | null
  marketSource:     'live' | 'cached' | 'unavailable'
}

// ── Confidence & risk ──────────────────────────────────────────────

export type ConfidenceLevel = 'very-high' | 'high' | 'medium' | 'low'

export interface RiskFactor {
  type: 'altitude' | 'form' | 'h2h' | 'market' | 'fatigue' | 'host' | 'pressure'
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  magnitude: 'low' | 'medium' | 'high'
}

export interface ConfidenceAssessment {
  level:         ConfidenceLevel
  score:         number          // 0-100
  factors:       RiskFactor[]
  summary:       string
}

// ── Full advanced prediction ───────────────────────────────────────

export interface AdvancedPrediction {
  matchId:     string
  generatedAt: string
  // Final ensemble probabilities
  homeWinProb: number
  drawProb:    number
  awayWinProb: number
  // Top scorelines
  topScores:   ScoreProbability[]
  // Individual models
  models: {
    dixonColes: DixonColesResult
    monteCarlo: MonteCarloResult
    bayesian:   BayesianResult
    elo:        EloModel
    ensemble:   EnsembleResult
  }
  // Team radars (0-100 scale for each dimension)
  homeRadar: TeamRadar
  awayRadar: TeamRadar
  // Market intelligence
  valueAnalysis: ValueAnalysis
  // Confidence
  confidence: ConfidenceAssessment
  // Key insight narrative
  insight: string
}

export interface TeamRadar {
  attack:   number    // 0-100
  defense:  number    // 0-100
  form:     number    // 0-100
  xG:       number    // 0-100
  history:  number    // 0-100 (WC history)
  pressure: number    // 0-100 (elimination performance)
}

// ── Legacy prediction type (for backward compat) ──────────────────

export interface PoissonModel {
  homeWin:         number
  draw:            number
  awayWin:         number
  expectedGoalsH:  number
  expectedGoalsA:  number
}

export interface Prediction {
  matchId:    string
  generatedAt: string
  homeWinProb: number
  drawProb:    number
  awayWinProb: number
  mostLikelyScores: ScoreProbability[]
  confidence: ConfidenceLevel
  summary: string
  models: {
    elo:      EloModel
    poisson:  PoissonModel
    ensemble: EloModel
  }
  advanced?: AdvancedPrediction
}

// ── Form / H2H types ──────────────────────────────────────────────

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
