import React, { useState } from 'react'
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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'

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

const STEPS = [
  'Personal Details',
  'Address',
  'Employment',
  'Review & Submit',
]

const GENDERS = ['Male', 'Female', 'Prefer not to say']
const MARITAL = ['Single', 'Married', 'Divorced', 'Widowed']
const EMPLOYMENT = ['Employed', 'Self-employed', 'Business owner', 'Retired', 'Student', 'Unemployed']
const STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
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
              <Text style={[
                stepStyles.dotText,
                i === current && stepStyles.dotTextActive,
              ]}>
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { backgroundColor: Colors.primary },
  dotDone: { backgroundColor: Colors.success },
  dotText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  dotTextActive: { color: Colors.white },
  line: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 4 },
  lineDone: { backgroundColor: Colors.success },
})

function SelectChips({
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
          style={[chipStyles.chip, value === opt && chipStyles.chipSelected]}
          onPress={() => onChange(opt)}
        >
          <Text style={[chipStyles.text, value === opt && chipStyles.textSelected]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const chipStyles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.white,
  },
  chipSelected: { borderColor: Colors.primary, backgroundColor: '#EBF4FA' },
  text: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  textSelected: { color: Colors.primary, fontWeight: '700' },
})

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <View style={fieldStyles.container}>
      <Text style={fieldStyles.label}>
        {label}
        {required && <Text style={{ color: Colors.error }}> *</Text>}
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
}: {
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: 'default' | 'numeric' | 'phone-pad'
}) {
  return (
    <TextInput
      style={inputStyles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textSecondary + '80'}
      keyboardType={keyboardType || 'default'}
    />
  )
}

const inputStyles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
})

export function ApplicationWizardScreen({ route, navigation }: any) {
  const { applicationId, product } = route.params
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
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

  function update(key: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function validateStep(): boolean {
    if (step === 0) {
      if (!formData.dateOfBirth || !formData.gender || !formData.maritalStatus) {
        Alert.alert('Missing Fields', 'Please fill in all required fields.')
        return false
      }
    }
    if (step === 1) {
      if (!formData.address || !formData.city || !formData.state) {
        Alert.alert('Missing Fields', 'Please fill in your address details.')
        return false
      }
    }
    if (step === 2) {
      if (!formData.employmentStatus || !formData.occupation) {
        Alert.alert('Missing Fields', 'Please fill in your employment details.')
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
        formData: { ...formData, stepCompleted: 4 },
        stepCompleted: 4,
        status: 'pending_payment',
      })
      navigation.replace('PaymentInitiate', { applicationId, product })
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not save application.')
    } finally {
      setSaving(false)
    }
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <View>
            <Field label="Date of Birth" required>
              <TInput
                value={formData.dateOfBirth}
                onChangeText={(v) => update('dateOfBirth', v)}
                placeholder="DD/MM/YYYY"
              />
            </Field>
            <Field label="Gender" required>
              <SelectChips
                options={GENDERS}
                value={formData.gender}
                onChange={(v) => update('gender', v)}
              />
            </Field>
            <Field label="Nationality">
              <TInput
                value={formData.nationality}
                onChangeText={(v) => update('nationality', v)}
              />
            </Field>
            <Field label="Marital Status" required>
              <SelectChips
                options={MARITAL}
                value={formData.maritalStatus}
                onChange={(v) => update('maritalStatus', v)}
              />
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
              <View style={stateStyles.container}>
                {STATES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      stateStyles.chip,
                      formData.state === s && stateStyles.chipSelected,
                    ]}
                    onPress={() => update('state', s)}
                  >
                    <Text style={[
                      stateStyles.text,
                      formData.state === s && stateStyles.textSelected,
                    ]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
              <SelectChips
                options={EMPLOYMENT}
                value={formData.employmentStatus}
                onChange={(v) => update('employmentStatus', v)}
              />
            </Field>
            <Field label="Employer / Company">
              <TInput
                value={formData.employer}
                onChangeText={(v) => update('employer', v)}
                placeholder="Employer name"
              />
            </Field>
            <Field label="Occupation / Role" required>
              <TInput
                value={formData.occupation}
                onChangeText={(v) => update('occupation', v)}
                placeholder="e.g. Software Engineer"
              />
            </Field>
            <Field label="Annual Income (₦)">
              <TInput
                value={formData.annualIncome}
                onChangeText={(v) => update('annualIncome', v)}
                placeholder="e.g. 2400000"
                keyboardType="numeric"
              />
            </Field>
          </View>
        )

      case 3:
        return (
          <View>
            <Text style={reviewStyles.heading}>Review your details</Text>
            <Text style={reviewStyles.subheading}>
              Please confirm everything looks correct before proceeding to payment.
            </Text>

            {[
              { section: 'Personal', items: [
                { label: 'Date of Birth', value: formData.dateOfBirth },
                { label: 'Gender', value: formData.gender },
                { label: 'Nationality', value: formData.nationality },
                { label: 'Marital Status', value: formData.maritalStatus },
              ]},
              { section: 'Address', items: [
                { label: 'Address', value: formData.address },
                { label: 'City', value: formData.city },
                { label: 'State', value: formData.state },
              ]},
              { section: 'Employment', items: [
                { label: 'Employment Status', value: formData.employmentStatus },
                { label: 'Occupation', value: formData.occupation },
                { label: 'Employer', value: formData.employer },
              ]},
            ].map(({ section, items }) => (
              <View key={section} style={reviewStyles.section}>
                <Text style={reviewStyles.sectionTitle}>{section}</Text>
                {items.filter((i) => i.value).map((item) => (
                  <View key={item.label} style={reviewStyles.row}>
                    <Text style={reviewStyles.rowLabel}>{item.label}</Text>
                    <Text style={reviewStyles.rowValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            ))}

            <View style={reviewStyles.disclaimer}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
              <Text style={reviewStyles.disclaimerText}>
                By proceeding you confirm that the information provided is accurate and complete.
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

        {/* --- Header --- */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{STEPS[step]}</Text>
            <Text style={styles.headerSub}>
              Step {step + 1} of {STEPS.length}
            </Text>
          </View>
          <View style={{ width: 22 }} />
        </View>

        <StepIndicator current={step} total={STEPS.length} />

        {product && (
          <View style={styles.productBanner}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
            <Text style={styles.productBannerText} numberOfLines={1}>
              {product.name}
            </Text>
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

        <View style={styles.actions}>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  productBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EBF4FA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D8EAF5',
  },
  productBannerText: { fontSize: 13, color: Colors.primary, fontWeight: '600', flex: 1 },
  scroll: { padding: 20 },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    backgroundColor: Colors.white,
  },
})

const stateStyles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipSelected: { borderColor: Colors.primary, backgroundColor: '#EBF4FA' },
  text: { fontSize: 12, color: Colors.textSecondary },
  textSelected: { color: Colors.primary, fontWeight: '600' },
})

const reviewStyles = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  subheading: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20, lineHeight: 20 },
  section: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  rowValue: { fontSize: 13, color: Colors.text, fontWeight: '600', flex: 1, textAlign: 'right' },
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FEF3E8',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  disclaimerText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
})
