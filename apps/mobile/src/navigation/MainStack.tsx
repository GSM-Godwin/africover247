import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { AppTabs } from './AppTabs'
import { ApplicationWizardScreen } from '../screens/apply/ApplicationWizardScreen'
import { PaymentInitiateScreen } from '../screens/payment/PaymentInitiateScreen'
import { PaymentSuccessScreen } from '../screens/payment/PaymentSuccessScreen'
import { EditProfileScreen } from '../screens/account/EditProfileScreen'
import { ChangePasswordScreen } from '../screens/account/ChangePasswordScreen'
import { HelpScreen } from '../screens/account/HelpScreen'

const Stack = createStackNavigator()
const StackNavigator = Stack.Navigator as React.ComponentType<any>

interface MainStackProps {
  onLogout: () => void
}

export function MainStack({ onLogout }: MainStackProps) {
  return (
    <StackNavigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs">
        {(props) => <AppTabs {...props} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="ApplicationWizard" component={ApplicationWizardScreen} />
      <Stack.Screen name="PaymentInitiate" component={PaymentInitiateScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </StackNavigator>
  )
}
