'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { supportTicketSchema, type SupportTicketInput } from '@/lib/validations'

export function NewTicketDialog() {
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<SupportTicketInput>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: { priority: 'medium', requester_type: 'other' },
  })

  const onSubmit = async (data: SupportTicketInput) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('support_tickets').insert(data)
      if (error) throw error
      toast.success('Ticket creado exitosamente')
      reset()
      setOpen(false)
      window.location.reload()
    } catch {
      toast.error('Error al crear el ticket')
    }
  }

  return (
    <>
      <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nuevo ticket
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Crear ticket de soporte</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo de solicitante</Label>
                <Select onValueChange={v => setValue('requester_type', v as SupportTicketInput['requester_type'])}>
                  <SelectTrigger><SelectValue placeholder="Tipo…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Cliente</SelectItem>
                    <SelectItem value="restaurant">Restaurante</SelectItem>
                    <SelectItem value="driver">Repartidor</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Categoría</Label>
                <Select onValueChange={v => setValue('category', v as SupportTicketInput['category'])}>
                  <SelectTrigger><SelectValue placeholder="Categoría…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Pedido</SelectItem>
                    <SelectItem value="payment">Pago</SelectItem>
                    <SelectItem value="account">Cuenta</SelectItem>
                    <SelectItem value="technical">Técnico</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nombre del solicitante</Label>
                <Input placeholder="Nombre…" {...register('requester_name')} />
                {errors.requester_name && <p className="text-xs text-destructive">{errors.requester_name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Correo</Label>
                <Input type="email" placeholder="correo@…" {...register('requester_email')} />
                {errors.requester_email && <p className="text-xs text-destructive">{errors.requester_email.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Prioridad</Label>
              <Select defaultValue="medium" onValueChange={v => setValue('priority', v as SupportTicketInput['priority'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Asunto</Label>
              <Input placeholder="Asunto del ticket…" {...register('subject')} />
              {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Textarea placeholder="Describe el problema…" rows={3} {...register('description')} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando…' : 'Crear ticket'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
