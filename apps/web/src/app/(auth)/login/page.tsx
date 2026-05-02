import { LoginForm } from '@/components/auth/LoginForm'
import { UtensilsCrossed } from 'lucide-react'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white mb-4">
            <UtensilsCrossed className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery App</h1>
          <p className="mt-1 text-sm text-gray-500">Panel de restaurantes</p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Iniciar sesión</h2>
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
