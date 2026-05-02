import { z } from 'zod'

export const loginSchema = z.object({
  email:    z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export const productSchema = z.object({
  name:        z.string().min(1, 'Nombre requerido').max(120),
  description: z.string().max(500).optional().nullable(),
  price:       z.coerce.number().min(0.01, 'Precio debe ser mayor a 0'),
  category_id: z.string().nullable().optional(),
  is_available: z.boolean().default(true),
})

export const categorySchema = z.object({
  name:        z.string().min(1, 'Nombre requerido').max(80),
  description: z.string().max(300).optional().nullable(),
  is_active:   z.boolean().default(true),
})

export const restaurantSettingsSchema = z.object({
  name:              z.string().min(1, 'Nombre requerido').max(120),
  description:       z.string().max(500).optional().nullable(),
  address:           z.string().optional().nullable(),
  min_order_amount:  z.coerce.number().min(0),
  preparation_time:  z.coerce.number().min(1).optional().nullable(),
})

export type LoginInput             = z.infer<typeof loginSchema>
export type ProductInput           = z.infer<typeof productSchema>
export type CategoryInput          = z.infer<typeof categorySchema>
export type RestaurantSettingsInput = z.infer<typeof restaurantSettingsSchema>
