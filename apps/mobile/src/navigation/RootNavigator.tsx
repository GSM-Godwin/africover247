import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Alert } from 'react-native'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import { SplashScreen } from '../screens/SplashScreen'
import { OnboardingScreen } from '../screens/OnboardingScreen'
import { AuthStack } from './AuthStack'
import { MainStack } from './MainStack'
import { isAuthenticated, logout } from '../services/auth'
import {
  isBiometricAvailable,
  isBiometricEnabled,
  authenticateWithBiometric,
} from '../services/biometric'
import { isDeviceRooted } from '../services/security'
import { registerForPushNotifications, savePushToken } from '../services/notifications'
import { ONBOARDING_KEY } from '../constants'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

type AppState = 'splash' | 'onboarding' | 'auth' | 'app'

async function registerPushToken() {
  const pushToken = await registerForPushNotifications()
  if (pushToken) {
    await savePushToken(pushToken)
  }
}

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

    useEffect(() => {
      const notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log('[Push] Foreground notification received:', notification.request.content.title)
      })

      const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data
        if (data?.referenceType === 'quote' && data?.referenceId) {
          navigationRef.current?.navigate('Tabs', {
            screen: 'Products',
            params: {
              screen: 'QuoteDetail',
              params: { quoteId: data.referenceId },
            },
          } as never)
        } else if (data?.referenceType === 'claim' && data?.referenceId) {
          navigationRef.current?.navigate('ClaimDetail', { claimId: data.referenceId } as never)
        } else if (data?.referenceType === 'policy' && data?.referenceId) {
          navigationRef.current?.navigate('PolicyDetail', { policyId: data.referenceId } as never)
        }
      })

      return () => {
        notificationSubscription.remove()
        responseSubscription.remove()
      }
    }, [])

    const handleSplashFinish = useCallback(async () => {
      const rooted = await isDeviceRooted()
      if (rooted) {
        Alert.alert(
          'Security Warning',
          'This device appears to be rooted or jailbroken. AfriCover247 may not function securely on modified devices. Proceed with caution.',
          [{ text: 'I Understand', style: 'default' }]
        )
      }

      const [authed, onboardingDone] = await Promise.all([
        isAuthenticated(),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ])
      if (authed) {
        const biometricOn = await isBiometricEnabled()
        if (biometricOn) {
          const available = await isBiometricAvailable()
          if (available) {
            const success = await authenticateWithBiometric()
            if (!success) {
              await logout()
              setAppState('auth')
              onAuthChange?.(false)
              return
            }
          }
        }
        setAppState('app')
        onAuthChange?.(true)
        registerPushToken()
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
      registerPushToken()
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
