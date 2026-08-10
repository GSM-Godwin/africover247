import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants'
import api from '../../services/api'
import { setToken, setUser } from '../../services/auth'

type Step = 'phone' | 'otp'

interface PhoneLoginScreenProps {
  navigation: any
  onLoginSuccess: () => void
}

export function PhoneLoginScreen({ navigation, onLoginSuccess }: PhoneLoginScreenProps) {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOtp() {
    if (!phone.trim()) {
      setError('Please enter your phone number.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/phone/send-otp', { phone: phone.trim() })
      setLoading(false)
      setStep('otp')
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : (msg || 'Could not send OTP. Please try again.'))
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/phone/verify-otp', { phone: phone.trim(), otp })
      await setToken(res.data.accessToken)
      await setUser(res.data.user)
      setLoading(false)
      onLoginSuccess()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : (msg || 'Invalid or expired code.'))
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 'phone' ? 'Sign in with phone' : 'Enter your code'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'phone'
                ? "We'll send a verification code to your number."
                : `We sent a 6-digit code to ${phone}.`}
            </Text>
          </View>

          {error !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {step === 'phone' ? (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="08012345678"
                  placeholderTextColor={Colors.textSecondary + '80'}
                  keyboardType="phone-pad"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Ionicons name="phone-portrait-outline" size={18} color={Colors.textDark} />
                <Text style={styles.btnText}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  value={otp}
                  onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  placeholderTextColor={Colors.textSecondary + '80'}
                  keyboardType="numeric"
                  maxLength={6}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => { setStep('phone'); setOtp(''); setError('') }}
              >
                <Text style={styles.linkText}>← Change phone number</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkBtn}
                onPress={handleSendOtp}
                disabled={loading}
              >
                <Text style={[styles.linkText, { color: Colors.primary, fontWeight: '700' }]}>
                  Resend code
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.switchMethod}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.switchText}>
              Sign in with email instead
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { padding: 24, paddingTop: 16, flexGrow: 1 },
  back: { marginBottom: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  errorBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: Colors.error },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textDark, marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 16, fontWeight: '800', color: Colors.textDark },
  linkBtn: { alignItems: 'center', paddingVertical: 10 },
  linkText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  switchMethod: { alignItems: 'center', marginTop: 32 },
  switchText: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
})
