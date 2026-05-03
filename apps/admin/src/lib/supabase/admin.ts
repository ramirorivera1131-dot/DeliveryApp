import 'server-only'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@delivery/shared/database.types'

let adminClient: SupabaseClient<Database> | null = null

export function createAdminClient(): SupabaseClient<Database> {
  if (adminClient) return adminClient
  adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken:   false,
        persistSession:     false,
        detectSessionInUrl: false,
      },
    },
  )
  return adminClient
}
