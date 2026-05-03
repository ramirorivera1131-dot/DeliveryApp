import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface Props {
  title:   string
  value:   string | number
  prefix?: string
  suffix?: string
  change?: number
  icon:    LucideIcon
  iconBg?: string
  isCurrency?: boolean
  subtitle?: string
}

export function KpiCard({ title, value, change, icon: Icon, iconBg = 'bg-primary/10', isCurrency, subtitle }: Props) {
  const isPositive = (change ?? 0) > 0
  const isZero     = change === 0 || change === undefined

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{title}</p>
            <p className="mt-1 text-2xl font-bold text-foreground leading-tight">
              {isCurrency ? formatCurrency(Number(value)) : value}
            </p>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
            {change !== undefined && (
              <div className={cn(
                'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                isZero     ? 'bg-muted text-muted-foreground' :
                isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                             'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
              )}>
                {isZero     ? <Minus className="h-3 w-3" /> :
                 isPositive ? <TrendingUp className="h-3 w-3" /> :
                              <TrendingDown className="h-3 w-3" />}
                <span>{isZero ? 'Sin cambio' : `${isPositive ? '+' : ''}${change}% vs ayer`}</span>
              </div>
            )}
          </div>
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconBg)}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
