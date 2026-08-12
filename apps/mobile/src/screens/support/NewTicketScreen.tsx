import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'
import { getUser } from '../../services/auth'

const CATEGORIES = [
  { value: 'claim_support', label: 'Claim Support' },
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'policy_query', label: 'Policy Query' },
  { value: 'product_enquiry', label: 'Product Enquiry' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'other', label: 'Other' },
]

export function NewTicketScreen({ navigation, route }: any) {
  const initialCategory = route?.params?.category || ''
  const [userLoaded, setUserLoaded] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: initialCategory,
    subject: '',
    message: '',
    referenceId: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ticketRef, setTicketRef] = useState('')

  useEffect(() => {
    getUser().then((user) => {
      if (user) {
        setForm((prev) => ({
          ...prev,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        }))
      }
      setUserLoaded(true)
    })
  }, [])

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.email.trim() || !form.category || !form.subject.trim() || !form.message.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/support/tickets', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        category: form.category,
        subject: form.subject.trim(),
        message: form.message.trim(),
        referenceId: form.referenceId.trim() || undefined,
      })
      setTicketRef(res.data.id.slice(0, 8).toUpperCase())
      setSubmitted(true)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      Alert.alert('Error', Array.isArray(msg) ? msg[0] : (msg || 'Could not submit request.'))
    } finally {
      setLoading(false)
    }
  }

  if (!userLoaded) return null

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Request Submitted</Text>
          <Text style={styles.successText}>Your support request has been received.</Text>
          <Text style={styles.ticketRef}>#{ticketRef}</Text>
          <Text style={styles.successSub}>We will respond within 24 hours.</Text>
          <Button title="Back to Help" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit a Request</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(v) => update('phone', v)}
              placeholder="08012345678"
              placeholderTextColor={Colors.textSecondary + '80'}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.categoryPills}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.pill, form.category === c.value && styles.pillActive]}
                  onPress={() => update('category', c.value)}
                >
                  <Text style={[styles.pillText, form.category === c.value && styles.pillTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Subject <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={form.subject}
              onChangeText={(v) => update('subject', v)}
              placeholder="Brief description of your issue"
              placeholderTextColor={Colors.textSecondary + '80'}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Policy / Claim Reference</Text>
            <TextInput
              style={styles.input}
              value={form.referenceId}
              onChangeText={(v) => update('referenceId', v)}
              placeholder="e.g. POL-2024-001"
              placeholderTextColor={Colors.textSecondary + '80'}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Message <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textarea}
              value={form.message}
              onChangeText={(v) => update('message', v)}
              placeholder="Describe your issue in detail..."
              placeholderTextColor={Colors.textSecondary + '80'}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <Button title={loading ? 'Submitting...' : 'Submit Request'} onPress={handleSubmit} disabled={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  scroll: { padding: 20, gap: 16 },
  field: { marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textDark, marginBottom: 6 },
  required: { color: Colors.error },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textDark,
    backgroundColor: Colors.white,
  },
  textarea: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textDark,
    backgroundColor: Colors.white,
    minHeight: 120,
  },
  categoryPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  pillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  pillText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  pillTextActive: { color: Colors.primary, fontWeight: '700' },
  successWrap: { flex: 1, justifyContent: 'center', padding: 24, alignItems: 'center' },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: Colors.textDark, marginBottom: 8 },
  successText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  ticketRef: { fontSize: 20, fontWeight: '800', color: Colors.primary, marginVertical: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  successSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 24, textAlign: 'center' },
})
