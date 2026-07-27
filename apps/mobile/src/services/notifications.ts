import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import api from './api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[Push] Must use physical device for push notifications')
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Push notification permission denied')
    return null
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'AfriCover247',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#15679b',
    })
  }

  const token = await Notifications.getExpoPushTokenAsync()
  console.log('[Push] Expo push token:', token.data)
  return token.data
}

export async function savePushToken(token: string): Promise<void> {
  try {
    await api.post('/users/me/push-token', { pushToken: token, platform: Platform.OS })
    console.log('[Push] Token saved to backend')
  } catch (err) {
    console.log('[Push] Could not save token to backend:', err)
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const res = await api.get('/notifications/unread-count')
    return res.data.count || 0
  } catch {
    return 0
  }
}

export async function updateBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count)
}
