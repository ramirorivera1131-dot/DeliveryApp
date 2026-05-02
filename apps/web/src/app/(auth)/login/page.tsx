import { LoginForm } from '@/components/auth/LoginForm'
import { Bike } from 'lucide-react'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/20 p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30 text-primary-foreground mb-4">
            <Bike className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Delivery</h1>
          <p className="mt-1 text-sm text-muted-foreground">Panel de administración para restaurantes</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/5">
          <h2 className="text-lg font-semibold text-foreground mb-6">Iniciar sesión</h2>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          ¿Problemas para acceder? Contacta al soporte.
        </p>
      </div>
    </main>
  )
}
