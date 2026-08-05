import React, { useCallback, useEffect, useRef, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { TouchableWithoutFeedback, View } from 'react-native'
import { RootNavigator, RootNavigatorHandle } from './src/navigation/RootNavigator'
import { ErrorBoundary } from './src/components/ErrorBoundary'
import { InactivityModal } from './src/components/shared/InactivityModal'
import { useInactivityTimeout } from './src/hooks/useInactivityTimeout'
import { getToken } from './src/services/auth'
import { NotificationProvider } from './src/contexts/NotificationContext'

const COUNTDOWN_SECONDS = 60

export function App() {
  const [showModal, setShowModal] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
