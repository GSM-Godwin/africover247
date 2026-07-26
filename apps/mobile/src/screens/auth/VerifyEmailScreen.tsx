import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, OtpInput } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'
import { setToken, setUser } from '../../services/auth'

interface VerifyEmailScreenProps {
  navigation: any
  route: { params: { email: string } }
  onLoginSuccess: () => void
}

export function VerifyEmailScreen({
  route,
  onLoginSuccess,
}: VerifyEmailScreenProps) {
  const { email } = route.params
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendSeconds, setResendSeconds] = useState(60)

  useEffect(() => {
    if (resendSeconds <= 0) return
    const timer = setTimeout(() => setResendSeconds((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendSeconds])

  async function handleVerify() {
    if (otp.length !== 6) { setError('Enter the full 6-digit code.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/verify-email', { email, otp })
      await setToken(res.data.accessToken)
      await setUser(res.data.user)
      onLoginSuccess()
    } catch {
      setError('Invalid or expired code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendSeconds > 0) return
    try {
      await api.post('/auth/forgot-password', { email })
      setResendSeconds(60)
    } catch {}
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📧</Text>
        </View>

        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        <View style={styles.otpContainer}>
          <OtpInput value={otp} onChange={setOtp} error={!!error} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title="Verify Email"
          onPress={handleVerify}
          loading={loading}
          style={{ marginTop: 8 }}
        />

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={resendSeconds > 0}
        >
          <Text style={[
            styles.resendText,
            resendSeconds > 0 && { color: Colors.textSecondary },
          ]}>
            {resendSeconds > 0
              ? `Resend code in ${resendSeconds}s`
              : "Didn't receive it? Resend"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: { fontSize: 36 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  email: { fontWeight: '700', color: Colors.text },
  otpContainer: { marginBottom: 16, alignSelf: 'stretch' },
  error: {
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  resendButton: { marginTop: 20 },
  resendText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
})
