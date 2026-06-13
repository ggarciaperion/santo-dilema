import { NextResponse } from 'next/server'
import { getFixtures } from '@/lib/mundial2026/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getFixtures()
    const hasLive = data.fixtures.some(f => f.status === 'live')
    // Never delegate caching to CDN — we handle it in Redis ourselves.
    // During live matches: strict no-store to guarantee fresh data on every poll.
    const cc = hasLive
      ? 'no-store, no-cache, must-revalidate'
      : 'private, no-cache, max-age=0'
    return NextResponse.json(data, {
      headers: { 'Cache-Control': cc },
    })
  } catch (err) {
    console.error('[/api/mundial/fixtures]', err)
    return NextResponse.json({ error: 'Error fetching fixtures' }, { status: 500 })
  }
}
