import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'

export default function RegisterScreen() {
  const router = useRouter()
  const { show } = useToast()
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  const handleRegister = async () => {
    if (!name || !email || !password) { show('Completa todos los campos', 'error'); return }
    if (password.length < 8) { show('La contraseña debe tener al menos 8 caracteres', 'error'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim(), phone: phone.trim() },
      },
    })
    if (error) { show(error.message, 'error'); setLoading(false); return }

    if (data.user) {
      await supabase.from('customers').upsert({
        user_id: data.user.id,
        full_name: name.trim(),
        phone: phone.trim() || null,
      }, { onConflict: 'user_id' })
    }

    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <View style={s.doneWrap}>
        <Ionicons name="mail-outline" size={64} color="#f97316" />
        <Text style={s.doneTitle}>¡Revisa tu correo!</Text>
        <Text style={s.doneSub}>
          Te enviamos un enlace de verificación a {email}. Confirma tu cuenta para comenzar.
        </Text>
        <TouchableOpacity style={s.btn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={s.btnText}>Ir al login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>

        <Text style={s.title}>Crear cuenta</Text>
        <Text style={s.sub}>Pide tu comida favorita en minutos</Text>

        <View style={s.field}>
          <Text style={s.label}>Nombre completo</Text>
          <TextInput
            style={s.input} value={name} onChangeText={setName}
            placeholder="Tu nombre" placeholderTextColor="#9ca3af"
            autoCapitalize="words"
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>Correo electrónico</Text>
          <TextInput
            style={s.input} value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none"
            placeholder="tu@correo.com" placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>Teléfono (opcional)</Text>
          <TextInput
            style={s.input} value={phone} onChangeText={setPhone}
            keyboardType="phone-pad" placeholder="+52 55 1234 5678"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>Contraseña</Text>
          <TextInput
            style={s.input} value={password} onChangeText={setPassword}
            secureTextEntry placeholder="Mínimo 8 caracteres"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <TouchableOpacity
          style={[s.btn, loading && s.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Crear cuenta</Text>}
        </TouchableOpacity>

        <View style={s.loginRow}>
          <Text style={s.loginHint}>¿Ya tienes cuenta?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.loginLink}>  Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  title:  { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 6 },
  sub:    { fontSize: 14, color: '#6b7280', marginBottom: 28 },
  field:  { marginBottom: 16 },
  label:  { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827', backgroundColor: '#fff',
  },
  btn: {
    backgroundColor: '#f97316', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
    shadowColor: '#f97316', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginHint: { fontSize: 14, color: '#6b7280' },
  loginLink: { fontSize: 14, color: '#f97316', fontWeight: '700' },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 36 },
  doneTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 16, marginBottom: 8 },
  doneSub:   { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
})
