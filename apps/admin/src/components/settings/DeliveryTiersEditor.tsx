'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@delivery/shared/database.types'

type Tier = Database['public']['Tables']['delivery_fee_tiers']['Row']

interface Props { tiers: Tier[] }

export function DeliveryTiersEditor({ tiers: initial }: Props) {
  const [tiers, setTiers]     = useState<Tier[]>(initial)
  const [editId, setEditId]   = useState<string | null>(null)
  const [draft, setDraft]     = useState<Partial<Tier>>({})
  const [adding, setAdding]   = useState(false)
  const [newRow, setNewRow]   = useState({ min_km: '', max_km: '', fee_usd: '', label: '' })
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const startEdit = (tier: Tier) => {
    setEditId(tier.id)
    setDraft({ min_km: tier.min_km, max_km: tier.max_km ?? undefined, fee_usd: tier.fee_usd, label: tier.label })
  }

  const cancelEdit = () => { setEditId(null); setDraft({}) }

  const saveEdit = async () => {
    if (!editId) return
    setLoading(true)
    try {
      const { error } = await supabase.from('delivery_fee_tiers').update({
        min_km:  draft.min_km,
        max_km:  draft.max_km ?? null,
        fee_usd: draft.fee_usd,
        label:   draft.label,
      }).eq('id', editId)
      if (error) throw error
      setTiers(prev => prev.map(t => t.id === editId ? { ...t, ...draft, max_km: draft.max_km ?? null } as Tier : t))
      setEditId(null)
      setDraft({})
      toast.success('Tarifa actualizada')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const deleteTier = async (id: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('delivery_fee_tiers').delete().eq('id', id)
      if (error) throw error
      setTiers(prev => prev.filter(t => t.id !== id))
      toast.success('Tarifa eliminada')
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setLoading(false)
    }
  }

  const addTier = async () => {
    const min = parseFloat(newRow.min_km)
    const max = newRow.max_km ? parseFloat(newRow.max_km) : null
    const fee = parseFloat(newRow.fee_usd)
    if (isNaN(min) || isNaN(fee) || !newRow.label) { toast.error('Valores inválidos'); return }
    setLoading(true)
    try {
      const { data, error } = await supabase.from('delivery_fee_tiers').insert({
        min_km: min, max_km: max, fee_usd: fee, label: newRow.label,
      }).select().single()
      if (error) throw error
      setTiers(prev => [...prev, data].sort((a, b) => a.min_km - b.min_km))
      setNewRow({ min_km: '', max_km: '', fee_usd: '', label: '' })
      setAdding(false)
      toast.success('Tarifa añadida')
    } catch {
      toast.error('Error al añadir')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Etiqueta</TableHead>
            <TableHead>Desde (km)</TableHead>
            <TableHead>Hasta (km)</TableHead>
            <TableHead>Tarifa</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiers.map(tier => (
            <TableRow key={tier.id}>
              {editId === tier.id ? (
                <>
                  <TableCell>
                    <Input className="h-8 w-32" value={draft.label ?? ''} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" className="h-8 w-20" value={draft.min_km ?? ''} onChange={e => setDraft(d => ({ ...d, min_km: parseFloat(e.target.value) }))} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" className="h-8 w-20" placeholder="∞" value={draft.max_km ?? ''} onChange={e => setDraft(d => ({ ...d, max_km: e.target.value ? parseFloat(e.target.value) : undefined }))} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" className="h-8 w-24" value={draft.fee_usd ?? ''} onChange={e => setDraft(d => ({ ...d, fee_usd: parseFloat(e.target.value) }))} />
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveEdit} disabled={loading}><Check className="h-3.5 w-3.5 text-green-600" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit}><X className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="text-sm font-medium">{tier.label}</TableCell>
                  <TableCell className="text-sm">{tier.min_km} km</TableCell>
                  <TableCell className="text-sm">{tier.max_km != null ? `${tier.max_km} km` : '∞'}</TableCell>
                  <TableCell className="text-sm font-medium">{formatCurrency(tier.fee_usd)}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(tier)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteTier(tier.id)} disabled={loading}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}

          {adding && (
            <TableRow>
              <TableCell>
                <Input className="h-8 w-32" placeholder="Etiqueta" value={newRow.label} onChange={e => setNewRow(r => ({ ...r, label: e.target.value }))} />
              </TableCell>
              <TableCell>
                <Input type="number" className="h-8 w-20" placeholder="0" value={newRow.min_km} onChange={e => setNewRow(r => ({ ...r, min_km: e.target.value }))} />
              </TableCell>
              <TableCell>
                <Input type="number" className="h-8 w-20" placeholder="∞" value={newRow.max_km} onChange={e => setNewRow(r => ({ ...r, max_km: e.target.value }))} />
              </TableCell>
              <TableCell>
                <Input type="number" className="h-8 w-24" placeholder="0.00" value={newRow.fee_usd} onChange={e => setNewRow(r => ({ ...r, fee_usd: e.target.value }))} />
              </TableCell>
              <TableCell className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={addTier} disabled={loading}><Check className="h-3.5 w-3.5 text-green-600" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5" /></Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {!adding && (
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" /> Añadir rango
        </Button>
      )}
    </div>
  )
}
