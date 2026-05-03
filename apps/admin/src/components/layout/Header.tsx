'use client'
import { useRouter } from 'next/navigation'
import { Menu, Bell, Sun, Moon, LogOut, User, Search, AlertCircle } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useUIStore } from '@/store/ui-store'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import type { AdminUser } from '@/lib/types'

interface Props {
  admin:       AdminUser | null
  breadcrumbs: { label: string; href?: string }[]
}

const ENV = process.env.NEXT_PUBLIC_APP_ENV ?? 'development'

export function Header({ admin, breadcrumbs }: Props) {
  const { toggleSidebar } = useUIStore()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.replace('/login')
  }

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 flex h-16 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 transition-all duration-300">
      {/* Mobile menu trigger */}
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            <span className={i === breadcrumbs.length - 1 ? 'font-semibold text-foreground truncate' : 'text-muted-foreground'}>
              {crumb.label}
            </span>
          </span>
        ))}
      </div>

      {/* Environment badge */}
      {ENV !== 'production' && (
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 text-[10px] font-bold uppercase text-yellow-800 dark:text-yellow-400">
          <AlertCircle className="h-2.5 w-2.5" />
          {ENV}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {admin ? getInitials(admin.full_name) : '?'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{admin?.full_name ?? 'Admin'}</p>
                <p className="text-xs leading-none text-muted-foreground">{admin?.email ?? ''}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
