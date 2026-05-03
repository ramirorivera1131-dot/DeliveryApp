'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Zap, Shield, Lock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations'

export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'unauthorized') toast.error('Acceso no autorizado', { description: 'Tu cuenta no tiene permisos de administrador.' })
    if (error === 'locked')       toast.error('Cuenta bloqueada', { description: 'Intenta de nuevo más tarde.' })
    if (error === 'auth')         toast.error('Error de autenticación')
    const reason = searchParams.get('reason')
    if (reason === 'inactivity')  toast.info('Sesión cerrada por inactividad')
  }, [searchParams])

  const onSubmit = async ({ email, password }: LoginInput) => {
    const supabase = createClient()

    // Check if account is locked before attempting auth
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('is_active, locked_until, failed_login_attempts')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (adminCheck) {
      if (adminCheck.locked_until && new Date(adminCheck.locked_until) > new Date()) {
        // Generic message — don't reveal why
        toast.error('Acceso denegado', { description: 'Verifica tus credenciales o intenta más tarde.' })
        return
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email:    email.toLowerCase().trim(),
      password,
    })

    if (error) {
      // Increment failed attempts
      if (adminCheck) {
        const newAttempts = (adminCheck.failed_login_attempts ?? 0) + 1
        const updates: Record<string, unknown> = { failed_login_attempts: newAttempts }
        if (newAttempts >= 5) {
          updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString()
        }
        await supabase.from('admin_users').update(updates).eq('email', email.toLowerCase().trim())
      }
      // Always show generic error
      toast.error('Acceso denegado', { description: 'Verifica tus credenciales e intenta de nuevo.' })
      return
    }

    // Reset failed attempts on success
    await supabase
      .from('admin_users')
      .update({ failed_login_attempts: 0, locked_until: null, last_login_at: new Date().toISOString() })
      .eq('email', email.toLowerCase().trim())

    const next = searchParams.get('next') ?? '/'
    router.replace(next)
    router.refresh()
  }

  return (
    <div className="w-full max-w-md space-y-8 animate-fade-in">
      {/* Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 shadow-2xl">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Panel Administrativo</h1>
          <p className="mt-1 text-sm text-slate-400">Acceso restringido a personal autorizado</p>
        </div>

        {/* Security badge */}
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-2">
          <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-slate-400">Conexión segura · Solo correos pre-autorizados</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-300">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="admin@empresa.com"
              className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-primary"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-300">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-primary pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full h-11 font-semibold" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Verificando…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Ingresar
              </span>
            )}
          </Button>
        </form>

        <div className="mt-6 flex items-start gap-2 rounded-lg bg-yellow-900/20 border border-yellow-700/30 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-yellow-600 dark:text-yellow-400">
            Máx. 5 intentos antes del bloqueo temporal. Cada acceso queda registrado.
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        ¿Sin acceso? Contacta al administrador del sistema.
      </p>
    </div>
  )
}
