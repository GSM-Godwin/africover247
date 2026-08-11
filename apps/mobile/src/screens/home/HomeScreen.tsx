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
import type { User, Policy, Claim, Quote, Product } from '../../types'

interface Application {
  id: string
  status: string
  stepCompleted: number
  createdAt: string
  product: { name: string; category: string }
}

interface DashboardData {
  policies: Policy[]
  claims: Claim[]
  quotes: Quote[]
  drafts: Application[]
  unreadCount: number
}

export function HomeScreen({ navigation }: any) {
  const [user, setUser] = useState<User | null>(null)
  const [data, setData] = useState<DashboardData>({
    policies: [],
    claims: [],
    quotes: [],
    drafts: [],
    unreadCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])

  const fetchData = useCallback(async () => {
    try {
      const [u, policiesRes, claimsRes, quotesRes, notifRes, draftsRes, productsRes] = await Promise.all([
        getUser(),
        api.get('/policies/my'),
        api.get('/claims/my'),
        api.get('/quotes/my'),
        api.get('/notifications/unread-count'),
        api.get('/applications/drafts').catch(() => ({ data: [] })),
        api.get('/products').catch(() => ({ data: [] })),
      ])
      setUser(u)
      const seen = new Set<string>()
      const unique = productsRes.data.filter((p: Product) => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })
      setFeaturedProducts(unique.slice(0, 4))
      setData({
        policies: policiesRes.data,
        claims: claimsRes.data,
        quotes: quotesRes.data,
        drafts: draftsRes.data,
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
  const pendingClaims = data.claims.filter((c) => ['submitted', 'in_review'].includes(c.status))
  const pendingQuotes = data.quotes.filter((q) => ['quote_sent', 'countered_by_admin'].includes(q.status))
  const drafts = data.drafts.filter((d) => d.status === 'draft')

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

        <View style={styles.summaryRow}>
          {[
            {
              icon: 'shield-checkmark' as const,
              count: activePolicies.length,
              label: 'Active Policies',
              iconBg: Colors.primaryLight,
              iconColor: Colors.primary,
              onPress: () => navigation.navigate('Policies'),
            },
            {
              icon: 'document-text' as const,
              count: pendingClaims.length,
              label: 'Pending Claims',
              iconBg: Colors.accentLight,
              iconColor: Colors.accent,
              onPress: () => navigation.navigate('Claims'),
            },
            {
              icon: 'chatbubble-ellipses' as const,
              count: pendingQuotes.length,
              label: 'Quotes Ready',
              iconBg: Colors.successLight,
              iconColor: Colors.success,
              onPress: () => navigation.navigate('Products', { screen: 'QuotesList' }),
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.summaryCardWrapper}
              onPress={item.onPress}
              activeOpacity={0.85}
            >
              <Card style={styles.summaryCard} padding={14}>
                <View style={[styles.summaryIconCircle, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={18} color={item.iconColor} />
                </View>
                <Text style={styles.summaryCount}>{item.count}</Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {activePolicies.length === 0 && pendingQuotes.length === 0 && drafts.length === 0 && featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Get Started</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Products')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionSubtitle}>
              Browse our insurance products and get covered today.
            </Text>
            {featuredProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                onPress={() => navigation.navigate('Products', {
                  screen: 'ProductDetail',
                  params: { productId: product.id },
                })}
                activeOpacity={0.85}
              >
                <Card style={styles.featuredProduct} padding={14}>
                  <View style={styles.featuredRow}>
                    <View style={[styles.featuredIcon, { backgroundColor: Colors.primaryLight }]}>
                      <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
                    </View>
                    <View style={styles.featuredInfo}>
                      <Text style={styles.featuredName} numberOfLines={1}>{product.name}</Text>
                      <Text style={styles.featuredCategory}>{product.category}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {[
              { icon: 'shield-outline' as const, label: 'Get Covered', onPress: () => navigation.navigate('Products') },
              { icon: 'add-circle-outline' as const, label: 'File Claim', onPress: () => navigation.navigate('Claims') },
              { icon: 'chatbubble-outline' as const, label: 'Get Quote', onPress: () => navigation.navigate('Products') },
              { icon: 'person-outline' as const, label: 'My Account', onPress: () => navigation.navigate('Account') },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickAction}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name={action.icon} size={22} color={Colors.primary} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {drafts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continue Application</Text>
              {drafts.length > 1 && (
                <TouchableOpacity onPress={() => navigation.navigate('Drafts')}>
                  <Text style={styles.seeAll}>See all ({drafts.length})</Text>
                </TouchableOpacity>
              )}
            </View>
            {drafts.slice(0, 1).map((draft) => (
              <TouchableOpacity
                key={draft.id}
                onPress={() => navigation.navigate('ApplicationWizard', {
                  applicationId: draft.id,
                  product: draft.product,
                })}
                activeOpacity={0.85}
              >
                <Card style={styles.draftCard} padding={16}>
                  <View style={styles.draftRow}>
                    <View style={[styles.policyIcon, { backgroundColor: '#FEF3E8' }]}>
                      <Ionicons name="document-text-outline" size={20} color={Colors.accent} />
                    </View>
                    <View style={styles.policyInfo}>
                      <Text style={styles.policyName} numberOfLines={1}>
                        {draft.product.name}
                      </Text>
                      <Text style={styles.draftStep}>
                        Step {draft.stepCompleted} of 4 completed
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[
                      styles.progressBar,
                      { width: `${(draft.stepCompleted / 4) * 100}%` as `${number}%` },
                    ]} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activePolicies.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Policies</Text>
              {activePolicies.length > 1 && (
                <TouchableOpacity onPress={() => navigation.navigate('Policies')}>
                  <Text style={styles.seeAll}>See all ({activePolicies.length})</Text>
                </TouchableOpacity>
              )}
            </View>
            {activePolicies.slice(0, 1).map((policy) => (
              <TouchableOpacity
                key={policy.id}
                onPress={() => navigation.navigate('PolicyDetail', { policyId: policy.id })}
                activeOpacity={0.85}
              >
                <Card style={styles.policyCard} padding={16}>
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
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.policyPremium}>
                      ₦{parseFloat(policy.premiumPaid).toLocaleString('en-NG')}/yr
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {pendingClaims.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Claims</Text>
              {pendingClaims.length > 1 && (
                <TouchableOpacity onPress={() => navigation.navigate('Claims')}>
                  <Text style={styles.seeAll}>See all ({pendingClaims.length})</Text>
                </TouchableOpacity>
              )}
            </View>
            {pendingClaims.slice(0, 1).map((claim) => (
              <TouchableOpacity
                key={claim.id}
                onPress={() => navigation.navigate('Claims')}
                activeOpacity={0.85}
              >
                <Card style={styles.policyCard} padding={16}>
                  <View style={styles.policyRow}>
                    <View style={[styles.policyIcon, { backgroundColor: '#FEF3E8' }]}>
                      <Ionicons name="document-text" size={20} color={Colors.accent} />
                    </View>
                    <View style={styles.policyInfo}>
                      <Text style={styles.policyName}>{claim.claimReference}</Text>
                      <Text style={styles.policyNumber}>{claim.policy.product.name}</Text>
                    </View>
                    <StatusBadge status={claim.status} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {pendingQuotes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quotes Awaiting Response</Text>
              {pendingQuotes.length > 1 && (
                <TouchableOpacity onPress={() => navigation.navigate('Products', { screen: 'QuotesList' })}>
                  <Text style={styles.seeAll}>See all ({pendingQuotes.length})</Text>
                </TouchableOpacity>
              )}
            </View>
            {pendingQuotes.slice(0, 1).map((quote) => (
              <TouchableOpacity
                key={quote.id}
                onPress={() => navigation.navigate('Products', {
                  screen: 'QuoteDetail',
                  params: { quoteId: quote.id },
                })}
                activeOpacity={0.85}
              >
                <Card style={styles.quoteCard} padding={16}>
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
              </TouchableOpacity>
            ))}
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
    backgroundColor: Colors.white,
  },
  greeting: { fontSize: 14, color: Colors.textSecondary },
  name: { fontSize: 22, fontWeight: '800', color: Colors.primary, marginTop: 2 },
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
    paddingTop: 16,
  },
  summaryCardWrapper: { flex: 1 },
  summaryCard: { flex: 1 },
  summaryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  summaryCount: { fontSize: 26, fontWeight: '800', color: Colors.textDark, marginBottom: 2 },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', lineHeight: 14 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  featuredProduct: { marginBottom: 8 },
  featuredRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featuredIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredInfo: { flex: 1 },
  featuredName: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  featuredCategory: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  quickAction: { flex: 1, alignItems: 'center' },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 6,
  },
  draftCard: { marginBottom: 0 },
  draftRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  progressTrack: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  draftStep: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  policyCard: { marginBottom: 0 },
  quoteCard: { marginBottom: 0 },
  policyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  quoteRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  policyIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
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
})
