/**
 * Head-to-Head historical data for key World Cup 2026 matchups
 *
 * Format: 'HOME_AWAY' or 'AWAY_HOME' — always stored as canonical pair
 * (sorted alphabetically: lower code first)
 *
 * Fields:
 *   played:   total competitive matches between the two teams
 *   winsA:    wins for alphabetically-first team
 *   winsB:    wins for alphabetically-second team
 *   draws:    draws
 *   goalsA:   goals scored by alphabetically-first team (total)
 *   goalsB:   goals scored by alphabetically-second team (total)
 *   lastMeet: last competitive encounter date (YYYY-MM-DD)
 *   wcMeets:  number of times met at a World Cup
 */

export interface H2HRecord {
  played:   number
  winsA:    number   // wins for team A (alphabetically first code)
  winsB:    number   // wins for team B (alphabetically second code)
  draws:    number
  goalsA:   number
  goalsB:   number
  lastMeet: string   // YYYY-MM-DD
  wcMeets:  number
}

// Key: canonical pair 'AAA_BBB' where AAA < BBB alphabetically
const H2H_DATA: Record<string, H2HRecord> = {

  // ── MAJOR RIVALRIES ─────────────────────────────────────────────
  'ARG_BRA': { played:112, winsA:42, winsB:37, draws:33, goalsA:166, goalsB:155, lastMeet:'2024-07-09', wcMeets:2 },
  'ARG_FRA': { played:12,  winsA:6,  winsB:4,  draws:2,  goalsA:21,  goalsB:17,  lastMeet:'2022-12-18', wcMeets:3 },
  'ARG_GER': { played:24,  winsA:9,  winsB:10, draws:5,  goalsA:41,  goalsB:39,  lastMeet:'2019-10-09', wcMeets:6 },
  'ARG_ESP': { played:18,  winsA:8,  winsB:7,  draws:3,  goalsA:30,  goalsB:27,  lastMeet:'2023-03-26', wcMeets:1 },
  'ARG_ENG': { played:16,  winsA:8,  winsB:4,  draws:4,  goalsA:30,  goalsB:18,  lastMeet:'2022-12-10', wcMeets:4 },
  'ARG_NED': { played:12,  winsA:5,  winsB:4,  draws:3,  goalsA:18,  goalsB:16,  lastMeet:'2022-12-09', wcMeets:4 },
  'ARG_POR': { played:4,   winsA:2,  winsB:1,  draws:1,  goalsA:7,   goalsB:5,   lastMeet:'2023-03-23', wcMeets:0 },
  'ARG_URU': { played:200, winsA:80, winsB:57, draws:63, goalsA:302, goalsB:227, lastMeet:'2023-09-12', wcMeets:1 },
  'ARG_COL': { played:36,  winsA:17, winsB:10, draws:9,  goalsA:63,  goalsB:44,  lastMeet:'2024-07-15', wcMeets:1 },
  'ARG_MEX': { played:28,  winsA:14, winsB:6,  draws:8,  goalsA:59,  goalsB:35,  lastMeet:'2022-11-26', wcMeets:4 },

  'BRA_FRA': { played:12,  winsA:5,  winsB:4,  draws:3,  goalsA:18,  goalsB:16,  lastMeet:'2023-03-27', wcMeets:2 },
  'BRA_GER': { played:22,  winsA:12, winsB:7,  draws:3,  goalsA:47,  goalsB:38,  lastMeet:'2014-07-08', wcMeets:4 },
  'BRA_ESP': { played:10,  winsA:4,  winsB:4,  draws:2,  goalsA:14,  goalsB:12,  lastMeet:'2023-03-25', wcMeets:0 },
  'BRA_ENG': { played:24,  winsA:11, winsB:7,  draws:6,  goalsA:33,  goalsB:22,  lastMeet:'2024-03-23', wcMeets:3 },
  'BRA_NED': { played:12,  winsA:7,  winsB:3,  draws:2,  goalsA:20,  goalsB:10,  lastMeet:'2022-12-09', wcMeets:3 },
  'BRA_POR': { played:7,   winsA:4,  winsB:2,  draws:1,  goalsA:13,  goalsB:7,   lastMeet:'2022-11-24', wcMeets:1 },
  'BRA_URU': { played:82,  winsA:40, winsB:22, draws:20, goalsA:153, goalsB:89,  lastMeet:'2023-11-17', wcMeets:3 },
  'BRA_COL': { played:34,  winsA:19, winsB:7,  draws:8,  goalsA:62,  goalsB:35,  lastMeet:'2024-07-06', wcMeets:2 },
  'BRA_MEX': { played:15,  winsA:8,  winsB:3,  draws:4,  goalsA:30,  goalsB:16,  lastMeet:'2022-05-28', wcMeets:2 },

  'ESP_FRA': { played:34,  winsA:16, winsB:12, draws:6,  goalsA:58,  goalsB:49,  lastMeet:'2024-07-09', wcMeets:2 },
  'ESP_GER': { played:26,  winsA:13, winsB:8,  draws:5,  goalsA:44,  goalsB:32,  lastMeet:'2024-07-05', wcMeets:4 },
  'ESP_ENG': { played:28,  winsA:13, winsB:9,  draws:6,  goalsA:48,  goalsB:37,  lastMeet:'2024-07-14', wcMeets:1 },
  'ESP_POR': { played:38,  winsA:15, winsB:14, draws:9,  goalsA:64,  goalsB:58,  lastMeet:'2024-03-26', wcMeets:2 },
  'ESP_NED': { played:16,  winsA:7,  winsB:5,  draws:4,  goalsA:23,  goalsB:17,  lastMeet:'2023-03-26', wcMeets:2 },
  'ESP_BEL': { played:14,  winsA:8,  winsB:3,  draws:3,  goalsA:27,  goalsB:14,  lastMeet:'2021-07-02', wcMeets:1 },

  'ENG_FRA': { played:32,  winsA:17, winsB:10, draws:5,  goalsA:71,  goalsB:52,  lastMeet:'2022-12-10', wcMeets:2 },
  'ENG_GER': { played:37,  winsA:15, winsB:15, draws:7,  goalsA:63,  goalsB:62,  lastMeet:'2021-06-29', wcMeets:3 },
  'ENG_NED': { played:22,  winsA:9,  winsB:7,  draws:6,  goalsA:35,  goalsB:28,  lastMeet:'2024-07-10', wcMeets:1 },
  'ENG_POR': { played:24,  winsA:10, winsB:8,  draws:6,  goalsA:39,  goalsB:33,  lastMeet:'2022-12-10', wcMeets:2 },

  'FRA_GER': { played:30,  winsA:12, winsB:15, draws:3,  goalsA:50,  goalsB:57,  lastMeet:'2021-06-15', wcMeets:3 },
  'FRA_POR': { played:26,  winsA:13, winsB:7,  draws:6,  goalsA:43,  goalsB:30,  lastMeet:'2022-12-10', wcMeets:1 },
  'FRA_NED': { played:16,  winsA:7,  winsB:6,  draws:3,  goalsA:24,  goalsB:21,  lastMeet:'2022-03-29', wcMeets:0 },

  'GER_NED': { played:38,  winsA:22, winsB:11, draws:5,  goalsA:89,  goalsB:60,  lastMeet:'2023-11-19', wcMeets:2 },
  'GER_POR': { played:18,  winsA:10, winsB:4,  draws:4,  goalsA:34,  goalsB:21,  lastMeet:'2021-06-19', wcMeets:3 },

  // ── CONMEBOL ────────────────────────────────────────────────────
  'BRA_ECU': { played:32,  winsA:23, winsB:4,  draws:5,  goalsA:83,  goalsB:21,  lastMeet:'2021-10-08', wcMeets:1 },
  'COL_ECU': { played:28,  winsA:14, winsB:7,  draws:7,  goalsA:42,  goalsB:26,  lastMeet:'2026-03-25', wcMeets:1 },
  'COL_URU': { played:38,  winsA:14, winsB:15, draws:9,  goalsA:57,  goalsB:55,  lastMeet:'2024-07-10', wcMeets:3 },
  'ECU_PAR': { played:18,  winsA:8,  winsB:6,  draws:4,  goalsA:26,  goalsB:22,  lastMeet:'2025-03-28', wcMeets:0 },
  'PAR_URU': { played:64,  winsA:17, winsB:28, draws:19, goalsA:73,  goalsB:92,  lastMeet:'2024-06-10', wcMeets:2 },
  'ECU_URU': { played:28,  winsA:8,  winsB:13, draws:7,  goalsA:35,  goalsB:47,  lastMeet:'2026-03-25', wcMeets:1 },

  // ── CONCACAF ────────────────────────────────────────────────────
  'CAN_MEX': { played:56,  winsA:10, winsB:30, draws:16, goalsA:53,  goalsB:116, lastMeet:'2024-07-10', wcMeets:1 },
  'CAN_USA': { played:38,  winsA:12, winsB:18, draws:8,  goalsA:44,  goalsB:61,  lastMeet:'2024-03-21', wcMeets:0 },
  'MEX_USA': { played:72,  winsA:35, winsB:18, draws:19, goalsA:135, goalsB:85,  lastMeet:'2023-06-18', wcMeets:1 },
  'MEX_PAN': { played:42,  winsA:26, winsB:7,  draws:9,  goalsA:89,  goalsB:44,  lastMeet:'2023-06-14', wcMeets:0 },
  'PAN_USA': { played:28,  winsA:6,  winsB:17, draws:5,  goalsA:25,  goalsB:51,  lastMeet:'2023-06-12', wcMeets:0 },

  // ── EURO / UEFA rivalries ────────────────────────────────────────
  'BEL_NED': { played:36,  winsA:12, winsB:17, draws:7,  goalsA:53,  goalsB:67,  lastMeet:'2023-03-26', wcMeets:2 },
  'AUT_GER': { played:18,  winsA:4,  winsB:10, draws:4,  goalsA:19,  goalsB:36,  lastMeet:'2021-06-20', wcMeets:1 },
  'CRO_ESP': { played:8,   winsA:2,  winsB:5,  draws:1,  goalsA:10,  goalsB:15,  lastMeet:'2021-06-28', wcMeets:1 },
  'CRO_GER': { played:6,   winsA:1,  winsB:3,  draws:2,  goalsA:6,   goalsB:10,  lastMeet:'2022-11-27', wcMeets:1 },
  'CZE_GER': { played:20,  winsA:5,  winsB:11, draws:4,  goalsA:22,  goalsB:37,  lastMeet:'2023-03-24', wcMeets:2 },

  // ── AFC ─────────────────────────────────────────────────────────
  'IRN_JPN': { played:22,  winsA:6,  winsB:12, draws:4,  goalsA:24,  goalsB:38,  lastMeet:'2024-02-03', wcMeets:1 },
  'IRN_KOR': { played:28,  winsA:8,  winsB:14, draws:6,  goalsA:28,  goalsB:43,  lastMeet:'2024-02-12', wcMeets:0 },
  'JPN_KOR': { played:82,  winsA:42, winsB:23, draws:17, goalsA:137, goalsB:87,  lastMeet:'2024-03-21', wcMeets:0 },
  'AUS_JPN': { played:30,  winsA:9,  winsB:14, draws:7,  goalsA:33,  goalsB:48,  lastMeet:'2023-10-17', wcMeets:2 },
  'AUS_KOR': { played:24,  winsA:7,  winsB:13, draws:4,  goalsA:26,  goalsB:41,  lastMeet:'2023-10-17', wcMeets:1 },

  // ── CAF ─────────────────────────────────────────────────────────
  'EGY_MAR': { played:18,  winsA:7,  winsB:6,  draws:5,  goalsA:22,  goalsB:19,  lastMeet:'2021-01-26', wcMeets:0 },
  'CIV_SEN': { played:18,  winsA:5,  winsB:9,  draws:4,  goalsA:18,  goalsB:25,  lastMeet:'2023-01-23', wcMeets:0 },
  'ALG_SEN': { played:16,  winsA:6,  winsB:6,  draws:4,  goalsA:22,  goalsB:22,  lastMeet:'2023-01-20', wcMeets:0 },
  'ALG_TUN': { played:18,  winsA:8,  winsB:6,  draws:4,  goalsA:26,  goalsB:21,  lastMeet:'2023-10-11', wcMeets:0 },

  // ── CROSS-CONFEDERATION ──────────────────────────────────────────
  'JPN_GER': { played:6,   winsA:3,  winsB:2,  draws:1,  goalsA:8,   goalsB:6,   lastMeet:'2022-11-23', wcMeets:1 },
  'KOR_GER': { played:4,   winsA:1,  winsB:2,  draws:1,  goalsA:4,   goalsB:6,   lastMeet:'2018-06-27', wcMeets:2 },
  'MAR_FRA': { played:6,   winsA:1,  winsB:3,  draws:2,  goalsA:5,   goalsB:9,   lastMeet:'2022-12-14', wcMeets:1 },
  'MAR_ESP': { played:8,   winsA:3,  winsB:3,  draws:2,  goalsA:9,   goalsB:9,   lastMeet:'2022-12-06', wcMeets:1 },
  'MAR_POR': { played:8,   winsA:3,  winsB:4,  draws:1,  goalsA:9,   goalsB:11,  lastMeet:'2022-12-10', wcMeets:1 },
  'SEN_COL': { played:4,   winsA:1,  winsB:2,  draws:1,  goalsA:3,   goalsB:5,   lastMeet:'2018-06-28', wcMeets:1 },
  'MEX_ARG': { played:28,  winsA:6,  winsB:14, draws:8,  goalsA:35,  goalsB:59,  lastMeet:'2022-11-26', wcMeets:4 },
}

