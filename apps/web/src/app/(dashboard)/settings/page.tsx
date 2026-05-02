'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { useRestaurant, useUpdateRestaurant } from '@/hooks/use-restaurant'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/skeleton'
import { restaurantSettingsSchema, type RestaurantSettingsInput } from '@/lib/validations'

export default function SettingsPage() {
  const { data: restaurant, isLoading } = useRestaurant()
  const update = useUpdateRestaurant()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<RestaurantSettingsInput>({
    resolver: zodResolver(restaurantSettingsSchema),
  })

  useEffect(() => {
    if (restaurant) {
      reset({
        name:             restaurant.name,
        description:      restaurant.description ?? '',
        address:          restaurant.address ?? '',
        min_order_amount: restaurant.min_order_amount,
        preparation_time: null,
      })
    }
  }, [restaurant, reset])

  const onSubmit = async (data: RestaurantSettingsInput) => {
    if (!restaurant) return
    try {
      await update.mutateAsync({
        id:               restaurant.id,
        name:             data.name,
        description:      data.description || null,
        address:          data.address     || null,
        min_order_amount: data.min_order_amount,
      })
      toast.success('Configuración guardada')
      reset(data)
    } catch {
      toast.error('Error al guardar la configuración')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl space-y-4">
        <Skeleton className="h-10 w-48" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Settings size={16} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Configuración</h1>
          <p className="text-sm text-muted-foreground">Información de tu restaurante</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* General info */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Información general</h2>

          <Input
            label="Nombre del restaurante"
            placeholder="Mi Restaurante"
            required
            error={errors.name?.message}
            {...register('name')}
          />

          <Textarea
            label="Descripción"
            placeholder="Una breve descripción de tu restaurante…"
            rows={3}
            error={errors.description?.message}
            {...register('description')}
          />

          <Input
            label="Dirección"
            placeholder="Calle, número, colonia…"
            error={errors.address?.message}
            {...register('address')}
          />
        </section>

        {/* Orders */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Pedidos</h2>

          <Input
            label="Pedido mínimo (USD)"
            type="number"
            min="0"
            step="0.50"
            placeholder="0.00"
            required
            hint="Monto mínimo para aceptar un pedido"
            error={errors.min_order_amount?.message}
            {...register('min_order_amount')}
          />
        </section>

        <div className="flex justify-end">
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!isDirty || isSubmitting}
            leftIcon={<Save size={14} />}
          >
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  )
}
