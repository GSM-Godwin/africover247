import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import * as AppleAuthentication from 'expo-apple-authentication'
import { Button, Input } from '../../components/ui'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants'
import api from '../../services/api'
import { setToken, setUser } from '../../services/auth'

WebBrowser.maybeCompleteAuthSession()

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

interface LoginScreenProps {
  navigation: any
  onLoginSuccess: () => void
}

export function LoginScreen({ navigation, onLoginSuccess }: LoginScreenProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  })

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleResponse(googleResponse.authentication?.accessToken || '')
    }
  }, [googleResponse])

  async function handleGoogleResponse(accessToken: string) {
    if (!accessToken) return
    setLoading(true)
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const userInfo = await userInfoRes.json()
      const res = await api.post('/auth/google', {
        googleId: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || '',
        lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || '',
      })
      await setToken(res.data.accessToken)
      await setUser(res.data.user)
      onLoginSuccess()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : (msg || 'Google sign-in failed.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleAppleSignIn() {
    try {
      setLoading(true)
      setError('')
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      const res = await api.post('/auth/apple', {
        appleId: credential.user,
        email: credential.email || null,
        firstName: credential.fullName?.givenName || '',
        lastName: credential.fullName?.familyName || '',
      })

      await setToken(res.data.accessToken)
      await setUser(res.data.user)
      onLoginSuccess()
    } catch (err: any) {
      if (err?.code !== 'ERR_REQUEST_CANCELED') {
        const msg = err?.response?.data?.message
        setError(Array.isArray(msg) ? msg[0] : (msg || 'Apple Sign-In failed. Please try again.'))
      }
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', data)
      await setToken(res.data.accessToken)
      await setUser(res.data.user)
      onLoginSuccess()
    } catch (err: any) {
      const status = err.response?.status
      if (status === 401) setError('Incorrect email or password.')
      else if (status === 429) setError('Too many attempts. Please wait.')
      else setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <Text style={styles.logoText}>AfriCover</Text>
              <Text style={styles.logoAccent}>247</Text>
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Log in to manage your policies and claims.
            </Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email address"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry
                  showPasswordToggle
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              title="Log In"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
            />

            <TouchableOpacity
              style={styles.phoneLink}
              onPress={() => navigation.navigate('PhoneLogin')}
            >
              <Ionicons name="phone-portrait-outline" size={16} color={Colors.primary} />
              <Text style={styles.phoneLinkText}>Sign in with phone number</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[
                styles.googleBtn,
                (!googleRequest || !process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) && styles.btnDisabledOpacity,
              ]}
              onPress={() => googlePromptAsync()}
              disabled={!googleRequest || !process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={20} color={Colors.text} />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={14}
                style={styles.appleBtn}
                onPress={handleAppleSignIn}
              />
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to AfriCover247? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  keyboardView: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  header: { paddingTop: 40, paddingBottom: 32 },
  logoRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 24 },
  logoText: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  logoAccent: { fontSize: 22, fontWeight: '800', color: Colors.accent },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  form: { flex: 1 },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: Colors.error, fontSize: 13, fontWeight: '500' },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 },
  forgotText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  phoneLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
  },
  phoneLinkText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 13, color: Colors.textSecondary },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: Colors.white,
  },
  btnDisabledOpacity: { opacity: 0.5 },
  googleBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  appleBtn: {
    width: '100%',
    height: 52,
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  footerText: { fontSize: 14, color: Colors.textSecondary },
  footerLink: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
})
