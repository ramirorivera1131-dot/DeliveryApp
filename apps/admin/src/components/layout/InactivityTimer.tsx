'use client'
import { useInactivity } from '@/hooks/use-inactivity'

export function InactivityTimer() {
  useInactivity()
  return null
}
