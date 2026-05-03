'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare } from 'lucide-react'

interface Props { ticketId: string }

export function TicketReplyForm({ ticketId }: Props) {
  const [content,    setContent]    = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading,    setLoading]    = useState(false)

  const handleSend = async () => {
    if (!content.trim()) { toast.error('Escribe un mensaje'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: adminUser } = await supabase.from('admin_users').select('full_name').eq('user_id', user?.id ?? '').single()
      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id:   ticketId,
        sender_type: 'admin',
        sender_id:   user?.id,
        sender_name: adminUser?.full_name ?? 'Admin',
        content:     content.trim(),
        is_internal: isInternal,
      })
      if (error) throw error
      await supabase.from('support_tickets').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', ticketId)
      toast.success(isInternal ? 'Nota interna añadida' : 'Respuesta enviada')
      setContent('')
      window.location.reload()
    } catch {
      toast.error('Error al enviar la respuesta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Responder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Escribe tu respuesta…"
          rows={4}
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch id="internal" checked={isInternal} onCheckedChange={setIsInternal} />
            <Label htmlFor="internal" className="text-sm cursor-pointer">
              Nota interna <span className="text-muted-foreground">(no visible al usuario)</span>
            </Label>
          </div>
          <Button onClick={handleSend} disabled={loading || !content.trim()}>
            {loading ? 'Enviando…' : 'Enviar respuesta'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
