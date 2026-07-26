import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Card, StatusBadge } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'
import { getUser } from '../../services/auth'
import type { User, Policy, Claim, Quote } from '../../types'

interface DashboardData {
  policies: Policy[]
  claims: Claim[]
  quotes: Quote[]
  unreadCount: number
}

export function HomeScreen({ navigation }: any) {
  const [user, setUser] = useState<User | null>(null)
  const [data, setData] = useState<DashboardData>({
    policies: [],
    claims: [],
    quotes: [],
    unreadCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [u, policiesRes, claimsRes, quotesRes, notifRes] = await Promise.all([
        getUser(),
        api.get('/policies/my'),
        api.get('/claims/my'),
        api.get('/quotes/my'),
        api.get('/notifications/unread-count'),
      ])
      setUser(u)
      setData({
        policies: policiesRes.data,
        claims: claimsRes.data,
        quotes: quotesRes.data,
        unreadCount: notifRes.data.count,
      })
    } catch {}
  }, [])

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [fetchData])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const activePolicies = data.policies.filter((p) => p.status === 'active')
  const pendingClaims = data.claims.filter((c) =>
    ['submitted', 'in_review'].includes(c.status)
  )
  const pendingQuotes = data.quotes.filter((q) =>
    ['quote_sent', 'countered_by_admin'].includes(q.status)
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
      >

        {/* --- Header --- */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},
            </Text>
            <Text style={styles.name}>{user?.firstName} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
            {data.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {data.unreadCount > 9 ? '9+' : data.unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* --- Summary cards --- */}
        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, { backgroundColor: Colors.primary }]} padding={16}>
            <Ionicons name="shield-checkmark" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.summaryCount}>{activePolicies.length}</Text>
            <Text style={styles.summaryLabel}>Active Policies</Text>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: Colors.accent }]} padding={16}>
            <Ionicons name="document-text" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.summaryCount}>{pendingClaims.length}</Text>
            <Text style={styles.summaryLabel}>Pending Claims</Text>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: Colors.success }]} padding={16}>
            <Ionicons name="chatbubble-ellipses" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.summaryCount}>{pendingQuotes.length}</Text>
            <Text style={styles.summaryLabel}>Quotes Ready</Text>
          </Card>
        </View>

        {/* --- Quick actions --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {[
              { icon: 'shield-outline' as const, label: 'Get Covered', tab: 'Products' },
              { icon: 'add-circle-outline' as const, label: 'File Claim', tab: 'Claims' },
              { icon: 'chatbubble-outline' as const, label: 'Get Quote', tab: 'Products' },
              { icon: 'person-outline' as const, label: 'My Account', tab: 'Account' },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickAction}
                onPress={() => navigation.navigate(action.tab)}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name={action.icon} size={22} color={Colors.primary} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* --- Active policies --- */}
        {activePolicies.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Policies</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {activePolicies.slice(0, 2).map((policy) => (
              <Card key={policy.id} style={styles.policyCard} padding={16}>
                <View style={styles.policyRow}>
                  <View style={[styles.policyIcon, { backgroundColor: Colors.primaryLight }]}>
                    <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.policyInfo}>
                    <Text style={styles.policyName} numberOfLines={1}>
                      {policy.product.name}
                    </Text>
                    <Text style={styles.policyNumber}>{policy.policyNumber}</Text>
                  </View>
                  <StatusBadge status={policy.status} />
                </View>
                <View style={styles.policyMeta}>
                  <Text style={styles.policyMetaText}>
                    Expires {new Date(policy.expiryDate).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.policyPremium}>
                    ₦{parseFloat(policy.premiumPaid).toLocaleString('en-NG')}/yr
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* --- Pending quotes --- */}
        {pendingQuotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quotes Awaiting Response</Text>
            {pendingQuotes.slice(0, 2).map((quote) => (
              <Card key={quote.id} style={styles.quoteCard} padding={16}>
                <View style={styles.quoteRow}>
                  <View style={[styles.policyIcon, { backgroundColor: '#FEF3E8' }]}>
                    <Ionicons name="chatbubble-ellipses" size={20} color={Colors.accent} />
                  </View>
                  <View style={styles.policyInfo}>
                    <Text style={styles.policyName} numberOfLines={1}>
                      {quote.product.name}
                    </Text>
                    {quote.adminQuoteAmount && (
                      <Text style={styles.quoteAmount}>
                        ₦{parseFloat(quote.adminQuoteAmount).toLocaleString('en-NG')}/yr
                      </Text>
                    )}
                  </View>
                  <StatusBadge status={quote.status} />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* --- Empty state --- */}
        {activePolicies.length === 0 && pendingQuotes.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="shield-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>No policies yet</Text>
            <Text style={styles.emptySubtitle}>
              Browse our products and get covered in minutes.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Products')}
            >
              <Text style={styles.emptyButtonText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: { fontSize: 14, color: Colors.textSecondary, fontWeight: '400' },
  name: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 2 },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, color: Colors.white, fontWeight: '700' },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 4,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryCount: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 8,
  },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickAction: { flex: 1, alignItems: 'center' },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  policyCard: { marginBottom: 10 },
  quoteCard: { marginBottom: 10 },
  policyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  quoteRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  policyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyInfo: { flex: 1 },
  policyName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  policyNumber: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, fontFamily: 'monospace' },
  quoteAmount: { fontSize: 13, color: Colors.accent, fontWeight: '700', marginTop: 2 },
  policyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
  },
  policyMetaText: { fontSize: 12, color: Colors.textSecondary },
  policyPremium: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyButton: {
    marginTop: 20,
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: { fontSize: 14, fontWeight: '700', color: Colors.white },
})
