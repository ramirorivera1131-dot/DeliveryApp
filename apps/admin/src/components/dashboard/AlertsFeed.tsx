import Link from 'next/link'
import { AlertTriangle, Clock, CreditCard, HeadphonesIcon, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Alert } from '@/lib/types'

const ICON_MAP = {
  order_stuck:    { icon: Clock,            color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
  driver_conflict:{ icon: AlertTriangle,    color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
  sub_expiring:   { icon: CreditCard,       color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' },
  ticket_pending: { icon: HeadphonesIcon,   color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
}

interface Props { alerts: Alert[] }

export function AlertsFeed({ alerts }: Props) {
  if (!alerts.length) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Sin alertas activas ✓</p>
  }

  return (
    <div className="space-y-2">
      {alerts.map(alert => {
        const cfg    = ICON_MAP[alert.type]
        const Icon   = cfg.icon
        const content = (
          <div className={cn(
            'flex items-start gap-3 rounded-lg p-3 transition-colors',
            alert.link ? 'hover:bg-muted cursor-pointer' : '',
          )}>
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cfg.color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{alert.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
            </div>
            {alert.link && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />}
          </div>
        )

        return alert.link
          ? <Link key={alert.id} href={alert.link}>{content}</Link>
          : <div key={alert.id}>{content}</div>
      })}
    </div>
  )
}
