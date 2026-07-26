import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, OtpInput } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'

const schema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[A-Z])(?=.*\d).+$/, 'Must contain uppercase and number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

interface ResetPasswordScreenProps {
  navigation: any
  route: { params: { email: string } }
}

export function ResetPasswordScreen({ navigation, route }: ResetPasswordScreenProps) {
  const { email } = route.params
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [resendSeconds, setResendSeconds] = useState(60)

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (resendSeconds <= 0) return
    const timer = setTimeout(() => setResendSeconds((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendSeconds])

  async function onSubmit(data: FormData) {
    if (otp.length !== 6) { setOtpError('Enter the 6-digit code.'); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword: data.newPassword,
      })
      navigation.navigate('Login')
    } catch (err: any) {
      setOtpError(err.response?.data?.message || 'Reset failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>
            Enter the code sent to {email} and choose a new password.
          </Text>

          <Text style={styles.otpLabel}>Verification code</Text>
          <View style={styles.otpContainer}>
            <OtpInput value={otp} onChange={setOtp} error={!!otpError} />
          </View>
          {otpError ? <Text style={styles.error}>{otpError}</Text> : null}

          <View style={{ height: 24 }} />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="New password"
                placeholder="Create a new password"
                secureTextEntry
                showPasswordToggle
                onChangeText={onChange}
                value={value}
                error={errors.newPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Confirm password"
                placeholder="Repeat your new password"
                secureTextEntry
                showPasswordToggle
                onChangeText={onChange}
                value={value}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            title="Reset Password"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 28,
  },
  otpLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  otpContainer: { marginBottom: 8 },
  error: { color: Colors.error, fontSize: 13, marginBottom: 8, textAlign: 'center' },
})
