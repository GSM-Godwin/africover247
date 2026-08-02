import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as DocumentPicker from 'expo-document-picker'
import { Button, NumberInput } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

const GENDERS = ['Male', 'Female', 'Prefer not to say']
const MARITAL = ['Single', 'Married', 'Divorced', 'Widowed']
const EMPLOYMENT = ['Employed', 'Self-employed', 'Business owner', 'Retired', 'Student', 'Unemployed']

const STEPS = ['Personal Details', 'Address', 'Employment', 'Documents', 'Review & Submit']

const KYC_DOC_TYPES = [
  { key: 'government-id', label: "Government ID (NIN, Passport, or Driver's License)" },
  { key: 'proof-of-address', label: 'Proof of Address (Utility bill)' },
  { key: 'vehicle-documents', label: 'Vehicle Documents (for motor products)' },
  { key: 'other', label: 'Other Supporting Documents' },
]

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={stepStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <View style={[
            stepStyles.dot,
            i < current && stepStyles.dotDone,
            i === current && stepStyles.dotActive,
          ]}>
            {i < current ? (
              <Ionicons name="checkmark" size={12} color={Colors.white} />
            ) : (
              <Text style={[stepStyles.dotText, i === current && stepStyles.dotTextActive]}>
                {i + 1}
              </Text>
            )}
          </View>
          {i < total - 1 && (
            <View style={[stepStyles.line, i < current && stepStyles.lineDone]} />
          )}
        </React.Fragment>
      ))}
    </View>
  )
}

const stepStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center',
  },
  dotActive: { backgroundColor: Colors.primary },
  dotDone: { backgroundColor: Colors.success },
  dotText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  dotTextActive: { color: Colors.white },
  line: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 4 },
  lineDone: { backgroundColor: Colors.success },
})

function ChipSelector({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <View style={chipStyles.container}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[chipStyles.chip, value === opt && chipStyles.selected]}
          onPress={() => onChange(opt)}
        >
          <Text style={[chipStyles.text, value === opt && chipStyles.selectedText]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const chipStyles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: Colors.white,
  },
  selected: { borderColor: Colors.primary, backgroundColor: '#EBF4FA' },
  text: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  selectedText: { color: Colors.primary, fontWeight: '700' },
})

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={fieldStyles.container}>
      <Text style={fieldStyles.label}>
        {label}{required && <Text style={{ color: Colors.error }}> *</Text>}
      </Text>
      {children}
    </View>
  )
}

const fieldStyles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8 },
})

function TInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  editable = true,
}: {
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: 'default' | 'phone-pad' | 'numeric'
  editable?: boolean
}) {
  return (
    <TextInput
      style={[inputStyles.input, !editable && inputStyles.disabled]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textSecondary + '80'}
      keyboardType={keyboardType || 'default'}
      editable={editable}
    />
  )
}

const inputStyles = StyleSheet.create({
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.text, backgroundColor: Colors.white,
  },
  disabled: { backgroundColor: '#F8FAFC', color: Colors.textSecondary },
})

function StatePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = NIGERIAN_STATES.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <TouchableOpacity
        style={pickerStyles.trigger}
        onPress={() => setVisible(true)}
      >
        <Text style={[pickerStyles.triggerText, !value && pickerStyles.placeholder]}>
          {value || 'Select state'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={pickerStyles.modal}>
          <View style={pickerStyles.modalHeader}>
            <Text style={pickerStyles.modalTitle}>Select State</Text>
            <TouchableOpacity onPress={() => { setVisible(false); setSearch('') }}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={pickerStyles.searchContainer}>
            <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
            <TextInput
              style={pickerStyles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search states..."
              placeholderTextColor={Colors.textSecondary + '80'}
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[pickerStyles.option, value === item && pickerStyles.optionSelected]}
                onPress={() => {
                  onChange(item)
                  setVisible(false)
                  setSearch('')
                }}
              >
                <Text style={[pickerStyles.optionText, value === item && pickerStyles.optionTextSelected]}>
                  {item}
                </Text>
                {value === item && (
                  <Ionicons name="checkmark" size={18} color={Colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  )
}

const pickerStyles = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.white,
  },
  triggerText: { fontSize: 15, color: Colors.text },
  placeholder: { color: Colors.textSecondary + '80' },
  modal: { flex: 1, backgroundColor: Colors.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0F4F8',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 16, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#F0F4F8', borderRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  option: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F4F8',
  },
  optionSelected: { backgroundColor: '#EBF4FA' },
  optionText: { fontSize: 15, color: Colors.text },
  optionTextSelected: { color: Colors.primary, fontWeight: '600' },
})

function DOBPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false)
  const date = value ? new Date(value.split('/').reverse().join('-')) : new Date(2000, 0, 1)

  function handleChange(_: unknown, selected?: Date) {
    setShow(false)
    if (selected) {
      const formatted = `${String(selected.getDate()).padStart(2, '0')}/${String(selected.getMonth() + 1).padStart(2, '0')}/${selected.getFullYear()}`
      onChange(formatted)
    }
  }

  return (
    <>
      <TouchableOpacity
        style={pickerStyles.trigger}
        onPress={() => setShow(true)}
      >
        <Text style={[pickerStyles.triggerText, !value && pickerStyles.placeholder]}>
          {value || 'Select date of birth'}
        </Text>
        <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
          minimumDate={new Date(1940, 0, 1)}
        />
      )}
    </>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <View style={reviewStyles.row}>
      <Text style={reviewStyles.label}>{label}</Text>
      <Text style={reviewStyles.value}>{value}</Text>
    </View>
  )
}

const reviewStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F4F8',
  },
  label: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  value: { fontSize: 13, fontWeight: '600', color: Colors.text, flex: 1, textAlign: 'right' },
})

interface FormData {
  dateOfBirth: string
  gender: string
  nationality: string
  maritalStatus: string
  address: string
  city: string
  state: string
  alternativePhone: string
  employmentStatus: string
  employer: string
  occupation: string
  annualIncome: string
}

