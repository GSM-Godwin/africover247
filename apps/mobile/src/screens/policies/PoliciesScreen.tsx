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
import type { Policy } from '../../types'

export function PoliciesScreen({ navigation }: any) {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await api.get('/policies/my')
      setPolicies(res.data)
    } catch {}
  }, [])

  useEffect(() => {
    fetchPolicies().finally(() => setLoading(false))
  }, [fetchPolicies])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchPolicies()
    setRefreshing(false)
  }

  function renderPolicy({ item }: { item: Policy }) {
    const daysLeft = Math.ceil(
      (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('PolicyDetail', { policyId: item.id })}
        activeOpacity={0.7}
      >
        <Card style={styles.policyCard} padding={16}>
          <View style={styles.policyHeader}>
            <View style={[styles.policyIcon, { backgroundColor: '#EBF4FA' }]}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
            </View>
            <View style={styles.policyInfo}>
              <Text style={styles.policyName} numberOfLines={1}>
                {item.product.name}
              </Text>
              <Text style={styles.policyNumber}>{item.policyNumber}</Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
          <View style={styles.policyMeta}>
            <Text style={styles.policyMetaText}>
              {daysLeft <= 0 ? 'Expired' : `${daysLeft} days remaining`}
            </Text>
            <Text style={styles.policyPremium}>
              ₦{parseFloat(item.premiumPaid).toLocaleString('en-NG')}/yr
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Policies</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={policies}
          renderItem={renderPolicy}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="shield-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No policies yet</Text>
              <Text style={styles.emptySubtitle}>
                Your active policies will appear here after payment.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textDark },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, gap: 12 },
  policyCard: { marginBottom: 0 },
  policyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  policyIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  policyInfo: { flex: 1 },
  policyName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  policyNumber: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'monospace', marginTop: 2 },
  policyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
  },
  policyMetaText: { fontSize: 12, color: Colors.textSecondary },
  policyPremium: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
})
