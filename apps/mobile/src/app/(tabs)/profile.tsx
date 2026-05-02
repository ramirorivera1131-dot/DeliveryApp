import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { supabase } from '@/lib/supabase'
import { useTheme, PRIMARY, SUCCESS } from '@/lib/theme'
import { useDriver, useUpdateDriverStatus } from '@/hooks/use-driver'
import { Skeleton } from '@/components/ui/Skeleton'
import type { VehicleType } from '@/lib/types'

const VEHICLE_LABEL: Record<VehicleType, { label: string; icon: string }> = {
  bicycle:    { label: 'Bicicleta',   icon: 'bicycle-outline'    },
  motorcycle: { label: 'Motocicleta', icon: 'bicycle-outline'    },
  car:        { label: 'Automóvil',   icon: 'car-outline'        },
}

function InfoRow({ icon, label, value, t }: {
  icon: string; label: string; value: string;
  t: ReturnType<typeof useTheme>
}) {
  return (
    <View style={[s.infoRow, { borderBottomColor: t.divider }]}>
      <Ionicons name={icon as never} size={16} color={t.textTertiary} style={s.infoIcon} />
      <View style={{ flex: 1 }}>
        <Text style={[s.infoLabel, { color: t.textTertiary }]}>{label}</Text>
        <Text style={[s.infoValue, { color: t.text }]}>{value}</Text>
      </View>
    </View>
  )
}

function MenuRow({ icon, label, onPress, danger, t }: {
  icon: string; label: string; onPress: () => void; danger?: boolean;
  t: ReturnType<typeof useTheme>
}) {
  const color = danger ? t.error : t.text
  return (
    <TouchableOpacity style={[s.menuRow, { borderBottomColor: t.divider }]} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as never} size={18} color={color} />
      <Text style={[s.menuLabel, { color }]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={16} color={t.textTertiary} />}
    </TouchableOpacity>
  )
}

