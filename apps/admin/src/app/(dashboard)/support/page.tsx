import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from '@/lib/utils'
import { HeadphonesIcon, ExternalLink, Plus } from 'lucide-react'
import { NewTicketDialog } from '@/components/support/NewTicketDialog'

async function getTickets() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('support_tickets')
    .select('*, assigned_admin:admin_users(full_name)')
    .order('created_at', { ascending: false })
    .limit(100)
  return data ?? []
}

export default async function SupportPage() {
  const tickets = await getTickets()
  const openCount    = tickets.filter(t => ['new', 'in_progress'].includes(t.status)).length
  const urgentCount  = tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Soporte</h1>
          <p className="text-muted-foreground text-sm mt-1">{tickets.length} tickets · {openCount} abiertos · {urgentCount} urgentes/altos</p>
        </div>
        <NewTicketDialog />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(TICKET_STATUS_LABELS).map(([key, cfg]) => {
          const count = tickets.filter(t => t.status === key).length
          return (
            <Card key={key}>
              <CardContent className="p-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                <p className="text-2xl font-bold mt-2">{count}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><HeadphonesIcon className="h-4 w-4" /> Todos los tickets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Asignado a</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Sin tickets de soporte</TableCell></TableRow>
              )}
              {tickets.map(ticket => {
                const st  = TICKET_STATUS_LABELS[ticket.status]
                const pri = TICKET_PRIORITY_LABELS[ticket.priority]
                return (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div>
                        <p className="font-mono text-xs font-bold">{ticket.ticket_number}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-48">{ticket.subject}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{ticket.requester_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{ticket.requester_type}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{ticket.category}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${pri?.color ?? ''}`}>{pri?.label}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${st?.color ?? ''}`}>{st?.label}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{(ticket as { assigned_admin?: { full_name: string } | null }).assigned_admin?.full_name ?? '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(ticket.created_at)}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/support/${ticket.id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
