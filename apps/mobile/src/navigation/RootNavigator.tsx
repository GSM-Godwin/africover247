import React, { useState, useCallback, useRef } from 'react'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SplashScreen } from '../screens/SplashScreen'
import { OnboardingScreen } from '../screens/OnboardingScreen'
import { AuthStack } from './AuthStack'
import { MainStack } from './MainStack'
import { NotificationProvider } from '../contexts/NotificationContext'
import { isAuthenticated, logout } from '../services/auth'
import { ONBOARDING_KEY } from '../constants'

type AppState = 'splash' | 'onboarding' | 'auth' | 'app'

export function RootNavigator() {
  const [appState, setAppState] = useState<AppState>('splash')
  const navigationRef = useRef<NavigationContainerRef<any>>(null)

  const handleSplashFinish = useCallback(async () => {
    const [authed, onboardingDone] = await Promise.all([
      isAuthenticated(),
      AsyncStorage.getItem(ONBOARDING_KEY),
    ])
    if (authed) setAppState('app')
    else if (!onboardingDone) setAppState('onboarding')
    else setAppState('auth')
  }, [])

  const handleOnboardingFinish = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
    setAppState('auth')
  }, [])

  const handleLoginSuccess = useCallback(() => {
    setAppState('app')
  }, [])

  const handleLogout = useCallback(async () => {
    await logout()
    setAppState('auth')
  }, [])

  const handleNotificationTap = useCallback(
    (notification: any) => {
      const data = notification?.request?.content?.data as any
      if (!navigationRef.current) return

      const referenceType = data?.referenceType

      if (referenceType === 'quote') {
        navigationRef.current.navigate('Tabs', { screen: 'Products' } as never)
      } else if (referenceType === 'claim') {
        navigationRef.current.navigate('Tabs', { screen: 'Claims' } as never)
      } else if (referenceType === 'policy') {
        navigationRef.current.navigate('Tabs', { screen: 'Home' } as never)
      } else {
        navigationRef.current.navigate('Notifications' as never)
      }
    },
    []
  )

  if (appState === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />
  }

  if (appState === 'onboarding') {
    return <OnboardingScreen onFinish={handleOnboardingFinish} />
  }

  return (
    <NotificationProvider
      isAuthenticated={appState === 'app'}
      onNotificationTap={handleNotificationTap}
    >
      <NavigationContainer ref={navigationRef}>
        {appState === 'auth' ? (
          <AuthStack onLoginSuccess={handleLoginSuccess} />
        ) : (
          <MainStack onLogout={handleLogout} />
        )}
      </NavigationContainer>
    </NotificationProvider>
  )
}
