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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
})
