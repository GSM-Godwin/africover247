import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.text}>AfriCover247</Text>
        <Text style={styles.sub}>App is working</Text>
      </View>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#15679b' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  sub: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
})
