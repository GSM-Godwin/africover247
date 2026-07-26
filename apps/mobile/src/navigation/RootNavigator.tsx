import React, { useState, useCallback } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SplashScreen } from '../screens/SplashScreen'
import { OnboardingScreen } from '../screens/OnboardingScreen'
import { AuthStack } from './AuthStack'
import { AppTabs } from './AppTabs'
import { isAuthenticated } from '../services/auth'
import { ONBOARDING_KEY } from '../constants'

type AppState = 'splash' | 'onboarding' | 'auth' | 'app'

const NavContainer = NavigationContainer as React.ComponentType<{
  children?: React.ReactNode
}>

export function RootNavigator() {
  const [appState, setAppState] = useState<AppState>('splash')

  const handleSplashFinish = useCallback(async () => {
    const [authed, onboardingDone] = await Promise.all([
      isAuthenticated(),
      AsyncStorage.getItem(ONBOARDING_KEY),
    ])

    if (authed) {
      setAppState('app')
    } else if (!onboardingDone) {
      setAppState('onboarding')
    } else {
      setAppState('auth')
    }
  }, [])

  const handleOnboardingFinish = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
    setAppState('auth')
  }, [])

  const handleLoginSuccess = useCallback(() => {
    setAppState('app')
  }, [])

  if (appState === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />
  }

  if (appState === 'onboarding') {
    return <OnboardingScreen onFinish={handleOnboardingFinish} />
  }

  return (
    <NavContainer>
      {appState === 'auth' ? (
        <AuthStack onLoginSuccess={handleLoginSuccess} />
      ) : (
        <AppTabs />
      )}
    </NavContainer>
  )
}
