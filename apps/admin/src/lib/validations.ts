import { z } from 'zod'

export const loginSchema = z.object({
  email:    z.string().email('Correo inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const supportTicketSchema = z.object({
  requester_type:  z.enum(['customer', 'restaurant', 'driver', 'other']),
  requester_name:  z.string().min(1, 'Requerido'),
  requester_email: z.string().email('Correo inválido'),
  category:        z.enum(['order', 'payment', 'account', 'technical', 'other']),
  subject:         z.string().min(3, 'Mínimo 3 caracteres'),
  description:     z.string().min(10, 'Mínimo 10 caracteres'),
  priority:        z.enum(['low', 'medium', 'high', 'urgent']),
})
export type SupportTicketInput = z.infer<typeof supportTicketSchema>

export const suspendEntitySchema = z.object({
  reason: z.string().min(10, 'Por favor describe el motivo (mínimo 10 caracteres)'),
})
export type SuspendEntityInput = z.infer<typeof suspendEntitySchema>

export const adjustmentSchema = z.object({
  adjustment_type: z.enum(['refund', 'credit', 'bonus', 'penalty', 'fee_waiver', 'plan_change', 'commission_change']),
  amount:          z.number().min(0).optional(),
  reason:          z.string().min(10, 'Por favor describe el motivo'),
  notes:           z.string().optional(),
})
export type AdjustmentInput = z.infer<typeof adjustmentSchema>

export const promotionSchema = z.object({
  code:                z.string().min(3).toUpperCase(),
  name:                z.string().min(1, 'Requerido'),
  description:         z.string().optional(),
  type:                z.enum(['percentage', 'fixed', 'free_delivery']),
  value:               z.number().min(0),
  min_order_amount:    z.number().min(0).optional(),
  max_discount_amount: z.number().min(0).optional(),
  usage_limit:         z.number().int().min(1).optional(),
  per_user_limit:      z.number().int().min(1).default(1),
  valid_from:          z.string(),
  valid_until:         z.string().optional(),
  is_active:           z.boolean().default(true),
})
export type PromotionInput = z.infer<typeof promotionSchema>

export const deliveryTierSchema = z.object({
  min_distance_km: z.number().min(0),
  max_distance_km: z.number().nullable(),
  fee:             z.number().min(0),
})

export const planSchema = z.object({
  name:               z.string().min(1),
  price_per_branch:   z.number().min(0),
  max_branches:       z.number().int().nullable(),
  features:           z.array(z.string()),
  is_active:          z.boolean(),
})

export const ticketReplySchema = z.object({
  content:     z.string().min(1, 'El mensaje no puede estar vacío'),
  is_internal: z.boolean().default(false),
})
export type TicketReplyInput = z.infer<typeof ticketReplySchema>

export const adminUserSchema = z.object({
  email:     z.string().email(),
  full_name: z.string().min(1),
  role:      z.enum(['super_admin', 'ops_manager', 'support', 'accountant', 'viewer']),
})
export type AdminUserInput = z.infer<typeof adminUserSchema>
