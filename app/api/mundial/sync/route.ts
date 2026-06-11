import { NextResponse } from 'next/server'
import { invalidateCache, getFixtures } from '@/lib/mundial2026/api'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const secret = req.headers.get('x-sync-secret')
  if (secret !== process.env.MUNDIAL_SYNC_SECRET && process.env.MUNDIAL_SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await invalidateCache()
  const data = await getFixtures()

  return NextResponse.json({
    ok: true,
    source: data.source,
    count: data.fixtures.length,
    cachedAt: data.cachedAt,
  })
}
