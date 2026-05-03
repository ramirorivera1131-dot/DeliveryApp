'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Store, Bike, ShoppingBag, CreditCard,
  DollarSign, HeadphonesIcon, BarChart3, Settings, ChevronLeft,
  Zap, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui-store'
import type { AdminUser } from '@/lib/types'

const NAV = [
  { href: '/',               icon: LayoutDashboard, label: 'Inicio',        section: null },
  { href: '/restaurants',    icon: Store,           label: 'Restaurantes',  section: 'Gestión' },
  { href: '/drivers',        icon: Bike,            label: 'Repartidores',  section: 'Gestión' },
  { href: '/orders',         icon: ShoppingBag,     label: 'Pedidos',       section: 'Gestión' },
  { href: '/subscriptions',  icon: CreditCard,      label: 'Suscripciones', section: 'Finanzas' },
  { href: '/payments',       icon: DollarSign,      label: 'Pagos',         section: 'Finanzas' },
  { href: '/support',        icon: HeadphonesIcon,  label: 'Soporte',       section: 'Operaciones' },
  { href: '/reports',        icon: BarChart3,       label: 'Reportes',      section: 'Operaciones' },
  { href: '/settings',       icon: Settings,        label: 'Configuración', section: 'Sistema' },
]

const ROLE_LABELS: Record<string, string> = {
  super_admin:  'Super Admin',
  ops_manager:  'Operaciones',
  support:      'Soporte',
  accountant:   'Contabilidad',
  viewer:       'Visualizador',
}

interface Props { admin: AdminUser | null }

export function Sidebar({ admin }: Props) {
  const pathname  = usePathname()
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, toggleCollapse } = useUIStore()
  const isActive  = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  const sections = Array.from(new Set(NAV.map(n => n.section).filter((s): s is string => s !== null)))
  const topItems  = NAV.filter(n => !n.section)

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={cn('flex h-16 items-center border-b border-sidebar-border px-4 gap-3', sidebarCollapsed && 'justify-center px-2')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">Delivery Admin</p>
            <p className="truncate text-[10px] text-sidebar-muted">Panel de control</p>
          </div>
        )}
        {!sidebarCollapsed && (
          <button onClick={toggleCollapse} className="ml-auto text-sidebar-muted hover:text-white transition-colors lg:flex hidden">
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {/* Top-level items */}
        {topItems.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 mx-2 mb-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white',
                sidebarCollapsed && 'justify-center px-2',
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}

        {/* Sectioned items */}
        {sections.map(section => (
          <div key={section} className="mt-4">
            {!sidebarCollapsed && (
              <p className="mb-1 px-5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
                {section}
              </p>
            )}
            {sidebarCollapsed && <div className="mx-4 my-2 h-px bg-sidebar-border" />}
            {NAV.filter(n => n.section === section).map(item => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 mx-2 mb-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    active
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white',
                    sidebarCollapsed && 'justify-center px-2',
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Admin user */}
      {admin && (
        <div className={cn('border-t border-sidebar-border p-3', sidebarCollapsed && 'flex justify-center')}>
          {sidebarCollapsed ? (
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {admin.full_name.charAt(0)}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-1">
              <div className="h-8 w-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {admin.full_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">{admin.full_name}</p>
                <p className="truncate text-[10px] text-sidebar-muted">{ROLE_LABELS[admin.role]}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 bg-sidebar transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64',
      )}>
        <SidebarContent />
        {sidebarCollapsed && (
          <button
            onClick={toggleCollapse}
            className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-sidebar-muted hover:text-white"
          >
            <ChevronLeft className="h-3 w-3 rotate-180" />
          </button>
        )}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        'fixed left-0 top-0 h-full w-72 z-50 bg-sidebar transition-transform duration-300 lg:hidden',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <button
          className="absolute right-3 top-3 text-sidebar-muted hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent />
      </aside>
    </>
  )
}
