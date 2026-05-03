import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-PA', { style: 'currency', currency }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy HH:mm', { locale: es })
}

export function formatDateOnly(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy', { locale: es })
}

export function formatTimeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: es })
}

export function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '…' : str
}

export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  confirmed:  { label: 'Confirmado',  color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  preparing:  { label: 'Preparando',  color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  ready:      { label: 'Listo',       color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  picked_up:  { label: 'Recogido',    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  in_transit: { label: 'En camino',   color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  delivered:  { label: 'Entregado',   color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled:  { label: 'Cancelado',   color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

export const DRIVER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  busy:      { label: 'Ocupado',    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  offline:   { label: 'Inactivo',   color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

export const SUB_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: 'Activa',    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  trialing:  { label: 'Prueba',    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  past_due:  { label: 'Vencida',   color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  cancelled: { label: 'Cancelada', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  pending:   { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
}

export const TICKET_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:         { label: 'Nuevo',      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  in_progress: { label: 'En proceso', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  waiting:     { label: 'En espera',  color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  resolved:    { label: 'Resuelto',   color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  closed:      { label: 'Cerrado',    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

export const TICKET_PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  low:    { label: 'Baja',    color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Media',   color: 'bg-blue-100 text-blue-800' },
  high:   { label: 'Alta',    color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
}
