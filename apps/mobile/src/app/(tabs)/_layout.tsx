import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

type IName = React.ComponentProps<typeof Ionicons>['name']
const icon = (on: IName, off: IName) =>
  ({ color, focused }: { color: string; focused: boolean }) =>
    <Ionicons name={focused ? on : off} size={23} color={color} />

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          backgroundColor: '#fff',
          paddingBottom: 8,
          paddingTop: 4,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Disponibles', tabBarIcon: icon('list', 'list-outline') }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'Historial', tabBarIcon: icon('time', 'time-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarIcon: icon('person', 'person-outline') }}
      />
    </Tabs>
  )
}