export function ApplicationWizardScreen({ route, navigation }: any) {
  const params = route.params || {}
  const { applicationId, product } = params as any
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [kycDocuments, setKycDocuments] = useState<
    { name: string; uri: string; type: string; docType: string }[]
  >([])
  const [formData, setFormData] = useState<FormData>({
    dateOfBirth: '',
    gender: '',
    nationality: 'Nigerian',
    maritalStatus: '',
    address: '',
    city: '',
    state: '',
    alternativePhone: '',
    employmentStatus: '',
    employer: '',
    occupation: '',
    annualIncome: '',
  })

  useEffect(() => {
    async function loadDraft() {
      try {
        const res = await api.get(`/applications/${applicationId}`)
        const app = res.data
        if (app.formData && typeof app.formData === 'object') {
          const fd = app.formData as any
          setFormData({
            dateOfBirth: fd.dateOfBirth || '',
            gender: fd.gender || '',
            nationality: fd.nationality || 'Nigerian',
            maritalStatus: fd.maritalStatus || '',
            address: fd.address || '',
            city: fd.city || '',
            state: fd.state || '',
            alternativePhone: fd.alternativePhone || '',
            employmentStatus: fd.employmentStatus || '',
            employer: fd.employer || '',
            occupation: fd.occupation || '',
            annualIncome: fd.annualIncome || '',
          })
        }
        if (app.stepCompleted && app.stepCompleted > 0) {
          setStep(Math.min(app.stepCompleted, STEPS.length - 1))
        }
      } catch {}
    }
    loadDraft()
  }, [applicationId])

  function update(key: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function validateStep(): boolean {
    if (step === 0) {
      if (!formData.dateOfBirth || !formData.gender || !formData.maritalStatus) {
        Alert.alert('Missing Fields', 'Please fill in Date of Birth, Gender and Marital Status.')
        return false
      }
    }
    if (step === 1) {
      if (!formData.address || !formData.city || !formData.state) {
        Alert.alert('Missing Fields', 'Please fill in your Address, City and State.')
        return false
      }
    }
    if (step === 2) {
      if (!formData.employmentStatus || !formData.occupation) {
        Alert.alert('Missing Fields', 'Please fill in Employment Status and Occupation.')
        return false
      }
    }
    return true
  }

  async function handleNext() {
    if (!validateStep()) return
    if (step < STEPS.length - 1) {
      setSaving(true)
      try {
        if (step === 3 && kycDocuments.length > 0) {
          for (const doc of kycDocuments) {
            try {
              const formDataUpload = new FormData()
              formDataUpload.append('file', {
                uri: doc.uri,
                name: doc.name,
                type: doc.type,
              } as any)
              formDataUpload.append('documentType', doc.docType)
              await api.post(`/applications/${applicationId}/documents`, formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' },
              })
            } catch {}
          }
        }
        await api.put(`/applications/${applicationId}`, {
          formData: { ...formData, stepCompleted: step + 1 },
          stepCompleted: step + 1,
        })
      } catch {}
      setSaving(false)
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      await api.put(`/applications/${applicationId}`, {
        formData: { ...formData, stepCompleted: 5 },
        stepCompleted: 5,
      })
      setSaving(false)
      navigation.replace('PaymentInitiate', { applicationId, product })
    } catch (err: any) {
      setSaving(false)
      const message = err?.response?.data?.message
      Alert.alert(
        'Error',
        Array.isArray(message) ? message[0] : (message || 'Could not save application.'),
      )
    }
  }

  const showEmployerFields = ['Employed', 'Self-employed', 'Business owner'].includes(formData.employmentStatus)

  function renderStep() {
    switch (step) {

      case 0:
        return (
          <View>
            <Field label="Date of Birth" required>
              <DOBPicker value={formData.dateOfBirth} onChange={(v) => update('dateOfBirth', v)} />
            </Field>
            <Field label="Gender" required>
              <ChipSelector options={GENDERS} value={formData.gender} onChange={(v) => update('gender', v)} />
            </Field>
            <Field label="Nationality">
              <TInput value={formData.nationality} onChangeText={(v) => update('nationality', v)} />
            </Field>
            <Field label="Marital Status" required>
              <ChipSelector options={MARITAL} value={formData.maritalStatus} onChange={(v) => update('maritalStatus', v)} />
            </Field>
          </View>
        )

      case 1:
        return (
          <View>
            <Field label="Home Address" required>
              <TInput
                value={formData.address}
                onChangeText={(v) => update('address', v)}
                placeholder="Street address"
              />
            </Field>
            <Field label="City" required>
              <TInput
                value={formData.city}
                onChangeText={(v) => update('city', v)}
                placeholder="City"
              />
            </Field>
            <Field label="State" required>
              <StatePicker value={formData.state} onChange={(v) => update('state', v)} />
            </Field>
            <Field label="Alternative Phone">
              <TInput
                value={formData.alternativePhone}
                onChangeText={(v) => update('alternativePhone', v)}
                placeholder="08012345678"
                keyboardType="phone-pad"
              />
            </Field>
          </View>
        )

      case 2:
        return (
          <View>
            <Field label="Employment Status" required>
              <ChipSelector
                options={EMPLOYMENT}
                value={formData.employmentStatus}
                onChange={(v) => update('employmentStatus', v)}
              />
            </Field>

            {showEmployerFields && (
              <Field label="Employer / Company Name">
                <TInput
                  value={formData.employer}
                  onChangeText={(v) => update('employer', v)}
                  placeholder="Company or business name"
                />
              </Field>
            )}

            <Field label="Occupation / Role" required>
              <TInput
                value={formData.occupation}
                onChangeText={(v) => update('occupation', v)}
                placeholder="e.g. Software Engineer, Teacher"
              />
            </Field>

            <Field label="Annual Income (₦)">
              <NumberInput
                value={formData.annualIncome}
                onChangeText={(v) => update('annualIncome', v)}
                placeholder="e.g. 2,400,000"
                prefix="₦"
              />
            </Field>
          </View>
        )

      case 3:
        return (
          <View>
            <Text style={styles.reviewTitle}>Upload KYC Documents</Text>
            <Text style={styles.reviewSubtitle}>
              Upload the required documents to verify your identity and complete your application.
            </Text>

            {KYC_DOC_TYPES.map((docType) => {
              const uploaded = kycDocuments.filter((d) => d.docType === docType.key)
              return (
                <View key={docType.key} style={styles.docTypeSection}>
                  <View style={styles.docTypeHeader}>
                    <Text style={styles.docTypeLabel}>{docType.label}</Text>
                    {uploaded.length > 0 && (
                      <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                    )}
                  </View>
                  {uploaded.map((doc, i) => (
                    <View key={i} style={styles.docRow}>
                      <Ionicons name="document-outline" size={14} color={Colors.primary} />
                      <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setKycDocuments((prev) =>
                            prev.filter((d) => !(d.docType === docType.key && d.name === doc.name))
                          )
                        }}
                      >
                        <Ionicons name="close-circle" size={16} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={async () => {
                      try {
                        const result = await DocumentPicker.getDocumentAsync({
                          type: ['image/*', 'application/pdf'],
                        })
                        if (!result.canceled && result.assets?.[0]) {
                          const a = result.assets[0]
                          setKycDocuments((prev) => [...prev, {
                            name: a.name,
                            uri: a.uri,
                            type: a.mimeType || 'application/octet-stream',
                            docType: docType.key,
                          }])
                        }
                      } catch {}
                    }}
                  >
                    <Ionicons name="cloud-upload-outline" size={16} color={Colors.primary} />
                    <Text style={styles.uploadButtonText}>
                      {uploaded.length > 0 ? 'Add another' : 'Upload'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            })}

            <View style={styles.kycNote}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
              <Text style={styles.kycNoteText}>
                Documents are encrypted and stored securely. They are only used for KYC verification.
              </Text>
            </View>
          </View>
        )

      case 4:
        return (
          <View>
            <Text style={styles.reviewTitle}>Review your details</Text>
            <Text style={styles.reviewSubtitle}>
              Please confirm everything is correct before proceeding to payment.
            </Text>

            {[
              { title: 'Personal Details', stepIndex: 0, rows: [
                { label: 'Date of Birth', value: formData.dateOfBirth },
                { label: 'Gender', value: formData.gender },
                { label: 'Nationality', value: formData.nationality },
                { label: 'Marital Status', value: formData.maritalStatus },
              ]},
              { title: 'Address', stepIndex: 1, rows: [
                { label: 'Address', value: formData.address },
                { label: 'City', value: formData.city },
                { label: 'State', value: formData.state },
              ]},
              { title: 'Employment', stepIndex: 2, rows: [
                { label: 'Status', value: formData.employmentStatus },
                { label: 'Occupation', value: formData.occupation },
                { label: 'Employer', value: formData.employer },
                { label: 'Annual Income', value: formData.annualIncome ? `₦${parseFloat(formData.annualIncome).toLocaleString()}` : '' },
              ]},
              { title: 'Documents', stepIndex: 3, rows: [
                { label: 'Uploaded', value: kycDocuments.length > 0 ? `${kycDocuments.length} file(s)` : 'None' },
              ]},
            ].map(({ title, stepIndex, rows }) => (
              <View key={title} style={styles.reviewSection}>
                <View style={styles.reviewSectionHeader}>
                  <Text style={styles.reviewSectionTitle}>{title}</Text>
                  <TouchableOpacity onPress={() => setStep(stepIndex)}>
                    <Text style={styles.editLink}>Edit</Text>
                  </TouchableOpacity>
                </View>
                {rows.map(({ label, value }) => (
                  <ReviewRow key={label} label={label} value={value} />
                ))}
              </View>
            ))}

            <View style={styles.disclaimer}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.disclaimerText}>
                By proceeding you confirm the information provided is accurate and complete.
              </Text>
            </View>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{STEPS[step]}</Text>
            <Text style={styles.headerSub}>Step {step + 1} of {STEPS.length}</Text>
          </View>
          <View style={{ width: 22 }} />
        </View>

        <StepIndicator current={step} total={STEPS.length} />

        {product && (
          <View style={styles.productBanner}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
            <Text style={styles.productBannerText} numberOfLines={1}>{product.name}</Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
          <View style={{ height: 32 }} />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={step === STEPS.length - 1 ? 'Proceed to Payment' : 'Continue'}
            onPress={handleNext}
            loading={saving}
          />
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F4F8',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  productBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EBF4FA', paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#D8EAF5',
  },
  productBannerText: { fontSize: 13, color: Colors.primary, fontWeight: '600', flex: 1 },
  scroll: { padding: 20 },
  footer: {
    paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#F0F4F8',
    backgroundColor: Colors.white,
  },
  reviewTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  reviewSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20, lineHeight: 20 },
  reviewSection: {
    backgroundColor: '#F8FAFC', borderRadius: 12,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  reviewSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  reviewSectionTitle: {
    fontSize: 12, fontWeight: '700', color: Colors.primary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  editLink: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  disclaimer: {
    flexDirection: 'row', gap: 8, backgroundColor: '#FEF3E8',
    borderRadius: 10, padding: 12, marginTop: 8, alignItems: 'flex-start',
  },
  disclaimerText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  docTypeSection: { marginBottom: 20 },
  docTypeHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  docTypeLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 8 },
  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EBF4FA', borderRadius: 8, padding: 10, marginBottom: 6,
  },
  docName: { flex: 1, fontSize: 12, color: Colors.text },
  uploadButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.primary, borderStyle: 'dashed',
    borderRadius: 8, padding: 10, justifyContent: 'center',
  },
  uploadButtonText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  kycNote: {
    flexDirection: 'row', gap: 8, backgroundColor: '#EBF4FA',
    borderRadius: 10, padding: 12, marginTop: 8, alignItems: 'flex-start',
  },
  kycNoteText: { flex: 1, fontSize: 12, color: Colors.primary, lineHeight: 18 },
})
