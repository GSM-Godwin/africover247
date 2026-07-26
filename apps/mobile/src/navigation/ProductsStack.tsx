import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { ProductsScreen } from '../screens/products/ProductsScreen'
import { ProductDetailScreen } from '../screens/products/ProductDetailScreen'

const Stack = createStackNavigator()
const StackNavigator = Stack.Navigator as React.ComponentType<any>

export function ProductsStack() {
  return (
    <StackNavigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductsList" component={ProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </StackNavigator>
  )
}
