import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Button, Card } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'

export function PaymentSuccessScreen({ route, navigation }: any) {
  const { applicationId } = route.params
  const [policy, setPolicy] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let attempts = 0
    const maxAttempts = 24

    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await api.get('/policies/my')
        const policies = res.data

        const latest = policies
          .filter((p: any) => p.status === 'active' || p.status === 'issued')
          .sort((a: any, b: any) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())[0]

        if (latest) {
          clearInterval(interval)
          setPolicy(latest)
          setLoading(false)
          return
        }
      } catch {}

      if (attempts >= maxAttempts) {
        clearInterval(interval)
        setLoading(false)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [applicationId])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        </View>

        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>
          Your policy has been issued. Check your email for the certificate.
        </Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching your policy...</Text>
          </View>
        ) : policy ? (
          <Card style={styles.policyCard} padding={20}>
            <View style={styles.policyRow}>
              <Text style={styles.policyLabel}>Policy Number</Text>
              <Text style={styles.policyNumber}>{policy.policyNumber}</Text>
            </View>
            <View style={styles.policyRow}>
              <Text style={styles.policyLabel}>Product</Text>
              <Text style={styles.policyValue}>{policy.product?.name}</Text>
            </View>
            <View style={styles.policyRow}>
              <Text style={styles.policyLabel}>Premium Paid</Text>
              <Text style={[styles.policyValue, { color: Colors.primary, fontWeight: '800' }]}>
                ₦{parseFloat(policy.premiumPaid).toLocaleString('en-NG')}
              </Text>
            </View>
            <View style={[styles.policyRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.policyLabel}>Valid Until</Text>
              <Text style={styles.policyValue}>
                {new Date(policy.expiryDate).toLocaleDateString('en-NG', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </Text>
            </View>
            {policy.policyPdfUrl && (
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => Linking.openURL(policy.policyPdfUrl)}
              >
                <Ionicons name="download-outline" size={16} color={Colors.primary} />
                <Text style={styles.downloadText}>Download Policy Certificate</Text>
              </TouchableOpacity>
            )}
          </Card>
        ) : (
          <View style={styles.noPolicyBox}>
            <Text style={styles.noPolicyText}>
              Your policy is being generated. Check your dashboard shortly.
            </Text>
          </View>
        )}

        <Button
          title="Go to Dashboard"
          onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
          style={{ marginTop: 16 }}
        />
        <Button
          title="View All Policies"
          onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
          variant="outline"
          style={{ marginTop: 10 }}
        />

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32, alignItems: 'center' },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  loadingBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  loadingText: { fontSize: 13, color: Colors.textSecondary },
  policyCard: { width: '100%', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
  policyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  policyLabel: { fontSize: 13, color: Colors.textSecondary },
  policyNumber: { fontSize: 14, fontWeight: '800', color: Colors.primary, fontFamily: 'monospace' },
  policyValue: { fontSize: 13, fontWeight: '600', color: Colors.text, textAlign: 'right', flex: 1, marginLeft: 12 },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingTop: 14,
    marginTop: 4,
  },
  downloadText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  noPolicyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    width: '100%',
  },
  noPolicyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
})
