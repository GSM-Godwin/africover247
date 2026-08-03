import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { HomeScreen } from '../screens/home/HomeScreen'
import { ClaimsScreen } from '../screens/claims/ClaimsScreen'
import { QuotesListScreen } from '../screens/quotes/QuotesListScreen'
import { AccountScreen } from '../screens/account/AccountScreen'
import { ProductsStack } from './ProductsStack'
import { Colors } from '../constants'

const Tab = createBottomTabNavigator()
const TabNavigator = Tab.Navigator as React.ComponentType<any>

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

function TabIcon({
  name,
  focused,
}: {
  name: IoniconName
  focused: boolean
}) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconActive]}>
      <Ionicons
        name={name}
        size={22}
        color={focused ? Colors.primary : Colors.textSecondary}
      />
    </View>
  )
}

interface AppTabsProps {
  onLogout: () => void
}

export function AppTabs({ onLogout }: AppTabsProps) {
  return (
    <TabNavigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsStack}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'shield' : 'shield-outline'} focused={focused} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Products', { screen: 'ProductsList' })
          },
        })}
      />
      <Tab.Screen
        name="Claims"
        component={ClaimsScreen}
        options={{
          tabBarLabel: 'Claims',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'document-text' : 'document-text-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Quotes"
        component={QuotesListScreen}
        options={{
          tabBarLabel: 'Quotes',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
          ),
        }}
      >
        {(props) => <AccountScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </TabNavigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 40,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: {
    backgroundColor: '#EBF4FA',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
})
