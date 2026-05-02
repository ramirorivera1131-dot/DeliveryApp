import { useState, useMemo } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme, PRIMARY, SUCCESS } from '@/lib/theme'
import { useDriver } from '@/hooks/use-driver'
import { useDeliveryHistory } from '@/hooks/use-orders'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

type Period = 'today' | 'week' | 'month' | 'all'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Hoy'       },
  { key: 'week',  label: 'Semana'    },
  { key: 'month', label: 'Este mes'  },
  { key: 'all',   label: 'Todo'      },
]

function SimpleBarChart({
  data, color, height = 80,
}: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data, 0.01)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 3 }}>
      {data.map((val, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height:          Math.max((val / max) * height, val > 0 ? 4 : 2),
            backgroundColor: val > 0 ? color : 'rgba(0,0,0,0.08)',
            borderRadius:    3,
            opacity:         val > 0 ? 1 : 0.4,
          }}
        />
      ))}
    </View>
  )
}

export default function HistoryScreen() {
  const t = useTheme()
  const [period, setPeriod] = useState<Period>('month')

  const { data: driver, isLoading: loadingDriver } = useDriver()
  const {
    data:       deliveries = [],
    isLoading:  loadingDeliveries,
    refetch,
  } = useDeliveryHistory(driver?.id, period)

  const rate    = driver?.earnings_rate ?? 0.85
  const loading = loadingDriver || loadingDeliveries

  const stats = useMemo(() => {
    const earned  = deliveries.reduce((s, d) => s + d.delivery_fee * rate, 0)
    const total   = deliveries.length
    const avg     = total > 0 ? earned / total : 0
    return { earned, total, avg }
  }, [deliveries, rate])

  // Build 30-day chart data
  const chartData = useMemo(() => {
    const days = 30
    const map  = new Map<string, number>()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      map.set(d.toDateString(), 0)
    }
    for (const d of deliveries) {
      const key = new Date(d.delivered_at ?? d.created_at).toDateString()
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + d.delivery_fee * rate)
    }
    return Array.from(map.values())
  }, [deliveries, rate])

  const periodLabel = {
    today: 'hoy',
    week:  'esta semana',
    month: 'este mes',
    all:   'en total',
  }[period]

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.background }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: t.headerBg, borderBottomColor: t.border }]}>
        <Text style={[s.headerTitle, { color: t.text }]}>Mis ganancias</Text>
        <Text style={[s.headerSub, { color: t.textSecondary }]}>
          {Math.round(rate * 100)}% del costo de envío por carrera
        </Text>
      </View>

      {/* Period tabs */}
      <View style={[s.periodBar, { backgroundColor: t.card, borderBottomColor: t.border }]}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            onPress={() => setPeriod(p.key)}
            style={[s.periodBtn, period === p.key && { borderBottomColor: PRIMARY }]}
          >
            <Text style={[s.periodText, { color: period === p.key ? PRIMARY : t.textSecondary }]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={loading ? [] : deliveries}
        keyExtractor={d => d.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.list, { paddingBottom: 32 }]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor={PRIMARY} colors={[PRIMARY]} />
        }
        ListHeaderComponent={() => (
          <View style={{ gap: 14 }}>
            {/* Big earnings card */}
            <View style={[s.earningsCard, { backgroundColor: PRIMARY }]}>
              <Text style={s.earningsLabel}>Ganado {periodLabel}</Text>
              {loading
                ? <Skeleton width="60%" height={44} borderRadius={8} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                : <Text style={s.earningsValue}>{formatCurrency(stats.earned)}</Text>
              }
              <View style={s.earningsRow}>
                <View style={s.earningsStat}>
                  <Text style={s.earningsStatValue}>{stats.total}</Text>
                  <Text style={s.earningsStatLabel}>Carreras</Text>
                </View>
                <View style={[s.earningsDivider]} />
                <View style={s.earningsStat}>
                  <Text style={s.earningsStatValue}>{formatCurrency(stats.avg)}</Text>
                  <Text style={s.earningsStatLabel}>Promedio</Text>
                </View>
              </View>
            </View>

            {/* 30-day chart */}
            {period === 'month' || period === 'all' ? (
              <View style={[s.chartCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
                <View style={s.chartHeader}>
                  <Ionicons name="bar-chart-outline" size={16} color={PRIMARY} />
                  <Text style={[s.chartTitle, { color: t.text }]}>Ganancias últimos 30 días</Text>
                </View>
                {loading
                  ? <Skeleton height={80} />
                  : <SimpleBarChart data={chartData} color={PRIMARY} height={80} />
                }
                <View style={[s.chartFooter, { borderTopColor: t.divider }]}>
                  <Text style={[s.chartNote, { color: t.textTertiary }]}>Cada barra = 1 día</Text>
                  <Text style={[s.chartMax, { color: PRIMARY }]}>
                    Máx. {formatCurrency(Math.max(...chartData, 0))}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Section header */}
            {!loading && deliveries.length > 0 && (
              <Text style={[s.sectionTitle, { color: t.textSecondary }]}>
                {deliveries.length} entrega{deliveries.length !== 1 ? 's' : ''}
              </Text>
            )}

            {/* Skeleton */}
            {loading && (
              <View style={{ gap: 10 }}>
                {[0, 1, 2, 4].map(i => (
                  <View key={i} style={[s.skRow, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
                    <Skeleton width={36} height={36} borderRadius={10} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <Skeleton height={13} width="55%" />
                      <Skeleton height={11} width="70%" />
                    </View>
                    <Skeleton width={60} height={18} />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <View style={[s.emptyIcon, { backgroundColor: t.surface }]}>
                <Ionicons name="receipt-outline" size={36} color={t.textTertiary} />
              </View>
              <Text style={[s.emptyTitle, { color: t.text }]}>Sin entregas {periodLabel}</Text>
              <Text style={[s.emptySub, { color: t.textSecondary }]}>
                Tus entregas completadas aparecerán aquí
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const earned   = item.delivery_fee * rate
          const dateStr  = formatDate(item.delivered_at ?? item.created_at)

          return (
            <View style={[s.deliveryCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
              <View style={[s.deliveryIcon, { backgroundColor: t.primaryLight }]}>
                <Ionicons name="bicycle" size={16} color={PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.deliveryRest, { color: t.text }]}>{item.restaurants?.name ?? '—'}</Text>
                <Text style={[s.deliveryAddr, { color: t.textSecondary }]} numberOfLines={1}>
                  {item.delivery_address}
                </Text>
                <Text style={[s.deliveryTime, { color: t.textTertiary }]}>{dateStr}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.deliveryEarned, { color: t.success }]}>{formatCurrency(earned)}</Text>
                <Text style={[s.deliveryFee, { color: t.textTertiary }]}>de {formatCurrency(item.delivery_fee)}</Text>
              </View>
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, marginTop: 3 },
  periodBar: {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  periodBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  periodText: { fontSize: 13, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  earningsCard: {
    borderRadius: 20, padding: 22,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 6,
  },
  earningsLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 6 },
  earningsValue: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: -1, marginBottom: 16 },
  earningsRow:   { flexDirection: 'row', gap: 16 },
  earningsStat:  { flex: 1, alignItems: 'center' },
  earningsStatValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  earningsStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  earningsDivider:   { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', height: '100%' },
  chartCard: {
    borderRadius: 18, padding: 16, borderWidth: 1,
  },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  chartTitle:  { fontSize: 13, fontWeight: '700' },
  chartFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1,
  },
  chartNote: { fontSize: 11 },
  chartMax:  { fontSize: 11, fontWeight: '700' },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  skRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 12, borderWidth: 1,
  },
  empty:      { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyIcon:  { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub:   { fontSize: 13, textAlign: 'center' },
  deliveryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 13, borderWidth: 1,
  },
  deliveryIcon:   { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  deliveryRest:   { fontSize: 14, fontWeight: '700' },
  deliveryAddr:   { fontSize: 12, marginTop: 1 },
  deliveryTime:   { fontSize: 11, marginTop: 3 },
  deliveryEarned: { fontSize: 16, fontWeight: '800' },
  deliveryFee:    { fontSize: 11, marginTop: 2 },
})
