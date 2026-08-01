import type { ComponentProps } from 'react'
import { Ionicons } from '@expo/vector-icons'

type IoniconName = ComponentProps<typeof Ionicons>['name']

export const CATEGORY_ICONS: Record<string, IoniconName> = {
  Motor: 'car-outline',
  Property: 'home-outline',
  Life: 'heart-outline',
  Health: 'medical-outline',
  Marine: 'boat-outline',
  Engineering: 'construct-outline',
  Financial: 'cash-outline',
  Liability: 'shield-outline',
  Agriculture: 'leaf-outline',
  Travel: 'airplane-outline',
}

export const CATEGORY_COLORS: Record<string, { bg: string; icon: string }> = {
  Motor: { bg: '#EFF6FF', icon: '#2563EB' },
  Property: { bg: '#FFFBEB', icon: '#D97706' },
  Life: { bg: '#FFF1F2', icon: '#E11D48' },
  Health: { bg: '#F0FDF4', icon: '#16A34A' },
  Marine: { bg: '#ECFEFF', icon: '#0891B2' },
  Engineering: { bg: '#FFF7ED', icon: '#EA580C' },
  Financial: { bg: '#ECFDF5', icon: '#059669' },
  Liability: { bg: '#EBF4FA', icon: '#15679b' },
  Agriculture: { bg: '#F7FEE7', icon: '#65A30D' },
  Travel: { bg: '#F5F3FF', icon: '#7C3AED' },
}

export function getCategoryIcon(category: string): IoniconName {
  return CATEGORY_ICONS[category] || 'shield-outline'
}

export function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] || { bg: '#F1F5F9', icon: '#5C6478' }
}
