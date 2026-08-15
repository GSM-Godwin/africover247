import React, { useEffect, useRef } from 'react'
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../../constants'

interface NotificationData {
  title: string
  body: string
  data?: Record<string, string>
}

interface InAppNotificationBannerProps {
  notification: NotificationData | null
  onPress: (data?: Record<string, string>) => void
  onDismiss: () => void
}

export function InAppNotificationBanner({
  notification,
  onPress,
  onDismiss,
}: InAppNotificationBannerProps) {
  const insets = useSafeAreaInsets()
  const translateY = useRef(new Animated.Value(-120)).current
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (notification) {
      Animated.spring(translateY, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }).start()

      timeoutRef.current = setTimeout(() => {
        dismiss()
      }, 4000)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [notification])

  function dismiss() {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDismiss())
  }

  if (!notification) return null

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity
        style={styles.banner}
        onPress={() => {
          dismiss()
          onPress(notification.data)
        }}
        activeOpacity={0.95}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={20} color={Colors.white} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
        </View>
        <TouchableOpacity onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color={Colors.white + '80'} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    color: Colors.white + 'CC',
    lineHeight: 16,
  },
})
