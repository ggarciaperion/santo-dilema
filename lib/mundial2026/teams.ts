import type { Team } from './types'

export const TEAMS: Record<string, Team> = {
  // ── CONMEBOL ─────────────────────────────────────────────────────
  ARG: { id: 'ARG', name: 'Argentina', shortName: 'Argentina', code: 'ARG', flag: '\u{1F1E6}\u{1F1F7}', confederation: 'CONMEBOL', eloRating: 2080, fifaRanking: 1,  apiFootballId: 26  },
  BRA: { id: 'BRA', name: 'Brasil',    shortName: 'Brasil',    code: 'BRA', flag: '\u{1F1E7}\u{1F1F7}', confederation: 'CONMEBOL', eloRating: 2020, fifaRanking: 5,  apiFootballId: 6   },
  COL: { id: 'COL', name: 'Colombia',  shortName: 'Colombia',  code: 'COL', flag: '\u{1F1E8}\u{1F1F4}', confederation: 'CONMEBOL', eloRating: 1870, fifaRanking: 9,  apiFootballId: 31  },
  ECU: { id: 'ECU', name: 'Ecuador',   shortName: 'Ecuador',   code: 'ECU', flag: '\u{1F1EA}\u{1F1E8}', confederation: 'CONMEBOL', eloRating: 1790, fifaRanking: 28, apiFootballId: 127 },
  URU: { id: 'URU', name: 'Uruguay',   shortName: 'Uruguay',   code: 'URU', flag: '\u{1F1FA}\u{1F1FE}', confederation: 'CONMEBOL', eloRating: 1860, fifaRanking: 17, apiFootballId: 7   },
  VEN: { id: 'VEN', name: 'Venezuela', shortName: 'Venezuela', code: 'VEN', flag: '\u{1F1FB}\u{1F1EA}', confederation: 'CONMEBOL', eloRating: 1780, fifaRanking: 35, apiFootballId: 36  },

  // ── CONCACAF ─────────────────────────────────────────────────────
  USA: { id: 'USA', name: 'Estados Unidos', shortName: 'USA',       code: 'USA', flag: '\u{1F1FA}\u{1F1F8}', confederation: 'CONCACAF', eloRating: 1835, fifaRanking: 13, apiFootballId: 2   },
  MEX: { id: 'MEX', name: 'México',          shortName: 'México',    code: 'MEX', flag: '\u{1F1F2}\u{1F1FD}', confederation: 'CONCACAF', eloRating: 1820, fifaRanking: 16, apiFootballId: 3   },
  CAN: { id: 'CAN', name: 'Canadá',          shortName: 'Canadá',    code: 'CAN', flag: '\u{1F1E8}\u{1F1E6}', confederation: 'CONCACAF', eloRating: 1770, fifaRanking: 43, apiFootballId: 101 },
  PAN: { id: 'PAN', name: 'Panamá',          shortName: 'Panamá',    code: 'PAN', flag: '\u{1F1F5}\u{1F1E6}', confederation: 'CONCACAF', eloRating: 1710, fifaRanking: 53, apiFootballId: 78  },
  HON: { id: 'HON', name: 'Honduras',        shortName: 'Honduras',  code: 'HON', flag: '\u{1F1ED}\u{1F1F3}', confederation: 'CONCACAF', eloRating: 1680, fifaRanking: 69, apiFootballId: 93  },
  JAM: { id: 'JAM', name: 'Jamaica',         shortName: 'Jamaica',   code: 'JAM', flag: '\u{1F1EF}\u{1F1F2}', confederation: 'CONCACAF', eloRating: 1670, fifaRanking: 58, apiFootballId: 105 },

  // ── UEFA ─────────────────────────────────────────────────────────
  FRA: { id: 'FRA', name: 'Francia',         shortName: 'Francia',    code: 'FRA', flag: '\u{1F1EB}\u{1F1F7}', confederation: 'UEFA', eloRating: 2055, fifaRanking: 2,  apiFootballId: 2  },
  ENG: { id: 'ENG', name: 'Inglaterra',      shortName: 'Inglaterra', code: 'ENG', flag: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}', confederation: 'UEFA', eloRating: 2010, fifaRanking: 4,  apiFootballId: 10 },
  GER: { id: 'GER', name: 'Alemania',        shortName: 'Alemania',   code: 'GER', flag: '\u{1F1E9}\u{1F1EA}', confederation: 'UEFA', eloRating: 1985, fifaRanking: 14, apiFootballId: 25 },
  ESP: { id: 'ESP', name: 'España',          shortName: 'España',     code: 'ESP', flag: '\u{1F1EA}\u{1F1F8}', confederation: 'UEFA', eloRating: 2045, fifaRanking: 3,  apiFootballId: 9  },
  POR: { id: 'POR', name: 'Portugal',        shortName: 'Portugal',   code: 'POR', flag: '\u{1F1F5}\u{1F1F9}', confederation: 'UEFA', eloRating: 1965, fifaRanking: 6,  apiFootballId: 27 },
  NED: { id: 'NED', name: 'Países Bajos',    shortName: 'Holanda',    code: 'NED', flag: '\u{1F1F3}\u{1F1F1}', confederation: 'UEFA', eloRating: 1970, fifaRanking: 7,  apiFootballId: 1  },
  BEL: { id: 'BEL', name: 'Bélgica',         shortName: 'Bélgica',    code: 'BEL', flag: '\u{1F1E7}\u{1F1EA}', confederation: 'UEFA', eloRating: 1940, fifaRanking: 3,  apiFootballId: 4  },
  SUI: { id: 'SUI', name: 'Suiza',           shortName: 'Suiza',      code: 'SUI', flag: '\u{1F1E8}\u{1F1ED}', confederation: 'UEFA', eloRating: 1890, fifaRanking: 18, apiFootballId: 15 },
  DEN: { id: 'DEN', name: 'Dinamarca',       shortName: 'Dinamarca',  code: 'DEN', flag: '\u{1F1E9}\u{1F1F0}', confederation: 'UEFA', eloRating: 1870, fifaRanking: 19, apiFootballId: 21 },
  AUT: { id: 'AUT', name: 'Austria',         shortName: 'Austria',    code: 'AUT', flag: '\u{1F1E6}\u{1F1F9}', confederation: 'UEFA', eloRating: 1840, fifaRanking: 25, apiFootballId: 17 },
  SCO: { id: 'SCO', name: 'Escocia',         shortName: 'Escocia',    code: 'SCO', flag: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E006F}\u{E007F}', confederation: 'UEFA', eloRating: 1810, fifaRanking: 37, apiFootballId: 1108 },
  SRB: { id: 'SRB', name: 'Serbia',          shortName: 'Serbia',     code: 'SRB', flag: '\u{1F1F7}\u{1F1F8}', confederation: 'UEFA', eloRating: 1820, fifaRanking: 33, apiFootballId: 14 },
  CRO: { id: 'CRO', name: 'Croacia',         shortName: 'Croacia',    code: 'CRO', flag: '\u{1F1ED}\u{1F1F7}', confederation: 'UEFA', eloRating: 1880, fifaRanking: 10, apiFootballId: 3  },
  POL: { id: 'POL', name: 'Polonia',         shortName: 'Polonia',    code: 'POL', flag: '\u{1F1F5}\u{1F1F1}', confederation: 'UEFA', eloRating: 1820, fifaRanking: 26, apiFootballId: 24 },
  ROM: { id: 'ROM', name: 'Rumania',         shortName: 'Rumania',    code: 'ROM', flag: '\u{1F1F7}\u{1F1F4}', confederation: 'UEFA', eloRating: 1780, fifaRanking: 38, apiFootballId: 22 },
  TUR: { id: 'TUR', name: 'Turquía',         shortName: 'Turquía',    code: 'TUR', flag: '\u{1F1F9}\u{1F1F7}', confederation: 'UEFA', eloRating: 1830, fifaRanking: 29, apiFootballId: 16 },

  // ── CAF ──────────────────────────────────────────────────────────
  MAR: { id: 'MAR', name: 'Marruecos',      shortName: 'Marruecos',  code: 'MAR', flag: '\u{1F1F2}\u{1F1E6}', confederation: 'CAF', eloRating: 1830, fifaRanking: 14, apiFootballId: 31 },
  SEN: { id: 'SEN', name: 'Senegal',        shortName: 'Senegal',    code: 'SEN', flag: '\u{1F1F8}\u{1F1F3}', confederation: 'CAF', eloRating: 1780, fifaRanking: 20, apiFootballId: 38 },
  NGA: { id: 'NGA', name: 'Nigeria',        shortName: 'Nigeria',    code: 'NGA', flag: '\u{1F1F3}\u{1F1EC}', confederation: 'CAF', eloRating: 1760, fifaRanking: 40, apiFootballId: 39 },
  CIV: { id: 'CIV', name: 'Costa de Marfil', shortName: 'Costa Marfil', code: 'CIV', flag: '\u{1F1E8}\u{1F1EE}', confederation: 'CAF', eloRating: 1760, fifaRanking: 36, apiFootballId: 43 },
  EGY: { id: 'EGY', name: 'Egipto',         shortName: 'Egipto',     code: 'EGY', flag: '\u{1F1EA}\u{1F1EC}', confederation: 'CAF', eloRating: 1730, fifaRanking: 30, apiFootballId: 32 },
  ALG: { id: 'ALG', name: 'Argelia',        shortName: 'Argelia',    code: 'ALG', flag: '\u{1F1E9}\u{1F1FF}', confederation: 'CAF', eloRating: 1730, fifaRanking: 42, apiFootballId: 30 },
  CMR: { id: 'CMR', name: 'Camerún',        shortName: 'Camerún',    code: 'CMR', flag: '\u{1F1E8}\u{1F1F2}', confederation: 'CAF', eloRating: 1700, fifaRanking: 51, apiFootballId: 34 },
  TUN: { id: 'TUN', name: 'Túnez',          shortName: 'Túnez',      code: 'TUN', flag: '\u{1F1F9}\u{1F1F3}', confederation: 'CAF', eloRating: 1700, fifaRanking: 45, apiFootballId: 37 },
  ZAF: { id: 'ZAF', name: 'Sudáfrica',      shortName: 'Sudáfrica',  code: 'ZAF', flag: '\u{1F1FF}\u{1F1E6}', confederation: 'CAF', eloRating: 1680, fifaRanking: 60, apiFootballId: 41 },

  // ── AFC ──────────────────────────────────────────────────────────
  JPN: { id: 'JPN', name: 'Japón',           shortName: 'Japón',       code: 'JPN', flag: '\u{1F1EF}\u{1F1F5}', confederation: 'AFC', eloRating: 1830, fifaRanking: 22, apiFootballId: 29  },
  KOR: { id: 'KOR', name: 'Corea del Sur',   shortName: 'Corea Sur',   code: 'KOR', flag: '\u{1F1F0}\u{1F1F7}', confederation: 'AFC', eloRating: 1780, fifaRanking: 23, apiFootballId: 149 },
  IRN: { id: 'IRN', name: 'Irán',            shortName: 'Irán',        code: 'IRN', flag: '\u{1F1EE}\u{1F1F7}', confederation: 'AFC', eloRating: 1770, fifaRanking: 24, apiFootballId: 145 },
  AUS: { id: 'AUS', name: 'Australia',       shortName: 'Australia',   code: 'AUS', flag: '\u{1F1E6}\u{1F1FA}', confederation: 'AFC', eloRating: 1750, fifaRanking: 24, apiFootballId: 25  },
  JOR: { id: 'JOR', name: 'Jordania',        shortName: 'Jordania',    code: 'JOR', flag: '\u{1F1EF}\u{1F1F4}', confederation: 'AFC', eloRating: 1670, fifaRanking: 64, apiFootballId: 163 },
  QAT: { id: 'QAT', name: 'Qatar',           shortName: 'Qatar',       code: 'QAT', flag: '\u{1F1F6}\u{1F1E6}', confederation: 'AFC', eloRating: 1640, fifaRanking: 68, apiFootballId: 164 },
  SAU: { id: 'SAU', name: 'Arabia Saudí',    shortName: 'Arabia Saudí', code: 'SAU', flag: '\u{1F1F8}\u{1F1E6}', confederation: 'AFC', eloRating: 1720, fifaRanking: 55, apiFootballId: 154 },
  UZB: { id: 'UZB', name: 'Uzbekistán',      shortName: 'Uzbekistán',  code: 'UZB', flag: '\u{1F1FA}\u{1F1FF}', confederation: 'AFC', eloRating: 1680, fifaRanking: 70, apiFootballId: 567 },

  // ── OFC ──────────────────────────────────────────────────────────
  NZL: { id: 'NZL', name: 'Nueva Zelanda',   shortName: 'Nueva Zelanda', code: 'NZL', flag: '\u{1F1F3}\u{1F1FF}', confederation: 'OFC', eloRating: 1620, fifaRanking: 96, apiFootballId: 73 },

  // ── Playoffs intercontinentales ───────────────────────────────────
  BOL: { id: 'BOL', name: 'Bolivia',         shortName: 'Bolivia',     code: 'BOL', flag: '\u{1F1E7}\u{1F1F4}', confederation: 'CONMEBOL', eloRating: 1650, fifaRanking: 80, apiFootballId: 37  },
  GHA: { id: 'GHA', name: 'Ghana',           shortName: 'Ghana',       code: 'GHA', flag: '\u{1F1EC}\u{1F1ED}', confederation: 'CAF',      eloRating: 1700, fifaRanking: 55, apiFootballId: 33  },
}

export function getTeam(code: string): Team {
  return TEAMS[code] ?? {
    id: code, name: code, shortName: code, code,
    flag: '🏳️', confederation: 'UEFA', eloRating: 1700,
  }
}

export const ALL_TEAMS = Object.values(TEAMS)
