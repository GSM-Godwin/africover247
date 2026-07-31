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
  const logoScale = useRef(new Animated.Value(0.9)).current
  const lineWidth = useRef(new Animated.Value(0)).current
  const taglineOpacity = useRef(new Animated.Value(0)).current
  const poweredOpacity = useRef(new Animated.Value(0)).current
  const progressWidth = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(lineWidth, {
        toValue: width * 0.3,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(poweredOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(progressWidth, {
        toValue: width * 0.5,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.delay(300),
    ]).start(() => onFinish())
  }, [])

  return (
    <View style={styles.container}>

      {/* --- Top blue stripe --- */}
      <View style={styles.topStripe} />

      {/* --- Center --- */}
      <View style={styles.center}>

        {/* --- Logo --- */}
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

        {/* --- Animated divider line --- */}
        <Animated.View style={[styles.divider, { width: lineWidth }]} />

        {/* --- Tagline --- */}
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Protection, without the paperwork.
        </Animated.Text>

      </View>

      {/* --- Bottom --- */}
      <View style={styles.bottom}>
        <Animated.View style={[styles.poweredContainer, { opacity: poweredOpacity }]}>
          <Text style={styles.poweredBy}>Powered by</Text>
          <Text style={styles.companyName}>
            AfriGlobal Insurance Brokers Limited
          </Text>
          <Text style={styles.naicom}>NAICOM Licensed</Text>
        </Animated.View>

        {/* --- Progress bar --- */}
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
  topStripe: {
    width: '100%',
    height: 5,
    backgroundColor: Colors.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 320,
    height: 100,
    resizeMode: 'contain',
  },
  divider: {
    height: 2,
    backgroundColor: Colors.accent,
    borderRadius: 1,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  bottom: {
    alignItems: 'center',
    paddingBottom: 48,
    paddingHorizontal: 32,
    width: '100%',
  },
  poweredContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  poweredBy: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 3,
  },
  naicom: {
    fontSize: 11,
    color: Colors.textSecondary,
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
