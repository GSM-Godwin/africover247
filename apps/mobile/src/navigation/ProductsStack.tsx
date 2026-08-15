import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { ProductsScreen } from '../screens/products/ProductsScreen'
import { ProductDetailScreen } from '../screens/products/ProductDetailScreen'
import { QuoteRequestScreen } from '../screens/quotes/QuoteRequestScreen'
import { QuoteSuccessScreen } from '../screens/quotes/QuoteSuccessScreen'

const Stack = createStackNavigator()
const StackNavigator = Stack.Navigator as React.ComponentType<any>

export function ProductsStack() {
  return (
    <StackNavigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductsList" component={ProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="QuoteRequest" component={QuoteRequestScreen} />
      <Stack.Screen name="QuoteSuccess" component={QuoteSuccessScreen} />
    </StackNavigator>
  )
}
