import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Button, Input } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'
import { getUser, setUser } from '../../services/auth'

export function EditProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [alternativePhone, setAlternativePhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (u) {
        setFirstName(u.firstName || '')
        setLastName(u.lastName || '')
        setPhone(u.phone || '')
        setEmail(u.email || '')
      }
      try {
        const res = await api.get('/users/me')
        setFirstName(res.data.firstName || '')
        setLastName(res.data.lastName || '')
        setPhone(res.data.phone || '')
        setAlternativePhone(res.data.alternativePhone || '')
        setEmail(res.data.email || '')
      } catch {}
    }
    load()
  }, [])

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.put('/users/me', {
        firstName,
        lastName,
        phone,
        alternativePhone,
      })
      await setUser(res.data)
      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not update profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >

        {/* --- Header --- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
          />
          <Input
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
          />
          <Input
            label="Email address"
            value={email}
            onChangeText={() => {}}
            placeholder="Email"
            editable={false}
          />
          <Text style={styles.emailNote}>
            Contact support to change your email address.
          </Text>
          <Input
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="08012345678"
            keyboardType="phone-pad"
          />
          <Input
            label="Alternative Phone (optional)"
            value={alternativePhone}
            onChangeText={setAlternativePhone}
            placeholder="08012345678"
            keyboardType="phone-pad"
          />

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            style={{ marginTop: 8 }}
          />

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  scroll: { padding: 20 },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: Colors.error, fontSize: 13 },
  emailNote: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: -10,
    marginBottom: 16,
    fontStyle: 'italic',
  },
})
