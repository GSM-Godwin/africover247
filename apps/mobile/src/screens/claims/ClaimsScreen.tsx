import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Card, StatusBadge } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'
import type { Claim } from '../../types'

const FILTERS = ['All', 'Submitted', 'In Review', 'Approved', 'Rejected']

const FILTER_STATUS_MAP: Record<string, string[]> = {
  'All': [],
  'Submitted': ['submitted'],
  'In Review': ['in_review'],
  'Approved': ['approved', 'accepted'],
  'Rejected': ['rejected'],
}

export function ClaimsScreen({ navigation }: any) {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')

  const fetchClaims = useCallback(async () => {
    try {
      const res = await api.get('/claims/my')
      setClaims(res.data)
    } catch {}
  }, [])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      fetchClaims().finally(() => setLoading(false))
    }, [fetchClaims]),
  )

  async function handleRefresh() {
    setRefreshing(true)
    await fetchClaims()
    setRefreshing(false)
  }

  const filteredClaims = activeFilter === 'All'
    ? claims
    : claims.filter((c) => FILTER_STATUS_MAP[activeFilter]?.includes(c.status))

  function renderClaim({ item }: { item: Claim }) {
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ClaimDetail', { claimId: item.id })}
        activeOpacity={0.85}
      >
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
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.title}>My Claims</Text>
        <TouchableOpacity
          style={styles.newClaimButton}
          onPress={() => navigation.navigate('NewClaim')}
        >
          <Ionicons name="add" size={20} color={Colors.textDark} />
          <Text style={styles.newClaimText}>File Claim</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterPillText, activeFilter === f && styles.filterPillTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredClaims}
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
                File a claim against any of your active policies.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('NewClaim')}
              >
                <Text style={styles.emptyButtonText}>File a Claim</Text>
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  newClaimButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  newClaimText: { fontSize: 13, fontWeight: '700', color: Colors.textDark },
  filterWrapper: {
    height: 52,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    justifyContent: 'center',
  },
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  filterPillTextActive: { color: Colors.white, fontWeight: '700' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, gap: 12 },
  claimCard: { marginBottom: 0 },
  claimHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  claimIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  claimInfo: { flex: 1 },
  claimRef: { fontSize: 13, fontWeight: '700', color: Colors.text, fontFamily: 'monospace' },
  claimProduct: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  claimMeta: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  claimType: { fontSize: 12, color: Colors.textSecondary },
  claimDate: { fontSize: 12, color: Colors.textSecondary },
  claimAmount: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  claimAmountLabel: { fontSize: 12, color: Colors.textSecondary },
  claimAmountValue: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyButton: {
    marginTop: 20, backgroundColor: Colors.accent,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  emptyButtonText: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
})
