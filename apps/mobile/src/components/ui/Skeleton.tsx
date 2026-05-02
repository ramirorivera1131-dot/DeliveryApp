import { useEffect, useRef } from 'react'
import { Animated, View, StyleSheet, type ViewStyle } from 'react-native'
import { useTheme } from '@/lib/theme'

interface Props {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: Props) {
  const t   = useTheme()
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [anim])

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] })

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius, backgroundColor: t.skeleton, opacity },
        style,
      ]}
    />
  )
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const t = useTheme()
  return (
    <View style={[{ backgroundColor: t.card, borderRadius: 16, padding: 16, gap: 12 }, style]}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Skeleton width={40} height={40} borderRadius={10} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton height={14} width="60%" />
          <Skeleton height={12} width="40%" />
        </View>
      </View>
      <Skeleton height={12} />
      <Skeleton height={12} width="80%" />
      <Skeleton height={44} borderRadius={12} />
    </View>
  )
}
