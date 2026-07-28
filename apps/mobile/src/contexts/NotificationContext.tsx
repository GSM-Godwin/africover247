import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'
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
  onNotificationTap: (notification: any) => void
}

export function NotificationProvider({
  children,
  isAuthenticated,
  onNotificationTap: _onNotificationTap,
}: NotificationProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const pollInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const refreshUnreadCount = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    try {
      const res = await api.get('/notifications/unread-count')
      setUnreadCount(res.data.count || 0)
    } catch {}
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      clearInterval(pollInterval.current)
      return
    }

    refreshUnreadCount()
    pollInterval.current = setInterval(refreshUnreadCount, 15000)

    return () => {
      clearInterval(pollInterval.current)
    }
  }, [isAuthenticated, refreshUnreadCount])

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  )
}
