import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import * as Notifications from 'expo-notifications'
import {
  registerForPushNotifications,
  savePushToken,
  getUnreadCount,
  updateBadgeCount,
} from '../services/notifications'
import { getToken } from '../services/auth'

interface NotificationContextValue {
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
})

export function useNotifications() {
  return useContext(NotificationContext)
}

interface NotificationProviderProps {
  children: React.ReactNode
  isAuthenticated: boolean
  onNotificationTap: (notification: Notifications.Notification) => void
}

export function NotificationProvider({
  children,
  isAuthenticated,
  onNotificationTap,
}: NotificationProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined)
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined)
  const pollInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const refreshUnreadCount = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    const count = await getUnreadCount()
    setUnreadCount(count)
    await updateBadgeCount(count)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      clearInterval(pollInterval.current)
      return
    }

    try {
      registerForPushNotifications().then(async (token) => {
        if (token) await savePushToken(token)
      }).catch(() => {})
    } catch {}

    refreshUnreadCount()

    pollInterval.current = setInterval(refreshUnreadCount, 15000)

    try {
      notificationListener.current = Notifications.addNotificationReceivedListener(
        () => {
          refreshUnreadCount()
        }
      )
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          onNotificationTap(response.notification)
        }
      )
    } catch {}

    return () => {
      clearInterval(pollInterval.current)
      try {
        notificationListener.current?.remove()
        responseListener.current?.remove()
      } catch {}
    }
  }, [isAuthenticated, refreshUnreadCount, onNotificationTap])

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  )
}
