import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'
import { getToken } from '../../services/auth'

const QUICK_ACTIONS = [
  { icon: 'chatbubble-ellipses-outline' as const, label: 'Chat with us', onPress: (navigation: any) => Linking.openURL('https://wa.me/2349063675032?text=Hello%2C%20I%20need%20help%20with%20my%20AfriCover247%20insurance.') },
  { icon: 'call-outline' as const, label: 'Call us', onPress: () => Linking.openURL('tel:+2348101315330') },
  { icon: 'calendar-outline' as const, label: 'Book appointment', onPress: (navigation: any) => navigation.navigate('BookAppointment') },
  { icon: 'document-text-outline' as const, label: 'Make a claim', onPress: (navigation: any) => navigation.navigate('NewClaim') },
  { icon: 'search-outline' as const, label: 'Track claim', onPress: (navigation: any) => navigation.navigate('Tabs', { screen: 'Claims' }) },
  { icon: 'download-outline' as const, label: 'Download policy', onPress: (navigation: any) => navigation.navigate('Policies') },
  { icon: 'refresh-outline' as const, label: 'Renew policy', onPress: (navigation: any) => navigation.navigate('Policies') },
  { icon: 'alert-circle-outline' as const, label: 'Complaint', onPress: (navigation: any) => navigation.navigate('NewTicket', { category: 'complaint' }) },
]

