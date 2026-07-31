import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native'
import { Colors } from '../constants'

const { width } = Dimensions.get('window')

interface SplashScreenProps {
  onFinish: () => void
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoOpacity = useRef(new Animated.Value(0)).current
  const logoScale = useRef(new Animated.Value(0.85)).current
  const taglineOpacity = useRef(new Animated.Value(0)).current
  const poweredOpacity = useRef(new Animated.Value(0)).current
  const progressWidth = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(poweredOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(progressWidth, {
        toValue: width * 0.5,
        duration: 1200,
        useNativeDriver: false,
      }),
      Animated.delay(200),
    ]).start(() => onFinish())
  }, [])

  return (
    <View style={styles.container}>

      <View style={styles.topAccent} />

      <View style={styles.center}>
        <Animated.View style={[
          styles.logoWrapper,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Protection, without the paperwork.
        </Animated.Text>
      </View>

      <View style={styles.bottom}>
        <Animated.View style={{ opacity: poweredOpacity, alignItems: 'center' }}>
          <Text style={styles.poweredBy}>Powered by</Text>
          <Text style={styles.companyName}>
            AfriGlobal Insurance Brokers Limited
          </Text>
          <Text style={styles.naicom}>NAICOM Licensed</Text>
        </Animated.View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topAccent: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 240,
    height: 80,
    resizeMode: 'contain',
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  bottom: {
    alignItems: 'center',
    paddingBottom: 48,
    paddingHorizontal: 32,
  },
  poweredBy: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  naicom: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  progressTrack: {
    width: width * 0.5,
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
})
