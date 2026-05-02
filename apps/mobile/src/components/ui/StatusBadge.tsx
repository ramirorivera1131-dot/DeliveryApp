import { View, Text, StyleSheet } from 'react-native'
import type { OrderStatus } from '@/lib/types'

type Config = { label: string; bg: string; text: string; next?: OrderStatus; nextLabel?: string }

export const ORDER_STATUS_CONFIG: Record<OrderStatus, Config> = {
  pending:    { label: 'Pendiente',         bg: '#fef9c3', text: '#854d0e' },
  confirmed:  { label: 'Confirmado',        bg: '#dbeafe', text: '#1e40af' },
  preparing:  { label: 'Preparando',        bg: '#ffedd5', text: '#9a3412' },
  ready:      { label: 'Listo para recoger',bg: '#e0f2fe', text: '#075985' },
  picked_up:  { label: 'Recogido',          bg: '#fef3c7', text: '#92400e', next: 'in_transit', nextLabel: 'Salir al cliente' },
  in_transit: { label: 'En camino',         bg: '#fff7ed', text: '#c2410c', next: 'delivered',  nextLabel: 'Confirmar entrega' },
  delivered:  { label: 'Entregado',         bg: '#dcfce7', text: '#15803d' },
  cancelled:  { label: 'Cancelado',         bg: '#fee2e2', text: '#dc2626' },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = ORDER_STATUS_CONFIG[status]
  return (
    <View style={[s.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[s.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  text: { fontSize: 12, fontWeight: '600' },
})
