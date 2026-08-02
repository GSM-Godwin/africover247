import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Button, Card, StatusBadge, ConfirmModal, NumberInput } from '../../components/ui'
import { QuoteCountdown } from '../../components/shared/QuoteCountdown'
import { Colors } from '../../constants'
import api from '../../services/api'
import type { Quote, NegotiationEntry } from '../../types'

const MAX_ROUNDS = 3

function decodeHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/g, '/')
}

export function QuoteDetailScreen({ route, navigation }: any) {
  const params = route.params || {}
  const { quoteId } = params as any
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCounter, setShowCounter] = useState(false)
  const [counterAmount, setCounterAmount] = useState('')
  const [counterNote, setCounterNote] = useState('')
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean
    title: string
    message: string
    onConfirm: () => void
    destructive?: boolean
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const fetchQuote = useCallback(async () => {
    try {
      const res = await api.get(`/quotes/${quoteId}`)
      setQuote(res.data)
    } catch {
      navigation.goBack()
    }
  }, [quoteId, navigation])

  useEffect(() => {
    fetchQuote().finally(() => setLoading(false))
  }, [fetchQuote])

  function handleAccept() {
    const amount = quote?.adminQuoteAmount || quote?.customerCounterAmount
    if (!amount) return

    setConfirmModal({
      visible: true,
      title: 'Accept Quote',
      message: `Accept this quote for ₦${parseFloat(amount).toLocaleString('en-NG')}/year and proceed to payment?`,
      onConfirm: confirmAccept,
    })
  }

  async function confirmAccept() {
    setSubmitting(true)
    try {
      const res = await api.post(`/quotes/${quoteId}/accept`)
      setSubmitting(false)
      navigation.replace('PaymentInitiate', {
        applicationId: res.data.applicationId,
        amount: res.data.amount,
        product: quote?.product,
      })
    } catch (err: any) {
      setSubmitting(false)
      setConfirmModal({
        visible: true,
        title: 'Error',
        message: err.response?.data?.message || 'Could not accept quote.',
        onConfirm: () => {},
      })
    }
  }

  function handleReject() {
    setConfirmModal({
      visible: true,
      title: 'Decline Quote',
      message: 'Are you sure you want to decline this quote?',
      onConfirm: confirmReject,
      destructive: true,
    })
  }

  async function confirmReject() {
    setSubmitting(true)
    try {
      await api.post(`/quotes/${quoteId}/reject`)
      setSubmitting(false)
      navigation.goBack()
    } catch (err: any) {
      setSubmitting(false)
    }
  }

  async function handleCounter() {
    if (!counterAmount || parseFloat(counterAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid counter amount.')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/quotes/${quoteId}/counter`, {
        counterAmount: parseFloat(counterAmount),
        note: counterNote || undefined,
      })
      setShowCounter(false)
      setCounterAmount('')
      setCounterNote('')
      await fetchQuote()
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not submit counter-offer.')
    } finally {
      setSubmitting(false)
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

  if (!quote) return null

  const currentAmount = quote.adminQuoteAmount || quote.customerCounterAmount
  const canAct = ['quote_sent', 'countered_by_admin'].includes(quote.status)
  const isAccepted = quote.status === 'accepted'
  const isTerminal = ['accepted', 'rejected', 'expired'].includes(quote.status)
  const roundsRemaining = MAX_ROUNDS - quote.roundsUsed
  const history: NegotiationEntry[] = Array.isArray(quote.negotiationHistory)
    ? quote.negotiationHistory
    : []

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* --- Back + header --- */}
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← My Quotes</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerInfo}>
                <Text style={styles.category}>{quote.product.category}</Text>
                <Text style={styles.productName}>{quote.product.name}</Text>
              </View>
              <StatusBadge status={quote.status} />
            </View>

            {currentAmount && (
              <Card style={styles.offerCard} padding={16}>
                <Text style={styles.offerLabel}>
                  {isAccepted ? 'Agreed premium' : 'Current offer'}
                </Text>
                <Text style={styles.offerAmount}>
                  ₦{parseFloat(currentAmount).toLocaleString('en-NG')}
                  <Text style={styles.offerPer}>/year</Text>
                </Text>
                {quote.expiresAt && canAct && (
                  <Text style={styles.expiryText}>
                    Expires {new Date(quote.expiresAt).toLocaleDateString('en-NG')}
                  </Text>
                )}
              </Card>
            )}

            {!isTerminal && quote.createdAt && (
              <QuoteCountdown createdAt={quote.createdAt} deadlineDays={3} />
            )}
          </View>

          {history.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Negotiation History</Text>
              {[...history].reverse().map((entry, i) => (
                <View key={i} style={styles.historyItem}>
                  <View style={[
                    styles.historyDot,
                    { backgroundColor: entry.actor === 'admin' ? Colors.primary : Colors.accent },
                  ]} />
                  <View style={styles.historyContent}>
                    <View style={styles.historyMeta}>
                      <Text style={styles.historyActor}>
                        {entry.actor === 'admin' ? 'AfriGlobal' : 'You'}
                      </Text>
                      <Text style={styles.historyDate}>
                        {new Date(entry.timestamp).toLocaleDateString('en-NG')}
                      </Text>
                    </View>
                    <Text style={styles.historyAction}>
                      {entry.action.replace(/_/g, ' ')}
                      {entry.amount
                        ? ` — ₦${entry.amount.toLocaleString('en-NG')}/yr`
                        : ''}
                    </Text>
                    {entry.note && (
                      <Text style={styles.historyNote}>"{decodeHtml(entry.note)}"</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {showCounter && canAct && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Counter-Offer</Text>
              <NumberInput
                value={counterAmount}
                onChangeText={setCounterAmount}
                placeholder="Your proposed amount (₦/year)"
                prefix="₦"
              />
              <TextInput
                style={[styles.counterInput, styles.counterNote]}
                value={counterNote}
                onChangeText={setCounterNote}
                placeholder="Note (optional)"
                placeholderTextColor={Colors.textSecondary + '80'}
                multiline
                numberOfLines={3}
              />
              <Text style={styles.roundsText}>
                {roundsRemaining} round{roundsRemaining !== 1 ? 's' : ''} remaining
              </Text>
              <View style={styles.counterActions}>
                <Button
                  title="Cancel"
                  onPress={() => setShowCounter(false)}
                  variant="outline"
                  fullWidth={false}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Submit Counter"
                  onPress={handleCounter}
                  loading={submitting}
                  fullWidth={false}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {canAct && !showCounter && (
            <View style={styles.actionsSection}>
              <Button
                title={`Accept — ₦${parseFloat(currentAmount || '0').toLocaleString('en-NG')}/yr`}
                onPress={handleAccept}
                loading={submitting}
              />
              {roundsRemaining > 0 && (
                <Button
                  title={`Counter (${roundsRemaining} left)`}
                  onPress={() => setShowCounter(true)}
                  variant="secondary"
                  style={{ marginTop: 10 }}
                />
              )}
              <Button
                title="Decline"
                onPress={handleReject}
                variant="outline"
                style={{ marginTop: 10, borderColor: Colors.error }}
              />
            </View>
          )}

          {isAccepted && quote.finalAmount && (
            <View style={styles.acceptedBox}>
              <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
              <Text style={styles.acceptedTitle}>Quote Accepted</Text>
              <Text style={styles.acceptedAmount}>
                ₦{parseFloat(quote.finalAmount).toLocaleString('en-NG')}/year
              </Text>
              <Button
                title="Proceed to Payment"
                onPress={async () => {
                  try {
                    const res = await api.get(`/applications?quoteId=${quote.id}`)
                    const application = Array.isArray(res.data) ? res.data[0] : res.data
                    if (application?.id) {
                      navigation.navigate('PaymentInitiate', {
                        applicationId: application.id,
                        amount: quote.finalAmount,
                        product: quote.product,
                      })
                    } else {
                      Alert.alert('Error', 'Could not find application. Please contact support.')
                    }
                  } catch {
                    Alert.alert('Error', 'Could not proceed to payment.')
                  }
                }}
                style={{ marginTop: 16 }}
              />
            </View>
          )}

          {['rejected', 'expired'].includes(quote.status) && (
            <View style={styles.rejectedBox}>
              <Ionicons name="close-circle" size={32} color={Colors.error} />
              <Text style={styles.rejectedTitle}>
                {quote.status === 'expired' ? 'Quote Expired' : 'Quote Declined'}
              </Text>
              <Text style={styles.rejectedSubtitle}>
                {quote.status === 'expired'
                  ? 'This quote has expired. Request a new one.'
                  : 'This quote has been declined.'}
              </Text>
              <Button
                title="Request New Quote"
                onPress={() => navigation.navigate('ProductsList')}
                variant="outline"
                style={{ marginTop: 16 }}
              />
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        onClose={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
        actions={[
          {
            label: 'Cancel',
            style: 'cancel',
            onPress: () => {},
          },
          {
            label: confirmModal.destructive ? 'Decline' : confirmModal.title === 'Error' ? 'OK' : 'Confirm',
            style: confirmModal.destructive ? 'destructive' : 'default',
            onPress: confirmModal.onConfirm,
          },
        ]}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  back: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerInfo: { flex: 1, marginRight: 12 },
  category: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  productName: { fontSize: 20, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  offerCard: { borderWidth: 1, borderColor: Colors.primary + '20' },
  offerLabel: { fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  offerAmount: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  offerPer: { fontSize: 14, fontWeight: '400', color: Colors.textSecondary },
  expiryText: { fontSize: 11, color: Colors.textSecondary, marginTop: 6 },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  historyItem: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  historyDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  historyContent: { flex: 1 },
  historyMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  historyActor: { fontSize: 13, fontWeight: '700', color: Colors.text },
  historyDate: { fontSize: 11, color: Colors.textSecondary },
  historyAction: { fontSize: 13, color: Colors.textSecondary, textTransform: 'capitalize' },
  historyNote: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 4 },
  counterInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 12,
  },
  counterNote: { height: 80, textAlignVertical: 'top' },
  roundsText: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  counterActions: { flexDirection: 'row', gap: 10 },
  actionsSection: { padding: 20 },
  acceptedBox: {
    margin: 20,
    padding: 24,
    backgroundColor: Colors.successLight,
    borderRadius: 16,
    alignItems: 'center',
  },
  acceptedTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 8 },
  acceptedAmount: { fontSize: 22, fontWeight: '800', color: Colors.success, marginTop: 4 },
  rejectedBox: {
    margin: 20,
    padding: 24,
    backgroundColor: Colors.errorLight,
    borderRadius: 16,
    alignItems: 'center',
  },
  rejectedTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 8 },
  rejectedSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 6 },
})
