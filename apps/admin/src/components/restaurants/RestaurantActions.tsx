'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { MoreVertical, Ban, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { Restaurant } from '@/lib/types'

interface Props { restaurant: Restaurant; adminId: string }

export function RestaurantActions({ restaurant, adminId }: Props) {
  const [action, setAction]     = useState<'suspend' | 'activate' | null>(null)
  const [reason, setReason]     = useState('')
  const [loading, setLoading]   = useState(false)

  const handleAction = async () => {
    if (action === 'suspend' && reason.trim().length < 10) {
      toast.error('El motivo debe tener al menos 10 caracteres')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/restaurants/update-status', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          restaurantId: restaurant.id,
          isActive:     action === 'activate',
          reason:       reason.trim(),
          adminId,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(action === 'suspend' ? 'Restaurante suspendido' : 'Restaurante activado')
      setAction(null)
      setReason('')
      window.location.reload()
    } catch {
      toast.error('Error al actualizar el restaurante')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {restaurant.is_active ? (
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setAction('suspend')}>
              <Ban className="mr-2 h-4 w-4" /> Suspender
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setAction('activate')}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Reactivar
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground" disabled>
            <AlertCircle className="mr-2 h-4 w-4" /> Cambiar plan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation dialog */}
      <Dialog open={!!action} onOpenChange={open => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'suspend' ? 'Suspender restaurante' : 'Reactivar restaurante'}
            </DialogTitle>
            <DialogDescription>
              {action === 'suspend'
                ? `¿Confirmas suspender "${restaurant.name}"? El restaurante no podrá recibir pedidos.`
                : `¿Confirmas reactivar "${restaurant.name}"?`}
            </DialogDescription>
          </DialogHeader>
          {action === 'suspend' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo de suspensión <span className="text-destructive">*</span></Label>
              <Textarea
                id="reason"
                placeholder="Describe el motivo de la suspensión (mínimo 10 caracteres)…"
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Esta acción queda registrada en el audit log.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancelar</Button>
            <Button
              variant={action === 'suspend' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={loading}
            >
              {loading ? 'Procesando…' : action === 'suspend' ? 'Suspender' : 'Reactivar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
