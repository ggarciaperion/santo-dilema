'use client'

/**
 * Invisible client component that polls /api/mundial/live every 15s
 * and triggers a full page refresh when the live score changes.
 * Used in partido/[id]/page.tsx for real-time score updates.
 */

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { MatchWithTeams } from '@/lib/mundial2026/types'

interface Props {
  matchId:    string
  initScore:  string  // "homeScore:awayScore:minute" snapshot at SSR time
  isLive:     boolean
}

export default function LiveMatchUpdater({ matchId, initScore, isLive }: Props) {
  const router    = useRouter()
  const scoreRef  = useRef(initScore)
  const activeRef = useRef(isLive)

  useEffect(() => {
    if (!activeRef.current) return

    const poll = async () => {
      try {
        const res = await fetch('/api/mundial/live', { cache: 'no-store' })
        if (!res.ok) return
        const data: { matches: MatchWithTeams[] } = await res.json()

        const m = data.matches.find(x => x.id === matchId)
        if (!m) return

        // If match finished, do one last refresh then stop polling
        if (m.status === 'finished') {
          router.refresh()
          activeRef.current = false
          return
        }

        const snapshot = `${m.homeScore ?? 0}:${m.awayScore ?? 0}:${m.minute ?? ''}`
        if (snapshot !== scoreRef.current) {
          scoreRef.current = snapshot
          router.refresh()  // Server Component re-renders with fresh data
        }
      } catch { /* silent */ }
    }

    const id = setInterval(poll, 15_000)
    return () => clearInterval(id)
  }, [matchId, router])

  return null  // purely functional, no UI
}
