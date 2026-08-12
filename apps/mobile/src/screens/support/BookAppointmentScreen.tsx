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
import DateTimePicker from '@react-native-community/datetimepicker'
import { Button } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'
import { getUser } from '../../services/auth'

const TOPICS = [
  'Product advice — which insurance is right for me',
  'Motor insurance',
  'Health insurance',
  'Life insurance',
  'Property insurance',
  'Travel insurance',
  'Business insurance',
  'Claim assistance',
  'Policy renewal',
  'General enquiry',
]

export function BookAppointmentScreen({ navigation }: any) {
  const [userLoaded, setUserLoaded] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    topic: '',
    notes: '',
  })
  const [preferredDate, setPreferredDate] = useState<Date | null>(null)
  const [alternateDate, setAlternateDate] = useState<Date | null>(null)
  const [showPreferredPicker, setShowPreferredPicker] = useState(false)
  const [showAlternatePicker, setShowAlternatePicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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

  function formatDate(date: Date | null) {
    if (!date) return ''
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !preferredDate || !form.topic) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.')
      return
    }
    setLoading(true)
    try {
      await api.post('/support/appointments', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        preferredDate: preferredDate.toISOString(),
        alternateDate: alternateDate ? alternateDate.toISOString() : undefined,
        topic: form.topic,
        notes: form.notes.trim() || undefined,
      })
      setSubmitted(true)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      Alert.alert('Error', Array.isArray(msg) ? msg[0] : (msg || 'Could not book appointment.'))
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
          <Text style={styles.successTitle}>Appointment Requested</Text>
          <Text style={styles.successText}>
            We will confirm your appointment within 24 hours.
          </Text>
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
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={styles.label}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
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
              Topic <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.topicPills}>
              {TOPICS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pill, form.topic === t && styles.pillActive]}
                  onPress={() => update('topic', t)}
                >
                  <Text style={[styles.pillText, form.topic === t && styles.pillTextActive]} numberOfLines={2}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Preferred Date <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPreferredPicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <Text style={styles.dateBtnText}>
                {preferredDate ? formatDate(preferredDate) : 'Select date'}
              </Text>
            </TouchableOpacity>
            {showPreferredPicker && (
              <DateTimePicker
                value={preferredDate || new Date()}
                mode="date"
                minimumDate={new Date()}
                onChange={(_, date) => {
                  setShowPreferredPicker(Platform.OS === 'ios')
                  if (date) setPreferredDate(date)
                }}
              />
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Alternate Date</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowAlternatePicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <Text style={styles.dateBtnText}>
                {alternateDate ? formatDate(alternateDate) : 'Select date (optional)'}
              </Text>
            </TouchableOpacity>
            {showAlternatePicker && (
              <DateTimePicker
                value={alternateDate || new Date()}
                mode="date"
                minimumDate={new Date()}
                onChange={(_, date) => {
                  setShowAlternatePicker(Platform.OS === 'ios')
                  if (date) setAlternateDate(date)
                }}
              />
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Additional notes</Text>
            <TextInput
              style={styles.textarea}
              value={form.notes}
              onChangeText={(v) => update('notes', v)}
              placeholder="Anything else we should know..."
              placeholderTextColor={Colors.textSecondary + '80'}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <Button title={loading ? 'Booking...' : 'Request Appointment'} onPress={handleSubmit} disabled={loading} />
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
    minHeight: 80,
  },
  topicPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    maxWidth: '100%',
  },
  pillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  pillText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  pillTextActive: { color: Colors.primary, fontWeight: '700' },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  dateBtnText: { fontSize: 14, color: Colors.textDark },
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
  successText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
})
