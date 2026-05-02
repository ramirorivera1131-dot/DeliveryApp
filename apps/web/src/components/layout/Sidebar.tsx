'use client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ClipboardList, Utensils, TrendingUp,
  Settings, LogOut, ChevronLeft, ChevronRight, Bike,
  CreditCard,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui-store'
import { useRestaurant, useSubscription } from '@/hooks/use-restaurant'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'  },
  { href: '/orders',    icon: ClipboardList,   label: 'Pedidos'    },
  { href: '/menu',      icon: Utensils,        label: 'Menú'       },
  { href: '/earnings',  icon: TrendingUp,      label: 'Ganancias'  },
  { href: '/settings',  icon: Settings,        label: 'Configuración' },
]

export function Sidebar() {
  const pathname    = usePathname()
  const router      = useRouter()
  const { collapsed, toggleSidebar } = useUIStore(s => ({
    collapsed: s.sidebarCollapsed,
    toggleSidebar: s.toggleSidebar,
  }))
  const { data: restaurant } = useRestaurant()
  const { data: subscription } = useSubscription(restaurant?.id)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const planName    = subscription?.subscription_plans?.display_name ?? 'Free'
  const planColor   = planName === 'Enterprise' ? 'text-purple-400' :
                      planName === 'Business'   ? 'text-blue-400' :
                      planName === 'Starter'    ? 'text-orange-400' : 'text-gray-400'
  const isExpired   = subscription?.status === 'past_due' || subscription?.status === 'cancelled'

  return (
    <aside
      className={cn(
        'relative flex h-screen shrink-0 flex-col transition-all duration-300 ease-in-out',
        'bg-sidebar-bg border-r border-sidebar-border',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:bg-accent transition-colors"
      >
        {collapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft  className="h-3 w-3" />
        }
      </button>

      {/* Brand */}
      <div className={cn('flex items-center gap-3 px-4 py-4 min-h-[64px]', collapsed && 'justify-center px-0')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20">
          <Bike size={18} />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-text">
              {restaurant?.name ?? 'Mi Restaurante'}
            </p>
            <span className={cn('text-xs font-medium', planColor)}>{planName}</span>
            {isExpired && <span className="ml-1.5 text-xs text-red-400">· Vencido</span>}
          </div>
        )}
      </div>

      <div className="mx-3 border-t border-sidebar-border" />

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active   = pathname === href || pathname.startsWith(href + '/')
          const disabled = isExpired && href !== '/settings' && href !== '/earnings'
          return (
            <Link
              key={href}
              href={disabled ? '#' : href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center gap-0' : 'gap-3',
                active
                  ? 'bg-sidebar-active/20 text-primary'
                  : disabled
                    ? 'text-sidebar-muted/50 cursor-not-allowed'
                    : 'text-sidebar-text hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon
                size={18}
                className={cn(
                  'shrink-0 transition-colors',
                  active ? 'text-primary' : disabled ? 'text-sidebar-muted/40' : 'text-sidebar-muted',
                )}
              />
              {!collapsed && (
                <>
                  <span className="flex-1">{label}</span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Plan info */}
      {!collapsed && subscription && (
        <div className="mx-3 mb-3 rounded-lg border border-sidebar-border bg-white/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={13} className="text-sidebar-muted" />
            <span className="text-xs font-medium text-sidebar-text">{planName}</span>
            {isExpired
              ? <span className="ml-auto text-xs text-red-400">Vencido</span>
              : (
                <span className="ml-auto text-xs text-sidebar-muted">
                  {new Date(subscription.current_period_end).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </span>
              )
            }
          </div>
          {isExpired && (
            <Link href="/earnings" className="text-xs text-primary hover:underline">
              Renovar suscripción →
            </Link>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={cn(
            'flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium',
            'text-sidebar-muted hover:bg-red-500/10 hover:text-red-400 transition-colors',
            collapsed ? 'justify-center' : 'gap-3',
          )}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  )
}
