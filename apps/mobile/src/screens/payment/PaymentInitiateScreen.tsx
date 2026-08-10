import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as WebBrowser from 'expo-web-browser'
import * as ScreenCapture from 'expo-screen-capture'
import { Button, Card } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'

export function PaymentInitiateScreen({ route, navigation }: any) {
  const params = route.params || {}
  const { applicationId, product, amount: presetAmount } = params as any
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [paymentPlan, setPaymentPlan] = useState<'monthly' | 'annual'>('annual')
  const [appAmount, setAppAmount] = useState<string | null>(presetAmount || null)
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const annualAmount = product?.premiumAmount ? parseFloat(product.premiumAmount) : 0
  const monthlyAmount = annualAmount ? Math.ceil(annualAmount / 12) : 0
  const displayAmount = paymentPlan === 'monthly' ? monthlyAmount : annualAmount

  useEffect(() => {
    return () => clearInterval(pollRef.current)
  }, [])

  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync()
    return () => {
      ScreenCapture.allowScreenCaptureAsync()
    }
  }, [])

  if (!applicationId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={{ color: Colors.error, textAlign: 'center', padding: 20 }}>
            Missing application. Please go back and try again.
          </Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    )
  }

  async function handleInitiatePayment() {
    if (!applicationId) {
      setError('Missing application ID. Please go back and try again.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await api.post('/payments/initiate', {
        applicationId: String(applicationId),
        paymentPlan,
      })

      const checkoutUrl = res.data?.checkoutUrl
      const amount = res.data?.amount

      if (!checkoutUrl) {
        setError('Could not get payment URL. Please try again.')
        setLoading(false)
        return
      }

      if (amount) setAppAmount(String(amount))

      setLoading(false)

      await WebBrowser.openBrowserAsync(checkoutUrl)
      startPolling(String(applicationId))
    } catch (err: any) {
      setLoading(false)
      const message = err?.response?.data?.message
      const errorText = Array.isArray(message)
        ? message[0]
        : (message || 'Could not initiate payment. Please try again.')
      setError(errorText)
    }
  }

  function startPolling(appId: string) {
    if (pollRef.current) {
      clearInterval(pollRef.current)
    }
    setPolling(true)
    let attempts = 0
    const maxAttempts = 72

    pollRef.current = setInterval(async () => {
      attempts++
      try {
        const res = await api.get(`/payments/status/${appId}`)
        const { applicationStatus, payment } = res.data

        if (
          applicationStatus === 'paid' ||
          applicationStatus === 'issued' ||
          payment?.status === 'successful'
        ) {
          clearInterval(pollRef.current)
          setPolling(false)
          navigation.replace('PaymentSuccess', { applicationId: appId })
          return
        }

        if (payment?.status === 'failed') {
          clearInterval(pollRef.current)
          setPolling(false)
          setError('Payment failed. Please try again.')
          return
        }
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || status === 403) {
          clearInterval(pollRef.current)
          setPolling(false)
          setError('Session expired. Please log in again.')
          return
        }
        if (status === 404) {
          clearInterval(pollRef.current)
          setPolling(false)
          setError('Application not found. Please contact support.')
          return
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollRef.current)
        setPolling(false)
        Alert.alert(
          'Payment Pending',
          'Your payment is being processed. Check your policies in a few minutes.',
          [
            { text: 'Go to Policies', onPress: () => navigation.navigate('Policies') },
            { text: 'Stay Here', style: 'cancel' },
          ]
        )
      }
    }, 5000)
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color={Colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="card-outline" size={40} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Complete Payment</Text>
        <Text style={styles.subtitle}>
          You will be redirected to Monnify's secure checkout to complete your payment.
          After paying, return to this screen.
        </Text>

        <Card style={styles.summaryCard} padding={20}>
          {product && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Product</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>{product.name}</Text>
            </View>
          )}
          {(appAmount || displayAmount > 0) && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {paymentPlan === 'monthly' ? 'Monthly Premium' : 'Annual Premium'}
              </Text>
              <Text style={[styles.summaryValue, styles.premiumAmount]}>
                ₦{(appAmount ? parseFloat(String(appAmount)) : displayAmount).toLocaleString('en-NG')}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.summaryLabel}>Payment via</Text>
            <View style={styles.monnifyBadge}>
              <Text style={styles.monnifyText}>Monnify</Text>
            </View>
          </View>
        </Card>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {annualAmount > 0 && (
          <View style={styles.planSelector}>
            <Text style={styles.planLabel}>Payment Plan</Text>
            <View style={styles.planOptions}>
              <TouchableOpacity
                style={[styles.planOption, paymentPlan === 'annual' && styles.planOptionActive]}
                onPress={() => setPaymentPlan('annual')}
                activeOpacity={0.8}
              >
                <Text style={[styles.planName, paymentPlan === 'annual' && styles.planNameActive]}>Annual</Text>
                <Text style={[styles.planAmount, paymentPlan === 'annual' && styles.planAmountActive]}>
                  ₦{annualAmount.toLocaleString('en-NG')}
                </Text>
                <Text style={styles.planPeriod}>per year</Text>
                <Text style={styles.planSave}>Best value</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.planOption, paymentPlan === 'monthly' && styles.planOptionActive]}
                onPress={() => setPaymentPlan('monthly')}
                activeOpacity={0.8}
              >
                <Text style={[styles.planName, paymentPlan === 'monthly' && styles.planNameActive]}>Monthly</Text>
                <Text style={[styles.planAmount, paymentPlan === 'monthly' && styles.planAmountActive]}>
                  ₦{monthlyAmount.toLocaleString('en-NG')}
                </Text>
                <Text style={styles.planPeriod}>per month</Text>
                <Text style={styles.planSave}>₦{(monthlyAmount * 12).toLocaleString('en-NG')}/yr</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {polling ? (
          <View style={styles.pollingBox}>
            <ActivityIndicator color={Colors.primary} size="small" />
            <View style={styles.pollingContent}>
              <Text style={styles.pollingTitle}>Confirming payment...</Text>
              <Text style={styles.pollingText}>
                Please wait while we confirm your payment. This may take a moment.
              </Text>
            </View>
          </View>
        ) : (
          <>
            <Button
              title={loading ? 'Opening Checkout...' : 'Pay Now'}
              onPress={handleInitiatePayment}
              loading={loading}
              style={{ marginTop: 8 }}
            />
            {!loading && (
              <TouchableOpacity
                style={styles.manualCheck}
                onPress={() => startPolling(applicationId)}
              >
                <Text style={styles.manualCheckText}>
                  Already paid? Check payment status
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <Text style={styles.secureNote}>
          🔒 Secured by Monnify · Card & bank transfer accepted
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 20 },
  backText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#EBF4FA', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  summaryCard: { marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F4F8',
  },
  summaryLabel: { fontSize: 13, color: Colors.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: '600', color: Colors.text, flex: 1, textAlign: 'right', marginLeft: 12 },
  premiumAmount: { fontSize: 18, color: Colors.primary, fontWeight: '800' },
  monnifyBadge: { backgroundColor: '#EBF4FA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  monnifyText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.errorLight, borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.error },
  pollingBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#EBF4FA', borderRadius: 12, padding: 16, marginBottom: 16,
  },
  pollingContent: { flex: 1 },
  pollingTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  pollingText: { fontSize: 13, color: Colors.primary, lineHeight: 20 },
  manualCheck: { alignItems: 'center', marginTop: 12 },
  manualCheckText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  secureNote: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: 16 },
  planSelector: { marginBottom: 20 },
  planLabel: { fontSize: 14, fontWeight: '700', color: Colors.textDark, marginBottom: 10 },
  planOptions: { flexDirection: 'row', gap: 12 },
  planOption: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
  },
  planOptionActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  planName: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 4 },
  planNameActive: { color: Colors.textDark },
  planAmount: { fontSize: 20, fontWeight: '800', color: Colors.textSecondary },
  planAmountActive: { color: Colors.textDark },
  planPeriod: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  planSave: { fontSize: 11, color: Colors.success, fontWeight: '600', marginTop: 6 },
})
