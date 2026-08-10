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
        projectId: '436de704-ba6f-46e8-a6b9-0c7286ce59e1',
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
