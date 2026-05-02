'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUpsertCategory } from '@/hooks/use-menu'
import { categorySchema, type CategoryInput } from '@/lib/validations'
import type { Category } from '@/lib/types'

type Props = {
  isOpen: boolean
  onClose: () => void
  restaurantId: string
  editing?: Category | null
}

export function CategoryModal({ isOpen, onClose, restaurantId, editing }: Props) {
  const upsert = useUpsertCategory(restaurantId)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', is_active: true },
  })

  useEffect(() => {
    reset({
      name:        editing?.name        ?? '',
      description: editing?.description ?? '',
      is_active:   editing?.is_active   ?? true,
    })
  }, [editing, isOpen, reset])

  const onSubmit = async (data: CategoryInput) => {
    try {
      await upsert.mutateAsync({
        ...(editing ? { id: editing.id } : {}),
        name:        data.name,
        description: data.description ?? null,
        is_active:   editing?.is_active ?? true,
      })
      toast.success(editing ? 'Categoría actualizada' : 'Categoría creada')
      onClose()
    } catch {
      toast.error('Error al guardar la categoría')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Editar categoría' : 'Nueva categoría'} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre"
          placeholder="Ej. Hamburguesas"
          required
          error={errors.name?.message}
          {...register('name')}
        />
        <Textarea
          label="Descripción (opcional)"
          placeholder="Breve descripción de la categoría"
          rows={2}
          error={errors.description?.message}
          {...register('description')}
        />
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" loading={isSubmitting}>
            {editing ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
