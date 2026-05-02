import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type Customer = {
  full_name: string
  phone: string | null
}

export default function ProfileScreen() {
  const [session,  setSession]  = useState<Session | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession()
      setSession(s)
      if (s?.user) {
        const { data } = await supabase
          .from('customers')
          .select('full_name, phone')
          .eq('user_id', s.user.id)
          .maybeSingle()
        setCustomer(data as Customer | null)
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleLogout = () =>
    Alert.alert('Cerrar sesión', '¿Deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ])

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#f97316" /></View>

  const name  = customer?.full_name ?? session?.user?.email ?? 'Usuario'
  const email = session?.user?.email ?? ''
  const phone = customer?.phone

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={s.name}>{name}</Text>
        <Text style={s.email}>{email}</Text>
      </View>

      <View style={s.body}>
        {/* Contact info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Información de contacto</Text>
          <View style={s.row}>
            <Ionicons name="mail-outline" size={18} color="#9ca3af" />
            <Text style={s.rowText}>{email}</Text>
          </View>
          {phone && (
            <View style={s.row}>
              <Ionicons name="call-outline" size={18} color="#9ca3af" />
              <Text style={s.rowText}>{phone}</Text>
            </View>
          )}
        </View>

        {/* App info */}
        <View style={s.card}>
          <View style={s.row}>
            <Ionicons name="information-circle-outline" size={18} color="#9ca3af" />
            <View>
              <Text style={s.rowLabel}>Delivery App</Text>
              <Text style={s.rowSub}>Versión 1.0.0</Text>
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
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#f97316',
    paddingTop: 60, paddingBottom: 36,
    alignItems: 'center',
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  name:  { fontSize: 20, fontWeight: '700', color: '#fff' },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  body:  { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#374151' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText:  { fontSize: 14, color: '#374151' },
  rowLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  rowSub:   { fontSize: 12, color: '#6b7280', marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16,
    borderWidth: 1.5, borderColor: '#fee2e2', marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
})
