import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Switch, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'

type Driver = {
  id: string
  full_name: string
  phone: string
  vehicle_type: 'bicycle' | 'motorcycle' | 'car'
  status: 'available' | 'busy' | 'offline'
  earnings_rate: number
}

const VEHICLE: Record<string, { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  bicycle:    { label: 'Bicicleta',   icon: 'bicycle-outline' },
  motorcycle: { label: 'Motocicleta', icon: 'bicycle-outline' },
  car:        { label: 'Automóvil',   icon: 'car-outline'     },
}

export default function ProfileScreen() {
  const [driver,   setDriver]   = useState<Driver | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('drivers')
        .select('id, full_name, phone, vehicle_type, status, earnings_rate')
        .eq('user_id', user.id)
        .maybeSingle()
      setDriver(data as Driver | null)
      setLoading(false)
    }
    init()
  }, [])

  const toggleAvailability = async () => {
    if (!driver) return
    const next = driver.status === 'available' ? 'offline' : 'available'
    setToggling(true)
    const { error } = await supabase.from('drivers').update({ status: next }).eq('id', driver.id)
    if (!error) setDriver(d => d ? { ...d, status: next } : d)
    setToggling(false)
  }

  const handleLogout = () =>
    Alert.alert('Cerrar sesión', '¿Deseas salir de la aplicación?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ])

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#f97316" /></View>

  if (!driver) {
    return (
      <View style={s.center}>
        <Ionicons name="person-circle-outline" size={64} color="#d1d5db" />
        <Text style={s.noProfileTitle}>Sin perfil de repartidor</Text>
        <Text style={s.noProfileSub}>Contacta al administrador para activar tu cuenta de repartidor.</Text>
        <TouchableOpacity style={s.logoutSmall} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={16} color="#ef4444" />
          <Text style={s.logoutSmallText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const isAvailable = driver.status === 'available'
  const vehicle = VEHICLE[driver.vehicle_type] ?? { label: driver.vehicle_type, icon: 'car-outline' }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{driver.full_name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={s.name}>{driver.full_name}</Text>
        <Text style={s.phone}>{driver.phone}</Text>
      </View>

      <View style={s.body}>
        {/* Availability */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <View style={[s.cardIcon, isAvailable ? s.iconGreen : s.iconGray]}>
              <Ionicons name="radio-outline" size={19} color={isAvailable ? '#22c55e' : '#9ca3af'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Disponibilidad</Text>
              <Text style={s.cardSub}>
                {isAvailable ? 'Activo — recibiendo pedidos' : 'Inactivo — no recibirás pedidos'}
              </Text>
            </View>
            {toggling
              ? <ActivityIndicator color="#f97316" size="small" />
              : <Switch
                  value={isAvailable}
                  onValueChange={toggleAvailability}
                  trackColor={{ false: '#e5e7eb', true: '#bbf7d0' }}
                  thumbColor={isAvailable ? '#22c55e' : '#d1d5db'}
                  ios_backgroundColor="#e5e7eb"
                />
            }
          </View>
        </View>

        {/* Vehicle */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <View style={[s.cardIcon, s.iconOrange]}>
              <Ionicons name={vehicle.icon} size={19} color="#f97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Vehículo</Text>
              <Text style={s.cardSub}>{vehicle.label}</Text>
            </View>
          </View>
        </View>

        {/* Commission */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <View style={[s.cardIcon, s.iconGreen]}>
              <Ionicons name="cash-outline" size={19} color="#22c55e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Tu comisión</Text>
              <Text style={s.cardSub}>Recibes el {(driver.earnings_rate * 100).toFixed(0)}% del costo de envío</Text>
            </View>
            <Text style={s.rateValue}>{(driver.earnings_rate * 100).toFixed(0)}%</Text>
          </View>
        </View>

        {/* App info */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <View style={[s.cardIcon, { backgroundColor: '#f1f5f9' }]}>
              <Ionicons name="information-circle-outline" size={19} color="#64748b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Delivery App</Text>
              <Text style={s.cardSub}>Versión 1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={s.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll:    { flexGrow: 1 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 10 },
  noProfileTitle: { fontSize: 17, fontWeight: '600', color: '#374151' },
  noProfileSub:   { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  logoutSmall:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, padding: 8 },
  logoutSmallText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
  header: {
    backgroundColor: '#f97316',
    paddingTop: 56, paddingBottom: 36,
    alignItems: 'center',
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  name:  { fontSize: 20, fontWeight: '700', color: '#fff' },
  phone: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  body:  { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  iconGreen:  { backgroundColor: '#f0fdf4' },
  iconGray:   { backgroundColor: '#f3f4f6' },
  iconOrange: { backgroundColor: '#fff7ed' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cardSub:   { fontSize: 12, color: '#6b7280', marginTop: 2 },
  rateValue: { fontSize: 20, fontWeight: '800', color: '#16a34a' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16,
    borderWidth: 1.5, borderColor: '#fee2e2', marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
})
