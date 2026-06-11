import { NextResponse } from 'next/server'
import { getFixtures } from '@/lib/mundial2026/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getFixtures()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    console.error('[/api/mundial/fixtures]', err)
    return NextResponse.json({ error: 'Error fetching fixtures' }, { status: 500 })
  }
}
