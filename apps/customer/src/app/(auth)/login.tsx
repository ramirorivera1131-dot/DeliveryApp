import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'

export default function LoginScreen() {
  const router = useRouter()
  const { show } = useToast()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [show_pw,  setShowPw]   = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { show('Completa todos los campos', 'error'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) show(error.message, 'error')
  }

  const handleForgot = async () => {
    if (!email) { show('Ingresa tu correo primero', 'info'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    setLoading(false)
    if (error) show(error.message, 'error')
    else show('Revisa tu correo para restablecer la contraseña', 'success')
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo area */}
        <View style={s.hero}>
          <View style={s.logoCircle}>
            <Ionicons name="bicycle" size={40} color="#f97316" />
          </View>
          <Text style={s.appName}>Delivery</Text>
          <Text style={s.tagline}>Pide y recibe en minutos</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.title}>Iniciar sesión</Text>

          <View style={s.field}>
            <Text style={s.label}>Correo electrónico</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="tu@correo.com"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Contraseña</Text>
            <View style={s.pwRow}>
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!show_pw}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(v => !v)}>
                <Ionicons name={show_pw ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={handleForgot} style={s.forgotBtn}>
            <Text style={s.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Entrar</Text>}
          </TouchableOpacity>

          <View style={s.signupRow}>
            <Text style={s.signupHint}>¿No tienes cuenta?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={s.signupLink}>  Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  hero:   { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  appName:  { fontSize: 28, fontWeight: '800', color: '#111827' },
  tagline:  { fontSize: 14, color: '#6b7280', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827', backgroundColor: '#f9fafb',
  },
  pwRow:   { flexDirection: 'row', alignItems: 'center' },
  eyeBtn:  { padding: 10, marginLeft: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { fontSize: 13, color: '#f97316', fontWeight: '600' },
  btn: {
    backgroundColor: '#f97316', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#f97316', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  signupHint: { fontSize: 14, color: '#6b7280' },
  signupLink: { fontSize: 14, color: '#f97316', fontWeight: '700' },
})
