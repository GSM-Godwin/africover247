import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[A-Z])(?=.*\d).+$/, 'Must contain uppercase letter and number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export function ChangePasswordScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    try {
      await api.post('/users/me/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      })
      reset()
      Alert.alert('Success', 'Password changed successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not change password.'
      if (msg.toLowerCase().includes('current') || msg.toLowerCase().includes('incorrect')) {
        setError('Current password is incorrect.')
      } else {
        setError(msg)
      }
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

        {/* --- Header --- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Current Password"
                value={value}
                onChangeText={onChange}
                placeholder="Enter current password"
                secureTextEntry
                showPasswordToggle
                error={errors.currentPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="New Password"
                value={value}
                onChangeText={onChange}
                placeholder="Create new password"
                secureTextEntry
                showPasswordToggle
                error={errors.newPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Confirm New Password"
                value={value}
                onChangeText={onChange}
                placeholder="Repeat new password"
                secureTextEntry
                showPasswordToggle
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Password requirements:</Text>
            <Text style={styles.requirement}>• At least 8 characters</Text>
            <Text style={styles.requirement}>• At least one uppercase letter</Text>
            <Text style={styles.requirement}>• At least one number</Text>
          </View>

          <Button
            title="Update Password"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={{ marginTop: 8 }}
          />

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  scroll: { padding: 20 },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: Colors.error, fontSize: 13 },
  requirements: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  requirementsTitle: { fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  requirement: { fontSize: 12, color: Colors.textSecondary, marginBottom: 3 },
})
