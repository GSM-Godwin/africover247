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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'
import type { Product, AssetField } from '../../types'

function parseAssetFields(raw: string | AssetField[] | null): AssetField[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try { return JSON.parse(raw) } catch { return [] }
}

export function QuoteRequestScreen({ route, navigation }: any) {
  const { product }: { product: Product } = route.params
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fields = parseAssetFields(product.assetFields)

  function handleChange(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  async function handleSubmit() {
    const missing = fields.filter((f) => f.required && !values[f.key]).map((f) => f.label)
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(', ')}`)
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/quotes', {
        productId: product.id,
        customerDetails: values,
      })
      navigation.replace('QuoteSuccess', { productName: product.name })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not submit quote request.')
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
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Request a Quote</Text>
          <Text style={styles.subtitle}>{product.name}</Text>
          <Text style={styles.info}>
            Fill in your details and AfriGlobal will respond within 3 business days.
          </Text>
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

          {fields.map((field) => (
            <View key={field.key} style={styles.field}>
              <Text style={styles.fieldLabel}>
                {field.label}
                {field.required && <Text style={{ color: Colors.error }}> *</Text>}
              </Text>

              {field.type === 'select' ? (
                <View style={styles.selectContainer}>
                  {field.options?.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.option,
                        values[field.key] === opt && styles.optionSelected,
                      ]}
                      onPress={() => handleChange(field.key, opt)}
                    >
                      <Text style={[
                        styles.optionText,
                        values[field.key] === opt && styles.optionTextSelected,
                      ]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <TextInput
                  style={[styles.input, field.type === 'textarea' && styles.inputMultiline]}
                  value={values[field.key] || ''}
                  onChangeText={(val) => handleChange(field.key, val)}
                  placeholder={field.hint || `Enter ${field.label.toLowerCase()}`}
                  placeholderTextColor={Colors.textSecondary + '80'}
                  keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                  multiline={field.type === 'textarea'}
                  numberOfLines={field.type === 'textarea' ? 4 : 1}
                />
              )}

              {field.hint && field.type !== 'textarea' && (
                <Text style={styles.hint}>{field.hint}</Text>
              )}
            </View>
          ))}

          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>What happens next?</Text>
            <Text style={styles.infoBoxText}>
              AfriGlobal will review your details and respond with a tailored quote within 3 business days.
              You will be notified by email, SMS, and push notification.
            </Text>
          </View>

          <Button
            title="Submit Quote Request"
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  backText: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginBottom: 8 },
  info: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  scroll: { padding: 20 },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: Colors.error, fontSize: 13, fontWeight: '500' },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8 },
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
  inputMultiline: { height: 100, textAlignVertical: 'top' },
  hint: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  selectContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: '#EBF4FA' },
  optionText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  optionTextSelected: { color: Colors.primary, fontWeight: '700' },
  infoBox: {
    backgroundColor: '#F0F4F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoBoxTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  infoBoxText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
})
