import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { LoginScreen } from '../screens/auth/LoginScreen'
import { RegisterScreen } from '../screens/auth/RegisterScreen'
import { VerifyEmailScreen } from '../screens/auth/VerifyEmailScreen'
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen'
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen'

export type AuthStackParamList = {
  Login: undefined
  Register: undefined
  VerifyEmail: { email: string }
  ForgotPassword: undefined
  ResetPassword: { email: string }
}

const Stack = createStackNavigator<AuthStackParamList>()

interface AuthStackProps {
  onLoginSuccess: () => void
}

export function AuthStack({ onLoginSuccess }: AuthStackProps) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyEmail">
        {(props) => <VerifyEmailScreen {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword">
        {(props) => <ResetPasswordScreen {...props} />}
      </Stack.Screen>
    </Stack.Navigator>
  )
}
