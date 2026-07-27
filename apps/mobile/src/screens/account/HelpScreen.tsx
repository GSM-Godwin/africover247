import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '../../components/ui'
import { Colors } from '../../constants'

const FAQ = [
  {
    q: 'How do I get covered?',
    a: 'Browse our products, select the one that fits your needs, fill in your details, and pay securely. Your e-policy is issued instantly.',
  },
  {
    q: 'How do I file a claim?',
    a: 'Go to the Claims tab, tap "File a Claim", describe the incident, upload supporting documents, and submit. Our team will review within 3 business days.',
  },
  {
    q: 'How long does a quote take?',
    a: 'AfriGlobal responds to quote requests within 3 business days. You will be notified by email, SMS, and push notification.',
  },
  {
    q: 'Can I cancel my policy?',
    a: 'Policy cancellations are handled by AfriGlobal directly. Please contact us via the details below.',
  },
  {
    q: 'Is my payment secure?',
    a: 'Yes. All payments are processed by Monnify, a PCI-compliant payment provider. We never store your card details.',
  },
]

export function HelpScreen({ navigation }: any) {
  const [expanded, setExpanded] = React.useState<number | null>(null)

  return (
    <SafeAreaView style={styles.container}>

      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* --- Contact --- */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Card style={styles.contactCard} padding={0}>
          {[
            {
              icon: 'mail-outline' as const,
              label: 'Email Support',
              value: 'support@africover247.com',
              onPress: () => Linking.openURL('mailto:support@africover247.com'),
            },
            {
              icon: 'call-outline' as const,
              label: 'Phone Support',
              value: '+234 800 000 0000',
              onPress: () => Linking.openURL('tel:+2348000000000'),
            },
            {
              icon: 'time-outline' as const,
              label: 'Support Hours',
              value: 'Mon – Fri, 8am – 6pm',
              onPress: undefined,
            },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.contactItem,
                i < arr.length - 1 && styles.contactItemBorder,
              ]}
              onPress={item.onPress}
              disabled={!item.onPress}
              activeOpacity={item.onPress ? 0.7 : 1}
            >
              <View style={styles.contactIcon}>
                <Ionicons name={item.icon} size={18} color={Colors.primary} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>{item.label}</Text>
                <Text style={styles.contactValue}>{item.value}</Text>
              </View>
              {item.onPress && (
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </Card>

        {/* --- FAQ --- */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQ.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.faqItem}
            onPress={() => setExpanded(expanded === i ? null : i)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.q}</Text>
              <Ionicons
                name={expanded === i ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.textSecondary}
              />
            </View>
            {expanded === i && (
              <Text style={styles.faqAnswer}>{item.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* --- Version --- */}
        <Text style={styles.version}>AfriCover247 v1.0.0</Text>
        <Text style={styles.versionSub}>AfriGlobal Insurance Brokers Limited</Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  scroll: { padding: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  contactCard: { marginBottom: 24 },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  contactItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EBF4FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactContent: { flex: 1 },
  contactLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  contactValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  faqItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text, lineHeight: 20 },
  faqAnswer: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginTop: 10 },
  version: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: 24 },
  versionSub: { fontSize: 11, color: Colors.textSecondary + '80', textAlign: 'center', marginTop: 2 },
})
