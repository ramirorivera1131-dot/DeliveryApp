'use client'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ClipboardList, Utensils, TrendingUp, LogOut, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'  },
  { href: '/orders',    icon: ClipboardList,   label: 'Pedidos'    },
  { href: '/menu',      icon: Utensils,        label: 'Menú'       },
  { href: '/earnings',  icon: TrendingUp,      label: 'Ganancias'  },
]

type SidebarProps = {
  restaurantName: string
  userEmail: string
}

export function Sidebar({ restaurantName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-white border-r border-gray-100">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white font-bold text-sm">
          {restaurantName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{restaurantName}</p>
          <p className="text-xs text-gray-400">Panel de gestión</p>
        </div>
      </div>

      <div className="mx-4 border-t border-gray-100" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
              )}
            >
              <Icon className={cn('h-4.5 w-4.5', active ? 'text-orange-500' : 'text-gray-400')} size={18} />
              {label}
              {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-orange-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 p-3">
        <p className="px-3 pb-1 truncate text-xs text-gray-400">{userEmail}</p>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} className="text-gray-400" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
