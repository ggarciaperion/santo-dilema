import type { Venue } from './types'

export const VENUES: Record<string, Venue> = {
  // ── MEXICO ───────────────────────────────────────────────────────
  azteca: {
    id: 'azteca',
    name: 'Estadio Azteca',
    city: 'Ciudad de México',
    country: 'Mexico',
    capacity: 87523,
    altitude: 2240,
    timezone: 'America/Mexico_City',
  },
  akron: {
    id: 'akron',
    name: 'Estadio Akron',
    city: 'Guadalajara',
    country: 'Mexico',
    capacity: 49850,
    altitude: 1566,
    timezone: 'America/Mexico_City',
  },
  bbva: {
    id: 'bbva',
    name: 'Estadio BBVA',
    city: 'Monterrey',
    country: 'Mexico',
    capacity: 51350,
    altitude: 538,
    timezone: 'America/Monterrey',
  },

  // ── USA ──────────────────────────────────────────────────────────
  metlife: {
    id: 'metlife',
    name: 'MetLife Stadium',
    city: 'East Rutherford, NJ',
    country: 'USA',
    capacity: 82500,
    altitude: 3,
    timezone: 'America/New_York',
  },
  atandt: {
    id: 'atandt',
    name: 'AT&T Stadium',
    city: 'Arlington, TX',
    country: 'USA',
    capacity: 80000,
    altitude: 196,
    timezone: 'America/Chicago',
  },
  sofi: {
    id: 'sofi',
    name: 'SoFi Stadium',
    city: 'Inglewood, CA',
    country: 'USA',
    capacity: 70240,
    altitude: 31,
    timezone: 'America/Los_Angeles',
  },
  hardrock: {
    id: 'hardrock',
    name: 'Hard Rock Stadium',
    city: 'Miami Gardens, FL',
    country: 'USA',
    capacity: 64767,
    altitude: 2,
    timezone: 'America/New_York',
  },
  levis: {
    id: 'levis',
    name: "Levi's Stadium",
    city: 'Santa Clara, CA',
    country: 'USA',
    capacity: 68500,
    altitude: 12,
    timezone: 'America/Los_Angeles',
  },
  arrowhead: {
    id: 'arrowhead',
    name: 'Arrowhead Stadium',
    city: 'Kansas City, MO',
    country: 'USA',
    capacity: 76416,
    altitude: 310,
    timezone: 'America/Chicago',
  },
  lincoln: {
    id: 'lincoln',
    name: 'Lincoln Financial Field',
    city: 'Philadelphia, PA',
    country: 'USA',
    capacity: 69796,
    altitude: 10,
    timezone: 'America/New_York',
  },
  gillette: {
    id: 'gillette',
    name: 'Gillette Stadium',
    city: 'Foxborough, MA',
    country: 'USA',
    capacity: 65878,
    altitude: 10,
    timezone: 'America/New_York',
  },
  nrg: {
    id: 'nrg',
    name: 'NRG Stadium',
    city: 'Houston, TX',
    country: 'USA',
    capacity: 72220,
    altitude: 14,
    timezone: 'America/Chicago',
  },

  // ── CANADA ───────────────────────────────────────────────────────
  bcplace: {
    id: 'bcplace',
    name: 'BC Place',
    city: 'Vancouver',
    country: 'Canada',
    capacity: 54500,
    altitude: 4,
    timezone: 'America/Vancouver',
  },
  bmo: {
    id: 'bmo',
    name: 'BMO Field',
    city: 'Toronto',
    country: 'Canada',
    capacity: 45736,
    altitude: 76,
    timezone: 'America/Toronto',
  },
}

export function getVenue(id: string): Venue {
  return VENUES[id] ?? VENUES.metlife
}

export const ALL_VENUES = Object.values(VENUES)

// Country display for cards
export const COUNTRY_FLAG: Record<string, string> = {
  USA: '\u{1F1FA}\u{1F1F8}',
  Mexico: '\u{1F1F2}\u{1F1FD}',
  Canada: '\u{1F1E8}\u{1F1E6}',
}
