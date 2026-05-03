'use client'
import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

export function useInactivity() {
  const timerRef  = useRouter
  const router    = useRouter()
  const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reset = useCallback(() => {
    if (timerIdRef.current) clearTimeout(timerIdRef.current)
    timerIdRef.current = setTimeout(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.replace('/login?reason=inactivity')
    }, TIMEOUT_MS)
  }, [router])

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      events.forEach(e => window.removeEventListener(e, reset))
      if (timerIdRef.current) clearTimeout(timerIdRef.current)
    }
  }, [reset])
}
