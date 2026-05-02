import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'

type ToastType = 'success' | 'error' | 'info'

type ToastContextType = {
  show: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({ show: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('')
  const [type, setType] = useState<ToastType>('success')
  const opacity = useRef(new Animated.Value(0)).current
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const show = useCallback((msg: string, t: ToastType = 'success') => {
    clearTimeout(timerRef.current)
    setMessage(msg)
    setType(t)
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start()
    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start()
    }, 2500)
  }, [opacity])

  const bg = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#374151'

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Animated.View style={[s.toast, { backgroundColor: bg, opacity }]} pointerEvents="none">
        <Text style={s.text}>{message}</Text>
      </Animated.View>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

const s = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: 100, left: 24, right: 24,
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18,
    zIndex: 9999,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
  },
  text: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
})
