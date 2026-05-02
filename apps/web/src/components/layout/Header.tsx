'use client'
import { useState } from 'react'
import { Bell, Moon, Sun, Monitor, ChevronDown, User, LogOut, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui-store'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

export function Header({ userEmail }: { userEmail?: string }) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [showNotifs,  setShowNotifs]  = useState(false)
  const [showUser,    setShowUser]    = useState(false)
  const [showTheme,   setShowTheme]   = useState(false)
  const { notifications, unreadCount, markAllRead } = useUIStore()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const themeOptions = [
    { value: 'light',  label: 'Claro',   icon: Sun },
    { value: 'dark',   label: 'Oscuro',  icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ]
  const currentThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-2 border-b border-border bg-card/60 backdrop-blur-sm px-5">

      {/* Theme selector */}
      <div className="relative">
        <button
          onClick={() => { setShowTheme(v => !v); setShowNotifs(false); setShowUser(false) }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <currentThemeIcon.render className="h-4 w-4" />
          {currentThemeIcon === Sun   && <Sun   size={16} />}
          {currentThemeIcon === Moon  && <Moon  size={16} />}
          {currentThemeIcon === Monitor && <Monitor size={16} />}
        </button>
        {showTheme && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowTheme(false)} />
            <div className="absolute right-0 top-10 z-20 w-36 rounded-xl border border-border bg-popover shadow-lg py-1">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => { setTheme(value); setShowTheme(false) }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                    theme === value
                      ? 'bg-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setShowNotifs(v => !v); setShowUser(false); setShowTheme(false); if (!showNotifs) markAllRead() }}
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        {showNotifs && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowNotifs(false)} />
            <div className="absolute right-0 top-10 z-20 w-80 rounded-xl border border-border bg-popover shadow-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Notificaciones</span>
                {notifications.length > 0 && (
                  <button onClick={() => useUIStore.getState().clearNotifications()} className="text-xs text-muted-foreground hover:text-foreground">
                    Limpiar
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Bell size={24} className="text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Sin notificaciones</p>
                  </div>
                ) : (
                  notifications.slice(0, 20).map(n => (
                    <div key={n.id} className={cn(
                      'flex gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-accent/50 transition-colors',
                      !n.read && 'bg-primary/5'
                    )}>
                      <div className={cn(
                        'mt-0.5 h-2 w-2 shrink-0 rounded-full',
                        n.type === 'order' ? 'bg-primary' : n.type === 'alert' ? 'bg-destructive' : 'bg-blue-500'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(n.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => { setShowUser(v => !v); setShowNotifs(false); setShowTheme(false) }}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
            {userEmail?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <span className="hidden md:block max-w-[120px] truncate text-xs">{userEmail}</span>
          <ChevronDown size={12} />
        </button>
        {showUser && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowUser(false)} />
            <div className="absolute right-0 top-10 z-20 w-48 rounded-xl border border-border bg-popover shadow-lg py-1">
              <Link href="/settings" onClick={() => setShowUser(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <Settings size={14} />
                Configuración
              </Link>
              <div className="my-1 border-t border-border" />
              <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
