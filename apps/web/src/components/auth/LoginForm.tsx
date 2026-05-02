'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, UtensilsCrossed } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { toast } from 'sonner'

export function LoginForm() {
  const router = useRouter()
  const [showPw,   setShowPw]   = useState(false)
  const [recovery, setRecovery] = useState(false)

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onLogin = async (data: LoginInput) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast.error(
        error.message.includes('Invalid login')
          ? 'Correo o contraseña incorrectos'
          : error.message
      )
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const onForgotPassword = async () => {
    const email = getValues('email')
    if (!email) { toast.error('Ingresa tu correo primero'); return }
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Revisa tu correo para restablecer la contraseña')
    setRecovery(false)
  }

  return (
    <form onSubmit={handleSubmit(onLogin)} className="space-y-4" noValidate>
      <Input
        label="Correo electrónico"
        type="email"
        placeholder="tu@restaurante.com"
        autoComplete="email"
        leftElement={<Mail size={15} />}
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Contraseña"
        type={showPw ? 'text' : 'password'}
        placeholder="••••••••"
        autoComplete="current-password"
        leftElement={<Lock size={15} />}
        rightElement={
          <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        }
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setRecovery(true)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {recovery && (
        <div className="rounded-lg border border-border bg-accent/50 p-3 text-xs text-muted-foreground space-y-2">
          <p>Te enviaremos un enlace al correo ingresado arriba.</p>
          <button
            type="button"
            onClick={onForgotPassword}
            className="font-medium text-primary hover:underline"
          >
            Enviar enlace de recuperación
          </button>
        </div>
      )}

      <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
        Iniciar sesión
      </Button>
    </form>
  )
}
