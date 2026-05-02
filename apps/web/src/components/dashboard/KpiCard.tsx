import { cn, formatCurrency, pctChange } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

type Format = 'number' | 'currency' | 'percent' | 'minutes'

function formatValue(value: number, format: Format = 'number') {
  if (format === 'currency') return formatCurrency(value)
  if (format === 'percent') return `${value.toFixed(1)}%`
  if (format === 'minutes') return `${Math.round(value)} min`
  return value.toLocaleString('es-MX')
}

type Props = {
  title: string
  value: number
  prev?: number
  format?: Format
  icon: LucideIcon
  iconColor?: string
  loading?: boolean
  alert?: string
}

export function KpiCard({ title, value, prev, format, icon: Icon, iconColor = 'text-primary', loading, alert }: Props) {
  if (loading) return <SkeletonCard />

  const pct   = prev !== undefined ? pctChange(value, prev) : null
  const up    = pct !== null && pct > 0
  const down  = pct !== null && pct < 0
  const same  = pct !== null && pct === 0

  return (
    <div className={cn(
      'relative rounded-xl border border-border bg-card p-5 overflow-hidden transition-shadow hover:shadow-md',
      alert && 'border-destructive/50',
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground leading-none">{title}</p>
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', 'bg-primary/10')}>
          <Icon size={15} className={iconColor} />
        </div>
      </div>

      <p className="text-2xl font-bold text-foreground tracking-tight">
        {formatValue(value, format)}
      </p>

      <div className="mt-2 flex items-center gap-1.5">
        {pct !== null ? (
          <>
            <span className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium',
              up   && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              down && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
              same && 'bg-secondary text-secondary-foreground',
            )}>
              {up   && <TrendingUp  size={10} />}
              {down && <TrendingDown size={10} />}
              {same && <Minus size={10} />}
              {Math.abs(pct)}%
            </span>
            <span className="text-xs text-muted-foreground">vs período anterior</span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Sin datos anteriores</span>
        )}
      </div>

      {alert && (
        <div className="mt-2 text-xs text-destructive font-medium">{alert}</div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-24" />
    </div>
  )
}
