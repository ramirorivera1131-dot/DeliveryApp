import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { OrderStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style:    'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

export function formatDateOnly(dateStr: string): string {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(dateStr))
}

export function formatTime(dateStr: string): string {
  return new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr))
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'Ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export function formatRelativeTime(dateStr: string): string {
  const diffMs  = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1)  return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24)  return `hace ${diffHr}h`
  return new Intl.DateTimeFormat('es-MX', { month: 'short', day: 'numeric' }).format(new Date(dateStr))
}

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; next?: OrderStatus; nextLabel?: string }
> = {
  pending:    { label: 'Nuevo',      color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', next: 'confirmed',  nextLabel: 'Aceptar pedido' },
  confirmed:  { label: 'Aceptado',   color: 'text-blue-700 dark:text-blue-400',     bg: 'bg-blue-100 dark:bg-blue-900/30',     next: 'preparing',  nextLabel: 'Enviar a cocina' },
  preparing:  { label: 'En cocina',  color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', next: 'ready',      nextLabel: 'Marcar listo' },
  ready:      { label: 'Listo',      color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', next: 'delivered',  nextLabel: 'Entregado' },
  picked_up:  { label: 'Recogido',   color: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  in_transit: { label: 'En camino',  color: 'text-cyan-700 dark:text-cyan-400',     bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
  delivered:  { label: 'Entregado',  color: 'text-green-700 dark:text-green-400',   bg: 'bg-green-100 dark:bg-green-900/30' },
  cancelled:  { label: 'Cancelado',  color: 'text-red-700 dark:text-red-400',       bg: 'bg-red-100 dark:bg-red-900/30' },
}

export function getStatusConfig(status: string) {
  return ORDER_STATUS_CONFIG[status as OrderStatus] ?? {
    label: status, color: 'text-gray-700', bg: 'bg-gray-100',
  }
}

export const ORDER_STATUS = ORDER_STATUS_CONFIG
export type OrderStatusKey = OrderStatus
