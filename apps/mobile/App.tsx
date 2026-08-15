import React, { useCallback, useEffect, useRef, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { TouchableWithoutFeedback, View, AppState, AppStateStatus } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as ScreenCapture from 'expo-screen-capture'
import { RootNavigator, RootNavigatorHandle } from './src/navigation/RootNavigator'
import { ErrorBoundary } from './src/components/ErrorBoundary'
import { InactivityModal } from './src/components/shared/InactivityModal'
import { InAppNotificationBanner } from './src/components/shared/InAppNotificationBanner'
import { useInactivityTimeout } from './src/hooks/useInactivityTimeout'
import { getToken } from './src/services/auth'
import { NotificationProvider } from './src/contexts/NotificationContext'
import { Colors } from './src/constants'

const COUNTDOWN_SECONDS = 60

function AppShell() {
  const insets = useSafeAreaInsets()
  const [showModal, setShowModal] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [foregroundNotification, setForegroundNotification] = useState<{
    title: string
    body: string
    data?: Record<string, string>
  } | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const navigationRef = useRef<RootNavigatorHandle>(null)

  useEffect(() => {
    getToken().then((t) => setIsLoggedIn(!!t))
  }, [])

  function stopCountdown() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }

  const handleLogout = useCallback(async () => {
    stopCountdown()
    setShowModal(false)
    await navigationRef.current?.logout()
    setIsLoggedIn(false)
  }, [])

  const handleStay = useCallback(() => {
    stopCountdown()
    setShowModal(false)
    setCountdown(COUNTDOWN_SECONDS)
  }, [])

  const handleIdle = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    setShowModal(true)
    setCountdown(COUNTDOWN_SECONDS)

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          stopCountdown()
          handleLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [handleLogout])

  const { resetTimer } = useInactivityTimeout({
    onIdle: handleIdle,
    onActive: handleStay,
    enabled: isLoggedIn,
  })

  const handleNotificationTap = useCallback((notification: any) => {
    navigationRef.current?.handleNotificationTap(notification)
  }, [])

  useEffect(() => {
    return () => stopCountdown()
  }, [])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        ScreenCapture.preventScreenCaptureAsync()
      } else if (state === 'active') {
        ScreenCapture.allowScreenCaptureAsync()
      }
    })
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      setForegroundNotification({
        title: notification.request.content.title || 'AfriCover247',
        body: notification.request.content.body || '',
        data: notification.request.content.data as Record<string, string>,
      })
    })

    return () => subscription.remove()
  }, [])

  function handleBannerPress(data?: Record<string, string>) {
    if (!data) return
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: Colors.primary,
          zIndex: 1,
        }}
      />
      <StatusBar
        style="light"
        backgroundColor={Colors.primary}
        translucent={false}
      />
      <View style={{ flex: 1 }}>
        <NotificationProvider
          isAuthenticated={isLoggedIn}
          onNotificationTap={handleNotificationTap}
        >
          <ErrorBoundary>
            <TouchableWithoutFeedback onPress={resetTimer}>
              <View style={{ flex: 1 }}>
                <RootNavigator
                  ref={navigationRef}
                  onAuthChange={setIsLoggedIn}
                />
                <InactivityModal
                  visible={showModal}
                  countdown={countdown}
                  onStay={handleStay}
                  onLogout={handleLogout}
                />
              </View>
            </TouchableWithoutFeedback>
          </ErrorBoundary>
        </NotificationProvider>

        <InAppNotificationBanner
          notification={foregroundNotification}
          onPress={handleBannerPress}
          onDismiss={() => setForegroundNotification(null)}
        />
      </View>
    </View>
  )
}

export function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppShell />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
