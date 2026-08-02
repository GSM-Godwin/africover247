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
import * as DocumentPicker from 'expo-document-picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Button, NumberInput } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'

interface Policy {
  id: string
  policyNumber: string
  product: { name: string }
}

const CLAIM_TYPES = [
  'Motor Accident',
  'Theft',
  'Fire',
  'Flood',
  'Third Party',
  'Medical',
  'Death',
  'Disability',
  'Property Damage',
  'Other',
]

function toApiClaimType(type: string): string {
  const map: Record<string, string> = {
    'Motor Accident': 'Motor Accident',
    'Theft': 'Theft',
    'Fire': 'Fire',
    'Flood': 'Other',
    'Third Party': 'Other',
    'Medical': 'Medical',
    'Death': 'Other',
    'Disability': 'Other',
    'Property Damage': 'Other',
    'Other': 'Other',
  }
  return map[type] || 'Other'
}

export function NewClaimScreen({ route, navigation }: any) {
  const params = route?.params || {}
  const { preselectedPolicyId } = params as { preselectedPolicyId?: string }
  const [policies, setPolicies] = useState<Policy[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [claimType, setClaimType] = useState('')
  const [incidentDate, setIncidentDate] = useState('')
  const [incidentLocation, setIncidentLocation] = useState('')
  const [description, setDescription] = useState('')
  const [estimatedAmount, setEstimatedAmount] = useState('')
  const [policeReportFiled, setPoliceReportFiled] = useState(false)
  const [policeReportNumber, setPoliceReportNumber] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [documents, setDocuments] = useState<{ name: string; uri: string; type: string }[]>([])

  useEffect(() => {
    api.get('/policies/my')
      .then((res) => setPolicies(res.data.filter((p: Policy & { status: string }) => p.status === 'active')))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (preselectedPolicyId && policies.length > 0) {
      const found = policies.find((p) => p.id === preselectedPolicyId)
      if (found) setSelectedPolicy(found)
    }
  }, [preselectedPolicyId, policies])

  async function handleAddDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
      })
      if (!result.canceled && result.assets) {
        const newDocs = result.assets.map((a) => ({
          name: a.name,
          uri: a.uri,
          type: a.mimeType || 'application/octet-stream',
        }))
        setDocuments((prev) => [...prev, ...newDocs].slice(0, 5))
      }
    } catch {}
  }

  function removeDocument(index: number) {
    setDocuments((prev) => prev.filter((_, i) => i !== index))
  }

  function handleDateChange(_: unknown, selected?: Date) {
    setShowDatePicker(false)
    if (selected) {
      const formatted = `${String(selected.getDate()).padStart(2, '0')}/${String(selected.getMonth() + 1).padStart(2, '0')}/${selected.getFullYear()}`
      setIncidentDate(formatted)
    }
  }

  async function handleSubmit() {
    try {
      if (!selectedPolicy) {
        Alert.alert('Missing', 'Please select a policy.')
        return
      }
      if (!claimType) {
        Alert.alert('Missing', 'Please select a claim type.')
        return
      }
      if (!incidentDate || incidentDate.trim() === '') {
        Alert.alert('Missing', 'Please enter the incident date.')
        return
      }
      if (!incidentLocation || incidentLocation.trim() === '') {
        Alert.alert('Missing', 'Please enter the incident location.')
        return
      }
      if (!description || description.trim().length < 50) {
        Alert.alert('Missing', 'Please describe what happened in detail (at least 50 characters).')
        return
      }

      setLoading(true)

      let incidentDateISO = new Date().toISOString()
      try {
        const trimmed = incidentDate.trim()
        if (trimmed.includes('/')) {
          const parts = trimmed.split('/')
          if (parts.length === 3) {
            const [day, month, year] = parts
            const d = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            )
            if (!isNaN(d.getTime())) {
              incidentDateISO = d.toISOString()
            }
          }
        } else if (trimmed.includes('-')) {
          const d = new Date(trimmed)
          if (!isNaN(d.getTime())) {
            incidentDateISO = d.toISOString()
          }
        }
      } catch {}

      const payload: Record<string, any> = {
        policyId: selectedPolicy.id,
        claimType: toApiClaimType(claimType),
        incidentDate: incidentDateISO,
        incidentLocation: incidentLocation.trim(),
        description: description.trim(),
        policeReportFiled,
      }

      if (estimatedAmount && estimatedAmount.trim() !== '') {
        const amount = parseFloat(estimatedAmount.replace(/,/g, ''))
        if (!isNaN(amount) && amount > 0) {
          payload.estimatedAmount = amount
        }
      }

      if (policeReportFiled && policeReportNumber.trim() !== '') {
        payload.policeReportNumber = policeReportNumber.trim()
      }

      const claimRes = await api.post('/claims', payload)
      const claimId = claimRes.data.id

      if (documents.length > 0) {
        for (const doc of documents) {
          try {
            const formData = new FormData()
            formData.append('file', {
              uri: doc.uri,
              name: doc.name,
              type: doc.type,
            } as any)
            formData.append('documentType', 'incident-photo')
            await api.post(`/claims/${claimId}/documents`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
          } catch {}
        }
      }

      Alert.alert(
        'Claim Submitted ✓',
        'Your claim has been submitted successfully. Our team will review it within 3 business days.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
    } catch (err: any) {
      const message = err?.response?.data?.message
      const errorText = Array.isArray(message)
        ? message[0]
        : (message || 'Could not submit claim. Please try again.')
      Alert.alert('Error', errorText)
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

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>File a Claim</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.field}>
            <Text style={styles.label}>Select Policy <Text style={styles.required}>*</Text></Text>
            {policies.length === 0 ? (
              <View style={styles.noPolicies}>
                <Text style={styles.noPoliciesText}>
                  You have no active policies. Get covered first.
                </Text>
                <TouchableOpacity
                  style={styles.getCovedButton}
                  onPress={() => navigation.navigate('Tabs', { screen: 'Products' } as never)}
                >
                  <Text style={styles.getCoveredText}>Browse Products</Text>
                </TouchableOpacity>
              </View>
            ) : (
              policies.map((policy) => (
                <TouchableOpacity
                  key={policy.id}
                  style={[
                    styles.policyOption,
                    selectedPolicy?.id === policy.id && styles.policyOptionSelected,
                  ]}
                  onPress={() => setSelectedPolicy(policy)}
                >
                  <View style={styles.policyOptionInner}>
                    <Ionicons
                      name="shield-checkmark"
                      size={18}
                      color={selectedPolicy?.id === policy.id ? Colors.primary : Colors.textSecondary}
                    />
                    <View style={styles.policyOptionInfo}>
                      <Text style={styles.policyOptionName}>{policy.product.name}</Text>
                      <Text style={styles.policyOptionNumber}>{policy.policyNumber}</Text>
                    </View>
                  </View>
                  {selectedPolicy?.id === policy.id && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Claim Type <Text style={styles.required}>*</Text></Text>
            <View style={styles.chipRow}>
              {CLAIM_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, claimType === type && styles.chipSelected]}
                  onPress={() => setClaimType(type)}
                >
                  <Text style={[styles.chipText, claimType === type && styles.chipTextSelected]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Incident Date <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={styles.inputRow}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.inputText, !incidentDate && styles.placeholder]}>
                {incidentDate || 'Select incident date'}
              </Text>
              <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Incident Location <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={incidentLocation}
              onChangeText={setIncidentLocation}
              placeholder="Where did the incident occur?"
              placeholderTextColor={Colors.textSecondary + '80'}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what happened in detail (minimum 50 characters)..."
              placeholderTextColor={Colors.textSecondary + '80'}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/50 minimum</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Estimated Amount (₦)</Text>
            <NumberInput
              value={estimatedAmount}
              onChangeText={setEstimatedAmount}
              placeholder="e.g. 500,000"
              prefix="₦"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Police Report Filed?</Text>
            <View style={styles.toggleRow}>
              {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    styles.toggleOption,
                    policeReportFiled === opt.value && styles.toggleSelected,
                  ]}
                  onPress={() => setPoliceReportFiled(opt.value)}
                >
                  <Text style={[
                    styles.toggleText,
                    policeReportFiled === opt.value && styles.toggleTextSelected,
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {policeReportFiled && (
            <View style={styles.field}>
              <Text style={styles.label}>Police Report Number</Text>
              <TextInput
                style={styles.input}
                value={policeReportNumber}
                onChangeText={setPoliceReportNumber}
                placeholder="e.g. CR/2026/001234"
                placeholderTextColor={Colors.textSecondary + '80'}
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Supporting Documents (optional)</Text>
            <Text style={styles.hint}>Upload photos, police report, receipts etc. Max 5 files.</Text>

            <TouchableOpacity style={styles.uploadButton} onPress={handleAddDocument}>
              <Ionicons name="cloud-upload-outline" size={20} color={Colors.primary} />
              <Text style={styles.uploadText}>Add Documents</Text>
            </TouchableOpacity>

            {documents.map((doc, i) => (
              <View key={i} style={styles.docRow}>
                <Ionicons name="document-outline" size={16} color={Colors.primary} />
                <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                <TouchableOpacity onPress={() => removeDocument(i)}>
                  <Ionicons name="close-circle" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>
              Our team will review your claim within 3 business days.
              You will be notified at each stage of the process.
            </Text>
          </View>

          <Button
            title="Submit Claim"
            onPress={handleSubmit}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F4F8',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  scroll: { padding: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  required: { color: Colors.error },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.text, backgroundColor: Colors.white,
  },
  textarea: { height: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, textAlign: 'right' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.white,
  },
  inputText: { fontSize: 15, color: Colors.text },
  placeholder: { color: Colors.textSecondary + '80' },
  noPolicies: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, alignItems: 'center' },
  noPoliciesText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 12 },
  getCovedButton: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  getCoveredText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  policyOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: Colors.white, marginBottom: 8,
  },
  policyOptionSelected: { borderColor: Colors.primary, backgroundColor: '#EBF4FA' },
  policyOptionInner: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  policyOptionInfo: { flex: 1 },
  policyOptionName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  policyOptionNumber: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'monospace', marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: Colors.white,
  },
  chipSelected: { borderColor: Colors.primary, backgroundColor: '#EBF4FA' },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextSelected: { color: Colors.primary, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleOption: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center',
  },
  toggleSelected: { borderColor: Colors.primary, backgroundColor: '#EBF4FA' },
  toggleText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  toggleTextSelected: { color: Colors.primary },
  hint: { fontSize: 11, color: Colors.textSecondary, marginBottom: 8 },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EBF4FA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  docName: { flex: 1, fontSize: 13, color: Colors.text },
  infoBox: {
    flexDirection: 'row', gap: 8, backgroundColor: '#EBF4FA',
    borderRadius: 10, padding: 12, marginBottom: 16, alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 12, color: Colors.primary, lineHeight: 18 },
})
