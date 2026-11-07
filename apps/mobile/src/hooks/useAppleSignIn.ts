import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import api from '../services/api'
import { setToken, setUser } from '../services/auth'

const APPLE_FALLBACK_ERROR = 'Apple Sign-In failed. Please try again.'

function isUserCancel(err: any): boolean {
  return err?.code === 'ERR_REQUEST_CANCELED' || err?.code === 'ERR_CANCELED'
}

function extractServerMessage(err: any): string {
  const msg = err?.response?.data?.message
  if (Array.isArray(msg)) return msg[0] || APPLE_FALLBACK_ERROR
  return typeof msg === 'string' && msg ? msg : APPLE_FALLBACK_ERROR
}

interface UseAppleSignInOptions {
  onSuccess: () => void
  onError: (message: string) => void
  setLoading: (loading: boolean) => void
}

export function useAppleSignIn({ onSuccess, onError, setLoading }: UseAppleSignInOptions) {
  const [appleAvailable, setAppleAvailable] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'ios') return
    let mounted = true
    AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (mounted) setAppleAvailable(available)
      })
      .catch(() => {
        if (mounted) setAppleAvailable(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  async function signInWithApple() {
    onError('')
    let credential: AppleAuthentication.AppleAuthenticationCredential
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
    } catch (err: any) {
      if (!isUserCancel(err)) onError(APPLE_FALLBACK_ERROR)
      return
    }

    if (!credential.identityToken) {
      onError(APPLE_FALLBACK_ERROR)
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/apple', {
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode || undefined,
        firstName: credential.fullName?.givenName || undefined,
        lastName: credential.fullName?.familyName || undefined,
      })
      await setToken(res.data.accessToken)
      await setUser(res.data.user)
      onSuccess()
    } catch (err: any) {
      onError(extractServerMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return { appleAvailable: Platform.OS === 'ios' && appleAvailable, signInWithApple }
}
