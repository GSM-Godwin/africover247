import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Card, StatusBadge } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'

export function ClaimDetailScreen({ route, navigation }: any) {
  const { claimId } = route.params
  const [claim, setClaim] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/claims/${claimId}`)
      .then((res) => setClaim(res.data))
      .catch(() => navigation.goBack())
      .finally(() => setLoading(false))
  }, [claimId])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  if (!claim) return null

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Claim Detail</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.claimRef}>{claim.claimReference}</Text>
            <StatusBadge status={claim.status} />
          </View>
          <Text style={styles.productName}>{claim.policy?.product?.name}</Text>
        </View>

        <Card style={styles.card} padding={16}>
          {[
            { label: 'Claim Type', value: claim.claimType },
            { label: 'Incident Date', value: new Date(claim.incidentDate).toLocaleDateString('en-NG') },
            { label: 'Location', value: claim.incidentLocation },
            { label: 'Police Report', value: claim.policeReportFiled ? `Filed — ${claim.policeReportNumber || 'N/A'}` : 'Not filed' },
            { label: 'Estimated Amount', value: claim.estimatedAmount ? `₦${parseFloat(claim.estimatedAmount).toLocaleString('en-NG')}` : '—' },
          ].map(({ label, value }) => (
            <View key={label} style={styles.row}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
        </Card>

        <View style={styles.descSection}>
          <Text style={styles.descTitle}>Description</Text>
          <Text style={styles.descText}>{claim.description}</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: '#F0F4F8',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  hero: {
    backgroundColor: Colors.white, paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0F4F8',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  claimRef: { fontSize: 16, fontWeight: '800', color: Colors.text, fontFamily: 'monospace' },
  productName: { fontSize: 13, color: Colors.textSecondary },
  card: { margin: 20 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F4F8',
  },
  rowLabel: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  rowValue: { fontSize: 13, fontWeight: '600', color: Colors.text, flex: 1, textAlign: 'right' },
  descSection: { paddingHorizontal: 20 },
  descTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  descText: { fontSize: 14, color: Colors.text, lineHeight: 22 },
})