const CONTACT_ITEMS = [
  {
    icon: 'logo-whatsapp' as const,
    label: 'WhatsApp Support',
    value: '+234 906 367 5032',
    onPress: () => Linking.openURL('https://wa.me/2349063675032?text=Hello%2C%20I%20need%20help%20with%20my%20AfriCover247%20insurance.'),
  },
  {
    icon: 'call-outline' as const,
    label: 'Lagos Office',
    value: '08101315330 / 09063675032',
    onPress: () => Linking.openURL('tel:+2348101315330'),
  },
  {
    icon: 'call-outline' as const,
    label: 'Abuja Office',
    value: '08033000728',
    onPress: () => Linking.openURL('tel:+2348033000728'),
  },
  {
    icon: 'call-outline' as const,
    label: 'Port Harcourt Office',
    value: '08037605330',
    onPress: () => Linking.openURL('tel:+2348037605330'),
  },
  {
    icon: 'mail-outline' as const,
    label: 'Email',
    value: 'info@afriglobal.com.ng',
    onPress: () => Linking.openURL('mailto:info@afriglobal.com.ng'),
  },
  {
    icon: 'location-outline' as const,
    label: 'Head Office',
    value: '141c Oshodi/Gbagada Expressway, Anthony, Lagos',
    onPress: () => Linking.openURL('https://maps.google.com/?q=141c+Oshodi+Gbagada+Expressway+Anthony+Lagos'),
  },
]

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
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [tickets, setTickets] = React.useState<any[]>([])
  const [loadingTickets, setLoadingTickets] = React.useState(false)

  React.useEffect(() => {
    async function fetchTickets() {
      const token = await getToken()
      if (!token) return
      setLoadingTickets(true)
      try {
        const res = await api.get('/support/tickets/my')
        setTickets(res.data.slice(0, 3))
      } catch {} finally {
        setLoadingTickets(false)
      }
    }
    fetchTickets()
  }, [submitted])

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      Alert.alert('Missing Fields', 'Please fill in your name, email, subject and message.')
      return
    }
    if (!form.email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.')
      return
    }
    if (form.message.trim().length < 10) {
      Alert.alert('Message too short', 'Please describe how we can help you.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      })
      setSubmitted(true)
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err: any) {
      const msg = err?.response?.data?.message
      Alert.alert('Error', Array.isArray(msg) ? msg[0] : (msg || 'Could not send message. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickActionTile}
                onPress={() => action.onPress(navigation)}
                activeOpacity={0.8}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name={action.icon} size={22} color={Colors.primary} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Card style={styles.contactCard} padding={0}>
            {CONTACT_ITEMS.map((item, i, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.contactItem,
                  i < arr.length - 1 && styles.contactItemBorder,
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.contactIcon}>
                  <Ionicons name={item.icon} size={18} color={Colors.primary} />
                </View>
                <View style={styles.contactContent}>
                  <Text style={styles.contactLabel}>{item.label}</Text>
                  <Text style={styles.contactValue}>{item.value}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </Card>

          <Text style={styles.sectionTitle}>Send Us a Message</Text>
          <Card style={styles.formCard} padding={20}>
            {submitted ? (
              <View style={styles.successState}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
                </View>
                <Text style={styles.successTitle}>Message Sent</Text>
                <Text style={styles.successText}>
                  Our team will get back to you within 24 hours.
                </Text>
                <TouchableOpacity
                  style={styles.sendAnotherBtn}
                  onPress={() => setSubmitted(false)}
                >
                  <Text style={styles.sendAnotherText}>Send another message</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.formRow}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>
                      Full Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={form.name}
                      onChangeText={(v) => updateForm('name', v)}
                      placeholder="Your full name"
                      placeholderTextColor={Colors.textSecondary + '80'}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>
                    Email Address <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={form.email}
                    onChangeText={(v) => updateForm('email', v)}
                    placeholder="your@email.com"
                    placeholderTextColor={Colors.textSecondary + '80'}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={form.phone}
                    onChangeText={(v) => updateForm('phone', v)}
                    placeholder="08012345678"
                    placeholderTextColor={Colors.textSecondary + '80'}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>
                    Subject <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.subjectPills}>
                    {['Product Enquiry', 'Claim Support', 'Policy Renewal', 'Quote Request', 'Complaint', 'Other'].map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.pill, form.subject === s && styles.pillActive]}
                        onPress={() => updateForm('subject', s)}
                      >
                        <Text style={[styles.pillText, form.subject === s && styles.pillTextActive]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>
                    Message <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textarea}
                    value={form.message}
                    onChangeText={(v) => updateForm('message', v)}
                    placeholder="Tell us how we can help you..."
                    placeholderTextColor={Colors.textSecondary + '80'}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <Text style={styles.submitText}>Sending...</Text>
                  ) : (
                    <>
                      <Ionicons name="send" size={16} color={Colors.white} />
                      <Text style={styles.submitText}>Send Message</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Card>

          {loadingTickets && (
            <View style={styles.ticketLoading}>
              <Text style={styles.ticketLoadingText}>Loading requests...</Text>
            </View>
          )}

          {tickets.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>My Requests</Text>
              {tickets.map((ticket) => (
                <Card key={ticket.id} style={styles.ticketCard} padding={14}>
                  <View style={styles.ticketRow}>
                    <View style={styles.ticketInfo}>
                      <Text style={styles.ticketSubject} numberOfLines={1}>{ticket.subject}</Text>
                      <Text style={styles.ticketRef}>#{ticket.id.slice(0, 8).toUpperCase()}</Text>
                      {(ticket.status === 'resolved' || ticket.status === 'closed') && ticket.completionTime && (
                        <Text style={styles.completionTime}>✓ Completed in {ticket.completionTime}</Text>
                      )}
                    </View>
                    <View style={[styles.ticketStatus, {
                      backgroundColor: ticket.status === 'resolved' ? Colors.successLight :
                        ticket.status === 'in_progress' ? Colors.primaryLight :
                        ticket.status === 'awaiting_customer' ? Colors.errorLight :
                        Colors.accentLight,
                    }]}>
                      <Text style={[styles.ticketStatusText, {
                        color: ticket.status === 'resolved' ? Colors.success :
                          ticket.status === 'in_progress' ? Colors.primary :
                          ticket.status === 'awaiting_customer' ? Colors.error :
                          Colors.accent,
                      }]}>
                        {ticket.status.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}

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

          <Text style={styles.version}>AfriCover247 v1.0.0</Text>
          <Text style={styles.versionSub}>AfriGlobal Insurance Brokers Limited</Text>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  scroll: { padding: 20 },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  quickActionTile: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textDark,
    textAlign: 'center',
  },
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
  formCard: { marginBottom: 24 },
  form: { gap: 16 },
  formRow: { flexDirection: 'row', gap: 12 },
  field: { marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  required: { color: Colors.error },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  textarea: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.white,
    minHeight: 100,
  },
  subjectPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.white,
  },
  pillActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EBF4FA',
  },
  pillText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  pillTextActive: { color: Colors.primary, fontWeight: '700' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  successState: { alignItems: 'center', paddingVertical: 24 },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  successText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  sendAnotherBtn: { marginTop: 20 },
  sendAnotherText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  ticketLoading: { marginBottom: 16 },
  ticketLoadingText: { fontSize: 13, color: Colors.textSecondary },
  ticketCard: { marginBottom: 8 },
  ticketRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  ticketInfo: { flex: 1 },
  ticketSubject: { fontSize: 13, fontWeight: '600', color: Colors.textDark },
  ticketRef: { fontSize: 11, color: Colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 2 },
  completionTime: { fontSize: 11, color: Colors.success, fontWeight: '600', marginTop: 2 },
  ticketStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  ticketStatusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
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
