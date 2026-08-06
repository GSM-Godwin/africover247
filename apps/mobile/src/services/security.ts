import * as Device from 'expo-device'
import { Platform } from 'react-native'

export async function isDeviceRooted(): Promise<boolean> {
  if (Device.isDevice === false) return false

  if (Platform.OS === 'android') {
    const suspicious = [
      '/system/app/Superuser.apk',
      '/sbin/su',
      '/system/bin/su',
      '/system/xbin/su',
      '/data/local/xbin/su',
      '/data/local/bin/su',
      '/system/sd/xbin/su',
      '/system/bin/failsafe/su',
      '/data/local/su',
    ]
    const fs = await import('expo-file-system')
    for (const path of suspicious) {
      try {
        const info = await fs.getInfoAsync(path)
        if (info.exists) return true
      } catch {}
    }
    return false
  }

  if (Platform.OS === 'ios') {
    const fs = await import('expo-file-system')
    const suspicious = [
      '/Applications/Cydia.app',
      '/private/var/lib/apt/',
      '/private/var/stash',
      '/usr/sbin/sshd',
      '/bin/bash',
    ]
    for (const path of suspicious) {
      try {
        const info = await fs.getInfoAsync(path)
        if (info.exists) return true
      } catch {}
    }
    return false
  }

  return false
}
