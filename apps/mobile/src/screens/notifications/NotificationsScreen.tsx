import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants'
import api from '../../services/api'
import type { Notification } from '../../types'

const TYPE_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  policy_issued: 'shield-checkmark',
  claim_submitted: 'document-text',
  claim_status_updated: 'refresh-circle',
  quote_received: 'chatbubble-ellipses',
  quote_sent: 'chatbubble',
  quote_countered: 'swap-horizontal',
  quote_accepted: 'checkmark-circle',
  quote_rejected: 'close-circle',
}

export function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotifications().finally(() => setLoading(false))
  }, [fetchNotifications])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchNotifications()
    setRefreshing(false)
  }

  async function markAsRead(id: string) {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch {}
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {}
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  function renderNotification({ item }: { item: Notification }) {
    const iconName = TYPE_ICON[item.type] || 'notifications'
    return (
      <TouchableOpacity
        style={[styles.notifItem, !item.read && styles.notifUnread]}
        onPress={() => !item.read && markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.notifIcon,
          { backgroundColor: item.read ? '#F1F5F9' : Colors.primaryLight },
        ]}>
          <Ionicons
            name={iconName}
            size={18}
            color={item.read ? Colors.textSecondary : Colors.primary}
          />
        </View>
        <View style={styles.notifContent}>
          <Text style={[styles.notifMessage, !item.read && styles.notifMessageUnread]}>
            {item.message}
          </Text>
          <Text style={styles.notifTime}>
            {new Date(item.createdAt).toLocaleDateString('en-NG', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* --- Header --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.subtitle}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
          contentContainerStyle={notifications.length === 0 && styles.emptyContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptySubtitle}>
                You'll be notified here when something important happens.
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.primary, marginTop: 2, fontWeight: '600' },
  markAllRead: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  notifUnread: { backgroundColor: '#FAFCFF' },
  notifIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifMessage: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  notifMessageUnread: { color: Colors.text, fontWeight: '500' },
  notifTime: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  separator: { height: 1, backgroundColor: '#F0F4F8' },
  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
})
