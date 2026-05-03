'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AdminUser } from '@/lib/types'

export function useAdmin() {
  const [admin,   setAdmin]   = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single()
      setAdmin(data as AdminUser | null)
      setLoading(false)
    })
  }, [])

  return { admin, loading }
}
