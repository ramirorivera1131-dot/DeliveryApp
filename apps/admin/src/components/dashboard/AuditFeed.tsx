import { formatTimeAgo } from '@/lib/utils'
import type { AuditLog } from '@/lib/types'

interface Props { logs: AuditLog[] }

const ACTION_LABELS: Record<string, string> = {
  'restaurant.suspend':    'Restaurante suspendido',
  'restaurant.activate':   'Restaurante activado',
  'driver.suspend':        'Repartidor suspendido',
  'driver.approve':        'Repartidor aprobado',
  'order.cancel':          'Pedido cancelado',
  'order.refund':          'Reembolso generado',
  'subscription.change':   'Plan modificado',
  'subscription.grant':    'Período gratuito otorgado',
  'admin.login':           'Inicio de sesión',
  'ticket.resolved':       'Ticket resuelto',
}

export function AuditFeed({ logs }: Props) {
  if (!logs.length) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Sin acciones recientes</p>
  }

  return (
    <div className="space-y-0 divide-y">
      {logs.map(log => (
        <div key={log.id} className="flex items-start gap-3 py-3">
          <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary mt-0.5">
            {log.admin_users?.full_name?.charAt(0) ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">
              <span className="font-medium">{log.admin_users?.full_name ?? 'Sistema'}</span>
              {' — '}
              <span>{ACTION_LABELS[log.action] ?? log.action}</span>
            </p>
            {log.entity_id && (
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {log.entity_type} · {log.entity_id.slice(0, 8)}
              </p>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">{formatTimeAgo(log.created_at)}</span>
        </div>
      ))}
    </div>
  )
}
