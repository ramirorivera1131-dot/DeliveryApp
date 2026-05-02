import { View, Text, StyleSheet } from 'react-native'

export default function OrdersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis pedidos</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9fafb' },
  title: { fontSize: 22, fontWeight: '600', color: '#111827' },
})
