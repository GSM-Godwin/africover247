import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'

const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, 'Enter a valid Nigerian phone number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[A-Z])(?=.*\d).+$/, 'Must contain uppercase letter and number'),
})

type FormData = z.infer<typeof schema>

interface RegisterScreenProps {
  navigation: any
}

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/register', data)
      navigation.navigate('VerifyEmail', { email: data.email })
    } catch (err: any) {
      const status = err.response?.status
      if (status === 409) setError('An account with this email already exists.')
      else setError('Something went wrong. Please try again.')
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Step 1 of 2 — takes about a minute.
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: '50%' }]} />
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="First name"
                      placeholder="First name"
                      onChangeText={onChange}
                      value={value}
                      error={errors.firstName?.message}
                    />
                  )}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Last name"
                      placeholder="Last name"
                      onChangeText={onChange}
                      value={value}
                      error={errors.lastName?.message}
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Phone (+234)"
                  placeholder="08012345678"
                  keyboardType="phone-pad"
                  onChangeText={onChange}
                  value={value}
                  error={errors.phone?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  placeholder="Create a strong password"
                  secureTextEntry
                  showPasswordToggle
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            <Button
              title="Continue"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={{ marginTop: 8 }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  back: { paddingTop: 16, marginBottom: 8 },
  backText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  header: { paddingBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: Colors.textSecondary },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  form: {},
  nameRow: { flexDirection: 'row' },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: Colors.error, fontSize: 13, fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  footerText: { fontSize: 14, color: Colors.textSecondary },
  footerLink: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
})
