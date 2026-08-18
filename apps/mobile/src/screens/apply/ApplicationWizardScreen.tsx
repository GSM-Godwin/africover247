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
import * as ScreenCapture from 'expo-screen-capture'
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

const STEPS = ['Personal Details', 'Address & Employment', 'Documents', 'Review & Submit']

const KYC_DOC_TYPES = [
  { key: 'government-id', label: "Government ID (NIN, Passport, or Driver's License)" },
  { key: 'proof-of-address', label: 'Proof of Address (Utility bill)' },
  { key: 'vehicle-documents', label: 'Vehicle Documents (for motor products)' },
  { key: 'other', label: 'Other Supporting Documents' },
]

const ID_TYPES = [
  { value: 'bvn', label: 'BVN', placeholder: 'Enter your 11-digit BVN' },
  { value: 'nin', label: 'NIN', placeholder: 'Enter your 11-digit NIN' },
  { value: 'drivers_licence', label: "Driver's Licence", placeholder: 'Enter licence number' },
  { value: 'passport', label: 'Passport', placeholder: 'Enter passport number' },
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
    backgroundColor: Colors.background, borderRadius: 10,
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
  const [idType, setIdType] = useState<'bvn' | 'nin' | 'drivers_licence' | 'passport'>('bvn')
  const [idValue, setIdValue] = useState('')
  const [idDob, setIdDob] = useState('')
  const [idLastName, setIdLastName] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [idVerified, setIdVerified] = useState(false)
  const [idError, setIdError] = useState('')

  const requiredDocTypes: string[] = (() => {
    if (!product?.requiredDocuments) return []
    if (Array.isArray(product.requiredDocuments)) return product.requiredDocuments as string[]
    if (typeof product.requiredDocuments === 'string') {
      try { return JSON.parse(product.requiredDocuments) } catch { return [] }
    }
    return []
  })()

  const documentsRequired = requiredDocTypes.length > 0

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
        if (app.kycVerified) {
          setIdVerified(true)
        }
      } catch {}
    }
    loadDraft()
  }, [applicationId])

  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync()
    return () => {
      ScreenCapture.allowScreenCaptureAsync()
    }
  }, [])

  function update(key: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleVerifyIdentity() {
    if (!idValue.trim()) {
      Alert.alert('Missing', 'Please enter your ID number.')
      return
    }
    setVerifying(true)
    setIdError('')
    try {
      const payload: Record<string, string> = {
        verificationType: idType,
        value: idValue.trim(),
      }
      if (idType === 'drivers_licence' || idType === 'passport') {
        payload.dateOfBirth = idDob
      }
      if (idType === 'passport') {
        payload.lastName = idLastName
      }
      const res = await api.post(`/applications/${applicationId}/verify-identity`, payload)
      if (res.data.verified) {
        setIdVerified(true)
      } else {
        setIdError('Verification failed. Please check your details.')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setIdError(Array.isArray(msg) ? msg[0] : (msg || 'Verification failed. Please try again.'))
    } finally {
      setVerifying(false)
    }
  }

  async function validateStep(): Promise<boolean> {
    if (step === 0) {
      if (!formData.dateOfBirth) {
        Alert.alert('Missing', 'Please enter your date of birth.')
        return false
      }
      if (!formData.gender) {
        Alert.alert('Missing', 'Please select your gender.')
        return false
      }
      if (!formData.maritalStatus) {
        Alert.alert('Missing', 'Please select your marital status.')
        return false
      }
      return true
    }

    if (step === 1) {
      if (!formData.address || formData.address.trim().length < 5) {
        Alert.alert('Missing', 'Please enter your street address (at least 5 characters).')
        return false
      }
      if (!formData.city || formData.city.trim() === '') {
        Alert.alert('Missing', 'Please enter your city.')
        return false
      }
      if (!formData.state || formData.state.trim() === '') {
        Alert.alert('Missing', 'Please select your state.')
        return false
      }
      if (!formData.employmentStatus) {
        Alert.alert('Missing', 'Please select your employment status.')
        return false
      }
      if (!formData.occupation || formData.occupation.trim() === '') {
        Alert.alert('Missing', 'Please enter your occupation.')
        return false
      }
      if (
        ['Employed', 'Self-employed', 'Business owner'].includes(formData.employmentStatus) &&
        (!formData.employer || formData.employer.trim() === '')
      ) {
        Alert.alert('Missing', 'Please enter your employer or business name.')
        return false
      }
      return true
    }

    if (step === 2) {
      if (!documentsRequired) return true

      const missingRequired = requiredDocTypes.filter(
        (docType) => !kycDocuments.some((d) => d.docType === docType)
      )

      if (missingRequired.length > 0) {
        return new Promise<boolean>((resolve) => {
          Alert.alert(
            'Documents Missing',
            `This product requires: ${missingRequired.join(', ')}. You can still proceed but may be asked to provide them later.`,
            [
              { text: 'Go Back', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Continue Anyway', onPress: () => resolve(true) },
            ]
          )
        })
      }
      return true
    }

    return true
  }

  async function handleNext() {
    const valid = await validateStep()
    if (!valid) return
    if (step < STEPS.length - 1) {
      setSaving(true)
      try {
        if (step === 2 && kycDocuments.length > 0) {
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
    if (!(await validateStep())) return
    setSaving(true)
    try {
      await api.put(`/applications/${applicationId}`, {
        formData: { ...formData, stepCompleted: 4 },
        stepCompleted: 4,
      })
      setSaving(false)

      if (product?.pricingType === 'quote_based') {
        Alert.alert(
          'Application Saved',
          'Your application details have been saved. You need to request a quote before proceeding to payment. Go to Products → Get a Quote to request your quote.',
          [
            {
              text: 'Request Quote',
              onPress: () => navigation.navigate('QuoteRequest', { product }),
            },
            {
              text: 'Go to Dashboard',
              onPress: () => navigation.navigate('Tabs', { screen: 'Home' } as never),
              style: 'cancel',
            },
          ]
        )
        return
      }

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

      case 2:
        if (!documentsRequired) {
          return (
            <View style={styles.noDocsContainer}>
              <Ionicons name="checkmark-circle-outline" size={48} color={Colors.success} />
              <Text style={styles.noDocsTitle}>No Documents Required</Text>
              <Text style={styles.noDocsText}>
                This product does not require any documents at this stage. You can proceed to review.
              </Text>
            </View>
          )
        }
        return (
          <View>
            <View style={styles.idVerifySection}>
              <Text style={styles.sectionSubtitle}>Step 1: Verify your identity</Text>

              {idVerified ? (
                <View style={styles.verifiedBox}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.verifiedText}>Identity verified successfully</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.label}>ID Type</Text>
                  <View style={styles.idTypePills}>
                    {ID_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t.value}
                        style={[styles.idTypePill, idType === t.value && styles.idTypePillActive]}
                        onPress={() => {
                          setIdType(t.value as 'bvn' | 'nin' | 'drivers_licence' | 'passport')
                          setIdValue('')
                          setIdError('')
                        }}
                      >
                        <Text style={[styles.idTypePillText, idType === t.value && styles.idTypePillTextActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>
                    {ID_TYPES.find((t) => t.value === idType)?.label} Number
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={idValue}
                    onChangeText={setIdValue}
                    placeholder={ID_TYPES.find((t) => t.value === idType)?.placeholder}
                    placeholderTextColor={Colors.textSecondary + '80'}
                    keyboardType={idType === 'bvn' || idType === 'nin' ? 'numeric' : 'default'}
                  />

                  {(idType === 'drivers_licence' || idType === 'passport') && (
                    <>
                      <Text style={styles.label}>Date of Birth</Text>
                      <TextInput
                        style={styles.input}
                        value={idDob}
                        onChangeText={setIdDob}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={Colors.textSecondary + '80'}
                      />
                    </>
                  )}

                  {idType === 'passport' && (
                    <>
                      <Text style={styles.label}>Last Name</Text>
                      <TextInput
                        style={styles.input}
                        value={idLastName}
                        onChangeText={setIdLastName}
                        placeholder="As on passport"
                        placeholderTextColor={Colors.textSecondary + '80'}
                      />
                    </>
                  )}

                  {idError !== '' && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{idError}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.verifyBtn, (verifying || !idValue.trim()) && styles.verifyBtnDisabled]}
                    onPress={handleVerifyIdentity}
                    disabled={verifying || !idValue.trim()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.verifyBtnText}>
                      {verifying ? 'Verifying...' : 'Verify Identity'}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.idNote}>
                    You can proceed without verification but may be required to verify before your policy is issued.
                  </Text>
                </>
              )}
            </View>

            <View style={styles.sectionDivider} />
            <Text style={styles.sectionSubtitle}>Step 2: Upload supporting documents</Text>

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

      case 3:
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
              { title: 'Address & Employment', stepIndex: 1, rows: [
                { label: 'Address', value: formData.address },
                { label: 'City', value: formData.city },
                { label: 'State', value: formData.state },
                { label: 'Status', value: formData.employmentStatus },
                { label: 'Occupation', value: formData.occupation },
                { label: 'Employer', value: formData.employer },
                { label: 'Annual Income', value: formData.annualIncome ? `₦${parseFloat(formData.annualIncome).toLocaleString()}` : '' },
              ]},
              { title: 'Documents', stepIndex: 2, rows: [
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

            {product?.pricingType === 'quote_based' ? (
              <View style={styles.quoteNotice}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.accent} />
                <Text style={styles.quoteNoticeText}>
                  This product requires a quote. After saving your details, you'll be directed to request a quote from AfriGlobal.
                </Text>
              </View>
            ) : null}

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
  quoteNotice: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.accentLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  quoteNoticeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.accent,
    lineHeight: 18,
  },
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
  noDocsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  noDocsTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  noDocsText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  idVerifySection: { marginBottom: 20 },
  sectionSubtitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.white,
    marginBottom: 16,
  },
  idTypePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  idTypePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  idTypePillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  idTypePillText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  idTypePillTextActive: { color: Colors.primary, fontWeight: '700' },
  verifiedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    padding: 12,
  },
  verifiedText: { fontSize: 14, fontWeight: '600', color: Colors.success },
  errorBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  errorText: { fontSize: 13, color: Colors.error },
  verifyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  verifyBtnDisabled: { opacity: 0.6 },
  verifyBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  idNote: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
  sectionDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 20 },
})
