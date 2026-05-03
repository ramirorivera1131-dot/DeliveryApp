'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Pencil, Check, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@delivery/shared/database.types'

type Plan = Database['public']['Tables']['subscription_plans']['Row']

interface Props { plans: Plan[] }

export function PlansEditor({ plans: initial }: Props) {
  const [plans, setPlans]     = useState<Plan[]>(initial)
  const [editId, setEditId]   = useState<string | null>(null)
  const [draft, setDraft]     = useState<Partial<Plan>>({})
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const startEdit = (plan: Plan) => {
    setEditId(plan.id)
    setDraft({
      display_name:        plan.display_name,
      price_per_branch_usd: plan.price_per_branch_usd,
      max_branches:        plan.max_branches ?? undefined,
      is_active:           plan.is_active,
    })
  }

  const cancelEdit = () => { setEditId(null); setDraft({}) }

  const saveEdit = async () => {
    if (!editId) return
    setLoading(true)
    try {
      const { error } = await supabase.from('subscription_plans').update({
        display_name:        draft.display_name,
        price_per_branch_usd: draft.price_per_branch_usd,
        max_branches:        draft.max_branches ?? null,
        is_active:           draft.is_active,
      }).eq('id', editId)
      if (error) throw error
      setPlans(prev => prev.map(p =>
        p.id === editId ? { ...p, ...draft, max_branches: draft.max_branches ?? null } as Plan : p
      ))
      setEditId(null)
      setDraft({})
      toast.success('Plan actualizado')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (plan: Plan) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('subscription_plans').update({ is_active: !plan.is_active }).eq('id', plan.id)
      if (error) throw error
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p))
      toast.success(plan.is_active ? 'Plan desactivado' : 'Plan activado')
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Plan</TableHead>
          <TableHead>Precio / sucursal</TableHead>
          <TableHead>Máx. sucursales</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-28" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map(plan => (
          <TableRow key={plan.id}>
            {editId === plan.id ? (
              <>
                <TableCell>
                  <Input className="h-8" value={draft.display_name ?? ''} onChange={e => setDraft(d => ({ ...d, display_name: e.target.value }))} />
                </TableCell>
                <TableCell>
                  <Input type="number" className="h-8 w-28" value={draft.price_per_branch_usd ?? ''} onChange={e => setDraft(d => ({ ...d, price_per_branch_usd: parseFloat(e.target.value) }))} />
                </TableCell>
                <TableCell>
                  <Input type="number" className="h-8 w-20" placeholder="∞" value={draft.max_branches ?? ''} onChange={e => setDraft(d => ({ ...d, max_branches: e.target.value ? parseInt(e.target.value) : undefined }))} />
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="h-8" onClick={() => setDraft(d => ({ ...d, is_active: !d.is_active }))}>
                    {draft.is_active ? 'Activo' : 'Inactivo'}
                  </Button>
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveEdit} disabled={loading}><Check className="h-3.5 w-3.5 text-green-600" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit}><X className="h-3.5 w-3.5" /></Button>
                </TableCell>
              </>
            ) : (
              <>
                <TableCell>
                  <p className="font-medium text-sm">{plan.display_name}</p>
                  <p className="text-xs text-muted-foreground">{plan.name}</p>
                </TableCell>
                <TableCell className="text-sm font-medium">{formatCurrency(plan.price_per_branch_usd)}<span className="text-muted-foreground font-normal">/mes</span></TableCell>
                <TableCell className="text-sm">{plan.max_branches ?? '∞'}</TableCell>
                <TableCell>
                  <Badge
                    variant={plan.is_active ? 'success' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => toggleActive(plan)}
                  >
                    {plan.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(plan)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </>
            )}
          </TableRow>
        ))}
        {!plans.length && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">Sin planes configurados</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
