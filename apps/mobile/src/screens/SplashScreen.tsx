import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
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
      <View style={styles.topSection}>
        <View style={styles.circleTop} />
        <View style={styles.circleBottom} />

        <Animated.View style={[
          styles.logoWrapper,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}>
          <View style={styles.logoCard}>
            <Text style={styles.logoText}>AfriCover</Text>
            <Text style={styles.logoAccent}>247</Text>
          </View>
        </Animated.View>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Protection, without the paperwork.
        </Animated.Text>
      </View>

      <View style={styles.bottomSection}>
        <Animated.Text style={[styles.poweredBy, { opacity: poweredOpacity }]}>
          Powered by
        </Animated.Text>
        <Animated.Text style={[styles.companyName, { opacity: poweredOpacity }]}>
          AfriGlobal Insurance Brokers Limited
        </Animated.Text>
        <Animated.Text style={[styles.naicom, { opacity: poweredOpacity }]}>
          NAICOM Licensed · RC 123456
        </Animated.Text>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleTop: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circleBottom: {
    position: 'absolute',
    bottom: -60,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  logoWrapper: { alignItems: 'center' },
  logoCard: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -1,
  },
  logoAccent: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  bottomSection: {
    backgroundColor: Colors.white,
    paddingVertical: 28,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  poweredBy: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  naicom: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 20,
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
