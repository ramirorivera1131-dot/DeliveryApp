'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type Category = { id: string; name: string; description: string | null; sort_order: number; is_active: boolean }

type Props = {
  isOpen: boolean
  onClose: () => void
  restaurantId: string
  editing?: Category | null
  onSaved: (cat: Category) => void
}

export function CategoryModal({ isOpen, onClose, restaurantId, editing, onSaved }: Props) {
  const [name, setName]               = useState(editing?.name ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [error, setError]             = useState('')
  const [saving, setSaving]           = useState(false)

  // Reset on open/close
  const handleClose = () => {
    setName(editing?.name ?? '')
    setDescription(editing?.description ?? '')
    setError('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setSaving(true)
    try {
      const supabase = createClient()
      if (editing) {
        const { data, error: err } = await supabase
          .from('categories')
          .update({ name: name.trim(), description: description.trim() || null })
          .eq('id', editing.id)
          .select()
          .single()
        if (err) throw err
        onSaved(data as Category)
      } else {
        const { data, error: err } = await supabase
          .from('categories')
          .insert({ restaurant_id: restaurantId, name: name.trim(), description: description.trim() || null })
          .select()
          .single()
        if (err) throw err
        onSaved(data as Category)
      }
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={editing ? 'Editar categoría' : 'Nueva categoría'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Hamburguesas"
          required
        />
        <Textarea
          label="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Breve descripción de la categoría"
          rows={2}
        />
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" isLoading={saving}>
            {editing ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
