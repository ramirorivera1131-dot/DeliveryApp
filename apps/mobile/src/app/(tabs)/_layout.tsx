import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme, PRIMARY } from '@/lib/theme'

type IName = React.ComponentProps<typeof Ionicons>['name']

function TabIcon(on: IName, off: IName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? on : off} size={23} color={color} />
  )
}

export default function TabsLayout() {
  const t = useTheme()
  return (
    <Tabs
      screenOptions={{
        headerShown:            false,
        tabBarActiveTintColor:  PRIMARY,
        tabBarInactiveTintColor: t.tabInactive,
        tabBarStyle: {
          borderTopWidth:   1,
          borderTopColor:   t.border,
          backgroundColor:  t.tabBg,
          paddingBottom:    8,
          paddingTop:       4,
          height:           62,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Pedidos', tabBarIcon: TabIcon('bicycle', 'bicycle-outline') }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'Ganancias', tabBarIcon: TabIcon('stats-chart', 'stats-chart-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarIcon: TabIcon('person-circle', 'person-circle-outline') }}
      />
    </Tabs>
  )
}
