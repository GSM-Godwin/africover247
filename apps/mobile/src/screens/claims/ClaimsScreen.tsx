import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Card, StatusBadge } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'
import type { Claim } from '../../types'

export function ClaimsScreen() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchClaims = useCallback(async () => {
    try {
      const res = await api.get('/claims/my')
      setClaims(res.data)
    } catch {}
  }, [])

  useEffect(() => {
    fetchClaims().finally(() => setLoading(false))
  }, [fetchClaims])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchClaims()
    setRefreshing(false)
  }

  function renderClaim({ item }: { item: Claim }) {
    return (
      <Card style={styles.claimCard} padding={16}>
        <View style={styles.claimHeader}>
          <View style={[styles.claimIcon, { backgroundColor: Colors.primaryLight }]}>
            <Ionicons name="document-text" size={18} color={Colors.primary} />
          </View>
          <View style={styles.claimInfo}>
            <Text style={styles.claimRef}>{item.claimReference}</Text>
            <Text style={styles.claimProduct} numberOfLines={1}>
              {item.policy.product.name}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>
        <View style={styles.claimMeta}>
          <Text style={styles.claimType}>{item.claimType}</Text>
          <Text style={styles.claimDate}>
            {new Date(item.incidentDate).toLocaleDateString('en-NG')}
          </Text>
        </View>
        {item.estimatedAmount && (
          <View style={styles.claimAmount}>
            <Text style={styles.claimAmountLabel}>Estimated Amount</Text>
            <Text style={styles.claimAmountValue}>
              ₦{parseFloat(item.estimatedAmount).toLocaleString('en-NG')}
            </Text>
          </View>
        )}
      </Card>
    )
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* --- Header --- */}
      <View style={styles.header}>
        <Text style={styles.title}>My Claims</Text>
        <Text style={styles.subtitle}>Track and manage your insurance claims</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={claims}
          renderItem={renderClaim}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No claims yet</Text>
              <Text style={styles.emptySubtitle}>
                Filed claims will appear here. You can file a claim from a policy detail.
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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  claimCard: { marginBottom: 0 },
  claimHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  claimIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimInfo: { flex: 1 },
  claimRef: { fontSize: 13, fontWeight: '700', color: Colors.text, fontFamily: 'monospace' },
  claimProduct: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  claimMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
  },
  claimType: { fontSize: 12, color: Colors.textSecondary },
  claimDate: { fontSize: 12, color: Colors.textSecondary },
  claimAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  claimAmountLabel: { fontSize: 12, color: Colors.textSecondary },
  claimAmountValue: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
})
