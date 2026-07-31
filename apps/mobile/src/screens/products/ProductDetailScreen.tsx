import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Button, Card } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'
import type { Product, AssetField } from '../../types'

function parseAssetFields(raw: string | AssetField[] | null): AssetField[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try { return JSON.parse(raw) } catch { return [] }
}

function AssetModal({
  visible,
  product,
  onClose,
  onConfirm,
}: {
  visible: boolean
  product: Product
  onClose: () => void
  onConfirm: (values: Record<string, string>, premium: number) => void
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [premium, setPremium] = useState<number | null>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupMessage, setLookupMessage] = useState('')
  const fields = parseAssetFields(product.assetFields)
  const rate = product.rate ? parseFloat(product.rate) : null

  function handleChange(key: string, val: string) {
    const next = { ...values, [key]: val }
    setValues(next)

    if (rate) {
      const valueField = fields.find(
        (f) =>
          f.key.toLowerCase().includes('value') ||
          f.key.toLowerCase().includes('amount') ||
          f.key.toLowerCase().includes('assured')
      )
      if (valueField) {
        const raw = parseFloat(next[valueField.key] || '0')
        setPremium(raw > 0 ? raw * rate : null)
      }
    }
  }

  async function handleVehicleLookup(plateNumber: string) {
    if (!plateNumber || plateNumber.length < 5) return
    setLookingUp(true)
    setLookupMessage('')
    try {
      const res = await api.post('/applications/verify-vehicle', {
        plateNumber: plateNumber.toUpperCase(),
      })
      const { verified, data, message } = res.data

      if (verified && data) {
        const updates: Record<string, string> = {}
        if (data.make) updates.vehicleMake = data.make
        if (data.model) updates.vehicleModel = data.model
        if (data.year) updates.vehicleYear = String(data.year)
        if (data.colour) updates.vehicleColour = data.colour
        if (data.engineNumber) updates.engineNumber = data.engineNumber
        if (data.chassisNumber) updates.chassisNumber = data.chassisNumber
        setValues((prev) => ({ ...prev, ...updates }))
        setLookupMessage('Vehicle details filled automatically.')
      } else {
        setLookupMessage(message || 'Vehicle not found. Please fill in manually.')
      }
    } catch {
      setLookupMessage('Lookup failed. Please fill in manually.')
    } finally {
      setLookingUp(false)
    }
  }

  function handleConfirm() {
    const missing = fields.filter((f) => f.required && !values[f.key]).map((f) => f.label)
    if (missing.length > 0) return
    onConfirm(values, premium || 0)
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={modalStyles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >

          {/* --- Header --- */}
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Asset Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={modalStyles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {fields.map((field) => (
              <View key={field.key} style={modalStyles.field}>
                <Text style={modalStyles.fieldLabel}>
                  {field.label}
                  {field.required && <Text style={{ color: Colors.error }}> *</Text>}
                </Text>

                {field.type === 'select' ? (
                  <View style={modalStyles.selectContainer}>
                    {field.options?.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          modalStyles.option,
                          values[field.key] === opt && modalStyles.optionSelected,
                        ]}
                        onPress={() => handleChange(field.key, opt)}
                      >
                        <Text style={[
                          modalStyles.optionText,
                          values[field.key] === opt && modalStyles.optionTextSelected,
                        ]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : field.type === 'textarea' ? (
                  <TextInput
                    style={modalStyles.input}
                    value={values[field.key] || ''}
                    onChangeText={(val) => handleChange(field.key, val)}
                    placeholder={field.hint || `Enter ${field.label.toLowerCase()}`}
                    placeholderTextColor={Colors.textSecondary + '80'}
                    multiline
                    numberOfLines={3}
                  />
                ) : field.key === 'plateNumber' ? (
                  <View>
                    <View style={modalStyles.plateRow}>
                      <TextInput
                        style={[modalStyles.input, { flex: 1 }]}
                        value={values[field.key] || ''}
                        onChangeText={(val) => handleChange(field.key, val.toUpperCase())}
                        placeholder={field.hint || 'e.g. ABC123XY'}
                        placeholderTextColor={Colors.textSecondary + '80'}
                        autoCapitalize="characters"
                      />
                      <TouchableOpacity
                        style={[
                          modalStyles.lookupButton,
                          (lookingUp || !values[field.key]) && { opacity: 0.4 },
                        ]}
                        onPress={() => handleVehicleLookup(values[field.key] || '')}
                        disabled={lookingUp || !values[field.key]}
                      >
                        <Text style={modalStyles.lookupButtonText}>
                          {lookingUp ? '...' : 'Auto-fill'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {lookupMessage ? (
                      <Text style={[
                        modalStyles.lookupMessage,
                        {
                          color: lookupMessage.includes('automatically')
                            ? Colors.success
                            : Colors.error,
                        },
                      ]}>
                        {lookupMessage}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <TextInput
                    style={modalStyles.input}
                    value={values[field.key] || ''}
                    onChangeText={(val) => handleChange(field.key, val)}
                    placeholder={field.hint || `Enter ${field.label.toLowerCase()}`}
                    placeholderTextColor={Colors.textSecondary + '80'}
                    keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                  />
                )}

                {field.hint && field.type !== 'textarea' && field.key !== 'plateNumber' && (
                  <Text style={modalStyles.hint}>{field.hint}</Text>
                )}
              </View>
            ))}

            {premium !== null && rate && (
              <View style={modalStyles.premiumBox}>
                <Text style={modalStyles.premiumLabel}>Calculated Premium</Text>
                <Text style={modalStyles.premiumValue}>
                  ₦{premium.toLocaleString('en-NG')}/year
                </Text>
                <Text style={modalStyles.premiumFormula}>
                  {`Value × ${parseFloat(product.rate!) * 100}% = ₦${premium.toLocaleString('en-NG')}`}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={modalStyles.actions}>
            <Button title="Cancel" onPress={onClose} variant="outline" fullWidth={false} style={{ flex: 1 }} />
            <Button title="Continue" onPress={handleConfirm} style={{ flex: 1 }} />
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  scroll: { padding: 20, paddingBottom: 40 },
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
  hint: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lookupButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  lookupButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  lookupMessage: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  selectContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.white,
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: '#EBF4FA' },
  optionText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  optionTextSelected: { color: Colors.primary, fontWeight: '700' },
  premiumBox: {
    backgroundColor: '#EBF4FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  premiumLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  premiumValue: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  premiumFormula: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, fontStyle: 'italic' },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
  },
})

export function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    api.get(`/products/${productId}`)
      .then((res) => setProduct(res.data))
      .catch(() => navigation.goBack())
      .finally(() => setLoading(false))
  }, [productId, navigation])

  async function handleGetCovered(assetDetails?: Record<string, string>) {
    if (!product) return
    setStarting(true)
    try {
      const res = await api.post('/applications', {
        productId: product.id,
        assetDetails,
      })
      setStarting(false)
      navigation.navigate('ApplicationWizard', {
        applicationId: res.data.id,
        product,
      })
    } catch (err: any) {
      setStarting(false)
      const message = err?.response?.data?.message
      const msg = Array.isArray(message) ? message.join(' ') : String(message ?? '')
      if (msg.includes('draft') || msg.includes('existing')) {
        const draftsRes = await api.get('/applications/drafts')
        const existing = draftsRes.data.find(
          (d: any) => d.product?.id === product.id && d.status === 'draft'
        )
        if (existing) {
          navigation.navigate('ApplicationWizard', {
            applicationId: existing.id,
            product,
          })
        }
      }
    }
  }

  function handleCTA() {
    if (!product) return
    if (product.pricingType === 'quote_based') {
      navigation.navigate('QuoteRequest', { product })
    } else if (product.pricingType === 'calculable') {
      setShowAssetModal(true)
    } else {
      handleGetCovered()
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  if (!product) return null

  const coverageItems = product.coverageHighlights.split('\n').filter(Boolean)
  const exclusionItems = product.exclusions.split('\n').filter(Boolean)
  const requiredDocs = product.requiredDocuments.split('\n').filter(Boolean)

  function getPriceDisplay(): string {
    if (product!.pricingType === 'fixed' && product!.premiumAmount) {
      return `₦${parseFloat(product!.premiumAmount).toLocaleString('en-NG')}/year`
    }
    if (product!.pricingType === 'calculable' && product!.rate) {
      return `${parseFloat(product!.rate) * 100}% of ${product!.calculationBasis}`
    }
    return 'Premium by quote'
  }

  function getCtaLabel(): string {
    if (product!.pricingType === 'quote_based') return 'Get a Quote'
    if (product!.pricingType === 'calculable') return 'Enter Asset Details'
    return 'Get Covered'
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* --- Back button --- */}
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color={Colors.primary} />
        <Text style={styles.backText}>Products</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* --- Hero --- */}
        <View style={styles.hero}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
            <View style={[styles.pricingBadge, {
              backgroundColor: product.pricingType === 'fixed'
                ? '#EBF4FA'
                : product.pricingType === 'calculable'
                ? '#E8F5F0'
                : '#FEF3E8',
            }]}>
              <Text style={[styles.pricingText, {
                color: product.pricingType === 'fixed'
                  ? Colors.primary
                  : product.pricingType === 'calculable'
                  ? Colors.success
                  : Colors.accent,
              }]}>
                {product.pricingType === 'fixed' ? 'Fixed Price'
                  : product.pricingType === 'calculable' ? 'Rate Based'
                  : 'Quote Only'}
              </Text>
            </View>
          </View>

          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDesc}>{product.description}</Text>

          {/* --- Price --- */}
          <Card style={styles.priceCard} padding={16}>
            <Text style={styles.priceLabel}>Annual Premium</Text>
            <Text style={styles.priceValue}>{getPriceDisplay()}</Text>
            {product.pricingType === 'calculable' && (
              <Text style={styles.priceNote}>
                * Premium calculated automatically based on your asset value
              </Text>
            )}
            {product.pricingType === 'quote_based' && (
              <Text style={styles.priceNote}>
                * Premium determined by AfriGlobal after reviewing your details
              </Text>
            )}
          </Card>
        </View>

        {/* --- Coverage --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Covered</Text>
          {coverageItems.map((item, i) => (
            <View key={i} style={styles.coverageItem}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.coverageText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* --- Exclusions --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Not Covered</Text>
          {exclusionItems.map((item, i) => (
            <View key={i} style={styles.coverageItem}>
              <Ionicons name="close-circle" size={18} color={Colors.error} />
              <Text style={styles.coverageText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* --- Required documents --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          {requiredDocs.map((doc, i) => (
            <View key={i} style={styles.coverageItem}>
              <Ionicons name="document-outline" size={18} color={Colors.primary} />
              <Text style={styles.coverageText}>{doc}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* --- Sticky CTA --- */}
      <View style={styles.stickyBottom}>
        <Button
          title={starting ? 'Starting...' : getCtaLabel()}
          onPress={handleCTA}
          loading={starting}
          variant={product.pricingType === 'quote_based' ? 'secondary' : 'primary'}
        />
        <Text style={styles.securedText}>Secured by Monnify · AfriGlobal Insurance</Text>
      </View>

      {product.pricingType === 'calculable' && (
        <AssetModal
          visible={showAssetModal}
          product={product}
          onClose={() => setShowAssetModal(false)}
          onConfirm={(values) => {
            setShowAssetModal(false)
            handleGetCovered(values)
          }}
        />
      )}

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EBF4FA',
  },
  categoryText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  pricingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  pricingText: { fontSize: 11, fontWeight: '600' },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  productDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  priceCard: {
    borderWidth: 1,
    borderColor: Colors.primary + '20',
    marginBottom: 20,
  },
  priceLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  priceValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  priceNote: { fontSize: 11, color: Colors.textSecondary, marginTop: 6, fontStyle: 'italic' },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  coverageItem: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  coverageText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 20 },
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  securedText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
})