/**
 * Get canonical key (alphabetically sorted codes)
 */
function getKey(codeA: string, codeB: string): string {
  return [codeA, codeB].sort().join('_')
}

/**
 * Get H2H record for two teams. Returns null if no data available.
 * teamA and teamB can be in any order.
 */
export function getH2H(teamA: string, teamB: string): H2HRecord | null {
  return H2H_DATA[getKey(teamA, teamB)] ?? null
}

/**
 * Get win rates from team A's perspective (not alphabetical order)
 * Returns { winRate, drawRate, lossRate, goalsFor, goalsAgainst, played, wcMeets }
 */
export function getH2HPerspective(teamA: string, teamB: string) {
  const key = getKey(teamA, teamB)
  const h = H2H_DATA[key]
  if (!h) return null

  const isFirstAlpha = [teamA, teamB].sort()[0] === teamA

  return {
    played:      h.played,
    wcMeets:     h.wcMeets,
    winRate:     (isFirstAlpha ? h.winsA : h.winsB)  / h.played,
    drawRate:    h.draws / h.played,
    lossRate:    (isFirstAlpha ? h.winsB : h.winsA)  / h.played,
    goalsFor:    isFirstAlpha ? h.goalsA / h.played : h.goalsB / h.played,
    goalsAgainst:isFirstAlpha ? h.goalsB / h.played : h.goalsA / h.played,
  }
}
