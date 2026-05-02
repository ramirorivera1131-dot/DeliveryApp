import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { supabase } from '@/lib/supabase'
import { useTheme, PRIMARY } from '@/lib/theme'

const schema = z.object({
  email:    z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type LoginInput = z.infer<typeof schema>

export default function LoginScreen() {
  const t          = useTheme()
  const [showPass, setShowPass]   = useState(false)
  const [loading,  setLoading]    = useState(false)
  const [resetting, setResetting] = useState(false)

  const { control, handleSubmit, getValues, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async ({ email, password }: LoginInput) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    setLoading(false)
    if (error) {
      Toast.show({ type: 'error', text1: 'Error al iniciar sesión', text2: 'Verifica tus credenciales', position: 'bottom' })
    }
  }

  const handleResetPassword = async () => {
    const email = getValues('email')
    if (!email) {
      Toast.show({ type: 'info', text1: 'Ingresa tu correo primero', position: 'bottom' })
      return
    }
    setResetting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setResetting(false)
    Toast.show({
      type:  error ? 'error' : 'success',
      text1: error ? 'Error' : 'Correo enviado',
      text2: error ? error.message : 'Revisa tu bandeja de entrada',
      position: 'bottom',
    })
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={s.hero}>
            <View style={s.logoWrap}>
              <Ionicons name="bicycle" size={36} color="#fff" />
            </View>
            <Text style={[s.appName, { color: t.text }]}>Delivery App</Text>
            <Text style={[s.tagline, { color: t.textSecondary }]}>Panel de repartidor</Text>
          </View>

          {/* Value props */}
          <View style={[s.valueProp, { backgroundColor: t.card }]}>
            {[
              { icon: 'cash-outline', color: t.success,  bg: t.successLight, title: 'Gana el 85% de cada envío',    sub: 'Recibe tu dinero directamente en tu cuenta' },
              { icon: 'time-outline', color: PRIMARY,     bg: t.primaryLight, title: 'Horario 100% flexible',         sub: 'Tú decides cuándo y cuánto trabajar'        },
              { icon: 'location-outline', color: t.info,  bg: t.infoLight,    title: 'Pedidos cerca de ti',           sub: 'Rutas optimizadas desde tu ubicación'       },
            ].map((item, i) => (
              <View key={i} style={s.valueRow}>
                <View style={[s.valueDot, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon as never} size={16} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.valueTitle, { color: t.text }]}>{item.title}</Text>
                  <Text style={[s.valueSub, { color: t.textSecondary }]}>{item.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Form */}
          <View style={[s.form, { backgroundColor: t.card }]}>
            <Text style={[s.formTitle, { color: t.text }]}>Iniciar sesión</Text>

            <View style={s.field}>
              <Text style={[s.label, { color: t.textSecondary }]}>Correo electrónico</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View style={[s.inputWrap, {
                    backgroundColor: t.inputBg,
                    borderColor: errors.email ? t.error : t.inputBorder,
                  }]}>
                    <Ionicons name="mail-outline" size={18} color={t.textTertiary} style={s.inputIcon} />
                    <TextInput
                      style={[s.input, { color: t.text }]}
                      placeholder="correo@ejemplo.com"
                      placeholderTextColor={t.placeholder}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  </View>
                )}
              />
              {errors.email && <Text style={[s.errorText, { color: t.error }]}>{errors.email.message}</Text>}
            </View>

            <View style={s.field}>
              <Text style={[s.label, { color: t.textSecondary }]}>Contraseña</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View style={[s.inputWrap, {
                    backgroundColor: t.inputBg,
                    borderColor: errors.password ? t.error : t.inputBorder,
                  }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={t.textTertiary} style={s.inputIcon} />
                    <TextInput
                      style={[s.input, { color: t.text }]}
                      placeholder="••••••••"
                      placeholderTextColor={t.placeholder}
                      secureTextEntry={!showPass}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                    <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eyeBtn}>
                      <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={t.textTertiary} />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && <Text style={[s.errorText, { color: t.error }]}>{errors.password.message}</Text>}
            </View>

            <TouchableOpacity style={s.forgotBtn} onPress={handleResetPassword} disabled={resetting}>
              <Text style={[s.forgotText, { color: PRIMARY }]}>
                {resetting ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.submitBtn, loading && s.submitDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={19} color="#fff" />
              <Text style={s.submitText}>{loading ? 'Ingresando...' : 'Ingresar'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[s.footer, { color: t.textTertiary }]}>
            ¿No tienes cuenta? Contacta a tu administrador
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:       { flex: 1 },
  scroll:     { flexGrow: 1, padding: 20, gap: 16 },
  hero:       { alignItems: 'center', paddingVertical: 24, gap: 8 },
  logoWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8, marginBottom: 4,
  },
  appName:  { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  tagline:  { fontSize: 14 },
  valueProp:{ borderRadius: 18, padding: 20, gap: 16 },
  valueRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  valueDot: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  valueTitle:{ fontSize: 14, fontWeight: '700' },
  valueSub:  { fontSize: 12, marginTop: 2, lineHeight: 17 },
  form:       { borderRadius: 18, padding: 20 },
  formTitle:  { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  field:      { gap: 6, marginBottom: 14 },
  label:      { fontSize: 13, fontWeight: '500' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, height: 50,
  },
  inputIcon:  { marginRight: 8 },
  input:      { flex: 1, fontSize: 15 },
  eyeBtn:     { padding: 4 },
  errorText:  { fontSize: 12, marginTop: 2 },
  forgotBtn:  { alignSelf: 'flex-end', paddingVertical: 4, marginBottom: 12 },
  forgotText: { fontSize: 13, fontWeight: '600' },
  submitBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, backgroundColor: PRIMARY, borderRadius: 13, paddingVertical: 16,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  submitDisabled: { opacity: 0.7 },
  submitText:     { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer:         { textAlign: 'center', fontSize: 12, paddingVertical: 8 },
})
