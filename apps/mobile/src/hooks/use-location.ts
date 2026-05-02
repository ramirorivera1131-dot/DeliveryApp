import { useState, useEffect, useRef } from 'react'
import * as Location from 'expo-location'

export type Coords = { lat: number; lng: number }

export function useDriverLocation() {
  const [location,      setLocation]      = useState<Coords | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const watchRef = useRef<Location.LocationSubscription | null>(null)

  useEffect(() => {
    let mounted = true

    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (!mounted) return
      if (status !== 'granted') { setHasPermission(false); return }
      setHasPermission(true)

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      if (mounted) setLocation({ lat: current.coords.latitude, lng: current.coords.longitude })

      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 30, timeInterval: 10_000 },
        loc => { if (mounted) setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude }) }
      )
    }

    start()
    return () => {
      mounted = false
      watchRef.current?.remove()
    }
  }, [])

  return { location, hasPermission }
}
