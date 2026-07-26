import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { TOKEN_KEY, USER_KEY } from '../constants'
import type { User } from '../types'

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export async function getUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export async function setUser(user: User): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
}

export async function removeUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY)
}

export async function logout(): Promise<void> {
  await removeToken()
  await removeUser()
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken()
  return !!token
}
