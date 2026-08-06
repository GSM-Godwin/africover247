import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ScreenCapture from 'expo-screen-capture'
import * as Clipboard from 'expo-clipboard'
import { Card, StatusBadge } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'
import { markRelatedNotificationsRead } from '../../services/notifications'

interface PolicyDetail {
  id: string
  policyNumber: string
  status: string
  premiumPaid: string
  issueDate: string
  startDate: string
  expiryDate: string
  policyPdfUrl: string | null
  product: {
    name: string
    category: string
    coverageHighlights: string
    exclusions: string
  }
  claims: {
    id: string
    claimReference: string
    claimType: string
    status: string
    createdAt: string
  }[]
}

export function PolicyDetailScreen({ route, navigation }: any) {
  const { policyId } = route.params
  const [policy, setPolicy] = useState<PolicyDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/policies/${policyId}`)
      .then((res) => {
        setPolicy(res.data)
        markRelatedNotificationsRead('policy', policyId)
      })
      .catch(() => navigation.goBack())
      .finally(() => setLoading(false))
  }, [policyId])

  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync()
    return () => {
      ScreenCapture.allowScreenCaptureAsync()
    }
  }, [])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  if (!policy) return null

  const coverageItems = policy.product.coverageHighlights.split('\n').filter(Boolean)
  const exclusionItems = policy.product.exclusions.split('\n').filter(Boolean)
  const daysUntilExpiry = Math.ceil(
    (new Date(policy.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30
  const policyNumber = policy.policyNumber

  async function handleCopyPolicyNumber() {
    await Clipboard.setStringAsync(policyNumber)
    setTimeout(async () => {
      const current = await Clipboard.getStringAsync()
      if (current === policyNumber) {
        await Clipboard.setStringAsync('')
      }
    }, 30000)
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Policy Details</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{policy.product.category}</Text>
            </View>
            <StatusBadge status={policy.status} />
          </View>
          <Text style={styles.productName}>{policy.product.name}</Text>
          <TouchableOpacity onPress={handleCopyPolicyNumber} activeOpacity={0.7}>
            <Text style={styles.policyNumber}>{policy.policyNumber}</Text>
          </TouchableOpacity>
        </View>

        {isExpiringSoon && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={16} color={Colors.accent} />
            <Text style={styles.warningText}>
              Expires in {daysUntilExpiry} days
            </Text>
          </View>
        )}

        <Card style={styles.summaryCard} padding={16}>
          {[
            {
              label: 'Premium Paid',
              value: `₦${parseFloat(policy.premiumPaid).toLocaleString('en-NG')}`,
              accent: true,
            },
            {
              label: 'Issue Date',
              value: new Date(policy.issueDate).toLocaleDateString('en-NG'),
            },
            {
              label: 'Start Date',
              value: new Date(policy.startDate).toLocaleDateString('en-NG'),
            },
            {
              label: 'Expiry Date',
              value: new Date(policy.expiryDate).toLocaleDateString('en-NG'),
            },
            {
              label: 'Days Remaining',
              value: daysUntilExpiry <= 0 ? 'Expired' : `${daysUntilExpiry} days`,
              expired: daysUntilExpiry <= 0,
            },
          ].map(({ label, value, accent, expired }) => (
            <View key={label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{label}</Text>
              <Text style={[
                styles.summaryValue,
                accent && { color: Colors.primary, fontWeight: '800' },
                expired && { color: Colors.error },
              ]}>
                {value}
              </Text>
            </View>
          ))}
        </Card>

        {policy.policyPdfUrl && (
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => Linking.openURL(policy.policyPdfUrl!)}
          >
            <Ionicons name="download-outline" size={18} color={Colors.white} />
            <Text style={styles.downloadText}>Download Policy Certificate</Text>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Covered</Text>
          {coverageItems.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exclusions</Text>
          {exclusionItems.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Ionicons name="close-circle" size={16} color={Colors.error} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claims History</Text>
          {policy.claims.length === 0 ? (
            <Text style={styles.emptyText}>No claims filed against this policy.</Text>
          ) : (
            policy.claims.map((claim) => (
              <Card key={claim.id} style={styles.claimCard} padding={12}>
                <View style={styles.claimRow}>
                  <View style={styles.claimInfo}>
                    <Text style={styles.claimRef}>{claim.claimReference}</Text>
                    <Text style={styles.claimType}>{claim.claimType}</Text>
                  </View>
                  <StatusBadge status={claim.status} />
                </View>
              </Card>
            ))
          )}
        </View>

        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => navigation.navigate('NewClaim', { preselectedPolicyId: policy.id })}
          >
            <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.claimButtonText}>File a Claim</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  backButton: { padding: 2 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  hero: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  categoryBadge: { backgroundColor: '#EBF4FA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  categoryText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  productName: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  policyNumber: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'monospace' },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3E8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F68B1E30',
  },
  warningText: { fontSize: 13, color: Colors.accent, fontWeight: '600' },
  summaryCard: { marginHorizontal: 20, marginTop: 16 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  summaryLabel: { fontSize: 13, color: Colors.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: '600', color: Colors.text },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  downloadText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  listItem: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  listText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20 },
  emptyText: { fontSize: 13, color: Colors.textSecondary },
  claimCard: { marginBottom: 8 },
  claimRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  claimInfo: {},
  claimRef: { fontSize: 13, fontWeight: '700', color: Colors.text, fontFamily: 'monospace' },
  claimType: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  ctaSection: { padding: 20 },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  claimButtonText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
})
