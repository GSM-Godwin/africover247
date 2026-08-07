import React, { useEffect, useRef } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants'

interface InactivityModalProps {
  visible: boolean
  countdown: number
  onStay: () => void
  onLogout: () => void
}

export function InactivityModal({
  visible,
  countdown,
  onStay,
  onLogout,
}: InactivityModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    } else {
      scaleAnim.setValue(0.9)
      opacityAnim.setValue(0)
    }
  }, [visible, scaleAnim, opacityAnim])

  const urgent = countdown <= 10

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onStay}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.modal,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>

            <View style={[styles.iconCircle, urgent && styles.iconCircleUrgent]}>
              <Ionicons
                name="time-outline"
                size={28}
                color={urgent ? Colors.error : Colors.accent}
              />
            </View>

            <Text style={[styles.countdown, urgent && styles.countdownUrgent]}>
              {countdown}
            </Text>

            <Text style={styles.title}>Still there?</Text>
            <Text style={styles.message}>
              You&apos;ve been inactive for a while. You&apos;ll be signed out in{' '}
              <Text style={[styles.messageBold, urgent && { color: Colors.error }]}>
                {countdown} second{countdown !== 1 ? 's' : ''}
              </Text>{' '}
              unless you tap the screen.
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                <Ionicons name="log-out-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.logoutText}>Sign out</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stayBtn} onPress={onStay}>
                <Text style={styles.stayText}>Stay signed in</Text>
              </TouchableOpacity>
            </View>

          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(21,103,155,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircleUrgent: { backgroundColor: Colors.errorLight },
  countdown: {
    fontSize: 52,
    fontWeight: '800',
    color: Colors.textDark,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  countdownUrgent: { color: Colors.error },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  messageBold: { fontWeight: '700', color: Colors.textDark },
  actions: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 12 },
  logoutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  stayBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stayText: { fontSize: 14, fontWeight: '800', color: Colors.textDark },
})
