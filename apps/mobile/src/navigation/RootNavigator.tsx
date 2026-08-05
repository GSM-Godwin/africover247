import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SplashScreen } from '../screens/SplashScreen'
import { OnboardingScreen } from '../screens/OnboardingScreen'
import { AuthStack } from './AuthStack'
import { MainStack } from './MainStack'
import { isAuthenticated, logout } from '../services/auth'
import { ONBOARDING_KEY } from '../constants'

type AppState = 'splash' | 'onboarding' | 'auth' | 'app'

export interface RootNavigatorHandle {
  logout: () => Promise<void>
  handleNotificationTap: (notification: any) => void
}

interface RootNavigatorProps {
  onAuthChange?: (loggedIn: boolean) => void
}

export const RootNavigator = forwardRef<RootNavigatorHandle, RootNavigatorProps>(
  function RootNavigator({ onAuthChange }, ref) {
    const [appState, setAppState] = useState<AppState>('splash')
    const navigationRef = useRef<NavigationContainerRef<any>>(null)

    const handleNotificationTap = useCallback((notification: any) => {
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
    }, [])

    const handleLogout = useCallback(async () => {
      await logout()
      setAppState('auth')
      onAuthChange?.(false)
    }, [onAuthChange])

    useImperativeHandle(ref, () => ({
      logout: handleLogout,
      handleNotificationTap,
    }), [handleLogout, handleNotificationTap])

    const handleSplashFinish = useCallback(async () => {
      const [authed, onboardingDone] = await Promise.all([
        isAuthenticated(),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ])
      if (authed) {
        setAppState('app')
        onAuthChange?.(true)
      } else if (!onboardingDone) {
        setAppState('onboarding')
      } else {
        setAppState('auth')
        onAuthChange?.(false)
      }
    }, [onAuthChange])

    const handleOnboardingFinish = useCallback(async () => {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
      setAppState('auth')
      onAuthChange?.(false)
    }, [onAuthChange])

    const handleLoginSuccess = useCallback(() => {
      setAppState('app')
      onAuthChange?.(true)
    }, [onAuthChange])

    if (appState === 'splash') {
      return <SplashScreen onFinish={handleSplashFinish} />
    }

    if (appState === 'onboarding') {
      return <OnboardingScreen onFinish={handleOnboardingFinish} />
    }

    return (
      <NavigationContainer ref={navigationRef}>
        {appState === 'auth' ? (
          <AuthStack onLoginSuccess={handleLoginSuccess} />
        ) : (
          <MainStack onLogout={handleLogout} />
        )}
      </NavigationContainer>
    )
  }
)
