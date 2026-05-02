import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name')
    .eq('owner_id', user.id)
    .maybeSingle()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        restaurantName={restaurant?.name ?? 'Mi Restaurante'}
        userEmail={user.email ?? ''}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
