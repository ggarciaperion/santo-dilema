/**
 * /api/mundial/live
 *
 * Dedicated live-scores endpoint — hits ESPN directly, zero CDN/Redis cache.
 * Called by the frontend every 15s only when a match is live.
 * Much lighter than /api/mundial/fixtures (no Redis, no API-Football).
 */

import { NextResponse } from 'next/server'
import { getEspnLiveMap } from '@/lib/mundial2026/espn-live'
import { getStaticFixtures } from '@/lib/mundial2026/static-fixtures'
import { overlayEspnData } from '@/lib/mundial2026/espn-live'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const espnMap = await getEspnLiveMap()

    // Only return matches ESPN considers live or recently finished
    const allFixtures  = getStaticFixtures()
    const withLive     = overlayEspnData(allFixtures, espnMap)
    const liveOrRecent = withLive.filter(f =>
      f.status === 'live' ||
      (f.status === 'finished' && (() => {
        const elapsed = Date.now() - new Date(f.date).getTime()
        return elapsed < 4 * 60 * 60 * 1000  // finished in the last 4h
      })())
    )

    return NextResponse.json(
      {
        matches:   liveOrRecent,
        fetchedAt: new Date().toISOString(),
        source:    'espn',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (err) {
    console.error('[/api/mundial/live]', err)
    return NextResponse.json({ error: 'ESPN unavailable' }, { status: 503 })
  }
}
