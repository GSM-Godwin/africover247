import { useCallback, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import Constants from 'expo-constants'
import * as ScreenCapture from 'expo-screen-capture'

const SCREEN_PROTECTION_ENABLED =
  !__DEV__ && Constants.expoConfig?.extra?.screenProtection === true

let nextProtectionKey = 0

export function isScreenProtectionEnabled(): boolean {
  return SCREEN_PROTECTION_ENABLED
}

export function useScreenProtection() {
  const keyRef = useRef(`screen-protection-${nextProtectionKey++}`)

  useFocusEffect(
    useCallback(() => {
      if (!SCREEN_PROTECTION_ENABLED) return undefined
      const key = keyRef.current
      ScreenCapture.preventScreenCaptureAsync(key).catch(() => undefined)
      return () => {
        ScreenCapture.allowScreenCaptureAsync(key).catch(() => undefined)
      }
    }, []),
  )
}