export default function ProfileScreen() {
  const t = useTheme()
  const { data: driver, isLoading } = useDriver()
  const updateStatus = useUpdateDriverStatus()

  const isAvailable = driver?.status === 'available'
  const vehicle     = driver ? (VEHICLE_LABEL[driver.vehicle_type] ?? { label: driver.vehicle_type, icon: 'car-outline' }) : null

  const handleToggle = async () => {
    if (!driver) return
    const next = isAvailable ? 'offline' : 'available'
    await updateStatus.mutateAsync({ driverId: driver.id, status: next })
    Toast.show({
      type:  'success',
      text1: next === 'available' ? 'Estás disponible' : 'Ahora estás inactivo',
      position: 'bottom',
    })
  }

  const handleLogout = () =>
    Alert.alert('Cerrar sesión', '¿Deseas salir de la aplicación?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ])

  if (isLoading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.background }]} edges={['top']}>
        <View style={[s.headerBg, { backgroundColor: PRIMARY }]}>
          <View style={[s.avatarWrap, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Skeleton width={72} height={72} borderRadius={36} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
          </View>
        </View>
        <View style={{ padding: 16, gap: 10 }}>
          {[0,1,2,3].map(i => <Skeleton key={i} height={56} borderRadius={14} />)}
        </View>
      </SafeAreaView>
    )
  }

  if (!driver) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.background }]} edges={['top']}>
        <View style={[s.noDriver, { backgroundColor: t.background }]}>
          <Ionicons name="person-circle-outline" size={70} color={t.textTertiary} />
          <Text style={[s.noDriverTitle, { color: t.text }]}>Sin perfil de repartidor</Text>
          <Text style={[s.noDriverSub, { color: t.textSecondary }]}>
            Contacta al administrador para activar tu cuenta de repartidor.
          </Text>
          <TouchableOpacity style={s.logoutSmall} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={16} color={t.error} />
            <Text style={[s.logoutSmallText, { color: t.error }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const initials = driver.full_name.charAt(0).toUpperCase()

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[s.headerBg, { backgroundColor: PRIMARY }]}>
          <View style={[s.avatarWrap, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.driverName}>{driver.full_name}</Text>
          {driver.phone && <Text style={s.driverPhone}>{driver.phone}</Text>}
          <View style={[s.ratingBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="star" size={13} color="#fbbf24" />
            <Text style={s.ratingText}>
              {driver.rating_average?.toFixed(1) ?? '—'} · {driver.total_deliveries} carreras
            </Text>
          </View>
        </View>

        <View style={{ padding: 16, gap: 12 }}>
          {/* Availability */}
          <View style={[s.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <View style={s.availRow}>
              <View style={[s.cardIconWrap, {
                backgroundColor: isAvailable ? t.successLight : t.surface,
              }]}>
                <Ionicons name="radio-outline" size={19} color={isAvailable ? SUCCESS : t.textTertiary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { color: t.text }]}>Disponibilidad</Text>
                <Text style={[s.cardSub, { color: t.textSecondary }]}>
                  {isAvailable ? 'Activo — recibiendo pedidos' : 'Inactivo — pausado'}
                </Text>
              </View>
              {updateStatus.isPending
                ? null
                : (
                  <Switch
                    value={isAvailable}
                    onValueChange={handleToggle}
                    trackColor={{ false: t.border, true: '#bbf7d0' }}
                    thumbColor={isAvailable ? SUCCESS : '#d1d5db'}
                    ios_backgroundColor={t.border}
                  />
                )
              }
            </View>
          </View>

          {/* Personal info */}
          <View style={[s.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <Text style={[s.sectionTitle, { color: t.textTertiary }]}>Información personal</Text>
            <InfoRow icon="person-outline"  label="Nombre"  value={driver.full_name}       t={t} />
            <InfoRow icon="call-outline"    label="Teléfono" value={driver.phone ?? '—'}   t={t} />
          </View>

          {/* Vehicle */}
          {vehicle && (
            <View style={[s.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
              <Text style={[s.sectionTitle, { color: t.textTertiary }]}>Vehículo</Text>
              <InfoRow icon={vehicle.icon}  label="Tipo"   value={vehicle.label}                          t={t} />
              {driver.vehicle_brand && (
                <InfoRow icon="car-outline" label="Marca"  value={driver.vehicle_brand}                   t={t} />
              )}
              {driver.vehicle_model && (
                <InfoRow icon="car-outline" label="Modelo" value={driver.vehicle_model}                   t={t} />
              )}
              {driver.vehicle_color && (
                <InfoRow icon="color-palette-outline" label="Color" value={driver.vehicle_color}          t={t} />
              )}
              {driver.vehicle_plate && (
                <InfoRow icon="id-card-outline" label="Placa" value={driver.vehicle_plate}                t={t} />
              )}
            </View>
          )}

          {/* Earnings info */}
          <View style={[s.commCard, { backgroundColor: t.successLight }]}>
            <Ionicons name="cash-outline" size={20} color={SUCCESS} />
            <View style={{ flex: 1 }}>
              <Text style={[s.commTitle, { color: t.success }]}>Tu comisión</Text>
              <Text style={[s.commSub, { color: '#166534' }]}>
                Recibes el {Math.round(driver.earnings_rate * 100)}% del costo de envío por cada entrega
              </Text>
            </View>
            <Text style={[s.commRate, { color: t.success }]}>{Math.round(driver.earnings_rate * 100)}%</Text>
          </View>

          {/* Menu */}
          <View style={[s.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <Text style={[s.sectionTitle, { color: t.textTertiary }]}>Configuración</Text>
            <MenuRow icon="notifications-outline" label="Notificaciones"  onPress={() => {}} t={t} />
            <MenuRow icon="shield-checkmark-outline" label="Documentos"   onPress={() => {}} t={t} />
            <MenuRow icon="help-circle-outline"   label="Soporte"         onPress={() => {}} t={t} />
            <MenuRow icon="document-text-outline" label="Términos de uso" onPress={() => {}} t={t} />
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={[s.logoutBtn, { backgroundColor: t.card, borderColor: t.errorLight }]}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={18} color={t.error} />
            <Text style={[s.logoutText, { color: t.error }]}>Cerrar sesión</Text>
          </TouchableOpacity>

          <Text style={[s.version, { color: t.textTertiary }]}>Delivery App v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1 },
  headerBg:{ alignItems: 'center', paddingTop: 24, paddingBottom: 28, gap: 6 },
  avatarWrap: {
    width: 84, height: 84, borderRadius: 42,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  avatarText:  { fontSize: 34, fontWeight: '800', color: '#fff' },
  driverName:  { fontSize: 22, fontWeight: '800', color: '#fff' },
  driverPhone: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 4,
  },
  ratingText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  noDriver: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, gap: 10,
  },
  noDriverTitle: { fontSize: 17, fontWeight: '700' },
  noDriverSub:   { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  logoutSmall:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, padding: 8 },
  logoutSmallText: { fontSize: 14, fontWeight: '600' },
  card: {
    borderRadius: 16, padding: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  availRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIconWrap:{ width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle:   { fontSize: 14, fontWeight: '700' },
  cardSub:     { fontSize: 12, marginTop: 2 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1,
  },
  infoIcon:  { width: 22 },
  infoLabel: { fontSize: 11 },
  infoValue: { fontSize: 14, fontWeight: '600', marginTop: 1 },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 13, borderBottomWidth: 1,
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  commCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 16,
  },
  commTitle: { fontSize: 14, fontWeight: '700' },
  commSub:   { fontSize: 12, lineHeight: 17, marginTop: 2 },
  commRate:  { fontSize: 28, fontWeight: '900' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 16, borderWidth: 1.5,
  },
  logoutText: { fontSize: 15, fontWeight: '700' },
  version:    { textAlign: 'center', fontSize: 12, paddingVertical: 4 },
})
