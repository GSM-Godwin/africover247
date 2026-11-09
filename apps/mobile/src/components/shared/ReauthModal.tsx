import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Button, Input, OtpInput } from '../ui'
import { Colors } from '../../constants'
import api from '../../services/api'

interface ReauthModalProps {
  visible: boolean
  onSuccess: (stepUpToken?: string) => void
  onCancel: () => void
  reason?: string
  paymentContext?: { applicationId: string; paymentPlan?: 'monthly' | 'annual' }
}

type ReauthMode = 'loading' | 'password' | 'code'

function serverMessage(err: any, fallback: string): string {
  const message = err?.response?.data?.message
  if (Array.isArray(message)) return String(message[0] ?? fallback)
  return typeof message === 'string' && message ? message : fallback
}

export function ReauthModal({
  visible,
  onSuccess,
  onCancel,
  reason,
  paymentContext,
}: ReauthModalProps) {
  const paymentContextRef = useRef(paymentContext)
  paymentContextRef.current = paymentContext
  const [mode, setMode] = useState<ReauthMode>('loading')
  const [isSocialAccount, setIsSocialAccount] = useState(false)
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendCode = useCallback(async () => {
    setSending(true)
    setError('')
    try {
      const res = await api.post('/auth/step-up/email/send', paymentContextRef.current ?? {})
      setCodeSent(true)
      setSentTo(res.data?.maskedEmail || '')
      setResendIn(res.data?.resendAvailableInSeconds || 60)
    } catch (err: any) {
      setError(serverMessage(err, 'We could not send a code. Please try again.'))
    } finally {
      setSending(false)
    }
  }, [])

  useEffect(() => {
    if (!visible) {
      setMode('loading')
      setPassword('')
      setCode('')
      setCodeSent(false)
      setSentTo('')
      setResendIn(0)
      setError('')
      return
    }
    let cancelled = false
    api.get('/auth/me')
      .then((res) => {
        if (cancelled) return
        const social = Boolean(res.data?.googleId || res.data?.appleId)
        setIsSocialAccount(social)
        setMode(social ? 'code' : 'password')
        if (social) void sendCode()
      })
      .catch(() => {
        if (!cancelled) setMode('password')
      })
    return () => {
      cancelled = true
    }
  }, [visible, sendCode])

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  async function handleVerifyPassword() {
    if (!password.trim()) {
      setError('Please enter your password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/verify-password', { password })
      setPassword('')
      setLoading(false)
      onSuccess(res.data?.stepUpToken)
    } catch {
      setError('Incorrect password. Please try again.')
      setLoading(false)
    }
  }

  async function handleVerifyCode() {
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/step-up/email/verify', { code })
      setCode('')
      setLoading(false)
      onSuccess(res.data?.stepUpToken)
    } catch (err: any) {
      setError(serverMessage(err, 'We could not verify that code. Please try again.'))
      setCode('')
      setLoading(false)
    }
  }

  function switchMode(next: 'password' | 'code') {
    setError('')
    setMode(next)
    if (next === 'code' && !codeSent && !sending) void sendCode()
  }

  const description =
    mode === 'code'
      ? codeSent
        ? `We sent a code to your email${sentTo ? ` (${sentTo})` : ''}. Enter it below to continue.`
        : sending
          ? 'Sending a code to your email...'
          : "We will send a code to your email to confirm it's you."
      : reason || 'Please enter your password to continue with this action.'

  const resendLabel = sending
    ? 'Sending...'
    : resendIn > 0
      ? `Resend code in ${resendIn}s`
      : codeSent
        ? 'Resend code'
        : 'Send code'

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={mode === 'code' ? 'mail-outline' : 'lock-closed-outline'}
              size={24}
              color={Colors.textDark}
            />
          </View>
          <Text style={styles.title}>Confirm your identity</Text>
          <Text style={styles.message}>{description}</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {mode === 'loading' && (
            <ActivityIndicator color={Colors.primary} style={styles.spinner} />
          )}

          {mode === 'password' && (
            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              showPasswordToggle
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleVerifyPassword}
            />
          )}

          {mode === 'code' && (
            <View style={styles.codeBlock}>
              <OtpInput value={code} onChange={setCode} error={!!error} />
              <TouchableOpacity
                onPress={() => void sendCode()}
                disabled={sending || resendIn > 0}
                style={styles.linkButton}
              >
                <Text
                  style={[
                    styles.linkText,
                    (sending || resendIn > 0) && styles.linkTextDisabled,
                  ]}
                >
                  {resendLabel}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {isSocialAccount && mode !== 'loading' && (
            <TouchableOpacity
              onPress={() => switchMode(mode === 'code' ? 'password' : 'code')}
              style={styles.linkButton}
            >
              <Text style={styles.switchText}>
                {mode === 'code' ? 'Use password instead' : 'Email me a code instead'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={onCancel}
              fullWidth={false}
              style={styles.actionButton}
            />
            <Button
              title={loading ? 'Verifying...' : 'Confirm'}
              onPress={mode === 'code' ? handleVerifyCode : handleVerifyPassword}
              loading={loading}
              disabled={mode === 'loading'}
              fullWidth={false}
              style={styles.actionButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    padding: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: Colors.error, fontSize: 13, fontWeight: '500' },
  spinner: { marginVertical: 16 },
  codeBlock: { marginBottom: 8 },
  linkButton: { alignSelf: 'center', paddingVertical: 10 },
  linkText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  linkTextDisabled: { color: Colors.textSecondary },
  switchText: { fontSize: 13, color: Colors.textSecondary, textDecorationLine: 'underline' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionButton: { flex: 1 },
})
