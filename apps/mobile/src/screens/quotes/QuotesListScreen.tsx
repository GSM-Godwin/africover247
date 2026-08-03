import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Card, StatusBadge } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'
import type { Quote } from '../../types'

const ACTION_NEEDED = ['quote_sent', 'countered_by_admin']

export function QuotesListScreen({ navigation }: any) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await api.get('/quotes/my')
      setQuotes(res.data)
    } catch {}
  }, [])

  useEffect(() => {
    fetchQuotes().finally(() => setLoading(false))
  }, [fetchQuotes])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchQuotes()
    setRefreshing(false)
  }

  function renderQuote({ item }: { item: Quote }) {
    const needsAction = ACTION_NEEDED.includes(item.status)
    const amount = item.adminQuoteAmount || item.customerCounterAmount

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('QuoteDetail', { quoteId: item.id })}
        activeOpacity={0.85}
      >
        <Card style={[styles.quoteCard, needsAction && styles.quoteCardUrgent]} padding={16}>
          {needsAction && (
            <View style={styles.urgentBanner}>
              <Ionicons name="alert-circle" size={14} color={Colors.accent} />
              <Text style={styles.urgentText}>Action needed</Text>
            </View>
          )}
          <View style={styles.quoteHeader}>
            <View style={styles.quoteIcon}>
              <Ionicons name="chatbubble-ellipses" size={18} color={Colors.primary} />
            </View>
            <View style={styles.quoteInfo}>
              <Text style={styles.quoteName} numberOfLines={1}>{item.product.name}</Text>
              <Text style={styles.quoteCategory}>{item.product.category}</Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
          {amount && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>
                {item.status === 'accepted' ? 'Agreed premium' : 'Current offer'}
              </Text>
              <Text style={styles.amountValue}>
                ₦{parseFloat(amount).toLocaleString('en-NG')}/yr
              </Text>
            </View>
          )}
          <Text style={styles.quoteDate}>
            {new Date(item.createdAt).toLocaleDateString('en-NG', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </Text>
        </Card>
      </TouchableOpacity>
    )
  }

  const actionNeeded = quotes.filter((q) => ACTION_NEEDED.includes(q.status))
  const others = quotes.filter((q) => !ACTION_NEEDED.includes(q.status))
  const sorted = [...actionNeeded, ...others]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Quotes</Text>
        {actionNeeded.length > 0 && (
          <Text style={styles.urgentCount}>
            {actionNeeded.length} requiring response
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={sorted}
          renderItem={renderQuote}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No quotes yet</Text>
              <Text style={styles.emptySubtitle}>
                Request a quote on any insurance product to get started.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('ProductsList')}
              >
                <Text style={styles.emptyButtonText}>Browse Products</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  urgentCount: { fontSize: 13, color: Colors.accent, fontWeight: '600', marginTop: 2 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  quoteCard: { marginBottom: 0 },
  quoteCardUrgent: { borderWidth: 1.5, borderColor: Colors.accent + '40' },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  urgentText: { fontSize: 12, color: Colors.accent, fontWeight: '700' },
  quoteHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  quoteIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EBF4FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteInfo: { flex: 1 },
  quoteName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  quoteCategory: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    marginBottom: 6,
  },
  amountLabel: { fontSize: 12, color: Colors.textSecondary },
  amountValue: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  quoteDate: { fontSize: 11, color: Colors.textSecondary },
  emptyState: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyButton: {
    marginTop: 20,
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
})
