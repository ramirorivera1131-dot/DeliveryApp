import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatDate, TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from '@/lib/utils'
import { ArrowLeft, HeadphonesIcon, MessageSquare } from 'lucide-react'
import { TicketReplyForm } from '@/components/support/TicketReplyForm'

async function getTicket(id: string) {
  const supabase = createAdminClient()
  const [{ data: ticket }, { data: messages }] = await Promise.all([
    supabase.from('support_tickets')
      .select('*, assigned_admin:admin_users(full_name, email)')
      .eq('id', id)
      .single(),
    supabase.from('ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true }),
  ])
  return { ticket, messages: messages ?? [] }
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { ticket, messages } = await getTicket(id)
  if (!ticket) notFound()

  const st  = TICKET_STATUS_LABELS[ticket.status]
  const pri = TICKET_PRIORITY_LABELS[ticket.priority]

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/support"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-bold text-muted-foreground">{ticket.ticket_number}</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${st?.color ?? ''}`}>{st?.label}</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${pri?.color ?? ''}`}>{pri?.label}</span>
          </div>
          <h1 className="text-xl font-bold mt-1">{ticket.subject}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{formatDate(ticket.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          {/* Description */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><HeadphonesIcon className="h-4 w-4" /> Descripción original</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Messages */}
          {messages.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Conversación</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {messages.map((msg: { id: string; sender_name: string; sender_type: string; content: string; is_internal: boolean; created_at: string }) => (
                  <div key={msg.id} className={`rounded-lg p-3 ${msg.sender_type === 'admin' ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'} ${msg.is_internal ? 'border border-yellow-200 dark:border-yellow-800' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{msg.sender_name}</span>
                      {msg.is_internal && <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded-full font-bold">INTERNO</span>}
                    </div>
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatDate(msg.created_at)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Reply form */}
          <TicketReplyForm ticketId={ticket.id} />
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Información del ticket</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Categoría</span><span className="capitalize">{ticket.category}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span className="capitalize">{ticket.requester_type}</span></div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs mb-1">Solicitante</p>
                <p className="font-medium">{ticket.requester_name}</p>
                <p className="text-xs text-muted-foreground">{ticket.requester_email}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs mb-1">Asignado a</p>
                <p className="font-medium">{(ticket as { assigned_admin?: { full_name: string } | null }).assigned_admin?.full_name ?? 'Sin asignar'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
