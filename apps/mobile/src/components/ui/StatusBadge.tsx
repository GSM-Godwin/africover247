import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants'

interface StatusBadgeProps {
  status: string
}

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  active: { bg: Colors.successLight, text: Colors.success },
  issued: { bg: Colors.successLight, text: Colors.success },
  approved: { bg: Colors.successLight, text: Colors.success },
  accepted: { bg: Colors.successLight, text: Colors.success },
  paid: { bg: Colors.successLight, text: Colors.success },
  successful: { bg: Colors.successLight, text: Colors.success },
  draft: { bg: '#F1F5F9', text: Colors.textSecondary },
  pending_payment: { bg: Colors.accentLight, text: Colors.accent },
  pending_review: { bg: '#F1F5F9', text: Colors.textSecondary },
  quote_sent: { bg: Colors.accentLight, text: Colors.accent },
  submitted: { bg: Colors.accentLight, text: Colors.accent },
  in_review: { bg: Colors.primaryLight, text: Colors.primary },
  countered_by_customer: { bg: Colors.primaryLight, text: Colors.primary },
  countered_by_admin: { bg: Colors.accentLight, text: Colors.accent },
  rejected: { bg: Colors.errorLight, text: Colors.error },
  expired: { bg: '#F1F5F9', text: Colors.textSecondary },
  cancelled: { bg: Colors.errorLight, text: Colors.error },
  failed: { bg: Colors.errorLight, text: Colors.error },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { bg: '#F1F5F9', text: Colors.textSecondary }
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>
        {status.replace(/_/g, ' ')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
})
