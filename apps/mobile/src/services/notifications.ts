import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import api from './api'

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') return null

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: '1c5e61d2-65d1-4b21-8150-e983b402a3bc',
      })
    ).data

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#15679b',
      })
    }

    return token
  } catch (err) {
    console.error('[Push] Registration failed:', err)
    return null
  }
}

export async function savePushToken(token: string): Promise<void> {
  try {
    await api.post('/users/me/push-token', {
      token,
      platform: 'expo',
    })
  } catch {}
}

export async function markRelatedNotificationsRead(
  referenceType: 'claim' | 'policy' | 'quote',
  referenceId: string,
): Promise<void> {
  try {
    await api.patch('/notifications/read-by-reference', {
      referenceType,
      referenceId,
    })
  } catch {}
}
