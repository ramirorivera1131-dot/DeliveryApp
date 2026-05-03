import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { InactivityTimer } from '@/components/layout/InactivityTimer'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { AdminUser } from '@/lib/types'

// Resolve breadcrumbs from pathname
function getBreadcrumbs(pathname: string): { label: string }[] {
  const MAP: Record<string, string> = {
    '':              'Inicio',
    restaurants:     'Restaurantes',
    drivers:         'Repartidores',
    orders:          'Pedidos',
    subscriptions:   'Suscripciones',
    payments:        'Pagos',
    support:         'Soporte',
    reports:         'Reportes',
    settings:        'Configuración',
  }
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean)
  if (parts.length === 0) return [{ label: 'Inicio' }]
  return parts.map(p => ({ label: MAP[p] ?? p }))
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const hdrs        = await headers()
  const adminId     = hdrs.get('x-admin-id')
  const xPathname   = hdrs.get('x-invoke-path') ?? hdrs.get('x-pathname') ?? ''

  if (!adminId) redirect('/login')

  const supabase = createAdminClient()
  const { data: admin } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', adminId)
    .single()

  const breadcrumbs = getBreadcrumbs(xPathname)

  return (
    <TooltipProvider>
      <Sidebar admin={admin as AdminUser | null} />
      <div className="lg:pl-64 transition-all duration-300 flex flex-col min-h-screen">
        <Header admin={admin as AdminUser | null} breadcrumbs={breadcrumbs} />
        <main className="flex-1 pt-16 p-6 animate-fade-in">
          {children}
        </main>
      </div>
      <InactivityTimer />
    </TooltipProvider>
  )
}
