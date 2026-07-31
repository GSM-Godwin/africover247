import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { HomeScreen } from '../screens/home/HomeScreen'
import { ClaimsScreen } from '../screens/claims/ClaimsScreen'
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen'
import { AccountScreen } from '../screens/account/AccountScreen'
import { ProductsStack } from './ProductsStack'
import { Colors } from '../constants'
import { useNotifications } from '../contexts/NotificationContext'

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
        color={focused ? Colors.accent : 'rgba(255,255,255,0.6)'}
      />
    </View>
  )
}

interface AppTabsProps {
  onLogout: () => void
}

export function AppTabs({ onLogout }: AppTabsProps) {
  const { unreadCount } = useNotifications()

  return (
    <TabNavigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
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
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'notifications' : 'notifications-outline'} focused={focused} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.error,
            fontSize: 10,
            minWidth: 16,
            height: 16,
            lineHeight: 16,
            color: Colors.white,
          },
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
    backgroundColor: Colors.primary,
    borderTopWidth: 0,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  iconContainer: {
    width: 40,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
})
