import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { QuotesListScreen } from '../screens/quotes/QuotesListScreen'
import { QuoteDetailScreen } from '../screens/quotes/QuoteDetailScreen'

const Stack = createStackNavigator()
const StackNavigator = Stack.Navigator as React.ComponentType<any>

export function QuotesStack() {
  return (
    <StackNavigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="QuotesList" component={QuotesListScreen} />
      <Stack.Screen name="QuoteDetail" component={QuoteDetailScreen} />
    </StackNavigator>
  )
}
