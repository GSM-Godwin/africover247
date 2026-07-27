import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'
import { getUser, logout } from '../../services/auth'
import type { User } from '../../types'

interface AccountScreenProps {
  navigation: any
  onLogout: () => void
}

interface MenuItem {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  sublabel?: string
  onPress: () => void
  danger?: boolean
}

export function AccountScreen({ navigation, onLogout }: AccountScreenProps) {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState({ policies: 0, claims: 0, quotes: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUser().then((u) => {
      setUser(u)
      setLoading(false)
    })

    Promise.all([
      api.get('/policies/my'),
      api.get('/claims/my'),
      api.get('/quotes/my'),
    ]).then(([policiesRes, claimsRes, quotesRes]) => {
      setStats({
        policies: policiesRes.data.length,
        claims: claimsRes.data.length,
        quotes: quotesRes.data.length,
      })
    }).catch(() => {})
  }, [])

  function handleLogout() {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout()
            onLogout()
          },
        },
      ]
    )
  }

  function getUserInitials(): string {
    if (!user) return '?'
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }

  const menuItems: MenuItem[] = [
    {
      icon: 'person-outline',
      label: 'Edit Profile',
      sublabel: 'Update your personal details',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      icon: 'lock-closed-outline',
      label: 'Change Password',
      sublabel: 'Update your password',
      onPress: () => navigation.navigate('ChangePassword'),
    },
    {
      icon: 'shield-outline',
      label: 'My Policies',
      sublabel: 'View all your active policies',
      onPress: () => navigation.navigate('Home'),
    },
    {
      icon: 'document-text-outline',
      label: 'My Claims',
      sublabel: 'Track your claim status',
      onPress: () => navigation.navigate('Claims'),
    },
    {
      icon: 'chatbubble-outline',
      label: 'My Quotes',
      sublabel: 'View and respond to quotes',
      onPress: () => navigation.navigate('Products', { screen: 'QuotesList' }),
    },
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      sublabel: 'View your notifications',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      sublabel: 'FAQs and contact AfriGlobal',
      onPress: () => navigation.navigate('Help'),
    },
    {
      icon: 'log-out-outline',
      label: 'Log Out',
      onPress: handleLogout,
      danger: true,
    },
  ]

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* --- Profile header --- */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getUserInitials()}</Text>
          </View>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {user?.emailVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.verifiedText}>Verified account</Text>
            </View>
          )}
        </View>

        {/* --- Stats row --- */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard} padding={12}>
            <Text style={styles.statValue}>{stats.policies}</Text>
            <Text style={styles.statLabel}>Policies</Text>
          </Card>
          <Card style={styles.statCard} padding={12}>
            <Text style={styles.statValue}>{stats.claims}</Text>
            <Text style={styles.statLabel}>Claims</Text>
          </Card>
          <Card style={styles.statCard} padding={12}>
            <Text style={styles.statValue}>{stats.quotes}</Text>
            <Text style={styles.statLabel}>Quotes</Text>
          </Card>
        </View>

        {/* --- Menu --- */}
        <Card style={styles.menuCard} padding={0}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && styles.menuItemBorder,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[
                styles.menuIcon,
                { backgroundColor: item.danger ? Colors.errorLight : Colors.primaryLight },
              ]}>
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={item.danger ? Colors.error : Colors.primary}
                />
              </View>
              <View style={styles.menuContent}>
                <Text style={[
                  styles.menuLabel,
                  item.danger && { color: Colors.error },
                ]}>
                  {item.label}
                </Text>
                {item.sublabel && (
                  <Text style={styles.menuSublabel}>{item.sublabel}</Text>
                )}
              </View>
              {!item.danger && (
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </Card>

        {/* --- Version --- */}
        <Text style={styles.version}>AfriCover247 v1.0.0</Text>
        <Text style={styles.versionSub}>AfriGlobal Insurance Brokers Limited</Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: Colors.white },
  userName: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  userEmail: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: { fontSize: 12, color: Colors.success, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  menuCard: { marginHorizontal: 20, marginBottom: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  menuSublabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  version: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
  versionSub: { fontSize: 11, color: Colors.textSecondary + '80', textAlign: 'center', marginTop: 2 },
})
