import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants'

interface QuoteCountdownProps {
  createdAt: string
  deadlineDays?: number
}

function getTimeRemaining(createdAt: string, deadlineDays: number) {
  const created = new Date(createdAt).getTime()
  const deadline = created + deadlineDays * 24 * 60 * 60 * 1000
  const now = Date.now()
  const diff = deadline - now

  if (diff <= 0) return null

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    total: diff,
  }
}

export function QuoteCountdown({ createdAt, deadlineDays = 3 }: QuoteCountdownProps) {
  const [remaining, setRemaining] = useState(() =>
    getTimeRemaining(createdAt, deadlineDays)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getTimeRemaining(createdAt, deadlineDays))
    }, 1000)
    return () => clearInterval(interval)
  }, [createdAt, deadlineDays])

  if (!remaining) {
    return (
      <View style={[styles.container, styles.expired]}>
        <Ionicons name="alert-circle" size={16} color={Colors.error} />
        <Text style={[styles.label, { color: Colors.error }]}>
          Response window expired
        </Text>
      </View>
    )
  }

  const isUrgent = remaining.total < 24 * 60 * 60 * 1000

  return (
    <View style={[styles.container, isUrgent ? styles.urgent : styles.normal]}>
      <Ionicons
        name="time-outline"
        size={16}
        color={isUrgent ? Colors.error : Colors.accent}
      />
      <View style={styles.content}>
        <Text style={[styles.label, { color: isUrgent ? Colors.error : Colors.accent }]}>
          {isUrgent ? 'Urgent — respond soon' : 'Response window'}
        </Text>
        <View style={styles.timeRow}>
          {[
            { value: remaining.days, label: 'd' },
            { value: remaining.hours, label: 'h' },
            { value: remaining.minutes, label: 'm' },
            { value: remaining.seconds, label: 's' },
          ].map(({ value, label }) => (
            <View key={label} style={styles.timeUnit}>
              <Text style={[styles.timeValue, { color: isUrgent ? Colors.error : Colors.text }]}>
                {String(value).padStart(2, '0')}
              </Text>
              <Text style={styles.timeLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  normal: { backgroundColor: '#FEF3E8', borderWidth: 1, borderColor: Colors.accent + '30' },
  urgent: { backgroundColor: Colors.errorLight, borderWidth: 1, borderColor: Colors.error + '30' },
  expired: { backgroundColor: Colors.errorLight, borderWidth: 1, borderColor: Colors.error + '30' },
  content: { flex: 1 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  timeRow: { flexDirection: 'row', gap: 8 },
  timeUnit: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  timeValue: { fontSize: 20, fontWeight: '800', fontFamily: 'monospace' },
  timeLabel: { fontSize: 11, color: Colors.textSecondary },
})
