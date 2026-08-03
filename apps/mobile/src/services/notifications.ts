import api from './api'

export async function getUnreadCount(): Promise<number> {
  try {
    const res = await api.get('/notifications/unread-count')
    return res.data.count || 0
  } catch {
    return 0
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  return null
}

export async function savePushToken(_token: string): Promise<void> {}

export async function updateBadgeCount(_count: number): Promise<void> {}

export async function markRelatedNotificationsRead(
  referenceType: 'claim' | 'policy' | 'quote',
  referenceId: string,
) {
  try {
    await api.patch('/notifications/read-by-reference', {
      referenceType,
      referenceId,
    })
  } catch {}
}
