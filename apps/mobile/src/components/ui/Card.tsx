import React from 'react'
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { Colors } from '../../constants'

interface CardProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  padding?: number
}

export function Card({ children, style, padding = 16 }: CardProps) {
  return (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    shadowColor: '#101A34',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
})
