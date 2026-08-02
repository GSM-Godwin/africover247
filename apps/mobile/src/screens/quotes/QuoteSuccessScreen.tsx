import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '../../components/ui'
import { Colors } from '../../constants'

export function QuoteSuccessScreen({ route, navigation }: any) {
  const { productName } = route.params

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        </View>

        <Text style={styles.title}>Quote Request Submitted</Text>
        <Text style={styles.subtitle}>
          Your quote request for{' '}
          <Text style={styles.productName}>{productName}</Text>
          {' '}has been received.
        </Text>
        <Text style={styles.info}>
          AfriGlobal Insurance Brokers will review your details and respond within{' '}
          <Text style={{ fontWeight: '700' }}>3 business days</Text>.
          You will be notified when your quote is ready.
        </Text>

        <View style={styles.actions}>
          <Button
            title="Back to Products"
            onPress={() => navigation.navigate('ProductsList')}
          />
          <Button
            title="View My Quotes"
            onPress={() => navigation.navigate('QuotesList')}
            variant="outline"
            style={{ marginTop: 10 }}
          />
        </View>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  productName: { fontWeight: '700', color: Colors.text },
  info: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  actions: { width: '100%' },
})
