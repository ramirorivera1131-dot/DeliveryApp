import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatRelativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `hace ${diffHr}h`
  return new Intl.DateTimeFormat('es-MX', { month: 'short', day: 'numeric' }).format(new Date(dateStr))
}

export function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(dateStr))
}

export const ORDER_STATUS = {
  pending:    { label: 'Nuevo',      bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', dot: 'bg-yellow-400' },
  confirmed:  { label: 'Confirmado', bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-200',   dot: 'bg-blue-400'   },
  preparing:  { label: 'En cocina',  bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-400' },
  ready:      { label: 'Listo',      bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-400' },
  picked_up:  { label: 'Recogido',   bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', dot: 'bg-indigo-400' },
  in_transit: { label: 'En camino',  bg: 'bg-cyan-100',   text: 'text-cyan-800',   border: 'border-cyan-200',   dot: 'bg-cyan-400'   },
  delivered:  { label: 'Entregado',  bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-200',  dot: 'bg-green-400'  },
  cancelled:  { label: 'Cancelado',  bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-200',    dot: 'bg-red-400'    },
} as const

export type OrderStatusKey = keyof typeof ORDER_STATUS

export function getStatusConfig(status: string) {
  return (
    ORDER_STATUS[status as OrderStatusKey] ?? {
      label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-400',
    }
  )
}
